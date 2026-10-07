<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    private const CACHE_TTL_SECONDS = 86400;

    // Kebijakan penggunaan Nominatim membatasi maksimal ~1 request/detik.
    private const MIN_INTERVAL_MS = 1100;

    // Jumlah hasil yang dikirim ke UI.
    private const RESULT_LIMIT = 5;

    // Setengah lebar kotak bias di sekitar pin (derajat, ~33 km). Hasil di dalam kotak
    // DIDAHULUKAN, bukan dibatasi (bounded=0) - meniru Google Maps yang memprioritaskan
    // tempat di sekitar pengguna tanpa menyembunyikan yang jauh (#188).
    private const BIAS_HALF_SPAN_DEG = 0.3;

    // Kandidat yang diambil saat mencari ulang tanpa kata terakhir: lebih banyak dari
    // RESULT_LIMIT karena masih akan disaring dengan awalan kata itu.
    private const CANDIDATE_LIMIT = 10;

    // Header berisi query hasil koreksi ejaan (rawurlencode). Respons tetap array polos
    // supaya 7 halaman pemakai endpoint ini tidak berubah; yang mau menampilkan
    // "Menampilkan hasil untuk ..." cukup membaca header ini.
    public const CORRECTED_HEADER = 'X-Geocode-Corrected-Query';

    // Kata umum alamat yang tak pernah dikoreksi: bukan nama tempat, dan mengoreksinya
    // ("gang" -> "gangga") justru merusak query yang benar.
    private const NON_PLACE_WORDS = [
        'jalan', 'gang', 'raya', 'banjar', 'desa', 'kelurahan', 'kecamatan', 'kabupaten',
        'kota', 'dusun', 'lingkungan', 'nomor', 'pura', 'pasar', 'pantai', 'sekolah',
    ];

    public function reverse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        // Dibulatkan supaya titik GPS yang berdekatan memakai entri cache yang sama.
        $lat = round((float) $validated['lat'], 5);
        $lng = round((float) $validated['lng'], 5);

        $data = Cache::remember("nominatim:reverse:{$lat}:{$lng}", self::CACHE_TTL_SECONDS, function () use ($lat, $lng) {
            return $this->callNominatim('/reverse', [
                'format' => 'json',
                'lat' => $lat,
                'lon' => $lng,
                'addressdetails' => 1,
                'accept-language' => 'id',
            ]);
        });

        return response()->json($data);
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'required|string|min:3|max:255',
            // Titik pin saat ini (opsional) - pusat bias hasil.
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
        ]);

        $query = $this->normalizeStreetAbbreviations($validated['q']);
        $viewbox = $this->biasViewbox($validated['lat'] ?? null, $validated['lng'] ?? null);

        $results = $this->searchNominatim($query, self::RESULT_LIMIT, $viewbox);

        // Nominatim mencocokkan KATA UTUH, bukan awalan: mengetik "gema mer" bernilai 0
        // hasil padahal "gema merdeka" ketemu. Operator yang terbiasa Google Maps (yang
        // mencocokkan awalan) akan menyimpulkan datanya memang tidak ada, lalu berhenti.
        // Jadi saat nihil DAN masih ada kata di depannya, ulangi TANPA kata terakhir lalu
        // saring sendiri memakai kata itu sebagai awalan. Query yang dipendekkan itu
        // hampir selalu sudah ada di cache (dilewati saat mengetik), sehingga umumnya
        // TIDAK menambah panggilan ke Nominatim.
        if ($results === [] && str_contains($query, ' ')) {
            $results = $this->searchByPrefixOfLastWord($query, $viewbox);
        }

        // Jalan di OSM tak selalu bernama "Jalan X" - sebagian hanya "X" (mis. "Gatot
        // Subroto" di Negara). Masih nihil → coba sekali lagi tanpa kata "Jalan".
        if ($results === [] && preg_match('/^Jalan\s+(.+)$/u', $query, $m)) {
            $results = $this->searchNominatim($m[1], self::RESULT_LIMIT, $viewbox);
        }

        // Masih nihil -> mungkin salah ketik. Nominatim tak punya toleransi typo sama sekali
        // ("wngiri", "snur", "tbanan" = 0 hasil, ejaan benarnya ketemu; diuji 2026-10-07),
        // sedangkan Google Maps mengoreksi ejaan diam-diam. Koreksinya memakai kamus nama
        // wilayah milik kita sendiri (laravolt + master banjar) - lihat correctSpelling().
        $corrected = null;
        if ($results === []) {
            $candidate = $this->correctSpelling($query);

            if ($candidate !== null) {
                $results = $this->searchNominatim($candidate, self::RESULT_LIMIT, $viewbox);
                $corrected = $results !== [] ? $candidate : null;
            }
        }

        $response = response()->json($this->tenantCityFirst($results));

        return $corrected !== null
            ? $response->header(self::CORRECTED_HEADER, rawurlencode($corrected))
            : $response;
    }

    /**
     * Ganti tiap kata yang TIDAK dikenal kamus dengan nama wilayah terdekat, atau null bila
     * tak ada yang perlu/bisa dikoreksi. Kamusnya nama desa, kecamatan, kabupaten, dan
     * banjar di provinsi tenant - persis nama yang paling sering diketik pelapor dan
     * paling sering salah ketik (mis. "wngiri" -> "Wanagiri", "pemcutan" -> "Pemecutan").
     *
     * Kata dianggap cocok bila huruf PERTAMANYA sama (salah ketik di huruf pertama jarang
     * terjadi dan, kalau dibolehkan, "gatot" bisa menjadi "batot") dan salah satu:
     *  - jarak Damerau-Levenshtein <= 1 (kata 4-7 huruf) atau <= 2 (kata >= 8 huruf);
     *  - hanya huruf vokalnya yang hilang ("tbanan" -> "tabanan", "klungkng" -> "klungkung"),
     *    gaya ketik singkat yang lazim di ponsel. Kata 3 huruf HANYA lewat aturan ini.
     * Kata yang sudah ada di kamus, berangka, terlalu pendek, atau kata umum alamat
     * (NON_PLACE_WORDS) dibiarkan.
     */
    private function correctSpelling(string $query): ?string
    {
        $dictionary = $this->placeWordDictionary();

        if ($dictionary === []) {
            return null;
        }

        $changed = false;
        $words = preg_split('/\s+/u', $query, -1, PREG_SPLIT_NO_EMPTY);

        foreach ($words as $i => $word) {
            $lower = mb_strtolower($word);

            if (mb_strlen($lower) < 3
                || preg_match('/\d/u', $lower)
                || in_array($lower, self::NON_PLACE_WORDS, true)
                || isset($dictionary[$lower])) {
                continue;
            }

            $best = $this->closestDictionaryWord($lower, $dictionary);

            if ($best !== null) {
                $words[$i] = mb_convert_case($best, MB_CASE_TITLE);
                $changed = true;
            }
        }

        return $changed ? implode(' ', $words) : null;
    }

    /**
     * @param  array<string, true>  $dictionary
     */
    private function closestDictionaryWord(string $word, array $dictionary): ?string
    {
        // Jarak 2 hanya untuk kata panjang: pada kata 5-7 huruf jarak 2 sudah menyeberang ke
        // nama lain ("bonjol" -> "bonyoh", "bedugul" -> "bedulu").
        // Kata 3 huruf hanya boleh lewat aturan "vokal hilang" ("ubd" -> "ubud"): jarak 1
        // pada kata sependek itu menyeberang ke mana saja ("dua" -> "duda").
        $maxEdits = match (true) {
            mb_strlen($word) >= 8 => 2,
            mb_strlen($word) >= 4 => 1,
            default => 0,
        };
        $skeleton = $this->consonantSkeleton($word);
        $first = mb_substr($word, 0, 1);
        $best = null;
        $bestScore = PHP_INT_MAX;

        foreach (array_keys($dictionary) as $candidate) {
            $candidate = (string) $candidate;

            if (mb_substr($candidate, 0, 1) !== $first) {
                continue;
            }

            $distance = $this->damerauLevenshtein($word, $candidate);
            // "Vokal hilang" = kata yang diketik lebih pendek DAN hurufnya urut di dalam
            // kandidat. Tanpa syarat itu kerangka konsonan saja membuat "teuku" -> "tek".
            $vowelsOnly = $skeleton !== ''
                && mb_strlen($candidate) > mb_strlen($word)
                && $this->consonantSkeleton($candidate) === $skeleton
                && $this->isSubsequence($word, $candidate);

            if ($distance > $maxEdits && ! $vowelsOnly) {
                continue;
            }

            // Kandidat yang cuma beda vokal didahulukan: itu pola salah ketik paling umum,
            // dan tanpanya "wngiri" (jarak 2) bisa kalah dari nama acak berjarak 2 lainnya.
            // Seri diputus urutan abjad supaya hasilnya deterministik (dan bisa di-cache).
            $score = $distance * 2 - ($vowelsOnly ? 1 : 0);

            if ($score < $bestScore || ($score === $bestScore && strcmp($candidate, (string) $best) < 0)) {
                $best = $candidate;
                $bestScore = $score;
            }
        }

        return $best;
    }

    private function consonantSkeleton(string $word): string
    {
        return (string) preg_replace('/[aiueo]/u', '', $word);
    }

    private function isSubsequence(string $needle, string $haystack): bool
    {
        $needle = mb_str_split($needle);
        $i = 0;

        foreach (mb_str_split($haystack) as $char) {
            if ($i < count($needle) && $needle[$i] === $char) {
                $i++;
            }
        }

        return $i === count($needle);
    }

    /** Jarak Damerau-Levenshtein (versi optimal string alignment). */
    private function damerauLevenshtein(string $a, string $b): int
    {
        $a = mb_str_split($a);
        $b = mb_str_split($b);
        $la = count($a);
        $lb = count($b);
        $d = [];

        for ($i = 0; $i <= $la; $i++) {
            $d[$i][0] = $i;
        }
        for ($j = 0; $j <= $lb; $j++) {
            $d[0][$j] = $j;
        }

        for ($i = 1; $i <= $la; $i++) {
            for ($j = 1; $j <= $lb; $j++) {
                $cost = $a[$i - 1] === $b[$j - 1] ? 0 : 1;
                $d[$i][$j] = min($d[$i - 1][$j] + 1, $d[$i][$j - 1] + 1, $d[$i - 1][$j - 1] + $cost);

                if ($i > 1 && $j > 1 && $a[$i - 1] === $b[$j - 2] && $a[$i - 2] === $b[$j - 1]) {
                    $d[$i][$j] = min($d[$i][$j], $d[$i - 2][$j - 2] + 1);
                }
            }
        }

        return $d[$la][$lb];
    }

    /**
     * Kata-kata nama wilayah di provinsi tenant, huruf kecil, sebagai kunci array (lookup
     * O(1)). Di-cache sehari: data laravolt praktis tak berubah, dan banjar baru cukup
     * ikut keesokan harinya.
     *
     * Banjar dibaca lewat DB::table (tanpa scope Tenantable) dengan alasan yang sama seperti
     * Banjar::optionsForVillage(): pencarian ini dipakai warga, dan yang diambil HANYA nama
     * untuk dikirim ulang ke Nominatim - tak ada baris banjar yang keluar ke klien.
     *
     * @return array<string, true>
     */
    private function placeWordDictionary(): array
    {
        $tenant = currentTenant();
        $province = (string) ($tenant->province_code ?: substr((string) $tenant->city_code, 0, 2));

        if ($province === '') {
            return [];
        }

        return Cache::remember("geocode:place-words:{$province}", self::CACHE_TTL_SECONDS, function () use ($province) {
            $names = DB::table('indonesia_cities')->where('code', 'like', $province.'%')->pluck('name')
                ->merge(DB::table('indonesia_districts')->where('code', 'like', $province.'%')->pluck('name'))
                ->merge(DB::table('indonesia_villages')->where('code', 'like', $province.'%')->pluck('name'))
                ->merge(DB::table('banjars')->whereNull('deleted_at')->where('province_code', $province)->pluck('name'));

            $words = [];
            foreach ($names as $name) {
                foreach (preg_split('/[^\p{L}]+/u', mb_strtolower((string) $name), -1, PREG_SPLIT_NO_EMPTY) as $word) {
                    if (mb_strlen($word) >= 3 && ! in_array($word, self::NON_PLACE_WORDS, true)) {
                        $words[$word] = true;
                    }
                }
            }

            return $words;
        });
    }

    /**
     * Hasil di kabupaten/kota tenant naik ke atas, urutan relatif lainnya dipertahankan.
     * Nama desa kembar lazim di Bali (dua "Wanagiri": Buleleng & Jembrana); tanpa GPS
     * (halaman admin fasilitas, pelapor yang menolak izin lokasi) yang di wilayah sendiri
     * hampir pasti yang dimaksud. Pelapor ber-GPS tetap diurutkan jarak di klien.
     */
    private function tenantCityFirst(array $results): array
    {
        if (count($results) < 2) {
            return $results;
        }

        $city = mb_strtolower(trim((string) preg_replace(
            '/^(kabupaten|kota)\s+/iu',
            '',
            (string) DB::table('indonesia_cities')->where('code', currentTenant()->city_code)->value('name')
        )));

        if ($city === '') {
            return $results;
        }

        $inCity = fn ($row) => is_array($row) && str_contains(mb_strtolower((string) ($row['display_name'] ?? '')), $city);

        return array_merge(
            array_values(array_filter($results, $inCity)),
            array_values(array_filter($results, fn ($row) => ! $inCity($row)))
        );
    }

    /**
     * Seragamkan singkatan jalan/gang ke bentuk lengkap yang dipakai OSM. Nominatim tidak
     * mengenali singkatan Indonesia: "jln. teuku umar" = 0 hasil dan "jl teuku umar" yang
     * keluar duluan "Rukan Teuku Umar", sementara "jalan teuku umar" langsung ketemu
     * (diuji ke nominatim.openstreetmap.org, 2026-10-07, #188). Google Maps memahami
     * ketiganya, jadi operator mengira datanya tidak ada.
     */
    private function normalizeStreetAbbreviations(string $query): string
    {
        $query = preg_replace(
            ['/(?<![\p{L}\p{N}])(?:jalan|jln|jl)(?:\.\s*|\s+|$)/iu', '/(?<![\p{L}\p{N}])gg(?:\.\s*|\s+|$)/iu'],
            ['Jalan ', 'Gang '],
            $query
        );

        return trim(preg_replace('/\s+/u', ' ', $query));
    }

    /**
     * Kotak "left,top,right,bottom" di sekitar pin, atau null bila pin tak dikirim. Pusatnya
     * dibulatkan 1 desimal (~11 km) supaya pin yang digeser sedikit tetap memakai entri
     * cache yang sama.
     */
    private function biasViewbox(mixed $lat, mixed $lng): ?string
    {
        if ($lat === null || $lng === null) {
            return null;
        }

        $lat = round((float) $lat, 1);
        $lng = round((float) $lng, 1);
        $d = self::BIAS_HALF_SPAN_DEG;

        return implode(',', [$lng - $d, $lat + $d, $lng + $d, $lat - $d]);
    }

    /**
     * Cari ulang tanpa kata terakhir (yang diasumsikan belum selesai diketik), lalu saring
     * hasilnya dengan kata itu sebagai awalan — meniru perilaku "ketik separuh" Google Maps.
     */
    private function searchByPrefixOfLastWord(string $query, ?string $viewbox = null): array
    {
        $words = preg_split('/\s+/', $query, -1, PREG_SPLIT_NO_EMPTY);
        $prefix = mb_strtolower((string) array_pop($words));
        $head = implode(' ', $words);

        if ($head === '' || $prefix === '') {
            return [];
        }

        $candidates = $this->searchNominatim($head, self::CANDIDATE_LIMIT, $viewbox);

        $matched = array_values(array_filter(
            $candidates,
            fn ($row) => is_array($row) && $this->hasWordStartingWith((string) ($row['display_name'] ?? ''), $prefix)
        ));

        // Tidak ada yang cocok dengan awalan itu → kembalikan kandidatnya apa adanya.
        // Hasil yang relevan sebagian jauh lebih berguna bagi operator yang sedang
        // mengangkat telepon daripada layar nol hasil.
        return array_slice($matched !== [] ? $matched : $candidates, 0, self::RESULT_LIMIT);
    }

    private function hasWordStartingWith(string $displayName, string $prefix): bool
    {
        foreach (preg_split('/[\s,]+/', mb_strtolower($displayName), -1, PREG_SPLIT_NO_EMPTY) as $word) {
            if (str_starts_with($word, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function searchNominatim(string $query, int $limit, ?string $viewbox = null): array
    {
        return Cache::remember(
            'nominatim:search:'.$limit.':'.md5(mb_strtolower($query).'|'.$viewbox),
            self::CACHE_TTL_SECONDS,
            fn () => $this->callNominatim('/search', array_filter([
                'format' => 'json',
                'q' => $query,
                'limit' => $limit,
                'accept-language' => 'id',
                'viewbox' => $viewbox,
            ]))
        );
    }

    /**
     * Nominatim requires an identifying User-Agent and caps usage at ~1 request/second
     * for the public instance. Cache::lock serializes every outgoing call app-wide
     * (not just per-browser) so many concurrent users can't collectively exceed that
     * limit, and the stored timestamp tracks when the last call actually went out.
     */
    private function callNominatim(string $path, array $query): array
    {
        $baseUrl = config('services.nominatim.base_url');
        $userAgent = config('services.nominatim.user_agent');

        return Cache::lock('nominatim:throttle-lock', 10)->block(10, function () use ($baseUrl, $userAgent, $path, $query) {
            $lastCallAtMs = Cache::get('nominatim:last-call-at-ms');
            $nowMs = (int) (microtime(true) * 1000);

            if ($lastCallAtMs !== null && ($nowMs - $lastCallAtMs) < self::MIN_INTERVAL_MS) {
                usleep((self::MIN_INTERVAL_MS - ($nowMs - $lastCallAtMs)) * 1000);
            }

            $response = Http::withHeaders(['User-Agent' => $userAgent])
                ->timeout(8)
                ->get($baseUrl.$path, $query);

            Cache::put('nominatim:last-call-at-ms', (int) (microtime(true) * 1000), 60);

            if ($response->failed()) {
                abort(502, 'Layanan pencarian lokasi sedang tidak tersedia, silakan isi alamat secara manual.');
            }

            return $response->json() ?? [];
        });
    }
}

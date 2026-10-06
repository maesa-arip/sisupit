<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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

        return response()->json($results);
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

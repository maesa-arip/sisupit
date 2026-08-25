<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\GeocodeController;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

// Perbaiki kode desa fasilitas yang tidak ada di tabel referensi wilayah (FINDINGS #78).
//
// Seeder fasilitas (Hydrant/Pompa/PosPemadam) menuliskan kode desa hasil karangan — bentuknya
// benar 10 digit, tapi barisnya tidak pernah ada di `indonesia_villages`. Akibatnya rekap air
// per desa di /admin/pumps memberi judul berupa angka, dan rekap/penyaringan apa pun yang
// bersandar pada kode desa ikut meleset tanpa gejala.
//
// Desa ditentukan ulang dari KOORDINAT fasilitas, dengan dua cara berurutan:
//   1. reverse-geocode ke Nominatim (jalurnya lewat GeocodeController agar cache 24 jam &
//      penguncian ~1 req/detik tetap satu-satunya pintu ke Nominatim), lalu nama desa dari peta
//      dicocokkan ke `indonesia_villages` di kabupaten/kota fasilitas itu. Ini yang paling
//      akurat: OSM tahu batas wilayah, jadi titik di pinggir desa tetap terbaca benar;
//   2. bila Nominatim tak bisa dihubungi atau namanya tak cocok, dipakai desa dengan centroid
//      terdekat (kolom `meta` tabel `indonesia_villages`). Centroid HANYA sebuah titik, jadi
//      cara ini bisa salah untuk fasilitas di perbatasan — usulannya diberi tanda "centroid"
//      supaya diperiksa manusia sebelum ditulis.
//
// Pencarian sengaja se-KABUPATEN, bukan se-kecamatan, karena `district_code` seeder pun banyak
// yang salah; kalau kecamatannya ikut berubah, kolomnya diperbarui sekalian agar rantai kode
// tetap konsisten dengan aturan awalan BPS (lihat App\Traits\ResolvesFacilityJurisdiction).
//
// Dua hal yang SENGAJA tidak dilakukan:
//   - tanpa --apply tidak ada satu baris pun yang ditulis (default = tinjau dulu);
//   - kode desa yang TERDAFTAR tidak pernah ditimpa, sekalipun peta menyebut desa lain. Yang
//     begitu hanya DILAPORKAN — data yang sah, meski mungkin keliru, bukan urusan perintah
//     pembersih kode rusak. Operator yang MEMANG ingin menyerahkannya ke peta (mis. setelah
//     memeriksa daftar laporannya) menambahkan --include-mismatch; centroid tidak pernah ikut
//     di jalur ini, karena menimpa data sah dengan tebakan titik-tengah jelas lebih buruk
//     daripada membiarkannya.
//
// Query-nya memakai DB::table (bukan Eloquent) agar lepas dari global scope `Tenantable`:
// perintah ini dijalankan operator server tanpa sesi login, dan memang harus melihat seluruh
// kabupaten yang ada di database.
class FixFacilityVillageCodes extends Command
{
    protected $signature = 'sisupit:fix-facility-village-codes
        {--apply : tulis perubahan ke database (tanpa opsi ini hanya menampilkan usulan)}
        {--offline : jangan panggil Nominatim, langsung pakai centroid desa terdekat}
        {--include-mismatch : ikut memperbaiki kode desa yang TERDAFTAR tapi menurut peta salah desa}
        {--tolerance=1.5 : selisih jarak (km) sebelum kode desa terdaftar dilaporkan mencurigakan (hanya dipakai saat tanpa peta)}';

    protected $description = 'Perbaiki kode desa fasilitas (pompa, hydrant, hydrant warga, pos pemadam) yang tidak ada di tabel wilayah';

    /** Tabel fasilitas yang menyimpan kode wilayah + label untuk tabel keluaran. */
    private const TABLES = [
        'pompas' => 'Pompa/SKKL',
        'hydrant_wargas' => 'Hydrant warga',
        'hydrants' => 'Hydrant',
        'pos_pemadams' => 'Pos pemadam',
    ];

    /** Cache centroid desa per kabupaten/kota, supaya tabel wilayah dibaca sekali per kota. */
    private array $villagesByCity = [];

    /** Nama kecamatan per kabupaten/kota, untuk memilah desa bernama sama. */
    private array $districtsByCity = [];

    /** Nominatim mati/tak terjangkau — sekali gagal, sisa barisnya langsung memakai centroid. */
    private bool $mapUnavailable = false;

    public function handle(): int
    {
        if (! DB::table('indonesia_villages')->exists()) {
            $this->error('Tabel indonesia_villages kosong — jalankan `php artisan indonesia:install` dulu.');

            return self::FAILURE;
        }

        $this->mapUnavailable = (bool) $this->option('offline');
        $tolerance = (float) $this->option('tolerance');

        $fixable = [];    // kode desa tak dikenal + ada usulannya
        $stuck = [];      // kode desa tak dikenal tapi tak bisa diusulkan
        $suspicious = []; // kode desa terdaftar tapi tempatnya meragukan — laporan saja

        foreach (self::TABLES as $table => $label) {
            foreach (DB::table($table)->orderBy('id')->get() as $row) {
                // Baris tanpa kode desa sama sekali dilewati: rekap sudah menyebutnya
                // "Tanpa data desa" dengan jujur, dan mengisikan desa yang belum pernah
                // didata bukan lagi memperbaiki kode rusak — itu menambah data baru.
                if (! $row->village_code) {
                    continue;
                }

                $known = DB::table('indonesia_villages')
                    ->where('code', $row->village_code)
                    ->first(['code', 'name', 'district_code']);

                $mapped = $this->villageFromMap($row);

                if (! $known) {
                    $proposal = $mapped ?? $this->nearestVillage($row);

                    if (! $proposal) {
                        $stuck[] = [$label, $row->id, $row->name, $row->village_code, $this->reasonNoProposal($row)];

                        continue;
                    }

                    $fixable[] = [
                        'table' => $table,
                        'label' => $label,
                        'id' => $row->id,
                        'name' => $row->name,
                        'old' => $row->village_code,
                        'village' => $proposal['village'],
                        'source' => $proposal['source'],
                        'distance' => $proposal['distance'],
                        'district_changed' => $row->district_code !== $proposal['village']->district_code,
                    ];

                    continue;
                }

                // Kode terdaftar: hanya diperiksa, kecuali operator memang meminta peta yang
                // menentukan (--include-mismatch).
                if ($mapped && $mapped['village']->code !== $known->code) {
                    if ($this->option('include-mismatch')) {
                        $fixable[] = [
                            'table' => $table,
                            'label' => $label,
                            'id' => $row->id,
                            'name' => $row->name,
                            'old' => $row->village_code.' '.$known->name,
                            'village' => $mapped['village'],
                            'source' => 'peta',
                            'distance' => $mapped['distance'],
                            'district_changed' => $row->district_code !== $mapped['village']->district_code,
                        ];

                        continue;
                    }

                    $suspicious[] = [$label, $row->id, $row->name, $known->name, $mapped['village']->name.' (peta)'];

                    continue;
                }

                if (! $mapped && ! $this->option('offline')) {
                    continue; // peta memang tak menjawab titik ini — jangan menuduh lewat centroid.
                }

                $nearest = $this->nearestVillage($row);
                $stored = $this->distanceToVillage($row, $known);

                if ($nearest && $stored !== null && $stored - $nearest['distance'] > $tolerance) {
                    $suspicious[] = [
                        $label,
                        $row->id,
                        $row->name,
                        $known->name.' ('.round($stored, 1).' km)',
                        $nearest['village']->name.' ('.round($nearest['distance'], 1).' km, centroid)',
                    ];
                }
            }
        }

        $this->reportFixable($fixable);
        $this->reportStuck($stuck);
        $this->reportSuspicious($suspicious);

        if ($fixable === []) {
            $this->info('Tidak ada kode desa tak dikenal yang bisa diperbaiki.');

            return self::SUCCESS;
        }

        if (! $this->option('apply')) {
            $this->newLine();
            $this->warn('Belum ada yang ditulis. Jalankan ulang dengan --apply setelah daftar di atas Anda setujui.');

            return self::SUCCESS;
        }

        foreach ($fixable as $item) {
            $village = $item['village'];

            DB::table($item['table'])->where('id', $item['id'])->update([
                'village_code' => $village->code,
                'district_code' => $village->district_code,
                'city_code' => substr($village->district_code, 0, 4),
                'province_code' => substr($village->district_code, 0, 2),
                'updated_at' => now(),
            ]);
        }

        $this->newLine();
        $this->info(count($fixable).' baris diperbarui.');

        return self::SUCCESS;
    }

    /**
     * Desa menurut PETA: titik fasilitas di-reverse-geocode, lalu nama desa/kelurahan dari OSM
     * dicocokkan ke tabel wilayah. Perbandingannya dinormalkan (huruf kecil, tanpa spasi &
     * tanda baca) karena ejaan kedua sumber sering berbeda spasi — "PADANG SAMBIAN KAJA" di
     * tabel wilayah vs "Padangsambian Kaja" di OSM adalah desa yang sama.
     */
    private function villageFromMap(object $row): ?array
    {
        $address = $this->reverseGeocode($row);

        if (! $address || ! $row->city_code) {
            return null;
        }

        $wanted = array_map(
            fn ($name) => $this->normalize($name),
            array_filter([$address['village'] ?? null, $address['suburb'] ?? null, $address['hamlet'] ?? null])
        );

        if ($wanted === []) {
            return null;
        }

        $candidates = array_values(array_filter(
            $this->villagesOf($row->city_code),
            fn ($village) => in_array($this->normalize($village->name), $wanted, true)
        ));

        // Satu kabupaten bisa punya beberapa desa bernama mirip (Dangin Puri di Denpasar Timur
        // vs Dangin Puri Kaja/Kauh/Kangin di Denpasar Utara), jadi nama kecamatan dari peta
        // dipakai sebagai pemilah bila kandidatnya lebih dari satu.
        if (count($candidates) > 1) {
            $districtNames = array_map(
                fn ($name) => $this->normalize($name),
                array_filter([$address['town'] ?? null, $address['city_district'] ?? null, $address['municipality'] ?? null])
            );

            $districts = $this->districtsOf($row->city_code);

            $narrowed = array_values(array_filter(
                $candidates,
                fn ($village) => in_array($this->normalize($districts[$village->district_code] ?? ''), $districtNames, true)
            ));

            if (count($narrowed) === 1) {
                $candidates = $narrowed;
            }
        }

        if (count($candidates) !== 1) {
            return null;
        }

        return [
            'village' => $candidates[0],
            'source' => 'peta',
            'distance' => $this->distanceToVillage($row, $candidates[0]),
        ];
    }

    /**
     * Reverse-geocode lewat GeocodeController — bukan Http::get langsung — supaya cache 24 jam
     * dan penguncian ~1 request/detik milik controller itu tetap satu-satunya pintu ke
     * Nominatim (lihat CLAUDE.md). Kegagalan apa pun mematikan jalur peta untuk sisa barisnya.
     */
    private function reverseGeocode(object $row): ?array
    {
        if ($this->mapUnavailable || is_null($row->lat) || is_null($row->lng)) {
            return null;
        }

        try {
            $response = app(GeocodeController::class)->reverse(
                Request::create('/api/geocode/reverse', 'GET', ['lat' => $row->lat, 'lng' => $row->lng])
            );

            return $response->getData(true)['address'] ?? null;
        } catch (Throwable $e) {
            $this->mapUnavailable = true;
            $this->warn('Nominatim tidak terjangkau ('.$e->getMessage().') — sisa barisnya memakai centroid desa terdekat.');

            return null;
        }
    }

    /** Desa dengan centroid terdekat di dalam kabupaten/kota fasilitas; null bila tak bisa dihitung. */
    private function nearestVillage(object $row): ?array
    {
        if (! $row->city_code || is_null($row->lat) || is_null($row->lng)) {
            return null;
        }

        $best = null;

        foreach ($this->villagesOf($row->city_code) as $village) {
            $distance = $this->distanceToVillage($row, $village);

            if ($distance !== null && ($best === null || $distance < $best['distance'])) {
                $best = ['village' => $village, 'source' => 'centroid', 'distance' => $distance];
            }
        }

        return $best;
    }

    private function villagesOf(string $cityCode): array
    {
        return $this->villagesByCity[$cityCode] ??= DB::table('indonesia_villages as v')
            ->join('indonesia_districts as d', 'd.code', '=', 'v.district_code')
            ->where('d.city_code', $cityCode)
            ->get(['v.code', 'v.name', 'v.district_code', 'v.meta'])
            ->all();
    }

    private function districtsOf(string $cityCode): array
    {
        return $this->districtsByCity[$cityCode] ??= DB::table('indonesia_districts')
            ->where('city_code', $cityCode)
            ->pluck('name', 'code')
            ->all();
    }

    private function distanceToVillage(object $row, object $village): ?float
    {
        if (is_null($row->lat) || is_null($row->lng)) {
            return null;
        }

        // Centroid desa disimpan di kolom `meta` sebagai JSON {lat, long, pos}; sebagian desa
        // tidak punya isi meta sama sekali, jadi kandidat itu dilewati begitu saja.
        $meta = json_decode($village->meta ?? '', true);

        if (! isset($meta['lat'], $meta['long'])) {
            return null;
        }

        return $this->haversine((float) $row->lat, (float) $row->lng, (float) $meta['lat'], (float) $meta['long']);
    }

    /** Jarak dua titik di permukaan bumi (km). */
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 6371 * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function normalize(?string $name): string
    {
        return preg_replace('/[^a-z0-9]/', '', strtolower((string) $name));
    }

    private function reasonNoProposal(object $row): string
    {
        if (! $row->city_code) {
            return 'kolom kabupaten/kota kosong';
        }

        if (is_null($row->lat) || is_null($row->lng)) {
            return 'titik koordinat kosong';
        }

        return 'tidak ada desa bercentroid di kabupaten/kota itu';
    }

    private function reportFixable(array $fixable): void
    {
        if ($fixable === []) {
            return;
        }

        $this->line('Kode desa TIDAK DIKENAL — usulan penggantinya, ditentukan dari titik fasilitas:');

        $this->table(
            ['Modul', 'ID', 'Nama', 'Kode lama', 'Usulan', 'Sumber', 'Jarak ke centroid', 'Kecamatan'],
            array_map(fn (array $item) => [
                $item['label'],
                $item['id'],
                $item['name'],
                $item['old'],
                $item['village']->code.' '.$item['village']->name,
                $item['source'],
                $item['distance'] === null ? '—' : number_format($item['distance'], 2).' km',
                $item['district_changed'] ? 'ikut diperbaiki' : 'tetap',
            ], $fixable)
        );

        $guessed = array_filter($fixable, fn (array $item) => $item['source'] === 'centroid');

        if ($guessed !== []) {
            $this->warn(count($guessed).' usulan berasal dari centroid (peta tidak menjawab) — periksa di peta dulu sebelum --apply.');
        }
    }

    private function reportStuck(array $stuck): void
    {
        if ($stuck === []) {
            return;
        }

        $this->newLine();
        $this->line('Kode desa tidak dikenal dan TIDAK BISA diusulkan otomatis (perbaiki lewat form fasilitas):');
        $this->table(['Modul', 'ID', 'Nama', 'Kode lama', 'Sebab'], $stuck);
    }

    private function reportSuspicious(array $suspicious): void
    {
        if ($suspicious === []) {
            return;
        }

        $this->newLine();
        $this->line('Kode desa terdaftar tapi titiknya menunjuk desa lain — TIDAK diubah, hanya dilaporkan:');
        $this->table(['Modul', 'ID', 'Nama', 'Desa tersimpan', 'Desa menurut titiknya'], $suspicious);
        $this->comment('Tambahkan --include-mismatch bila daftar ini memang ingin diserahkan ke peta.');
    }
}

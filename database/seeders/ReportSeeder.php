<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

// Regenerasi laporan darurat area KOTA DENPASAR.
//  - Semua laporan lama di-SOFT DELETE lebih dulu (baris tetap ada, deleted_at terisi,
//    bisa di-restore). Baris turunan (petugas/relawan/jejak/dispatch/foto) dibersihkan
//    agar tidak jadi data yatim di peta. Tabel users TIDAK disentuh.
//  - Tiap laporan yang sudah 'handling'/'resolved' WAJIB punya petugas + relawan, plus
//    JALUR pergerakan menuju TKP yang MENGIKUTI JALAN ASLI (OSRM lokal), bukan garis lurus.
//    Bila OSRM tak tersedia, otomatis fallback ke interpolasi garis lurus.
class ReportSeeder extends Seeder
{
    public function run(): void
    {
        // =====================================================================
        // 0. BERSIHKAN LAPORAN LAMA (soft delete) + data turunannya
        // =====================================================================
        $this->purgeExistingReports();

        // Ambil User berdasarkan Role (dibuat di UserTenantSeeder). Users TIDAK diubah.
        $wargaList = User::role(['warga', 'masyarakat'])->get();
        $relawanAll = User::role('relawan')->get();
        $petugasAll = User::role('petugas')->get();

        if ($wargaList->isEmpty() || $relawanAll->isEmpty() || $petugasAll->isEmpty()) {
            $this->command->error('Pastikan menjalankan UserTenantSeeder terlebih dahulu!');

            return;
        }

        // Utamakan responder ber-yurisdiksi Kota Denpasar (city_code 5171); fallback ke semua.
        $denpasarWarga = $wargaList->where('city_code', '5171')->values();
        $denpasarWarga = $denpasarWarga->isNotEmpty() ? $denpasarWarga : $wargaList;
        // Responder WAJIB ber-yurisdiksi Kota Denpasar (city_code 5171). SENGAJA tanpa fallback
        // ke kota lain: relawan/petugas luar Denpasar tak akan pernah bisa merespons insiden
        // Denpasar lewat alur normal (takeAction cek withinReportJurisdiction), jadi menaruh
        // mereka di seed = state mustahil. Bila pool kosong → surface sebagai setup error.
        $denpasarRelawan = $relawanAll->where('city_code', '5171')->values();
        $denpasarPetugas = $petugasAll->where('city_code', '5171')->values();
        if ($denpasarRelawan->isEmpty() || $denpasarPetugas->isEmpty()) {
            $this->command->error('Tidak ada relawan/petugas Kota Denpasar (city_code 5171). Jalankan UserTenantSeeder dulu.');

            return;
        }

        $incidentTypes = [
            'Kebakaran Pemukiman', 'Pohon Tumbang', 'Evakuasi Hewan Liar',
            'Korsleting Listrik Ruko', 'Kecelakaan Lalu Lintas', 'Sarang Tawon Vespa',
            'Truk Terbakar', 'Evakuasi Kucing di Atap', 'Banjir Genangan Lokal', 'Kebakaran Alang-alang',
        ];

        $descriptionSnippets = [
            'Api membesar cepat, warga sekitar sudah dievakuasi.',
            'Asap tebal terlihat dari kejauhan, akses jalan sempit.',
            'Korban terjebak di dalam, mohon unit segera dikerahkan.',
            'Kobaran merambat ke bangunan sebelah, angin kencang.',
            'Situasi mulai terkendali namun masih butuh bantuan.',
            'Warga panik, sumber air terdekat cukup jauh dari lokasi.',
        ];

        // =====================================================================
        // TITIK JANGKAR KELURAHAN KOTA DENPASAR (kode + centroid dari data laravolt)
        // =====================================================================
        $landAnchors = $this->denpasarAnchors();

        $total = 22;
        for ($i = 1; $i <= $total; $i++) {
            $warga = $denpasarWarga->random();
            $title = $incidentTypes[array_rand($incidentTypes)];
            $anchor = $landAnchors[array_rand($landAnchors)];

            // Jitter ~330 m dari centroid kelurahan.
            $lat = $anchor['lat'] + (rand(-30, 30) / 10000);
            $lng = $anchor['lng'] + (rand(-30, 30) / 10000);

            // Mayoritas 'handling' agar peta penuh jalur; sisanya resolved & sedikit baru.
            $statusPool = [
                'TERLAPOR',
                'pending', 'pending',
                'handling', 'handling', 'handling', 'handling', 'handling', 'handling',
                'resolved', 'resolved', 'resolved',
            ];
            $status = $statusPool[array_rand($statusPool)];

            $createdAt = match ($status) {
                'handling' => Carbon::now()->subMinutes(rand(5, 90)),
                'resolved' => Carbon::now()->subDays(rand(1, 10))->subHours(rand(1, 20)),
                default => Carbon::now()->subMinutes(rand(10, 300)),
            };

            $report = Report::create([
                'user_id' => $warga->id,
                'name' => $warga->name,
                'phone' => $warga->phone,
                'title' => $title.' di '.$anchor['name'],
                'description' => 'Mohon segera dibantu. Kondisi darurat. '.$descriptionSnippets[array_rand($descriptionSnippets)],
                'lat' => $lat,
                'lng' => $lng,
                'province_code' => '51',
                'city_code' => '5171',
                'district_code' => $anchor['district_code'],
                'village_code' => $anchor['village_code'],
                'address' => $anchor['name'].', '.$anchor['district_name'].', Kota Denpasar, Bali',
                'status' => $status,
                'created_at' => $createdAt,
                'updated_at' => $status === 'resolved' ? $createdAt->copy()->addHours(3) : $createdAt,
            ]);

            // Hanya laporan yang sudah ditangani yang punya responder + jalur.
            if (! in_array($status, ['handling', 'resolved'])) {
                continue;
            }

            // Utamakan responder yang BENAR-BENAR berwenang atas laporan ini (aturan yang sama
            // dengan takeAction: withinReportJurisdiction). Bila tak ada yang cocok pada level
            // spesifiknya (mis. tak ada relawan terdaftar di kelurahan insiden), fallback ke pool
            // Kota Denpasar — dengan arrive berbasis KEANGGOTAAN, responder yang sudah commit tetap
            // bisa menuntaskan misinya tanpa 403.
            $eligiblePetugas = $denpasarPetugas->filter(fn ($u) => $u->withinReportJurisdiction($report))->values();
            $eligibleRelawan = $denpasarRelawan->filter(fn ($u) => $u->withinReportJurisdiction($report))->values();
            $assignedPetugas = ($eligiblePetugas->isNotEmpty() ? $eligiblePetugas : $denpasarPetugas)->shuffle()->take(rand(1, 2));
            $assignedRelawan = ($eligibleRelawan->isNotEmpty() ? $eligibleRelawan : $denpasarRelawan)->shuffle()->take(rand(2, 4));

            foreach ($assignedPetugas as $petugas) {
                $this->assignResponder($report, $petugas, 'petugas', $status, $createdAt, false);
            }

            $relawanIndex = 0;
            foreach ($assignedRelawan as $relawan) {
                // Saat 'handling', paksa 2 relawan pertama masih MELUNCUR (jalur menuju TKP terlihat).
                $forceEnRoute = ($status === 'handling' && $relawanIndex < 2);
                $this->assignResponder($report, $relawan, 'relawan', $status, $createdAt, $forceEnRoute);
                $relawanIndex++;
            }
        }

        $this->command->info("✅ ReportSeeder: {$total} laporan Kota Denpasar dibuat, laporan tertangani punya petugas + relawan + jalur rute jalan asli.");
    }

    /**
     * Soft delete semua laporan lama + bersihkan baris turunannya.
     * Tanpa auth user, global scope Tenantable tidak memfilter, jadi ->delete() menyapu
     * seluruh laporan (dan tetap soft delete karena model memakai SoftDeletes).
     */
    private function purgeExistingReports(): void
    {
        foreach (['report_officers', 'report_helpers', 'tracking_logs', 'report_units', 'report_photos'] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->delete();
            }
        }

        $removed = Report::query()->delete();
        $this->command->info("🧹 {$removed} laporan lama di-soft-delete, data turunan dibersihkan.");
    }

    /**
     * Buat manifes penugasan + jalur pergerakan (tracking_logs) satu responder menuju TKP.
     * Jalur mengikuti jalan asli via OSRM lokal; fallback garis lurus bila OSRM mati.
     */
    private function assignResponder(Report $report, User $user, string $type, string $reportStatus, Carbon $reportCreatedAt, bool $forceEnRoute): void
    {
        $table = $type === 'petugas' ? 'report_officers' : 'report_helpers';
        $timeColumn = $type === 'petugas' ? 'dispatched_at' : 'started_at';

        $isFinished = ($reportStatus === 'resolved');
        if ($isFinished) {
            $userStatus = 'finished';
        } elseif ($forceEnRoute) {
            $userStatus = 'en_route';
        } else {
            $userStatus = rand(0, 1) ? 'arrived' : 'en_route';
        }

        // Titik awal acak 2–5 km dari TKP, lalu rute jalan asli ke TKP (di-resample 25 titik).
        $bearing = rand(0, 359);
        $radiusKm = rand(20, 50) / 10;
        [$startLat, $startLng] = $this->destinationPoint((float) $report->lat, (float) $report->lng, $bearing, $radiusKm);
        $coords = $this->resample($this->fetchRoute($startLat, $startLng, (float) $report->lat, (float) $report->lng), 25);

        $lastIndex = count($coords) - 1;
        // Responder yang masih meluncur berhenti di tengah jalan; yang sudah tiba di TKP.
        $k = $userStatus === 'en_route' ? (int) round((rand(35, 70) / 100) * $lastIndex) : $lastIndex;
        [$curLat, $curLng] = $coords[$k];

        $dispatchedAt = $reportCreatedAt->copy()->addMinutes(rand(1, 5));
        $arrivedAt = in_array($userStatus, ['arrived', 'finished']) ? $dispatchedAt->copy()->addMinutes(rand(10, 30)) : null;
        $finishedAt = $isFinished ? $arrivedAt->copy()->addMinutes(rand(30, 120)) : null;

        DB::table($table)->insert([
            'report_id' => $report->id,
            'user_id' => $user->id,
            'status' => $userStatus,
            'location_lat' => $curLat,
            'location_lng' => $curLng,
            $timeColumn => $dispatchedAt,
            'arrived_at' => $arrivedAt,
            'finished_at' => $finishedAt,
            'created_at' => $dispatchedAt,
            'updated_at' => $finishedAt ?? $arrivedAt ?? $dispatchedAt,
        ]);

        // Jejak (jalur) dari titik awal sampai posisi terkini.
        $rows = [];
        for ($step = 0; $step <= $k; $step++) {
            $logTime = $dispatchedAt->copy()->addMinutes($step * 2);
            $rows[] = [
                'report_id' => $report->id,
                'user_id' => $user->id,
                'user_type' => $type,
                'lat' => $coords[$step][0],
                'lng' => $coords[$step][1],
                'recorded_at' => $logTime,
                'created_at' => $logTime,
                'updated_at' => $logTime,
            ];
        }
        DB::table('tracking_logs')->insert($rows);
    }

    /**
     * Ambil geometri rute jalan asli dari OSRM lokal. Fallback interpolasi garis lurus
     * bila OSRM tak tersedia agar seeder tetap jalan offline.
     */
    private function fetchRoute(float $fromLat, float $fromLng, float $toLat, float $toLng): array
    {
        $baseUrl = rtrim(config('services.osrm.base_url'), '/');

        try {
            $response = Http::withHeaders(['User-Agent' => config('services.osrm.user_agent')])
                ->timeout(8)
                ->get("{$baseUrl}/route/v1/driving/{$fromLng},{$fromLat};{$toLng},{$toLat}", [
                    'overview' => 'full',
                    'geometries' => 'geojson',
                ]);

            if ($response->ok()) {
                $coords = $response->json('routes.0.geometry.coordinates');
                if (is_array($coords) && count($coords) >= 2) {
                    // GeoJSON [lng,lat] -> [lat,lng]
                    return array_map(fn ($c) => [(float) $c[1], (float) $c[0]], $coords);
                }
            }
        } catch (\Throwable $e) {
            // Diamkan: pakai garis lurus di bawah.
        }

        $n = 20;
        $coords = [];
        for ($i = 0; $i <= $n; $i++) {
            $t = $i / $n;
            $coords[] = [$fromLat + ($toLat - $fromLat) * $t, $fromLng + ($toLng - $fromLng) * $t];
        }

        return $coords;
    }

    /** Resample polyline ke N titik dengan jarak indeks merata (selalu sertakan titik akhir). */
    private function resample(array $coords, int $n): array
    {
        $count = count($coords);
        if ($count <= $n) {
            return $coords;
        }

        $out = [];
        for ($i = 0; $i < $n; $i++) {
            $idx = (int) round($i / ($n - 1) * ($count - 1));
            $out[] = $coords[$idx];
        }

        return $out;
    }

    /** Titik tujuan dari (lat,lng) sejauh distanceKm pada bearing tertentu (derajat). */
    private function destinationPoint(float $lat, float $lng, float $bearingDeg, float $distanceKm): array
    {
        $R = 6371.0;
        $bearing = deg2rad($bearingDeg);
        $latR = deg2rad($lat);
        $lngR = deg2rad($lng);
        $angular = $distanceKm / $R;

        $lat2 = asin(sin($latR) * cos($angular) + cos($latR) * sin($angular) * cos($bearing));
        $lng2 = $lngR + atan2(
            sin($bearing) * sin($angular) * cos($latR),
            cos($angular) - sin($latR) * sin($lat2)
        );

        return [rad2deg($lat2), rad2deg($lng2)];
    }

    /**
     * Titik jangkar kelurahan Kota Denpasar (kode BPS + centroid dari indonesia_villages).
     * Menjamin lat/lng konsisten dengan district_code & village_code laporan.
     */
    private function denpasarAnchors(): array
    {
        return [
            // Denpasar Selatan (517101)
            ['name' => 'Pemogan', 'district_name' => 'Denpasar Selatan', 'district_code' => '517101', 'village_code' => '5171012008', 'lat' => -8.713750, 'lng' => 115.196847],
            ['name' => 'Sesetan', 'district_name' => 'Denpasar Selatan', 'district_code' => '517101', 'village_code' => '5171011003', 'lat' => -8.701563, 'lng' => 115.220488],
            ['name' => 'Sanur', 'district_name' => 'Denpasar Selatan', 'district_code' => '517101', 'village_code' => '5171011006', 'lat' => -8.693220, 'lng' => 115.260039],
            ['name' => 'Renon', 'district_name' => 'Denpasar Selatan', 'district_code' => '517101', 'village_code' => '5171011005', 'lat' => -8.684526, 'lng' => 115.239808],
            ['name' => 'Panjer', 'district_name' => 'Denpasar Selatan', 'district_code' => '517101', 'village_code' => '5171011004', 'lat' => -8.683240, 'lng' => 115.226758],
            ['name' => 'Sidakarya', 'district_name' => 'Denpasar Selatan', 'district_code' => '517101', 'village_code' => '5171012007', 'lat' => -8.705589, 'lng' => 115.234323],
            // Denpasar Timur (517102)
            ['name' => 'Kesiman', 'district_name' => 'Denpasar Timur', 'district_code' => '517102', 'village_code' => '5171021003', 'lat' => -8.657053, 'lng' => 115.245165],
            ['name' => 'Sumerta', 'district_name' => 'Denpasar Timur', 'district_code' => '517102', 'village_code' => '5171021006', 'lat' => -8.651969, 'lng' => 115.236631],
            ['name' => 'Dangin Puri', 'district_name' => 'Denpasar Timur', 'district_code' => '517102', 'village_code' => '5171021010', 'lat' => -8.656875, 'lng' => 115.220787],
            ['name' => 'Penatih', 'district_name' => 'Denpasar Timur', 'district_code' => '517102', 'village_code' => '5171021014', 'lat' => -8.617233, 'lng' => 115.237102],
            // Denpasar Barat (517103)
            ['name' => 'Dauh Puri', 'district_name' => 'Denpasar Barat', 'district_code' => '517103', 'village_code' => '5171031005', 'lat' => -8.664825, 'lng' => 115.217016],
            ['name' => 'Pemecutan', 'district_name' => 'Denpasar Barat', 'district_code' => '517103', 'village_code' => '5171031007', 'lat' => -8.657617, 'lng' => 115.205761],
            ['name' => 'Padangsambian', 'district_name' => 'Denpasar Barat', 'district_code' => '517103', 'village_code' => '5171031010', 'lat' => -8.654911, 'lng' => 115.188238],
            ['name' => 'Dauh Puri Kauh', 'district_name' => 'Denpasar Barat', 'district_code' => '517103', 'village_code' => '5171032003', 'lat' => -8.678592, 'lng' => 115.203124],
            // Denpasar Utara (517104)
            ['name' => 'Tonja', 'district_name' => 'Denpasar Utara', 'district_code' => '517104', 'village_code' => '5171041004', 'lat' => -8.632498, 'lng' => 115.225759],
            ['name' => 'Ubung', 'district_name' => 'Denpasar Utara', 'district_code' => '517104', 'village_code' => '5171041007', 'lat' => -8.632888, 'lng' => 115.199546],
            ['name' => 'Peguyangan', 'district_name' => 'Denpasar Utara', 'district_code' => '517104', 'village_code' => '5171041009', 'lat' => -8.621807, 'lng' => 115.212449],
            ['name' => 'Dauh Puri Kaja', 'district_name' => 'Denpasar Utara', 'district_code' => '517104', 'village_code' => '5171042006', 'lat' => -8.642183, 'lng' => 115.213203],
        ];
    }
}

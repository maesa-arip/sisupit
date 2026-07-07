<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

// Seeder laporan yang SUDAH SELESAI (status 'resolved') di Kota Denpasar.
// Berbeda dari ReportSeeder: seeder ini ADITIF (tidak menghapus laporan lain) dan semua
// laporannya tuntas — tiap responder (petugas+relawan) sudah 'finished' dengan JALUR penuh
// mengikuti jalan asli (OSRM lokal) sampai TKP. Pakai untuk demo riwayat/insiden selesai.
//   php artisan db:seed --class=ResolvedReportSeeder
class ResolvedReportSeeder extends Seeder
{
    public function run(): void
    {
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
        $denpasarRelawan = $relawanAll->where('city_code', '5171')->values();
        $denpasarRelawan = $denpasarRelawan->isNotEmpty() ? $denpasarRelawan : $relawanAll;
        $denpasarPetugas = $petugasAll->where('city_code', '5171')->values();
        $denpasarPetugas = $denpasarPetugas->isNotEmpty() ? $denpasarPetugas : $petugasAll;

        $incidentTypes = [
            'Kebakaran Pemukiman', 'Pohon Tumbang', 'Evakuasi Hewan Liar',
            'Korsleting Listrik Ruko', 'Kecelakaan Lalu Lintas', 'Sarang Tawon Vespa',
            'Truk Terbakar', 'Evakuasi Kucing di Atap', 'Banjir Genangan Lokal', 'Kebakaran Alang-alang',
        ];

        $closingSnippets = [
            'Api berhasil dipadamkan, tidak ada korban jiwa.',
            'Evakuasi tuntas, lokasi sudah diamankan petugas.',
            'Penanganan selesai, warga kembali beraktivitas normal.',
            'Sumber bahaya dinetralkan, area dinyatakan aman.',
            'Tim menutup insiden setelah pendinginan menyeluruh.',
        ];

        $landAnchors = $this->denpasarAnchors();

        $total = 10;
        for ($i = 1; $i <= $total; $i++) {
            $warga = $denpasarWarga->random();
            $title = $incidentTypes[array_rand($incidentTypes)];
            $anchor = $landAnchors[array_rand($landAnchors)];

            $lat = $anchor['lat'] + (rand(-30, 30) / 10000);
            $lng = $anchor['lng'] + (rand(-30, 30) / 10000);

            // Insiden selesai beberapa hari lalu; ditutup beberapa jam setelah dilaporkan.
            $createdAt = Carbon::now()->subDays(rand(1, 21))->subHours(rand(1, 20));
            $resolvedAt = $createdAt->copy()->addHours(rand(2, 6));

            $report = Report::create([
                'user_id' => $warga->id,
                'name' => $warga->name,
                'phone' => $warga->phone,
                'title' => $title.' di '.$anchor['name'],
                'description' => 'Insiden telah ditangani dan dinyatakan selesai. '.$closingSnippets[array_rand($closingSnippets)],
                'lat' => $lat,
                'lng' => $lng,
                'province_code' => '51',
                'city_code' => '5171',
                'district_code' => $anchor['district_code'],
                'village_code' => $anchor['village_code'],
                'address' => $anchor['name'].', '.$anchor['district_name'].', Kota Denpasar, Bali',
                'status' => 'resolved',
                'created_at' => $createdAt,
                'updated_at' => $resolvedAt,
            ]);

            $assignedPetugas = $denpasarPetugas->shuffle()->take(rand(1, 2));
            $assignedRelawan = $denpasarRelawan->shuffle()->take(rand(2, 4));

            foreach ($assignedPetugas as $petugas) {
                $this->assignFinishedResponder($report, $petugas, 'petugas', $createdAt);
            }
            foreach ($assignedRelawan as $relawan) {
                $this->assignFinishedResponder($report, $relawan, 'relawan', $createdAt);
            }
        }

        $this->command->info("✅ ResolvedReportSeeder: {$total} laporan SELESAI (resolved) Kota Denpasar dibuat, tiap responder tuntas dengan jalur rute jalan asli sampai TKP.");
    }

    /**
     * Manifes penugasan + jalur PENUH satu responder yang sudah 'finished' sampai TKP.
     * Jalur mengikuti jalan asli via OSRM lokal; fallback garis lurus bila OSRM mati.
     */
    private function assignFinishedResponder(Report $report, User $user, string $type, Carbon $reportCreatedAt): void
    {
        $table = $type === 'petugas' ? 'report_officers' : 'report_helpers';
        $timeColumn = $type === 'petugas' ? 'dispatched_at' : 'started_at';

        $bearing = rand(0, 359);
        $radiusKm = rand(20, 50) / 10;
        [$startLat, $startLng] = $this->destinationPoint((float) $report->lat, (float) $report->lng, $bearing, $radiusKm);
        $coords = $this->resample($this->fetchRoute($startLat, $startLng, (float) $report->lat, (float) $report->lng), 25);

        $lastIndex = count($coords) - 1;
        [$curLat, $curLng] = $coords[$lastIndex];

        $dispatchedAt = $reportCreatedAt->copy()->addMinutes(rand(1, 5));
        $arrivedAt = $dispatchedAt->copy()->addMinutes(rand(10, 30));
        $finishedAt = $arrivedAt->copy()->addMinutes(rand(30, 120));

        DB::table($table)->insert([
            'report_id' => $report->id,
            'user_id' => $user->id,
            'status' => 'finished',
            'location_lat' => $curLat,
            'location_lng' => $curLng,
            $timeColumn => $dispatchedAt,
            'arrived_at' => $arrivedAt,
            'finished_at' => $finishedAt,
            'created_at' => $dispatchedAt,
            'updated_at' => $finishedAt,
        ]);

        $rows = [];
        for ($step = 0; $step <= $lastIndex; $step++) {
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

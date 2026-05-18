<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Faker\Factory as Faker;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('id_ID');

        // Ambil User berdasarkan Role yang sudah dibuat di UserTenantSeeder
        $wargaList = User::role(['warga', 'masyarakat'])->get();
        $relawanList = User::role('relawan')->get();
        $petugasList = User::role('petugas')->get();

        if ($wargaList->isEmpty() || $relawanList->isEmpty() || $petugasList->isEmpty()) {
            $this->command->error('Pastikan menjalankan UserTenantSeeder terlebih dahulu!');
            return;
        }

        $incidentTypes = [
            'Kebakaran Pemukiman', 'Pohon Tumbang', 'Evakuasi Hewan Liar', 
            'Korsleting Listrik Ruko', 'Kecelakaan Lalu Lintas', 'Sarang Tawon Vespa',
            'Truk Terbakar', 'Evakuasi Kucing di Atap', 'Banjir Genangan Lokal', 'Kebakaran Alang-alang'
        ];

        // =========================================================================
        // TITIK JANGKAR DARATAN + KODE BPS LENGKAP SAMPAI DESA
        // =========================================================================
        $landAnchors = [
            // KOTA DENPASAR (5171)
            // Denpasar Selatan (517101)
            ['name' => 'Pemogan', 'lat' => -8.7118, 'lng' => 115.2016, 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006'],
            ['name' => 'Sesetan', 'lat' => -8.7001, 'lng' => 115.2104, 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012002'],
            ['name' => 'Sanur',   'lat' => -8.6946, 'lng' => 115.2525, 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011003'],
            ['name' => 'Renon',   'lat' => -8.6791, 'lng' => 115.2381, 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012008'],
            // Denpasar Barat (517102)
            ['name' => 'Padangsambian', 'lat' => -8.6617, 'lng' => 115.1878, 'city_code' => '5171', 'district_code' => '517102', 'village_code' => '5171021004'],

            // KABUPATEN BADUNG (5103)
            // Kecamatan Kuta (510301)
            ['name' => 'Kuta',    'lat' => -8.7263, 'lng' => 115.1766, 'city_code' => '5103', 'district_code' => '510301', 'village_code' => '5103011001'],
            ['name' => 'Tuban',   'lat' => -8.7431, 'lng' => 115.1743, 'city_code' => '5103', 'district_code' => '510301', 'village_code' => '5103011002'],
            ['name' => 'Legian',  'lat' => -8.7051, 'lng' => 115.1758, 'city_code' => '5103', 'district_code' => '510301', 'village_code' => '5103011003'],
            ['name' => 'Seminyak','lat' => -8.6908, 'lng' => 115.1681, 'city_code' => '5103', 'district_code' => '510301', 'village_code' => '5103011004'],
            // Kecamatan Kuta Utara (510302)
            ['name' => 'Canggu',  'lat' => -8.6409, 'lng' => 115.1484, 'city_code' => '5103', 'district_code' => '510302', 'village_code' => '5103022003'],
            // Kecamatan Kuta Selatan (510305)
            ['name' => 'Jimbaran','lat' => -8.7903, 'lng' => 115.1783, 'city_code' => '5103', 'district_code' => '510305', 'village_code' => '5103051001'],
        ];

        for ($i = 1; $i <= 30; $i++) {
            $warga = $wargaList->random();
            $title = $faker->randomElement($incidentTypes);
            
            // 1. Pilih 1 Titik Jangkar secara acak (Lengkap dengan data Desa)
            $anchor = $faker->randomElement($landAnchors);
            
            // 2. Tambahkan Jitter (Offset acak ~500 meter)
            $latOffset = (rand(-50, 50) / 10000);
            $lngOffset = (rand(-50, 50) / 10000);

            $lat = $anchor['lat'] + $latOffset;
            $lng = $anchor['lng'] + $lngOffset;
            
            // Status Distribusi (Sedikit TERLAPOR, banyak yg resolved)
            $status = $faker->randomElement(['TERLAPOR', 'pending', 'handling', 'handling', 'resolved', 'resolved', 'resolved']);
            $createdAt = Carbon::now()->subDays(rand(0, 14))->subHours(rand(1, 24));

            // 👇 MASUKKAN DATA LENGKAP SAMPAI VILLAGE_CODE 👇
            $report = Report::create([
                'user_id'       => $warga->id,
                'name'          => $warga->name,
                'phone'         => $warga->phone,
                'title'         => $title . ' di ' . $anchor['name'],
                'description'   => "Mohon segera dibantu. Kondisi darurat. " . $faker->realText(50),
                'lat'           => $lat,
                'lng'           => $lng,
                'province_code' => '51',
                'city_code'     => $anchor['city_code'],
                'district_code' => $anchor['district_code'],
                'village_code'  => $anchor['village_code'],
                'address'       => $faker->address . ', Bali',
                'status'        => $status,
                'created_at'    => $createdAt,
                'updated_at'    => $status == 'resolved' ? $createdAt->copy()->addHours(2) : $createdAt,
            ]);

            // ============================================================================
            // LOGIKA KONSISTENSI: Jika Handling / Resolved, WAJIB ada Petugas & Relawan
            // ============================================================================
            if (in_array($status, ['handling', 'resolved'])) {
                
                $assignedPetugas = $petugasList->random(rand(1, 2));
                $assignedRelawan = $relawanList->random(rand(1, 3));

                // Eksekusi Penugasan & Tracking Log untuk PETUGAS
                foreach ($assignedPetugas as $petugas) {
                    $this->createAssignmentAndTracking($report, $petugas, 'report_officers', $status, $createdAt);
                }

                // Eksekusi Penugasan & Tracking Log untuk RELAWAN
                foreach ($assignedRelawan as $relawan) {
                    $this->createAssignmentAndTracking($report, $relawan, 'report_helpers', $status, $createdAt);
                }
            }
        }

        $this->command->info('✅ ReportSeeder: Berhasil men-generate 30 Laporan Daratan lengkap sampai Tingkat Desa/Kelurahan.');
    }

    /**
     * Fungsi Helper untuk membuat Manifes Penugasan sekaligus mensimulasikan pergerakan Tracking di Darat.
     */
    private function createAssignmentAndTracking($report, $user, $tableName, $reportStatus, $reportCreatedAt)
    {
        $isFinished = ($reportStatus === 'resolved');
        $isArrived = $isFinished || rand(0, 1); 
        
        $userStatus = $isFinished ? 'finished' : ($isArrived ? 'arrived' : 'en_route');

        $dispatchedAt = $reportCreatedAt->copy()->addMinutes(rand(1, 5));
        $arrivedAt = in_array($userStatus, ['arrived', 'finished']) ? $dispatchedAt->copy()->addMinutes(rand(10, 30)) : null;
        $finishedAt = $isFinished ? $arrivedAt->copy()->addMinutes(rand(30, 120)) : null;

        DB::table($tableName)->insert([
            'report_id'    => $report->id,
            'user_id'      => $user->id,
            'status'       => $userStatus,
            'location_lat' => in_array($userStatus, ['arrived', 'finished']) ? $report->lat : $report->lat + (rand(-10, 10) / 10000),
            'location_lng' => in_array($userStatus, ['arrived', 'finished']) ? $report->lng : $report->lng + (rand(-10, 10) / 10000),
            $tableName === 'report_officers' ? 'dispatched_at' : 'started_at' => $dispatchedAt,
            'arrived_at'   => $arrivedAt,
            'finished_at'  => $finishedAt,
            'created_at'   => $dispatchedAt,
            'updated_at'   => $finishedAt ?? ($arrivedAt ?? $dispatchedAt),
        ]);

        $userType = $tableName === 'report_officers' ? 'petugas' : 'relawan';

        // 3. Simulasikan Perjalanan (Tracking Logs) dari titik 1km - 2km saja agar tidak kena laut
        $trackLatOffset = (rand(100, 200) / 10000) * (rand(0, 1) ? 1 : -1);
        $trackLngOffset = (rand(100, 200) / 10000) * (rand(0, 1) ? 1 : -1);

        $startLat = $report->lat + $trackLatOffset; 
        $startLng = $report->lng + $trackLngOffset;
        
        $steps = 5;
        $latStep = ($report->lat - $startLat) / $steps;
        $lngStep = ($report->lng - $startLng) / $steps;

        for ($step = 1; $step <= $steps; $step++) {
            
            if ($userStatus === 'en_route' && $step == $steps) break;

            $logTime = $dispatchedAt->copy()->addMinutes($step * 2);

            DB::table('tracking_logs')->insert([
                'report_id'   => $report->id,
                'user_id'     => $user->id,
                'user_type'   => $userType,
                'lat'         => $startLat + ($latStep * $step),
                'lng'         => $startLng + ($lngStep * $step),
                'recorded_at' => $logTime,
                'created_at'  => $logTime,
                'updated_at'  => $logTime,
            ]);
        }
    }
}
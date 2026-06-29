<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        // 1. PASTIKAN ROLE EXIST
        $roles = ['warga', 'relawan', 'petugas'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // 2. BUAT USER DUMMY (Jika belum ada)
        $warga = User::firstOrCreate(
            ['email' => 'warga@sisupit.com'],
            ['name' => 'Bli Warga',  'username' => 'warga', 'phone' => '08111111111', 'password' => Hash::make('password')]
        );
        $warga->assignRole('warga');

        $relawan = User::firstOrCreate(
            ['email' => 'relawan@sisupit.com'],
            ['name' => 'Gung Relawan', 'username' => 'relawan', 'phone' => '08222222222', 'password' => Hash::make('password')]
        );
        $relawan->assignRole('relawan');

        $petugas = User::firstOrCreate(
            ['email' => 'petugas@sisupit.com'],
            ['name' => 'Komandan Petugas', 'username' => 'petugas', 'phone' => '08333333333', 'password' => Hash::make('password')]
        );
        $petugas->assignRole('petugas');

        // 3. DAFTAR 10 LOKASI REALISTIS (Denpasar & Badung)
        $incidents = [
            // SANUR (Denpasar Selatan)
            ['title' => 'Kebakaran Dapur Warga', 'address' => 'Jl. Danau Tamblingan, Sanur', 'lat' => -8.6946, 'lng' => 115.2625, 'status' => 'handling'],
            // PEMOGAN (Denpasar Selatan)
            ['title' => 'Pohon Tumbang Tutup Jalan', 'address' => 'Jl. Raya Pemogan', 'lat' => -8.7118, 'lng' => 115.2016, 'status' => 'pending'],
            // KUTA (Badung)
            ['title' => 'Korsleting Listrik Ruko', 'address' => 'Jl. Pantai Kuta, Badung', 'lat' => -8.7263, 'lng' => 115.1706, 'status' => 'handling'],
            // RENON (Denpasar Selatan)
            ['title' => 'Evakuasi Ular Piton', 'address' => 'Jl. Tukad Musi, Renon', 'lat' => -8.6791, 'lng' => 115.2381, 'status' => 'resolved'],
            // SESETAN (Denpasar Selatan)
            ['title' => 'Sarang Tawon Vespa', 'address' => 'Jl. Raya Sesetan', 'lat' => -8.7001, 'lng' => 115.2104, 'status' => 'TERLAPOR'],
            // JIMBARAN (Badung)
            ['title' => 'Kebakaran Alang-alang', 'address' => 'Bukit Jimbaran', 'lat' => -8.7903, 'lng' => 115.1683, 'status' => 'handling'],
            // LEGIAN (Badung)
            ['title' => 'Truk Terbakar', 'address' => 'Jl. Legian', 'lat' => -8.7051, 'lng' => 115.1738, 'status' => 'resolved'],
            // CANGGU (Badung)
            ['title' => 'Evakuasi Kucing di Atap', 'address' => 'Jl. Batu Bolong, Canggu', 'lat' => -8.6409, 'lng' => 115.1384, 'status' => 'TERLAPOR'],
            // SEMINYAK (Badung)
            ['title' => 'Pohon Tumbang Timpa Mobil', 'address' => 'Jl. Kayu Aya, Seminyak', 'lat' => -8.6908, 'lng' => 115.1651, 'status' => 'pending'],
            // PADANGSAMBIAN (Denpasar Barat)
            ['title' => 'Kebakaran Gudang', 'address' => 'Jl. Gunung Agung, Padangsambian', 'lat' => -8.6617, 'lng' => 115.1878, 'status' => 'handling'],
        ];

        // 4. EKSEKUSI SEEDING
        foreach ($incidents as $index => $loc) {

            // Simulasikan waktu kejadian (agar history tidak sama semua jamnya)
            $createdAt = Carbon::now()->subHours(rand(1, 48))->subMinutes(rand(1, 60));

            $report = Report::create([
                'user_id' => $warga->id,
                'name' => $warga->name,
                'phone' => $warga->phone,
                'title' => $loc['title'],
                'description' => 'Mohon segera dibantu, kondisi darurat di lokasi.',
                'lat' => $loc['lat'],
                'lng' => $loc['lng'],
                'province_code' => '51', // Bali
                'city_code' => str_contains($loc['address'], 'Badung') || in_array($loc['title'], ['Korsleting Listrik Ruko', 'Kebakaran Alang-alang', 'Truk Terbakar', 'Evakuasi Kucing di Atap', 'Pohon Tumbang Timpa Mobil']) ? '5103' : '5171', // 5103=Badung, 5171=Denpasar
                'address' => $loc['address'],
                'status' => $loc['status'],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            // JIKA STATUS 'handling' (Sedang Ditangani) -> Relawan & Petugas Sedang di Jalan
            if ($loc['status'] === 'handling') {
                // Petugas (Agak jauh dari lokasi, offset ~500 meter)
                DB::table('report_officers')->insert([
                    'report_id' => $report->id,
                    'user_id' => $petugas->id,
                    'status' => 'en_route',
                    'location_lat' => $loc['lat'] + 0.0050,
                    'location_lng' => $loc['lng'] - 0.0030,
                    'dispatched_at' => $createdAt->copy()->addMinutes(2),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Relawan (Sudah sangat dekat dengan lokasi)
                DB::table('report_helpers')->insert([
                    'report_id' => $report->id,
                    'user_id' => $relawan->id,
                    'status' => 'arrived',
                    'location_lat' => $loc['lat'] + 0.0005,
                    'location_lng' => $loc['lng'] + 0.0002,
                    'started_at' => $createdAt->copy()->addMinutes(1),
                    'arrived_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // JIKA STATUS 'resolved' (Selesai) -> Semua Waktu Terisi Penuh
            if ($loc['status'] === 'resolved') {
                DB::table('report_officers')->insert([
                    'report_id' => $report->id,
                    'user_id' => $petugas->id,
                    'status' => 'finished',
                    'location_lat' => $loc['lat'],
                    'location_lng' => $loc['lng'],
                    'dispatched_at' => $createdAt->copy()->addMinutes(2),
                    'arrived_at' => $createdAt->copy()->addMinutes(15),
                    'finished_at' => $createdAt->copy()->addMinutes(45),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info('✅ Berhasil menyemai 10 Laporan Darurat di Sanur, Kuta, dsk!');
        $this->command->info('Akun Test: warga@sisupit.com, relawan@sisupit.com, petugas@sisupit.com (Pass: password)');
    }
}

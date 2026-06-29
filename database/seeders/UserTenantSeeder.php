<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserTenantSeeder extends Seeder
{
    public function run()
    {
        $defaultPassword = Hash::make('password');

        // Pastikan Role ada
        $roles = ['superadmin', 'admin', 'pejabat', 'petugas', 'relawan', 'masyarakat', 'warga'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // =========================================================================
        // DATA MASTER WILAYAH (Berdasarkan Kode BPS Bali)
        // =========================================================================
        $provBali = '51';

        // 1. Kota Denpasar
        $kotaDenpasar = '5171';
        $kecDensel = '517101'; // Denpasar Selatan
        $desaDenpasar = [
            '5171012006', // Pemogan
            '5171012002', // Sesetan
            '5171011003',  // Sanur
        ];

        // 2. Kabupaten Badung
        $kabBadung = '5103';
        $kecKuta = '510301'; // Kuta
        $desaBadung = [
            '5103011001', // Kuta (Kelurahan)
            '5103011002', // Tuban
            '5103011003',  // Legian
        ];

        // =========================================================================
        // LEVEL 0 - 2: STRUKTUR PUSAT SAMPAI DESA
        // =========================================================================
        $superadmin = User::firstOrCreate(['email' => 'pusat@sisupit.com'], ['name' => 'Superadmin Pusat', 'username' => 'superadmin', 'password' => $defaultPassword, 'phone' => '081100000000'], ['email_verified_at' => now()]);
        $superadmin->assignRole('superadmin');

        $adminBali = User::firstOrCreate(['email' => 'admin@bali.go.id'], ['name' => 'Admin Damkar Bali', 'username' => 'adminbali', 'password' => $defaultPassword, 'phone' => '081151710000', 'province_code' => $provBali], ['email_verified_at' => now()]);
        $adminBali->assignRole('admin');

        $adminKotaDps = User::firstOrCreate(['email' => 'admin@denpasar.go.id'], ['name' => 'Admin Damkar Denpasar', 'username' => 'admindps', 'password' => $defaultPassword, 'phone' => '081151710000', 'province_code' => $provBali, 'city_code' => $kotaDenpasar, 'email_verified_at' => now()]);
        $adminKotaDps->assignRole('admin');

        $adminBadung = User::firstOrCreate(['email' => 'admin@badung.go.id'], ['name' => 'Admin Damkar Badung', 'username' => 'adminbadung', 'password' => $defaultPassword, 'phone' => '081151030000', 'province_code' => $provBali, 'city_code' => $kabBadung]);
        $adminBadung->assignRole('admin');

        $adminDensel = User::firstOrCreate(['email' => 'admin@densel.go.id'], ['name' => 'Admin Damkar Densel', 'username' => 'admindensel', 'password' => $defaultPassword, 'phone' => '081151710100', 'province_code' => $provBali, 'city_code' => $kotaDenpasar, 'district_code' => $kecDensel, 'email_verified_at' => now()]);
        $adminDensel->assignRole('admin');

        $adminPemogan = User::firstOrCreate(['email' => 'admin@pemogan.go.id'], ['name' => 'Admin Damkar Pemogan', 'username' => 'adminpemogan', 'password' => $defaultPassword, 'phone' => '081151710101', 'province_code' => $provBali, 'city_code' => $kotaDenpasar, 'district_code' => $kecDensel, 'village_code' => $desaDenpasar[0], 'email_verified_at' => now()]);
        $adminPemogan->assignRole('admin');

        // =========================================================================
        // GENERATE: 5 PETUGAS DAMKAR (Sampai tingkat Kecamatan/Pos)
        // =========================================================================
        for ($i = 1; $i <= 5; $i++) {
            $isDenpasar = $i % 2 !== 0; // Ganjil di Denpasar, Genap di Badung

            $petugas = User::firstOrCreate(
                ['email' => "petugas{$i}@sisupit.com"],
                [
                    'name' => "Petugas Damkar {$i}",
                    'username' => "petugas{$i}",
                    'password' => $defaultPassword,
                    'phone' => "08330000000{$i}",
                    'province_code' => $provBali,
                    'city_code' => $isDenpasar ? $kotaDenpasar : $kabBadung,
                    'district_code' => $isDenpasar ? $kecDensel : $kecKuta,
                    'email_verified_at' => now(),
                ]
            );
            $petugas->assignRole('petugas');
        }

        // =========================================================================
        // GENERATE: 10 RELAWAN SIPIL (Lengkap sampai Village/Desa)
        // =========================================================================
        for ($i = 1; $i <= 10; $i++) {
            $isDenpasar = $i <= 5; // 1-5 Denpasar, 6-10 Badung

            // Tentukan wilayah berdasarkan flag di atas
            $cityCode = $isDenpasar ? $kotaDenpasar : $kabBadung;
            $districtCode = $isDenpasar ? $kecDensel : $kecKuta;

            // Pilih satu desa secara acak dari array desa yang sesuai
            $villageCode = $isDenpasar ? $desaDenpasar[array_rand($desaDenpasar)] : $desaBadung[array_rand($desaBadung)];

            $relawan = User::firstOrCreate(
                ['email' => "relawan{$i}@sisupit.com"],
                [
                    'name' => "Relawan Bali {$i}",
                    'username' => "relawan{$i}",
                    'password' => $defaultPassword,
                    'phone' => "0822000000{$i}".rand(1, 9),
                    'province_code' => $provBali,
                    'city_code' => $cityCode,
                    'district_code' => $districtCode,
                    'village_code' => $villageCode,
                    'email_verified_at' => now(),
                ]
            );
            $relawan->assignRole('relawan');
        }

        // =========================================================================
        // GENERATE: 5 WARGA / MASYARAKAT UMUM (Lengkap sampai Village/Desa)
        // =========================================================================
        for ($i = 1; $i <= 5; $i++) {
            $isDenpasar = $i <= 3; // 1-3 Denpasar, 4-5 Badung

            // Tentukan wilayah berdasarkan flag di atas
            $cityCode = $isDenpasar ? $kotaDenpasar : $kabBadung;
            $districtCode = $isDenpasar ? $kecDensel : $kecKuta;

            // Pilih satu desa secara acak dari array desa yang sesuai
            $villageCode = $isDenpasar ? $desaDenpasar[array_rand($desaDenpasar)] : $desaBadung[array_rand($desaBadung)];

            $warga = User::firstOrCreate(
                ['email' => "warga{$i}@sisupit.com"],
                [
                    'name' => "Warga Sipil {$i}",
                    'username' => "warga{$i}",
                    'password' => $defaultPassword,
                    'phone' => "0811000000{$i}".rand(1, 9),
                    'province_code' => $provBali,
                    'city_code' => $cityCode,
                    'district_code' => $districtCode,
                    'village_code' => $villageCode,
                    'email_verified_at' => now(),
                ]
            );
            $warga->assignRole('masyarakat');
        }

        $this->command->info('✅ UserTenantSeeder: Berhasil Generate 5 Petugas, 10 Relawan, dan 5 Warga (Lengkap sampai tingkat Desa/Kelurahan).');
    }
}

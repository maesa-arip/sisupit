<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserTenantSeeder extends Seeder
{
    public function run()
    {
        $defaultPassword = Hash::make('password');

        // =========================================================================
        // LEVEL 0: PUSAT (NASIONAL)
        // Wewenang: Seluruh Indonesia
        // =========================================================================
        $superadmin = User::firstOrCreate(
            ['email' => 'pusat@sisupit.com'],
            [
                'name'              => 'Superadmin Pusat',
                'username'          => usernameGenerator('Superadmin Pusat'),
                'password'          => $defaultPassword,
                'phone'             => '081100000000',
                'province_code'     => null, 
                'city_code'         => null, 
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $superadmin->assignRole('superadmin');


        // =========================================================================
        // LEVEL 1: PROVINSI BALI (KODE: 51)
        // Wewenang: Seluruh Kabupaten/Kota di Bali
        // =========================================================================
        $provBali = '51';

        $adminProv = User::firstOrCreate(
            ['email' => 'admin@baliprov.go.id'],
            [
                'name'              => 'Admin BPBD Provinsi Bali',
                'username'          => usernameGenerator('Admin BPBD Provinsi Bali'),
                'password'          => $defaultPassword,
                'phone'             => '081151000000',
                'province_code'     => $provBali,
                'city_code'         => null,
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $adminProv->assignRole('admin');

        $pejabatProv = User::firstOrCreate(
            ['email' => 'gubernur@baliprov.go.id'],
            [
                'name'              => 'Gubernur / Kalaksa BPBD Bali',
                'username'          => usernameGenerator('Gubernur Bali'),
                'password'          => $defaultPassword,
                'phone'             => '081151000001',
                'province_code'     => $provBali,
                'city_code'         => null,
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $pejabatProv->assignRole('pejabat');


        // =========================================================================
        // LEVEL 2: KOTA DENPASAR (KODE: 5171)
        // Wewenang: Terbatas di Kota Denpasar
        // =========================================================================
        $kotaDenpasar = '5171';
        
        // --- Tingkat Kota ---
        $adminKotaDps = User::firstOrCreate(
            ['email' => 'admin@denpasar.go.id'],
            [
                'name'              => 'Admin Damkar Denpasar',
                'username'          => usernameGenerator('Admin Damkar Denpasar'),
                'password'          => $defaultPassword,
                'phone'             => '081151710000',
                'province_code'     => $provBali,
                'city_code'         => $kotaDenpasar,
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $adminKotaDps->assignRole('admin');

        $pejabatKotaDps = User::firstOrCreate(
            ['email' => 'walikota@denpasar.go.id'],
            [
                'name'              => 'Walikota / Kadis Damkar Denpasar',
                'username'          => usernameGenerator('Walikota Denpasar'),
                'password'          => $defaultPassword,
                'phone'             => '081151710001',
                'province_code'     => $provBali,
                'city_code'         => $kotaDenpasar,
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $pejabatKotaDps->assignRole('pejabat');

        $petugasKotaDps = User::firstOrCreate(
            ['email' => 'danru.induk@denpasar.go.id'],
            [
                'name'              => 'Danru Pos Induk Denpasar',
                'username'          => usernameGenerator('Danru Induk Denpasar'),
                'password'          => $defaultPassword,
                'phone'             => '081151710002',
                'province_code'     => $provBali,
                'city_code'         => $kotaDenpasar,
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $petugasKotaDps->assignRole('petugas');

        // --- Tingkat Kecamatan (Denpasar Selatan: 517101) ---
        $kecDensel = '517101';

        $adminKecDensel = User::firstOrCreate(
            ['email' => 'admin.densel@denpasar.go.id'],
            [
                'name'              => 'Admin Kecamatan Densel',
                'username'          => usernameGenerator('Admin Densel'),
                'password'          => $defaultPassword,
                'phone'             => '081151710100',
                'province_code'     => $provBali,
                'city_code'         => $kotaDenpasar,
                'district_code'     => $kecDensel,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $adminKecDensel->assignRole('admin');

        $petugasKecDensel = User::firstOrCreate(
            ['email' => 'danru.densel@denpasar.go.id'],
            [
                'name'              => 'Danru Sektor Densel',
                'username'          => usernameGenerator('Danru Sektor Densel'),
                'password'          => $defaultPassword,
                'phone'             => '081151710101',
                'province_code'     => $provBali,
                'city_code'         => $kotaDenpasar,
                'district_code'     => $kecDensel,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $petugasKecDensel->assignRole('petugas');

        // --- Tingkat Desa (Pemogan: 5171012006) ---
        $desaPemogan = '5171012006';

        $adminDesaPemogan = User::firstOrCreate(
            ['email' => 'admin.pemogan@denpasar.go.id'],
            [
                'name'              => 'Admin Desa Pemogan',
                'username'          => usernameGenerator('Admin Pemogan'),
                'password'          => $defaultPassword,
                'phone'             => '081151710120',
                'province_code'     => $provBali,
                'city_code'         => $kotaDenpasar,
                'district_code'     => $kecDensel,
                'village_code'      => $desaPemogan,
                'email_verified_at' => now(),
            ]
        );
        $adminDesaPemogan->assignRole('admin');

        $relawanPemogan = User::firstOrCreate(
            ['email' => 'relawan.pemogan@gmail.com'],
            [
                'name'              => 'Bli Made (Relawan Pemogan)',
                'username'          => usernameGenerator('Relawan Pemogan'),
                'password'          => $defaultPassword,
                'phone'             => '081151710121',
                'province_code'     => $provBali,
                'city_code'         => $kotaDenpasar,
                'district_code'     => $kecDensel,
                'village_code'      => $desaPemogan,
                'email_verified_at' => now(),
            ]
        );
        $relawanPemogan->assignRole('relawan');

        $masyarakatPemogan = User::firstOrCreate(
            ['email' => 'warga.pemogan@gmail.com'],
            [
                'name'              => 'Warga Pemogan Pelapor',
                'username'          => usernameGenerator('Warga Pemogan'),
                'password'          => $defaultPassword,
                'phone'             => '081999999991',
                'province_code'     => $provBali,
                'city_code'         => $kotaDenpasar,
                'district_code'     => $kecDensel,
                'village_code'      => $desaPemogan,
                'email_verified_at' => now(),
            ]
        );
        $masyarakatPemogan->assignRole('masyarakat');


        // =========================================================================
        // LEVEL 2: KABUPATEN BADUNG (KODE: 5103)
        // Wewenang: Terbatas di Kabupaten Badung
        // =========================================================================
        $kabBadung = '5103';

        // --- Tingkat Kabupaten ---
        $adminKabBadung = User::firstOrCreate(
            ['email' => 'admin@badungkab.go.id'],
            [
                'name'              => 'Admin Damkar Badung',
                'username'          => usernameGenerator('Admin Damkar Badung'),
                'password'          => $defaultPassword,
                'phone'             => '081151030000',
                'province_code'     => $provBali,
                'city_code'         => $kabBadung,
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $adminKabBadung->assignRole('admin');

        $pejabatKabBadung = User::firstOrCreate(
            ['email' => 'bupati@badungkab.go.id'],
            [
                'name'              => 'Bupati / Kadis Damkar Badung',
                'username'          => usernameGenerator('Bupati Badung'),
                'password'          => $defaultPassword,
                'phone'             => '081151030001',
                'province_code'     => $provBali,
                'city_code'         => $kabBadung,
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $pejabatKabBadung->assignRole('pejabat');

        // --- Tingkat Kecamatan (Kuta: 510301) ---
        $kecKuta = '510301';

        $adminKecKuta = User::firstOrCreate(
            ['email' => 'admin.kuta@badungkab.go.id'],
            [
                'name'              => 'Admin Kecamatan Kuta',
                'username'          => usernameGenerator('Admin Kuta'),
                'password'          => $defaultPassword,
                'phone'             => '081151030100',
                'province_code'     => $provBali,
                'city_code'         => $kabBadung,
                'district_code'     => $kecKuta,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $adminKecKuta->assignRole('admin');

        $petugasKecKuta = User::firstOrCreate(
            ['email' => 'danru.kuta@badungkab.go.id'],
            [
                'name'              => 'Danru Pos Kuta',
                'username'          => usernameGenerator('Danru Pos Kuta'),
                'password'          => $defaultPassword,
                'phone'             => '081151030101',
                'province_code'     => $provBali,
                'city_code'         => $kabBadung,
                'district_code'     => $kecKuta,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $petugasKecKuta->assignRole('petugas');

        // --- Tingkat Kelurahan (Kuta: 5103011001) ---
        $kelKuta = '5103011001';

        $adminKelKuta = User::firstOrCreate(
            ['email' => 'admin.kel.kuta@badungkab.go.id'],
            [
                'name'              => 'Admin Kelurahan Kuta',
                'username'          => usernameGenerator('Admin Kel Kuta'),
                'password'          => $defaultPassword,
                'phone'             => '081151030110',
                'province_code'     => $provBali,
                'city_code'         => $kabBadung,
                'district_code'     => $kecKuta,
                'village_code'      => $kelKuta,
                'email_verified_at' => now(),
            ]
        );
        $adminKelKuta->assignRole('admin');

        $relawanKelKuta = User::firstOrCreate(
            ['email' => 'relawan.kuta@gmail.com'],
            [
                'name'              => 'Bli Wayan (Relawan Kuta)',
                'username'          => usernameGenerator('Relawan Kuta'),
                'password'          => $defaultPassword,
                'phone'             => '081151030111',
                'province_code'     => $provBali,
                'city_code'         => $kabBadung,
                'district_code'     => $kecKuta,
                'village_code'      => $kelKuta,
                'email_verified_at' => now(),
            ]
        );
        $relawanKelKuta->assignRole('relawan');

        $masyarakatUmum = User::firstOrCreate(
            ['email' => 'warga.bali@gmail.com'],
            [
                'name'              => 'Warga Umum Pelapor',
                'username'          => usernameGenerator('Warga Umum'),
                'password'          => $defaultPassword,
                'phone'             => '081999999999',
                'province_code'     => $provBali,
                'city_code'         => $kabBadung, // Misalnya mendaftar dengan identitas Badung
                'district_code'     => null,
                'village_code'      => null,
                'email_verified_at' => now(),
            ]
        );
        $masyarakatUmum->assignRole('masyarakat');
    }
}
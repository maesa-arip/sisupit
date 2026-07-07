<?php

namespace Database\Seeders;

use App\Models\PosPemadam;
use Illuminate\Database\Seeder;

class PosPemadamSeeder extends Seeder
{
    public function run(): void
    {
        $stations = [
            // ==========================================
            // KOTA DENPASAR (Prov: 51, Kota: 5171)
            // ==========================================
            [
                'name' => 'Pos Induk BPBD Kota Denpasar',
                'address' => 'Jl. Imam Bonjol No. 182, Pemecutan Klod, Denpasar Barat',
                'phone' => '0361-223333',
                'vehicle_count' => 5,
                'type' => 'Pos Induk',
                'status' => 'Aktif',
                // Titik gedung BPBD/Damkar Kota Denpasar di Jl. Imam Bonjol (hasil geocode)
                'lat' => -8.674813,
                'lng' => 115.202284,
                'province_code' => '51',
                'city_code' => '5171',
                'district_code' => '517102', // Denpasar Barat
                'village_code' => '5171022002', // Pemecutan Klod
            ],
            [
                'name' => 'Pos Pemadam Sektor Juanda (Renon)',
                'address' => 'Kawasan Niti Mandala Renon, Denpasar Selatan',
                'phone' => '0361-223333',
                'vehicle_count' => 2,
                'type' => 'Pos Sektor',
                'status' => 'Aktif',
                'lat' => -8.669894,
                'lng' => 115.234123,
                'province_code' => '51',
                'city_code' => '5171',
                'district_code' => '517101', // Denpasar Selatan
                'village_code' => '5171012002', // Renon
            ],
            [
                'name' => 'Pos Pemadam Sektor Mahendradatta',
                'address' => 'Jl. Mahendradatta, Padangsambian, Denpasar Barat',
                'phone' => '0361-223333',
                'vehicle_count' => 3,
                'type' => 'Pos Sektor',
                'status' => 'Aktif',
                'lat' => -8.660123,
                'lng' => 115.185234,
                'province_code' => '51',
                'city_code' => '5171',
                'district_code' => '517102', // Denpasar Barat
                'village_code' => '5171022003', // Padangsambian
            ],
            [
                'name' => 'Pos Pemadam Sektor Ubung',
                'address' => 'Area Terminal Ubung, Denpasar Utara',
                'phone' => '0361-223333',
                'vehicle_count' => 2,
                'type' => 'Pos Sektor',
                'status' => 'Perbaikan',
                'lat' => -8.632145,
                'lng' => 115.201456,
                'province_code' => '51',
                'city_code' => '5171',
                'district_code' => '517103', // Denpasar Utara
                'village_code' => '5171032001', // Ubung
            ],
            [
                'name' => 'Posko Relawan Damkar Sanur',
                'address' => 'Jl. Hang Tuah, Sanur Kaja, Denpasar Selatan',
                'phone' => '0812-3456-7890',
                'vehicle_count' => 1,
                'type' => 'Pos Relawan',
                'status' => 'Aktif',
                'lat' => -8.681234,
                'lng' => 115.258901,
                'province_code' => '51',
                'city_code' => '5171',
                'district_code' => '517101', // Denpasar Selatan
                'village_code' => '5171012001', // Sanur Kaja
            ],

            // ==========================================
            // KABUPATEN BADUNG (Prov: 51, Kota: 5103)
            // ==========================================
            [
                'name' => 'Pos Pemadam Kebakaran Kuta',
                'address' => 'Jl. Majapahit, Kuta, Kabupaten Badung',
                'phone' => '0361-751113',
                'vehicle_count' => 4,
                'type' => 'Pos Induk',
                'status' => 'Aktif',
                'lat' => -8.723145,
                'lng' => 115.176456,
                'province_code' => '51',
                'city_code' => '5103',
                'district_code' => '510301', // Kuta
                'village_code' => '5103011001', // Kuta
            ],
            [
                'name' => 'Pos Damkar Mengwi',
                'address' => 'Jl. Raya Mengwi, Kabupaten Badung',
                'phone' => '0361-8941113',
                'vehicle_count' => 2,
                'type' => 'Pos Sektor',
                'status' => 'Aktif',
                'lat' => -8.543210,
                'lng' => 115.165432,
                'province_code' => '51',
                'city_code' => '5103',
                'district_code' => '510302', // Mengwi
                'village_code' => '5103022001', // Mengwi
            ],
        ];

        foreach ($stations as $station) {
            PosPemadam::create($station);
        }
    }
}

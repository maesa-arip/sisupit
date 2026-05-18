<?php

namespace Database\Seeders;

use App\Models\Pompa;
use Illuminate\Database\Seeder;

class PompaSeeder extends Seeder
{
    public function run(): void
    {
        $pompas = [
            // ==========================================
            // KOTA DENPASAR (Prov: 51, Kota: 5171)
            // ==========================================
            [
                'name'          => 'Pompa Sentral Pasar Badung',
                'address'       => 'Jl. Sulawesi No. 1, Dauh Puri Kangin, Denpasar Barat',
                'type'          => 'Statis (Pompa Besar)',
                'status'        => 'Aktif',
                'lat'           => -8.655299, 
                'lng'           => 115.212003, 
                'province_code' => '51',
                'city_code'     => '5171',
                'district_code' => '517102', // Denpasar Barat
                'village_code'  => '5171022001', // Dauh Puri Kangin
                'description'   => 'Pompa utama untuk area pusat perbelanjaan Pasar Badung. Debit air tinggi.',
            ],
            [
                'name'          => 'Pompa Portable Relawan Sanur',
                'address'       => 'Posko Relawan Pantai Sanur, Jl. Hang Tuah',
                'type'          => 'Portable (Mobil)',
                'status'        => 'Aktif',
                'lat'           => -8.673891,
                'lng'           => 115.263300,
                'province_code' => '51',
                'city_code'     => '5171',
                'district_code' => '517101', // Denpasar Selatan
                'village_code'  => '5171012001', // Sanur Kaja
                'description'   => 'Pompa portabel di atas mobil bak terbuka, siap dikerahkan ke titik evakuasi sempit.',
            ],
            [
                'name'          => 'Pompa Air Desa Pemecutan',
                'address'       => 'Balai Banjar Tegal, Pemecutan Kelod',
                'type'          => 'Mesin Diesel',
                'status'        => 'Aktif',
                'lat'           => -8.658012,
                'lng'           => 115.195023,
                'province_code' => '51',
                'city_code'     => '5171',
                'district_code' => '517102', // Denpasar Barat
                'village_code'  => '5171022002', // Pemecutan Klod
                'description'   => 'Pompa cadangan bertenaga solar, cocok untuk pemadaman atau penyedotan banjir lokal.',
            ],
            [
                'name'          => 'Pompa Apung Suwung',
                'address'       => 'Area TPA Suwung, Denpasar Selatan',
                'type'          => 'Pompa Apung',
                'status'        => 'Aktif',
                'lat'           => -8.724501,
                'lng'           => 115.221567,
                'province_code' => '51',
                'city_code'     => '5171',
                'district_code' => '517101', // Denpasar Selatan
                'village_code'  => '5171012003', // Suwung/Sesetan
                'description'   => 'Dapat mengapung di atas permukaan air. Digunakan untuk mengatasi genangan air/banjir.',
            ],

            // ==========================================
            // KABUPATEN BADUNG (Prov: 51, Kota: 5103)
            // ==========================================
            [
                'name'          => 'Pompa Portable ITDC Nusa Dua',
                'address'       => 'Kawasan ITDC Nusa Dua, Badung',
                'type'          => 'Portable (Mobil)',
                'status'        => 'Aktif',
                'lat'           => -8.798432,
                'lng'           => 115.223456,
                'province_code' => '51',
                'city_code'     => '5103',
                'district_code' => '510305', // Kuta Selatan
                'village_code'  => '5103052001', // Benoa
                'description'   => 'Pompa taktis untuk area pariwisata elit.',
            ],
            [
                'name'          => 'Pompa Hisap Petang',
                'address'       => 'Kecamatan Petang, Kabupaten Badung',
                'type'          => 'Mesin Diesel',
                'status'        => 'Perbaikan',
                'lat'           => -8.384210,
                'lng'           => 115.212345,
                'province_code' => '51',
                'city_code'     => '5103',
                'district_code' => '510304', // Petang
                'village_code'  => '5103042001', // Petang
                'description'   => 'Klep hisap sedang diganti. Selesai minggu depan.',
            ],
        ];

        foreach ($pompas as $pompa) {
            Pompa::create($pompa);
        }
    }
}
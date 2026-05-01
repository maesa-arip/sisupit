<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PosPemadam;

class PosPemadamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stations = [
            [
                'name'          => 'Pos Induk BPBD Kota Denpasar',
                'address'       => 'Jl. Imam Bonjol No. 182, Pemecutan Klod, Denpasar Barat',
                'phone'         => '0361-223333', // Bisa diganti dengan 112 jika sistem menggunakan panggilan darurat terpadu
                'vehicle_count' => 5,
                'type'          => 'Pos Induk',
                'status'        => 'Aktif',
                'location_lat'  => -8.675124,
                'location_lng'  => 115.191782,
            ],
            [
                'name'          => 'Pos Pemadam Sektor Juanda (Renon)',
                'address'       => 'Kawasan Niti Mandala Renon, Denpasar Selatan',
                'phone'         => '0361-223333',
                'vehicle_count' => 2,
                'type'          => 'Pos Sektor',
                'status'        => 'Aktif',
                'location_lat'  => -8.669894,
                'location_lng'  => 115.234123,
            ],
            [
                'name'          => 'Pos Pemadam Sektor Mahendradatta',
                'address'       => 'Jl. Mahendradatta, Padangsambian, Denpasar Barat',
                'phone'         => '0361-223333',
                'vehicle_count' => 3,
                'type'          => 'Pos Sektor',
                'status'        => 'Aktif',
                'location_lat'  => -8.660123,
                'location_lng'  => 115.185234,
            ],
            [
                'name'          => 'Pos Pemadam Sektor Ubung',
                'address'       => 'Area Terminal Ubung, Denpasar Utara',
                'phone'         => '0361-223333',
                'vehicle_count' => 2,
                'type'          => 'Pos Sektor',
                'status'        => 'Siaga', // Sedang standby penuh
                'location_lat'  => -8.632145,
                'location_lng'  => 115.201456,
            ],
            [
                'name'          => 'Posko Relawan Damkar Sanur',
                'address'       => 'Jl. Hang Tuah, Sanur Kaja, Denpasar Selatan',
                'phone'         => '0812-3456-7890',
                'vehicle_count' => 1,
                'type'          => 'Pos Relawan',
                'status'        => 'Aktif',
                'location_lat'  => -8.681234,
                'location_lng'  => 115.258901,
            ],
        ];

        foreach ($stations as $station) {
            PosPemadam::create($station);
        }
    }
}
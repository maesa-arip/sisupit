<?php

namespace Database\Seeders;

use App\Models\Pompa;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PompaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pompas = [
            [
                'name'         => 'Hydrant Sentral Pasar Badung',
                'address'      => 'Jl. Sulawesi No. 1, Dauh Puri Kangin, Denpasar Barat',
                'type'         => 'Statis (Hydrant)',
                'status'       => 'Aktif',
                'capacity_lpm' => 1500,
                'location_lat' => -8.655299,
                'location_lng' => 115.212003,
                'description'  => 'Hydrant utama untuk area pusat perbelanjaan Pasar Badung. Debit air tinggi.',
            ],
            [
                'name'         => 'Pompa Portable Relawan Sanur',
                'address'      => 'Posko Relawan Pantai Sanur, Jl. Hang Tuah',
                'type'         => 'Portable (Mobil)',
                'status'       => 'Aktif',
                'capacity_lpm' => 800,
                'location_lat' => -8.673891,
                'location_lng' => 115.263300,
                'description'  => 'Pompa portabel di atas mobil bak terbuka, siap dikerahkan ke titik evakuasi sempit.',
            ],
            [
                'name'         => 'Hydrant Monumen Bajra Sandhi',
                'address'      => 'Kawasan Lapangan Renon, Denpasar Selatan',
                'type'         => 'Statis (Hydrant)',
                'status'       => 'Dalam Perbaikan',
                'capacity_lpm' => 1200,
                'location_lat' => -8.671694,
                'location_lng' => 115.233889,
                'description'  => 'Sedang ada perbaikan pada katup pipa utama. Estimasi selesai minggu depan.',
            ],
            [
                'name'         => 'Pompa Air Desa Pemecutan',
                'address'      => 'Balai Banjar Tegal, Pemecutan Kelod',
                'type'         => 'Mesin Diesel',
                'status'       => 'Aktif',
                'capacity_lpm' => 500,
                'location_lat' => -8.658012,
                'location_lng' => 115.195023,
                'description'  => 'Pompa cadangan bertenaga solar, cocok untuk pemadaman atau penyedotan banjir lokal.',
            ],
            [
                'name'         => 'Hydrant BPBD Kota Denpasar',
                'address'      => 'Jl. Imam Bonjol No. 182, Pemecutan Klod',
                'type'         => 'Statis (Hydrant)',
                'status'       => 'Aktif',
                'capacity_lpm' => 2000,
                'location_lat' => -8.675124,
                'location_lng' => 115.191782,
                'description'  => 'Terhubung langsung dengan reservoir utama BPBD. Tekanan air paling stabil.',
            ],
            [
                'name'         => 'Pompa Apung Suwung',
                'address'      => 'Area TPA Suwung, Denpasar Selatan',
                'type'         => 'Pompa Apung',
                'status'       => 'Aktif',
                'capacity_lpm' => 450,
                'location_lat' => -8.724501,
                'location_lng' => 115.221567,
                'description'  => 'Dapat mengapung di atas permukaan air. Digunakan untuk mengatasi genangan air/banjir.',
            ],
        ];

        foreach ($pompas as $pompa) {
            Pompa::create($pompa);
        }
    }
}

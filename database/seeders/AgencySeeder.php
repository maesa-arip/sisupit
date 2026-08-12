<?php

namespace Database\Seeders;

use App\Models\Agency;
use Illuminate\Database\Seeder;

/**
 * Contoh master OPD untuk Denpasar (TASK_27), selaras wilayah ReportSeeder (city_code 5171).
 *
 * Sengaja hanya CONTOH — daftar sebenarnya diisi tiap kabupaten lewat /admin/agencies. Yang
 * ingin ditunjukkan di sini adalah bentuk datanya: PLN membawa konfirmasi berkondisi lewat
 * KOLOM (`requires_confirmation` + `confirmation_label`), bukan lewat kode yang mengenali
 * nama "PLN". OPD ketiga (PMI) sengaja dibuat tanpa auto-centang agar terlihat bedanya.
 */
class AgencySeeder extends Seeder
{
    public function run(): void
    {
        // Semua jenis kejadian kebakaran (Report::INCIDENT_TYPES tanpa 'lainnya').
        $kebakaran = ['rumah', 'toko', 'kendaraan', 'lahan'];

        $agencies = [
            [
                'name' => 'BPBD Kota Denpasar',
                'code' => 'BPBD',
                'category' => 'Kebencanaan',
                'phone' => '(0361) 223333',
                'default_incident_types' => $kebakaran,
                'requires_confirmation' => false,
                'confirmation_label' => null,
            ],
            [
                'name' => 'PLN UP3 Bali Selatan',
                'code' => 'PLN',
                'category' => 'Utilitas',
                'phone' => '123',
                'default_incident_types' => $kebakaran,
                'requires_confirmation' => true,
                'confirmation_label' => 'Listrik sudah dipadamkan di lokasi kejadian',
            ],
            [
                'name' => 'PMI Kota Denpasar',
                'code' => 'PMI',
                'category' => 'Kesehatan',
                'phone' => '(0361) 480282',
                'default_incident_types' => null,
                'requires_confirmation' => false,
                'confirmation_label' => null,
            ],
        ];

        foreach ($agencies as $agency) {
            Agency::withoutGlobalScopes()->firstOrCreate(
                ['name' => $agency['name']],
                $agency + [
                    'is_active' => true,
                    'province_code' => '51',
                    'city_code' => '5171',
                ]
            );
        }
    }
}

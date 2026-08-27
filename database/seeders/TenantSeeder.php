<?php

namespace Database\Seeders;

use App\Enums\TenantEdition;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

/**
 * Seed tenant awal (TASK_17). Denpasar diambil dari nilai config/pejabat.php yang selama
 * ini hardcode; Badung PLACEHOLDER sampai data resmi diisi (superadmin bisa ubah lewat
 * form /admin/tenants). city_code diverifikasi cocok dgn reports/users existing:
 * Denpasar=5171, Badung=5103 (keduanya provinsi Bali=51).
 */
class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = [
            [
                'subdomain' => 'denpasar',
                'city_code' => '5171',
                'province_code' => '51',
                'nama_instansi' => 'Dinas Pemadam Kebakaran dan Penyelamatan Kota Denpasar',
                'pejabat_nama' => config('pejabat.nama'),
                'pejabat_jabatan' => config('pejabat.jabatan'),
                'pejabat_foto' => config('pejabat.foto'),
                'telepon_darurat' => config('pejabat.telepon_darurat'),
                'is_active' => true,
                // Paket layanan (TASK_19): Denpasar menyewa, Badung membeli.
                'edition' => TenantEdition::SEWA->value,
            ],
            [
                'subdomain' => 'badung',
                'city_code' => '5103',
                'province_code' => '51',
                'nama_instansi' => 'Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Badung',
                // PLACEHOLDER — ganti dengan data resmi Badung lewat form /admin/tenants.
                'pejabat_nama' => 'Nama Pejabat Badung',
                'pejabat_jabatan' => 'Kepala Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Badung',
                'pejabat_foto' => null,
                'telepon_darurat' => '113',
                'is_active' => true,
                'edition' => TenantEdition::BELI->value,
            ],
        ];

        foreach ($tenants as $tenant) {
            Tenant::updateOrCreate(['city_code' => $tenant['city_code']], $tenant);
        }
    }
}

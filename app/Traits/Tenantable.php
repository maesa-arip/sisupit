<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait Tenantable
{
    protected static function bootTenantable()
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (auth()->check()) {
                $user = auth()->user();

                // 1. Abaikan filter jika Superadmin Pusat
                if ($user->hasRole('superadmin')) {
                    return;
                }

                // 2. Filter untuk Admin Desa / Relawan Desa (Level 3)
                if ($user->village_code) {
                    $builder->where('village_code', $user->village_code);

                    return;
                }

                // 3. Filter untuk Admin Kecamatan / Pos Cabang (Level 2)
                if ($user->district_code) {
                    $builder->where('district_code', $user->district_code);

                    return;
                }

                // 4. Filter untuk Admin Kabupaten (Level 1)
                if ($user->city_code) {
                    $builder->where('city_code', $user->city_code);

                    return;
                }
                if ($user->province_code) {
                    $builder->where('province_code', $user->province_code);

                    return;
                }

                // User login TANPA kode wilayah sama sekali & BUKAN superadmin → JANGAN beri
                // akses nasional. Ini bug nyata: akun Google/pendaftar yang belum melengkapi
                // profil (village_code null) tadinya lolos semua filter = melihat SELURUH data
                // nasional (termasuk PII laporan). Kembalikan hasil KOSONG; akses baru terbuka
                // setelah wilayah diisi di complete-profile. Superadmin sudah bypass di atas.
                // Guest (auth tak login) tak masuk blok ini → halaman publik fasilitas tetap normal.
                $builder->whereRaw('1 = 0');
            }
        });
    }
}

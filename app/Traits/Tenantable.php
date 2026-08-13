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

                $codes = array_filter([
                    'province_code' => $user->province_code,
                    'city_code' => $user->city_code,
                    'district_code' => $user->district_code,
                    'village_code' => $user->village_code,
                ]);

                // User login TANPA kode wilayah sama sekali & BUKAN superadmin → JANGAN beri
                // akses nasional. Ini bug nyata: akun Google/pendaftar yang belum melengkapi
                // profil (village_code null) tadinya lolos semua filter = melihat SELURUH data
                // nasional (termasuk PII laporan). Kembalikan hasil KOSONG; akses baru terbuka
                // setelah wilayah diisi di complete-profile. Superadmin sudah bypass di atas.
                // Guest (auth tak login) tak masuk blok ini → halaman publik fasilitas tetap normal.
                if (empty($codes)) {
                    $builder->whereRaw('1 = 0');

                    return;
                }

                // 2. Untuk TIAP tingkat yang dimiliki user, baris harus NULL atau sama (#60).
                //
                // Kolom NULL pada BARIS berarti "berlaku untuk seluruh wilayah di bawahnya" —
                // master OPD/armada disimpan admin tingkat kota sehingga district/village-nya
                // NULL, dan dulu baris itu tak pernah terlihat oleh staf yang terikat kecamatan
                // atau desa (`NULL = '517101'` di SQL bukan true, melainkan unknown). Akibatnya
                // fitur OPD terkait hilang TANPA pesan galat bagi 6 dari 18 staf Denpasar.
                //
                // Ini bukan aturan baru di aplikasi: User::scopeNotifiableForReport sudah lama
                // memakai makna yang sama ("kolom lebih sempit NULL = wewenang lebih luas")
                // untuk memilih penerima siaran darurat. Perubahan ini menyelaraskan keduanya.
                //
                // Melebar ke ATAS tidak berarti melebar ke SAMPING: tiap tingkat yang dimiliki
                // user tetap diperiksa, jadi data kabupaten tetangga tetap tertutup. Sebelumnya
                // user ber-district_code justru difilter HANYA dengan district_code, tanpa
                // memeriksa provinsi/kota sama sekali — cakupannya kini lebih rapat, bukan lebih
                // longgar.
                foreach ($codes as $column => $code) {
                    $builder->where(function (Builder $query) use ($column, $code) {
                        $query->whereNull($column)->orWhere($column, $code);
                    });
                }
            }
        });
    }
}

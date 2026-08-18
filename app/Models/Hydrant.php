<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Model;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

class Hydrant extends Model
{
    use Tenantable;

    /**
     * Kondisi tekanan air — penilaian cepat petugas di lapangan. Sengaja TERPISAH dari
     * `debit_lpm`: yang ini kualitatif (bisa dinilai mata telanjang saat survei), yang itu
     * kuantitatif untuk rekap debit per desa.
     *
     * Dipakai bersama oleh HydrantWarga (dirujuk sebagai `Hydrant::WATER_PRESSURES`) supaya
     * daftar nilainya tetap satu, walau tabelnya sengaja dipisah — lihat
     * `prompt/docs/PENGECUALIAN_ATURAN.md` #1.
     */
    public const WATER_PRESSURES = ['Keras', 'Sedang', 'Kecil'];

    protected $guarded = [];

    protected $casts = [
        'debit_lpm' => 'integer',
    ];

    // 3. Relasi ke wilayah
    public function province()
    {
        return $this->belongsTo(Province::class, 'province_code', 'code');
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_code', 'code');
    }

    public function district()
    {
        return $this->belongsTo(District::class, 'district_code', 'code');
    }

    public function village()
    {
        return $this->belongsTo(Village::class, 'village_code', 'code');
    }
}

<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

class PosPemadam extends Model
{
    use HasFactory, SoftDeletes, Tenantable;

    // Lihat catatan di Pompa: guarded kosong agar lat/lng & kode wilayah ter-mass-assign.
    // $fillable lama menyebut location_lat/location_lng yang tidak ada di tabel.
    protected $guarded = [];

    protected $casts = [
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
        'vehicle_count' => 'integer',
    ];

    // Relasi ke wilayah (laravolt/indonesia) — selaras dengan Hydrant
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

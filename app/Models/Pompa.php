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

class Pompa extends Model
{
    use HasFactory, SoftDeletes, Tenantable;

    // Mengikuti pola Hydrant: guarded kosong agar seluruh kolom (termasuk lat/lng &
    // kode wilayah) bisa di-mass-assign dari controller/seeder. Sebelumnya $fillable
    // menyebut location_lat/location_lng yang TIDAK ada di tabel (kolom aslinya lat/lng),
    // sehingga koordinat & yurisdiksi diam-diam terbuang saat create.
    protected $guarded = [];

    /**
     * Konversi tipe data otomatis (Casting)
     */
    protected $casts = [
        // Memastikan koordinat dikirim sebagai angka pecahan (float/real) ke Frontend
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
        'capacity_lpm' => 'integer',
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

    /**
     * Scope untuk memfilter hanya pompa yang siap pakai
     * Cara pakai di controller: Pompa::ready()->get();
     */
    public function scopeReady($query)
    {
        return $query->where('status', 'Aktif');
    }

    /**
     * Bentuk baris untuk daftar/peta SKKL — kembarannya Hydrant::toSkklRow() (TASK_30).
     * Halaman SKKL menampilkan dua sumber (aset pompa + hydrant warga) dalam satu daftar,
     * jadi keduanya WAJIB memancarkan kunci yang sama; kalau tidak, kartu yang satu kehilangan
     * badge/debit yang dipunyai kartu lainnya.
     *
     * `capacity_lpm` dipetakan ke `debit_lpm` karena satuannya memang sama (liter per menit) —
     * itulah yang membuat rekap debit per desa bisa menjumlahkan keduanya.
     */
    public function toSkklRow(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address ?? 'Alamat tidak tersedia',
            'status' => $this->status ?? 'Aktif',
            'type' => $this->type ?? 'Statis (Hydrant)',
            'lat' => $this->lat,
            'lng' => $this->lng,
            'debit_lpm' => $this->capacity_lpm,
            'water_pressure' => null,
            'village_code' => $this->village_code,
            'created_at' => $this->created_at,
            'category' => 'pompa',
            'source' => 'pompa',
        ];
    }
}

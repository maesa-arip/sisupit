<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Model;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

/**
 * Hydrant swadaya warga (banjar/desa) — kembaran `Hydrant` dengan tabel sendiri.
 *
 * PENGECUALIAN ATURAN yang disetujui user 2026-08-19, lihat `prompt/docs/PENGECUALIAN_ATURAN.md`
 * entri #1: model ini sengaja mengembarkan `Hydrant` alih-alih memakai satu tabel berkolom
 * kepemilikan. Kalau kamu menambah/mengubah kolom di salah satu model, **cek yang satunya lagi** —
 * itu harga yang sudah disepakati untuk mendapat dua menu & route yang benar-benar terpisah.
 *
 * Yang TIDAK diduplikasi: daftar nilai tekanan air (dirujuk dari `Hydrant::WATER_PRESSURES`)
 * dan komponen form React (satu berkas, dua route, dibedakan prop `variant`).
 *
 * Dibaca di menu SKKL (`Admin\PompaController`, `/pumps` publik, layer SKKL Peta Pemantauan)
 * karena hydrant warga adalah aset ketahanan kebakaran lingkungan; hydrant resmi punya
 * menu & halaman publiknya sendiri.
 */
class HydrantWarga extends Model
{
    use Tenantable;

    protected $guarded = [];

    protected $casts = [
        'debit_lpm' => 'integer',
    ];

    /**
     * Bentuk baris untuk daftar/peta SKKL — kembarannya `Pompa::toSkklRow()`. Keduanya WAJIB
     * memancarkan kunci yang sama; kalau tidak, kartu yang satu kehilangan badge/debit yang
     * dipunyai kartu lainnya. `source` menentukan tombol edit/hapus di daftar SKKL menunjuk
     * ke resource mana.
     */
    public function toSkklRow(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address ?? 'Alamat tidak tersedia',
            'status' => $this->status ?? 'Aktif',
            'type' => $this->type ? 'Hydrant Warga · '.$this->type : 'Hydrant Warga',
            'lat' => $this->lat,
            'lng' => $this->lng,
            'debit_lpm' => $this->debit_lpm,
            'water_pressure' => $this->water_pressure,
            // Dipakai rekap debit air per desa di daftar SKKL admin.
            'village_code' => $this->village_code,
            // Dipakai mengurutkan daftar gabungan (terbaru dulu) setelah dua sumber disatukan.
            'created_at' => $this->created_at,
            // Glyph peta: hydrant warga digambar sebagai hydrant, bukan tetes air.
            'category' => 'hydrant',
            'source' => 'hydrant_warga',
        ];
    }

    // Relasi ke wilayah — bentuknya sama persis dengan Hydrant.
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

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
 * Yang TIDAK diduplikasi: komponen form React (satu berkas, dua route, dibedakan prop
 * `variant`).
 *
 * Sejak 2026-08-21 (permintaan user) skemanya SENGAJA menyimpang dari `hydrants`, bukan lagi
 * kembarannya: hydrant warga bukan hydrant jalanan bertekanan melainkan tandon/groundtank
 * swadaya, jadi kosakatanya sendiri — `type` = sumber air, `status` = sudah/belum dimodifikasi
 * agar bisa dihisap mobil pemadam, `capacity_liter` = simpanan air. Kolom `water_pressure` dan
 * `debit_lpm` sudah dibuang di sini dan TETAP ada di `hydrants`. Kalau kamu menambah kolom,
 * pertanyaannya kini "apakah konsepnya berlaku di kedua sisi?", bukan lagi "salin ke sebelah".
 *
 * Dibaca di menu SKKL (`Admin\PompaController`, `/pumps` publik, layer SKKL Peta Pemantauan)
 * karena hydrant warga adalah aset ketahanan kebakaran lingkungan; hydrant resmi punya
 * menu & halaman publiknya sendiri.
 */
class HydrantWarga extends Model
{
    use Tenantable;

    /**
     * Sumber air swadaya yang didata Damkar. Tandon = tangki di atas permukaan, Groundtank =
     * bak tanam di bawah permukaan. Daftarnya SENGAJA pendek: yang dipakai petugas di lapangan
     * hanya dua bentuk itu, dan pilihan bebas membuat rekap per desa mustahil dikelompokkan.
     */
    public const WATER_SOURCES = ['Tandon', 'Groundtank'];

    /**
     * Status hydrant warga TIDAK memakai kosakata fasilitas lain (Aktif/Perbaikan). Yang
     * ditanya di sini bukan "rusak atau tidak" — tandon berisi air tidak rusak — melainkan
     * apakah mulutnya sudah dimodifikasi agar bisa dihisap mobil pemadam. Kata "Terdaftar"
     * hanya muncul di LABEL (lihat FACILITY_STATUS_LABELS di resources/js/lib/utils.js);
     * nilai simpanannya tetap pendek supaya query & filter tetap enak dibaca.
     */
    public const STATUSES = ['Belum Modifikasi', 'Sudah Modifikasi'];

    protected $guarded = [];

    protected $casts = [
        'capacity_liter' => 'integer',
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
            'status' => $this->status ?? self::STATUSES[0],
            'type' => $this->type ? 'Hydrant Warga · '.$this->type : 'Hydrant Warga',
            'lat' => $this->lat,
            'lng' => $this->lng,
            // Kunci `debit_lpm`/`water_pressure` tetap dipancarkan (bernilai null) demi kontrak
            // "kedua sumber memancarkan kunci yang sama" — tanpa itu kartu SKKL milik pompa
            // akan membaca properti yang tak ada pada baris hydrant warga.
            'debit_lpm' => null,
            'water_pressure' => null,
            'capacity_liter' => $this->capacity_liter,
            // Menentukan angka mana yang boleh dijumlahkan dengan angka mana di rekap desa.
            // Liter (simpanan) dan liter/menit (aliran) TIDAK boleh dijumlahkan, dan menebak
            // dari `source` berarti menuliskan nama tabel di logika perhitungan.
            'water_metric' => 'capacity',
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

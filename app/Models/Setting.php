<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    public const KEY_NOTIFY_LEVEL_PETUGAS = 'notify_level_petugas';

    public const KEY_NOTIFY_LEVEL_RELAWAN = 'notify_level_relawan';

    /**
     * Saklar "warga wajib memilih banjar saat melengkapi profil" (2026-08-26).
     *
     * DEFAULT MATI, dan itu disengaja: master banjar diisi belakangan (daftarnya harus diminta
     * ke BPS/Pemkot). Menyalakan kewajiban sebelum masternya terisi membuat dropdown kosong dan
     * pendaftaran warga MATI TOTAL di produksi — bentuk yang sama dengan #61, ketika migrasi
     * `tenants` tanpa seeder membuat warga divonis "belum terdaftar". Nyalakan lewat
     * /admin/settings SETELAH banjar wilayah tenant terisi.
     */
    public const KEY_REQUIRE_BANJAR = 'require_banjar_profile';

    // Pejabat = pemantau, bukan responder, jadi jangkauannya diatur TERPISAH dari petugas:
    // menurunkan tingkat siaran petugas ke kecamatan tidak boleh diam-diam ikut memutus
    // notifikasi pejabat kota. Default KABUPATEN (sama dengan petugas) karena pejabat di
    // repo ini praktis selalu berjurisdiksi kota/kabupaten.
    public const KEY_NOTIFY_LEVEL_PEJABAT = 'notify_level_pejabat';

    /**
     * Deteksi laporan ganda (TASK_55): laporan kebakaran dalam radius & jendela waktu ini
     * diusulkan sebagai kejadian yang sama. SETTING, bukan konstanta: 500 m / 120 menit adalah
     * tebakan awal (keputusan user 2026-09-14) yang harus bisa disetel setelah melihat data
     * nyata tanpa deploy. Radius 0 = deteksi MATI - saklar darurat bila usulannya mengganggu.
     */
    public const KEY_DUPLIKAT_RADIUS_M = 'duplikat_radius_m';

    public const KEY_DUPLIKAT_JENDELA_MENIT = 'duplikat_jendela_menit';

    public const DEFAULT_DUPLIKAT_RADIUS_M = 500;

    public const DEFAULT_DUPLIKAT_JENDELA_MENIT = 120;

    protected $fillable = ['key', 'value'];

    public static function getValue(string $key, ?string $default = null): ?string
    {
        $value = Cache::rememberForever("setting:{$key}", function () use ($key) {
            return static::where('key', $key)->value('value');
        });

        return $value ?? $default;
    }

    public static function setValue(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("setting:{$key}");
    }
}

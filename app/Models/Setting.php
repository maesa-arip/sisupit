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

<?php

namespace App\Models;

use App\Traits\HasFile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Tenant per kabupaten/kota (TASK_17). Katalog GLOBAL lintas-wilayah — sengaja TIDAK
 * memakai trait Tenantable (ia justru sumber identitas wilayah publik, bukan data
 * ter-scope). Menyimpan branding publik tiap Damkar kabupaten (nama instansi, pejabat,
 * nomor darurat) yang dulu hardcode di config/pejabat.php.
 *
 * Resolusi:
 *  - resolveFromHost($host)  → dari subdomain (untuk shell/branding + default region).
 *  - forCity($cityCode)      → dari city_code laporan (untuk Thanks — SELALU dari pin).
 *  - default()               → fallback (Denpasar / config/pejabat.php) untuk apex.
 *
 * Semua helper FAIL-SAFE: bila tabel belum ter-migrate/seed, jatuh ke config/pejabat.php
 * tanpa melempar exception (mengikuti pola tahan-belum-seed di HomeController).
 */
class Tenant extends Model
{
    use HasFile;

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Cari tenant dari Host request via subdomain-nya. Return null bila apex/unknown
     * atau tabel belum siap — pemanggil memutuskan fallback (biasanya self::default()).
     */
    public static function resolveFromHost(?string $host): ?self
    {
        $subdomain = self::subdomainFromHost($host);
        if (! $subdomain) {
            return null;
        }

        return self::tryQuery(fn () => Cache::rememberForever(
            "tenant:subdomain:{$subdomain}",
            fn () => self::query()->where('subdomain', $subdomain)->where('is_active', true)->first()
        ));
    }

    /**
     * Tenant pemilik sebuah city_code (mis. dari pin laporan). Dipakai halaman Thanks agar
     * pejabat/nomor SELALU sesuai wilayah kejadian, bukan subdomain yang dibuka.
     */
    public static function forCity(?string $cityCode): ?self
    {
        if (! $cityCode) {
            return null;
        }

        return self::tryQuery(fn () => Cache::rememberForever(
            "tenant:city:{$cityCode}",
            fn () => self::query()->where('city_code', $cityCode)->where('is_active', true)->first()
        ));
    }

    /**
     * Fallback apex/unknown: tenant "denpasar" bila ada, jika tidak bangun objek transien
     * dari config/pejabat.php agar app tetap jalan sebelum tabel ter-seed.
     */
    public static function default(): self
    {
        $denpasar = self::tryQuery(fn () => Cache::rememberForever(
            'tenant:default',
            fn () => self::query()->where('subdomain', 'denpasar')->first()
                ?? self::query()->where('is_active', true)->orderBy('id')->first()
        ));

        return $denpasar ?? self::fromConfig();
    }

    /** Objek transien (tidak tersimpan) dari config/pejabat.php — jaring pengaman terakhir. */
    public static function fromConfig(): self
    {
        return (new self)->forceFill([
            'subdomain' => 'denpasar',
            'city_code' => '5171',
            'province_code' => '51',
            'nama_instansi' => 'Dinas Pemadam Kebakaran dan Penyelamatan Kota Denpasar',
            'pejabat_nama' => config('pejabat.nama'),
            'pejabat_jabatan' => config('pejabat.jabatan'),
            'pejabat_foto' => config('pejabat.foto'),
            'telepon_darurat' => config('pejabat.telepon_darurat'),
            'is_active' => true,
        ]);
    }

    /**
     * Ekstrak subdomain dari Host. "badung.sisupit.com" → "badung". Apex/2-label/IP → null.
     * Domain dasar dari config('services.tenant.base_domain'); bila kosong pakai host APP_URL.
     */
    public static function subdomainFromHost(?string $host): ?string
    {
        if (! $host) {
            return null;
        }

        $host = strtolower(preg_replace('/:\d+$/', '', $host)); // buang port
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return null;
        }

        $base = strtolower((string) (config('services.tenant.base_domain')
            ?: parse_url((string) config('app.url'), PHP_URL_HOST)));
        $base = preg_replace('/^www\./', '', $base ?? '');

        if ($base && str_ends_with($host, '.'.$base)) {
            $sub = substr($host, 0, -(strlen($base) + 1));

            return $sub !== '' && $sub !== 'www' ? $sub : null;
        }

        // Fallback tanpa base_domain: anggap label pertama subdomain bila host ≥ 3 label.
        $labels = explode('.', $host);

        return count($labels) >= 3 ? $labels[0] : null;
    }

    /** Buang cache resolusi (dipanggil saat tenant dibuat/diubah/dihapus lewat admin). */
    public static function flushResolutionCache(): void
    {
        Cache::forget('tenant:default');
        // Kunci per-subdomain/-city dibersihkan spesifik oleh pemanggil bila perlu; default
        // + wildcard sulit di store non-tagged, jadi cukup buang default di sini dan biarkan
        // pemanggil (controller) menghapus kunci yang ia sentuh.
    }

    /** Jalankan query resolusi dengan aman; kembalikan null bila DB/tabel belum siap. */
    private static function tryQuery(callable $fn)
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function scopeFilter(Builder $query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama_instansi', 'like', '%'.$search.'%')
                    ->orWhere('subdomain', 'like', '%'.$search.'%')
                    ->orWhere('city_code', 'like', '%'.$search.'%');
            });
        });
    }

    public function scopeSorting(Builder $query, array $sorts): void
    {
        $query->when(
            ($sorts['field'] ?? null) && ($sorts['direction'] ?? null),
            fn ($query) => $query->orderBy($sorts['field'], $sorts['direction']),
            fn ($query) => $query->latest()
        );
    }
}

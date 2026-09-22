<?php

namespace App\Models;

use App\Enums\TenantEdition;
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

    /** Forum Tanya Jawab Warga (TASK_54). */
    public const FEATURE_FORUM = 'forum';

    /** Email Dinas (TASK_56). */
    public const FEATURE_MAIL = 'email_dinas';

    /**
     * Daftar putih kunci `features` beserta labelnya. Kolomnya json bebas sejak TASK_19; tanpa
     * daftar ini kunci salah ketik tersimpan diam-diam dan fiturnya tak pernah menyala.
     */
    public const FEATURES = [
        self::FEATURE_FORUM => 'Forum Tanya Jawab Warga',
        self::FEATURE_MAIL => 'Email Dinas',
    ];

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'features' => 'array',
        // Password kotak surat dinas (TASK_56). Cast `encrypted` = ciphertext di DB; kolomnya
        // TEXT karena ciphertext jauh lebih panjang dari passwordnya.
        'mail_password' => 'encrypted',
        'mail_verified_at' => 'datetime',
    ];

    /**
     * Paket layanan tenant (TASK_19). Selalu mengembalikan enum yang valid: nilai kosong /
     * tak dikenal (mis. objek transien fromConfig(), atau baris lama sebelum migrasi)
     * dianggap SEWA — default yang paling tidak mengejutkan & sesuai kontrak lama.
     */
    public function edition(): TenantEdition
    {
        // getAttributes() dulu: model yang baru di-create() belum memuat nilai default kolom
        // dari DB, dan mode strict Eloquent melempar error untuk atribut yang tak dimuat.
        $value = array_key_exists('edition', $this->getAttributes()) ? $this->getAttributes()['edition'] : null;

        return TenantEdition::tryFrom((string) $value) ?? TenantEdition::SEWA;
    }

    public function isBeli(): bool
    {
        return $this->edition() === TenantEdition::BELI;
    }

    /** Aman saat kolom `features` null / belum dimuat (tenant lama, objek transien fromConfig()). */
    public function hasFeature(string $key): bool
    {
        if (! array_key_exists('features', $this->getAttributes())) {
            return false;
        }

        return in_array($key, (array) ($this->features ?? []), true);
    }

    /**
     * Kotak surat dinas tenant ini sudah siap dipakai? (TASK_56)
     *
     * Kelima kolom ini wajib terisi. Tenant yang fiturnya menyala tapi kotak suratnya belum
     * diisi diperlakukan SAMA dengan fitur mati (route 404, menu absen) — layar kirim yang
     * muncul tapi selalu gagal terbaca sebagai bug, bukan sebagai "belum disetel"
     * (pelajaran TASK_45/#94).
     */
    public function hasMailbox(): bool
    {
        $attributes = $this->getAttributes();

        foreach (['mail_from_address', 'mail_host', 'mail_port', 'mail_username', 'mail_password'] as $kolom) {
            if (blank($attributes[$kolom] ?? null)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Nama mailer runtime kotak surat kabupaten ini.
     *
     * BER-ID TENANT, dan itu bukan hiasan: MailManager MENYIMPAN mailer yang sudah dibuat
     * per NAMA. Satu nama bersama ("dinas") berarti proses yang melayani dua kabupaten —
     * queue worker, atau dua request beruntun di php-fpm yang sama — memakai ulang kredensial
     * kabupaten yang lebih dulu memakainya, sehingga surat kabupaten kedua terkirim dari
     * kotak surat kabupaten pertama TANPA satu pun galat.
     */
    public function mailerName(): string
    {
        return 'dinas_'.$this->getKey();
    }

    /**
     * Konfigurasi mailer RUNTIME untuk kotak surat kabupaten ini. Didaftarkan ke
     * `mail.mailers.{mailerName}` lalu dipakai lewat Mail::mailer(), BUKAN mailer bawaan.
     *
     * Surat dinas TIDAK BOLEH lewat mailer bawaan: `.env` adalah alamat SISTEM (verifikasi
     * pendaftaran & reset password), dan surat resmi Damkar yang terkirim dari alamat sistem
     * Sisupit bukan cacat kosmetik — penerimanya pejabat. Lihat TASK_56 §1.2.
     *
     * Mailer BERNAMA, bukan Mail::build(): `Mail::fake()` (MailFake) tidak punya build(),
     * sehingga jalur kirim yang memakainya mustahil diuji — dan jalur kirim yang tak bisa
     * diuji adalah jalur yang gerbangnya akan diam-diam jebol. Mendaftarkan mailer BARU juga
     * tidak menyentuh `mail.default` maupun `mail.mailers.smtp`, jadi email sistem tetap utuh.
     */
    public function mailerConfig(): array
    {
        return [
            'transport' => 'smtp',
            'host' => $this->mail_host,
            'port' => (int) $this->mail_port,
            'encryption' => $this->mail_encryption ?: null,
            'username' => $this->mail_username,
            'password' => $this->mail_password,
            'timeout' => 15,
        ];
    }

    /**
     * Tenant yang kotak suratnya dipakai akun ini, atau null bila Email Dinas tak tersedia
     * untuknya (fitur mati, atau kotak surat belum diisi).
     *
     * Dibaca dari `city_code` AKUN — bukan subdomain, bukan parameter request. Pola yang sama
     * dengan ForumThread::enabledFor(). Akun tanpa kabupaten (termasuk superadmin nasional)
     * mendapat null: mengirim surat dinas menuntut kotak surat milik sebuah kabupaten, dan
     * tidak ada kabupaten yang "default" untuk itu.
     *
     * SENGAJA TIDAK memakai forCity(): fungsi itu meng-cache tenant selamanya, sehingga admin
     * yang baru memperbarui kredensialnya akan terus mengirim lewat kredensial lama sampai
     * cache dibuang — gagal yang tak akan pernah ia hubungkan dengan perubahannya sendiri.
     * Mengirim surat juga bukan jalur panas (beberapa per hari), jadi satu query itu murah.
     */
    public static function mailboxFor(?User $user): ?self
    {
        if (! $user || ! $user->city_code) {
            return null;
        }

        $tenant = self::tryQuery(fn () => self::query()
            ->where('city_code', $user->city_code)
            ->where('is_active', true)
            ->first());

        if (! $tenant || ! $tenant->hasFeature(self::FEATURE_MAIL) || ! $tenant->hasMailbox()) {
            return null;
        }

        return $tenant;
    }

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
            'edition' => TenantEdition::SEWA->value,
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

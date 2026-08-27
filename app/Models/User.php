<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Enums\TenantLevel;
use App\Enums\UserGender;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;
use NotificationChannels\WebPush\HasPushSubscriptions;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasPushSubscriptions, HasRoles, Notifiable;

    /**
     * Peran yang kode wilayahnya boleh kosong SECARA SENGAJA — mereka dikelola terpusat
     * lewat Admin\UserController (assignRole + trimRegionToLevel yang meng-null-kan kolom
     * di bawah tingkat yurisdiksinya), bukan lewat onboarding mandiri.
     *
     * Ini satu-satunya pembeda antara "sengaja luas" dan "profil belum lengkap" (#56):
     * bentuk datanya identik (kolom NULL), yang berbeda hanya perannya. Dipakai
     * EnsureProfileComplete (siapa yang tak wajib onboarding) dan scopeNotifiableForReport
     * (siapa yang kolom kosongnya berarti nasional).
     *
     * @var list<string>
     */
    public const STAFF_ROLES = ['superadmin', 'admin', 'petugas', 'pejabat'];

    /**
     * Peran yang akunnya dibuat & diberi wilayah oleh admin, bukan lewat pendaftaran mandiri —
     * karena itu tidak boleh dipaksa lewat onboarding `EnsureProfileComplete` (akun OPD tingkat
     * kabupaten memang tak punya `village_code`, persis seperti petugas kabupaten).
     *
     * SENGAJA TERPISAH dari STAFF_ROLES, jangan digabung: STAFF_ROLES menjawab pertanyaan lain
     * — "kolom wilayah kosong berarti yurisdiksi nasional" (#56). Memasukkan `opd` ke sana akan
     * membuat akun OPD berprofil kosong menerima siaran darurat se-Indonesia, regresi yang persis
     * sama dengan yang baru diperbaiki untuk relawan.
     *
     * @var list<string>
     */
    public const CENTRALLY_MANAGED_ROLES = [...self::STAFF_ROLES, 'opd'];

    /**
     * Peran yang boleh mematikan/menghidupkan siaganya sendiri lewat `users.is_standby`,
     * sehingga siaran insiden (ReportActionController::approve) melewatinya saat nonaktif.
     *
     * SENGAJA hanya dua: relawan (yang memang tak bertugas 24 jam) dan pejabat (pemantau,
     * bukan responder — dia tak boleh dibangunkan sirine kalau tak mau). Petugas & admin
     * TIDAK di sini: mematikan notifikasi Pusat Komando berarti laporan warga bisa menganggur
     * tanpa ada yang tahu. Kolom `is_standby` ada di semua baris users (default true), jadi
     * peran di luar daftar ini tetap punya nilainya — daftar inilah yang membuatnya berarti.
     *
     * @var list<string>
     */
    public const STANDBY_ROLES = ['relawan', 'pejabat'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'email_verified_at',
        'terms_accepted_at',
        'password',
        'phone',
        'avatar',
        'gender',
        'date_of_birth',
        'address',
        'ktp',
        'province_code',
        'city_code',
        'district_code',
        'village_code',
        'is_standby',
        'skills',
        'agency_id',
        'banjar_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Tambahkan Local Scope ini di dalam Model User
    public function scopeIsAdmin(Builder $query)
    {
        $admin = auth()->user();

        // Jika Superadmin, jangan di-filter (bisa lihat semua)
        if ($admin->hasRole('superadmin')) {
            return $query;
        }

        // Filter berdasarkan Yurisdiksi Admin yang login
        if ($admin->village_code) {
            $query->where('village_code', $admin->village_code);
        } elseif ($admin->district_code) {
            $query->where('district_code', $admin->district_code);
        } elseif ($admin->city_code) {
            $query->where('city_code', $admin->city_code);
        } elseif ($admin->province_code) {
            $query->where('province_code', $admin->province_code);
        } else {
            // Admin non-superadmin TANPA kode wilayah → JANGAN beri daftar NASIONAL (analog
            // bug #44 di Tenantable): mis. akun yang belum melengkapi wilayah tak boleh melihat
            // seluruh pengguna nasional. Kosongkan; superadmin sudah bypass di atas.
            $query->whereRaw('1 = 0');
        }

        return $query;
    }

    /**
     * Apakah user ini berwenang atas insiden DI WILAYAH laporan. Sumber kebenaran tunggal
     * untuk pembatasan yurisdiksi laporan (dipakai di ReportActionController,
     * ReportController::show, dan routes/channels.php). HANYA superadmin yang lintas wilayah;
     * user tanpa kode wilayah (mis. akun belum melengkapi profil) TIDAK berwenang atas laporan
     * mana pun (#44 — jangan beri akses nasional). Untuk staf wilayah, level paling spesifik
     * user dicocokkan dengan kolom laporan yang sederajat.
     */
    /**
     * Kolom wilayah TERSEMPIT yang terisi ('village_code' … 'province_code'), atau null bila
     * keempatnya kosong — maknanya bergantung peran, lihat STAFF_ROLES.
     *
     * Rumus ini dulu ditulis ulang di empat tempat (withinReportJurisdiction + tiga cabang
     * DashboardController). Disatukan saat feed realtime dibuat karena rumus yang sama harus
     * menentukan DUA hal sekaligus: apa yang tersaring ke dashboard, DAN channel mana yang
     * membangunkannya. Begitu keduanya diturunkan dari rumus berbeda, dashboard bisa diam
     * saat ada kejadian yang sebenarnya masuk daftarnya — tanpa galat, tanpa gejala
     * (bentuk yang sama dengan #60/#78).
     */
    public function narrowestJurisdictionColumn(): ?string
    {
        foreach (['village_code', 'district_code', 'city_code', 'province_code'] as $column) {
            if ($this->{$column}) {
                return $column;
            }
        }

        return null;
    }

    public function withinReportJurisdiction(Report $report): bool
    {
        if ($this->hasRole('superadmin')) {
            return true;
        }

        $column = $this->narrowestJurisdictionColumn();

        if ($column === null) {
            // Non-superadmin tanpa kode wilayah → bukan wewenang atas laporan apa pun.
            return false;
        }

        return $this->{$column} === $report->{$column};
    }

    /**
     * Tingkat yurisdiksi user (desa/kecamatan/kabupaten/provinsi) menurut kolom wilayah
     * terdalam yang terisi. `null` berarti tanpa kode wilayah — maknanya bergantung peran,
     * lihat STAFF_ROLES.
     */
    public function jurisdictionLevel(): ?TenantLevel
    {
        return TenantLevel::forCodes(
            $this->province_code,
            $this->city_code,
            $this->district_code,
            $this->village_code,
        );
    }

    /**
     * Nama channel realtime tempat akun ini mendengar perubahan feed laporan, atau null bila
     * tak ada yang perlu didengar. PASANGAN dari penyaringan di DashboardController — lihat
     * narrowestJurisdictionColumn(). routes/channels.php mengotorisasi dengan MEMBANDINGKAN
     * permintaan ke nilai fungsi ini, jadi sebuah akun hanya boleh masuk ke channel yang
     * memang jatahnya; tak ada aturan kedua yang bisa menyimpang.
     *
     * Urutan pemeriksaannya mengikat:
     * 1. superadmin — dashboardnya TIDAK disaring wilayah sama sekali, jadi ia harus dapat
     *    'reports.all' sekalipun kolom wilayahnya kebetulan terisi.
     * 2. opd — relevansinya KEANGGOTAAN (report_agencies), bukan wilayah; akun OPD memang
     *    sengaja tanpa kode wilayah (#44), sehingga cabang wilayah di bawah tak akan pernah
     *    cocok untuknya.
     * 3. staf tanpa kode wilayah = wewenang nasional (TASK_23); non-staf tanpa kode wilayah
     *    tidak berwenang atas apa pun (#44) → null, bukan 'reports.all'.
     */
    public function reportFeedChannel(): ?string
    {
        if ($this->hasRole('superadmin')) {
            return 'reports.all';
        }

        if ($this->hasRole('opd')) {
            return $this->agency_id ? 'reports.agency.'.$this->agency_id : null;
        }

        $column = $this->narrowestJurisdictionColumn();

        if ($column === null) {
            return $this->hasAnyRole(self::STAFF_ROLES) ? 'reports.all' : null;
        }

        return 'reports.'.str_replace('_code', '', $column).'.'.$this->{$column};
    }

    public function socialAccounts()
    {
        return $this->hasMany(SocialAccount::class);
    }

    /** Instansi yang diwakili akun berperan `opd` (TASK_27); null untuk peran lain. */
    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

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

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    // Relasi ke tabel fcm_tokens
    public function fcmTokens()
    {
        return $this->hasMany(FcmToken::class);
    }

    // Fungsi wajib agar Laravel tahu ke mana token harus dikirim
    public function routeNotificationForFcm()
    {
        return $this->fcmTokens()->pluck('token')->toArray();
    }

    public function scopeFilter(Builder $query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->whereAny([
                    'name',
                    'username',
                    'email',
                    'phone',
                    'gender',
                ], 'REGEXP', $search);
            });
        });
    }

    public function scopeSorting(Builder $query, array $sorts): void
    {
        $query->when($sorts['field'] ?? null && $sorts['direction'] ?? null, function ($query) use ($sorts) {
            $query->orderBy($sorts['field'], $sorts['direction']);
        });
    }

    /**
     * Notifikasi laporan selalu mulai dari wilayah desa laporan, lalu cascade naik
     * (kecamatan -> kabupaten -> provinsi) sampai batas $ceiling yang dikonfigurasi
     * via Setting. Superadmin dan user tanpa kode wilayah (admin nasional) selalu
     * ikut, mengikuti pola bypass yang sama dengan Tenantable::bootTenantable().
     */
    public function scopeNotifiableForReport(Builder $query, Report $report, TenantLevel $ceiling): Builder
    {
        return $query->where(function (Builder $query) use ($report, $ceiling) {
            $query->whereHas('roles', fn ($q) => $q->where('name', 'superadmin'));

            // Jaring pengaman "tanpa kode wilayah = nasional" HANYA berlaku untuk peran staf
            // (#56). Bagi masyarakat/relawan kolom kosong berarti profil belum lengkap, bukan
            // yurisdiksi nasional — dulu mereka ikut cabang ini dan menerima sirine untuk
            // kebakaran di seluruh Indonesia, dan EnsureProfileComplete tidak menghalanginya
            // karena push FCM tidak lewat middleware HTTP. Sejalan dengan #44 yang sudah
            // ditegakkan di withinReportJurisdiction() dan scopeIsAdmin().
            $query->orWhere(function (Builder $q) {
                $q->whereNull('village_code')
                    ->whereNull('district_code')
                    ->whereNull('city_code')
                    ->whereNull('province_code')
                    ->whereHas('roles', fn ($r) => $r->whereIn('name', self::STAFF_ROLES));
            });

            if ($report->village_code) {
                $query->orWhere('village_code', $report->village_code);
            }

            foreach ([
                [TenantLevel::KECAMATAN, 'district_code', ['village_code']],
                [TenantLevel::KABUPATEN, 'city_code', ['village_code', 'district_code']],
                [TenantLevel::PROVINSI, 'province_code', ['village_code', 'district_code', 'city_code']],
            ] as [$level, $column, $mustBeNull]) {
                if ($ceiling->rank() <= $level->rank() && $report->$column) {
                    $query->orWhere(function (Builder $q) use ($column, $report, $mustBeNull) {
                        foreach ($mustBeNull as $nullColumn) {
                            $q->whereNull($nullColumn);
                        }
                        $q->where($column, $report->$column);
                    });
                }
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'password' => 'hashed',
            'gender' => UserGender::class,
            'date_of_birth' => 'date',
            'is_standby' => 'boolean',
            'skills' => 'array',
        ];
    }
}

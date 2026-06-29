<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Enums\TenantLevel;
use App\Enums\UserGender;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'email_verified_at',
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
        }

        return $query;
    }

    public function socialAccounts()
    {
        return $this->hasMany(SocialAccount::class);
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

            $query->orWhere(function (Builder $q) {
                $q->whereNull('village_code')
                    ->whereNull('district_code')
                    ->whereNull('city_code')
                    ->whereNull('province_code');
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
            'password' => 'hashed',
            'gender' => UserGender::class,
            'date_of_birth' => 'date',
            'is_standby' => 'boolean',
            'skills' => 'array',
        ];
    }
}

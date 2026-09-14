<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Pertanyaan di Forum Tanya Jawab Warga (TASK_54). Satu ruang per kabupaten/kota.
 *
 * Wilayahnya HANYA province_code + city_code, diambil dari akun penulis (bukan dari request).
 * Lihat migrasi 2026_09_14_100000 untuk alasan district/village dibiarkan NULL.
 */
class ForumThread extends Model
{
    use SoftDeletes, Tenantable;

    /** Pertanyaan warga baru menunggu admin (keputusan user 2026-09-14, pra-moderasi). */
    public const STATUS_MENUNGGU = 'menunggu';

    public const STATUS_TAMPIL = 'tampil';

    public const STATUS_DISEMBUNYIKAN = 'disembunyikan';

    public const STATUSES = [self::STATUS_MENUNGGU, self::STATUS_TAMPIL, self::STATUS_DISEMBUNYIKAN];

    protected $guarded = [];

    protected $casts = [
        'is_pinned' => 'boolean',
        'last_activity_at' => 'datetime',
        'moderated_at' => 'datetime',
    ];

    /** Moderator & pemberi "Jawaban Resmi Damkar" = admin saja (keputusan user 2026-09-14). */
    public static function canModerate(?User $user): bool
    {
        return (bool) $user?->hasAnyRole(['admin', 'superadmin']);
    }

    /**
     * Forum menyala per kabupaten lewat `tenants.features`. Tenant dibaca dari city_code AKUN,
     * bukan dari subdomain yang sedang dibuka - warga Badung yang membuka apex tetap berada di
     * forum Badung (pola halaman Thanks, TASK_17).
     */
    public static function enabledFor(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        // Superadmin memoderasi lintas kabupaten; ia tak punya kabupaten untuk dicek.
        if ($user->hasRole('superadmin')) {
            return true;
        }

        return (bool) Tenant::forCity($user->city_code)?->hasFeature(Tenant::FEATURE_FORUM);
    }

    /** Pembaca biasa hanya melihat yang tampil + miliknya sendiri; moderator melihat semuanya. */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if (self::canModerate($user)) {
            return;
        }

        $query->where(fn (Builder $q) => $q->where('status', self::STATUS_TAMPIL)->orWhere('user_id', $user->id));
    }

    public function isVisibleTo(User $user): bool
    {
        return $this->status === self::STATUS_TAMPIL
            || $this->user_id === $user->id
            || self::canModerate($user);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(ForumPost::class);
    }

    public function flags(): MorphMany
    {
        return $this->morphMany(ForumFlag::class, 'flaggable');
    }

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }
}

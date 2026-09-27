<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Regu petugas Damkar + danru (komandan regu) - TASK_60.
 *
 * Danru = `leader_id`, BUKAN peran Spatie: lihat docblock migrasi
 * 2026_09_25_100000_create_regus_tables. Danru selalu juga anggota regunya sendiri (baris
 * regu_members), supaya "anggota regu" cukup dibaca dari satu tempat.
 *
 * Wilayahnya = kabupaten danru (district/village NULL), jadi Tenantable membuatnya terlihat
 * oleh admin & petugas sekabupaten, dan tertutup bagi kabupaten lain.
 */
class Regu extends Model
{
    use SoftDeletes, Tenantable;

    protected $table = 'regus';

    protected $guarded = [];

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'regu_members')->withTimestamps();
    }

    /**
     * Regu milik seorang petugas, atau null. Dicari lewat KEANGGOTAAN, bukan lewat wilayah:
     * keanggotaan itu sendiri otorisasinya (ia hanya bisa dibuat admin sekabupaten atau
     * danrunya), jadi scope Tenantable dilepas di sini - tanpa itu petugas yang akunnya kebetulan
     * belum berkode wilayah lengkap tak akan pernah menemukan regunya sendiri dan tombolnya
     * diam-diam kembali jadi Meluncur perorangan. SoftDeletes tetap berlaku (hanya scope
     * 'tenant' yang dilepas): regu yang sudah dihapus bukan regu siapa pun.
     */
    public static function milik(User $user): ?self
    {
        return static::withoutGlobalScope('tenant')
            ->whereHas('members', fn ($q) => $q->whereKey($user->id))
            ->first();
    }

    public function isLeader(User $user): bool
    {
        return (int) $this->leader_id === (int) $user->id;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Undangan menjadi petugas lewat email (2026-11-06, migrasi 2026_11_06_100100). Sengaja TANPA
 * Tenantable: penerimanya belum login / belum berwilayah, jadi pintu masuknya token. Daftar
 * di panel admin disaring eksplisit lewat scopeWithinRegionOf().
 */
class UserInvitation extends Model
{
    public const VALID_DAYS = 7;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /** Token asli dikembalikan SEKALI untuk email; yang disimpan hanya hash-nya. */
    public static function newToken(): string
    {
        return Str::random(48);
    }

    /** Undangan yang belum dipakai & belum kedaluwarsa, dicari dari token di tautan. */
    public static function findUsable(string $token): ?self
    {
        return static::where('token_hash', static::hashToken($token))
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    public function status(): string
    {
        if ($this->accepted_at) {
            return 'diterima';
        }

        return $this->expires_at->isPast() ? 'kedaluwarsa' : 'menunggu';
    }

    /** Nama wilayah paling rinci dari sekumpulan kode (email, daftar undangan, halaman terima). */
    public static function regionNameOf(array $codes): ?string
    {
        $tables = [
            'village_code' => 'indonesia_villages',
            'district_code' => 'indonesia_districts',
            'city_code' => 'indonesia_cities',
            'province_code' => 'indonesia_provinces',
        ];
        foreach ($tables as $column => $table) {
            if (! empty($codes[$column])) {
                return DB::table($table)->where('code', $codes[$column])->value('name');
            }
        }

        return null;
    }

    public function regionCodes(): array
    {
        return $this->only(['province_code', 'city_code', 'district_code', 'village_code']);
    }

    /**
     * Undangan yang wilayahnya DI DALAM wilayah admin ini: tiap kode yang dimiliki admin harus
     * sama persis (bukan NULL = "lebih luas" seperti Tenantable) - admin kecamatan tak boleh
     * melihat/membatalkan undangan tingkat kabupaten. Superadmin melihat semua.
     */
    public function scopeWithinRegionOf(Builder $query, User $admin): Builder
    {
        if ($admin->hasRole('superadmin')) {
            return $query;
        }

        $codes = array_filter($admin->only(['province_code', 'city_code', 'district_code', 'village_code']));
        if (empty($codes)) {
            return $query->whereRaw('1 = 0');
        }

        foreach ($codes as $column => $code) {
            $query->where($column, $code);
        }

        return $query;
    }
}

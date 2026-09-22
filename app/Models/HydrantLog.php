<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Satu baris riwayat suntingan hydrant resmi - siapa, kapan, kolom apa dari nilai apa ke apa.
 * APPEND-ONLY; lihat migrasi 2026_09_22_110000_create_hydrant_logs_table untuk alasan snapshot.
 *
 * Ditulis EKSPLISIT dari Admin\HydrantController (store & update), bukan model event: jejak ini
 * menjawab "siapa yang mengubah lewat aplikasi", dan event model akan ikut mencatat seeder &
 * perintah artisan sebagai penyunting tanpa nama.
 */
class HydrantLog extends Model
{
    public const UPDATED_AT = null;

    public const ACTION_CREATED = 'dibuat';

    public const ACTION_UPDATED = 'diubah';

    /**
     * Kolom yang dicatat berikut labelnya - SAMA dengan label form di Admin/Hydrants/Edit.jsx.
     * Kolom di luar daftar ini (timestamps, province_code) tidak pernah masuk riwayat.
     * lat & lng sengaja digabung jadi satu entri "Titik Lokasi" di diff().
     */
    public const FIELD_LABELS = [
        'name' => 'Nama Hydrant',
        'address' => 'Alamat',
        'status' => 'Status',
        'type' => 'Konstruksi',
        'water_pressure' => 'Kondisi Air',
        'debit_lpm' => 'Debit Air',
        'description' => 'Keterangan',
        'city_code' => 'Kabupaten/Kota',
        'district_code' => 'Kecamatan',
        'village_code' => 'Desa/Kelurahan',
    ];

    /** Kolom wilayah → tabel namanya. Riwayat menyimpan NAMA, bukan kode (#78). */
    private const REGION_TABLES = [
        'city_code' => 'indonesia_cities',
        'district_code' => 'indonesia_districts',
        'village_code' => 'indonesia_villages',
    ];

    /** Peran yang bisa menyunting hydrant, urut wewenang - yang pertama dimiliki yang dicatat. */
    private const EDITOR_ROLES = ['superadmin', 'admin', 'petugas'];

    protected $guarded = [];

    protected $casts = [
        'changes' => 'array',
    ];

    public function hydrant()
    {
        return $this->belongsTo(Hydrant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function record(Hydrant $hydrant, string $action, ?array $changes = null): self
    {
        $user = auth()->user();

        return static::create([
            'hydrant_id' => $hydrant->id,
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'Sistem',
            'user_role' => collect(self::EDITOR_ROLES)->first(fn ($role) => $user?->hasRole($role)),
            'action' => $action,
            'changes' => $changes,
        ]);
    }

    /**
     * Daftar perubahan antara nilai sebelum simpan ($before) dan kolom yang ditandai berubah
     * oleh Eloquent ($changes = getChanges()).
     *
     * getChanges() SAJA tidak cukup: untuk kolom tanpa cast Eloquent membandingkan angka sebagai
     * STRING, jadi "-8.69" dari database vs "-8.6900" dari form tercatat berubah - dan setiap
     * simpan akan menulis "Titik Lokasi" yang sebenarnya tak bergeser. Karena itu nilai yang
     * sama secara angka disaring lagi di sini.
     */
    public static function diff(array $before, array $changes): array
    {
        $changes = array_filter(
            $changes,
            fn ($value, $field) => ! self::sameNumber($before[$field] ?? null, $value),
            ARRAY_FILTER_USE_BOTH,
        );
        $rows = [];

        if (array_key_exists('lat', $changes) || array_key_exists('lng', $changes)) {
            $rows[] = [
                'field' => 'location',
                'label' => 'Titik Lokasi',
                'old' => self::coordinate($before['lat'] ?? null, $before['lng'] ?? null),
                'new' => self::coordinate($changes['lat'] ?? $before['lat'] ?? null, $changes['lng'] ?? $before['lng'] ?? null),
            ];
        }

        foreach (self::FIELD_LABELS as $field => $label) {
            if (! array_key_exists($field, $changes)) {
                continue;
            }

            $rows[] = [
                'field' => $field,
                'label' => $label,
                'old' => self::display($field, $before[$field] ?? null),
                'new' => self::display($field, $changes[$field]),
            ];
        }

        return $rows;
    }

    private static function sameNumber($old, $new): bool
    {
        return is_numeric($old) && is_numeric($new) && (float) $old === (float) $new;
    }

    private static function display(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (isset(self::REGION_TABLES[$field])) {
            return DB::table(self::REGION_TABLES[$field])->where('code', $value)->value('name')
                ?? "Kode {$value} (tidak dikenal)";
        }

        return (string) $value;
    }

    private static function coordinate($lat, $lng): ?string
    {
        return ($lat === null || $lng === null) ? null : "{$lat}, {$lng}";
    }
}

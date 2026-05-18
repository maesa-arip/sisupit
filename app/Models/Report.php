<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

class Report extends Model
{
    use Tenantable;
    protected $fillable = [ 
        'user_id',
        'name',
        'phone',
        'title',
        'description',
        'address',
        'lat',
        'lng',
        'status',
        'photo',
        'province_code',
        'city_code',
        'district_code',
        'village_code',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    /**
     * Get all of the helpers for the Report
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function helpers(): HasMany
    {
        return $this->hasMany(ReportHelper::class, 'report_id', 'id');
    }
    public function officers(): HasMany
    {
        return $this->hasMany(ReportOfficer::class, 'report_id', 'id');
    }
     // 3. Relasi ke wilayah
    public function province() {
        return $this->belongsTo(Province::class, 'province_code', 'code');
    }
    public function city() {
        return $this->belongsTo(City::class, 'city_code', 'code');
    }
    public function district() {
        return $this->belongsTo(District::class, 'district_code', 'code');
    }
    public function village() {
        return $this->belongsTo(Village::class, 'village_code', 'code');
    }
    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                // Cari berdasarkan judul, alamat, atau nama pelapor
                $query->where('title', 'like', '%' . $search . '%')
                      ->orWhere('address', 'like', '%' . $search . '%')
                      ->orWhere('name', 'like', '%' . $search . '%');
            });
        });
    }

    /**
     * Scope untuk Sorting / Pengurutan
     */
    public function scopeSorting($query, array $sorts)
    {
        $query->when($sorts['field'] ?? null, function ($query, $field) use ($sorts) {
            // Urutkan berdasarkan field dan direction (asc/desc)
            $query->orderBy($field, $sorts['direction'] ?? 'asc');
        });
    }
}

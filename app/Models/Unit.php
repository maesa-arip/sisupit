<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

/**
 * Armada/Unit (TASK_09). Ter-scope wilayah via Tenantable + homebase ke PosPemadam.
 * status: available / dispatched / maintenance. Pola $guarded=[] mengikuti Pompa/PosPemadam.
 */
class Unit extends Model
{
    use Tenantable, SoftDeletes;

    protected $guarded = [];

    public function posPemadam(): BelongsTo
    {
        return $this->belongsTo(PosPemadam::class, 'pos_pemadam_id');
    }

    public function reportUnits(): HasMany
    {
        return $this->hasMany(ReportUnit::class);
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
}

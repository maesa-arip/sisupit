<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'title',
        'description',
        'address',
        'location_lat',
        'location_lng',
        'status',
        'photo',
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
}

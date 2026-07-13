<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportResolutionPhoto extends Model
{
    protected $fillable = [
        'report_resolution_id',
        'path',
    ];

    public function resolution(): BelongsTo
    {
        return $this->belongsTo(ReportResolution::class, 'report_resolution_id');
    }
}

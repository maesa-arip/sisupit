<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Dipakai oleh ReportHelperController via Eloquent. ReportActionController sengaja TIDAK
// memakai model ini - lihat catatan di app/Http/Controllers/ReportActionController.php
// (perlu lockForUpdate() untuk cegah double-insert saat respons konkuren).
class ReportHelper extends Model
{
    protected $fillable = [
        'user_id',
        'report_id',
        'location_lat',
        'location_lng',
        'status',
    ];
    /**
     * Get the report that owns the ReportHelper
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }
    /**
     * Get the user that owns the ReportHelper
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

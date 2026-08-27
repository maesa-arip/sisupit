<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportVictim extends Model
{
    protected $fillable = [
        'report_resolution_id',
        'nama',
        'tanggal_lahir',
        'alamat',
        // Kondisi Korban (TASK_49): luka bakar ringan / sesak napas / meninggal di lokasi.
        'kondisi',
        'ktp_path',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
    ];

    public function resolution(): BelongsTo
    {
        return $this->belongsTo(ReportResolution::class, 'report_resolution_id');
    }
}

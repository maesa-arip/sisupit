<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportResolution extends Model
{
    protected $fillable = [
        'report_id',
        'created_by',
        'status',
        'jenis_kejadian',
        'sumber_informasi',
        'occurred_at',
        'lokasi_alamat',
        'kelurahan',
        'kecamatan',
        'pemilik_nama',
        'pemilik_umur',
        'kerugian',
        'tim_atensi',
        'kronologi',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function victims(): HasMany
    {
        return $this->hasMany(ReportVictim::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ReportResolutionPhoto::class);
    }
}

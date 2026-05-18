<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrackingLog extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    // Relasi ke Laporan
    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    // Relasi ke User (Petugas/Relawan)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
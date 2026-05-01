<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pompa extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Kolom yang dapat diisi secara massal (Mass Assignment)
     */
    protected $fillable = [
        'name',
        'address',
        'type',
        'status',
        'capacity_lpm',
        'location_lat',
        'location_lng',
        'description',
    ];

    /**
     * Konversi tipe data otomatis (Casting)
     */
    protected $casts = [
        // Memastikan koordinat dikirim sebagai angka pecahan (float/real) ke Frontend
        'location_lat' => 'decimal:8',
        'location_lng' => 'decimal:8',
        'capacity_lpm' => 'integer',
    ];

    /**
     * Scope untuk memfilter hanya pompa yang siap pakai
     * Cara pakai di controller: Pompa::ready()->get();
     */
    public function scopeReady($query)
    {
        return $query->where('status', 'Aktif');
    }
}

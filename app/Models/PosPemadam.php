<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PosPemadam extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'address', 'phone', 'vehicle_count', 'type', 'status', 'location_lat', 'location_lng'
    ];

    protected $casts = [
        'location_lat' => 'decimal:8',
        'location_lng' => 'decimal:8',
        'vehicle_count' => 'integer',
    ];
}

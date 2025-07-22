<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}

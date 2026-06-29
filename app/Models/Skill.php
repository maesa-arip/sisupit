<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Skill extends Model
{
    protected $fillable = ['name'];

    protected static function booted(): void
    {
        // Master keahlian jarang berubah; cache daftar nama & invalidate saat berubah.
        static::saved(fn () => Cache::forget('skills:options'));
        static::deleted(fn () => Cache::forget('skills:options'));
    }

    /**
     * Daftar nama keahlian terurut (urutan kurasi seeder), sumber tunggal untuk
     * editor keahlian relawan (Dashboard), validasi (VolunteerController), dan
     * filter Daftar Relawan (RelawanController).
     *
     * @return array<int, string>
     */
    public static function options(): array
    {
        return Cache::rememberForever('skills:options', fn () => static::orderBy('id')->pluck('name')->all());
    }
}

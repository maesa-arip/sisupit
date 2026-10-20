<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SocialAccount extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $hidden = ['refresh_token'];

    protected function casts(): array
    {
        return [
            // Refresh token Apple - kredensial jangka panjang, jangan tersimpan polos.
            'refresh_token' => 'encrypted',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

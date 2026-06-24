<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Dipakai oleh ReportHelperController via Eloquent. ReportActionController sengaja TIDAK
// memakai model ini - lihat catatan di app/Http/Controllers/ReportActionController.php
// (perlu lockForUpdate() untuk cegah double-insert saat respons konkuren).
class ReportOfficer extends Model
{
   public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function report()
    {
        return $this->belongsTo(Report::class);
    }
}

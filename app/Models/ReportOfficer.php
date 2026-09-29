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

    // Siapa yang menekan "Tiba" untuk baris ini (#154) - bisa rekan seregu. Bernama arriver(),
    // BUKAN arrivedBy(): model dikirim utuh ke halaman detail dan relasi diserialisasi
    // ter-snake_case, jadi `arrived_by` akan tertimpa objek (pola Report::resolver()).
    public function arriver()
    {
        return $this->belongsTo(User::class, 'arrived_by');
    }
}

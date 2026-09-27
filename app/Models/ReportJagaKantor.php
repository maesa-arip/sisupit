<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Anggota regu yang memilih "Jaga di Kantor" untuk satu kejadian (TASK_60). Tepat satu per
 * regu per kejadian - dijaga UNIQUE(report_id, regu_id) di database. Nama regu di-snapshot
 * seperti report_officers.regu_name. Sengaja tabel sendiri, bukan status di report_officers
 * (alasannya di migrasi 2026_09_25_100000_create_regus_tables).
 */
class ReportJagaKantor extends Model
{
    protected $table = 'report_jaga_kantor';

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

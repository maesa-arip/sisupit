<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Anggota regu yang "alpha" pada satu kejadian (TASK_66): regunya ikut dipanggil - minimal
 * satu anggotanya Meluncur atau Jaga di Kantor - tapi ia sendiri tidak memilih keduanya sampai
 * kejadian ditutup. DATA INTERNAL: hanya admin/superadmin yang melihatnya (detail kejadian &
 * Export Excel), keputusan user 2026-09-29.
 *
 * Regu yang TAK SATU PUN anggotanya menanggapi tidak dihitung: tanpa tanda bahwa regu itu
 * sedang bertugas saat panggilan masuk, menandai seluruh anggotanya alpha akan menuduh regu
 * yang memang sedang lepas jaga.
 */
class ReportAlpha extends Model
{
    protected $table = 'report_alpha';

    protected $guarded = [];

    /**
     * Catat alpha untuk kejadian yang baru ditutup. Keanggotaan dibaca SAAT INI (seperti
     * "Belum memilih" di manifes), lalu di-snapshot. Idempoten lewat UNIQUE(report_id, user_id).
     */
    public static function recordFor(Report $report): void
    {
        $reguIds = DB::table('report_officers')->where('report_id', $report->id)->whereNotNull('regu_id')->pluck('regu_id')
            ->merge(DB::table('report_jaga_kantor')->where('report_id', $report->id)->whereNotNull('regu_id')->pluck('regu_id'))
            ->unique();

        if ($reguIds->isEmpty()) {
            return;
        }

        $chosen = DB::table('report_officers')->where('report_id', $report->id)->pluck('user_id')
            ->merge(DB::table('report_jaga_kantor')->where('report_id', $report->id)->pluck('user_id'));

        // Scope tenant dilepas: id regunya datang dari baris responder kejadian INI sendiri,
        // bukan dari request - itulah re-check kepemilikannya (aturan emas #7).
        $regus = Regu::withoutGlobalScope('tenant')->with('members:id,name')->whereIn('id', $reguIds)->get();

        $now = now();
        $rows = [];
        foreach ($regus as $regu) {
            foreach ($regu->members->whereNotIn('id', $chosen) as $member) {
                $rows[] = [
                    'report_id' => $report->id,
                    'regu_id' => $regu->id,
                    'regu_name' => $regu->name,
                    'user_id' => $member->id,
                    'user_name' => $member->name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($rows) {
            DB::table('report_alpha')->insertOrIgnore($rows);
        }
    }
}

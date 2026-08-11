<?php

use App\Models\Report;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
// 👇 TAMBAHKAN KODE INI UNTUK SISUPIT 👇
Broadcast::channel('report-tracking.{reportId}', function ($user, $reportId) {
    // withoutGlobalScopes: global scope Tenantable memfilter laporan ke wilayah user yang
    // login, sehingga relawan/pelapor DI LUAR desa laporan tak pernah menemukan laporannya
    // dan ditolak walau berhak (mis. relawan yang sudah mengambil tugas lintas desa — lihat
    // #42 yang menegaskan keanggotaan, bukan wilayah). Otorisasi TIDAK dilonggarkan: ketiga
    // cek di bawah (pelapor / staf + withinReportJurisdiction / anggota report_helpers)
    // adalah re-check manual yang wajib menyertai withoutGlobalScopes (ATURAN EMAS #7).
    $report = Report::withoutGlobalScopes()->find($reportId);

    // Jika laporan tidak ada, tolak akses
    if (! $report) {
        return false;
    }

    // IZINKAN JIKA:
    // 1. Dia adalah Pelapor kejadian tersebut
    // 2. ATAU Dia adalah Petugas/Admin DI WILAYAH laporan (yang sedang memantau)
    // 3. ATAU Dia adalah Relawan yang memang mengambil tugas di laporan ini

    // Staf dibatasi ke wilayah laporan (FINDINGS #31) agar tak menyadap GPS/PII insiden
    // lintas wilayah; superadmin & admin nasional bypass via withinReportJurisdiction().
    $isReporter = $user->id === $report->user_id;
    $isStaff = $user->hasAnyRole(['admin', 'superadmin', 'petugas']) && $user->withinReportJurisdiction($report);

    // Cek apakah dia relawan yang terdaftar di laporan ini
    $isHelper = \Illuminate\Support\Facades\DB::table('report_helpers')
        ->where('report_id', $report->id)
        ->where('user_id', $user->id)
        ->exists();

    return $isReporter || $isStaff || $isHelper;
});

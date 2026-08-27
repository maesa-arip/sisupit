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
    // 2. ATAU Dia adalah Petugas/Admin/Pejabat DI WILAYAH laporan (yang sedang memantau)
    // 3. ATAU Dia adalah Relawan yang memang mengambil tugas di laporan ini

    // Staf dibatasi ke wilayah laporan (FINDINGS #31) agar tak menyadap GPS/PII insiden
    // lintas wilayah; superadmin & admin nasional bypass via withinReportJurisdiction().
    // `pejabat` ikut di sini karena ReportController::show sudah membuka halaman detail
    // untuknya dengan gerbang yang sama persis (hasRole('pejabat') && withinReportJurisdiction,
    // lihat #41) — tanpa channel ini halamannya terbuka tapi badge status & marker responder
    // tak pernah bergerak, dan tidak ada gejala apa pun selain "petanya diam".
    $isReporter = $user->id === $report->user_id;
    $isStaff = $user->hasAnyRole(['admin', 'superadmin', 'petugas', 'pejabat']) && $user->withinReportJurisdiction($report);

    // Cek apakah dia relawan yang terdaftar di laporan ini
    $isHelper = \Illuminate\Support\Facades\DB::table('report_helpers')
        ->where('report_id', $report->id)
        ->where('user_id', $user->id)
        ->exists();

    return $isReporter || $isStaff || $isHelper;
});

// Feed laporan per wilayah (dashboard realtime). Aturannya tidak ditulis ulang di sini:
// sebuah akun hanya boleh masuk ke channel yang MEMANG jatahnya menurut
// User::reportFeedChannel(), fungsi yang sama yang dipakai DashboardController untuk
// memberi tahu frontend channel mana yang harus didengar. Menuliskan syaratnya lagi di
// sini berarti dua aturan yang bisa menyimpang — dan penyimpangannya tak bergejala:
// dashboard cuma diam saat ada kejadian.
//
// Isi siarannya sendiri hanya id + status (lihat ReportFeedChanged::broadcastWith), dan
// yang menampilkan datanya tetap server lewat router.reload() — jadi scope Tenantable &
// otorisasi halaman dihitung ulang di sana, bukan dipercayakan ke channel ini.
Broadcast::channel('reports.all', fn ($user) => $user->reportFeedChannel() === 'reports.all');

Broadcast::channel(
    'reports.{level}.{code}',
    fn ($user, $level, $code) => $user->reportFeedChannel() === "reports.{$level}.{$code}"
);

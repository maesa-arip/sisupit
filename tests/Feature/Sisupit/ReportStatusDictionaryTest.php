<?php

use App\Exports\ReportsExport;
use App\Models\Report;
use App\Models\User;

/**
 * FINDINGS #94 — dua layar peta memelihara kamus status kejadiannya SENDIRI (butuh warna
 * pin/titik yang tak ada di `Components/StatusBadge.jsx`), dan keduanya berhenti di empat
 * status: `ditolak` tak pernah ikut. Karena kamus itu selalu punya cadangan
 * (`STATUS_META[status] || STATUS_META.pending`), laporan yang SUDAH DITOLAK terbaca
 * "Laporan Terverifikasi" berwarna kuning di Verifikasi Laporan — status yang salah
 * disebutkan sebagai status lain, tanpa galat, tanpa gejala.
 *
 * Test ini membaca BERKAS SUMBER karena di situlah sifatnya hidup — komponen React tidak
 * dirender oleh Pest (pola yang sama dengan MobileNavParityTest & RoleLabelParityTest).
 */
$verifikasi = fn () => file_get_contents(resource_path('js/Pages/Admin/Reports/Index.jsx'));
$peta = fn () => file_get_contents(resource_path('js/Pages/Monitoring/Map.jsx'));

// Kunci kamus di masing-masing berkas. Bentuknya berbeda (objek vs array bertumpuk), jadi
// diambil dengan pola masing-masing, bukan satu regex yang dipaksakan.
$statusMetaKeys = function () use ($verifikasi) {
    preg_match('/const STATUS_META = \{(.*?)\n\};/s', $verifikasi(), $block);
    preg_match_all('/^\t(\w+): \{/m', $block[1] ?? '', $keys);

    return $keys[1];
};

$reportStatusKeys = function () use ($peta) {
    preg_match('/const REPORT_STATUS = \[(.*?)\n\];/s', $peta(), $block);
    preg_match_all("/key: '([^']+)'/", $block[1] ?? '', $keys);

    return $keys[1];
};

// Diikat ke apa yang aplikasi BENAR-BENAR tulis ke kolom status, bukan ke salinan daftar
// status di berkas lain — kamus yang cuma diadu dengan kamus tidak menjaga apa pun (#79).
it('names the status a rejection really writes, in both incident map dictionaries', function () use ($statusMetaKeys, $reportStatusKeys) {
    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('masyarakat');

    $report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
    ]);

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$report->id}/reject", ['reason' => 'Laporan ganda']);

    $ditulis = $report->refresh()->status;

    expect($statusMetaKeys())->toContain($ditulis)
        ->and($reportStatusKeys())->toContain($ditulis);
});

// Kamus ekspor sudah lengkap sejak TASK_39 dan dipakai untuk dokumen yang dibaca pimpinan.
// Layar dan berkas ekspor menyebut satu laporan yang sama, jadi keduanya wajib mengenal
// status yang sama pula ('aktif' dikecualikan — itu nilai FILTER, bukan status baris).
it('keeps the screen dictionaries level with the export dictionary', function () use ($statusMetaKeys, $reportStatusKeys) {
    // Konstantanya private (dan dibiarkan begitu — visibilitas produksi tidak dilonggarkan
    // demi test); dibaca lewat refleksi supaya yang diadu tetap kamus yang NYATA dipakai
    // saat mengekspor, bukan salinannya di berkas test.
    $labels = (new ReflectionClass(ReportsExport::class))->getConstant('STATUS_LABELS');
    $statuses = array_diff(array_keys($labels), ['aktif']);

    expect($statuses)->not->toBeEmpty();

    foreach ($statuses as $status) {
        expect($statusMetaKeys())->toContain($status)
            ->and($reportStatusKeys())->toContain($status);
    }
});

// Chip filter yang tak memulangkan apa pun terbaca sebagai bug. Ini membuktikan chip
// "Ditolak" di Verifikasi Laporan memang mengambil laporan yang ditolak.
it('lets the verifier filter the report list down to rejected reports', function () {
    $admin = User::factory()->create(['city_code' => '5171']);
    $admin->assignRole('admin');

    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('masyarakat');

    $ditolak = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Laporan ganda',
        'description' => 'Sudah dilaporkan tetangga',
        'address' => 'Jl. Pemogan No. 2',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'ditolak',
        'village_code' => '5171012006',
    ]);

    Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran lapak',
        'description' => 'Masih berjalan',
        'address' => 'Jl. Pemogan No. 3',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'handling',
        'village_code' => '5171012006',
    ]);

    $this->actingAs($admin)->get(route('admin.reports.index', ['status' => 'ditolak']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('state.status', 'ditolak')
            ->has('reports.data', 1)
            ->where('reports.data.0.id', $ditolak->id));
});

// Pemantau (pejabat/relawan) memakai HALAMAN YANG SAMA lewat front.reports.index, tapi
// ReportController::index menyaring TERLAPOR & ditolak di server. Chip untuk status yang
// tak akan pernah muncul di sana = chip yang selalu kosong, jadi keduanya dibuang dari
// pill & legenda bagi pemantau.
it('hides the raw and rejected chips from monitors, matching what the server sends them', function () use ($verifikasi) {
    $pejabat = User::factory()->create(['city_code' => '5171']);
    $pejabat->assignRole('pejabat');

    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('masyarakat');

    Report::create([
        'user_id' => $reporter->id,
        'title' => 'Laporan ganda',
        'description' => 'Sudah dilaporkan tetangga',
        'address' => 'Jl. Pemogan No. 2',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'ditolak',
        'village_code' => '5171012006',
    ]);

    $this->actingAs($pejabat)->get(route('front.reports.index', ['status' => 'ditolak']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('canVerify', false)->has('reports.data', 0));

    preg_match('/const MONITOR_HIDDEN_STATUSES = \[(.*?)\];/s', $verifikasi(), $block);

    expect($block)->not->toBeEmpty()
        ->and($block[1])->toContain("'TERLAPOR'")
        ->and($block[1])->toContain("'ditolak'");
});

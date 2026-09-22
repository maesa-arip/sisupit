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
    $reporter->assignRole('warga');

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

    // ADMIN, bukan petugas: sejak TASK_51 petugas tak boleh menolak, sehingga dengan petugas
    // penolakannya berhenti di 403, kolomnya tetap TERLAPOR (yang memang dikenal kedua kamus),
    // dan test ini hijau tanpa pernah menyentuh `ditolak` - penjaga yang menjaga hal yang salah.
    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->post("/reports/{$report->id}/reject", ['reason' => 'Laporan ganda']);

    $ditulis = $report->refresh()->status;

    expect($ditulis)->toBe('ditolak')
        ->and($statusMetaKeys())->toContain($ditulis)
        ->and($reportStatusKeys())->toContain($ditulis);
});

// TASK_55. Status `digabung` lahir di endpoint penggabungan, dan KEEMPAT kamus layar + kamus
// ekspor harus mengenalnya. Tanpa entri, cadangan `|| STATUS_META.pending` membuat laporan
// ganda yang sudah digabung berlencana "Laporan Terverifikasi" - persis bentuk #94.
it('names the status a merge really writes, in every status dictionary', function () use ($statusMetaKeys, $reportStatusKeys) {
    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('warga');

    $buat = fn () => Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
    ]);
    $induk = $buat();
    $anak = $buat();

    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->post("/reports/{$anak->id}/merge", ['into_id' => $induk->id]);

    $ditulis = $anak->refresh()->status;
    $labels = (new ReflectionClass(ReportsExport::class))->getConstant('STATUS_LABELS');
    $badge = file_get_contents(resource_path('js/Components/StatusBadge.jsx'));
    $show = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));

    expect($ditulis)->toBe(Report::STATUS_DIGABUNG)
        ->and($statusMetaKeys())->toContain($ditulis)
        ->and($reportStatusKeys())->toContain($ditulis)
        ->and($labels)->toHaveKey($ditulis)
        ->and($badge)->toMatch('/^\t'.$ditulis.': \{ label:/m')
        ->and($show)->toMatch("/case '".$ditulis."':/");
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
    $reporter->assignRole('warga');

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
    $reporter->assignRole('warga');

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
        ->and($block[1])->toContain("'ditolak'")
        // TASK_55: server ikut menyaring laporan yang digabung dari pemantau.
        ->and($block[1])->toContain("'digabung'");
});

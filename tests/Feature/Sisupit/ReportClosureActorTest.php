<?php

use App\Exports\ReportsExport;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

/**
 * Jejak PELAKU penutupan insiden (FINDINGS #88).
 *
 * `resolve()` dulu hanya menulis status 'resolved' dan `reject()` menyimpan KAPAN & ALASAN
 * tapi tidak SIAPA — padahal keduanya keputusan yang dipertanggungjawabkan ke pimpinan.
 * Penjaga di bawah mengunci tiga hal sekaligus: kolomnya terisi, namanya sampai ke layar
 * (detail + daftar verifikasi), dan berkas ekspor tidak lagi bisa bergeser kolomnya tanpa
 * ketahuan.
 */
beforeEach(function () {
    // Transisi status mengirim notifikasi balik ke pelapor (FCM + database); test env tak
    // punya kredensial Firebase — pola yang sama dipakai ReportActionAuthorizationTest.
    Notification::fake();

    $this->reporter = User::factory()->create(['village_code' => '5171012006']);
    $this->reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'handling',
        'village_code' => '5171012006',
        'province_code' => '51',
    ]);

    $this->petugas = User::factory()->create(['name' => 'Komandan Regu A', 'village_code' => '5171012006']);
    $this->petugas->assignRole('petugas');
});

it('records who closed the incident and when', function () {
    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/resolve")
        ->assertRedirect();

    $this->report->refresh();

    expect($this->report->status)->toBe('resolved');
    expect($this->report->resolved_by)->toBe($this->petugas->id);
    expect($this->report->resolved_at)->not->toBeNull();
    expect($this->report->resolver->name)->toBe('Komandan Regu A');
});

it('records who rejected the report alongside the reason it already kept', function () {
    $terlapor = Report::create([
        'user_id' => $this->reporter->id,
        'title' => 'Laporan hoax',
        'address' => 'Jl. Pemogan No. 2',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
    ]);

    $this->actingAs($this->petugas)
        ->post("/reports/{$terlapor->id}/reject", ['reason' => 'Tidak dapat dihubungi'])
        ->assertRedirect();

    $terlapor->refresh();

    expect($terlapor->status)->toBe('ditolak');
    expect($terlapor->rejected_by)->toBe($this->petugas->id);
    expect($terlapor->rejector->name)->toBe('Komandan Regu A');
});

it('ships the closing officer name to the incident detail page', function () {
    $this->actingAs($this->petugas)->post("/reports/{$this->report->id}/resolve");

    $props = $this->actingAs($this->petugas)
        ->get("/reports/show/{$this->report->id}")
        ->original->getData()['page']['props'];

    // Nama relasinya `resolver`, BUKAN `resolvedBy`: relasi diserialisasi ter-snake_case,
    // jadi `resolvedBy` akan menimpa kolom `resolved_by` dan mengubah angka jadi objek.
    expect($props['report']['resolver']['name'])->toBe('Komandan Regu A');
    expect($props['report']['resolved_by'])->toBe($this->petugas->id);
});

it('ships the closing officer name to the verification list', function () {
    $this->actingAs($this->petugas)->post("/reports/{$this->report->id}/resolve");

    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $props = $this->actingAs($admin)->get('/admin/reports?status=resolved')->original->getData()['page']['props'];
    $row = collect($props['reports']['data'])->firstWhere('id', $this->report->id);

    expect($row['resolver']['name'])->toBe('Komandan Regu A');
});

/** Semua sel non-kosong di sheet ekspor, diratakan — tata letak boleh berubah. */
function closureExportCells($response): array
{
    $path = $response->baseResponse->getFile()->getPathname();
    $sheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path)->getActiveSheet();

    return collect($sheet->toArray())->flatten()->filter()->values()->all();
}

it('carries the closing and rejecting officer into the exported sheet', function () {
    $this->actingAs($this->petugas)->post("/reports/{$this->report->id}/resolve");

    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $cells = closureExportCells($this->actingAs($admin)->get('/admin/reports/export'));

    expect($cells)->toContain('Ditutup Oleh');
    expect($cells)->toContain('Waktu Ditutup');
    expect($cells)->toContain('Ditolak Oleh');
    expect($cells)->toContain('Komandan Regu A');
});

// Berkas ekspor punya TIGA daftar yang harus sepanjang: heading, nilai per baris, dan lebar
// kolom. Kalau salah satu bergeser, isinya pindah kolom tanpa satu pun galat — seluruh
// rekap terbaca salah. Penjaga ini yang membuat penambahan kolom berikutnya tak bisa lolos
// setengah jalan.
it('keeps the export headings, row values, and column widths the same length', function () {
    $export = new ReportsExport([]);

    $headings = $export->headings();
    $widths = $export->columnWidths();
    $row = $export->map($this->report->fresh());

    expect(count($row))->toBe(count($headings));
    expect(count($widths))->toBe(count($headings));
    expect(array_key_last($widths))->toBe('AI');
});

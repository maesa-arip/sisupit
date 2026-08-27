<?php

use App\Models\Report;
use App\Models\User;

function makeReport(array $overrides = []): Report
{
    return Report::create(array_merge([
        'user_id' => User::factory()->create()->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
    ], $overrides));
}

it('only lists reports within the logged-in admin tenant on the verification page', function () {
    $adminBali = User::factory()->create(['province_code' => '51']);
    $adminBali->assignRole('admin');

    $reportInBali = makeReport(['title' => 'Kejadian di Bali', 'province_code' => '51']);
    $reportInJabar = makeReport(['title' => 'Kejadian di Jabar', 'province_code' => '32']);

    $response = $this->actingAs($adminBali)->get('/admin/reports');

    $reports = $response->original->getData()['page']['props']['reports']['data'];
    $ids = array_column($reports, 'id');

    expect($ids)->toContain($reportInBali->id);
    expect($ids)->not->toContain($reportInJabar->id);
});

it('defaults the verification queue to active reports and counts those awaiting verification', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $terlapor = makeReport(['title' => 'Baru masuk', 'province_code' => '51', 'status' => 'TERLAPOR']);
    $pending = makeReport(['title' => 'Sedang proses', 'province_code' => '51', 'status' => 'pending']);
    $resolved = makeReport(['title' => 'Sudah selesai', 'province_code' => '51', 'status' => 'resolved']);

    $props = $this->actingAs($admin)->get('/admin/reports')->original->getData()['page']['props'];
    $ids = array_column($props['reports']['data'], 'id');

    // Default triase = 'aktif': TERLAPOR & pending tampil, resolved disembunyikan.
    expect($ids)->toContain($terlapor->id);
    expect($ids)->toContain($pending->id);
    expect($ids)->not->toContain($resolved->id);
    // Hitung "menunggu verifikasi" = hanya yang masih TERLAPOR.
    expect($props['menunggu_verifikasi'])->toBe(1);
});

it('blocks non-admin roles from viewing the report verification page', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->get('/admin/reports')->assertForbidden();
});

it('lets an admin export reports within their own tenant to excel', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin/reports/export')
        ->assertOk()
        ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

it('blocks non-admin roles from exporting reports', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->get('/admin/reports/export')->assertForbidden();
});

it('only includes reports from the admin own tenant in the exported file', function () {
    $adminBali = User::factory()->create(['province_code' => '51']);
    $adminBali->assignRole('admin');

    $reportInBali = makeReport(['title' => 'Kejadian di Bali', 'province_code' => '51']);
    makeReport(['title' => 'Kejadian di Jabar', 'province_code' => '32']);

    $response = $this->actingAs($adminBali)->get('/admin/reports/export');
    $path = $response->baseResponse->getFile()->getPathname();

    $sheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path)->getActiveSheet();
    // Layout punya kop + kolom yang ditata ulang, jadi pindai seluruh sel (bukan kolom tetap)
    // supaya assertion tenant tetap valid meski tata letak berubah.
    $cells = collect($sheet->toArray())->flatten()->filter()->values()->all();

    expect($cells)->toContain('Kejadian di Bali');
    expect($cells)->not->toContain('Kejadian di Jabar');
    expect($reportInBali->province_code)->toBe('51');
});

/** Semua sel non-kosong di sheet ekspor, diratakan - tata letak boleh berubah. */
function exportedCells($response): array
{
    $path = $response->baseResponse->getFile()->getPathname();
    $sheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path)->getActiveSheet();

    return collect($sheet->toArray())->flatten()->filter()->values()->all();
}

// Isi berkas ekspor tertinggal jauh dari data yang dikumpulkan aplikasi (permintaan user
// 2026-08-26): jenis kejadian, OPD terkait + konfirmasinya, armada, jumlah foto, dan
// ringkasan berita acara tak pernah ikut, padahal semuanya sudah lama terisi. Test ini
// menjaga agar kolom-kolom itu tidak diam-diam hilang lagi saat berkas ekspor dirapikan.
it('exports the incident data collected after the first version of the sheet', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $report = makeReport([
        'title' => 'Kebakaran gudang',
        'province_code' => '51',
        'status' => 'resolved',
        'incident_type' => 'toko',
    ]);

    $unit = \App\Models\Unit::create([
        'name' => 'Damkar 01', 'type' => 'truk', 'status' => 'available', 'province_code' => '51',
    ]);
    \App\Models\ReportUnit::create([
        'report_id' => $report->id, 'unit_id' => $unit->id, 'status' => 'dispatched', 'dispatched_at' => now(),
    ]);

    $agency = \App\Models\Agency::create([
        'name' => 'PLN ULP Denpasar', 'code' => 'pln', 'province_code' => '51',
        'requires_confirmation' => true, 'confirmation_label' => 'Listrik sudah dipadamkan',
    ]);
    \App\Models\ReportAgency::create([
        'report_id' => $report->id, 'agency_id' => $agency->id, 'agency_name' => 'PLN ULP Denpasar',
        'requires_confirmation' => true, 'confirmation_label' => 'Listrik sudah dipadamkan',
        'notified_at' => now(), 'confirmed_at' => now(), 'confirmed_source' => 'operator',
    ]);

    \App\Models\ReportPhoto::create(['report_id' => $report->id, 'path' => 'reports/a.jpg']);
    \App\Models\ReportPhoto::create(['report_id' => $report->id, 'path' => 'reports/b.jpg']);

    $resolution = \App\Models\ReportResolution::create([
        'report_id' => $report->id, 'created_by' => $admin->id, 'status' => 'final', 'kerugian' => 'kurang lebih 50 juta',
    ]);
    \App\Models\ReportVictim::create(['report_resolution_id' => $resolution->id, 'nama' => 'Korban Satu']);

    $cells = exportedCells($this->actingAs($admin)->get('/admin/reports/export'));

    expect($cells)
        ->toContain('LP-'.$report->created_at->format('Y').'-'.str_pad((string) $report->id, 5, '0', STR_PAD_LEFT))
        ->toContain('Kebakaran Toko/Bangunan')
        ->toContain('Damkar 01')
        ->toContain('PLN ULP Denpasar')
        ->toContain('Final')
        ->toContain('kurang lebih 50 juta');

    // Identitas korban SENGAJA tidak ikut - yang diekspor hanya jumlahnya.
    expect($cells)->not->toContain('Korban Satu');
});

// Status `ditolak` ada sejak FINDINGS #24 tapi tak pernah punya label di berkas ekspor,
// jadi selnya tercetak mentah dan alasan penolakannya hilang sama sekali.
it('labels a rejected report and carries its reason into the sheet', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    makeReport([
        'title' => 'Laporan hoax',
        'province_code' => '51',
        'status' => 'ditolak',
        'rejected_reason' => 'Foto tidak sesuai lokasi',
        'rejected_at' => now(),
    ]);

    $cells = exportedCells($this->actingAs($admin)->get('/admin/reports/export?status=ditolak'));

    expect($cells)->toContain('Ditolak');
    expect(collect($cells)->contains(fn ($cell) => str_contains((string) $cell, 'Foto tidak sesuai lokasi')))->toBeTrue();
});

// Kamus status kanonik: berkas ekspor tak boleh menyebut laporan dengan nama yang berbeda
// dari layar Verifikasi Laporan (STATUS_META di Admin/Reports/Index.jsx).
it('uses the same status wording as the verification screen', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    makeReport(['title' => 'Baru masuk', 'province_code' => '51', 'status' => 'TERLAPOR']);

    $cells = exportedCells($this->actingAs($admin)->get('/admin/reports/export'));

    expect($cells)->toContain('Laporan Masuk');
    expect($cells)->not->toContain('Terlapor (Belum Divalidasi)');
});

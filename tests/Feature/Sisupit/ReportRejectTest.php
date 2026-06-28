<?php

use App\Models\Report;
use App\Models\User;

beforeEach(function () {
    $this->reporter = User::factory()->create(['village_code' => '5171012006']);
    $this->reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
    ]);
});

it('lets staff reject a report into the ditolak status with a reason, keeping the row', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/reject", ['reason' => 'Tidak dapat dihubungi'])
        ->assertRedirect();

    $this->report->refresh();
    expect($this->report->status)->toBe('ditolak');
    expect($this->report->rejected_reason)->toBe('Tidak dapat dihubungi');
    expect($this->report->rejected_at)->not->toBeNull();
    // Baris laporan TETAP ada (ditolak = arsip, bukan hapus)
    expect(Report::withoutGlobalScopes()->whereKey($this->report->id)->exists())->toBeTrue();
});

it('blocks non-staff (masyarakat) from rejecting a report', function () {
    $masyarakat = User::factory()->create(['village_code' => '5171012006']);
    $masyarakat->assignRole('masyarakat');

    $this->actingAs($masyarakat)
        ->post("/reports/{$this->report->id}/reject")
        ->assertForbidden();

    expect($this->report->refresh()->status)->toBe('TERLAPOR');
});

it('does not allow rejecting a resolved incident', function () {
    $this->report->update(['status' => 'resolved']);

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/reject")
        ->assertForbidden();

    expect($this->report->refresh()->status)->toBe('resolved');
});

it('hides rejected reports from the non-staff feed but keeps them visible to the owner', function () {
    $this->report->update(['status' => 'ditolak', 'rejected_at' => now()]);

    // Non-staff sewilayah: tab "Semua Laporan" tak memuat laporan ditolak
    $viewer = User::factory()->create(['village_code' => '5171012006']);
    $viewer->assignRole('masyarakat');

    $response = $this->actingAs($viewer)->get(route('front.reports.index'));
    $allFeed = $response->original->getData()['page']['props']['reports']['data'];
    expect(array_column($allFeed, 'id'))->not->toContain($this->report->id);

    // Pemilik: tab "Riwayat Saya" tetap memuat laporannya yang ditolak
    $mineResponse = $this->actingAs($this->reporter)->get(route('front.reports.index', ['filter' => 'mine']));
    $mineFeed = $mineResponse->original->getData()['page']['props']['reports']['data'];
    expect(array_column($mineFeed, 'id'))->toContain($this->report->id);
});

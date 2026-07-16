<?php

use App\Models\Report;
use App\Models\User;

// FINDINGS #31 — akses halaman Show laporan (+ channel report-tracking) ter-scope wilayah:
// staf hanya boleh memantau insiden di wilayahnya; pelapor & superadmin/admin nasional bebas.
beforeEach(function () {
    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('masyarakat');

    $this->reporter = $reporter;
    // Laporan di Desa A (5171012006), Kec. 5171010, Kota 5171, Prov. 51.
    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
        'village_code' => '5171012006',
        'district_code' => '5171010',
        'city_code' => '5171',
        'province_code' => '51',
    ]);
});

it('lets staff in the report region view the report', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->get("/reports/show/{$this->report->id}")->assertOk();
});

it('blocks staff from another region from viewing the report', function () {
    $petugasLuar = User::factory()->create(['village_code' => '3171012001']); // Desa B
    $petugasLuar->assignRole('petugas');

    $this->actingAs($petugasLuar)->get("/reports/show/{$this->report->id}")->assertForbidden();
});

it('lets superadmin view the report regardless of region', function () {
    $superadmin = User::factory()->create(['village_code' => '3171012001']);
    $superadmin->assignRole('superadmin');

    $this->actingAs($superadmin)->get("/reports/show/{$this->report->id}")->assertOk();
});

it('lets the reporter view their own report even across tenant', function () {
    $this->actingAs($this->reporter)->get("/reports/show/{$this->report->id}")->assertOk();
});

// Pejabat daerah (pemantau read-only setara admin) boleh melihat detail insiden di WILAYAHNYA.
// Skenario nyata: pejabat Kota Denpasar (city_code 5171) membuka laporan yang terjadi di Denpasar.
it('lets a pejabat within jurisdiction view the report (read-only)', function () {
    $pejabat = User::factory()->create(['city_code' => '5171']); // sekota dengan laporan
    $pejabat->assignRole('pejabat');

    $this->actingAs($pejabat)->get("/reports/show/{$this->report->id}")
        ->assertOk()
        // Bukan staf pengelola: tidak boleh diberi hak kelola berita acara.
        ->assertInertia(fn ($page) => $page->where('canManageResolution', false));
});

it('blocks a pejabat from another region from viewing the report', function () {
    $pejabatLuar = User::factory()->create(['city_code' => '3171']); // Jakarta
    $pejabatLuar->assignRole('pejabat');

    $this->actingAs($pejabatLuar)->get("/reports/show/{$this->report->id}")->assertForbidden();
});

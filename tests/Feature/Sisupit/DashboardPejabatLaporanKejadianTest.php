<?php

use App\Models\Report;
use App\Models\ReportResolution;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// Permintaan user 2026-10-08: dashboard PEJABAT menampilkan insiden selesai yang butuh Laporan
// Kejadian beserta keadaannya (belum dibuat / sementara / final) - HANYA LIHAT.

function pejabatReport(string $title, string $status = 'resolved', string $city = '5171'): Report
{
    return Report::withoutGlobalScopes()->create([
        'user_id' => User::factory()->create()->id,
        'title' => $title,
        'address' => 'Jl. Uji',
        'lat' => '-8.65',
        'lng' => '115.22',
        'status' => $status,
        'province_code' => '51',
        'city_code' => $city,
        'district_code' => $city.'01',
        'village_code' => $city.'012006',
    ]);
}

beforeEach(function () {
    $this->pejabat = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->pejabat->assignRole('pejabat');
});

it('lists resolved incidents with their incident-report state, not-yet-made first', function () {
    $final = pejabatReport('Sudah final');
    $sementara = pejabatReport('Baru sementara');
    $belum = pejabatReport('Belum dibuat');
    pejabatReport('Masih ditangani', 'handling');
    pejabatReport('Wilayah lain', 'resolved', '5103');

    ReportResolution::create(['report_id' => $final->id, 'status' => 'sementara']);
    ReportResolution::create(['report_id' => $final->id, 'status' => 'final']);
    ReportResolution::create(['report_id' => $sementara->id, 'status' => 'sementara']);

    $this->actingAs($this->pejabat)->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('isPejabat', true)
            ->where('resolutionPendingCount', 2)
            ->has('resolutionReports', 3)
            ->where('resolutionReports.0.id', $belum->id)
            ->where('resolutionReports.0.resolution_state', 'belum')
            ->where('resolutionReports.1.id', $sementara->id)
            ->where('resolutionReports.1.resolution_state', 'sementara')
            ->where('resolutionReports.2.id', $final->id)
            ->where('resolutionReports.2.resolution_state', 'final'));
});

it('keeps the list away from admins and keeps pejabat read-only on the incident report', function () {
    $report = pejabatReport('Kebakaran gudang');

    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');
    $this->actingAs($admin)->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page->where('resolutionReports', null));

    // Baris pejabat menuju detail yang read-only; isi/simpan tetap ditolak server.
    $this->actingAs($this->pejabat)->get(route('reports.show', $report->id))
        ->assertInertia(fn (Assert $page) => $page
            ->where('canViewResolution', true)
            ->where('canManageResolution', false));
    $this->actingAs($this->pejabat)->get("/reports/{$report->id}/resolution/create")->assertForbidden();
    $this->actingAs($this->pejabat)->post("/reports/{$report->id}/resolution", ['status' => 'sementara'])->assertForbidden();
});

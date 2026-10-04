<?php

use App\Models\Report;
use App\Models\User;

/**
 * Feed "Semua Laporan" paginasi di Beranda warga DIBUANG di TASK_72 (keputusan user 2026-10-04) dan
 * diganti "Kejadian di Kecamatan Anda" (`areaIncidents`). Janji lama test ini tetap dijaga untuk
 * penggantinya - hanya kejadian di wilayah sendiri - ditambah dua janji keputusan user: hanya yang
 * SUDAH diverifikasi, dan tanpa data pelapor.
 */
function makeReportInArea(string $districtCode, string $title, string $status = 'pending'): Report
{
    $reporter = User::factory()->create(['district_code' => $districtCode, 'name' => 'Pelapor Rahasia', 'phone' => '081299990000']);

    return Report::withoutGlobalScopes()->create([
        'user_id' => $reporter->id,
        'title' => $title,
        'description' => 'Kebakaran',
        'address' => 'Jl. Test',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => $status,
        'province_code' => substr($districtCode, 0, 2),
        'city_code' => substr($districtCode, 0, 4),
        'district_code' => $districtCode,
        'village_code' => $districtCode.'001',
    ]);
}

function citizenIn(string $districtCode): User
{
    $citizen = User::factory()->create([
        'province_code' => substr($districtCode, 0, 2),
        'city_code' => substr($districtCode, 0, 4),
        'district_code' => $districtCode,
        // Desa berbeda dari laporan: scope Tenantable warga berhenti di DESA, keputusan user = kecamatan.
        'village_code' => $districtCode.'009',
        'phone' => '081234500000',
    ]);
    $citizen->assignRole('warga');

    return $citizen;
}

it('shows verified incidents from the citizen own kecamatan only', function () {
    $sameDistrict = makeReportInArea('517101', 'Kebakaran Kecamatan Sendiri');
    $handling = makeReportInArea('517101', 'Sedang Ditangani', 'handling');
    $otherDistrict = makeReportInArea('517102', 'Kebakaran Kecamatan Lain');
    $otherProvince = makeReportInArea('317101', 'Kebakaran Provinsi Lain');

    $titles = collect($this->actingAs(citizenIn('517101'))->get('/dashboard')
        ->viewData('page')['props']['areaIncidents'])->pluck('title');

    expect($titles)->toContain($sameDistrict->title)
        ->toContain($handling->title)
        ->not->toContain($otherDistrict->title)
        ->not->toContain($otherProvince->title);
});

it('leaves out unverified, rejected, merged and finished incidents', function () {
    foreach (['TERLAPOR', 'ditolak', 'digabung', 'resolved'] as $status) {
        makeReportInArea('517101', "Status {$status}", $status);
    }

    $rows = $this->actingAs(citizenIn('517101'))->get('/dashboard')->viewData('page')['props']['areaIncidents'];

    expect($rows)->toBe([]);
});

it('never sends reporter data with the area incidents', function () {
    makeReportInArea('517101', 'Kebakaran');

    $row = $this->actingAs(citizenIn('517101'))->get('/dashboard')->viewData('page')['props']['areaIncidents'][0];

    expect(array_keys($row))->toBe(['id', 'title', 'location', 'status', 'created_at'])
        ->and(json_encode($row))->not->toContain('Pelapor Rahasia')
        ->not->toContain('081299990000');
});

it('no longer ships the paginated public feed', function () {
    $props = $this->actingAs(citizenIn('517101'))->get('/dashboard')->viewData('page')['props'];

    expect($props)->not->toHaveKey('page_data')
        ->and($props)->not->toHaveKey('nearbyEmergencies');
});

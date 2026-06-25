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

<?php

use App\Models\Report;
use App\Models\User;

function makeReportInVillage(string $villageCode, string $title): Report
{
    $reporter = User::factory()->create(['village_code' => $villageCode]);

    return Report::create([
        'user_id' => $reporter->id,
        'title' => $title,
        'description' => 'Kebakaran',
        'address' => 'Jl. Test',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => $villageCode,
    ]);
}

it('only shows the "Semua Laporan" feed scoped to the viewing citizen own village', function () {
    $reportInVillageA = makeReportInVillage('5171012006', 'Kebakaran Desa A');
    $reportInVillageB = makeReportInVillage('3171012001', 'Kebakaran Desa B');

    $citizenInVillageA = User::factory()->create([
        'village_code' => '5171012006',
        'phone' => '081234500000',
    ]);
    $citizenInVillageA->assignRole('masyarakat');

    $response = $this->actingAs($citizenInVillageA)->get('/dashboard');

    $feed = $response->original->getData()['page']['props']['page_data']['reports']['data'];
    $titles = array_column($feed, 'title');

    expect($titles)->toContain($reportInVillageA->title);
    expect($titles)->not->toContain($reportInVillageB->title);
});

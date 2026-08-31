<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

// TASK_28 — Pusat Komando banyak menerima laporan lewat telepon, jadi ia memilih wilayah
// (provinsi..desa) alih-alih menggeser pin dari titik GPS kantornya.
//
// SEJAK 2026-09-01 prop `region_picker` BUKAN LAGI GERBANG tampil: kotak cari & keempat
// dropdown wilayah ada untuk SEMUA pelapor (lihat ReportLocationSingleModeTest). Yang
// tersisa dan masih dijaga di berkas ini: prop itu hanya berisi yurisdiksi operator sebagai
// NILAI AWAL, dan warga menerimanya null sehingga tidak ada wilayah yang terisi lebih dulu
// atas nama siapa pun.
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_districts')->insert(['code' => '517104', 'city_code' => '5171', 'name' => 'Denpasar Utara']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
    DB::table('indonesia_villages')->insert(['code' => '5171042001', 'district_code' => '517104', 'name' => 'Peguyangan']);
});

it('gives the command center a region picker seeded with its own jurisdiction', function () {
    $petugas = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->get(route('front.reports.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Front/Reports/Create')
            ->where('region_picker.province_code', '51')
            ->where('region_picker.city_code', '5171')
            ->where('region_picker.district_code', null)
            ->where('region_picker.village_code', null));
});

it('never seeds a citizen form with someone elses jurisdiction', function () {
    $warga = User::factory()->create(['village_code' => '5171012006']);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)->get(route('front.reports.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Front/Reports/Create')
            ->where('region_picker', null));
});

it('stores the manually picked region, not the jurisdiction of the operator', function () {
    Notification::fake();

    // Operator berdinas di tingkat kabupaten (Denpasar) & menerima telepon kejadian di
    // kecamatan lain: wilayah yang tersimpan harus wilayah PILIHANNYA, bukan miliknya.
    $petugas = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post('/reports/create', [
        'title' => 'Kebakaran Rumah',
        'incident_type' => 'rumah',
        'description' => 'Laporan masuk lewat telepon warga',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517104',
        'village_code' => '5171042001',
        'lat' => '-8.601234',
        'lng' => '115.213456',
        'address' => 'Jl. Ahmad Yani Utara',
        'photos' => [UploadedFile::fake()->image('kejadian.jpg')],
    ]);

    $report = Report::withoutGlobalScopes()->first();

    expect($report)->not->toBeNull();
    expect($report->district_code)->toBe('517104');
    expect($report->village_code)->toBe('5171042001');
    expect($report->lat)->toBe('-8.601234');
    expect($report->lng)->toBe('115.213456');
});

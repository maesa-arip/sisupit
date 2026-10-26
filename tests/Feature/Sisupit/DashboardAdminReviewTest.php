<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Review UX dashboard admin 2026-10-26 (#222): alamat mesin di daftar kejadian dashboard
 * admin/pejabat dipotong sampai kecamatan. Hanya butir ini yang disetujui user; saran lain dari
 * review yang sama (tombol, sapaan, ikon petak, logo, bilah bawah, warna) DIKEMBALIKAN.
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171011001', 'district_code' => '517101', 'name' => 'Renon']);
});

function laporanRingkas(array $attrs): Report
{
    $citizen = User::factory()->create();

    return Report::create(array_merge([
        'user_id' => $citizen->id, 'title' => 'Biawak masuk rumah', 'status' => 'pending',
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011001',
    ], $attrs));
}

it('cuts the machine address right after the district', function () {
    $report = laporanRingkas([
        'geo_address' => 'Jalan Kenari, Renon, Denpasar Selatan, Denpasar, Bali, Nusa Tenggara, 80226, Indonesia',
    ]);

    expect($report->alamatRingkas())->toBe('Jalan Kenari, Renon, Denpasar Selatan');
});

it('falls back to dropping the administrative tail when the district is not in the address', function () {
    $report = laporanRingkas([
        'district_code' => null,
        'geo_address' => 'Jalan Kenari, Renon, Denpasar, Bali, Nusa Tenggara, 80226, Indonesia',
    ]);

    expect($report->alamatRingkas())->toBe('Jalan Kenari, Renon');
});

it('never shortens the landmark a citizen typed', function () {
    $report = laporanRingkas(['address' => 'Depan pura, Denpasar, Bali, Indonesia']);

    expect($report->alamatRingkas())->toBe('Depan pura, Denpasar, Bali, Indonesia');
});

it('sends the short address to the admin dashboard list', function () {
    laporanRingkas([
        'geo_address' => 'Jalan Kenari, Renon, Denpasar Selatan, Denpasar, Bali, Nusa Tenggara, 80226, Indonesia',
    ]);
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/dashboard')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard')
            ->where('recentReports.0.location', 'Jalan Kenari, Renon, Denpasar Selatan'));
});

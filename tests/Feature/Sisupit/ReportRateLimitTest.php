<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
});

it('throttles a citizen who spams report submissions', function () {
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('warga');

    $payload = [
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Jl. Pemogan No. 1',
    ];

    for ($i = 0; $i < 5; $i++) {
        $this->actingAs($citizen)
            ->post('/reports/create', [...$payload, 'photo' => UploadedFile::fake()->image('kejadian.jpg')])
            ->assertRedirect();
    }

    $this->actingAs($citizen)
        ->post('/reports/create', [...$payload, 'photo' => UploadedFile::fake()->image('kejadian.jpg')])
        ->assertStatus(429);
});

// 2026-09-29: admin produksi terkena 429 karena kiriman yang DITOLAK validasi (tanpa pesan di
// layar) ikut dihitung. Kini hanya laporan tersimpan yang dihitung.
it('does not count rejected submissions toward the report limit', function () {
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('warga');

    for ($i = 0; $i < 8; $i++) {
        $this->actingAs($citizen)
            ->post('/reports/create', ['title' => 'Kebakaran'])
            ->assertSessionHasErrors('village_code');
    }

    $this->actingAs($citizen)
        ->post('/reports/create', [
            'title' => 'Kebakaran rumah warga',
            'province_code' => '51',
            'city_code' => '5171',
            'district_code' => '517101',
            'village_code' => '5171012006',
            'lat' => '-8.6500',
            'lng' => '115.2200',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(\App\Models\Report::count())->toBe(1);
});

it('never throttles the command center while taking phone reports', function (string $role) {
    $operator = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $operator->assignRole($role);

    for ($i = 0; $i < 7; $i++) {
        $this->actingAs($operator)
            ->post('/reports/create', [
                'title' => 'Kebakaran dari telepon '.$i,
                'province_code' => '51',
                'city_code' => '5171',
                'district_code' => '517101',
                'village_code' => '5171012006',
                'lat' => '-8.6500',
                'lng' => '115.2200',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();
    }

    expect(\App\Models\Report::count())->toBe(7);
})->with(['admin', 'petugas']);

it('answers an Inertia 429 with a readable Indonesian message instead of a raw error page', function () {
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('warga');
    for ($i = 0; $i < \App\Http\Controllers\ReportController::REPORT_LIMIT; $i++) {
        \Illuminate\Support\Facades\RateLimiter::hit(
            \App\Http\Controllers\ReportController::reportLimiterKey($citizen), 600
        );
    }

    $this->actingAs($citizen)
        ->from('/reports/create')
        ->withHeader('X-Inertia', 'true')
        ->post('/reports/create', [
            'title' => 'Kebakaran rumah warga',
            'province_code' => '51',
            'city_code' => '5171',
            'district_code' => '517101',
            'village_code' => '5171012006',
            'lat' => '-8.6500',
            'lng' => '115.2200',
        ])
        ->assertRedirect('/reports/create')
        ->assertSessionHas('type', 'error')
        ->assertSessionHas('message', fn ($m) => str_contains($m, 'Terlalu banyak percobaan') && str_contains($m, 'menit'));
});

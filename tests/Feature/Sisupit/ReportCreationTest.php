<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
});

it('lets a citizen create a report which alerts the command center only', function () {
    Notification::fake();

    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $petugas = User::factory()->create();
    $petugas->assignRole('petugas');

    $relawan = User::factory()->create();
    $relawan->assignRole('relawan');

    $response = $this->actingAs($citizen)->post('/reports/create', [
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Jl. Pemogan No. 1',
        'photos' => [UploadedFile::fake()->image('kejadian.jpg')],
    ]);

    $response->assertRedirect(route('dashboard'));

    $report = Report::withoutGlobalScopes()->first();
    expect($report)->not->toBeNull();
    expect($report->status)->toBe('TERLAPOR');
    expect($report->user_id)->toBe($citizen->id);

    Notification::assertSentTo($petugas, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($relawan, \App\Notifications\EmergencyAlertNotification::class);
});

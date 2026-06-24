<?php

use App\Enums\TenantLevel;
use App\Models\Report;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    DB::table('indonesia_provinces')->insert([
        ['code' => '51', 'name' => 'Bali'],
        ['code' => '52', 'name' => 'Provinsi Lain'],
    ]);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5172', 'province_code' => '51', 'name' => 'Kota Lain'],
    ]);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan'],
    ]);
    DB::table('indonesia_villages')->insert([
        ['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan'],
    ]);

    $reporter = User::factory()->create();
    $reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'status' => 'TERLAPOR',
    ]);

    $this->approver = User::factory()->create();
    $this->approver->assignRole('superadmin');
});

it('cascades petugas notifications up to kabupaten by default and stops before provinsi', function () {
    Notification::fake();

    $village = User::factory()->create(['village_code' => '5171012006']);
    $village->assignRole('petugas');

    $district = User::factory()->create(['district_code' => '517101']);
    $district->assignRole('petugas');

    $city = User::factory()->create(['city_code' => '5171']);
    $city->assignRole('petugas');

    $province = User::factory()->create(['province_code' => '51']);
    $province->assignRole('petugas');

    $otherCity = User::factory()->create(['city_code' => '5172']);
    $otherCity->assignRole('petugas');

    $national = User::factory()->create();
    $national->assignRole('petugas');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($village, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertSentTo($district, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertSentTo($city, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertSentTo($national, \App\Notifications\EmergencyAlertNotification::class);

    Notification::assertNotSentTo($province, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($otherCity, \App\Notifications\EmergencyAlertNotification::class);
});

it('keeps relawan notifications limited to the exact desa by default', function () {
    Notification::fake();

    $village = User::factory()->create(['village_code' => '5171012006']);
    $village->assignRole('relawan');

    $district = User::factory()->create(['district_code' => '517101']);
    $district->assignRole('relawan');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($village, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($district, \App\Notifications\EmergencyAlertNotification::class);
});

it('lets an admin raise the petugas broadcast ceiling to provinsi via Setting', function () {
    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::PROVINSI->value);

    Notification::fake();

    $province = User::factory()->create(['province_code' => '51']);
    $province->assignRole('petugas');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($province, \App\Notifications\EmergencyAlertNotification::class);
});

it('excludes relawan who turned off siaga from the notification broadcast', function () {
    Notification::fake();

    $activeRelawan = User::factory()->create(['village_code' => '5171012006']);
    $activeRelawan->assignRole('relawan');

    $inactiveRelawan = User::factory()->create(['village_code' => '5171012006', 'is_standby' => false]);
    $inactiveRelawan->assignRole('relawan');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($activeRelawan, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($inactiveRelawan, \App\Notifications\EmergencyAlertNotification::class);
});

it('restricts the notification settings page to superadmin, not regional admin', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin/settings')->assertForbidden();
    $this->actingAs($this->approver)->get('/admin/settings')->assertOk();
});

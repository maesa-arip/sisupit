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

// FINDINGS #56 — kolom wilayah kosong punya DUA makna dan pembedanya cuma PERAN:
// staf = yurisdiksi nasional yang sengaja luas, non-staf = profil belum lengkap.
// Sebelum perbaikan, keduanya ikut cabang jaring pengaman yang sama sehingga relawan
// berprofil kosong menerima sirine untuk kebakaran di seluruh Indonesia.
it('distinguishes an empty region on staff (national) from an incomplete volunteer profile', function () {
    Notification::fake();

    $petugasNasional = User::factory()->create();
    $petugasNasional->assignRole('petugas');

    $relawanBelumLengkap = User::factory()->create();
    $relawanBelumLengkap->assignRole('relawan');

    $relawanDesa = User::factory()->create(['village_code' => '5171012006']);
    $relawanDesa->assignRole('relawan');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($petugasNasional, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertSentTo($relawanDesa, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($relawanBelumLengkap, \App\Notifications\EmergencyAlertNotification::class);
});

it('derives the jurisdiction level from the deepest filled region column', function () {
    expect(User::factory()->create(['village_code' => '5171012006'])->jurisdictionLevel())->toBe(TenantLevel::DESA)
        ->and(User::factory()->create(['district_code' => '517101'])->jurisdictionLevel())->toBe(TenantLevel::KECAMATAN)
        ->and(User::factory()->create(['city_code' => '5171'])->jurisdictionLevel())->toBe(TenantLevel::KABUPATEN)
        ->and(User::factory()->create(['province_code' => '51'])->jurisdictionLevel())->toBe(TenantLevel::PROVINSI)
        ->and(User::factory()->create()->jurisdictionLevel())->toBeNull()
        // String kosong diperlakukan sama dengan NULL, sejalan dengan withinReportJurisdiction().
        ->and(User::factory()->create(['city_code' => '5171', 'village_code' => ''])->jurisdictionLevel())->toBe(TenantLevel::KABUPATEN);
});

it('restricts the notification settings page to superadmin, not regional admin', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin/settings')->assertForbidden();
    $this->actingAs($this->approver)->get('/admin/settings')->assertOk();
});

// Pejabat dulu TIDAK PERNAH diberi tahu apa pun: approve() hanya menyiarkan ke petugas &
// relawan, sehingga lonceng web pejabat selalu kosong walau halaman detail insiden sudah
// dibuka untuknya sejak #41. Empat test di bawah menjaga ketiga sisi perbaikannya:
// ikut disiarkan, punya saklar siaga sendiri, dan punya tingkat siaran TERPISAH dari petugas.
it('includes pejabat in the broadcast at their own kabupaten ceiling', function () {
    Notification::fake();

    $kota = User::factory()->create(['city_code' => '5171']);
    $kota->assignRole('pejabat');

    $kotaLain = User::factory()->create(['city_code' => '5172']);
    $kotaLain->assignRole('pejabat');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($kota, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($kotaLain, \App\Notifications\EmergencyAlertNotification::class);
});

it('excludes pejabat who turned off siaga from the notification broadcast', function () {
    Notification::fake();

    $siaga = User::factory()->create(['city_code' => '5171']);
    $siaga->assignRole('pejabat');

    $nonaktif = User::factory()->create(['city_code' => '5171', 'is_standby' => false]);
    $nonaktif->assignRole('pejabat');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($siaga, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($nonaktif, \App\Notifications\EmergencyAlertNotification::class);
});

// Tingkat siaran pejabat SENGAJA punya kuncinya sendiri: menurunkan jangkauan petugas
// tidak boleh diam-diam ikut memutus notifikasi pejabat, dan sebaliknya.
it('keeps the pejabat broadcast ceiling independent from the petugas ceiling', function () {
    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::DESA->value);

    Notification::fake();

    $pejabatKota = User::factory()->create(['city_code' => '5171']);
    $pejabatKota->assignRole('pejabat');

    $petugasKota = User::factory()->create(['city_code' => '5171']);
    $petugasKota->assignRole('petugas');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($pejabatKota, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($petugasKota, \App\Notifications\EmergencyAlertNotification::class);
});

it('lets an admin lower the pejabat broadcast ceiling to desa via Setting', function () {
    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PEJABAT, TenantLevel::DESA->value);

    Notification::fake();

    $pejabatKota = User::factory()->create(['city_code' => '5171']);
    $pejabatKota->assignRole('pejabat');

    $pejabatDesa = User::factory()->create(['village_code' => '5171012006']);
    $pejabatDesa->assignRole('pejabat');

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($pejabatDesa, \App\Notifications\EmergencyAlertNotification::class);
    Notification::assertNotSentTo($pejabatKota, \App\Notifications\EmergencyAlertNotification::class);
});

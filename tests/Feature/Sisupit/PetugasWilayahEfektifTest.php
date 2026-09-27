<?php

use App\Enums\TenantLevel;
use App\Models\Report;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/*
 * TASK_63 - wilayah EFEKTIF petugas. Keluhan user 2026-09-28: "percuma notif kota/kabupaten
 * tapi waktu di klik di dashboard list data yang muncul beda". Setelan tingkat petugas kini
 * mengatur DATA yang tampil juga: yang membangunkan petugas = yang bisa ia buka.
 */

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5103', 'province_code' => '51', 'name' => 'Kabupaten Badung'],
    ]);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan'],
        ['code' => '517103', 'city_code' => '5171', 'name' => 'Denpasar Barat'],
        ['code' => '510301', 'city_code' => '5103', 'name' => 'Kuta Selatan'],
    ]);
    DB::table('indonesia_villages')->insert([
        ['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan'],
        ['code' => '5171012008', 'district_code' => '517101', 'name' => 'Pedungan'],
        ['code' => '5171032002', 'district_code' => '517103', 'name' => 'Pemecutan Kelod'],
        ['code' => '5103012001', 'district_code' => '510301', 'name' => 'Benoa'],
    ]);

    $this->denpasar = Tenant::create([
        'subdomain' => 'denpasar', 'city_code' => '5171', 'province_code' => '51',
        'nama_instansi' => 'Damkar Kota Denpasar', 'is_active' => true,
    ]);

    $this->reporter = User::factory()->create();
    $this->reporter->assignRole('warga');
    $this->approver = User::factory()->create(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);
    $this->approver->assignRole('superadmin');
});

function laporanDi(string $village, string $district, string $city, $reporter): Report
{
    return Report::create([
        'user_id' => $reporter->id, 'title' => "Kebakaran {$village}", 'description' => 'Api',
        'lat' => '-8.65', 'lng' => '115.22', 'status' => 'TERLAPOR',
        'province_code' => '51', 'city_code' => $city, 'district_code' => $district, 'village_code' => $village,
    ]);
}

function petugasBerakun(array $codes): User
{
    $user = User::factory()->create($codes + ['province_code' => '51']);
    $user->assignRole('petugas');

    return $user;
}

function petugasDesaPemogan(): User
{
    return petugasBerakun(['city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006']);
}

it('lets a desa-level petugas see, open and be woken for the whole kota when the kabupaten level is Kota', function () {
    $this->denpasar->update(['notify_level_petugas' => TenantLevel::KABUPATEN->value]);
    $petugas = petugasDesaPemogan();
    $lain = laporanDi('5171032002', '517103', '5171', $this->reporter);

    expect($petugas->fresh()->reportFeedChannel())->toBe('reports.city.5171')
        ->and($petugas->fresh()->withinReportJurisdiction($lain))->toBeTrue();

    $this->actingAs($petugas);
    expect(Report::pluck('id')->all())->toContain($lain->id);
    $this->get(route('reports.show', $lain))->assertOk();

    Notification::fake();
    $this->actingAs($this->approver)->post("/reports/{$lain->id}/approve")->assertRedirect();
    Notification::assertSentTo($petugas, EmergencyAlertNotification::class);
});

it('keeps a desa-level petugas inside the desa when the kabupaten level is Desa', function () {
    $this->denpasar->update(['notify_level_petugas' => TenantLevel::DESA->value]);
    $petugas = petugasDesaPemogan();
    $lain = laporanDi('5171012008', '517101', '5171', $this->reporter);

    expect($petugas->fresh()->reportFeedChannel())->toBe('reports.village.5171012006')
        ->and($petugas->fresh()->withinReportJurisdiction($lain))->toBeFalse();

    $this->actingAs($petugas);
    expect(Report::pluck('id')->all())->not->toContain($lain->id);

    Notification::fake();
    $this->actingAs($this->approver)->post("/reports/{$lain->id}/approve")->assertRedirect();
    Notification::assertNotSentTo($petugas, EmergencyAlertNotification::class);
});

it('wakes a narrow petugas exactly when the report is visible to them, at every level', function (TenantLevel $level, string $village, string $district) {
    $this->denpasar->update(['notify_level_petugas' => $level->value]);
    $petugas = petugasDesaPemogan();
    $report = laporanDi($village, $district, '5171', $this->reporter);

    $this->actingAs($petugas);
    $terlihat = Report::whereKey($report->id)->exists();

    Notification::fake();
    $this->actingAs($this->approver)->post("/reports/{$report->id}/approve")->assertRedirect();

    expect(Notification::sent($petugas, EmergencyAlertNotification::class)->isNotEmpty())->toBe($terlihat);
})->with([
    'desa - desa sendiri' => [TenantLevel::DESA, '5171012006', '517101'],
    'desa - desa tetangga' => [TenantLevel::DESA, '5171012008', '517101'],
    'kecamatan - sekecamatan' => [TenantLevel::KECAMATAN, '5171012008', '517101'],
    'kecamatan - kecamatan lain' => [TenantLevel::KECAMATAN, '5171032002', '517103'],
    'kota - kecamatan lain' => [TenantLevel::KABUPATEN, '5171032002', '517103'],
]);

it('widens up to the whole province when the global level is Provinsi (user decision)', function () {
    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::PROVINSI->value);
    $petugas = petugasBerakun(['city_code' => '5171', 'district_code' => null, 'village_code' => null]);
    $badung = laporanDi('5103012001', '510301', '5103', $this->reporter);

    $this->actingAs($petugas);
    expect(Report::pluck('id')->all())->toContain($badung->id);

    Notification::fake();
    $this->actingAs($this->approver)->post("/reports/{$badung->id}/approve")->assertRedirect();
    Notification::assertSentTo($petugas, EmergencyAlertNotification::class);
});

it('never narrows an account that is already wider than the level', function () {
    $this->denpasar->update(['notify_level_petugas' => TenantLevel::DESA->value]);
    $petugasKota = petugasBerakun(['city_code' => '5171', 'district_code' => null, 'village_code' => null]);
    $report = laporanDi('5171032002', '517103', '5171', $this->reporter);

    // Data tetap sesuai akun (kota) ...
    $this->actingAs($petugasKota);
    expect(Report::pluck('id')->all())->toContain($report->id);

    // ... dan tidak dibangunkan, persis perilaku sebelum wilayah efektif (TASK_62).
    Notification::fake();
    $this->actingAs($this->approver)->post("/reports/{$report->id}/approve")->assertRedirect();
    Notification::assertNotSentTo($petugasKota, EmergencyAlertNotification::class);
});

it('shows the effective area on the petugas profile card, not the desa of the account', function () {
    $this->denpasar->update(['notify_level_petugas' => TenantLevel::KABUPATEN->value]);

    $this->actingAs(petugasDesaPemogan())->get(route('profile.edit'))
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->where('jurisdiction.scope.level', 'Kabupaten/Kota')
            ->where('jurisdiction.scope.name', 'Kota Denpasar'));
});

it('does not widen roles other than petugas', function () {
    $this->denpasar->update(['notify_level_petugas' => TenantLevel::KABUPATEN->value]);
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006']);
    $admin->assignRole('admin');

    expect($admin->effectiveJurisdictionCodes()['village_code'])->toBe('5171012006');
});

it('never empties an account whose region chain is incomplete', function () {
    // Akun lama yang hanya punya village_code: memotongnya ke kota akan menyisakan NOL kode
    // dan menutup seluruh aksesnya - kebalikan dari "hanya memperluas".
    $petugas = User::factory()->create(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    expect($petugas->effectiveJurisdictionCodes()['village_code'])->toBe('5171012006')
        ->and($petugas->narrowestJurisdictionColumn())->toBe('village_code');
});

<?php

use App\Enums\TenantLevel;
use App\Models\Report;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

/*
 * TASK_62 - tingkat siaran notifikasi PETUGAS per kabupaten, diatur admin kabupaten sendiri.
 * Setelan global superadmin tetap jadi bawaan bagi kabupaten yang belum mengatur apa pun.
 */

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5103', 'province_code' => '51', 'name' => 'Kabupaten Badung'],
    ]);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $this->denpasar = Tenant::create([
        'subdomain' => 'denpasar', 'city_code' => '5171', 'province_code' => '51',
        'nama_instansi' => 'Damkar Kota Denpasar', 'is_active' => true,
    ]);
    $this->badung = Tenant::create([
        'subdomain' => 'badung', 'city_code' => '5103', 'province_code' => '51',
        'nama_instansi' => 'Damkar Badung', 'is_active' => true,
    ]);

    $reporter = User::factory()->create();
    $reporter->assignRole('warga');

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

    $this->petugasDesa = User::factory()->create(['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006']);
    $this->petugasDesa->assignRole('petugas');
    $this->petugasKota = User::factory()->create(['province_code' => '51', 'city_code' => '5171', 'district_code' => null, 'village_code' => null]);
    $this->petugasKota->assignRole('petugas');
});

function adminKabupaten(string $cityCode = '5171'): User
{
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => $cityCode, 'district_code' => null, 'village_code' => null]);
    $admin->assignRole('admin');

    return $admin;
}

it('limits the petugas broadcast to the level chosen by the report kabupaten', function () {
    Notification::fake();
    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::PROVINSI->value);
    $this->denpasar->update(['notify_level_petugas' => TenantLevel::DESA->value]);

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    Notification::assertSentTo($this->petugasDesa, EmergencyAlertNotification::class);
    Notification::assertNotSentTo($this->petugasKota, EmergencyAlertNotification::class);
});

it('does not let another kabupaten setting leak into this report', function () {
    Notification::fake();
    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::KABUPATEN->value);
    $this->badung->update(['notify_level_petugas' => TenantLevel::DESA->value]);

    $this->actingAs($this->approver)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    // Laporan di Denpasar tetap memakai global (kabupaten), setelan Badung tak berpengaruh.
    Notification::assertSentTo($this->petugasKota, EmergencyAlertNotification::class);
});

it('falls back to the global setting when the kabupaten has no choice or an invalid one', function () {
    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::KECAMATAN->value);

    expect(Tenant::petugasNotifyLevel('5171'))->toBe(TenantLevel::KECAMATAN);

    // "provinsi" bukan pilihan sah admin kabupaten - diabaikan, bukan dipakai.
    $this->denpasar->update(['notify_level_petugas' => TenantLevel::PROVINSI->value]);
    expect(Tenant::petugasNotifyLevel('5171'))->toBe(TenantLevel::KECAMATAN);

    $this->denpasar->update(['notify_level_petugas' => TenantLevel::KABUPATEN->value]);
    expect(Tenant::petugasNotifyLevel('5171'))->toBe(TenantLevel::KABUPATEN)
        ->and(Tenant::petugasNotifyLevel(null))->toBe(TenantLevel::KECAMATAN);
});

it('lets a kabupaten admin save the level for their own kabupaten only', function () {
    $admin = adminKabupaten('5171');

    $this->actingAs($admin)->get(route('admin.notification-level.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/NotificationLevel/Edit')
            ->where('notify_level_petugas', '')
            ->has('levels', 3));

    $this->actingAs($admin)->put(route('admin.notification-level.update'), [
        'notify_level_petugas' => TenantLevel::DESA->value,
        // Upaya menyasar kabupaten lain lewat request harus diabaikan.
        'city_code' => '5103',
    ])->assertRedirect(route('admin.notification-level.edit'));

    expect($this->denpasar->fresh()->notify_level_petugas)->toBe('desa')
        ->and($this->badung->fresh()->notify_level_petugas)->toBeNull();

    // Kosong = kembali ikut global.
    $this->actingAs($admin)->put(route('admin.notification-level.update'), ['notify_level_petugas' => null])
        ->assertRedirect();
    expect($this->denpasar->fresh()->notify_level_petugas)->toBeNull();
});

it('rejects provinsi from a kabupaten admin', function () {
    $this->actingAs(adminKabupaten())->put(route('admin.notification-level.update'), [
        'notify_level_petugas' => TenantLevel::PROVINSI->value,
    ])->assertSessionHasErrors('notify_level_petugas');

    expect($this->denpasar->fresh()->notify_level_petugas)->toBeNull();
});

it('refuses admins below kabupaten level, petugas, and superadmin without a kabupaten', function () {
    $adminKecamatan = User::factory()->create(['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => null]);
    $adminKecamatan->assignRole('admin');
    $this->actingAs($adminKecamatan)->get(route('admin.notification-level.edit'))->assertNotFound();
    $this->actingAs($adminKecamatan)->put(route('admin.notification-level.update'), ['notify_level_petugas' => 'desa'])->assertNotFound();

    $this->actingAs($this->petugasKota)->get(route('admin.notification-level.edit'))->assertForbidden();

    $superadmin = User::factory()->create(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);
    $superadmin->assignRole('superadmin');
    $this->actingAs($superadmin)->get(route('admin.notification-level.edit'))->assertNotFound();

    expect($this->denpasar->fresh()->notify_level_petugas)->toBeNull();
});

it('shows the menu only to accounts the page accepts', function () {
    $this->actingAs(adminKabupaten())->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('auth.user.notify_level_editable', true));

    $adminKecamatan = User::factory()->create(['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => null]);
    $adminKecamatan->assignRole('admin');
    $this->actingAs($adminKecamatan)->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('auth.user.notify_level_editable', false));
});

it('reads the petugas ceiling only through Tenant::petugasNotifyLevel in controllers', function () {
    // Rumus kedua di satu titik siaran = kabupaten yang setelannya diabaikan diam-diam untuk
    // jalur itu saja (laporan masuk, broadcast, atau konfirmasi OPD).
    foreach (['ReportController', 'ReportActionController'] as $controller) {
        $code = file_get_contents(app_path("Http/Controllers/{$controller}.php"));
        expect($code)->not->toMatch('/KEY_NOTIFY_LEVEL_PETUGAS\s*,/');
    }
});

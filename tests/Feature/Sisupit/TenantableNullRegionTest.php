<?php

use App\Models\Report;
use App\Models\User;

/** Buat laporan di dua wilayah berbeda untuk menguji cakupan Tenantable. */
function seedTwoRegionReports(): void
{
    $owner = User::factory()->create(['village_code' => '5171012006']);
    Report::create([
        'user_id' => $owner->id, 'title' => 'A', 'status' => 'pending',
        'lat' => '-8.6', 'lng' => '115.2',
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
    ]);
    Report::create([
        'user_id' => $owner->id, 'title' => 'B', 'status' => 'pending',
        'lat' => '-6.2', 'lng' => '106.8',
        'province_code' => '31', 'city_code' => '3171', 'district_code' => '317101', 'village_code' => '3171012006',
    ]);
}

it('denies national access to a logged-in user without any region (Google/unfinished profile)', function () {
    seedTwoRegionReports();

    // Persis kondisi akun Google yang belum melengkapi profil: masyarakat, tanpa kode wilayah.
    $user = User::factory()->create();
    $user->assignRole('masyarakat');
    $user->update(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);

    $this->actingAs($user);

    // BUG lama: melihat KEDUA laporan nasional. Sekarang: 0 (Tenantable menutup total).
    expect(Report::count())->toBe(0);
});

it('still scopes a user with a region to their own region only', function () {
    seedTwoRegionReports();

    $user = User::factory()->create(['village_code' => '5171012006']);
    $user->assignRole('masyarakat');

    $this->actingAs($user);

    expect(Report::count())->toBe(1);
    expect(Report::first()->title)->toBe('A');
});

it('keeps national access for superadmin', function () {
    seedTwoRegionReports();

    $su = User::factory()->create();
    $su->assignRole('superadmin');
    $su->update(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);

    $this->actingAs($su);

    expect(Report::count())->toBe(2);
});

// --- scopeIsAdmin (daftar /admin/users & relawan) — pola null-region yang sama ---

it('denies a region-less admin national visibility of users (scopeIsAdmin)', function () {
    User::factory()->count(2)->create(['city_code' => '5171']);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $admin->update(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);

    $this->actingAs($admin);

    expect(User::isAdmin()->count())->toBe(0);
});

it('scopes a region admin to their own city on the user list', function () {
    User::factory()->create(['city_code' => '5171']);
    User::factory()->create(['city_code' => '3171']);

    $admin = User::factory()->create(['city_code' => '5171']);
    $admin->assignRole('admin');

    $this->actingAs($admin);

    expect(User::isAdmin()->get()->every(fn ($u) => $u->city_code === '5171'))->toBeTrue();
});

// --- withinReportJurisdiction — pola null-region yang sama ---

it('denies report jurisdiction to a region-less non-superadmin staff', function () {
    $owner = User::factory()->create(['village_code' => '5171012006']);
    $report = Report::create([
        'user_id' => $owner->id, 'title' => 'X', 'status' => 'pending',
        'lat' => '-8.6', 'lng' => '115.2',
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
    ]);

    $staff = User::factory()->create();
    $staff->assignRole('petugas');
    $staff->update(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);

    expect($staff->withinReportJurisdiction($report))->toBeFalse();
});

it('grants report jurisdiction to matching-region staff and to superadmin', function () {
    $owner = User::factory()->create(['village_code' => '5171012006']);
    $report = Report::create([
        'user_id' => $owner->id, 'title' => 'X', 'status' => 'pending',
        'lat' => '-8.6', 'lng' => '115.2',
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
    ]);

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');
    expect($petugas->withinReportJurisdiction($report))->toBeTrue();

    $su = User::factory()->create();
    $su->assignRole('superadmin');
    $su->update(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);
    expect($su->withinReportJurisdiction($report))->toBeTrue();
});

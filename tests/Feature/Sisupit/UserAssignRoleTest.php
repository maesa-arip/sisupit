<?php

use App\Models\User;

function makeUserWithRegion(array $codes = []): User
{
    return User::factory()->create(array_merge([
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ], $codes));
}

it('lets an admin assign petugas and trims the region to the chosen level', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $target = makeUserWithRegion();

    $this->actingAs($admin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'petugas', 'level' => 'kabupaten'])
        ->assertRedirect();

    $target->refresh();
    expect($target->hasRole('petugas'))->toBeTrue();
    expect($target->city_code)->toBe('5171');
    expect($target->district_code)->toBeNull();
    expect($target->village_code)->toBeNull();
});

it('blocks an admin from escalating a user to admin', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $target = makeUserWithRegion();

    $this->actingAs($admin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'admin', 'level' => 'provinsi'])
        ->assertSessionHasErrors('role');

    expect($target->refresh()->hasRole('admin'))->toBeFalse();
});

it('blocks anyone from assigning the superadmin role', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $target = makeUserWithRegion();

    $this->actingAs($superadmin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'superadmin', 'level' => 'desa'])
        ->assertSessionHasErrors('role');

    expect($target->refresh()->hasRole('superadmin'))->toBeFalse();
});

it('blocks an admin from granting a level broader than their own jurisdiction', function () {
    $cityAdmin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $cityAdmin->assignRole('admin');

    $target = makeUserWithRegion();

    $this->actingAs($cityAdmin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'petugas', 'level' => 'provinsi'])
        ->assertSessionHasErrors('level');

    expect($target->refresh()->hasRole('petugas'))->toBeFalse();
});

it('blocks a level deeper than the data the user actually has', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $target = User::factory()->create(['province_code' => '51']); // hanya sampai provinsi

    $this->actingAs($admin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'petugas', 'level' => 'kabupaten'])
        ->assertSessionHasErrors('level');

    expect($target->refresh()->hasRole('petugas'))->toBeFalse();
});

it('blocks an admin from assigning a role to a user outside their jurisdiction', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $target = User::factory()->create(['province_code' => '31']);

    $this->actingAs($admin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'petugas', 'level' => 'provinsi'])
        ->assertForbidden();

    expect($target->refresh()->hasRole('petugas'))->toBeFalse();
});

it('lets superadmin assign the admin role to any user', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $target = User::factory()->create(['province_code' => '31']);

    $this->actingAs($superadmin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'admin', 'level' => 'provinsi'])
        ->assertRedirect();

    expect($target->refresh()->hasRole('admin'))->toBeTrue();
});

it('keeps the full region when assigning a non-jurisdictional role', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    $target = makeUserWithRegion();

    $this->actingAs($admin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'relawan'])
        ->assertRedirect();

    $target->refresh();
    expect($target->hasRole('relawan'))->toBeTrue();
    expect($target->village_code)->toBe('5171012006');
});

// Peran `opd` ikut daftar yang boleh diberikan ADMIN WILAYAH (permintaan user 2026-08-27,
// FINDINGS #89). Sebelumnya hanya superadmin yang bisa, padahal admin kabupaten justru yang
// mengelola master OPD di /admin/agencies — ia bisa mendaftarkan instansinya tapi tidak bisa
// membuatkan akunnya. Ini BUKAN eskalasi: `opd` di luar User::STAFF_ROLES.
it('lets a region admin assign the OPD role and link the account to an agency', function () {
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $agency = App\Models\Agency::create([
        'name' => 'PLN ULP Denpasar', 'code' => 'PLN', 'is_active' => true,
        'province_code' => '51', 'city_code' => '5171',
    ]);

    $target = makeUserWithRegion();

    $this->actingAs($admin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'opd', 'agency_id' => $agency->id])
        ->assertRedirect();

    $target->refresh();
    expect($target->hasRole('opd'))->toBeTrue();
    expect($target->agency_id)->toBe($agency->id);
});

// Pilihan perannya harus benar-benar SAMPAI ke layar Manajemen Pengguna — daftar yang tak
// memuat `opd` membuat tombolnya tak pernah ada, persis keluhan yang memunculkan #89.
it('offers the OPD role on the user management screen for a region admin', function () {
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $props = $this->actingAs($admin)->get('/admin/users')->original->getData()['page']['props'];

    expect($props['assignable_roles'])->toContain('opd');
    // Batas lama TETAP berlaku: admin tak boleh mengangkat admin/superadmin.
    expect($props['assignable_roles'])->not->toContain('admin');
    expect($props['assignable_roles'])->not->toContain('superadmin');
});

// Penautan instansi tetap dijaga Tenantable: admin hanya boleh menunjuk OPD di wilayahnya.
it('refuses an OPD link to an agency outside the admin jurisdiction', function () {
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $agencyLuar = App\Models\Agency::create([
        'name' => 'PLN UP3 Bandung', 'code' => 'PLNBDG', 'is_active' => true,
        'province_code' => '32', 'city_code' => '3273',
    ]);

    $target = makeUserWithRegion();

    $this->actingAs($admin)
        ->put("/admin/users/assign-role/{$target->id}", ['role' => 'opd', 'agency_id' => $agencyLuar->id])
        ->assertSessionHasErrors('agency_id');

    expect($target->refresh()->hasRole('opd'))->toBeFalse();
});

<?php

use App\Models\User;

/**
 * Form Tambah Pengguna di /admin/users/create (2026-09-29, permintaan user).
 *
 * Dulu akun yang dibuat admin lahir TANPA peran dan BELUM terverifikasi. Semua route
 * ber-middleware `verified`, sementara jalur ini tak pernah mengirim email verifikasi -
 * jadi petugas baru tertahan di layar "Verifikasi Email" (login Google pun tak menolong,
 * SocialiteController tak menandai email akun yang sudah ada). Kini admin memilih peran
 * saat membuat akun, dan akunnya langsung terverifikasi karena admin yang menjaminnya.
 */
function cityAdmin(): User
{
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    return $admin;
}

function newUserPayload(array $extra = []): array
{
    return array_merge([
        'name' => 'Petugas Baru',
        'email' => 'petugas.baru@example.test',
        'password' => 'rahasia123',
        'password_confirmation' => 'rahasia123',
    ], $extra);
}

it('creates a verified petugas with the chosen role and jurisdiction level', function () {
    $this->actingAs(cityAdmin())
        ->post('/admin/users/create', newUserPayload(['role' => 'petugas', 'level' => 'kabupaten']))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.users.index'));

    $user = User::where('email', 'petugas.baru@example.test')->firstOrFail();

    expect($user->hasVerifiedEmail())->toBeTrue();
    expect($user->hasRole('petugas'))->toBeTrue();
    expect($user->city_code)->toBe('5171');
    expect($user->district_code)->toBeNull();
});

it('lets a newly created petugas past the verified middleware', function () {
    $this->actingAs(cityAdmin())
        ->post('/admin/users/create', newUserPayload(['role' => 'petugas', 'level' => 'kabupaten']));

    $user = User::where('email', 'petugas.baru@example.test')->firstOrFail();

    $this->actingAs($user)->get('/dashboard')->assertOk();
});

it('rejects a role above the admin authority without leaving a role-less account behind', function () {
    $this->actingAs(cityAdmin())
        ->post('/admin/users/create', newUserPayload(['role' => 'admin', 'level' => 'kabupaten']))
        ->assertSessionHasErrors('role');

    expect(User::where('email', 'petugas.baru@example.test')->exists())->toBeFalse();
});

it('requires a role when creating a user', function () {
    $this->actingAs(cityAdmin())
        ->post('/admin/users/create', newUserPayload())
        ->assertSessionHasErrors('role');

    expect(User::where('email', 'petugas.baru@example.test')->exists())->toBeFalse();
});

it('requires an agency when creating an opd account', function () {
    $this->actingAs(cityAdmin())
        ->post('/admin/users/create', newUserPayload(['role' => 'opd']))
        ->assertSessionHasErrors('agency_id');

    expect(User::where('email', 'petugas.baru@example.test')->exists())->toBeFalse();
});

<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

/*
 * TASK_61 - kode wilayah akun bagi petugas/staf berarti wilayah TUGAS, bukan tempat tinggal
 * (mis. tinggal di Badung, bertugas di Damkar Denpasar). Tempat tinggal dicatat terpisah di
 * `users.address` ("Alamat Tinggal"), yang TIDAK BOLEH ikut menggeser kode wilayah akun:
 * kode itulah yang menentukan laporan & notifikasi yang diterima.
 */

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
});

function petugasKotaDenpasar(): User
{
    $user = User::factory()->create([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => null, 'village_code' => null,
    ]);
    $user->assignRole('petugas');

    return $user;
}

it('lets the account owner save a home address without touching the account region', function () {
    $petugas = petugasKotaDenpasar();

    $this->actingAs($petugas)->post(route('profile.update'), [
        '_method' => 'patch',
        'name' => $petugas->name,
        'email' => $petugas->email,
        'phone' => '081234567890',
        'address' => 'Jl. Raya Kerobokan No. 5, Kuta Utara, Badung',
        // Kode wilayah yang ikut terkirim harus DIABAIKAN - alamat tinggal bukan jalan
        // memindahkan wilayah tugas.
        'city_code' => '5103',
        'village_code' => '5171012006',
    ])->assertRedirect(route('profile.edit'));

    $petugas->refresh();
    expect($petugas->address)->toBe('Jl. Raya Kerobokan No. 5, Kuta Utara, Badung')
        ->and($petugas->city_code)->toBe('5171')
        ->and($petugas->village_code)->toBeNull();
});

it('shares the home address with the profile form through auth.user', function () {
    $petugas = petugasKotaDenpasar();
    $petugas->update(['address' => 'Jl. Gunung Salak, Badung']);

    $this->actingAs($petugas)->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('auth.user.address', 'Jl. Gunung Salak, Badung'));
});

it('labels the account region as duty area for centrally managed roles and domicile for others', function (string $role, string $kind) {
    $user = User::factory()->create([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
    ]);
    $user->assignRole($role);

    $this->actingAs($user)->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('jurisdiction.kind', $kind));
})->with([
    'petugas' => ['petugas', 'tugas'],
    'admin' => ['admin', 'tugas'],
    'warga' => ['warga', 'domisili'],
    'relawan' => ['relawan', 'domisili'],
]);

it('picks the region card title from the server prop, not a role list in JSX', function () {
    $jsx = file_get_contents(resource_path('js/Pages/Profile/Edit.jsx'));

    expect($jsx)->toMatch("/jurisdiction\\.kind === 'tugas'/")
        ->and($jsx)->not->toMatch('/\\bYurisdiksi Akun\\b/');

    $form = file_get_contents(resource_path('js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx'));
    expect($form)->toMatch('/name="address"/');
});

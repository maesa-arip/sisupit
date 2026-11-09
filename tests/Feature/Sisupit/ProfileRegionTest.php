<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Ubah wilayah dari Profil (permintaan user 2026-11-06): warga yang mendaftar saat berada di
 * Bangli/Badung terisi wilayah itu dan tak bisa memperbaikinya. Keputusan user: warga/relawan
 * boleh mengubah sendiri; wilayah petugas & peran terpusat lain hanya diatur admin.
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5106', 'province_code' => '51', 'name' => 'Kabupaten Bangli'],
    ]);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan'],
        ['code' => '510601', 'city_code' => '5106', 'name' => 'Susut'],
    ]);
    DB::table('indonesia_villages')->insert([
        ['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan'],
        ['code' => '5106012001', 'district_code' => '510601', 'name' => 'Abuan'],
    ]);

    $this->denpasar = [
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
    ];
    $this->bangli = [
        'province_code' => '51', 'city_code' => '5106', 'district_code' => '510601', 'village_code' => '5106012001',
    ];
});

it('lets a warga move their domicile area from the profile page', function () {
    $warga = User::factory()->create($this->bangli);
    $warga->assignRole('warga');

    $this->actingAs($warga)->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page->where('regionForm.codes.city_code', '5106'));

    $this->actingAs($warga)->patch(route('profile.region'), $this->denpasar)
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($warga->fresh()->only(array_keys($this->denpasar)))->toBe($this->denpasar);
});

it('refuses a region chain that does not belong together', function () {
    $warga = User::factory()->create($this->bangli);
    $warga->assignRole('warga');

    $this->actingAs($warga)
        ->patch(route('profile.region'), [...$this->denpasar, 'village_code' => '5106012001'])
        ->assertSessionHasErrors('village_code');

    expect($warga->fresh()->city_code)->toBe('5106');
});

it('keeps the work area of petugas and other centrally managed roles in admin hands', function () {
    foreach (['petugas', 'admin', 'pejabat', 'opd'] as $role) {
        $user = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
        $user->assignRole($role);

        $this->actingAs($user)->get(route('profile.edit'))
            ->assertInertia(fn ($page) => $page->where('regionForm', null));
        $this->actingAs($user)->patch(route('profile.region'), $this->bangli)->assertForbidden();

        expect($user->fresh()->city_code)->toBe('5171');
    }
});

it('tells new sign-ups to enter where they live, not their work area', function () {
    $page = file_get_contents(resource_path('js/Pages/Profile/CompleteProfile.jsx'));
    $fields = file_get_contents(resource_path('js/Components/RegionFields.jsx'));

    expect($page)->toContain('<RegionFields')
        ->and($page)->toContain('Petugas Damkar?')
        // Deteksi di luar kota tenant tak diisikan diam-diam.
        ->and($fields)->toContain('tenantCity && cCode && cCode !== tenantCity')
        ->and($fields)->toContain('Tetap pakai lokasi terdeteksi');
});

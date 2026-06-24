<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
});

it('forces a masyarakat user without a complete profile to the onboarding page', function () {
    $user = User::factory()->create(['phone' => null]);
    $user->assignRole('masyarakat');

    $this->actingAs($user)->get('/dashboard')->assertRedirect(route('profile.complete'));
});

it('does not redirect loop on the onboarding page itself', function () {
    $user = User::factory()->create(['phone' => null]);
    $user->assignRole('masyarakat');

    $this->actingAs($user)->get(route('profile.complete'))->assertOk();
});

it('lets a user with a complete profile reach the dashboard normally', function () {
    $user = User::factory()->create(['village_code' => '5171012006']);
    $user->assignRole('masyarakat');

    $this->actingAs($user)->get('/dashboard')->assertOk();
});

it('saves the completed profile and redirects to the dashboard', function () {
    $user = User::factory()->create(['phone' => null]);
    $user->assignRole('masyarakat');

    $this->actingAs($user)->post(route('profile.complete.store'), [
        'phone' => '081234567890',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ])->assertRedirect(route('dashboard'));

    $user->refresh();
    expect($user->phone)->toBe('081234567890');
    expect($user->village_code)->toBe('5171012006');
});

it('does not force staff roles like admin through onboarding', function () {
    $admin = User::factory()->create(['phone' => null]);
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/dashboard')->assertOk();
});

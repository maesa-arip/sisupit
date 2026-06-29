<?php

use App\Models\Unit;
use App\Models\User;

it('lets an admin create a unit scoped to their jurisdiction', function () {
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->post('/admin/units', [
        'name' => 'Truk Pemadam 01',
        'type' => 'Truk Pemadam',
        'status' => 'available',
    ])->assertRedirect(route('admin.units.index'));

    $unit = Unit::withoutGlobalScopes()->first();
    expect($unit->name)->toBe('Truk Pemadam 01');
    expect($unit->city_code)->toBe('5171');
    expect($unit->status)->toBe('available');
});

it('only lists units within the admin jurisdiction', function () {
    Unit::create(['name' => 'Unit Kota A', 'type' => 'Truk Pemadam', 'status' => 'available', 'province_code' => '51', 'city_code' => '5171']);
    Unit::create(['name' => 'Unit Kota B', 'type' => 'Truk Pemadam', 'status' => 'available', 'province_code' => '31', 'city_code' => '3171']);

    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    // Scope Tenantable membatasi unit ke wilayah admin (mekanisme yang dipakai controller index).
    $this->actingAs($admin);
    $names = Unit::pluck('name')->all();
    expect($names)->toContain('Unit Kota A');
    expect($names)->not->toContain('Unit Kota B');
});

it('blocks non-admin from managing units', function () {
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $this->actingAs($citizen)->get('/admin/units')->assertForbidden();
});

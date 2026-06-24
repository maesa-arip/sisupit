<?php

use App\Models\User;

it('assigns the masyarakat role to a freshly registered user', function () {
    $response = $this->post('/register', [
        'name' => 'Warga Uji',
        'email' => 'warga@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'warga@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user->hasRole('masyarakat'))->toBeTrue();
});

it('blocks masyarakat from admin routes', function () {
    $user = User::factory()->create(['village_code' => '5171012006']);
    $user->assignRole('masyarakat');

    $response = $this->actingAs($user)->get('/admin/users');

    $response->assertForbidden();
});

it('allows admin to reach admin routes', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $response = $this->actingAs($user)->get('/admin/users');

    $response->assertOk();
});

it('allows superadmin to bypass role checks via Gate::before', function () {
    $user = User::factory()->create();
    $user->assignRole('superadmin');

    $response = $this->actingAs($user)->get('/admin/users');

    $response->assertOk();
});

it('blocks non-admin roles from hydrant, role and permission management', function () {
    $user = User::factory()->create(['village_code' => '5171012006']);
    $user->assignRole('relawan');

    $this->actingAs($user)->get('/admin/hydrants')->assertForbidden();
    $this->actingAs($user)->get('/admin/roles')->assertForbidden();
    $this->actingAs($user)->get('/admin/permissions')->assertForbidden();
    $this->actingAs($user)->get('/admin/assign-users')->assertForbidden();
});

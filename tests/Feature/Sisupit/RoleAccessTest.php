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
});

it('blocks a regional admin from RBAC and global announcement management', function () {
    // RBAC sistem (role/permission/route-access) + pengumuman global = lintas-tenant,
    // hanya superadmin. Admin wilayah tak boleh mendefinisikan ulang model akses global.
    $admin = User::factory()->create(['city_code' => '5171']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin/roles')->assertForbidden();
    $this->actingAs($admin)->get('/admin/permissions')->assertForbidden();
    $this->actingAs($admin)->get('/admin/assign-permissions')->assertForbidden();
    $this->actingAs($admin)->get('/admin/route-accesses')->assertForbidden();
    $this->actingAs($admin)->get('/admin/announcements')->assertForbidden();
});

it('lets superadmin reach RBAC and global announcement management', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $this->actingAs($superadmin)->get('/admin/roles')->assertOk();
    $this->actingAs($superadmin)->get('/admin/permissions')->assertOk();
    $this->actingAs($superadmin)->get('/admin/assign-permissions')->assertOk();
    $this->actingAs($superadmin)->get('/admin/route-accesses')->assertOk();
    $this->actingAs($superadmin)->get('/admin/announcements')->assertOk();
});

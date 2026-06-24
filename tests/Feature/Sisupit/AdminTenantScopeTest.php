<?php

use App\Models\User;

it('only lists users within the logged-in admin jurisdiction', function () {
    $adminBali = User::factory()->create(['province_code' => '51']);
    $adminBali->assignRole('admin');

    $userInBali = User::factory()->create(['province_code' => '51']);
    $userOutsideBali = User::factory()->create(['province_code' => '31']);

    $response = $this->actingAs($adminBali)->get('/admin/users');

    $users = $response->original->getData()['page']['props']['users']['data'];
    $ids = array_column($users, 'id');

    expect($ids)->toContain($userInBali->id);
    expect($ids)->not->toContain($userOutsideBali->id);
});

it('blocks an admin from editing a user outside their jurisdiction', function () {
    $adminBali = User::factory()->create(['province_code' => '51']);
    $adminBali->assignRole('admin');

    $userOutsideBali = User::factory()->create(['province_code' => '31']);

    $this->actingAs($adminBali)->get("/admin/users/edit/{$userOutsideBali->id}")->assertForbidden();
});

it('lets superadmin manage users regardless of jurisdiction', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $userOutsideBali = User::factory()->create(['province_code' => '31']);

    $this->actingAs($superadmin)->get("/admin/users/edit/{$userOutsideBali->id}")->assertOk();
});

<?php

use App\Models\User;

it('only lists volunteers within the logged-in officer jurisdiction', function () {
    $petugasBali = User::factory()->create(['province_code' => '51']);
    $petugasBali->assignRole('petugas');

    $relawanInBali = User::factory()->create(['province_code' => '51']);
    $relawanInBali->assignRole('relawan');

    $relawanOutside = User::factory()->create(['province_code' => '31']);
    $relawanOutside->assignRole('relawan');

    $response = $this->actingAs($petugasBali)->get('/relawan');

    $volunteers = $response->original->getData()['page']['props']['volunteers']['data'];
    $ids = array_column($volunteers, 'id');

    expect($ids)->toContain($relawanInBali->id);
    expect($ids)->not->toContain($relawanOutside->id);
});

it('blocks an officer from viewing a volunteer outside their jurisdiction', function () {
    $petugasBali = User::factory()->create(['province_code' => '51']);
    $petugasBali->assignRole('petugas');

    $relawanOutside = User::factory()->create(['province_code' => '31']);
    $relawanOutside->assignRole('relawan');

    $this->actingAs($petugasBali)->get("/relawan/{$relawanOutside->id}")->assertNotFound();
});

it('lets superadmin see volunteers regardless of jurisdiction', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $relawanOutside = User::factory()->create(['province_code' => '31']);
    $relawanOutside->assignRole('relawan');

    $this->actingAs($superadmin)->get("/relawan/{$relawanOutside->id}")->assertOk();
});

it('keeps the volunteer list closed to the public (non-staff roles)', function () {
    // Profil sengaja dilengkapi (phone + village_code) agar lolos EnsureProfileComplete
    // dan benar-benar sampai ke gating role, bukan ter-redirect ke complete-profile.
    $masyarakat = User::factory()->create([
        'province_code' => '51',
        'phone' => '08123456789',
        'village_code' => '5101010001',
    ]);
    $masyarakat->assignRole('masyarakat');

    $this->actingAs($masyarakat)->get('/relawan')->assertForbidden();
});

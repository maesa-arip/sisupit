<?php

use App\Models\Agency;
use App\Models\User;

/**
 * Dashboard akun OPD (TASK_27, jalur 2b DashboardController).
 *
 * Akun OPD sengaja TIDAK punya kode wilayah: ia mitra LUAR Damkar, relevansinya ditentukan
 * keanggotaan `report_agencies` + `agency_id`, bukan wilayah. Konsekuensinya setiap query
 * ber-Tenantable yang dipakai untuk akun ini akan jatuh ke cabang "tanpa kode wilayah →
 * whereRaw('1 = 0')" (#44) dan mengembalikan kosong — itulah yang dulu membuat dashboard
 * menuduh akun yang SUDAH tertaut sebagai "belum ditautkan ke instansi mana pun".
 */
function opdAccount(Agency $agency): User
{
    $user = User::factory()->create([
        'province_code' => null,
        'city_code' => null,
        'district_code' => null,
        'village_code' => null,
        'agency_id' => $agency->id,
    ]);
    $user->assignRole('opd');

    return $user;
}

it('shows the agency name for an OPD account that has no region codes', function () {
    $agency = Agency::create([
        'name' => 'PLN UP3 Bali Selatan',
        'code' => 'PLN',
        'is_active' => true,
        'province_code' => '51',
        'city_code' => '5171',
    ]);

    $this->actingAs(opdAccount($agency));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Opd/Dashboard')
                // BUG lama: null, karena relasi $user->agency ber-Tenantable dan akun OPD
                // tak punya kode wilayah → dashboard memasang peringatan yang keliru.
                ->where('agencyName', 'PLN UP3 Bali Selatan')
        );
});

it('still reports no agency when the account really is unlinked', function () {
    $user = User::factory()->create([
        'province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null,
        'agency_id' => null,
    ]);
    $user->assignRole('opd');

    $this->actingAs($user);

    // Peringatan "belum ditautkan" harus tetap muncul untuk kasus yang memang benar.
    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Opd/Dashboard')->where('agencyName', null));
});

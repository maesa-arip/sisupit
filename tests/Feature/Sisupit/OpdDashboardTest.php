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

// ARSIP & RIWAYAT akun OPD (FINDINGS #91, permintaan user 2026-08-27).
//
// Menu "Arsip & Riwayat" SELALU kosong bagi OPD sebelum ini, dan kedua jalur lama sama-sama
// buntu: tab "Riwayat Saya" menyaring `user_id` (OPD tak pernah membuat laporan) dan tab
// "Semua Laporan" ber-Tenantable, yang bagi akun tanpa kode wilayah = whereRaw('1 = 0') (#44).
// Yang bermakna baginya adalah KEANGGOTAAN report_agencies — gerbang yang sama dengan
// ReportController::show() dan dashboard OPD.
it('lists the incidents the agency was asked to help with in its archive', function () {
    $agency = Agency::create(['name' => 'PLN ULP Denpasar', 'code' => 'PLN', 'is_active' => true, 'city_code' => '5171']);
    $lain = Agency::create(['name' => 'BPBD Kota Denpasar', 'code' => 'BPBD', 'is_active' => true, 'city_code' => '5171']);

    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('warga');

    $diminta = App\Models\Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah, listrik perlu dipadamkan',
        'address' => 'Jl. Pemogan No. 1',
        'status' => 'handling',
        'village_code' => '5171012006',
    ]);
    $tidakDiminta = App\Models\Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran lahan kosong',
        'address' => 'Jl. Cargo No. 9',
        'status' => 'handling',
        'village_code' => '5171012006',
    ]);

    App\Models\ReportAgency::create([
        'report_id' => $diminta->id, 'agency_id' => $agency->id,
        'agency_name' => 'PLN ULP Denpasar', 'notified_at' => now(),
    ]);
    // Insiden yang diminta ke INSTANSI LAIN tidak boleh ikut terlihat.
    App\Models\ReportAgency::create([
        'report_id' => $tidakDiminta->id, 'agency_id' => $lain->id,
        'agency_name' => 'BPBD Kota Denpasar', 'notified_at' => now(),
    ]);

    $props = $this->actingAs(opdAccount($agency))
        ->get(route('front.reports.index'))
        ->original->getData()['page']['props'];

    $ids = array_column($props['reports']['data'], 'id');

    expect($ids)->toContain($diminta->id);
    expect($ids)->not->toContain($tidakDiminta->id);
    // Kedua tab lama tak berlaku bagi OPD; frontend menyembunyikannya lewat prop ini.
    expect($props['scope'])->toBe('agency');
});

// Tab "Riwayat Saya" tidak boleh jadi celah kembali ke jalur lama: apa pun filternya, akun OPD
// tetap melihat daftar ber-cakupan instansinya.
it('keeps the OPD archive agency-scoped even when the mine filter is requested', function () {
    $agency = Agency::create(['name' => 'PLN ULP Denpasar', 'code' => 'PLN', 'is_active' => true, 'city_code' => '5171']);

    $props = $this->actingAs(opdAccount($agency))
        ->get(route('front.reports.index', ['filter' => 'mine']))
        ->original->getData()['page']['props'];

    expect($props['scope'])->toBe('agency');
});

// Akun OPD yang BELUM ditautkan ke instansi mana pun tidak melihat apa-apa — bukan melihat
// semuanya. Ini re-check ownership yang menyertai withoutGlobalScopes() (ATURAN EMAS #7).
it('shows nothing to an OPD account that is not linked to any agency', function () {
    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('warga');

    App\Models\Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'address' => 'Jl. Pemogan No. 1',
        'status' => 'handling',
        'village_code' => '5171012006',
    ]);

    $lepas = User::factory()->create([
        'province_code' => null, 'city_code' => null, 'district_code' => null,
        'village_code' => null, 'agency_id' => null,
    ]);
    $lepas->assignRole('opd');

    $props = $this->actingAs($lepas)
        ->get(route('front.reports.index'))
        ->original->getData()['page']['props'];

    expect($props['reports']['data'])->toBeEmpty();
});

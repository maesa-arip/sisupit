<?php

use App\Models\User;

// "Lihat Semua Laporan" (front.reports.index) memakai tampilan pemantauan ala admin/reports
// untuk pejabat & relawan (read-only, TANPA afordans verifikasi/ekspor), tapi tetap daftar
// arsip sederhana untuk warga. Tab "Riwayat Saya" (filter=mine) tetap daftar milik sendiri.
it('shows the admin-style monitoring view to a pejabat without verify/export affordances', function () {
    $pejabat = User::factory()->create(['city_code' => '5171']);
    $pejabat->assignRole('pejabat');

    $this->actingAs($pejabat)->get(route('front.reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Reports/Index')
            ->where('canVerify', false)
            ->where('canExport', false)
            ->where('indexRouteName', 'front.reports.index'));
});

it('shows the admin-style monitoring view to a relawan', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006', 'phone' => '081100000001']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->get(route('front.reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Reports/Index')->where('canVerify', false));
});

it('keeps the simple archive list for a warga', function () {
    $warga = User::factory()->create(['village_code' => '5171012006', 'phone' => '081100000002']);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)->get(route('front.reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Front/Reports/Index'));
});

it('keeps the personal Riwayat Saya list for a relawan on filter=mine', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006', 'phone' => '081100000003']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->get(route('front.reports.index', ['filter' => 'mine']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Front/Reports/Index'));
});

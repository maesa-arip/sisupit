<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// FINDINGS #133 — kartu "Relawan Standby" di dashboard admin menghitung relawan siaga DITAMBAH
// seluruh petugas, sedangkan daftar yang dibuka kartu itu (`/relawan?status=siaga`) hanya memuat
// relawan. Di produksi admin Denpasar membaca 98 lalu mendapati 13 orang (85 = petugas).
// Penjaganya mengadu ANGKA KARTU dengan TOTAL DAFTAR tujuannya lewat dua request sungguhan,
// bukan dengan angka yang ditulis di sini - supaya kedua query tak bisa menyimpang lagi.

it('counts the same standby volunteers the card links to', function () {
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    foreach ([true, true, false] as $siaga) {
        User::factory()->create(['city_code' => '5171', 'is_standby' => $siaga])->assignRole('relawan');
    }
    foreach (range(1, 3) as $_) {
        User::factory()->create(['city_code' => '5171', 'is_standby' => true])->assignRole('petugas');
    }
    // Wilayah lain tak boleh ikut terhitung.
    User::factory()->create(['city_code' => '5103', 'is_standby' => true])->assignRole('relawan');

    $card = $this->actingAs($admin)->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard'))
        ->viewData('page')['props']['stats']['standby_helpers'];

    $listed = $this->actingAs($admin)->get(route('front.volunteers.index', ['status' => 'siaga']))
        ->viewData('page')['props']['volunteers']['total'];

    expect($card)->toBe(2)->and($listed)->toBe($card);
});

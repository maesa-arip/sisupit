<?php

use Spatie\Permission\Models\Role;

/**
 * FINDINGS #90 — nama peran di halaman Profil dulu ditentukan tangga `if` berantai:
 * `relawan → admin/petugas → "Anggota Masyarakat"`. Peran yang lahir sesudahnya (`opd`,
 * `pejabat`, `superadmin`) semuanya jatuh ke cabang terakhir, sehingga akun OPD membaca
 * dirinya sendiri sebagai "Anggota Masyarakat" — tanpa galat, tanpa gejala.
 *
 * Test ini menjaga sifat yang membuat itu mustahil terulang: setiap peran yang benar-benar
 * ada di sistem punya nama bacanya sendiri, dan halaman Profil tidak boleh menyusun namanya
 * lagi. Ia membaca BERKAS SUMBER karena di situlah sifat ini hidup — komponen React tidak
 * dirender oleh Pest (pola yang sama dengan MobileNavParityTest).
 */
$utils = fn () => file_get_contents(resource_path('js/lib/utils.js'));
$profile = fn () => file_get_contents(resource_path('js/Pages/Profile/Edit.jsx'));

it('gives every role that exists in the system its own readable name', function () use ($utils) {
    preg_match('/export const ROLE_LABELS = \[(.*?)\n\];/s', $utils(), $block);

    expect($block)->not->toBeEmpty();

    preg_match_all("/role: '([^']+)'/", $block[1], $labelled);

    // Peran diseed RolePermissionSeeder di setiap test (tests/Pest.php), jadi daftar ini
    // adalah peran yang NYATA ada — bukan salinan yang bisa ikut basi.
    foreach (Role::where('guard_name', 'web')->pluck('name') as $role) {
        expect($labelled[1])->toContain($role);
    }
});

it('reads the account role label from the shared dictionary instead of rebuilding it', function () use ($profile) {
    $source = $profile();

    expect($source)->toContain('roleLabel(');

    // Bentuk lama: label ditulis langsung di JSX lewat tangga `if`. Selama salah satu
    // kalimatnya masih ada di berkas ini, kamus bersama itu bukan satu-satunya sumber.
    // ("Anggota Masyarakat" diganti "Warga" 2026-09-02 saat peran `masyarakat` berganti nama;
    // yang dijaga tetap sama - label peran tak boleh disusun ulang di halaman ini.)
    foreach (["'Warga'", "'Relawan Aktif'", "'Administrator'"] as $hardcoded) {
        expect($source)->not->toContain($hardcoded);
    }
});

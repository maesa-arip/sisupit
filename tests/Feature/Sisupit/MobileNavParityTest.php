<?php

// FINDINGS #71 (TASK_31) — antara 2026-08-13 dan 2026-08-19, `MobileBottomNav.jsx` memelihara
// daftar menunya SENDIRI di samping `navItems.js`. Sembilan menu desktop (Manajemen SKKL, Pos
// Pemadam, OPD Terkait, Instansi/Kabupaten, empat tautan Bantuan & Legal, Daftar Baru) hilang di
// ponsel TANPA gejala apa pun — tak ada test, tak ada galat, hanya menu yang tidak ada.
//
// Test ini menjaga sifat yang membuat kejadian itu mustahil terulang: bottom-nav membaca daftar
// dari satu sumber dan tidak boleh menulis tujuan menu sendiri. Ia membaca BERKAS SUMBER karena
// itulah satu-satunya tempat sifat ini hidup — komponen React tak dirender oleh Pest.
$navItems = fn () => file_get_contents(resource_path('js/Layouts/Partials/navItems.js'));
$bottomNav = fn () => file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx'));

it('builds the mobile bottom nav from the single nav source', function () use ($bottomNav) {
    expect($bottomNav())
        ->toContain("from './navItems'")
        ->toContain('buildNavSections(');
});

// Tujuan menu yang ditulis langsung di bottom-nav = daftar kedua lahir kembali. Route yang
// TETAP boleh dipaku hanyalah tiga jangkar bilah (dashboard & laporan) sebagai nilai cadangan.
it('never hardcodes admin, legal, or account destinations in the mobile bottom nav', function () use ($bottomNav) {
    $source = $bottomNav();

    foreach (["route('admin.", "route('info.", "route('profile.", "route('logout'"] as $forbidden) {
        expect($source)->not->toContain($forbidden);
    }
});

// Bilah membagi item lewat KUNCI. Kunci yang salah ketik/berganti nama tidak melempar galat —
// ia hanya membuat item pindah diam-diam (jangkar bilah jadi ganda di popover "Menu").
it('anchors the bottom bar on keys that still exist in navItems', function () use ($navItems, $bottomNav) {
    $source = $bottomNav();
    $nav = $navItems();

    preg_match('/const BAR_ITEM_KEYS = \[(.*?)\];/s', $source, $bar);
    preg_match('/const FASILITAS_ITEM_KEYS = \[(.*?)\];/s', $source, $fasilitas);

    expect($bar)->not->toBeEmpty()
        ->and($fasilitas)->not->toBeEmpty();

    preg_match_all("/'([^']+)'/", $bar[1].$fasilitas[1], $keys);

    expect($keys[1])->toHaveCount(8);

    foreach ($keys[1] as $key) {
        expect($nav)->toContain("key: '{$key}'");
    }
});

<?php

use App\Enums\TenantLevel;

/**
 * TASK_49 (B) — permintaan user: "jika memberikan role Petugas, yurisdiksi auto ke kota".
 *
 * Dialog "Ubah Peran" dulu selalu memilih tingkat TERDALAM yang dimiliki pengguna
 * (`rankToLevel[user.region_level]`), sama untuk semua peran yurisdiksional. Akun warga
 * berdesa lengkap yang diangkat jadi petugas karena itu lahir ber-yurisdiksi SATU DESA —
 * dan yurisdiksi yang terlalu sempit tidak pernah menampilkan galat, ia cuma membuat
 * daftar & notifikasi petugas itu sepi tanpa alasan yang terlihat.
 *
 * Yang dijaga di sini bukan nilainya saja melainkan BENTUKNYA: default per peran hidup
 * sebagai kamus (DATA), dan nilainya diadu dengan enum `TenantLevel` di server — bukan
 * kamus lawan kamus (pelajaran FINDINGS #79). Halaman React tidak dirender oleh Pest, jadi
 * berkas sumbernya yang dibaca (pola MobileNavParityTest / RoleLabelParityTest).
 */
$page = fn () => file_get_contents(resource_path('js/Pages/Admin/Users/Index.jsx'));

it('defaults the petugas jurisdiction to kabupaten/kota through a per-role dictionary', function () use ($page) {
    preg_match('/const ROLE_DEFAULT_LEVEL = \{(.*?)\};/s', $page(), $block);

    expect($block)->not->toBeEmpty('Default tingkat per peran harus hidup sebagai kamus, bukan cabang `if`.');
    expect($block[1])->toMatch("/petugas:\s*'kabupaten'/");
});

it('only names jurisdiction levels the server actually knows', function () use ($page) {
    preg_match('/const ROLE_DEFAULT_LEVEL = \{(.*?)\};/s', $page(), $block);
    preg_match_all("/:\s*'([a-z]+)'/", $block[1], $levels);

    $known = array_column(TenantLevel::cases(), 'value');

    expect($levels[1])->not->toBeEmpty();
    foreach ($levels[1] as $level) {
        // Tingkat yang tidak dikenal server tidak akan menghasilkan galat apa pun — dropdown
        // sekadar tidak terisi, dan default itu diam-diam tak pernah berlaku.
        expect($known)->toContain($level);
    }
});

it('keeps the default reachable: petugas is still a jurisdictional role on the server', function () {
    $reflection = new ReflectionClass(App\Http\Controllers\Admin\UserController::class);

    // Kalau `petugas` keluar dari daftar ini, dropdown tingkat tidak pernah muncul untuknya
    // dan default di atas jadi kode mati tanpa gejala.
    expect($reflection->getConstant('JURISDICTIONAL_ROLES'))->toContain('petugas');
});

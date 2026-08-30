<?php

use App\Enums\TenantEdition;
use App\Models\Tenant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Halaman informasi publik (TASK_19): legal, bantuan, tentang, paket & lisensi.
 * Dua hal yang dijaga di sini: (1) dokumen harus terbuka tanpa login — syarat Google
 * OAuth/Play Store dan syarat orang bisa membaca sebelum mendaftar; (2) isi dokumen
 * mengikuti tenant + paket layanannya, bukan teks yang dipatri di kode.
 */
it('serves every info page publicly without login', function (string $routeName, string $component) {
    $this->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    ['info.terms', 'Info/Terms'],
    ['info.privacy', 'Info/Privacy'],
    ['info.help', 'Info/Help'],
    ['info.about', 'Info/About'],
    ['info.pricing', 'Info/Pricing'],
]);

it('writes the terms from the tenant resolved by subdomain', function () {
    config(['services.tenant.base_domain' => 'sisupit.com']);
    Tenant::create([
        'subdomain' => 'badung', 'city_code' => '5103', 'province_code' => '51',
        'nama_instansi' => 'Damkar Kabupaten Badung', 'telepon_darurat' => '0361-9999999',
        'email_kontak' => 'damkar@badungkab.go.id', 'alamat_instansi' => 'Jl. Raya Sempidi No. 1',
        'penanggung_jawab_data' => 'Kabid Data', 'edition' => TenantEdition::BELI->value,
        'is_active' => true,
    ]);

    $this->get('http://badung.sisupit.com/syarat-ketentuan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('instansi.nama_instansi', 'Damkar Kabupaten Badung')
            ->where('instansi.edition', 'beli')
            ->where('instansi.edition_label', 'Beli (Lisensi Perpetual)')
            ->where('instansi.email_kontak', 'damkar@badungkab.go.id'));
});

/**
 * Halaman Syarat & Ketentuan memuat dua dokumen (pengguna umum + Pengguna Berkontrak) yang
 * keduanya menyebut badan hukum penyedia dan kanal legalnya. Kalau kunci config ini hilang,
 * dokumen tampil dengan pihak kosong — cacat hukum yang tidak terlihat dari tampilan.
 */
it('carries the provider legal identity into the terms page', function () {
    config([
        'legal.penyedia.nama' => 'PT Tawarin Dimana Saja',
        'legal.penyedia.email_legal' => 'legal@tawarindimanaja.com',
    ]);

    $this->get(route('info.terms'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('legal.penyedia.nama', 'PT Tawarin Dimana Saja')
            ->where('legal.penyedia.email_legal', 'legal@tawarindimanaja.com')
            ->has('legal.penyedia.alamat')
            ->has('legal.dokumen.syarat_versi'));
});

it('shows the privacy contact of the tenant that controls the data', function () {
    config(['services.tenant.base_domain' => 'sisupit.com']);
    Tenant::create([
        'subdomain' => 'denpasar', 'city_code' => '5171', 'province_code' => '51',
        'nama_instansi' => 'Damkar Kota Denpasar', 'telepon_darurat' => '0361-223333',
        'alamat_instansi' => 'Jl. Imam Bonjol', 'penanggung_jawab_data' => 'Kepala Bidang',
        'is_active' => true,
    ]);

    $this->get('http://denpasar.sisupit.com/kebijakan-privasi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('instansi.alamat_instansi', 'Jl. Imam Bonjol')
            ->where('instansi.penanggung_jawab_data', 'Kepala Bidang')
            // Paket tak diisi di baris ini → tetap dianggap sewa, bukan error.
            ->where('instansi.edition', 'sewa'));
});

it('keeps sewa as the edition for tenants that never set one', function () {
    $tenant = Tenant::create([
        'subdomain' => 'klungkung', 'city_code' => '5105', 'province_code' => '51',
        'nama_instansi' => 'Damkar Kabupaten Klungkung', 'is_active' => true,
    ]);

    expect($tenant->edition())->toBe(TenantEdition::SEWA)
        ->and($tenant->isBeli())->toBeFalse()
        // features null (kolom tak diisi) tidak boleh melempar error.
        ->and($tenant->hasFeature('modul_khusus'))->toBeFalse();
});

it('survives a transient config tenant without edition or features columns', function () {
    $tenant = Tenant::fromConfig();

    expect($tenant->edition())->toBe(TenantEdition::SEWA)
        ->and($tenant->hasFeature('apa_saja'))->toBeFalse();
});

it('lists both service packages on the licensing page', function () {
    $this->get(route('info.pricing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('editions', 2)
            ->where('editions.0.value', 'sewa')
            ->where('editions.1.value', 'beli'));
});

it('rejects a registration that does not accept the terms', function () {
    $this->post(route('register'), [
        'name' => 'Warga Baru',
        'email' => 'warga.baru@example.test',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertSessionHasErrors('terms');

    expect(User::where('email', 'warga.baru@example.test')->exists())->toBeFalse();
});

it('records when a registering user accepted the terms', function () {
    $this->post(route('register'), [
        'name' => 'Warga Setuju',
        'email' => 'warga.setuju@example.test',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'terms' => true,
    ]);

    $user = User::where('email', 'warga.setuju@example.test')->first();

    expect($user)->not->toBeNull()
        ->and($user->terms_accepted_at)->not->toBeNull();
});

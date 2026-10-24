<?php

use App\Models\User;
use App\Notifications\PasswordSetupCodeNotification;

/*
 * Permintaan user 2026-10-24: email "buat kata sandi" & hasil Google untuk /home masih berbunyi
 * "Sistem Pelaporan Modern" / "SISUPIT Damkar" dan tagline lama. Nama yang benar: "Sisupit",
 * kepanjangan "Sistem Untuk Pelaporan Dini Terintegrasi".
 *
 * "Sistem Pelaporan Modern" datang dari APP_NAME .env prod, jadi halaman diuji dengan app.name
 * yang SENGAJA salah: judul & deskripsi untuk mesin pencari tidak boleh ikut nilai env itu.
 */

const BRAND_TAGLINE = 'Sistem Untuk Pelaporan Dini Terintegrasi';

it('serves a fixed title and description to search engines, whatever APP_NAME says', function (string $path) {
    config(['app.name' => 'Sistem Pelaporan Modern']);

    $html = $this->get($path)->assertOk()->getContent();

    expect($html)
        ->toContain('<title inertia>Sisupit - '.BRAND_TAGLINE.'</title>')
        ->toContain('<meta name="description" content="Sisupit ('.BRAND_TAGLINE.')')
        ->not->toContain('Pelaporan Modern')
        ->not->toContain('SiSUPIT DAMKAR')
        ->not->toContain('KESIAPSIAGAAN');
})->with(['/', '/home', '/landing']);

it('puts the Sisupit logo and tagline in system emails', function () {
    $html = (string) (new PasswordSetupCodeNotification('123456'))
        ->toMail(User::factory()->make())
        ->render();

    expect($html)
        ->toContain(rtrim(config('app.url'), '/').'/icon.png')
        ->toContain('Sisupit - '.BRAND_TAGLINE)
        ->not->toContain('laravel.com/img');
});

it('keeps old brand names out of the source', function () {
    $files = collect([resource_path('js'), resource_path('views'), app_path()])
        ->flatMap(fn ($dir) => File::allFiles($dir))
        ->filter(fn ($file) => in_array($file->getExtension(), ['php', 'jsx', 'js']));

    foreach ($files as $file) {
        $source = $file->getContents();
        foreach (['SISUPIT DAMKAR', 'SiSUPIT', 'Pelaporan Modern', 'Kesiapsiagaan untuk Pemadam', 'KESIAPSIAGAAN UNTUK PEMADAM'] as $old) {
            expect(str_contains($source, $old))->toBeFalse("\"{$old}\" masih ada di {$file->getRelativePathname()}");
        }
    }

    // Judul tab tak lagi dari VITE_APP_NAME (tertanam saat build dari .env server).
    foreach (['js/app.jsx', 'js/ssr.jsx'] as $entry) {
        expect(file_get_contents(resource_path($entry)))
            ->toContain("const appName = 'Sisupit';")
            ->not->toContain('import.meta.env.VITE_APP_NAME');
    }
});

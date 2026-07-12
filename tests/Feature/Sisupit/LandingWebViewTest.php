<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

$browserUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
$webViewUa = 'Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120 SisupitApp/1.0';

// SEMENTARA (2026-07-11): landing disembunyikan atas permintaan → `/` render Spotlight
// untuk browser. Saat landing dipulihkan (HomeController::landing), kembalikan assertion
// ini ke component('Landing').
it('serves the spotlight at / while the landing is temporarily hidden', function () use ($browserUa) {
    $this->withHeaders(['User-Agent' => $browserUa])
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Spotlight'));
});

it('redirects a guest webview to the spotlight home instead of the landing', function () use ($webViewUa) {
    $this->withHeaders(['User-Agent' => $webViewUa])
        ->get('/')
        ->assertRedirect(route('home.spotlight'));
});

it('redirects an authenticated webview straight to the dashboard', function () use ($webViewUa) {
    // Role exempt dari EnsureProfileComplete agar middleware itu tidak menyerobot
    // redirect ke /complete-profile sebelum controller landing berjalan.
    $user = User::factory()->create();
    $user->assignRole('petugas');

    $this->actingAs($user)
        ->withHeaders(['User-Agent' => $webViewUa])
        ->get('/')
        ->assertRedirect(route('dashboard'));
});

it('still serves the spotlight page at its new /spotlight path', function () {
    $this->get('/spotlight')->assertOk();
});

// Landing yang sudah dipoles (darurat-first) tetap hidup di /landing meski `/` ke Spotlight.
it('serves the polished landing page at /landing', function () use ($browserUa) {
    $this->withHeaders(['User-Agent' => $browserUa])
        ->get('/landing')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Landing'));
});

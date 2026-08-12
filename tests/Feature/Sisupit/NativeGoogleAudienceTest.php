<?php

use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.google.client_id' => 'web-client-id.apps.googleusercontent.com',
        'services.google.ios_client_id' => 'ios-client-id.apps.googleusercontent.com',
    ]);
});

/**
 * Palsukan jawaban endpoint verifikasi Google. Hanya `aud` yang divariasikan antar test —
 * sisanya sengaja dibuat valid agar yang diuji benar-benar percabangan audiens.
 */
function fakeGoogleTokenInfoWithAudience(string $aud): void
{
    Http::fake([
        'oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => $aud,
            'iss' => 'https://accounts.google.com',
            'sub' => 'google-user-123',
            'email' => 'warga@example.com',
            'email_verified' => 'true',
            'name' => 'Warga Uji',
            'given_name' => 'Warga',
        ], 200),
    ]);
}

it('accepts a google id token issued for the ios client', function () {
    // GIDSignIn di iPhone menerbitkan token ber-aud iOS Client ID. Sebelum perubahan ini
    // token tersebut SELALU ditolak karena aud dibandingkan dengan satu nilai (Web Client ID).
    fakeGoogleTokenInfoWithAudience('ios-client-id.apps.googleusercontent.com');

    $response = $this->post(route('google.native'), ['credential' => 'token-dari-iphone']);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();
});

it('still accepts a token issued for the web client (browser & android path)', function () {
    // Jalur yang sudah berjalan di produksi Android — tidak boleh putus.
    fakeGoogleTokenInfoWithAudience('web-client-id.apps.googleusercontent.com');

    $response = $this->post(route('google.native'), ['credential' => 'token-dari-android']);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();
});

it('rejects a token issued for an application that is not ours', function () {
    // Inti pertahanannya: daftar putih, BUKAN "terima semua aud".
    fakeGoogleTokenInfoWithAudience('aplikasi-orang-lain.apps.googleusercontent.com');

    $response = $this->post(route('google.native'), ['credential' => 'token-asing']);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('does not accept an ios token when the ios client id is left unconfigured', function () {
    // array_filter() harus membuang kunci kosong, bukan mengubahnya jadi celah yang
    // menerima aud apa pun saat GOOGLE_IOS_CLIENT_ID belum diisi di .env.
    config(['services.google.ios_client_id' => null]);
    fakeGoogleTokenInfoWithAudience('ios-client-id.apps.googleusercontent.com');

    $response = $this->post(route('google.native'), ['credential' => 'token-dari-iphone']);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

<?php

use App\Models\SocialAccount;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;

/**
 * Masuk dengan Apple (App Store Guideline 4.8). Apple tak punya endpoint verifikasi, jadi
 * test ini memalsukan JWKS Apple dengan pasangan kunci RSA buatan sendiri dan menandatangani
 * identity token dengannya - yang diuji adalah verifikasi tanda tangan & klaim yang SEBENARNYA.
 */
beforeEach(function () {
    $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
    openssl_pkey_export($key, $pem);
    $rsa = openssl_pkey_get_details($key)['rsa'];
    $b64 = fn (string $bin) => rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');

    $this->applePrivateKey = $pem;

    config([
        'services.apple.client_id' => 'com.sisupit.app',
        'services.apple.team_id' => null,
        'services.apple.key_id' => null,
        'services.apple.private_key' => null,
    ]);

    Http::fake([
        'appleid.apple.com/auth/keys' => Http::response(['keys' => [[
            'kty' => 'RSA', 'kid' => 'uji-kid', 'use' => 'sig', 'alg' => 'RS256',
            'n' => $b64($rsa['n']), 'e' => $b64($rsa['e']),
        ]]]),
        'appleid.apple.com/auth/token' => Http::response(['refresh_token' => 'refresh-dari-apple']),
        'appleid.apple.com/auth/revoke' => Http::response(),
    ]);
});

function appleIdToken(object $test, array $override = []): string
{
    return JWT::encode(array_merge([
        'iss' => 'https://appleid.apple.com',
        'aud' => 'com.sisupit.app',
        'sub' => '001234.apple-user.0001',
        'iat' => time(),
        'exp' => time() + 600,
        'nonce' => hash('sha256', 'nonce-mentah'),
        'email' => 'abc123@privaterelay.appleid.com',
        'email_verified' => 'true',
        'is_private_email' => 'true',
    ], $override), $test->applePrivateKey, 'RS256', 'uji-kid');
}

function enableAppleRevocation(): void
{
    $ec = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    openssl_pkey_export($ec, $pem);
    config([
        'services.apple.team_id' => 'F35Q95SKRF',
        'services.apple.key_id' => 'KEYID12345',
        'services.apple.private_key' => $pem,
    ]);
}

it('creates an account from a valid apple identity token with a private relay email', function () {
    $response = $this->post(route('apple.native'), [
        'id_token' => appleIdToken($this),
        'nonce' => 'nonce-mentah',
        'given_name' => 'Made',
        'family_name' => 'Warga',
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();

    $user = User::where('email', 'abc123@privaterelay.appleid.com')->firstOrFail();
    expect($user->name)->toBe('Made Warga')
        ->and($user->hasRole('warga'))->toBeTrue()
        ->and($user->socialAccounts()->where('provider_name', 'apple')->exists())->toBeTrue();
});

it('logs in again without email or name once the apple account is linked', function () {
    // Apple hanya mengirim nama sekali dan email bisa tidak ada di login berikutnya.
    $this->post(route('apple.native'), ['id_token' => appleIdToken($this), 'nonce' => 'nonce-mentah']);
    auth()->logout();

    $response = $this->post(route('apple.native'), [
        'id_token' => appleIdToken($this, ['email' => null, 'email_verified' => null]),
        'nonce' => 'nonce-mentah',
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();
    expect(User::count())->toBe(1);
});

it('rejects a token whose nonce does not match', function () {
    $response = $this->post(route('apple.native'), [
        'id_token' => appleIdToken($this),
        'nonce' => 'nonce-lain',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('rejects a token issued for another app', function () {
    $response = $this->post(route('apple.native'), [
        'id_token' => appleIdToken($this, ['aud' => 'com.aplikasi.lain']),
        'nonce' => 'nonce-mentah',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('rejects a token signed with a key that is not apple\'s', function () {
    $other = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
    openssl_pkey_export($other, $pem);
    $this->applePrivateKey = $pem;

    $response = $this->post(route('apple.native'), [
        'id_token' => appleIdToken($this),
        'nonce' => 'nonce-mentah',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('rejects a new account when apple shares no email', function () {
    $response = $this->post(route('apple.native'), [
        'id_token' => appleIdToken($this, ['email' => null, 'email_verified' => null]),
        'nonce' => 'nonce-mentah',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('stores the refresh token encrypted and revokes it when the account is deleted', function () {
    enableAppleRevocation();

    $this->post(route('apple.native'), [
        'id_token' => appleIdToken($this),
        'nonce' => 'nonce-mentah',
        'authorization_code' => 'kode-otorisasi',
    ])->assertRedirect(route('dashboard'));

    $account = SocialAccount::where('provider_name', 'apple')->firstOrFail();
    expect($account->refresh_token)->toBe('refresh-dari-apple')
        ->and($account->getRawOriginal('refresh_token'))->not->toBe('refresh-dari-apple');

    $this->delete(route('profile.destroy'), ['confirmation' => 'HAPUS'])->assertRedirect('/');

    Http::assertSent(fn (HttpRequest $request) => $request->url() === 'https://appleid.apple.com/auth/revoke'
        && $request['token'] === 'refresh-dari-apple'
        && $request['token_type_hint'] === 'refresh_token'
        && $request['client_id'] === 'com.sisupit.app');
    expect(SocialAccount::count())->toBe(0);
});

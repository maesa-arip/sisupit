<?php

use App\Http\Controllers\Auth\SocialiteController;
use App\Models\User;

it('blocks password login for a google-only account with a clear error message', function () {
    $socialUser = new class
    {
        public function getId()
        {
            return 'google-456';
        }

        public function getEmail()
        {
            return 'google-only@example.com';
        }

        public function getName()
        {
            return 'Google Only User';
        }

        public function getNickname()
        {
            return null;
        }
    };

    $user = (new SocialiteController)->findOrCreateUser($socialUser, 'google');
    expect($user->password)->toBeNull();

    $response = $this->post('/login', [
        'email' => 'google-only@example.com',
        'password' => 'whatever-password',
    ]);

    $response->assertSessionHasErrors('email');
    expect(session('errors')->get('email')[0])->toContain('Google');
    $this->assertGuest();
});

it('still allows normal password login for an account that has a password', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

// FINDINGS #135: callback Google yang gagal dulu jadi halaman 500 - `catch (Exception)` tanpa impor
// menunjuk kelas yang tak ada. Dua bentuk yang benar-benar muncul di log prod: pengguna menekan
// Batal (callback tanpa `code`) dan URL callback dibuka ulang (kode ditolak Google).
function googleRejectsCallback(string $description): void
{
    $mock = Mockery::mock(\Laravel\Socialite\Two\GoogleProvider::class);
    $mock->shouldReceive('stateless')->andReturnSelf();
    $mock->shouldReceive('user')->andThrow(new \GuzzleHttp\Exception\ClientException(
        $description,
        new \GuzzleHttp\Psr7\Request('POST', 'https://www.googleapis.com/oauth2/v4/token'),
        new \GuzzleHttp\Psr7\Response(400),
    ));
    \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->andReturn($mock);
}

it('sends the user back to the login page when google login is cancelled', function () {
    googleRejectsCallback('invalid_request: Missing required parameter: code');

    $this->get('/auth/google/callback?error=access_denied')
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('sends the user back to the login page when google rejects the auth code', function () {
    googleRejectsCallback('invalid_grant: Malformed auth code.');

    $this->get('/auth/google/callback?authuser=5&code=8%2Fbroken')
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

// FINDINGS #138: nama penyedia yang tak dikonfigurasi harus 404, bukan 500 dari Socialite.
it('answers 404 for an unknown social login provider instead of crashing', function () {
    $this->get('/auth/login')->assertNotFound();
    $this->get('/auth/login/callback')->assertNotFound();
    $this->get('/auth/'.rawurlencode('0;url='))->assertNotFound();
});

it('still sends /auth/google to google', function () {
    $this->get('/auth/google')->assertRedirect();
});

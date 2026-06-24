<?php

use App\Http\Controllers\Auth\SocialiteController;
use App\Models\User;

it('blocks password login for a google-only account with a clear error message', function () {
    $socialUser = new class {
        public function getId() { return 'google-456'; }
        public function getEmail() { return 'google-only@example.com'; }
        public function getName() { return 'Google Only User'; }
        public function getNickname() { return null; }
    };

    $user = (new SocialiteController())->findOrCreateUser($socialUser, 'google');
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

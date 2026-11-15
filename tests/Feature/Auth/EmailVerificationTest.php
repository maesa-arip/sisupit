<?php

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;

test('email verification screen can be rendered', function () {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)->get('/verify-email');

    $response->assertStatus(200);
});

test('email can be verified', function () {
    $user = User::factory()->unverified()->create();

    Event::fake();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );

    $response = $this->actingAs($user)->get($verificationUrl);

    Event::assertDispatched(Verified::class);
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');
});

test('email is not verified with invalid hash', function () {
    $user = User::factory()->unverified()->create();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1('wrong-email')]
    );

    $this->actingAs($user)->get($verificationUrl);

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

// 2026-11-15: di iPhone tautan dari aplikasi Mail terbuka di Safari, yang tak berbagi sesi
// dengan aplikasi Sisupit. Tautan bertanda tangan sendiri sudah bukti - tanpa login pun sah.
test('email can be verified from a browser that is not logged in', function () {
    $user = User::factory()->unverified()->create();

    Event::fake();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );

    $this->get($verificationUrl)
        ->assertRedirect(route('login'))
        ->assertSessionHas('status');

    Event::assertDispatched(Verified::class);
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('a guest with a wrong hash or unsigned link cannot verify', function () {
    $user = User::factory()->unverified()->create();

    $badHash = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1('wrong-email')]
    );
    $this->get($badHash)->assertForbidden();

    $this->get(route('verification.verify', ['id' => $user->id, 'hash' => sha1($user->email)]))
        ->assertForbidden();

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('linking google to an unverified email account verifies it', function () {
    $user = User::factory()->unverified()->create(['email' => 'lama@contoh.test']);

    $socialUser = (new \Laravel\Socialite\Two\User)->map([
        'id' => 'google-123', 'name' => 'Lama', 'email' => 'lama@contoh.test', 'nickname' => null,
    ]);

    $found = app(\App\Http\Controllers\Auth\SocialiteController::class)->findOrCreateUser($socialUser, 'google');

    expect($found->is($user))->toBeTrue()
        ->and($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

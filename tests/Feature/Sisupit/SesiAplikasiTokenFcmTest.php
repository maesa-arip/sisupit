<?php

use App\Listeners\DeleteInvalidFcmToken;
use App\Models\FcmToken;
use App\Models\User;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Password;
use Kreait\Firebase\Exception\Messaging\NotFound;
use Kreait\Firebase\Exception\Messaging\ServerUnavailable;
use Kreait\Firebase\Messaging\MessageTarget;
use Kreait\Firebase\Messaging\SendReport;
use NotificationChannels\Fcm\FcmChannel;

// TASK_73 - token FCM harus selalu mengikuti status login perangkatnya. Keluhan asal:
// sesi web 120 menit habis, aplikasi kembali ke halaman masuk, tapi sirine tetap datang.

$appUa = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Mobile Safari/537.36 SisupitApp';
$browserUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36';

function recallerName(): string
{
    return Auth::guard('web')->getRecallerName();
}

// --- 1. Di aplikasi login selalu "ingat saya" -------------------------------------------

it('always remembers the login inside the app even without the checkbox', function () use ($appUa) {
    $user = User::factory()->create();

    $this->withHeader('User-Agent', $appUa)
        ->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertCookie(recallerName());

    $this->assertAuthenticatedAs($user);
});

it('keeps following the checkbox in a normal browser', function () use ($browserUa) {
    $user = User::factory()->create();

    $this->withHeader('User-Agent', $browserUa)
        ->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertCookieMissing(recallerName());
});

it('remembers a freshly registered account inside the app', function () use ($appUa) {
    $this->withHeader('User-Agent', $appUa)
        ->post('/register', [
            'name' => 'Warga Aplikasi',
            'email' => 'warga-aplikasi@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'terms' => true,
        ])
        ->assertCookie(recallerName());
});

// --- 2. Keluar hanya mengeluarkan perangkat ini -----------------------------------------

it('does not revoke remember-me on other devices when logging out', function () {
    $user = User::factory()->create(['remember_token' => 'token-ingat-hp']);

    $this->actingAs($user)->post('/logout')->assertRedirect('/');

    // logout() biasa mengganti remember_token -> HP lain diam-diam ikut keluar.
    expect($user->fresh()->remember_token)->toBe('token-ingat-hp');
});

it('releases the token remembered in the session when logout sends none', function () {
    $user = User::factory()->create();
    $user->fcmTokens()->create(['token' => 'token-dari-sesi', 'device_type' => 'android']);
    $lain = $user->fcmTokens()->create(['token' => 'token-tablet', 'device_type' => 'android']);

    // Tombol Keluar di Profil tidak mengirim fcm_token; FcmController::store mencatatnya di sesi.
    $this->actingAs($user)
        ->withSession(['fcm_token' => 'token-dari-sesi'])
        ->post('/logout')
        ->assertRedirect('/');

    expect(FcmToken::where('token', 'token-dari-sesi')->exists())->toBeFalse();
    expect(FcmToken::whereKey($lain->id)->exists())->toBeTrue();
});

// Profil lengkap: EnsureProfileComplete membelokkan akun berprofil kosong ke Lengkapi Profil.
function wargaLengkap(): User
{
    return User::factory()->create(['phone' => '081234567890', 'village_code' => '5171012008']);
}

it('remembers the device token in the session when registering it', function () {
    $user = wargaLengkap();

    $this->actingAs($user)
        ->postJson(route('fcm.store'), ['token' => 'token-baru', 'device_type' => 'android'])
        ->assertOk()
        ->assertSessionHas('fcm_token', 'token-baru');
});

it('refreshes last-seen on an old token', function () {
    $user = wargaLengkap();
    $token = $user->fcmTokens()->create(['token' => 'token-lama', 'device_type' => 'android']);
    FcmToken::whereKey($token->id)->update(['updated_at' => now()->subDays(10)]);

    $this->actingAs($user)->postJson(route('fcm.store'), ['token' => 'token-lama', 'device_type' => 'android']);

    expect($token->fresh()->updated_at->isToday())->toBeTrue();
});

// --- 2b. Keluar dari semua perangkat --------------------------------------------------

it('signs out every device and releases every token', function () {
    config(['session.driver' => 'database']);

    $user = User::factory()->create(['remember_token' => 'token-ingat-lama']);
    $other = User::factory()->create();
    $user->fcmTokens()->create(['token' => 'token-hp', 'device_type' => 'android']);
    $user->fcmTokens()->create(['token' => 'token-ipad', 'device_type' => 'ios']);
    $other->fcmTokens()->create(['token' => 'token-orang-lain', 'device_type' => 'android']);
    DB::table('sessions')->insert([
        ['id' => 'sesi-hp-lain', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()],
        ['id' => 'sesi-orang-lain', 'user_id' => $other->id, 'payload' => '', 'last_activity' => time()],
    ]);

    $this->actingAs($user)->post(route('profile.logout-everywhere'))->assertRedirect('/');

    $this->assertGuest();
    expect($user->fcmTokens()->count())->toBe(0);
    expect($user->fresh()->remember_token)->not->toBe('token-ingat-lama');
    expect(DB::table('sessions')->where('id', 'sesi-hp-lain')->exists())->toBeFalse();
    // Akun lain tak tersentuh.
    expect(FcmToken::where('token', 'token-orang-lain')->exists())->toBeTrue();
    expect(DB::table('sessions')->where('id', 'sesi-orang-lain')->exists())->toBeTrue();
});

// --- 3. Sandi diganti / direset ---------------------------------------------------------

it('keeps this device but revokes the others when changing the password', function () {
    $user = User::factory()->create(['remember_token' => 'token-ingat-lama']);
    $user->fcmTokens()->create(['token' => 'token-hp-ini', 'device_type' => 'android']);
    $user->fcmTokens()->create(['token' => 'token-hp-lain', 'device_type' => 'android']);

    $this->actingAs($user)
        ->withSession(['fcm_token' => 'token-hp-ini'])
        ->withCookie(recallerName(), $user->id.'|token-ingat-lama|'.$user->password)
        ->from('/profile')
        ->put('/password', [
            'current_password' => 'password',
            'password' => 'sandi-baru-123',
            'password_confirmation' => 'sandi-baru-123',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile')
        // remember_token baru -> cookie "ingat saya" perangkat ini dipasang ulang.
        ->assertCookie(recallerName());

    $this->assertAuthenticatedAs($user);
    expect(FcmToken::where('token', 'token-hp-ini')->exists())->toBeTrue();
    expect(FcmToken::where('token', 'token-hp-lain')->exists())->toBeFalse();
    expect($user->fresh()->remember_token)->not->toBe('token-ingat-lama');
});

it('releases every token when the password is reset', function () {
    $user = User::factory()->create();
    $user->fcmTokens()->create(['token' => 'token-hp', 'device_type' => 'android']);

    $this->post('/reset-password', [
        'token' => Password::createToken($user),
        'email' => $user->email,
        'password' => 'sandi-baru-123',
        'password_confirmation' => 'sandi-baru-123',
    ])->assertSessionHasNoErrors();

    expect($user->fcmTokens()->count())->toBe(0);
});

// --- 4. Aplikasi tamu melepas tokennya --------------------------------------------------

it('lets a guest app release its own token', function () {
    $user = User::factory()->create();
    $user->fcmTokens()->create(['token' => 'token-hp-tamu', 'device_type' => 'android']);

    $this->postJson(route('fcm.release'), ['token' => 'token-hp-tamu'])->assertOk();

    expect(FcmToken::where('token', 'token-hp-tamu')->exists())->toBeFalse();
});

it('never releases a token for a signed-in caller', function () {
    $user = User::factory()->create();
    $user->fcmTokens()->create(['token' => 'token-hp-masuk', 'device_type' => 'android']);

    // Balasan native yang telat sampai sesudah login tak boleh melepas token yang baru didaftarkan.
    $this->actingAs($user)->post(route('fcm.release'), ['token' => 'token-hp-masuk'])->assertRedirect();

    expect(FcmToken::where('token', 'token-hp-masuk')->exists())->toBeTrue();
});

// --- 5. Perawatan token -----------------------------------------------------------------

function laporanGagalFcm(string $token, Throwable $error): NotificationFailed
{
    return new NotificationFailed(
        User::factory()->create(),
        new class extends Notification {},
        FcmChannel::class,
        ['report' => SendReport::failure(MessageTarget::with(MessageTarget::TOKEN, $token), $error)],
    );
}

it('deletes a token that FCM no longer knows', function () {
    FcmToken::create(['user_id' => User::factory()->create()->id, 'token' => 'token-dicopot', 'device_type' => 'android']);

    (new DeleteInvalidFcmToken)->handle(laporanGagalFcm('token-dicopot', NotFound::becauseTokenNotFound('token-dicopot')));

    expect(FcmToken::where('token', 'token-dicopot')->exists())->toBeFalse();
});

it('keeps the token when FCM fails for a temporary reason', function () {
    FcmToken::create(['user_id' => User::factory()->create()->id, 'token' => 'token-sehat', 'device_type' => 'android']);

    // Petugas tak boleh kehilangan sirine hanya karena server FCM sedang gangguan.
    (new DeleteInvalidFcmToken)->handle(laporanGagalFcm('token-sehat', new ServerUnavailable('Service unavailable')));

    expect(FcmToken::where('token', 'token-sehat')->exists())->toBeTrue();
});

it('wires the listener to failed notifications', function () {
    Event::fake();

    Event::assertListening(NotificationFailed::class, DeleteInvalidFcmToken::class);
});

it('prunes only tokens unseen for 270 days', function () {
    $userId = User::factory()->create()->id;
    $lama = FcmToken::create(['user_id' => $userId, 'token' => 'token-basi', 'device_type' => 'android']);
    $jarang = FcmToken::create(['user_id' => $userId, 'token' => 'token-jarang-dibuka', 'device_type' => 'android']);
    FcmToken::whereKey($lama->id)->update(['updated_at' => now()->subDays(271)]);
    FcmToken::whereKey($jarang->id)->update(['updated_at' => now()->subDays(120)]);

    $this->artisan('model:prune', ['--model' => [FcmToken::class]])->assertSuccessful();

    expect(FcmToken::whereKey($lama->id)->exists())->toBeFalse();
    expect(FcmToken::whereKey($jarang->id)->exists())->toBeTrue();
});

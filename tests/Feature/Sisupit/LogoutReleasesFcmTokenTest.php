<?php

use App\Models\FcmToken;
use App\Models\User;

// Saat user logout, token FCM milik DEVICE yang logout harus dilepas supaya HP itu
// berhenti menerima notifikasi sirine — tapi token device lain (milik user yang sama
// maupun user lain) tidak boleh ikut terhapus.

it('releases only this device fcm token on logout', function () {
    $user = User::factory()->create();

    $thisDevice = $user->fcmTokens()->create(['token' => 'token-hp-ini', 'device_type' => 'android']);
    $otherDevice = $user->fcmTokens()->create(['token' => 'token-tablet', 'device_type' => 'android']);

    $this->actingAs($user)
        ->post('/logout', ['fcm_token' => 'token-hp-ini'])
        ->assertRedirect('/');

    expect(FcmToken::where('id', $thisDevice->id)->exists())->toBeFalse();
    expect(FcmToken::where('id', $otherDevice->id)->exists())->toBeTrue();
});

it('does not touch fcm tokens belonging to other users on logout', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $user->fcmTokens()->create(['token' => 'token-user-keluar', 'device_type' => 'android']);
    $foreign = $other->fcmTokens()->create(['token' => 'token-user-lain', 'device_type' => 'android']);

    $this->actingAs($user)
        ->post('/logout', ['fcm_token' => 'token-user-keluar'])
        ->assertRedirect('/');

    // Penghapusan discope ke (user_id + token): token milik user lain tak boleh ikut hilang.
    expect(FcmToken::where('id', $foreign->id)->exists())->toBeTrue();
});

it('still logs out cleanly when no fcm token is sent', function () {
    $user = User::factory()->create();
    $user->fcmTokens()->create(['token' => 'token-tertinggal', 'device_type' => 'android']);

    $this->actingAs($user)
        ->post('/logout')
        ->assertRedirect('/');

    $this->assertGuest();
    // Tanpa token di body, tidak ada yang dihapus (best-effort per-device).
    expect(FcmToken::where('token', 'token-tertinggal')->exists())->toBeTrue();
});

<?php

use App\Models\FcmToken;
use App\Models\User;
use App\Notifications\DeviceTestNotification;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\Messaging\NotFound;
use Kreait\Firebase\Exception\Messaging\ServerUnavailable;
use NotificationChannels\Fcm\FcmMessage;

// #182 - kartu "Notifikasi di HP ini" (Profil) + banner dashboard. Notifikasi uji hanya ke HP
// sendiri, meniru payload asli per tingkat supaya APK memilih channel (bunyi) yang sama.

function penggunaHp(string $role): User
{
    // Profil lengkap: EnsureProfileComplete membelokkan non-staf berprofil kosong.
    $user = User::factory()->create(['phone' => '081234567890', 'village_code' => '5171012008']);
    $user->assignRole($role);
    $user->fcmTokens()->create(['token' => "token-hp-{$user->id}", 'device_type' => 'android']);

    return $user;
}

function kunciUji(User $user): array
{
    return array_column(DeviceTestNotification::tiersFor($user), 'key');
}

it('offers each role exactly the sounds it receives', function () {
    expect(kunciUji(penggunaHp('petugas')))->toBe(['sirine', 'masuk', 'koordinasi'])
        ->and(kunciUji(penggunaHp('relawan')))->toBe(['sirine', 'koordinasi'])
        ->and(kunciUji(penggunaHp('pejabat')))->toBe(['sirine'])
        ->and(kunciUji(penggunaHp('admin')))->toBe(['masuk', 'koordinasi'])
        ->and(kunciUji(penggunaHp('opd')))->toBe(['koordinasi'])
        ->and(kunciUji(penggunaHp('warga')))->toBe(['status']);
});

it('mimics the real payload markers so the APK picks the same channel', function () {
    $data = fn (string $tier) => (new DeviceTestNotification($tier))->toFcm()->data;

    // Pemetaan SisupitFirebaseMessagingService::tingkatDari - type/alert_stage baru = sirine.
    expect($data('sirine'))->toMatchArray(['type' => 'emergency', 'alert_stage' => 'dispatch'])
        ->and($data('masuk'))->toMatchArray(['type' => 'emergency', 'alert_stage' => 'report_incoming'])
        ->and($data('koordinasi'))->toMatchArray(['type' => 'agency_confirmation'])
        ->and($data('koordinasi'))->not->toHaveKey('alert_stage')
        ->and($data('status'))->toMatchArray(['type' => 'report_status']);

    foreach (array_keys(DeviceTestNotification::TIERS) as $tier) {
        expect($data($tier))->toHaveKeys(['title', 'body', 'action_url', 'is_test'])
            ->and($data($tier)['action_url'])->toEndWith('#notifikasi-hp');
    }
});

it('sends the test only to this device token', function () {
    $user = penggunaHp('petugas');
    $user->fcmTokens()->create(['token' => 'token-hp-lain', 'device_type' => 'android']);

    $this->mock(Messaging::class)
        ->shouldReceive('send')->once()
        ->withArgs(fn (FcmMessage $m) => $m->token === "token-hp-{$user->id}" && $m->data['alert_stage'] === 'dispatch')
        ->andReturn([]);

    $this->actingAs($user)
        ->postJson(route('fcm.test'), ['token' => "token-hp-{$user->id}", 'tier' => 'sirine'])
        ->assertOk()
        ->assertJson(['status' => 'success']);
});

it('refuses a token that does not belong to the account', function () {
    $user = penggunaHp('petugas');
    $orangLain = penggunaHp('relawan');

    $this->mock(Messaging::class)->shouldNotReceive('send');

    // Tak ada "sirine iseng" ke HP orang lain.
    $this->actingAs($user)
        ->postJson(route('fcm.test'), ['token' => "token-hp-{$orangLain->id}", 'tier' => 'sirine'])
        ->assertStatus(422);
});

it('refuses a sound the role never receives', function () {
    $warga = penggunaHp('warga');

    $this->mock(Messaging::class)->shouldNotReceive('send');

    $this->actingAs($warga)
        ->postJson(route('fcm.test'), ['token' => "token-hp-{$warga->id}", 'tier' => 'sirine'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('tier');
});

it('drops a token FCM no longer knows and says so', function () {
    $user = penggunaHp('relawan');
    $token = "token-hp-{$user->id}";

    $this->mock(Messaging::class)->shouldReceive('send')->andThrow(NotFound::becauseTokenNotFound($token));

    $this->actingAs($user)
        ->postJson(route('fcm.test'), ['token' => $token, 'tier' => 'koordinasi'])
        ->assertStatus(422);

    expect(FcmToken::where('token', $token)->exists())->toBeFalse();
});

it('keeps the token when FCM is only temporarily down', function () {
    $user = penggunaHp('relawan');
    $token = "token-hp-{$user->id}";

    $this->mock(Messaging::class)->shouldReceive('send')->andThrow(new ServerUnavailable('down'));

    $this->actingAs($user)
        ->postJson(route('fcm.test'), ['token' => $token, 'tier' => 'sirine'])
        ->assertStatus(503);

    expect(FcmToken::where('token', $token)->exists())->toBeTrue();
});

it('gives the profile page its test list', function () {
    $user = penggunaHp('relawan');

    $this->actingAs($user)->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page->where('notificationTests.0.key', 'sirine'));
});

it('gives the petugas dashboard the number of registered phones', function () {
    $user = penggunaHp('petugas');

    $this->actingAs($user)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->component('Petugas/Dashboard')->where('fcm_device_count', 1));
});

it('shows the banner on both dashboards and the card on the profile', function () {
    $petugas = file_get_contents(base_path('resources/js/Pages/Petugas/Dashboard.jsx'));
    $beranda = file_get_contents(base_path('resources/js/Pages/Dashboard.jsx'));
    $profil = file_get_contents(base_path('resources/js/Pages/Profile/Edit.jsx'));

    expect($petugas)->toContain('<NotificationDeviceBanner deviceCount={fcm_device_count} />')
        // Relawan saja, dan hanya yang siaga - hanya mereka yang disiarkan sirine.
        ->and($beranda)->toContain('{isRelawan && isStandby && <NotificationDeviceBanner')
        ->and($profil)->toContain('id="notifikasi-hp"')
        ->and($profil)->toContain('<NotificationDeviceCard tests={props.notificationTests ?? []} />');
});

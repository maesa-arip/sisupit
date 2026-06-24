<?php

use App\Models\User;

it('rejects an unauthenticated webpush subscribe request instead of crashing', function () {
    $response = $this->postJson('/webpush/subscribe', [
        'endpoint' => 'https://example.com/push/abc',
        'keys' => ['p256dh' => 'key', 'auth' => 'token'],
    ]);

    $response->assertUnauthorized();
});

it('lets an authenticated user subscribe to webpush', function () {
    $user = User::factory()->create(['phone' => '081234500000', 'village_code' => '5171012006']);

    $response = $this->actingAs($user)->postJson('/webpush/subscribe', [
        'endpoint' => 'https://example.com/push/abc',
        'keys' => ['p256dh' => 'key', 'auth' => 'token'],
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);
});

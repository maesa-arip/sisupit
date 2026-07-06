<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

it('requires authentication to use the geocode proxy', function () {
    $this->get('/api/geocode/reverse?lat=-8.65&lng=115.22')->assertRedirect('/login');
});

it('proxies reverse geocoding to nominatim with a user agent header and caches the result', function () {
    Http::fake([
        // Catch-all: base_url Nominatim kini konfigurable (default self-hosted lokal),
        // jadi jangan kunci ke host publik - fake apa pun host yang sedang dikonfigurasi.
        '*' => Http::response([
            'display_name' => 'Jl. Pemogan, Denpasar, Bali',
            'address' => ['road' => 'Jl. Pemogan'],
        ], 200),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/api/geocode/reverse?lat=-8.65&lng=115.22')
        ->assertOk()
        ->assertJsonPath('display_name', 'Jl. Pemogan, Denpasar, Bali');

    // Kedua kali harus diambil dari cache, bukan request baru ke Nominatim.
    $this->actingAs($user)
        ->get('/api/geocode/reverse?lat=-8.65&lng=115.22')
        ->assertOk();

    Http::assertSentCount(1);
    Http::assertSent(function ($request) {
        return $request->hasHeader('User-Agent') && str_contains($request->header('User-Agent')[0], 'SISUPIT');
    });
});

it('proxies forward search to nominatim', function () {
    Http::fake([
        '*' => Http::response([
            ['name' => 'Jl. Pemogan', 'lat' => '-8.65', 'lon' => '115.22'],
        ], 200),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/api/geocode/search?q=Pemogan')
        ->assertOk()
        ->assertJsonCount(1);
});

it('returns a 502 when nominatim is unreachable instead of crashing', function () {
    Http::fake([
        '*' => Http::response([], 500),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/api/geocode/reverse?lat=-8.65&lng=115.22')
        ->assertStatus(502);
});

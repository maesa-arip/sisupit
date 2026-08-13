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

// Nominatim mencocokkan KATA UTUH: "gema mer" nihil padahal "gema merdeka" ketemu (diuji
// langsung ke instance lokal). Operator yang terbiasa Google Maps akan mengira datanya tidak
// ada, jadi proxy mengulang pencarian tanpa kata terakhir lalu menyaringnya sebagai awalan.
it('falls back to a prefix match on the half-typed last word', function () {
    Http::fake([
        '*' => Http::sequence()
            // 1) apa adanya: "gema mer" -> nihil, seperti Nominatim sungguhan.
            ->push([], 200)
            // 2) dipendekkan: "gema" -> ada kandidatnya.
            ->push([
                ['display_name' => 'Radio Gema Merdeka, Jalan WR Supratman, Denpasar', 'lat' => '-8.64', 'lon' => '115.25'],
                ['display_name' => 'PT Percetakan Gema, Jalan PB Sudirman, Denpasar', 'lat' => '-8.67', 'lon' => '115.21'],
            ], 200),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/api/geocode/search?q='.urlencode('gema mer'))
        ->assertOk()
        // Hanya yang punya kata berawalan "mer" yang lolos saringan.
        ->assertJsonCount(1)
        ->assertJsonPath('0.display_name', 'Radio Gema Merdeka, Jalan WR Supratman, Denpasar');
});

it('still shows the shortened-query candidates when nothing matches the typed prefix', function () {
    Http::fake([
        '*' => Http::sequence()
            ->push([], 200)
            ->push([
                ['display_name' => 'PT Percetakan Gema, Jalan PB Sudirman, Denpasar', 'lat' => '-8.67', 'lon' => '115.21'],
            ], 200),
    ]);

    $user = User::factory()->create();

    // Nol hasil jauh lebih menyesatkan bagi operator daripada hasil yang relevan sebagian.
    $this->actingAs($user)
        ->get('/api/geocode/search?q='.urlencode('gema zzz'))
        ->assertOk()
        ->assertJsonCount(1);
});

it('does not fire a second nominatim call for a single-word query that finds nothing', function () {
    Http::fake(['*' => Http::response([], 200)]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/api/geocode/search?q=zzzzz')
        ->assertOk()
        ->assertJsonCount(0);

    Http::assertSentCount(1);
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

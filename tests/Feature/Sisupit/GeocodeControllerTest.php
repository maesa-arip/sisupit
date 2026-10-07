<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
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

// #188: Nominatim tak mengenali singkatan jalan Indonesia ("jln. teuku umar" = 0 hasil,
// "jalan teuku umar" ketemu - diuji ke nominatim.openstreetmap.org). Google Maps paham,
// jadi proxy menyeragamkan singkatannya sebelum dikirim.
it('expands jl, jl., jln, jln. and gg to the full street words osm uses', function (string $typed, string $sent) {
    Http::fake(['*' => Http::response([['display_name' => 'Jalan Teuku Umar, Denpasar', 'lat' => '-8.67', 'lon' => '115.21']], 200)]);

    $this->actingAs(User::factory()->create())
        ->get('/api/geocode/search?q='.urlencode($typed))
        ->assertOk()
        ->assertJsonCount(1);

    Http::assertSent(fn ($request) => $request['q'] === $sent);
})->with([
    ['jl teuku umar', 'Jalan teuku umar'],
    ['Jl. Teuku Umar', 'Jalan Teuku Umar'],
    ['jl.teuku umar', 'Jalan teuku umar'],
    ['jln teuku umar', 'Jalan teuku umar'],
    ['JLN. teuku umar', 'Jalan teuku umar'],
    ['jalan teuku umar', 'Jalan teuku umar'],
    ['gg. melati denpasar', 'Gang melati denpasar'],
    // Kata yang sekadar BERAWALAN "jl"/"gg"/"jalan" tidak boleh ikut diubah.
    ['jalanan sanur', 'jalanan sanur'],
    ['toko ggm sanur', 'toko ggm sanur'],
]);

it('retries without the word Jalan when the street is named without it in osm', function () {
    Http::fake([
        '*' => Http::sequence()
            ->push([], 200) // "Jalan gatot subroto"
            ->push([], 200) // awalan: "Jalan gatot" disaring "subroto"
            ->push([['display_name' => 'Gatot Subroto, Lelateng, Negara', 'lat' => '-8.35', 'lon' => '114.62']], 200),
    ]);

    $this->actingAs(User::factory()->create())
        ->get('/api/geocode/search?q='.urlencode('jln. gatot subroto'))
        ->assertOk()
        ->assertJsonPath('0.display_name', 'Gatot Subroto, Lelateng, Negara');

    Http::assertSent(fn ($request) => $request['q'] === 'gatot subroto');
});

it('biases search results around the current pin without hiding far results', function () {
    Http::fake(['*' => Http::response([['display_name' => 'Jalan Teuku Umar, Denpasar', 'lat' => '-8.67', 'lon' => '115.21']], 200)]);

    $this->actingAs(User::factory()->create())
        ->get('/api/geocode/search?q=teuku+umar&lat=-8.6712&lng=115.2133')
        ->assertOk();

    Http::assertSent(fn ($request) => $request['viewbox'] === '114.9,-8.4,115.5,-9'
        && ! isset($request['bounded']));
});

// Kamus nama wilayah untuk koreksi ejaan. Tenant uji = bawaan config (Denpasar, provinsi 51).
function seedGeocodeDictionary(): void
{
    DB::table('indonesia_provinces')->insert([['code' => '51', 'name' => 'BALI'], ['code' => '36', 'name' => 'BANTEN']]);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'KOTA DENPASAR'],
        ['code' => '5108', 'province_code' => '51', 'name' => 'KABUPATEN BULELENG'],
        ['code' => '5102', 'province_code' => '51', 'name' => 'KABUPATEN TABANAN'],
        ['code' => '3601', 'province_code' => '36', 'name' => 'KABUPATEN PANDEGLANG'],
    ]);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'DENPASAR SELATAN'],
        ['code' => '510805', 'city_code' => '5108', 'name' => 'SUKASADA'],
        ['code' => '360114', 'city_code' => '3601', 'name' => 'PAGELARAN'],
    ]);
    DB::table('indonesia_villages')->insert([
        ['code' => '5108052002', 'district_code' => '510805', 'name' => 'WANAGIRI'],
        ['code' => '5171012006', 'district_code' => '517101', 'name' => 'SESETAN'],
        ['code' => '5171012004', 'district_code' => '517101', 'name' => 'SANUR'],
        ['code' => '5171012008', 'district_code' => '517101', 'name' => 'PEMOGAN'],
    ]);
    // Bukan provinsi tenant: tak boleh ikut jadi kamus.
    DB::table('indonesia_villages')->insert(['code' => '3601142008', 'district_code' => '360114', 'name' => 'WANASARI']);
}

// Nominatim tak toleran salah ketik ("wngiri", "snur", "seseten" = 0 hasil, ejaan benarnya
// ketemu - diuji ke nominatim.openstreetmap.org 2026-10-07), Google Maps mengoreksinya.
it('corrects a misspelled place name from the region dictionary and reports it in a header', function (string $typed, string $corrected) {
    seedGeocodeDictionary();

    Http::fake(fn ($request) => Http::response(
        $request['q'] === $corrected ? [['display_name' => "{$corrected}, Bali", 'lat' => '-8.2', 'lon' => '115.1']] : [],
        200
    ));

    $this->actingAs(User::factory()->create())
        ->get('/api/geocode/search?q='.urlencode($typed))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertHeader('X-Geocode-Corrected-Query', rawurlencode($corrected));
})->with([
    'vokal hilang' => ['wngiri', 'Wanagiri'],
    'vokal hilang pendek' => ['snur', 'Sanur'],
    'satu huruf salah' => ['seseten', 'Sesetan'],
    'huruf kurang' => ['pemogn', 'Pemogan'],
    'kata kedua salah, kata umum tetap' => ['jalan seseten', 'Jalan Sesetan'],
]);

it('does not send a correction when the query already has results', function () {
    seedGeocodeDictionary();
    Http::fake(['*' => Http::response([['display_name' => 'Sesetan, Denpasar', 'lat' => '-8.7', 'lon' => '115.2']], 200)]);

    $this->actingAs(User::factory()->create())
        ->get('/api/geocode/search?q=sesetan')
        ->assertOk()
        ->assertHeaderMissing('X-Geocode-Corrected-Query');

    Http::assertSentCount(1);
});

it('leaves words it cannot match confidently alone', function (string $typed) {
    seedGeocodeDictionary();
    Http::fake(['*' => Http::response([], 200)]);

    $this->actingAs(User::factory()->create())
        ->get('/api/geocode/search?q='.urlencode($typed))
        ->assertOk()
        ->assertJsonCount(0)
        ->assertHeaderMissing('X-Geocode-Corrected-Query');

    // Hanya pencarian apa adanya (dan cadangan awalan bila multi-kata) - tak ada query koreksi.
    Http::assertNotSent(fn ($request) => in_array($request['q'], ['Wanagiri', 'Sanur', 'Sesetan', 'Wanasari'], true));
})->with([
    // Huruf pertama beda -> bukan salah ketik yang lazim.
    'huruf pertama beda' => ['managiri'],
    // Kata 3 huruf berjarak 1 tanpa pola vokal hilang.
    'kata pendek' => ['sar'],
    // Desa provinsi lain bukan kamus tenant ini.
    'provinsi lain' => ['wanasri'],
]);

// Dua desa "Wanagiri" di Bali: tanpa GPS, yang di kabupaten tenant hampir pasti dimaksud.
it('puts results inside the tenant city first while keeping the rest in order', function () {
    seedGeocodeDictionary();
    Http::fake(['*' => Http::response([
        ['display_name' => 'Wanagiri, Sukasada, Buleleng, Bali', 'lat' => '-8.2', 'lon' => '115.1'],
        ['display_name' => 'Jalan Wanagiri, Denpasar Selatan, Denpasar, Bali', 'lat' => '-8.7', 'lon' => '115.2'],
        ['display_name' => 'Wanagiri Kauh, Selemadeg, Tabanan, Bali', 'lat' => '-8.4', 'lon' => '115.0'],
    ], 200)]);

    $this->actingAs(User::factory()->create())
        ->get('/api/geocode/search?q=wanagiri')
        ->assertOk()
        ->assertJsonPath('0.display_name', 'Jalan Wanagiri, Denpasar Selatan, Denpasar, Bali')
        ->assertJsonPath('1.display_name', 'Wanagiri, Sukasada, Buleleng, Bali')
        ->assertJsonPath('2.display_name', 'Wanagiri Kauh, Selemadeg, Tabanan, Bali');
});

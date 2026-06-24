<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
});

it('throttles a citizen who spams report submissions', function () {
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $payload = [
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Jl. Pemogan No. 1',
    ];

    for ($i = 0; $i < 5; $i++) {
        $this->actingAs($citizen)
            ->post('/reports/create', [...$payload, 'photo' => UploadedFile::fake()->image('kejadian.jpg')])
            ->assertRedirect();
    }

    $this->actingAs($citizen)
        ->post('/reports/create', [...$payload, 'photo' => UploadedFile::fake()->image('kejadian.jpg')])
        ->assertStatus(429);
});

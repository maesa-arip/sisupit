<?php

use App\Models\Pompa;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Kode desa fasilitas yang tidak ada di tabel wilayah (FINDINGS #78).
 *
 * Seeder fasilitas dulu mengarang kode desa, sehingga rekap air per desa di /admin/pumps
 * memberi judul berupa ANGKA 10 digit. Dua lapis yang dijaga di sini:
 *   - layar: kode wilayah tidak pernah lagi menjadi judul baris rekap, seburuk apa pun datanya;
 *   - data: `sisupit:fix-facility-village-codes` memperbaiki kode yang rusak, tapi tidak pernah
 *     menulis apa pun sebelum diminta (--apply) dan tidak pernah menimpa kode yang SAH.
 *
 * Semua pemanggilan perintah memakai --offline: jalur akuratnya (reverse-geocode lewat
 * GeocodeController) memerlukan Nominatim yang hidup, dan test tidak boleh menyentuh jaringan.
 */
beforeEach(function () {
    $this->admin = User::factory()->create(['city_code' => '5171']);
    $this->admin->assignRole('admin');

    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);

    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan'],
        ['code' => '517102', 'city_code' => '5171', 'name' => 'Denpasar Timur'],
    ]);

    DB::table('indonesia_villages')->insert([
        [
            'code' => '5171012008',
            'district_code' => '517101',
            'name' => 'Pemogan',
            'meta' => json_encode(['lat' => '-8.7137', 'long' => '115.1968']),
        ],
        [
            'code' => '5171021010',
            'district_code' => '517102',
            'name' => 'Dangin Puri',
            'meta' => json_encode(['lat' => '-8.6568', 'long' => '115.2207']),
        ],
    ]);
});

/** Aset SKKL di dekat centroid Pemogan, dengan kode desa yang bisa diatur per test. */
function pompaBerkode(?string $villageCode, string $districtCode = '517101'): Pompa
{
    return Pompa::create([
        'name' => 'Pompa Uji',
        'address' => 'Jl. Raya Pemogan',
        'status' => 'Aktif',
        'type' => 'Portable (Mobil)',
        'capacity_lpm' => 800,
        'lat' => '-8.7130',
        'lng' => '115.1960',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => $districtCode,
        'village_code' => $villageCode,
    ]);
}

it('never puts a region code on screen when the village is unknown', function () {
    pompaBerkode('5171012003'); // kode berbentuk sah, tapi tidak ada di indonesia_villages

    $summary = $this->actingAs($this->admin)->get('/admin/pumps')->viewData('page')['props']['summary'];

    // Angka 10 digit tak berarti apa pun bagi operator; nama kecamatannya masih bisa
    // diturunkan dari awalan kodenya, jadi barisnya tetap punya tempat yang dikenali.
    expect($summary[0]['village'])->toBe('Desa tidak dikenal · Kec. Denpasar Selatan');
    expect($summary[0]['village'])->not->toContain('5171012003');
});

it('still shows the real village name when the code is valid', function () {
    pompaBerkode('5171012008');

    $summary = $this->actingAs($this->admin)->get('/admin/pumps')->viewData('page')['props']['summary'];

    expect($summary[0]['village'])->toBe('Pemogan');
});

it('leaves the data alone until --apply is given', function () {
    $pompa = pompaBerkode('5171012003');

    $this->artisan('sisupit:fix-facility-village-codes --offline')->assertSuccessful();

    expect($pompa->fresh()->village_code)->toBe('5171012003');
});

it('repairs an unknown village code from the facility point', function () {
    $pompa = pompaBerkode('5171012003');

    $this->artisan('sisupit:fix-facility-village-codes --offline --apply')->assertSuccessful();

    expect($pompa->fresh()->village_code)->toBe('5171012008');
});

it('repairs the region chain above the village too', function () {
    // Kecamatan yang tersimpan ikut salah — kalau hanya kode desanya yang diperbaiki, rantai
    // kodenya jadi tidak konsisten dan pemeriksaan yurisdiksi fasilitas menolak baris ini.
    $pompa = pompaBerkode('5171012003', '517102');

    $this->artisan('sisupit:fix-facility-village-codes --offline --apply')->assertSuccessful();

    $pompa->refresh();
    expect($pompa->district_code)->toBe('517101');
    expect($pompa->city_code)->toBe('5171');
    expect($pompa->province_code)->toBe('51');
});

it('never overwrites a village code that does exist', function () {
    // Desa bisa memanjang dan titik di pinggirnya wajar lebih dekat ke centroid tetangga.
    // Menimpanya berarti menebak di atas data yang sah, jadi baris ini hanya dilaporkan.
    $pompa = pompaBerkode('5171021010');

    $this->artisan('sisupit:fix-facility-village-codes --offline --apply')->assertSuccessful();

    expect($pompa->fresh()->village_code)->toBe('5171021010');
});

it('leaves rows without any village code untouched', function () {
    $pompa = pompaBerkode(null);

    $this->artisan('sisupit:fix-facility-village-codes --offline --apply')->assertSuccessful();

    expect($pompa->fresh()->village_code)->toBeNull();
});

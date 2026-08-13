<?php

use App\Models\Agency;
use App\Models\Report;
use App\Models\User;

/**
 * #60 — baris wilayah yang LEBIH LUAS harus terlihat oleh user yang wilayahnya lebih sempit.
 *
 * Master OPD/armada disimpan oleh admin tingkat kota, jadi `district_code`/`village_code`-nya
 * NULL. Sebelum perbaikan, `Tenantable` memfilter hanya dengan kolom TERSEMPIT milik user dan
 * menuntut kecocokan persis — dan di SQL `NULL = '517101'` bukan true, sehingga staf yang
 * akunnya terikat kecamatan/desa melihat daftar OPD KOSONG tanpa pesan galat apa pun.
 *
 * Aturan yang benar sudah dipakai di tempat lain (User::scopeNotifiableForReport: "kolom NULL
 * = wewenang lebih luas"); test ini menegakkan hal yang sama untuk Tenantable.
 */

/** OPD tingkat kota — persis bentuk yang dihasilkan AgencyController saat admin kota menyimpan. */
function cityLevelAgency(string $name = 'BPBD Kota Denpasar'): Agency
{
    return Agency::create([
        'name' => $name,
        'is_active' => true,
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => null,
        'village_code' => null,
    ]);
}

function denpasarStaff(array $codes): User
{
    $user = User::factory()->create($codes);
    $user->assignRole('petugas');

    return $user;
}

it('lets a district-scoped user see a city-level agency', function () {
    cityLevelAgency();

    // Petugas Damkar 3 di produksi: terikat Kecamatan Denpasar Selatan.
    $this->actingAs(denpasarStaff([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => null,
    ]));

    // BUG lama: 0 — baris ber-district_code NULL tak pernah cocok dengan where district_code = '517101'.
    expect(Agency::count())->toBe(1);
});

it('lets a village-scoped user see a city-level agency', function () {
    cityLevelAgency();

    // Petugas Damkar 2 di produksi: terikat Desa Sanur Kauh.
    $this->actingAs(denpasarStaff([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011003',
    ]));

    expect(Agency::count())->toBe(1);
});

it('still hides an agency belonging to another city', function () {
    cityLevelAgency();
    Agency::create([
        'name' => 'BPBD Kabupaten Badung',
        'is_active' => true,
        'province_code' => '51',
        'city_code' => '5103',
        'district_code' => null,
        'village_code' => null,
    ]);

    $this->actingAs(denpasarStaff([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => null,
    ]));

    // Melebarkan ke atas TIDAK boleh berarti melebar ke samping.
    expect(Agency::count())->toBe(1);
    expect(Agency::first()->name)->toBe('BPBD Kota Denpasar');
});

it('now also checks province and city for a district-scoped user', function () {
    // Baris menyimpang: district_code sama, tapi kota lain. Sebelum perbaikan baris ini IKUT
    // terambil, karena user ber-district hanya difilter dengan district_code saja.
    Agency::create([
        'name' => 'OPD kota lain berkode kecamatan sama',
        'is_active' => true,
        'province_code' => '31',
        'city_code' => '3171',
        'district_code' => '517101',
        'village_code' => null,
    ]);

    $this->actingAs(denpasarStaff([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => null,
    ]));

    expect(Agency::count())->toBe(0);
});

it('does not widen report visibility, because reports always carry full region codes', function () {
    $owner = User::factory()->create(['village_code' => '5171012006']);

    // Dua laporan berkode LENGKAP di kecamatan berbeda — bentuk data laporan yang sebenarnya
    // (di produksi 0 dari 131 laporan Denpasar punya kolom wilayah kosong).
    Report::create([
        'user_id' => $owner->id, 'title' => 'Densel', 'status' => 'pending',
        'lat' => '-8.6', 'lng' => '115.2',
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
    ]);
    Report::create([
        'user_id' => $owner->id, 'title' => 'Denbar', 'status' => 'pending',
        'lat' => '-8.6', 'lng' => '115.1',
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517103', 'village_code' => '5171032002',
    ]);

    $this->actingAs(denpasarStaff([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => null,
    ]));

    expect(Report::count())->toBe(1);
    expect(Report::first()->title)->toBe('Densel');
});

it('keeps denying a logged-in user without any region code', function () {
    cityLevelAgency();

    // Jaring pengaman #44 tidak boleh ikut longgar: NULL di sisi USER tetap berarti tertutup.
    $user = User::factory()->create([
        'province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null,
    ]);
    $user->assignRole('masyarakat');

    $this->actingAs($user);

    expect(Agency::count())->toBe(0);
});

it('keeps national access for superadmin', function () {
    cityLevelAgency();
    Agency::create([
        'name' => 'BPBD Kabupaten Badung',
        'is_active' => true,
        'province_code' => '51',
        'city_code' => '5103',
    ]);

    $su = User::factory()->create([
        'province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null,
    ]);
    $su->assignRole('superadmin');

    $this->actingAs($su);

    expect(Agency::count())->toBe(2);
});

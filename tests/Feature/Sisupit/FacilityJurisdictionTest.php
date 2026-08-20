<?php

use App\Models\Hydrant;
use App\Models\HydrantWarga;
use App\Models\Pompa;
use App\Models\PosPemadam;
use App\Models\User;

/**
 * Kode wilayah aset fasilitas (hydrant, hydrant warga, SKKL/pompa, pos pemadam).
 *
 * Aturan lama "yurisdiksi admin menang atas isi form" hanya menjaga level yang DIKUNCI: admin
 * kota bisa mengirim `district_code`/`village_code` milik kabupaten lain dan barisnya tetap
 * tersimpan — lalu tetap terlihat olehnya karena `Tenantable` menyaring per kota. Datanya rusak
 * tanpa gejala. Sejak 2026-08-20 rantainya diperiksa di `App\Traits\ResolvesFacilityJurisdiction`.
 *
 * Kode wilayah di sini memakai bentuk BPS asli: 51 Bali → 5171 Denpasar (5103 Badung) →
 * 5171012 Denpasar Selatan → 5171012006 sebuah kelurahan di dalamnya.
 */
beforeEach(function () {
    $this->payload = [
        'name' => 'Aset Uji',
        'address' => 'Jl. Uji Coba No. 1',
        'status' => 'Aktif',
        'type' => 'Stick',
        // Hanya dipakai hydrant resmi; controller lain membuangnya saat validasi.
        'debit_lpm' => 500,
        'lat' => '-8.6900',
        'lng' => '115.2600',
    ];
});

/**
 * Hydrant warga memakai kosakata sendiri sejak 2026-08-21 (Sumber Air, status modifikasi,
 * kapasitas liter). Payload bersama di atas akan ditolak di sana karena alasan yang SALAH —
 * dan sebuah test yang lulus karena galat yang keliru tidak menjaga apa pun.
 */
function facilityPayload(array $base, string $url): array
{
    return $url === '/admin/hydrant-warga'
        ? [...$base, 'status' => 'Belum Modifikasi', 'type' => 'Tandon', 'capacity_liter' => 5000]
        : $base;
}

/** Admin yang wewenangnya berhenti di satu level; sisanya dibiarkan NULL = tidak mengunci. */
function facilityAdmin(array $codes): User
{
    $user = User::factory()->create($codes);
    $user->assignRole('admin');

    return $user;
}

it('rejects a village outside the admin city on every facility module', function (string $url) {
    $admin = facilityAdmin(['city_code' => '5171']); // Denpasar

    $this->actingAs($admin)
        ->post($url, [...facilityPayload($this->payload, $url), 'village_code' => '5103010001']) // Badung
        ->assertSessionHasErrors('village_code');
})->with([
    '/admin/hydrants',
    '/admin/hydrant-warga',
    '/admin/pumps',
    '/admin/fire-stations',
]);

it('saves nothing when the village is outside the admin city', function () {
    $admin = facilityAdmin(['city_code' => '5171']);

    $this->actingAs($admin)->post('/admin/hydrants', [...$this->payload, 'village_code' => '5103010001']);
    $this->actingAs($admin)->post('/admin/hydrant-warga', [
        ...facilityPayload($this->payload, '/admin/hydrant-warga'),
        'village_code' => '5103010001',
    ]);
    $this->actingAs($admin)->post('/admin/pumps', [...$this->payload, 'village_code' => '5103010001']);
    $this->actingAs($admin)->post('/admin/fire-stations', [...$this->payload, 'village_code' => '5103010001']);

    expect(Hydrant::count())->toBe(0);
    expect(HydrantWarga::count())->toBe(0);
    expect(Pompa::count())->toBe(0);
    expect(PosPemadam::count())->toBe(0);
});

it('rejects a district outside the admin city', function () {
    $admin = facilityAdmin(['city_code' => '5171']);

    $this->actingAs($admin)
        ->post('/admin/pumps', [...$this->payload, 'district_code' => '5103010'])
        ->assertSessionHasErrors('district_code');
});

it('rejects a city outside the admin province', function () {
    $admin = facilityAdmin(['province_code' => '51']); // Bali, kota belum dikunci

    $this->actingAs($admin)
        ->post('/admin/pumps', [...$this->payload, 'city_code' => '3273']) // Bandung
        ->assertSessionHasErrors('city_code');
});

it('still accepts a city inside the admin province', function () {
    $admin = facilityAdmin(['province_code' => '51']);

    $this->actingAs($admin)
        ->post('/admin/pumps', [...$this->payload, 'city_code' => '5103'])
        ->assertSessionHasNoErrors();

    expect(Pompa::withoutGlobalScopes()->first()->city_code)->toBe('5103');
});

it('derives the missing upper levels from the village code', function () {
    // Form fasilitas hanya mengirim desa (provinsi/kecamatan tidak ada di formnya), sehingga
    // dulu kolom-kolom itu tersimpan kosong dan rekap per kecamatan jadi bolong padahal
    // informasinya sudah ada di dalam kode desa.
    $admin = facilityAdmin(['city_code' => '5171']);

    $this->actingAs($admin)
        ->post('/admin/hydrants', [...$this->payload, 'village_code' => '5171012006'])
        ->assertSessionHasNoErrors();

    $hydrant = Hydrant::withoutGlobalScopes()->first();
    expect($hydrant->province_code)->toBe('51');
    expect($hydrant->city_code)->toBe('5171');
    expect($hydrant->district_code)->toBe('5171012');
    expect($hydrant->village_code)->toBe('5171012006');
});

it('keeps the admin jurisdiction winning over a forged form value', function () {
    // Aturan lama yang TIDAK boleh hilang: level yang dikunci akun tidak bisa ditimpa form.
    $admin = facilityAdmin(['city_code' => '5171', 'district_code' => '5171012']);

    $this->actingAs($admin)
        ->post('/admin/fire-stations', [
            ...$this->payload,
            'city_code' => '5103',
            'district_code' => '5103010',
        ])
        ->assertSessionHasNoErrors();

    $pos = PosPemadam::withoutGlobalScopes()->first();
    expect($pos->city_code)->toBe('5171');
    expect($pos->district_code)->toBe('5171012');
});

it('guards the update path too, not just create', function () {
    $admin = facilityAdmin(['city_code' => '5171']);

    $this->actingAs($admin)->post('/admin/pumps', [...$this->payload, 'village_code' => '5171012006']);
    $pump = Pompa::withoutGlobalScopes()->first();

    $this->actingAs($admin)
        ->put("/admin/pumps/{$pump->id}", [...$this->payload, 'village_code' => '5103010001'])
        ->assertSessionHasErrors('village_code');

    expect($pump->fresh()->village_code)->toBe('5171012006');
});

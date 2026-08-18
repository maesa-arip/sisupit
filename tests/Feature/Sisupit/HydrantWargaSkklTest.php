<?php

use App\Models\Hydrant;
use App\Models\HydrantWarga;
use App\Models\Pompa;
use App\Models\User;

/**
 * Hydrant warga & SKKL (TASK_30).
 *
 * Sejak 2026-08-19 hydrant warga punya TABEL & ROUTE sendiri (pengecualian aturan yang
 * disetujui user — `prompt/docs/PENGECUALIAN_ATURAN.md` #1). Yang dijaga di sini adalah
 * konsekuensi pemisahan itu, yaitu hal-hal yang paling gampang jebol nanti:
 *   - hydrant warga TIDAK bocor ke daftar/halaman hydrant resmi, dan sebaliknya;
 *   - `debit_lpm` wajib untuk hydrant warga (rekap debit desa berdiri di atasnya), tapi
 *     tetap opsional untuk hydrant resmi yang angkanya dipegang PDAM;
 *   - daftar SKKL menggabungkan dua sumber dan tiap baris membawa `source` yang benar,
 *     karena `source` itulah yang menentukan tombol edit/hapus menunjuk ke resource mana.
 */
beforeEach(function () {
    $this->admin = User::factory()->create(['city_code' => '5171']);
    $this->admin->assignRole('admin');

    $this->payload = [
        'name' => 'Hydrant Banjar Sanur',
        'address' => 'Jl. Danau Poso No. 1',
        'status' => 'Aktif',
        'type' => 'Stick',
        'water_pressure' => 'Sedang',
        'debit_lpm' => 500,
        'lat' => '-8.6900',
        'lng' => '115.2600',
        'village_code' => '5171012006',
    ];
});

it('requires debit air for a citizen hydrant', function () {
    $this->actingAs($this->admin)
        ->post('/admin/hydrant-warga', [...$this->payload, 'debit_lpm' => null])
        ->assertSessionHasErrors('debit_lpm');

    expect(HydrantWarga::count())->toBe(0);
});

it('keeps debit air optional for an official hydrant', function () {
    $this->actingAs($this->admin)
        ->post('/admin/hydrants', [...$this->payload, 'name' => 'Hydrant Kota Gatsu', 'debit_lpm' => null])
        ->assertSessionHasNoErrors();

    expect(Hydrant::count())->toBe(1);
});

it('rejects a water pressure outside the three known values', function () {
    $this->actingAs($this->admin)
        ->post('/admin/hydrant-warga', [...$this->payload, 'water_pressure' => 'Deras Sekali'])
        ->assertSessionHasErrors('water_pressure');
});

it('stores a citizen hydrant in its own table, never in hydrants or pompas', function () {
    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload)->assertRedirect();

    $hydrant = HydrantWarga::first();
    expect($hydrant->name)->toBe('Hydrant Banjar Sanur');
    expect($hydrant->debit_lpm)->toBe(500);
    expect($hydrant->water_pressure)->toBe('Sedang');

    expect(Hydrant::count())->toBe(0);
    expect(Pompa::count())->toBe(0);
});

it('keeps the two hydrant lists apart', function () {
    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload);
    $this->actingAs($this->admin)->post('/admin/hydrants', [...$this->payload, 'name' => 'Hydrant Kota Gatsu']);

    $resmi = $this->actingAs($this->admin)->get('/admin/hydrants')->viewData('page')['props'];
    expect($resmi['variant'])->toBe('resmi');
    expect(collect($resmi['hydrants']['data'])->pluck('name')->all())->toBe(['Hydrant Kota Gatsu']);

    $warga = $this->actingAs($this->admin)->get('/admin/hydrant-warga')->viewData('page')['props'];
    expect($warga['variant'])->toBe('warga');
    expect(collect($warga['hydrants']['data'])->pluck('name')->all())->toBe(['Hydrant Banjar Sanur']);
});

it('shows citizen hydrants in the SKKL list alongside pumps, tagged with their source', function () {
    Pompa::create([
        'name' => 'Pompa Banjar Renon',
        'address' => 'Jl. Raya Puputan',
        'status' => 'Aktif',
        'type' => 'Portable (Mobil)',
        'capacity_lpm' => 800,
        'lat' => '-8.6700',
        'lng' => '115.2400',
        'city_code' => '5171',
        'village_code' => '5171012006',
    ]);

    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload);

    $rows = collect(
        $this->actingAs($this->admin)->get('/admin/pumps')->viewData('page')['props']['pumps']['data']
    );

    expect($rows)->toHaveCount(2);
    expect($rows->pluck('source')->sort()->values()->all())->toBe(['hydrant_warga', 'pompa']);

    $citizen = $rows->firstWhere('source', 'hydrant_warga');
    expect($citizen['name'])->toBe('Hydrant Banjar Sanur');
    expect($citizen['debit_lpm'])->toBe(500);
    // Tombol edit di daftar SKKL menunjuk ke resource hydrant warga, jadi id-nya harus id-nya.
    expect($citizen['id'])->toBe(HydrantWarga::first()->id);
});

it('sums debit per village so the summary answers "how much water does this village have"', function () {
    Pompa::create([
        'name' => 'Pompa Banjar Renon',
        'address' => 'Jl. Raya Puputan',
        'status' => 'Aktif',
        'type' => 'Portable (Mobil)',
        'capacity_lpm' => 800,
        'lat' => '-8.6700',
        'lng' => '115.2400',
        'city_code' => '5171',
        'village_code' => '5171012006',
    ]);

    // Aset tanpa debit: ikut dihitung sebagai TITIK, tapi tidak menambah total — dan
    // keberadaannya dilaporkan lewat unknown_debit supaya total tak dibaca sebagai angka pasti.
    Pompa::create([
        'name' => 'Tandon Lama',
        'address' => 'Jl. Sekar',
        'status' => 'Aktif',
        'type' => 'Statis (Hydrant)',
        'capacity_lpm' => null,
        'lat' => '-8.6800',
        'lng' => '115.2500',
        'city_code' => '5171',
        'village_code' => '5171012006',
    ]);

    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload);

    $summary = $this->actingAs($this->admin)->get('/admin/pumps')->viewData('page')['props']['summary'];

    expect($summary)->toHaveCount(1);
    expect($summary[0]['points'])->toBe(3);
    expect($summary[0]['debit_lpm'])->toBe(1300); // 800 pompa + 500 hydrant warga
    expect($summary[0]['unknown_debit'])->toBe(1);
});

it('keeps citizen hydrants off the public official-hydrant page and vice versa', function () {
    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload);
    $this->actingAs($this->admin)->post('/admin/hydrants', [
        ...$this->payload,
        'name' => 'Hydrant Kota Gatsu',
        'debit_lpm' => null,
    ]);

    $names = collect($this->get('/hydrants')->viewData('page')['props']['hydrants']['data'])->pluck('name');
    expect($names->all())->toBe(['Hydrant Kota Gatsu']);

    $skkl = collect($this->get('/pumps')->viewData('page')['props']['pumps']['data'])->pluck('name');
    expect($skkl->all())->toBe(['Hydrant Banjar Sanur']);
});

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
 *   - kosakata hydrant warga tidak diam-diam kembali menyalin hydrant resmi. Sejak
 *     2026-08-21 keduanya SENGAJA berbeda: warga memakai Sumber Air (Tandon/Groundtank),
 *     status Belum/Sudah Modifikasi, dan `capacity_liter` (simpanan, liter) yang WAJIB;
 *     resmi tetap Konstruksi, Aktif/Perbaikan, tekanan air, dan `debit_lpm` (aliran,
 *     liter/menit) yang opsional karena angkanya dipegang PDAM;
 *   - liter dan liter/menit TIDAK pernah dijumlahkan di rekap air per desa;
 *   - daftar SKKL menggabungkan dua sumber dan tiap baris membawa `source` yang benar,
 *     karena `source` itulah yang menentukan tombol edit/hapus menunjuk ke resource mana.
 */
beforeEach(function () {
    $this->admin = User::factory()->create(['city_code' => '5171']);
    $this->admin->assignRole('admin');

    $lokasi = [
        'lat' => '-8.6900',
        'lng' => '115.2600',
        'village_code' => '5171012006',
    ];

    // Hydrant warga: tandon/groundtank swadaya.
    $this->payload = [
        'name' => 'Hydrant Banjar Sanur',
        'address' => 'Jl. Danau Poso No. 1',
        'status' => 'Belum Modifikasi',
        'type' => 'Tandon',
        'capacity_liter' => 5000,
        ...$lokasi,
    ];

    // Hydrant resmi: kosakatanya sendiri, SENGAJA tidak dipakai bersama payload di atas —
    // satu payload untuk dua modul justru akan menutupi kalau kosakatanya diam-diam menyatu.
    $this->officialPayload = [
        'name' => 'Hydrant Kota Gatsu',
        'address' => 'Jl. Gatot Subroto',
        'status' => 'Aktif',
        'type' => 'Stick',
        'water_pressure' => 'Sedang',
        'debit_lpm' => 500,
        ...$lokasi,
    ];
});

it('requires kapasitas volume for a citizen hydrant', function () {
    $this->actingAs($this->admin)
        ->post('/admin/hydrant-warga', [...$this->payload, 'capacity_liter' => null])
        ->assertSessionHasErrors('capacity_liter');

    expect(HydrantWarga::count())->toBe(0);
});

it('keeps debit air optional for an official hydrant', function () {
    $this->actingAs($this->admin)
        ->post('/admin/hydrants', [...$this->officialPayload, 'debit_lpm' => null])
        ->assertSessionHasNoErrors();

    expect(Hydrant::count())->toBe(1);
});

it('rejects a water source outside the two known values', function () {
    $this->actingAs($this->admin)
        ->post('/admin/hydrant-warga', [...$this->payload, 'type' => 'Toren Ajaib'])
        ->assertSessionHasErrors('type');
});

it('refuses the official-hydrant vocabulary on a citizen hydrant', function () {
    // Penjaga arah sebaliknya: kalau suatu saat form/controller warga diam-diam disalin ulang
    // dari hydrant resmi, ketiga nilai ini akan lolos dan datanya rusak tanpa gejala.
    $this->actingAs($this->admin)
        ->post('/admin/hydrant-warga', [...$this->payload, 'status' => 'Aktif'])
        ->assertSessionHasErrors('status');

    $this->actingAs($this->admin)
        ->post('/admin/hydrant-warga', [...$this->payload, 'type' => 'Stick'])
        ->assertSessionHasErrors('type');

    expect(HydrantWarga::count())->toBe(0);
});

it('stores a citizen hydrant in its own table, never in hydrants or pompas', function () {
    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload)->assertRedirect();

    $hydrant = HydrantWarga::first();
    expect($hydrant->name)->toBe('Hydrant Banjar Sanur');
    expect($hydrant->type)->toBe('Tandon');
    expect($hydrant->status)->toBe('Belum Modifikasi');
    expect($hydrant->capacity_liter)->toBe(5000);

    expect(Hydrant::count())->toBe(0);
    expect(Pompa::count())->toBe(0);
});

it('keeps the two hydrant lists apart', function () {
    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload);
    $this->actingAs($this->admin)->post('/admin/hydrants', $this->officialPayload);

    $resmi = $this->actingAs($this->admin)->get('/admin/hydrants')->viewData('page')['props'];
    expect($resmi['variant'])->toBe('resmi');
    expect(collect($resmi['hydrants']['data'])->pluck('name')->all())->toBe(['Hydrant Kota Gatsu']);

    $warga = $this->actingAs($this->admin)->get('/admin/hydrant-warga')->viewData('page')['props'];
    expect($warga['variant'])->toBe('warga');
    expect(collect($warga['hydrants']['data'])->pluck('name')->all())->toBe(['Hydrant Banjar Sanur']);

    // Jumlah KEDUA daftar ikut dikirim ke tab. Angka inilah yang membuat pengguna langsung
    // paham ini dua kumpulan data, bukan filter — perbaikan atas keluhan user 2026-08-19.
    expect($resmi['counts'])->toBe(['resmi' => 1, 'warga' => 1]);
    expect($warga['counts'])->toBe(['resmi' => 1, 'warga' => 1]);
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
    expect($citizen['capacity_liter'])->toBe(5000);
    // Angka simpanan TIDAK boleh menyamar sebagai debit: kartu & rekap membaca kunci ini
    // sebagai liter/menit, jadi mengisinya berarti menampilkan 5.000 lpm yang tak pernah ada.
    expect($citizen['debit_lpm'])->toBeNull();
    expect($citizen['water_metric'])->toBe('capacity');
    // Tombol edit di daftar SKKL menunjuk ke resource hydrant warga, jadi id-nya harus id-nya.
    expect($citizen['id'])->toBe(HydrantWarga::first()->id);
});

it('keeps debit (lpm) and kapasitas (liter) apart in the per-village summary', function () {
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

    // Aliran: HANYA pompa. Sampai 2026-08-20 hydrant warga ikut dijumlahkan ke sini karena
    // satuannya memang sama; sejak ia jadi tandon, menjumlahkannya berarti mengaku punya
    // 5.800 lpm padahal yang ada 800 lpm + 5.000 liter air diam.
    expect($summary[0]['debit_points'])->toBe(2);
    expect($summary[0]['debit_lpm'])->toBe(800);
    expect($summary[0]['unknown_debit'])->toBe(1);

    // Simpanan: HANYA hydrant warga.
    expect($summary[0]['capacity_points'])->toBe(1);
    expect($summary[0]['capacity_liter'])->toBe(5000);
    expect($summary[0]['unknown_capacity'])->toBe(0);
});

it('keeps citizen hydrants off the public official-hydrant page and vice versa', function () {
    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload);
    $this->actingAs($this->admin)->post('/admin/hydrants', [...$this->officialPayload, 'debit_lpm' => null]);

    $names = collect($this->get('/hydrants')->viewData('page')['props']['hydrants']['data'])->pluck('name');
    expect($names->all())->toBe(['Hydrant Kota Gatsu']);

    $skkl = collect($this->get('/pumps')->viewData('page')['props']['pumps']['data'])->pluck('name');
    expect($skkl->all())->toBe(['Hydrant Banjar Sanur']);
});

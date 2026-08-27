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

// Hydrant warga DIKELUARKAN dari daftar SKKL admin 2026-08-26 (permintaan user) — tapi HANYA
// di menu admin. Halaman publik /pumps tetap menggabungkan keduanya, karena bagi warga &
// operator lapangan "SKKL" berarti seluruh sumber air lingkungan. Test ini menjaga kedua sisi
// sekaligus: kalau salah satunya ikut berubah diam-diam, satu daftar akan kehilangan separuh
// isinya tanpa gejala apa pun.
it('keeps citizen hydrants out of the admin SKKL list but inside the public one', function () {
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

    $adminRows = collect(
        $this->actingAs($this->admin)->get('/admin/pumps')->viewData('page')['props']['pumps']['data']
    );

    expect($adminRows)->toHaveCount(1);
    expect($adminRows->pluck('source')->unique()->all())->toBe(['pompa']);

    $publicRows = collect($this->get('/pumps')->viewData('page')['props']['pumps']['data']);

    expect($publicRows)->toHaveCount(2);
    expect($publicRows->pluck('source')->sort()->values()->all())->toBe(['hydrant_warga', 'pompa']);

    $citizen = $publicRows->firstWhere('source', 'hydrant_warga');
    expect($citizen['name'])->toBe('Hydrant Banjar Sanur');
    expect($citizen['capacity_liter'])->toBe(5000);
    // Angka simpanan TIDAK boleh menyamar sebagai debit: kartu membaca kunci ini sebagai
    // liter/menit, jadi mengisinya berarti menampilkan 5.000 lpm yang tak pernah ada.
    expect($citizen['debit_lpm'])->toBeNull();
    expect($citizen['water_metric'])->toBe('capacity');
    expect($citizen['id'])->toBe(HydrantWarga::first()->id);
});

// Rekap air per desa PINDAH ke menu Hydrant Warga dan hanya menjumlahkan hydrant warga
// (permintaan user 2026-08-26). Sebelumnya ia tinggal di /admin/pumps dan membawa DUA satuan
// berdampingan karena halamannya memuat pompa sekaligus tandon warga.
it('moves the per-village water summary to the citizen hydrant menu and counts only citizen hydrants', function () {
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

    // Titik tanpa kapasitas: ikut dihitung sebagai TITIK, tidak menambah total, dan
    // keberadaannya dilaporkan lewat unknown_capacity supaya total tak dibaca sebagai angka pasti.
    HydrantWarga::create([
        'name' => 'Tandon Belum Diukur',
        'address' => 'Jl. Sekar',
        'status' => 'Belum Modifikasi',
        'type' => 'Tandon',
        'capacity_liter' => null,
        'lat' => '-8.6800',
        'lng' => '115.2500',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ]);

    $adminProps = $this->actingAs($this->admin)->get('/admin/pumps')->viewData('page')['props'];

    // Daftar SKKL tidak lagi membawa rekap sama sekali.
    expect($adminProps)->not->toHaveKey('summary');

    $summary = $this->actingAs($this->admin)->get('/admin/hydrant-warga')->viewData('page')['props']['summary'];

    expect($summary)->toHaveCount(1);
    // Pompa di desa yang sama TIDAK ikut terhitung.
    expect($summary[0]['points'])->toBe(2);
    expect($summary[0]['capacity_liter'])->toBe(5000);
    expect($summary[0]['unknown_capacity'])->toBe(1);
});

it('keeps citizen hydrants off the public official-hydrant page and vice versa', function () {
    $this->actingAs($this->admin)->post('/admin/hydrant-warga', $this->payload);
    $this->actingAs($this->admin)->post('/admin/hydrants', [...$this->officialPayload, 'debit_lpm' => null]);

    $names = collect($this->get('/hydrants')->viewData('page')['props']['hydrants']['data'])->pluck('name');
    expect($names->all())->toBe(['Hydrant Kota Gatsu']);

    $skkl = collect($this->get('/pumps')->viewData('page')['props']['pumps']['data'])->pluck('name');
    expect($skkl->all())->toBe(['Hydrant Banjar Sanur']);
});

// Kedua jenis hydrant tampil sebagai SATU menu bertab, jadi sidebar hanya punya satu entri
// untuknya. Sampai 2026-08-26 entri itu hanya menyorot `/admin/hydrants`, sehingga membuka tab
// Hydrant Warga membuat sidebar tak menyorot apa pun — pengguna seolah berada di luar menu mana
// pun. Tak ada galat, tak ada test yang merah: karena itu penjaganya membaca berkas sumbernya.
it('keeps the hydrant sidebar entry active while the citizen hydrant tab is open', function () {
    expect(file_get_contents(resource_path('js/Layouts/Partials/navItems.js')))
        ->toContain("startsWith('/admin/hydrant-warga')");
});

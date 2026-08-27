<?php

use App\Models\Banjar;
use App\Models\HydrantWarga;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// Master banjar (permintaan user 2026-08-26): satuan komunitas Bali di bawah desa. Dibuat
// sebagai TABEL, bukan kolom teks bebas, karena banjar akan diisi setiap warga yang mendaftar —
// teks bebas + wajib menghasilkan "Br. Tegal"/"Banjar Tegal"/"tegal" untuk banjar yang sama dan
// membuat setiap rekap per banjar tak bisa dipercaya (kelas masalah yang sama dengan #78).
beforeEach(function () {
    DB::table('indonesia_provinces')->insert([['code' => '51', 'name' => 'Bali']]);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5103', 'province_code' => '51', 'name' => 'Kabupaten Badung'],
    ]);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan'],
        ['code' => '510301', 'city_code' => '5103', 'name' => 'Kuta'],
    ]);
    DB::table('indonesia_villages')->insert([
        ['code' => '5171012008', 'district_code' => '517101', 'name' => 'Pemogan'],
        ['code' => '5171012006', 'district_code' => '517101', 'name' => 'Sesetan'],
        ['code' => '5103012001', 'district_code' => '510301', 'name' => 'Kuta'],
    ]);

    $this->admin = User::factory()->create(['city_code' => '5171', 'province_code' => '51']);
    $this->admin->assignRole('admin');
});

function buatBanjar(array $overrides = []): Banjar
{
    return Banjar::withoutGlobalScope('tenant')->create(array_merge([
        'name' => 'Banjar Tegal Agung',
        'jenis' => 'dinas',
        'is_active' => true,
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012008',
    ], $overrides));
}

it('derives the region chain from the chosen village when an admin adds a banjar', function () {
    $this->actingAs($this->admin)->post('/admin/banjars', [
        'name' => 'Banjar Sanur Kaja',
        'jenis' => 'adat',
        'is_active' => true,
        'district_code' => '517101',
        'village_code' => '5171012008',
    ])->assertRedirect();

    $banjar = Banjar::withoutGlobalScope('tenant')->firstWhere('name', 'Banjar Sanur Kaja');

    // Rantai wilayah lengkap = syarat Tenantable bisa menyaring per kabupaten.
    expect($banjar->province_code)->toBe('51');
    expect($banjar->city_code)->toBe('5171');
    expect($banjar->district_code)->toBe('517101');
});

// Yurisdiksi akun menang atas isi form (#75): admin Denpasar tak boleh menyimpan banjar milik
// kabupaten lain, sekalipun kode desanya dipalsukan di request.
it('refuses a village outside the admin jurisdiction', function () {
    $this->actingAs($this->admin)->post('/admin/banjars', [
        'name' => 'Banjar Kuta',
        'district_code' => '510301',
        'village_code' => '5103012001',
    ])->assertSessionHasErrors();

    expect(Banjar::withoutGlobalScope('tenant')->count())->toBe(0);
});

it('only offers banjars that belong to the requested village', function () {
    buatBanjar(['name' => 'Banjar Pemogan Satu']);
    buatBanjar(['name' => 'Banjar Sesetan Satu', 'village_code' => '5171012006']);
    buatBanjar(['name' => 'Banjar Nonaktif', 'is_active' => false]);

    $rows = collect($this->getJson('/api/banjars/5171012008')->assertOk()->json());

    expect($rows->pluck('name')->all())->toBe(['Banjar Pemogan Satu']);
});

// Endpoint ini dipakai warga yang JUSTRU sedang mengisi wilayahnya, jadi ia tak boleh berdiri
// di belakang scope wilayah — user tanpa kode wilayah akan ditolak Tenantable (#44) dan
// dropdown-nya kosong selamanya tanpa satu pun galat.
it('serves banjar options to a user who has no region codes yet', function () {
    buatBanjar(['name' => 'Banjar Pemogan Satu']);

    $wargaBaru = User::factory()->create(['province_code' => null, 'city_code' => null, 'village_code' => null]);
    $wargaBaru->assignRole('masyarakat');

    $rows = collect($this->actingAs($wargaBaru)->getJson('/api/banjars/5171012008')->assertOk()->json());

    expect($rows)->toHaveCount(1);
});

it('stores the banjar chosen on a citizen hydrant', function () {
    $banjar = buatBanjar();

    $this->actingAs($this->admin)->post('/admin/hydrant-warga', [
        'name' => 'Tandon Banjar Tegal',
        'address' => 'Jl. Tegal',
        'status' => 'Belum Modifikasi',
        'type' => 'Tandon',
        'capacity_liter' => 5000,
        'banjar_id' => $banjar->id,
        'lat' => '-8.7130',
        'lng' => '115.1960',
        'district_code' => '517101',
        'village_code' => '5171012008',
    ])->assertRedirect();

    expect(HydrantWarga::withoutGlobalScope('tenant')->first()->banjar_id)->toBe($banjar->id);
});

// Banjar HARUS milik desa yang sedang disimpan. Sampai 2026-08-26 kedua jalur simpan cuma
// memakai `exists:banjars,id`, yang hanya membuktikan barisnya ada — tandon di Sesetan bisa
// tersimpan di bawah banjar Pemogan tanpa satu pun galat, dan yang rusak hanya rekap per banjar,
// diam-diam (bentuk #78). Jalurnya pun bukan rekayasa: menggeser pin membuat reverse-geocode
// menimpa village_code SESUDAH banjar dipilih, sementara id banjar lamanya ikut terkirim.
it('refuses a citizen hydrant whose banjar belongs to another village', function () {
    $banjarPemogan = buatBanjar(['village_code' => '5171012008']);

    $this->actingAs($this->admin)->post('/admin/hydrant-warga', [
        'name' => 'Tandon Sesetan',
        'address' => 'Jl. Sesetan',
        'status' => 'Belum Modifikasi',
        'type' => 'Tandon',
        'capacity_liter' => 5000,
        'banjar_id' => $banjarPemogan->id,
        'lat' => '-8.7000',
        'lng' => '115.2200',
        'district_code' => '517101',
        // Desa BERBEDA dari desa banjar di atas.
        'village_code' => '5171012006',
    ])->assertSessionHasErrors('banjar_id');

    expect(HydrantWarga::withoutGlobalScope('tenant')->count())->toBe(0);
});

// Desa yang menang adalah desa HASIL penyelarasan yurisdiksi, bukan yang dikirim form: untuk
// admin yang desanya terkunci, kode dari akunnya yang tersimpan. Memeriksa isi request akan
// memeriksa kode yang bahkan tak jadi dipakai — karena itu urutan di preparedData() mengikat.
it('checks the banjar against the village the account locks, not the one posted', function () {
    $adminDesa = User::factory()->create([
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ]);
    $adminDesa->assignRole('admin');

    $banjarPemogan = buatBanjar(['village_code' => '5171012008']);

    // Form menyebut desa banjar itu, tapi akunnya terkunci di Sesetan — yang tersimpan Sesetan.
    $this->actingAs($adminDesa)->post('/admin/hydrant-warga', [
        'name' => 'Tandon Terkunci',
        'address' => 'Jl. Uji',
        'status' => 'Belum Modifikasi',
        'type' => 'Tandon',
        'capacity_liter' => 3000,
        'banjar_id' => $banjarPemogan->id,
        'lat' => '-8.7000',
        'lng' => '115.2200',
        'village_code' => '5171012008',
    ])->assertSessionHasErrors('banjar_id');

    expect(HydrantWarga::withoutGlobalScope('tenant')->count())->toBe(0);
});

it('refuses a profile whose banjar belongs to another village', function () {
    $banjarPemogan = buatBanjar(['village_code' => '5171012008']);

    $warga = User::factory()->create(['phone' => null, 'village_code' => null]);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)->post('/complete-profile', [
        'phone' => '081234500000',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'banjar_id' => $banjarPemogan->id,
    ])->assertSessionHasErrors('banjar_id');

    expect($warga->refresh()->banjar_id)->toBeNull();
});

// Kewajiban banjar adalah SAKLAR yang default MATI. Menyalakannya sebelum master terisi
// mengunci pendaftaran warga — bentuk yang sama dengan #61 (migrasi tenants tanpa seeder).
it('keeps banjar optional on the profile form until the switch is turned on', function () {
    $warga = User::factory()->create(['phone' => null, 'village_code' => null]);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)->post('/complete-profile', [
        'phone' => '081234500000',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012008',
    ])->assertRedirect(route('dashboard'));

    expect($warga->refresh()->village_code)->toBe('5171012008');
});

it('demands a banjar on the profile form once the switch is on', function () {
    buatBanjar();
    Setting::setValue(Setting::KEY_REQUIRE_BANJAR, '1');

    $warga = User::factory()->create(['phone' => null, 'village_code' => null]);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)->post('/complete-profile', [
        'phone' => '081234500000',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012008',
    ])->assertSessionHasErrors('banjar_id');
});

it('refuses to switch the requirement on while the master list is empty', function () {
    $this->actingAs($this->admin)->post('/admin/banjars/require', ['require' => true])
        ->assertSessionHasErrors('require');

    expect(Setting::getValue(Setting::KEY_REQUIRE_BANJAR, '0'))->toBe('0');
});

it('scopes the banjar list to the admin own city', function () {
    buatBanjar(['name' => 'Banjar Denpasar']);
    buatBanjar([
        'name' => 'Banjar Badung',
        'city_code' => '5103',
        'district_code' => '510301',
        'village_code' => '5103012001',
    ]);

    $names = collect(
        $this->actingAs($this->admin)->get('/admin/banjars')->viewData('page')['props']['banjars']['data']
    )->pluck('name');

    expect($names)->toContain('Banjar Denpasar');
    expect($names)->not->toContain('Banjar Badung');
});

/** Tulis CSV sementara untuk diuji importirnya, lalu bersihkan sendiri. */
function csvBanjar(string $isi): string
{
    $path = tempnam(sys_get_temp_dir(), 'banjar').'.csv';
    file_put_contents($path, $isi);

    return $path;
}

// Berkas dari Pemkot/BPS menyebut NAMA desa, bukan kode, dan judul kolomnya berbahasa Indonesia.
// Importir yang hanya menerima 'village_code' akan menganggur.
it('imports banjar rows that name their village instead of coding it', function () {
    $path = csvBanjar('Nama Banjar,Kelurahan,Alamat
BANJAR TEGAL AGUNG,Pemogan,Jl. Tegal
');

    $this->artisan('sisupit:import-banjar', ['file' => $path, '--city' => '5171', '--apply' => true])
        ->assertSuccessful();

    $banjar = Banjar::withoutGlobalScope('tenant')->first();

    // Nama dari berkas instansi umumnya KAPITAL SEMUA; dibiarkan begitu ia akan berteriak di
    // setiap dropdown.
    expect($banjar->name)->toBe('Banjar Tegal Agung');
    expect($banjar->village_code)->toBe('5171012008');
    // Rantai wilayah diturunkan dari kode desa supaya Tenantable bisa menyaringnya.
    expect($banjar->city_code)->toBe('5171');

    unlink($path);
});

// Nama desa TIDAK unik se-Indonesia. Tanpa penyempit wilayah, "Kuta" (ada di Badung dan tujuh
// kabupaten lain) tak boleh diam-diam diambil salah satunya.
it('refuses an ambiguous village name and never guesses one', function () {
    // Rantai wilayahnya ikut dibuat: tabel indonesia_* saling ber-foreign key.
    DB::table('indonesia_provinces')->insert([['code' => '52', 'name' => 'Nusa Tenggara Barat']]);
    DB::table('indonesia_cities')->insert([['code' => '5202', 'province_code' => '52', 'name' => 'Lombok Tengah']]);
    DB::table('indonesia_districts')->insert([['code' => '520204', 'city_code' => '5202', 'name' => 'Pujut']]);
    DB::table('indonesia_villages')->insert([
        ['code' => '5202042009', 'district_code' => '520204', 'name' => 'Kuta'],
    ]);

    $path = csvBanjar('Nama Banjar,Kelurahan
BANJAR KUTA SATU,Kuta
');

    $this->artisan('sisupit:import-banjar', ['file' => $path, '--apply' => true])->assertSuccessful();

    expect(Banjar::withoutGlobalScope('tenant')->count())->toBe(0);

    unlink($path);
});

// --fuzzy hanya menerima beda ejaan VOKAL (Klod=Kelod), yang memang varian nyata nama Bali.
// Kriteria "jarak huruf" biasa akan menyulap Catur (desa Badung) jadi Sanur — dan data salah
// yang masuk lewat importir master tak akan pernah ketahuan.
it('accepts vowel spelling variants under --fuzzy but still refuses a different name', function () {
    DB::table('indonesia_villages')->insert([
        ['code' => '5171011001', 'district_code' => '517101', 'name' => 'Sanur'],
        ['code' => '5171012009', 'district_code' => '517101', 'name' => 'Pemecutan Kelod'],
    ]);

    $path = csvBanjar('Nama Banjar,Kelurahan
BANJAR SATU,PEMECUTAN KLOD
BANJAR DUA,CATUR
');

    $this->artisan('sisupit:import-banjar', [
        'file' => $path, '--city' => '5171', '--fuzzy' => true, '--apply' => true,
    ])->assertSuccessful();

    $tersimpan = Banjar::withoutGlobalScope('tenant')->get();

    expect($tersimpan)->toHaveCount(1);
    expect($tersimpan->first()->name)->toBe('Banjar Satu');
    expect($tersimpan->first()->village_code)->toBe('5171012009');

    unlink($path);
});

// ── Usulan banjar dari warga (permintaan user 2026-08-26) ──────────────────────────────────
// Master banjar tak akan pernah lengkap dari data resmi saja (DPMA hanya menerbitkan JUMLAH;
// panen situs desa cuma menutupi 32 dari 43 desa Denpasar), jadi warga boleh mengusulkan
// banjarnya sendiri. Usulan masuk ke tabel yang SAMA dengan status berbeda — lihat migrasi
// 2026_08_26_140000 untuk alasan kenapa bukan tabel terpisah.

it('lets a citizen propose a banjar that is missing from the master', function () {
    $warga = User::factory()->create(['province_code' => null, 'city_code' => null, 'village_code' => null]);
    $warga->assignRole('masyarakat');

    $res = $this->actingAs($warga)->postJson('/api/banjars', [
        'village_code' => '5171012008',
        'name' => 'Tegal Sari',
    ])->assertCreated();

    $banjar = Banjar::withoutGlobalScope('tenant')->firstWhere('name', 'Banjar Tegal Sari');

    expect($banjar)->not->toBeNull();
    expect($banjar->status)->toBe(Banjar::STATUS_USULAN);
    expect($banjar->created_by)->toBe($warga->id);
    // Rantai wilayah diturunkan dari kode desa, bukan dari isian pengguna.
    expect($banjar->district_code)->toBe('517101');
    expect($banjar->city_code)->toBe('5171');
    expect($banjar->province_code)->toBe('51');
    expect($res->json('banjar.id'))->toBe($banjar->id);
});

// Bentuk penulisan diseragamkan di titik masuk. Tanpa ini "Br. Tegal"/"banjar tegal"/"Tegal"
// jadi tiga baris untuk banjar yang sama — persis alasan tabel ini dibuat.
it('normalises whatever prefix the citizen types', function () {
    $warga = User::factory()->create(['village_code' => null]);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)->postJson('/api/banjars', [
        'village_code' => '5171012008',
        'name' => 'br. dukuh sari',
    ])->assertCreated();

    expect(Banjar::withoutGlobalScope('tenant')->first()->name)->toBe('Banjar dukuh sari');
});

it('returns the existing row instead of duplicating it when the name already exists', function () {
    $ada = buatBanjar(['name' => 'Banjar Tegal Sari', 'village_code' => '5171012008']);

    $warga = User::factory()->create(['village_code' => null]);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)->postJson('/api/banjars', [
        'village_code' => '5171012008',
        'name' => 'Banjar Tegal Sari',
    ])->assertOk()->assertJsonPath('banjar.id', $ada->id);

    expect(Banjar::withoutGlobalScope('tenant')->count())->toBe(1);
});

// Nama mirip DITAWARKAN, tidak digabungkan sendiri. Penggabungan otomatis sudah ditolak di
// importir karena mengusulkan CATUR → SANUR.
it('offers the near-duplicate instead of merging or creating silently', function () {
    $ada = buatBanjar(['name' => 'Banjar Kertha Dharma', 'village_code' => '5171012008']);

    $warga = User::factory()->create(['village_code' => null]);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)->postJson('/api/banjars', [
        'village_code' => '5171012008',
        'name' => 'Kerta Dharma',
    ])->assertStatus(409)->assertJsonPath('serupa.banjar.id', $ada->id);

    expect(Banjar::withoutGlobalScope('tenant')->count())->toBe(1);

    // Setelah melihat calonnya, pengguna tetap boleh memaksa — Tegal Kaja & Tegal Kelod nyata.
    $this->actingAs($warga)->postJson('/api/banjars', [
        'village_code' => '5171012008',
        'name' => 'Kerta Dharma',
        'paksa' => true,
    ])->assertCreated();

    expect(Banjar::withoutGlobalScope('tenant')->count())->toBe(2);
});

// Usulan tetap boleh dipilih di dropdown; menyembunyikannya membuat warga berikutnya di desa
// yang sama mengetik ulang nama yang sama dan melahirkan duplikat.
it('keeps proposed banjars selectable and marks their status', function () {
    buatBanjar(['name' => 'Banjar Resmi', 'village_code' => '5171012008']);
    buatBanjar(['name' => 'Banjar Usulan Warga', 'village_code' => '5171012008', 'status' => Banjar::STATUS_USULAN]);

    $rows = collect($this->getJson('/api/banjars/5171012008')->assertOk()->json());

    expect($rows)->toHaveCount(2);
    expect($rows->firstWhere('name', 'Banjar Usulan Warga')['status'])->toBe(Banjar::STATUS_USULAN);
});

// Menyetujui usulan MEMBALIK KOLOM, bukan memindahkan baris — inilah alasan usulan tidak
// ditaruh di tabel terpisah. Kalau id-nya berubah, setiap users.banjar_id & hydrant_wargas
// .banjar_id yang menunjuk ke sana jadi yatim tanpa gejala.
it('verifies a proposal without changing its id or orphaning what points at it', function () {
    $banjar = buatBanjar(['name' => 'Banjar Usulan', 'status' => Banjar::STATUS_USULAN]);

    $warga = User::factory()->create(['banjar_id' => $banjar->id, 'village_code' => '5171012008']);
    $warga->assignRole('masyarakat');

    $this->actingAs($this->admin)
        ->post(route('admin.banjars.verify', $banjar->id))
        ->assertRedirect();

    $banjar->refresh();

    expect($banjar->status)->toBe(Banjar::STATUS_TERVERIFIKASI);
    expect($banjar->id)->toBe($warga->refresh()->banjar_id);
});

it('filters the admin list down to pending proposals', function () {
    buatBanjar(['name' => 'Banjar Resmi']);
    buatBanjar(['name' => 'Banjar Usulan Satu', 'status' => Banjar::STATUS_USULAN]);

    $this->actingAs($this->admin)
        ->get('/admin/banjars?status=usulan')
        ->assertInertia(fn ($page) => $page
            ->where('jumlah_usulan', 1)
            ->has('banjars.data', 1)
            ->where('banjars.data.0.name', 'Banjar Usulan Satu'));
});

// T3 — banjar bisa diubah SETELAH profil lengkap. Sampai 2026-08-26 kolom ini hanya bisa diisi
// sekali di layar Lengkapi Profil: warga yang pindah banjar atau salah pilih tak punya jalan
// memperbaikinya, admin sekalipun.
it('lets a citizen change their banjar after the profile is complete', function () {
    $lama = buatBanjar(['name' => 'Banjar Lama', 'village_code' => '5171012008']);
    $baru = buatBanjar(['name' => 'Banjar Baru', 'village_code' => '5171012008']);

    $warga = User::factory()->create(['village_code' => '5171012008', 'banjar_id' => $lama->id]);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)
        ->patch(route('profile.banjar'), ['banjar_id' => $baru->id])
        ->assertRedirect(route('profile.edit'));

    expect($warga->refresh()->banjar_id)->toBe($baru->id);
});

// Desa TIDAK ikut dikirim: yang berlaku adalah desa yang sudah tersimpan di akun. Kalau tidak,
// layar yang niatnya cuma mengganti banjar jadi jalan memindahkan diri ke desa lain.
it('refuses a banjar from outside the village stored on the account', function () {
    $luar = buatBanjar(['name' => 'Banjar Sebelah', 'village_code' => '5171012006']);

    $warga = User::factory()->create(['village_code' => '5171012008', 'banjar_id' => null]);
    $warga->assignRole('masyarakat');

    $this->actingAs($warga)
        ->patch(route('profile.banjar'), ['banjar_id' => $luar->id])
        ->assertSessionHasErrors('banjar_id');

    expect($warga->refresh()->banjar_id)->toBeNull();
});

// Daftar hydrant warga menampilkan kembali banjar yang diisi di formnya. Kolom yang bisa diisi
// tapi tak pernah terlihat lagi akan dianggap tidak tersimpan, dan lama-lama berhenti diisi.
it('shows the banjar back on the citizen hydrant list', function () {
    $banjar = buatBanjar(['name' => 'Banjar Tegal Agung']);

    HydrantWarga::withoutGlobalScope('tenant')->create([
        'name' => 'Tandon Uji', 'address' => 'Jl. Uji',
        'status' => 'Belum Modifikasi', 'type' => 'Tandon', 'capacity_liter' => 1000,
        'lat' => -8.71, 'lng' => 115.19, 'banjar_id' => $banjar->id,
        'province_code' => '51', 'city_code' => '5171',
        'district_code' => '517101', 'village_code' => '5171012008',
    ]);

    $this->actingAs($this->admin)
        ->get('/admin/hydrant-warga')
        ->assertInertia(fn ($page) => $page->where('hydrants.data.0.banjar.name', 'Banjar Tegal Agung'));
});

// T2 — kelengkapan ditampilkan sebagai INFORMASI, bukan syarat. Penjaga server tetap sekadar
// "master tak boleh kosong": sejak warga bisa mengusulkan banjarnya sendiri, desa yang masternya
// kosong bukan lagi jalan buntu, dan menuntut kelengkapan 100% berarti kewajiban itu tak akan
// pernah bisa dinyalakan.
it('reports village coverage next to the requirement switch', function () {
    buatBanjar(['name' => 'Banjar Satu', 'village_code' => '5171012008']);
    buatBanjar(['name' => 'Banjar Dua', 'village_code' => '5171012008']);

    $this->actingAs($this->admin)
        ->get('/admin/banjars')
        ->assertInertia(fn ($page) => $page
            ->where('cakupan.terisi', 1)   // dua banjar, tapi satu desa
            ->where('cakupan.total', 2));  // dua desa Denpasar di beforeEach
});

it('still allows switching the requirement on while some villages have no banjar yet', function () {
    buatBanjar(['name' => 'Banjar Satu', 'village_code' => '5171012008']);

    $this->actingAs($this->admin)
        ->post(route('admin.banjars.require'), ['require' => true])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Setting::getValue(Setting::KEY_REQUIRE_BANJAR))->toBe('1');
});

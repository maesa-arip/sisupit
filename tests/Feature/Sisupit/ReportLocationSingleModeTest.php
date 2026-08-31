<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

// Permintaan user 2026-09-01: form lapor punya SATU cara menetapkan lokasi. Sakelar
// "Pilih manual / Ikuti pin peta" (TASK_28) dicabut, dan kotak cari + keempat dropdown
// wilayah + panel alamat otomatis yang dulu hanya untuk Pusat Komando kini tampil untuk
// SEMUA pelapor.
//
// Yang dijaga di sini bukan selera tata letak, melainkan dua sifat yang kalau hilang tidak
// menimbulkan galat apa pun:
//
//  1. Selama dua mode itu ada, mode 'manual' MEMBLOKIR penulisan kode wilayah dari pin —
//     pin dan dropdown bisa menunjuk dua tempat berbeda dan tak ada satu pun tanda di layar.
//  2. `ReportRequest` mewajibkan `village_code` untuk SETIAP laporan baru tanpa membedakan
//     peran, sementara pencocokan nama OSM ke tabel wilayah kerap berhenti di kecamatan.
//     Selama dropdownnya disembunyikan dari warga, warga yang mengalami itu ditolak server
//     pada field yang tak pernah dirender — galat tanpa tempat berpijak.
//
// Sifat pertama & ketiga hidup di BERKAS SUMBER React (Pest tidak merender komponen), pola
// yang sama dengan MobileNavParityTest.
$form = fn () => file_get_contents(resource_path('js/Pages/Front/Reports/Create.jsx'));

it('keeps one location mode in the report form', function () use ($form) {
    $source = $form();

    // Sengaja IDENTIFIER, bukan label tombolnya ("Pilih manual" / "Ikuti pin peta"):
    // label itu masih dikutip di komentar yang menerangkan kenapa sakelarnya dibuang, dan
    // penjaga yang melarang PROSA akan memaksa sesi berikutnya menghapus keterangan itu
    // demi menghijaukan test. Yang dilarang di sini adalah kodenya yang hidup lagi.
    foreach (['regionMode', 'setRegionMode', 'regionModeRef', 'useMapPinRegion'] as $sisaSakelar) {
        expect($source)->not->toContain($sisaSakelar);
    }
});

it('offers the region correction fields to every reporter, not only the command center', function () use ($form) {
    $source = $form();

    // `region_picker` tetap dikirim server, tapi hanya sebagai NILAI AWAL. Begitu ia kembali
    // jadi gerbang tampil, warga kehilangan lagi satu-satunya cara membetulkan desanya.
    expect($source)->not->toContain('hasRegionPicker');
});

it('demands a village on screen for every reporter, matching what the server enforces', function () use ($form) {
    // Penjaga di layar tidak boleh bersyarat peran/prop lagi. Kalau syaratnya kembali,
    // pasangannya di server (test berikutnya) tetap menolak — dan penolakan itu mendarat
    // di field tersembunyi.
    expect($form())->toContain("if (data._method === 'POST' && !data.village_code) {");
});

it('rejects a citizen report that has no village code', function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $warga = User::factory()->create(['village_code' => '5171012006']);
    $warga->assignRole('masyarakat');

    // Persis keadaan yang bikin fitur ini perlu: titik & wilayah atas terisi dari pin, tapi
    // pencocokan nama OSM berhenti di kecamatan sehingga desanya kosong.
    $this->actingAs($warga)->post('/reports/create', [
        'title' => 'Kebakaran Rumah',
        'incident_type' => 'rumah',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'lat' => '-8.712345',
        'lng' => '115.213456',
    ])->assertSessionHasErrors('village_code');
});

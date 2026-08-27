<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

// TASK_49 (A). `reports.address` dulu memikul DUA makna sekaligus: patokan yang DIKETIK
// warga saat lapor, dan alamat MESIN hasil reverse-geocode yang ditulis correctLocation()
// di atasnya. Karena itu panel "Alamat Presisi" di halaman detail adalah sebuah KLAIM yang
// tak dijamin siapa pun — bisa kalimat manusia yang menunjuk tempat lain dari pinnya, bisa
// kosong, bisa alamat mesin, dan mana yang berlaku tak bisa dibedakan dari datanya.
//
// Kolom `geo_address` memisahkan keduanya: mesin menulis ke sana, manusia tetap memegang
// `address`. Test di berkas ini menjaga pemisahan itu tidak menyatu lagi.

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
});

it('stores the machine address alongside the landmark the citizen typed', function () {
    Notification::fake();

    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $this->actingAs($citizen)->post('/reports/create', [
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Sebelah warung Bu Made, gang buntu',
        'geo_address' => 'Jalan Pemogan, Pemogan, Denpasar Selatan, Kota Denpasar, Bali',
    ]);

    $report = Report::withoutGlobalScopes()->first();

    // Dua kolom, dua makna — patokan manusia TIDAK dipindah ke kolom mesin dan sebaliknya.
    expect($report->address)->toBe('Sebelah warung Bu Made, gang buntu');
    expect($report->geo_address)->toBe('Jalan Pemogan, Pemogan, Denpasar Selatan, Kota Denpasar, Bali');
});

it('keeps the citizen landmark intact when a responder corrects the incident pin', function () {
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $report = Report::create([
        'user_id' => $citizen->id,
        'title' => 'Kebakaran gudang',
        'address' => 'Sebelah warung Bu Made, gang buntu',
        'geo_address' => 'Jalan Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'handling',
        'village_code' => '5171012006',
    ]);

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    // Koreksi pin hanya boleh oleh responder yang sudah TIBA (aturan lama, tidak diubah).
    DB::table('report_officers')->insert([
        'report_id' => $report->id,
        'user_id' => $petugas->id,
        'status' => 'arrived',
        'dispatched_at' => now(),
        'arrived_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($petugas)->post("/reports/{$report->id}/correct-location", [
        'lat' => '-8.6510',
        'lng' => '115.2210',
        'geo_address' => 'Jalan Pemogan No. 42',
    ]);

    $report->refresh();

    // Titik & alamat mesin ikut pindah...
    expect($report->lat)->toBe('-8.6510');
    expect($report->geo_address)->toBe('Jalan Pemogan No. 42');
    // ...tapi kalimat yang diketik warga TETAP. Dulu baris inilah yang hilang tanpa jejak.
    expect($report->address)->toBe('Sebelah warung Bu Made, gang buntu');
});

it('sends both addresses to the incident detail screen', function () {
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $report = Report::create([
        'user_id' => $citizen->id,
        'title' => 'Kebakaran lapak',
        'address' => 'Depan pura, seberang lapangan',
        'geo_address' => 'Jalan Raya Sesetan, Sesetan, Denpasar Selatan',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
        'village_code' => '5171012006',
    ]);

    $this->actingAs($citizen)
        ->get("/reports/show/{$report->id}")
        ->assertInertia(fn ($page) => $page
            ->where('report.address', 'Depan pura, seberang lapangan')
            ->where('report.geo_address', 'Jalan Raya Sesetan, Sesetan, Denpasar Selatan')
        );
});

it('accepts a report that has a pin but no landmark typed at all', function () {
    Notification::fake();

    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    // Kebakaran = darurat-first: patokan OPSIONAL (ReportRequest). Justru laporan seperti
    // inilah yang dulu memunculkan panel "Alamat Presisi" KOSONG padahal titiknya diketahui
    // persis — dan itu yang diperbaiki geo_address.
    $this->actingAs($citizen)->post('/reports/create', [
        'title' => 'Kebakaran cepat',
        'incident_type' => 'rumah',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'geo_address' => 'Jalan Pemogan, Pemogan, Denpasar Selatan',
    ]);

    $report = Report::withoutGlobalScopes()->first();

    expect($report)->not->toBeNull();
    expect($report->address)->toBeNull();
    expect($report->geo_address)->toBe('Jalan Pemogan, Pemogan, Denpasar Selatan');
});

it('summarises a location from the machine address first and the landmark as fallback', function () {
    // SATU aturan untuk kesembilan layar yang meringkas laporan jadi satu baris "di mana".
    // Tanpa ini, kolom `address` yang berhenti ditimpa alamat mesin akan membuat sebagian
    // daftar menampilkan baris KOSONG untuk laporan kebakaran (patokan memang opsional di
    // sana) — tanpa galat, tanpa gejala.
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $berdua = Report::create([
        'user_id' => $citizen->id, 'title' => 'A', 'status' => 'pending', 'village_code' => '5171012006',
        'address' => 'Gang buntu sebelah warung', 'geo_address' => 'Jalan Pemogan No. 1',
    ]);
    $tanpaPatokan = Report::create([
        'user_id' => $citizen->id, 'title' => 'B', 'status' => 'pending', 'village_code' => '5171012006',
        'geo_address' => 'Jalan Pemogan No. 2',
    ]);
    $lawas = Report::create([
        'user_id' => $citizen->id, 'title' => 'C', 'status' => 'pending', 'village_code' => '5171012006',
        'address' => 'Depan pura',
    ]);

    expect($berdua->alamatTampil())->toBe('Jalan Pemogan No. 1');
    expect($tanpaPatokan->alamatTampil())->toBe('Jalan Pemogan No. 2');
    // Laporan sebelum TASK_49: tak punya alamat mesin sama sekali, jadi patokan yang tampil.
    expect($lawas->alamatTampil())->toBe('Depan pura');
});

it('keeps the client-side twin of that rule in step with the server', function () {
    // Aturan yang sama harus ditulis dua kali karena melintasi batas bahasa (pola
    // facilityStatusLabel). Yang dijaga: kembarannya ADA dan urutan cadangannya sama —
    // dua urutan yang berbeda akan membuat daftar & halaman detail menyebut tempat berbeda
    // untuk satu laporan yang sama.
    $utils = file_get_contents(resource_path('js/lib/utils.js'));

    expect($utils)->toContain('export function alamatLaporan(');
    expect($utils)->toContain('report?.geo_address || report?.address');
});

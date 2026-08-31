<?php

use App\Events\IncidentLocationCorrected;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

// TASK_52 / FINDINGS #104. Sebelum ini `reports` menyimpan lat/lng tanpa satu pun keterangan
// dari mana titik itu datang, sehingga di halaman detail pin hasil fix GPS presisi ±10 m dan
// pin yang digeser 8 km oleh pelapor yang sedang di rumah TERLIHAT PERSIS SAMA — keduanya
// menawarkan tombol "Navigasi ke Lokasi" yang sama tegasnya, dan petugas berangkat ke tempat
// yang salah tanpa satu pun gejala.
//
// Yang dijaga berkas ini: (1) sumbernya diturunkan dari BUKTI di server, bukan dari klaim
// klien; (2) koordinat pelapor tidak pernah ikut tersimpan; (3) tak satu pun bagian fitur ini
// bisa menggagalkan sebuah laporan darurat; (4) koreksi pin oleh responder di TKP menimpa
// asal-usul lama, tidak meninggalkan angka basi; (5) kamus di layar tidak menyimpang dari
// kamus di server DAN tidak bercadangan diam-diam ke nilai yang lain.

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
});

/** Pelapor warga + isian laporan minimal yang sah (kebakaran = darurat-first). */
function laporanDasar(array $extra = []): array
{
    return array_merge([
        'title' => 'Kebakaran rumah warga',
        'incident_type' => 'rumah',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
    ], $extra);
}

function wargaPelapor(): User
{
    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    return $citizen;
}

it('records the point as coming from the reporter GPS when the pin is where they stand', function () {
    Notification::fake();

    $this->actingAs(wargaPelapor())->post('/reports/create', laporanDasar([
        // ~15 meter dari pin — pelapor benar-benar berada di sana.
        'reporter_lat' => '-8.6501',
        'reporter_lng' => '115.2201',
        'gps_accuracy_m' => '12',
    ]));

    $report = Report::withoutGlobalScopes()->first();

    expect($report->location_source)->toBe('gps_pelapor');
    expect($report->reporter_distance_m)->toBeLessThanOrEqual(Report::JARAK_PELAPOR_MAKS_M);
    expect($report->location_accuracy_m)->toBe(12);
});

it('marks the point as manually placed when the reporter is far from the pin', function () {
    Notification::fake();

    $this->actingAs(wargaPelapor())->post('/reports/create', laporanDasar([
        // 0,03 derajat lintang ≈ 3,3 km — pelapor jelas tidak berada di titik yang ditandainya.
        'reporter_lat' => '-8.6800',
        'reporter_lng' => '115.2200',
        'gps_accuracy_m' => '18',
    ]));

    $report = Report::withoutGlobalScopes()->first();

    expect($report->location_source)->toBe('ditandai_manual');
    expect($report->reporter_distance_m)->toBeGreaterThan(3000);
});

it('still accepts a report when the reporter position is unknown', function () {
    Notification::fake();

    // Izin lokasi ditolak, GPS gagal, atau klien lama yang memang tak mengirimnya. Laporan
    // darurat TIDAK boleh gagal karenanya — yang terjadi hanya titiknya tak punya pembanding.
    $this->actingAs(wargaPelapor())->post('/reports/create', laporanDasar());

    $report = Report::withoutGlobalScopes()->first();

    expect($report)->not->toBeNull();
    expect($report->location_source)->toBe('tanpa_referensi');
    expect($report->reporter_distance_m)->toBeNull();
    expect($report->location_accuracy_m)->toBeNull();
});

it('never stores the reporter own coordinates, only the distance', function () {
    Notification::fake();

    $this->actingAs(wargaPelapor())->post('/reports/create', laporanDasar([
        'reporter_lat' => '-8.6800',
        'reporter_lng' => '115.2900',
        'gps_accuracy_m' => '20',
    ]));

    // Keputusan privasi user 2026-08-31: posisi pelapor adalah PII baru (ia bisa sedang di
    // rumahnya sendiri) dan hanya dipakai sekali untuk menghitung jarak. Diadu dengan SELURUH
    // isi barisnya, bukan dengan daftar kolom yang harus diingat-ingat saat skema bertambah.
    $row = (array) DB::table('reports')->first();

    expect(json_encode($row))->not->toContain('115.2900');
    expect(json_encode($row))->not->toContain('-8.6800');
    expect($row['reporter_distance_m'])->toBeGreaterThan(0);
});

it('hands the point over to the responder who corrects it at the scene', function () {
    config(['broadcasting.default' => 'log']);
    Event::fake([IncidentLocationCorrected::class]);

    $citizen = wargaPelapor();

    $report = Report::create([
        'user_id' => $citizen->id,
        'title' => 'Kebakaran gudang',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'handling',
        'village_code' => '5171012006',
        'location_source' => 'ditandai_manual',
        'reporter_distance_m' => 3340,
        'location_accuracy_m' => 18,
    ]);

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

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
    ]);

    $report->refresh();

    expect($report->location_source)->toBe('dikoreksi_petugas');
    // Jarak & akurasi lama menerangkan titik yang sudah tidak ada lagi. Angka basi lebih
    // menyesatkan daripada kolom kosong — lencana "±3,3 km dari pelapor" yang menempel pada
    // pin hasil koreksi responder yang BERDIRI DI TKP persis bentuk #95.
    expect($report->reporter_distance_m)->toBeNull();
    expect($report->location_accuracy_m)->toBeNull();

    // Payloadnya membawa sumber baru supaya lencana di layar yang sedang terbuka ikut berubah
    // tanpa muat ulang; tanpa ini penerima siaran melihat pin baru berlabel jarak yang lama.
    Event::assertDispatched(
        IncidentLocationCorrected::class,
        fn ($event) => $event->locationSource === 'dikoreksi_petugas'
    );
});

it('keeps the on-screen location dictionary in step with the server', function () {
    // Kamus lawan kamus memang tak membuktikan banyak (pelajaran #79), tapi di sini justru
    // ITU pertanyaannya: nilai yang ditulis server harus punya kalimatnya sendiri di layar.
    // Nilai tanpa entri akan jatuh ke cadangan dan berbunyi "tidak tercatat" untuk laporan
    // yang sebenarnya tercatat rapi — tanpa galat di mana pun.
    $utils = kamusLokasiKlien();

    foreach (Report::LOCATION_SOURCES as $source) {
        expect($utils)->toContain($source.':');
    }
});

it('refuses to let an unrecognised source claim to be a verified point', function () {
    $utils = kamusLokasiKlien();

    // Cadangan sebuah kamus adalah KLAIM, bukan "tidak dikenal": bentuk `|| STATUS_META.pending`
    // membuat laporan yang sudah DITOLAK berlencana kuning "Laporan Terverifikasi" (#94), dan
    // cabang terakhir sebuah tangga `if` membuat akun pejabat berbunyi "Anggota Masyarakat"
    // di profilnya sendiri (#90). Di sini taruhannya lebih tinggi lagi: titik yang tak
    // diketahui asalnya akan mengaku sudah terverifikasi dari GPS pelapor.
    expect($utils)->toContain('?? ASAL_TITIK_TIDAK_TERCATAT');
    expect($utils)->not->toContain('?? LOCATION_SOURCE_META.gps_pelapor');
    expect($utils)->not->toContain('|| LOCATION_SOURCE_META.gps_pelapor');
});

/**
 * `resources/js/lib/utils.js` memuat byte NUL mentah di dalam regex AKSARA_TAK_TERBACA
 * (FINDINGS #93), sehingga perkakas teks memperlakukannya sebagai berkas biner. Dibaca
 * mentah lalu byte itu dibuang supaya pencocokan di bawah tetap bekerja.
 */
function kamusLokasiKlien(): string
{
    $isi = file_get_contents(resource_path('js/lib/utils.js'));

    return str_replace("\0", '', $isi);
}

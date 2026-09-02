<?php

use App\Models\Agency;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * `sisupit:demo-incident` — melengkapi satu laporan jadi contoh peragaan yang utuh.
 *
 * Yang dijaga di sini adalah hal-hal yang membuat sebuah contoh peragaan JUSTRU menyesatkan
 * kalau salah: responder yang masuk ke tabel peran yang keliru, keadaan responder yang
 * bertentangan dengan status laporannya (laporan selesai tapi ada yang "masih di jalan"),
 * dan jejak peta yang menumpuk tiap kali perintahnya diulang.
 *
 * OSRM sengaja dipalsukan: perintahnya memang jatuh ke garis lurus saat OSRM tak terjangkau,
 * dan test tidak boleh menyentuh jaringan.
 */
beforeEach(function () {
    Http::fake(['*' => Http::response([], 500)]);

    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012008', 'district_code' => '517101', 'name' => 'Pemogan']);

    $this->pelapor = User::factory()->create(['city_code' => '5171']);
    $this->pelapor->assignRole('warga');

    $this->petugas = User::factory()->create(['name' => 'Petugas Uji', 'city_code' => '5171']);
    $this->petugas->assignRole('petugas');

    $this->relawan = User::factory()->create(['name' => 'Relawan Uji', 'city_code' => '5171']);
    $this->relawan->assignRole('relawan');
});

function laporanDemo(array $atribut = []): Report
{
    return Report::create([
        'user_id' => test()->pelapor->id,
        'name' => 'Pelapor Uji',
        'phone' => '08123456789',
        'title' => 'Kebakaran rumah warga',
        'incident_type' => 'rumah',
        'description' => 'Api dari dapur.',
        'address' => 'Jl. Uji Coba',
        'lat' => '-8.7137',
        'lng' => '115.1968',
        'status' => 'handling',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012008',
        ...$atribut,
    ]);
}

it('puts each responder in the table that matches their role', function () {
    $report = laporanDemo();

    $this->artisan("sisupit:demo-incident {$report->id} --officers={$this->petugas->id} --volunteers={$this->relawan->id}")
        ->assertSuccessful();

    expect(DB::table('report_officers')->where('report_id', $report->id)->pluck('user_id')->all())
        ->toBe([$this->petugas->id]);
    expect(DB::table('report_helpers')->where('report_id', $report->id)->pluck('user_id')->all())
        ->toBe([$this->relawan->id]);
});

it('refuses a volunteer id passed as an officer', function () {
    // Relawan yang menyelinap ke report_officers akan tampil sebagai petugas di seluruh UI
    // tanpa ada satu pun lapisan yang menolaknya.
    $report = laporanDemo();

    $this->artisan("sisupit:demo-incident {$report->id} --officers={$this->relawan->id}")->assertFailed();

    expect(DB::table('report_officers')->count())->toBe(0);
});

it('records a map trail for every responder', function () {
    $report = laporanDemo();

    $this->artisan("sisupit:demo-incident {$report->id} --officers={$this->petugas->id} --volunteers={$this->relawan->id}")
        ->assertSuccessful();

    $jejak = DB::table('tracking_logs')->where('report_id', $report->id)->get();

    expect($jejak->where('user_type', 'petugas')->count())->toBeGreaterThan(1);
    expect($jejak->where('user_type', 'relawan')->count())->toBeGreaterThan(1);
});

it('does not stack duplicate trails when run again', function () {
    $report = laporanDemo();
    $perintah = "sisupit:demo-incident {$report->id} --officers={$this->petugas->id}";

    $this->artisan($perintah)->assertSuccessful();
    $pertama = DB::table('tracking_logs')->where('report_id', $report->id)->count();

    $this->artisan($perintah)->assertSuccessful();

    expect(DB::table('tracking_logs')->where('report_id', $report->id)->count())->toBe($pertama);
    expect(DB::table('report_officers')->where('report_id', $report->id)->count())->toBe(1);
});

it('leaves nobody still on the road once the incident is resolved', function () {
    // Contoh peragaan yang isinya bertentangan dengan statusnya sendiri lebih buruk daripada
    // tidak ada contoh sama sekali.
    $report = laporanDemo(['status' => 'resolved']);

    $this->artisan("sisupit:demo-incident {$report->id} --officers={$this->petugas->id} --volunteers={$this->relawan->id}")
        ->assertSuccessful();

    expect(DB::table('report_officers')->where('report_id', $report->id)->value('status'))->toBe('finished');
    expect(DB::table('report_helpers')->where('report_id', $report->id)->value('status'))->toBe('finished');
    expect(DB::table('report_officers')->where('report_id', $report->id)->value('finished_at'))->not->toBeNull();
});

it('refuses responders on a report nobody is handling yet', function () {
    $report = laporanDemo(['status' => 'TERLAPOR']);

    $this->artisan("sisupit:demo-incident {$report->id} --officers={$this->petugas->id}")->assertFailed();

    expect(DB::table('report_officers')->count())->toBe(0);
});

it('attaches the agencies of the report city, with or without confirmation', function () {
    $report = laporanDemo();

    Agency::create([
        'code' => 'PLN',
        'name' => 'PLN UP3 Uji',
        'requires_confirmation' => true,
        'confirmation_label' => 'Listrik sudah dipadamkan',
        'is_active' => true,
        'city_code' => '5171',
    ]);

    $this->artisan("sisupit:demo-incident {$report->id} --agencies=notified")->assertSuccessful();
    $baris = DB::table('report_agencies')->where('report_id', $report->id)->first();
    expect($baris->status)->toBe('notified');
    expect($baris->confirmed_at)->toBeNull();

    $this->artisan("sisupit:demo-incident {$report->id} --agencies=confirmed")->assertSuccessful();
    $baris = DB::table('report_agencies')->where('report_id', $report->id)->first();
    expect($baris->status)->toBe('responded');
    expect($baris->confirmed_at)->not->toBeNull();
    expect(DB::table('report_agencies')->where('report_id', $report->id)->count())->toBe(1);
});

it('writes a final berita acara only for a resolved report', function () {
    $handling = laporanDemo();

    $this->artisan("sisupit:demo-incident {$handling->id} --resolution")->assertFailed();
    expect(DB::table('report_resolutions')->count())->toBe(0);

    $selesai = laporanDemo(['status' => 'resolved']);

    $this->artisan("sisupit:demo-incident {$selesai->id} --officers={$this->petugas->id} --resolution")
        ->assertSuccessful();

    $ba = DB::table('report_resolutions')->where('report_id', $selesai->id)->first();
    expect($ba->status)->toBe('final');
    expect($ba->tim_atensi)->toContain('Petugas Uji');
    expect($ba->kelurahan)->toBe('Pemogan');
});

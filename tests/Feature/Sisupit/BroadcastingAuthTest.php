<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// FINDINGS #55 — routes/channels.php tidak pernah dimuat sehingga POST /broadcasting/auth
// tidak ada (404) dan SEMUA channel privat mati diam-diam. Test ini menjaga dua hal:
// endpointnya terdaftar, DAN callback otorisasi di routes/channels.php benar-benar dipakai.
beforeEach(function () {
    // Driver 'log' (dipakai .env.testing) punya auth() kosong sehingga callback channel tak
    // pernah dievaluasi — pakai driver reverb dengan kredensial dummy agar otorisasi sungguhan
    // yang diuji. socketAuth() hanya menghitung HMAC lokal, tidak ada koneksi keluar.
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'test-secret',
        'broadcasting.connections.reverb.app_id' => 'test-app',
    ]);

    // Broadcast::channel() menempel pada driver yang aktif SAAT pendaftaran
    // (BroadcastManager::__call → driver()), jadi callback yang dimuat waktu boot
    // menempel di driver 'log'. Daftarkan ulang ke driver reverb yang baru dipilih —
    // file yang di-require di sini persis file yang didaftarkan bootstrap/app.php.
    require base_path('routes/channels.php');

    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('warga');

    $this->reporter = $reporter;
    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
        'village_code' => '5171012006',
        'district_code' => '5171010',
        'city_code' => '5171',
        'province_code' => '51',
    ]);
});

it('registers the broadcasting auth endpoint', function () {
    expect(collect(app('router')->getRoutes())->contains(
        fn ($route) => $route->uri() === 'broadcasting/auth'
    ))->toBeTrue();
});

it('authorizes a user for their own private notification channel', function () {
    $this->actingAs($this->reporter)
        ->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-App.Models.User.'.$this->reporter->id,
        ])
        ->assertOk();
});

it('rejects a user subscribing to someone else notification channel', function () {
    $penyusup = User::factory()->create(['village_code' => '5171012006']);
    $penyusup->assignRole('warga');

    $this->actingAs($penyusup)
        ->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-App.Models.User.'.$this->reporter->id,
        ])
        ->assertForbidden();
});

it('authorizes the reporter and in-region staff on the report tracking channel', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    foreach ([$this->reporter, $petugas] as $user) {
        $this->actingAs($user)
            ->post('/broadcasting/auth', [
                'socket_id' => '1234.5678',
                'channel_name' => 'private-report-tracking.'.$this->report->id,
            ])
            ->assertOk();
    }
});

// #31 — staf di luar wilayah laporan tidak boleh menyadap GPS/PII insiden lewat channel.
it('rejects staff from another region on the report tracking channel', function () {
    $petugasLuar = User::factory()->create(['village_code' => '3171012001']);
    $petugasLuar->assignRole('petugas');

    $this->actingAs($petugasLuar)
        ->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-report-tracking.'.$this->report->id,
        ])
        ->assertForbidden();
});

// Relawan yang mengambil tugas di laporan ini berhak memantau, sekalipun beda desa (#42:
// keanggotaan, bukan wilayah). Menjaga agar global scope Tenantable tidak diam-diam
// menutup channel bagi responder lintas desa.
it('authorizes a volunteer registered on the report', function () {
    $relawan = User::factory()->create(['village_code' => '3171012001']);
    $relawan->assignRole('relawan');

    DB::table('report_helpers')->insert([
        'report_id' => $this->report->id,
        'user_id' => $relawan->id,
    ]);

    $this->actingAs($relawan)
        ->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-report-tracking.'.$this->report->id,
        ])
        ->assertOk();
});

// Pejabat sudah boleh MEMBUKA halaman detail insiden di wilayahnya sejak #41, tapi tak pernah
// diizinkan masuk channel-nya — halamannya terbuka sementara badge status & marker responder
// diam, tanpa gejala lain. Gerbangnya kini persis sama dengan gerbang halaman: peran + wilayah.
it('authorizes a pejabat in the report region on the tracking channel', function () {
    $pejabat = User::factory()->create(['city_code' => '5171']);
    $pejabat->assignRole('pejabat');

    $this->actingAs($pejabat)
        ->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-report-tracking.'.$this->report->id,
        ])
        ->assertOk();
});

it('rejects a pejabat from another region on the tracking channel', function () {
    $pejabatLuar = User::factory()->create(['city_code' => '3171']);
    $pejabatLuar->assignRole('pejabat');

    $this->actingAs($pejabatLuar)
        ->post('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-report-tracking.'.$this->report->id,
        ])
        ->assertForbidden();
});

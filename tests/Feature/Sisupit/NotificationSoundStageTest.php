<?php

use App\Models\Report;
use App\Models\User;
use App\Notifications\AgencyConfirmationNotification;
use App\Notifications\AgencyDispatchNotification;
use App\Notifications\EmergencyAlertNotification;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Suara notifikasi bertingkat (TASK_50).
 *
 * Yang dijaga di sini BUKAN "nada mana yang dipakai" — berkas suaranya hidup di wrapper
 * Android & aplikasi desktop, di luar repo ini. Yang dijaga adalah SATU-SATUNYA hal yang
 * dipegang server: penanda tahap harus benar-benar SAMPAI ke klien, di kedua jalur yang
 * berbeda, dan kedua tahap harus bisa dibedakan tanpa mendengar apa pun.
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $this->reporter = User::factory()->create(['village_code' => '5171012006']);
    $this->reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
    ]);
});

it('marks a freshly filed citizen report as the triage stage, not as a dispatch', function () {
    // Lewat endpoint sungguhan, bukan dengan menyusun notifikasinya sendiri: yang mudah salah
    // justru PEMANGGILNYA — kelasnya sama persis dengan yang dipakai saat broadcast, jadi
    // sebuah `new EmergencyAlertNotification($report, 'petugas')` yang lupa menyebut tahap
    // akan lolos tanpa gejala apa pun dan memutar sirine untuk laporan yang belum diverifikasi.
    Notification::fake();

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($this->reporter)->post('/reports/create', [
        'title' => 'Kebakaran gudang',
        'description' => 'Asap tebal dari gudang',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Jl. Pemogan No. 9',
    ])->assertRedirect();

    Notification::assertSentTo($petugas, EmergencyAlertNotification::class, function ($notification) use ($petugas) {
        return $notification->stage === EmergencyAlertNotification::STAGE_REPORT_INCOMING
            && $notification->toArray($petugas)['alert_stage'] === 'report_incoming';
    });
});

it('marks the post-verification broadcast as the dispatch stage', function () {
    Notification::fake();

    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($admin)->post(route('reports.approve', $this->report->id))->assertRedirect();

    Notification::assertSentTo($petugas, EmergencyAlertNotification::class, function ($notification) use ($petugas) {
        return $notification->stage === EmergencyAlertNotification::STAGE_DISPATCH
            && $notification->toArray($petugas)['alert_stage'] === 'dispatch';
    });
});

it('says something different in each stage, so the two are told apart without any sound', function () {
    // Notifikasi yang sudah menyingkir ke Pusat Tindakan Windows / laci notifikasi Android
    // tidak lagi berbunyi — di sana yang tersisa hanya teksnya. Suara yang dibedakan tapi
    // kalimatnya kembar tidak menyelesaikan masalah yang dilaporkan user.
    $masuk = (new EmergencyAlertNotification($this->report, 'petugas', EmergencyAlertNotification::STAGE_REPORT_INCOMING))
        ->toFcm($this->reporter)->toArray();
    $siaran = (new EmergencyAlertNotification($this->report, 'petugas', EmergencyAlertNotification::STAGE_DISPATCH))
        ->toFcm($this->reporter)->toArray();

    expect($masuk['data']['title'])->not->toBe($siaran['data']['title'])
        ->and($masuk['data']['alert_stage'])->toBe('report_incoming')
        ->and($siaran['data']['alert_stage'])->toBe('dispatch');

    // Tahap masuk TIDAK BOLEH mengklaim "DARURAT KEBAKARAN" — laporannya belum diverifikasi
    // siapa pun (SOP anti-hoax di ReportController::store).
    expect($masuk['data']['title'])->not->toContain('DARURAT');

    // iOS memilih berkas suaranya dari payload, jadi pembedaannya harus terlihat di sini juga.
    expect($masuk['apns']['payload']['aps']['sound'])
        ->not->toBe($siaran['apns']['payload']['aps']['sound']);
});

it('lets the stage survive the broadcast payload that the desktop app actually receives', function () {
    // PENJAGA TERPENTING di berkas ini. Aplikasi desktop (.exe) tidak memakai FCM sama sekali;
    // ia menerima payload hasil BroadcastNotificationCreated::broadcastWith(), yang melakukan
    // array_merge(data, ['type' => nama kelas]). Artinya kunci `type` apa pun yang ditulis di
    // toArray() DITIMPA di jalur ini — Android akan melihat nilai kita (payload FCM tak lewat
    // sini) sementara .exe tidak, tanpa galat di mana pun.
    //
    // Karena itu yang diadu di sini adalah payload SIARAN yang sungguhan, bukan toArray():
    // test yang cuma mengadu kode dengan kode tidak menjaga apa pun (pelajaran #79).
    $notification = new EmergencyAlertNotification($this->report, 'petugas', EmergencyAlertNotification::STAGE_REPORT_INCOMING);
    $notification->id = 'uji-tahap';

    $payload = (new BroadcastNotificationCreated(
        $this->reporter,
        $notification,
        $notification->toArray($this->reporter)
    ))->broadcastWith();

    expect($payload['alert_stage'])->toBe('report_incoming');

    // Dan inilah buktinya kenapa penandanya tidak boleh bernama `type`: kunci itu memang
    // sudah dipakai Laravel untuk nama kelas. Kalau suatu saat baris ini gagal, berarti
    // asumsi di atas berubah — periksa ulang sebelum memindahkan penandanya.
    expect($payload['type'])->toBe(EmergencyAlertNotification::class);
});

it('delivers the OPD notifications to the desktop app as well, not only to phones', function () {
    // Konfirmasi "listrik sudah dipadamkan" adalah kabar yang paling ditunggu Pusat Komando,
    // dan Pusat Komando bekerja dari .exe — yang hanya menerima channel 'broadcast'. Tanpa
    // channel itu kabarnya tak pernah tiba di layar tempat mereka bekerja (TASK_50).
    $user = User::factory()->create(['village_code' => '5171012006']);

    $konfirmasi = new AgencyConfirmationNotification($this->report, new App\Models\ReportAgency);
    $permintaan = new AgencyDispatchNotification($this->report, new App\Models\ReportAgency);

    expect($konfirmasi->via($user))->toContain('broadcast')
        ->and($permintaan->via($user))->toContain('broadcast');
});

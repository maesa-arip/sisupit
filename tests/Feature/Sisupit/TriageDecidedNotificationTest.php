<?php

use App\Models\Report;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use App\Notifications\TriageDecidedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * #209. Notifikasi "📥 Laporan baru menunggu verifikasi" tertinggal di laci notifikasi HP admin
 * walau laporannya sudah diverifikasi admin lain dan sudah dalam penanganan: admin tak pernah
 * menerima sirine dispatch yang menimpanya di HP petugas.
 *
 * Yang dijaga: (1) admin lain yang tadi menerima nada triase dikabari keputusannya - orang
 * yang SAMA, bukan kumpulan versi lain; (2) kabar itu benar-benar MENIMPA, yaitu `report_id`
 * dan `apns-collapse-id` yang sama dengan notifikasi triasenya; (3) ia tidak bersirine di APK
 * yang sudah terpasang (`type` = `report_status`, jenis yang sudah dikenal build lama).
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $wilayah = ['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006'];

    $this->reporter = User::factory()->create($wilayah);
    $this->reporter->assignRole('warga');

    $this->adminPemutus = User::factory()->create($wilayah + ['name' => 'Admin Pemutus']);
    $this->adminPemutus->assignRole('admin');

    $this->adminLain = User::factory()->create($wilayah);
    $this->adminLain->assignRole('admin');

    $this->petugas = User::factory()->create($wilayah);
    $this->petugas->assignRole('petugas');

    $this->buatLaporan = fn (array $extra = []) => Report::create(array_merge($wilayah, [
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
    ], $extra));
});

it('tells the other admins who heard the triage tone that the report was approved', function () {
    // Lewat endpoint sungguhan dari laporan masuk sampai verifikasi: penerima kabar harus
    // persis penerima nada triase admin, dikurangi yang memutuskan.
    Notification::fake();

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

    $report = Report::withoutGlobalScopes()->latest('id')->firstOrFail();

    $penerimaTriase = collect([$this->adminPemutus, $this->adminLain])
        ->filter(fn (User $u) => Notification::sent($u, EmergencyAlertNotification::class)
            ->contains(fn ($n) => $n->stage === EmergencyAlertNotification::STAGE_REPORT_INCOMING));
    expect($penerimaTriase)->toHaveCount(2);

    $this->actingAs($this->adminPemutus)->post(route('reports.approve', $report->id))->assertRedirect();

    Notification::assertSentTo($this->adminLain, TriageDecidedNotification::class, function ($n) use ($report) {
        return $n->decision === TriageDecidedNotification::APPROVED && $n->report->id === $report->id;
    });
    // Yang memutuskan sudah tahu; petugas sudah ditimpa sirine dispatch; pelapor punya kabarnya sendiri.
    Notification::assertNotSentTo($this->adminPemutus, TriageDecidedNotification::class);
    Notification::assertNotSentTo($this->petugas, TriageDecidedNotification::class);
    Notification::assertNotSentTo($this->reporter, TriageDecidedNotification::class);
});

it('replaces the triage notification instead of stacking a new one, without a siren on installed APKs', function () {
    $report = ($this->buatLaporan)();

    $triase = (new EmergencyAlertNotification($report, 'petugas', EmergencyAlertNotification::STAGE_REPORT_INCOMING))
        ->toFcm($this->adminLain)->toArray();
    $kabar = (new TriageDecidedNotification($report, TriageDecidedNotification::APPROVED, 'Admin Pemutus'))
        ->toFcm($this->adminLain)->toArray();

    // Android: ID notifikasi = report_id. iOS: apns-collapse-id.
    expect($kabar['data']['report_id'])->toBe($triase['data']['report_id'])
        ->and($kabar['apns']['headers']['apns-collapse-id'])->toBe($triase['apns']['headers']['apns-collapse-id']);

    // Jenis yang dikenal APK lama -> channel STATUS (nada bawaan). Jenis baru = sirine di build lama.
    expect($kabar['data']['type'])->toBe('report_status')
        ->and($kabar['data'])->not->toHaveKey('alert_stage')
        ->and($kabar['apns']['payload']['aps']['sound'])->toBe('default');

    expect($kabar['data']['title'])->not->toContain('menunggu verifikasi')
        ->and($kabar['data']['body'])->toContain('Admin Pemutus');
});

it('stays quiet for a suggested duplicate, which never rang the triage tone', function () {
    Notification::fake();

    $induk = ($this->buatLaporan)(['status' => 'pending']);
    $report = ($this->buatLaporan)(['duplicate_candidate_of_id' => $induk->id]);

    $this->actingAs($this->adminPemutus)->post(route('reports.merge', $report->id), ['into_id' => $induk->id])->assertRedirect();

    Notification::assertNotSentTo($this->adminLain, TriageDecidedNotification::class);
});

it('tells the other admins about a merge of a report that did ring', function () {
    Notification::fake();

    $induk = ($this->buatLaporan)(['status' => 'pending']);
    $report = ($this->buatLaporan)();

    $this->actingAs($this->adminPemutus)->post(route('reports.merge', $report->id), ['into_id' => $induk->id])->assertRedirect();

    Notification::assertSentTo($this->adminLain, TriageDecidedNotification::class, fn ($n) => $n->decision === TriageDecidedNotification::MERGED);
});

it('replaces the triage notification on rejection, but only for a report still awaiting verification', function () {
    Notification::fake();

    $mentah = ($this->buatLaporan)();
    $this->actingAs($this->adminPemutus)->post(route('reports.reject', $mentah->id), ['reason' => 'Hoaks'])->assertRedirect();

    Notification::assertSentTo($this->adminLain, TriageDecidedNotification::class, fn ($n) => $n->decision === TriageDecidedNotification::REJECTED);

    // Laporan yang sudah diverifikasi: notifikasi triasenya sudah ditimpa saat approve().
    Notification::fake();
    $terverifikasi = ($this->buatLaporan)(['status' => 'pending']);
    $this->actingAs($this->adminPemutus)->post(route('reports.reject', $terverifikasi->id))->assertRedirect();

    Notification::assertNotSentTo($this->adminLain, TriageDecidedNotification::class);
});

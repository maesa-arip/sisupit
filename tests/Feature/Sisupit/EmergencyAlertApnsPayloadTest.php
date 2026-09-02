<?php

use App\Models\Report;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;

beforeEach(function () {
    $this->reporter = User::factory()->create(['village_code' => '5171012006']);
    $this->reporter->assignRole('warga');

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

    $this->payload = fn () => (new EmergencyAlertNotification($this->report, 'petugas'))
        ->toFcm($this->reporter)
        ->toArray();
});

it('carries an apns alert block so the emergency notification actually appears on iOS', function () {
    // Tanpa blok ini, FCM memperlakukan pesan data-only sebagai BACKGROUND push di iOS:
    // tak ada UI, dibatasi sistem, dan tak terkirim saat app tertutup.
    $payload = ($this->payload)();

    expect($payload)->toHaveKey('apns');

    $aps = $payload['apns']['payload']['aps'];
    expect($aps['alert']['title'])->toBe('🚨 DARURAT KEBAKARAN!')
        ->and($aps['alert']['body'])->toBe('Jl. Pemogan No. 1')
        ->and($aps['sound'])->toBe('sirine.caf')
        ->and($aps['content-available'])->toBe(1);

    // Header wajib agar iOS memperlakukannya sebagai alert berprioritas tertinggi.
    expect($payload['apns']['headers']['apns-push-type'])->toBe('alert')
        ->and($payload['apns']['headers']['apns-priority'])->toBe('10');
});

it('uses time-sensitive until the Critical Alerts entitlement is approved by Apple', function () {
    // Penjaga keputusan produk: 'critical' hanya boleh dipakai setelah Apple menyetujui
    // entitlement Critical Alerts. Menaikkannya lebih awal membuat APNs menolak kiriman.
    $aps = ($this->payload)()['apns']['payload']['aps'];

    expect($aps['interruption-level'])->toBe('time-sensitive')
        ->and($aps['sound'])->toBeString();
});

it('keeps the android data-only payload intact (no regression for the live app)', function () {
    // Android produksi bergantung pada data-only + priority high: begitu blok notification
    // muncul kembali, onMessageReceived berhenti jalan di background → sirine & deep-link mati.
    $payload = ($this->payload)();

    expect($payload['android']['priority'])->toBe('high')
        ->and($payload)->not->toHaveKey('notification')
        ->and($payload['data']['title'])->toBe('🚨 DARURAT KEBAKARAN!')
        ->and($payload['data']['body'])->toBe('Jl. Pemogan No. 1')
        ->and($payload['data']['report_id'])->toBe((string) $this->report->id)
        ->and($payload['data']['type'])->toBe('emergency')
        ->and($payload['data']['user_role'])->toBe('petugas');
});

it('keeps the deep link pointing at the real report detail route', function () {
    // Regresi atas bug lama: action_url pernah dibangun sebagai '/reports/{id}' padahal
    // rute detail adalah 'reports/show/{report}' → SEMUA tap notifikasi berujung 404.
    $payload = ($this->payload)();

    expect($payload['data']['action_url'])->toBe(route('reports.show', $this->report->id))
        ->and($payload['data']['action_url'])->toContain('/reports/show/');
});

<?php

use App\Enums\TenantLevel;
use App\Models\Report;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\NearbyIncidentNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * TASK_89. Sesudah admin memverifikasi laporan, warga di sekitar kejadian mendapat notifikasi
 * BIASA (bukan sirine), dan ketukannya membuka halaman terbatas tanpa data pribadi.
 *
 * Yang dijaga: (1) penerima = warga yang kode wilayahnya sama pada tingkat setelan (bawaan
 * Desa), pelapor/pelapor gabungan/peran lain tidak; (2) `type` = report_status (APK lama:
 * nada bawaan, jenis tak dikenal = sirine); (3) halaman /kejadian/{id} bergerbang rumus
 * yang SAMA, hanya untuk laporan terverifikasi, dan tak memuat identitas/foto/deskripsi.
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert([
        ['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan'],
        ['code' => '5171012007', 'district_code' => '517101', 'name' => 'Pedungan'],
    ]);

    $this->wilayah = ['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006'];
    $desaTetangga = ['village_code' => '5171012007'] + $this->wilayah;

    $buat = function (string $role, array $wilayah, array $extra = []) {
        $u = User::factory()->create($wilayah + $extra);
        $u->assignRole($role);

        return $u;
    };

    $this->reporter = $buat('warga', $this->wilayah, ['name' => 'Pelapor Rahasia', 'phone' => '081234567890']);
    $this->admin = $buat('admin', $this->wilayah);
    $this->wargaSedesa = $buat('warga', $this->wilayah);
    $this->wargaTetangga = $buat('warga', $desaTetangga);
    $this->wargaTanpaWilayah = $buat('warga', ['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);
    $this->relawanSiagaOff = $buat('relawan', $this->wilayah, ['is_standby' => false]);

    $this->buatLaporan = fn (array $extra = []) => Report::create(array_merge($this->wilayah, [
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Rumah Pak Made terbakar, hubungi 0899',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
    ], $extra));
});

it('sends a plain notification to warga of the same village after approval, by default', function () {
    Notification::fake();
    $report = ($this->buatLaporan)();

    $this->actingAs($this->admin)->post(route('reports.approve', $report->id))->assertRedirect();

    Notification::assertSentTo($this->wargaSedesa, NearbyIncidentNotification::class, fn ($n) => $n->report->id === $report->id);
    // Pelapor sudah dikabari "Laporan Anda divalidasi"; desa tetangga di luar bawaan Desa;
    // profil tanpa wilayah bukan "semua wilayah"; peran lain punya jalurnya sendiri.
    Notification::assertNotSentTo($this->reporter, NearbyIncidentNotification::class);
    Notification::assertNotSentTo($this->wargaTetangga, NearbyIncidentNotification::class);
    Notification::assertNotSentTo($this->wargaTanpaWilayah, NearbyIncidentNotification::class);
    Notification::assertNotSentTo($this->relawanSiagaOff, NearbyIncidentNotification::class);
    Notification::assertNotSentTo($this->admin, NearbyIncidentNotification::class);
});

it('reaches the whole district when the setting is Kecamatan, including neighbouring villages', function () {
    Notification::fake();
    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_WARGA, TenantLevel::KECAMATAN->value);
    $report = ($this->buatLaporan)();

    $this->actingAs($this->admin)->post(route('reports.approve', $report->id))->assertRedirect();

    Notification::assertSentTo($this->wargaSedesa, NearbyIncidentNotification::class);
    Notification::assertSentTo($this->wargaTetangga, NearbyIncidentNotification::class);
    Notification::assertNotSentTo($this->reporter, NearbyIncidentNotification::class);
});

it('skips the reporters of reports merged into the approved incident', function () {
    Notification::fake();
    $report = ($this->buatLaporan)();
    ($this->buatLaporan)([
        'user_id' => $this->wargaSedesa->id,
        'status' => Report::STATUS_DIGABUNG,
        'merged_into_id' => $report->id,
    ]);

    $this->actingAs($this->admin)->post(route('reports.approve', $report->id))->assertRedirect();

    Notification::assertNotSentTo($this->wargaSedesa, NearbyIncidentNotification::class);
});

it('is not sent for a raw report that was only received or was rejected', function () {
    Notification::fake();
    $report = ($this->buatLaporan)();

    $this->actingAs($this->admin)->post(route('reports.reject', $report->id), ['reason' => 'Laporan palsu'])->assertRedirect();

    Notification::assertNothingSentTo($this->wargaSedesa, NearbyIncidentNotification::class);
});

it('uses the status channel known by installed APKs, never the siren, and opens the limited page', function () {
    $report = ($this->buatLaporan)(['status' => 'pending']);
    $fcm = (new NearbyIncidentNotification($report))->toFcm($this->wargaSedesa)->toArray();

    expect($fcm['data']['type'])->toBe('report_status')
        ->and($fcm['data']['event'])->toBe('nearby_incident')
        ->and($fcm['data']['action_url'])->toBe(route('front.incidents.show', $report->id))
        ->and($fcm['data']['body'])->not->toContain('Pelapor Rahasia')
        ->and($fcm['apns']['payload']['aps']['sound'])->toBe('default')
        ->and($fcm['apns']['payload']['aps']['interruption-level'])->toBe('active');
});

it('opens the limited incident page from the web bell instead of the full report detail', function () {
    $report = ($this->buatLaporan)(['status' => 'pending']);
    // Baris lonceng persis seperti channel `database` menulisnya (tanpa FCM sungguhan).
    $id = (string) Illuminate\Support\Str::uuid();
    $this->wargaSedesa->notifications()->create([
        'id' => $id,
        'type' => NearbyIncidentNotification::class,
        'data' => (new NearbyIncidentNotification($report))->toArray($this->wargaSedesa),
    ]);

    $this->actingAs($this->wargaSedesa)->post(route('notifications.read', $id))
        ->assertRedirect('/kejadian/'.$report->id);
});

it('shows nearby warga a limited page without identities, photos or the description', function () {
    $report = ($this->buatLaporan)(['status' => 'handling']);

    $response = $this->actingAs($this->wargaSedesa)->get(route('front.incidents.show', $report->id))->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('Front/Incidents/Show')
        ->where('incident.id', $report->id)
        ->where('incident.status', 'handling')
        ->missing('incident.user_id')
        ->missing('incident.description')
        ->missing('incident.photos')
        ->missing('incident.phone')
        ->missing('incident.name'));
    expect($response->getContent())->not->toContain('Pelapor Rahasia')
        ->and($response->getContent())->not->toContain('081234567890')
        ->and($response->getContent())->not->toContain('Pak Made');

    // Halaman detail penuh tetap tertutup bagi warga itu.
    $this->actingAs($this->wargaSedesa)->get(route('reports.show', $report->id))->assertForbidden();
});

it('gates the limited page with the same rule as the recipients and only for verified reports', function () {
    $verified = ($this->buatLaporan)(['status' => 'pending']);

    // Di luar jangkauan (desa tetangga, bawaan Desa), peran lain, atau belum/tidak diverifikasi.
    $this->actingAs($this->wargaTetangga)->get(route('front.incidents.show', $verified->id))->assertForbidden();
    $this->actingAs($this->relawanSiagaOff)->get(route('front.incidents.show', $verified->id))->assertForbidden();
    foreach (['TERLAPOR', 'ditolak', Report::STATUS_DIGABUNG] as $status) {
        $raw = ($this->buatLaporan)(['status' => $status]);
        $this->actingAs($this->wargaSedesa)->get(route('front.incidents.show', $raw->id))->assertForbidden();
    }

    Setting::setValue(Setting::KEY_NOTIFY_LEVEL_WARGA, TenantLevel::KECAMATAN->value);
    $this->actingAs($this->wargaTetangga)->get(route('front.incidents.show', $verified->id))->assertOk();
});

it('lets admins change the warga reach in the settings page, defaulting to Desa', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $this->actingAs($superadmin)->get(route('admin.settings.edit'))
        ->assertInertia(fn ($page) => $page->where('settings.notify_level_warga', 'desa'));

    $this->actingAs($superadmin)->put(route('admin.settings.update'), [
        'notify_level_petugas' => 'kabupaten',
        'notify_level_relawan' => 'desa',
        'notify_level_pejabat' => 'kabupaten',
        'notify_level_warga' => 'kecamatan',
    ])->assertRedirect();

    expect(Setting::wargaNotifyLevel())->toBe(TenantLevel::KECAMATAN);
});

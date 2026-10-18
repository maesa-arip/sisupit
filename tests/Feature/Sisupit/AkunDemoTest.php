<?php

use App\Models\ForumThread;
use App\Models\Report;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\Concerns\DipicuAkunDemo;
use App\Notifications\DeviceTestNotification;
use App\Notifications\EmergencyAlertNotification;
use App\Notifications\ForumNotification;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * TASK_81 / #214. Akun demo: laporan dan tindakan akun yang ditandai demo tidak mengirim notifikasi
 * ke pengguna asli, selama saklar induk "Mode Akun Demo" menyala.
 *
 * Yang dijaga: (1) notifikasi dicap pemicunya saat DIBUAT (di request, bukan di worker antrean);
 * (2) listener benar-benar membatalkan kirim - diuji lewat kanal database sungguhan, bukan
 * Notification::fake() yang melompati event; (3) laporan demo tetap senyap saat ditindaklanjuti
 * akun asli; (4) penerima demo tetap menerima; (5) saklar induk mati = perilaku biasa;
 * (6) hanya superadmin yang menandai akun.
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $this->wilayah = ['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006'];

    $this->demo = User::factory()->create($this->wilayah + ['is_demo' => true]);
    $this->demo->assignRole('warga');

    $this->admin = User::factory()->create($this->wilayah);
    $this->admin->assignRole('admin');

    $this->petugas = User::factory()->create($this->wilayah);
    $this->petugas->assignRole('petugas');

    $this->thread = (new ForumThread)->forceFill(['id' => 1]);

    // Apakah listener membatalkan kirim notifikasi ini ke penerima ini?
    $this->disenyapkan = fn (User $penerima, $notification) => app('events')->until(new NotificationSending($penerima, $notification, 'database')) === false;
});

it('silences, over a real channel, a notification triggered by a demo account', function () {
    $this->actingAs($this->demo);
    $this->admin->notify(new ForumNotification($this->thread, 'Pertanyaan baru', 'Uji'));

    expect($this->admin->notifications()->count())->toBe(0);
});

it('still delivers a notification triggered by a real account', function () {
    $this->actingAs($this->petugas);
    $this->admin->notify(new ForumNotification($this->thread, 'Pertanyaan baru', 'Uji'));

    expect($this->admin->notifications()->count())->toBe(1);
});

it('still delivers to a recipient that is itself a demo account', function () {
    $demoAdmin = User::factory()->create($this->wilayah + ['is_demo' => true]);
    $demoAdmin->assignRole('admin');

    $this->actingAs($this->demo);
    $demoAdmin->notify(new ForumNotification($this->thread, 'Pertanyaan baru', 'Uji'));

    expect($demoAdmin->notifications()->count())->toBe(1);
});

it('behaves like a normal account when the master switch is off', function () {
    Setting::setValue(Setting::KEY_AKUN_DEMO_AKTIF, '0');

    $this->actingAs($this->demo);
    $this->admin->notify(new ForumNotification($this->thread, 'Pertanyaan baru', 'Uji'));

    expect($this->admin->notifications()->count())->toBe(1);
});

it('marks a report from a demo account and stamps its incoming-report notification', function () {
    Notification::fake();

    $this->actingAs($this->demo)->post('/reports/create', [
        'title' => 'Kebakaran gudang',
        'description' => 'Asap tebal dari gudang',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Jl. Pemogan No. 9',
    ] + $this->wilayah)->assertRedirect();

    $report = Report::withoutGlobalScopes()->latest('id')->firstOrFail();
    expect($report->is_demo)->toBeTrue();

    // Cap dibuat di request; listener membacanya saat kirim (di produksi: di worker antrean).
    Notification::assertSentTo($this->admin, EmergencyAlertNotification::class, function ($n) {
        return $n->dipicuAkunDemo && ($this->disenyapkan)($this->admin, $n);
    });
});

it('keeps a demo report silent when a real admin approves it', function () {
    Notification::fake();

    $report = Report::create($this->wilayah + [
        'user_id' => $this->demo->id,
        'is_demo' => true,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
    ]);

    $this->actingAs($this->admin)->post(route('reports.approve', $report->id))->assertRedirect();

    Notification::assertSentTo($this->petugas, EmergencyAlertNotification::class, function ($n) {
        // Pemicunya akun asli - yang menyenyapkan adalah laporannya.
        return ! $n->dipicuAkunDemo && ($this->disenyapkan)($this->petugas, $n);
    });
});

it('never marks a report from a real account or a guest as demo', function () {
    $this->actingAs($this->petugas);
    $notification = new EmergencyAlertNotification(Report::create($this->wilayah + [
        'user_id' => $this->petugas->id,
        'title' => 'Kebakaran',
        'description' => 'Api',
        'status' => 'TERLAPOR',
    ]), 'petugas');

    expect(($this->disenyapkan)($this->admin, $notification))->toBeFalse();
});

it('stamps every notification class except the self-test, so new ones cannot forget', function () {
    $tanpaCap = collect(glob(app_path('Notifications/*.php')))
        ->map(fn ($path) => 'App\\Notifications\\'.basename($path, '.php'))
        ->reject(fn ($class) => $class === DeviceTestNotification::class)
        ->reject(fn ($class) => in_array(DipicuAkunDemo::class, class_uses($class), true))
        ->values()
        ->all();

    expect($tanpaCap)->toBe([]);
});

it('lets only a superadmin mark an account as demo', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $this->actingAs($this->admin)
        ->put(route('admin.users.demo', $this->petugas), ['is_demo' => true])
        ->assertForbidden();
    expect($this->petugas->fresh()->is_demo)->toBeFalse();

    $this->actingAs($superadmin)
        ->put(route('admin.users.demo', $this->petugas), ['is_demo' => true])
        ->assertRedirect();
    expect($this->petugas->fresh()->is_demo)->toBeTrue();
});

it('saves the master switch, and old callers without it do not flip it', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $level = ['notify_level_petugas' => 'kabupaten', 'notify_level_relawan' => 'desa', 'notify_level_pejabat' => 'kabupaten'];

    expect(Setting::akunDemoAktif())->toBeTrue();

    $this->actingAs($superadmin)->put(route('admin.settings.update'), $level + ['akun_demo_aktif' => false])->assertRedirect();
    expect(Setting::akunDemoAktif())->toBeFalse();

    $this->actingAs($superadmin)->put(route('admin.settings.update'), $level)->assertRedirect();
    expect(Setting::akunDemoAktif())->toBeFalse();
});

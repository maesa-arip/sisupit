<?php

use App\Http\Controllers\ReportController;
use App\Http\Requests\GuestReportRequest;
use App\Models\Report;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

// TASK_77 (2026-10-11) - lapor TANPA LOGIN. Keputusan user: tanpa OTP; dua lapis pelindung
// (honeypot + jeda isi + batas kirim selalu aktif; Turnstile bila kuncinya diisi, dan laporan
// TETAP diterima bila Cloudflare tak terjangkau); status lewat tautan bertanda tangan; semua jenis
// kejadian. Laporan tamu = user_id NULL dan masuk antrean triase seperti laporan lain.

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    Notification::fake();
    config(['services.turnstile.site_key' => null, 'services.turnstile.secret_key' => null]);
});

function guestPayload(array $override = []): array
{
    return [
        'incident_type' => 'rumah',
        'title' => 'Kebakaran Rumah',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'phone' => '0812 3456 7890',
        ...$override,
    ];
}

/** Kiriman tamu yang wajar: form dibuka 10 detik lalu (penjaga jeda isi). */
function guestPost($test, array $override = [], int $formAgeSeconds = 10, string $device = 'perangkat-a')
{
    return $test
        ->withSession([GuestReportRequest::SESSION_FORM_OPENED_AT => now()->timestamp - $formAgeSeconds])
        ->withCookie(ReportController::GUEST_DEVICE_COOKIE, $device)
        ->post(route('front.reports.guest.store'), guestPayload($override));
}

it('opens the same report form to guests, pointed at the guest endpoint', function () {
    $this->get(route('front.reports.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Front/Reports/Create')
            ->where('page_settings.action', route('front.reports.guest.store'))
            ->where('region_picker', null)
            ->where('guest.turnstile_site_key', null))
        ->assertSessionHas(GuestReportRequest::SESSION_FORM_OPENED_AT)
        ->assertCookie(ReportController::GUEST_DEVICE_COOKIE);
});

it('keeps the account form unchanged and still demands a verified email', function () {
    $warga = User::factory()->create(['village_code' => '5171012006']);
    $warga->assignRole('warga');

    $this->actingAs($warga)->get(route('front.reports.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('page_settings.action', route('front.reports.store'))
            ->missing('guest'));

    $unverified = User::factory()->unverified()->create(['village_code' => '5171012006']);
    $unverified->assignRole('warga');
    $this->actingAs($unverified)->get(route('front.reports.create'))
        ->assertRedirect(route('verification.notice'));
});

it('stores a guest report without an account and alerts the command center only', function () {
    $petugas = User::factory()->create();
    $petugas->assignRole('petugas');
    $relawan = User::factory()->create();
    $relawan->assignRole('relawan');

    $response = guestPost($this);

    $report = Report::withoutGlobalScopes()->sole();
    expect($report->user_id)->toBeNull()
        ->and($report->guest_check)->toBe('nonaktif')
        ->and($report->status)->toBe('TERLAPOR')
        // Diseragamkan supaya batas per nomor tak bisa dielak dengan spasi/+62.
        ->and($report->phone)->toBe('081234567890');

    expect($response->headers->get('Location'))->toContain('/lapor-darurat/status/'.$report->id)
        ->toContain('signature=');

    Notification::assertSentTo($petugas, EmergencyAlertNotification::class);
    Notification::assertNotSentTo($relawan, EmergencyAlertNotification::class);
});

it('accepts every incident type from guests, with the same detail rules as accounts', function () {
    guestPost($this, ['incident_type' => 'lainnya', 'title' => 'Pohon tumbang'])
        ->assertSessionHasErrors(['description', 'address']);

    guestPost($this, [
        'incident_type' => 'lainnya',
        'title' => 'Pohon tumbang',
        'description' => 'Menutup jalan',
        'address' => 'Depan pura',
    ])->assertSessionHasNoErrors();

    expect(Report::withoutGlobalScopes()->sole()->incident_type)->toBe('lainnya');
});

it('requires a valid mobile number from guests', function (string $phone) {
    guestPost($this, ['phone' => $phone])->assertSessionHasErrors('phone');
    expect(Report::withoutGlobalScopes()->count())->toBe(0);
})->with(['', '0361 123456', '12345', 'bukan nomor']);

it('normalizes +62 numbers to 08', function () {
    guestPost($this, ['phone' => '+62 812-3456-7890'])->assertSessionHasNoErrors();
    expect(Report::withoutGlobalScopes()->sole()->phone)->toBe('081234567890');
});

it('rejects a filled honeypot and a form sent too fast, loudly', function () {
    guestPost($this, ['website' => 'http://spam.example'])
        ->assertSessionHasErrors(['website' => GuestReportRequest::BOT_MESSAGE]);

    guestPost($this, [], formAgeSeconds: 1)
        ->assertSessionHasErrors(['form' => GuestReportRequest::BOT_MESSAGE]);

    // Menembak langsung tanpa pernah membuka form (tak ada jejak sesi).
    $this->post(route('front.reports.guest.store'), guestPayload())
        ->assertSessionHasErrors('form');

    expect(Report::withoutGlobalScopes()->count())->toBe(0);
});

it('limits guest reports per phone number and per device, counting only saved reports', function () {
    for ($i = 0; $i < ReportController::GUEST_LIMITS['phone']; $i++) {
        guestPost($this, [], device: 'perangkat-'.$i)->assertSessionHasNoErrors()->assertRedirect();
    }

    // Nomor sama, perangkat baru -> tetap ditolak (batas per nomor).
    guestPost($this, [], device: 'perangkat-baru')->assertStatus(429);

    // Nomor baru di perangkat yang sudah memakai jatahnya? Perangkat-0 baru 1 laporan, jadi
    // isi dulu sampai penuh dengan nomor lain.
    guestPost($this, ['phone' => '081111111111'], device: 'perangkat-0')->assertRedirect();
    guestPost($this, ['phone' => '082222222222'], device: 'perangkat-0')->assertRedirect();
    guestPost($this, ['phone' => '083333333333'], device: 'perangkat-0')->assertStatus(429);

    expect(Report::withoutGlobalScopes()->count())->toBe(5);
});

it('does not count rejected guest submissions toward the limit', function () {
    for ($i = 0; $i < 6; $i++) {
        guestPost($this, ['village_code' => ''])->assertSessionHasErrors('village_code');
    }

    guestPost($this)->assertSessionHasNoErrors()->assertRedirect();
});

it('keeps logged-in users on their own endpoint', function () {
    $warga = User::factory()->create(['village_code' => '5171012006']);
    $warga->assignRole('warga');

    $this->actingAs($warga)
        ->withSession([GuestReportRequest::SESSION_FORM_OPENED_AT => now()->timestamp - 10])
        ->post(route('front.reports.guest.store'), guestPayload())
        ->assertRedirect();

    expect(Report::withoutGlobalScopes()->count())->toBe(0);
});

it('shows a guest the status of their report only through the signed link', function () {
    $location = guestPost($this)->headers->get('Location');
    $report = Report::withoutGlobalScopes()->sole();

    $this->get($location)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Front/Reports/Thanks')
            ->where('report.id', $report->id)
            ->where('report.status', 'TERLAPOR')
            ->where('guestView.claimUrl', null)
            ->where('guestView.isOwner', false)
            ->whereNot('guestView.loginUrl', null)
            // Sesempit Thanks: tanpa nomor HP, nama, alamat, foto.
            ->missing('report.phone')
            ->missing('report.address'));

    // Tanpa tanda tangan / tanda tangan dirusak / kedaluwarsa = 403.
    $this->get('/lapor-darurat/status/'.$report->id)->assertForbidden();
    $this->get(preg_replace('/signature=[^&]+/', 'signature=palsu', $location))->assertForbidden();
    $this->travel(ReportController::GUEST_STATUS_LINK_HOURS + 1)->hours();
    $this->get($location)->assertForbidden();
});

it('shows the guest why their report was rejected on the status page', function () {
    $location = guestPost($this)->headers->get('Location');
    $report = Report::withoutGlobalScopes()->sole();
    $report->update(['status' => 'ditolak', 'rejected_reason' => 'Lokasi di luar wilayah layanan']);

    // Tamu tak bisa membuka detail laporan, jadi alasannya wajib sampai di halaman status.
    $this->get($location)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('report.status', 'ditolak')
            ->where('report.rejected_reason', 'Lokasi di luar wilayah layanan'));
});

it('never opens the incident detail page to a guest', function () {
    guestPost($this);
    $report = Report::withoutGlobalScopes()->sole();

    $this->get(route('reports.show', $report->id))->assertRedirect('/login');
    $this->get(route('front.reports.thanks', $report->id))->assertRedirect('/login');
});

it('lets the holder of the link save the report to their account, once', function () {
    $location = guestPost($this)->headers->get('Location');
    $report = Report::withoutGlobalScopes()->sole();

    $warga = User::factory()->create(['village_code' => '5171012006']);
    $warga->assignRole('warga');

    $claimUrl = null;
    $this->actingAs($warga)->get($location)
        ->assertOk()
        ->assertInertia(function ($page) use (&$claimUrl) {
            $claimUrl = $page->toArray()['props']['guestView']['claimUrl'];

            return $page;
        });
    expect($claimUrl)->not->toBeNull();

    // Tanpa tanda tangan tak bisa mengklaim.
    $this->actingAs($warga)->post('/lapor-darurat/status/'.$report->id.'/klaim')->assertForbidden();

    $this->actingAs($warga)->post($claimUrl)->assertRedirect(route('front.reports.thanks', $report->id));
    expect($report->fresh()->user_id)->toBe($warga->id);

    // Laporan yang sudah berpemilik tak bisa direbut dengan tautan yang sama.
    $lain = User::factory()->create(['village_code' => '5171012006']);
    $lain->assignRole('warga');
    $this->actingAs($lain)->post($claimUrl)->assertForbidden();
    expect($report->fresh()->user_id)->toBe($warga->id);
});

it('sends a guest who wants to log in back to the same status link', function () {
    guestPost($this);
    $report = Report::withoutGlobalScopes()->sole();

    $loginUrl = URL::temporarySignedRoute('front.reports.guest.login', now()->addHour(), ['report' => $report->id], false);

    $this->get($loginUrl)->assertRedirect(route('login'));
    expect(session('url.intended'))->toContain('/lapor-darurat/status/'.$report->id);
});

describe('turnstile (lapis kedua)', function () {
    beforeEach(function () {
        config(['services.turnstile.site_key' => 'kunci-situs', 'services.turnstile.secret_key' => 'kunci-rahasia']);
    });

    it('sends the site key to the guest form', function () {
        $this->get(route('front.reports.create'))
            ->assertInertia(fn ($page) => $page->where('guest.turnstile_site_key', 'kunci-situs'));
    });

    it('records a report that passed turnstile', function () {
        Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => true], 200)]);

        guestPost($this, ['turnstile_token' => 'token-asli'])->assertSessionHasNoErrors();

        expect(Report::withoutGlobalScopes()->sole()->guest_check)->toBe('turnstile');
        Http::assertSent(fn ($request) => $request['secret'] === 'kunci-rahasia' && $request['response'] === 'token-asli');
    });

    it('rejects a forged or missing token', function () {
        Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => false], 200)]);

        guestPost($this, ['turnstile_token' => 'token-palsu'])->assertSessionHasErrors('turnstile_token');
        guestPost($this)->assertSessionHasErrors('turnstile_token');

        expect(Report::withoutGlobalScopes()->count())->toBe(0);
    });

    it('still accepts the report when Cloudflare cannot be reached', function () {
        Http::fake(fn () => throw new ConnectionException('timeout'));

        guestPost($this, ['turnstile_token' => 'token-asli'])->assertSessionHasNoErrors();
        guestPost($this, ['turnstile_status' => 'error', 'phone' => '081111111111'])->assertSessionHasNoErrors();

        expect(Report::withoutGlobalScopes()->pluck('guest_check')->all())->toBe(['tanpa_captcha', 'tanpa_captcha']);
    });
});

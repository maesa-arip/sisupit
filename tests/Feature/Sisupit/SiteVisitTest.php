<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

// TASK_79 (2026-10-14) - statistik kunjungan web per hari, superadmin saja. Keputusan user:
// pengunjung unik + halaman dibuka; rincian web/APK, tamu/masuk, halaman terpopuler, per tenant.

const BROWSER_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36';

function visitAbout($test, array $headers = [])
{
    return $test->withHeaders(['User-Agent' => BROWSER_UA, ...$headers])->get(route('info.about'));
}

it('records a unique visitor and every page view per day, without storing the IP', function () {
    visitAbout($this)->assertOk();
    visitAbout($this)->assertOk();

    $visitor = DB::table('site_visitors_daily')->sole();
    expect($visitor->channel)->toBe('web')
        ->and((bool) $visitor->is_auth)->toBeFalse()
        ->and($visitor->visitor)->not->toContain('127.0.0.1')
        ->and(strlen($visitor->visitor))->toBe(64);

    $views = DB::table('site_page_views_daily')->sole();
    expect($views->page)->toBe('info.about')
        ->and((int) $views->views)->toBe(2);
});

it('separates the Android app from the browser and guests from signed-in users', function () {
    visitAbout($this, ['User-Agent' => BROWSER_UA.' SisupitApp/1.1.8'])->assertOk();

    // Peran yang dikelola pusat lolos cek "lengkapi profil" (EnsureProfileComplete).
    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
    visitAbout($this)->assertOk();

    expect(DB::table('site_visitors_daily')->where('channel', 'apk')->where('is_auth', false)->count())->toBe(1)
        ->and(DB::table('site_visitors_daily')->where('channel', 'web')->where('is_auth', true)->count())->toBe(1);
});

it('dates visits by the WITA wall clock, not UTC', function () {
    $this->travelTo(Carbon::parse('2026-10-14 17:30:00', 'UTC')); // 01:30 WITA 15 Okt

    visitAbout($this)->assertOk();

    expect(DB::table('site_page_views_daily')->value('date'))->toStartWith('2026-10-15');
});

it('ignores bots, partial reloads and non-page responses', function () {
    $this->withHeaders(['User-Agent' => 'Googlebot/2.1 (+http://www.google.com/bot.html)'])->get(route('info.about'))->assertOk();

    $version = app(HandleInertiaRequests::class)->version(request());
    visitAbout($this, [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => (string) $version,
        'X-Inertia-Partial-Component' => 'Info/About',
        'X-Inertia-Partial-Data' => 'instansi',
    ])->assertOk();

    // Redirect (tamu ke halaman yang butuh login) bukan halaman yang dibuka.
    $this->withHeaders(['User-Agent' => BROWSER_UA])->get(route('dashboard'))->assertRedirect();

    expect(DB::table('site_page_views_daily')->count())->toBe(0)
        ->and(DB::table('site_visitors_daily')->count())->toBe(0);
});

it('shows the daily statistics to a superadmin only', function () {
    visitAbout($this)->assertOk();
    visitAbout($this, ['User-Agent' => BROWSER_UA.' SisupitApp/1.1.8'])->assertOk();

    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');
    $this->actingAs($admin)->get(route('admin.visits.index'))->assertForbidden();

    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');
    $today = now(config('app.local_timezone'))->toDateString();

    $this->actingAs($superadmin)
        ->get(route('admin.visits.index', ['range' => 7]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Visits/Index')
            ->has('daily', 7)
            ->where('daily.6.date', $today)
            ->where('daily.6.visitors', 2)
            ->where('daily.6.views', 2)
            ->where('summary.today_visitors', 2)
            ->where('topPages.0.page', 'info.about')
            ->where('topPages.0.views', 2)
            ->has('byChannel', 2)
            ->where('filters.range', 7));
});

it('falls back to 30 days for an unknown range', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $this->actingAs($superadmin)
        ->get(route('admin.visits.index', ['range' => 9999]))
        ->assertInertia(fn ($page) => $page->has('daily', 30)->where('filters.range', 30));
});

<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * #221 - exe desktop (Sisupit Desktop, Electron) diperlakukan sebagai APLIKASI, bukan browser.
 *
 * Exe sengaja membersihkan UA halamannya (login Google menolak embedded browser), jadi:
 *  - server mengenalinya dari token `SisupitDesktop` yang exe 1.0.3+ tambahkan HANYA di request
 *    ke Sisupit (isNativeApp()/isDesktopApp() di app/Helpers/helpers.php);
 *  - JS mengenalinya dari jembatan `window.sisupitDesktop` (resources/js/lib/native-app.js),
 *    BUKAN dari navigator.userAgent - di halaman UA-nya tetap seperti Chrome biasa.
 */
$desktopUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 SisupitDesktop/1.0.3';

it('always remembers the login in the desktop app, so its notifications do not stop after 120 minutes', function () use ($desktopUa) {
    $user = User::factory()->create();

    $this->withHeader('User-Agent', $desktopUa)
        ->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertCookie(Auth::guard('web')->getRecallerName());
});

it('skips the public landing in the desktop app like in the phone app', function () use ($desktopUa) {
    $this->withHeaders(['User-Agent' => $desktopUa])
        ->get('/')
        ->assertRedirect(route('home.spotlight'));
});

it('counts desktop visits in their own channel', function () use ($desktopUa) {
    $this->withHeaders(['User-Agent' => $desktopUa])->get(route('info.about'))->assertOk();

    expect(DB::table('site_visitors_daily')->sole()->channel)->toBe('desktop');
});

it('detects the desktop app from its bridge, not from the user agent', function () {
    $lib = file_get_contents(resource_path('js/lib/native-app.js'));

    expect($lib)->toContain('!!window.sisupitDesktop')
        ->and($lib)->not->toMatch('/userAgent[^\n]*SisupitDesktop/');
});

it('hides every Android download prompt inside the desktop app', function () {
    foreach (['Auth/Login', 'Home', 'Spotlight', 'Profile/Edit'] as $page) {
        $source = file_get_contents(resource_path("js/Pages/{$page}.jsx"));

        expect($source)->toContain('sisupit.apk')
            ->and($source)->toContain('const isMyOwnApp = /SisupitApp/i.test(ua) || isDesktopApp();');
    }

    // Landing tidak menyembunyikan tombolnya: halaman itu sendiri dilewati di aplikasi.
    expect(file_get_contents(resource_path('js/Pages/Landing.jsx')))->toContain('if (isSisupitApp()) {');
});

it('shows the desktop connection, not "opened in a browser", on the notification card and banner', function () {
    $card = file_get_contents(resource_path('js/Components/NotificationDeviceCard.jsx'));
    $banner = file_get_contents(resource_path('js/Components/NotificationDeviceBanner.jsx'));

    expect($card)->toContain('const desktop = useDesktopNotificationStatus();')
        ->and($card)->toContain('window.sisupitDesktop.testNotification(tier)')
        ->and($banner)->toContain('const desktop = useDesktopNotificationStatus();');
});

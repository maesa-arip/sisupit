<?php

use App\Http\Controllers\Admin\HydrantController as AdminHydrantController;
use App\Http\Controllers\Admin\PompaController as AdminPompaController;
use App\Http\Controllers\Admin\PosPemadamController as AdminPosPemadamController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\UnitController as AdminUnitController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\FcmController;
use App\Http\Controllers\Api\GeocodeController;
use App\Http\Controllers\Api\RouteController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Front\HydrantController;
use App\Http\Controllers\Front\MonitoringMapController;
use App\Http\Controllers\Front\PompaController;
use App\Http\Controllers\Front\PosPemadamController;
use App\Http\Controllers\Front\RelawanController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportActionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportHelperController;
use App\Http\Controllers\VolunteerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Route::redirect('/', 'login');

/**
 * socialite auth
 */
Route::middleware('auth')->group(function () {
    Route::post('/fcm-token', [FcmController::class, 'store'])->name('fcm.store');

    // Lonceng notifikasi web (tandai-baca). Daftar di-share via HandleInertiaRequests.
    Route::post('/notifications/{id}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.readAll');
});
Route::middleware(['auth', 'verified'])->group(function () {

    // Rute tunggal se-arah untuk memisahkan view dashboard secara otomatis
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Grup Administrasi Multi-Tenant khusus Admin ke bawah tetap aman di sini
    Route::middleware(['role:admin|superadmin'])->prefix('admin')->name('admin.')->group(function () {

        Route::prefix('facilities')->name('facilities.')->group(function () {
            Route::get('/', function () {
                return inertia('Admin/Facilities/Index');
            })->name('index');
        });

        Route::resource('hydrants', AdminHydrantController::class)->except(['show']);
        Route::resource('pumps', AdminPompaController::class)->except(['show']);
        Route::resource('fire-stations', AdminPosPemadamController::class)->except(['show']);
        Route::resource('units', AdminUnitController::class)->except(['show']);

        Route::prefix('reports')->name('reports.')->controller(AdminReportController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/export', 'export')->name('export');
        });
    });
});

Route::get('/auth/{provider}', [SocialiteController::class, 'redirectToProvider']);
Route::get('/auth/{provider}/callback', [SocialiteController::class, 'handleProvideCallback']);
// Login native dari aplikasi WebView: menerima Google ID token dari account picker HP.
Route::post('/auth/google/native', [SocialiteController::class, 'handleNativeGoogle'])->name('google.native');
Route::controller(HomeController::class)->group(function () {
    // Landing publik untuk browser; WebView (UA ∋ SisupitApp) di-redirect di controller
    // ke home.spotlight / dashboard — lihat HomeController::landing().
    Route::get('/', 'landing')->name('home.landing');
    Route::get('/spotlight', 'spotlight')->name('home.spotlight');
    // `/` sengaja tetap ke Spotlight (keputusan 2026-07-11); halaman Landing yang sudah
    // dipoles diakses langsung di sini agar tetap hidup tanpa mengubah `/`.
    Route::get('/landing', 'landingPage')->name('home.landing.page');
    Route::get('/home', 'index')->name('home.index');
});
// Daftar relawan hanya untuk Pusat Komando (petugas/admin/superadmin), bukan publik.
Route::middleware(['auth', 'verified', 'role:petugas|admin|superadmin'])->group(function () {
    Route::get('/relawan', [RelawanController::class, 'index'])->name('front.volunteers.index');
    Route::get('/relawan/{id}', [RelawanController::class, 'show'])->name('front.volunteers.show');
});

// Peta Pemantauan terpadu (semua layer) — Pusat Komando + pejabat pemantau,
// ter-scope yurisdiksi. Memuat data relawan & kejadian (PII), jadi bukan publik.
Route::middleware(['auth', 'verified', 'role:petugas|admin|superadmin|pejabat'])->group(function () {
    Route::get('/peta-pemantauan', [MonitoringMapController::class, 'index'])->name('front.monitoring.map');
});

Route::get('/pumps', [PompaController::class, 'index'])->name('front.pumps.index');

// Route untuk Pos Pemadam
Route::get('/fire-stations', [PosPemadamController::class, 'index'])->name('front.fire_stations.index');

Route::get('/hydrants', [HydrantController::class, 'index'])->name('front.hydrants.index');

// Panduan Desain internal (referensi sistem warna, komponen, & aturan UI). Tanpa auth
// agar mudah dibuka sebagai rujukan tim; halaman statis, tak memuat data sensitif.
Route::inertia('/guideline', 'Guideline')->name('guideline');

// Ambil daftar Kota/Kabupaten berdasarkan Provinsi
Route::get('/api/regions/cities/{provinceCode}', function ($provinceCode) {
    return DB::table('indonesia_cities')->where('province_code', $provinceCode)->get();
})->name('api.regions.cities');

// Ambil daftar Kecamatan berdasarkan Kota/Kabupaten
Route::get('/api/regions/districts/{cityCode}', function ($cityCode) {
    return DB::table('indonesia_districts')->where('city_code', $cityCode)->get();
})->name('api.regions.districts');

// Ambil daftar Desa/Kelurahan berdasarkan Kecamatan
Route::get('/api/regions/villages/{districtCode}', function ($districtCode) {
    return DB::table('indonesia_villages')->where('district_code', $districtCode)->get();
})->name('api.regions.villages');

// Proxy Nominatim (User-Agent, cache, & rate limit ditangani di server - lihat GeocodeController)
Route::middleware(['auth'])->group(function () {
    Route::get('/api/geocode/reverse', [GeocodeController::class, 'reverse'])->name('api.geocode.reverse');
    Route::get('/api/geocode/search', [GeocodeController::class, 'search'])->name('api.geocode.search');
    // Proxy OSRM (rute jalan asli; cache + rate limit ditangani di server - lihat RouteController)
    Route::get('/api/route/directions', [RouteController::class, 'directions'])->name('api.route.directions');
});

Route::get('/webpush/public-key', function () {
    return ['publicKey' => config('webpush.vapid.public_key')];
});

Route::middleware('auth')->post('/webpush/subscribe', function (Request $request) {
    $request->user()->updatePushSubscription(
        $request->input('endpoint'),
        $request->input('keys.p256dh'),
        $request->input('keys.auth')
    );

    return response()->json(['success' => true]);
});

Route::middleware(['auth', 'verified'])->controller(ReportController::class)->group(function () {
    Route::get('reports', 'index')->name('front.reports.index');

    Route::get('reports/show/{report}', 'show')->name('reports.show');
    Route::get('reports/create', 'create')->name('front.reports.create');
    Route::post('reports/create', 'store')->middleware('throttle:report-create')->name('front.reports.store');
    Route::get('reports/thanks/{report}', 'thanks')->name('front.reports.thanks');
    Route::get('reports/edit/{report}', 'edit')->name('front.reports.edit');
    Route::put('reports/edit/{report}', 'update')->name('front.reports.update');
    Route::delete('reports/destroy/{report}', 'destroy')->name('front.reports.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Rute Taktis (Custom Actions) Laporan
    Route::post('/reports/{report}/approve', [ReportActionController::class, 'approve'])->name('reports.approve');
    Route::post('/reports/{report}/reject', [ReportActionController::class, 'reject'])->name('reports.reject');
    Route::post('/reports/{report}/take-action', [ReportActionController::class, 'takeAction'])->name('reports.take-action');
    Route::post('/reports/{report}/cancel-response', [ReportActionController::class, 'cancelResponse'])->name('reports.cancel-response');

    // Pengerahan unit/armada ke insiden (TASK_09)
    Route::post('/reports/{report}/dispatch-unit', [ReportActionController::class, 'dispatchUnit'])->name('reports.dispatch-unit');
    Route::post('/reports/{report}/release-unit', [ReportActionController::class, 'releaseUnit'])->name('reports.release-unit');
    Route::post('/reports/{report}/arrive', [ReportActionController::class, 'arrive'])->name('reports.arrive');
    Route::post('/reports/{report}/resolve', [ReportActionController::class, 'resolve'])->name('reports.resolve');

    // Rute Lemparan Titik GPS (Background Process Axios)
    Route::post('/reports/{report}/update-location', [ReportActionController::class, 'updateLocation']);

    // Koreksi Titik Insiden oleh Responder yang Sudah Tiba di Lokasi
    Route::post('/reports/{report}/correct-location', [ReportActionController::class, 'correctLocation'])->name('reports.correct-location');
});

Route::middleware(['auth', 'verified'])->controller(UserController::class)->group(function () {
    Route::put('users/relawan/{user}', 'storeRelawan')->name('admin.relawan.update');
    Route::put('users/detail/{user}', 'storeDetailUser')->name('admin.detail.update');
});

Route::middleware(['auth', 'verified'])->controller(ReportHelperController::class)->group(function () {
    Route::post('helpers/create', 'store')->name('front.helpers.store');
});

Route::middleware(['auth'])->controller(ProfileController::class)->group(function () {
    Route::get('profile', 'edit')->name('profile.edit');
    Route::patch('profile', 'update')->name('profile.update');
    Route::delete('profile', 'destroy')->name('profile.destroy');
    Route::get('/complete-profile', 'completeProfile')->name('profile.complete');
    Route::post('/complete-profile', 'storeCompleteProfile')->name('profile.complete.store');
    Route::post('/volunteer/register', [VolunteerController::class, 'register'])->name('volunteer.register');
    Route::post('/volunteer/standby', [VolunteerController::class, 'toggleStandby'])->name('volunteer.standby');
    Route::post('/volunteer/skills', [VolunteerController::class, 'updateSkills'])->name('volunteer.skills');
});

require __DIR__.'/auth.php';
require __DIR__.'/admin.php';

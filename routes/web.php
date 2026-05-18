<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Front\HydrantController;
use App\Http\Controllers\Front\PompaController;
use App\Http\Controllers\Front\PosPemadamController;
use App\Http\Controllers\Front\RelawanController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportHelperController;
use App\Http\Controllers\Admin\HydrantController as AdminHydrantController;
use App\Http\Controllers\ReportActionController;
use App\Http\Controllers\VolunteerController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Route::redirect('/', 'login');

/**
 * socialite auth
 */

Route::middleware(['auth', 'verified'])->group(function () {

    // Rute tunggal se-arah untuk memisahkan view dashboard secara otomatis
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Grup Administrasi Multi-Tenant khusus Admin ke bawah tetap aman di sini
    Route::middleware(['role:admin|superadmin'])->prefix('admin')->name('admin.')->group(function () {

        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', function () {
                return inertia('Admin/Users/Index');
            })->name('index');
            Route::get('/create', function () {
                return inertia('Admin/Users/Create');
            })->name('create');
        });

        Route::prefix('facilities')->name('facilities.')->group(function () {
            Route::get('/', function () {
                return inertia('Admin/Facilities/Index');
            })->name('index');
            Route::resource('hydrants', HydrantController::class)->except(['show']);
        });

        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/', function () {
                return inertia('Admin/Reports/Index');
            })->name('index');
        });
    });
});

Route::get('/auth/{provider}', [SocialiteController::class, 'redirectToProvider']);
Route::get('/auth/{provider}/callback', [SocialiteController::class, 'handleProvideCallback']);
Route::controller(HomeController::class)->group(function () {
    Route::get('/', 'spotlight')->name('home.spotlight');
    Route::get('/home', 'index')->name('home.index');
    Route::get('/testnotif', 'testnotif')->name('home.testnotif');
    Route::get('/kirim-notifikasi', 'kirimNotifikasi')->name('home.kirim-notifikasi');
});
Route::get('/relawan', [RelawanController::class, 'index'])->name('front.volunteers.index');
// Route BARU untuk Detail Relawan
Route::get('/relawan/{id}', [RelawanController::class, 'show'])->name('front.volunteers.show');

Route::get('/pumps', [PompaController::class, 'index'])->name('front.pumps.index');



// Route untuk Pos Pemadam
Route::get('/fire-stations', [PosPemadamController::class, 'index'])->name('front.fire_stations.index');

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('hydrants', AdminHydrantController::class);
});
Route::get('/hydrants', [HydrantController::class, 'index'])->name('front.hydrants.index');

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

Route::get('/webpush/public-key', function () {
    return ['publicKey' => config('webpush.vapid.public_key')];
});

Route::post('/webpush/subscribe', function (Request $request) {
    $request->user()->updatePushSubscription(
        $request->input('endpoint'),
        $request->input('keys.p256dh'),
        $request->input('keys.auth')
    );

    return response()->json(['success' => true]);
});

Route::get('/openssl-test', function () {
    return response()->json(openssl_get_curve_names());
});

Route::middleware(['auth', 'verified'])->controller(ReportController::class)->group(function () {
    Route::get('reports', 'index')->name('front.reports.index');

    Route::get('reports/show/{report}', 'show')->name('reports.show');
    Route::get('reports/create', 'create')->name('front.reports.create');
    Route::post('reports/create', 'store')->name('front.reports.store');
    Route::get('reports/edit/{report}', 'edit')->name('front.reports.edit');
    Route::put('reports/edit/{report}', 'update')->name('front.reports.update');
    Route::delete('reports/destroy/{report}', 'destroy')->name('front.reports.destroy');
    Route::post('reports/approve/{report}', [ReportController::class, 'approve'])->name('reports.approve');
    Route::post('reports/reject/{report}', [ReportController::class, 'reject'])->name('reports.reject');
});

Route::middleware(['auth'])->group(function () {
    // Rute Taktis (Custom Actions) Laporan
    Route::post('/reports/{report}/approve', [ReportActionController::class, 'approve'])->name('reports.approve');
    Route::post('/reports/{report}/take-action', [ReportActionController::class, 'takeAction'])->name('reports.take-action');
    Route::post('/reports/{report}/arrive', [ReportActionController::class, 'arrive'])->name('reports.arrive');
    Route::post('/reports/{report}/resolve', [ReportActionController::class, 'resolve'])->name('reports.resolve');

    // Rute Lemparan Titik GPS (Background Process Axios)
    Route::post('/reports/{report}/update-location', [ReportActionController::class, 'updateLocation']);
});

Route::middleware(['auth', 'verified'])->controller(UserController::class)->group(function () {
    Route::put('users/relawan/{user}', 'store_relawan')->name('admin.relawan.update');
    Route::put('users/detail/{user}', 'store_detail_user')->name('admin.detail.update');
});

Route::middleware(['auth', 'verified'])->controller(ReportHelperController::class)->group(function () {
    Route::get('helpers', 'index')->name('front.helpers.index');
    Route::get('helpers/create', 'create')->name('front.helpers.create');
    Route::post('helpers/create', 'store')->name('front.helpers.store');
    Route::get('helpers/edit/{helper}', 'edit')->name('front.helpers.edit');
    Route::put('helpers/edit/{helper}', 'update')->name('front.helpers.update');
    Route::delete('helpers/destroy/{helper}', 'destroy')->name('front.helpers.destroy');
});

Route::middleware(['auth', 'verified'])->controller(DashboardController::class)->group(function () {
    Route::get('dashboard', 'index')->name('dashboard');
    Route::get('dashboard2', 'dashboard2')->name('dashboard2');
    Route::get('cashiers', 'cashier')->name('cashiers');
});


Route::middleware(['auth'])->controller(ProfileController::class)->group(function () {
    Route::get('profile', 'edit')->name('profile.edit');
    Route::patch('profile', 'update')->name('profile.update');
    Route::delete('profile', 'destroy')->name('profile.destroy');
    Route::post('/volunteer/register', [VolunteerController::class, 'register'])->name('volunteer.register');
});

require __DIR__ . '/auth.php';
require __DIR__ . '/admin.php';

<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\BookFrontController;
use App\Http\Controllers\CashierFrontController;
use App\Http\Controllers\CategoryFrontController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FineFrontController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LoanFrontController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportHelperController;
use App\Http\Controllers\ReturnBookFrontController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Route::redirect('/', 'login');

/**
 * socialite auth
 */
Route::get('/auth/{provider}', [SocialiteController::class, 'redirectToProvider']);
Route::get('/auth/{provider}/callback', [SocialiteController::class, 'handleProvideCallback']);
Route::controller(HomeController::class)->group(function () {
    Route::get('/', 'index')->name('home.index');
    Route::get('/testnotif', 'testnotif')->name('home.testnotif');
    Route::get('/kirim-notifikasi', 'kirimNotifikasi')->name('home.kirim-notifikasi');
});

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
    Route::get('reports/create', 'create')->name('front.reports.create');
    Route::post('reports/create', 'store')->name('front.reports.store');
    Route::get('reports/edit/{report}', 'edit')->name('front.reports.edit');
    Route::put('reports/edit/{report}', 'update')->name('front.reports.update');
    Route::delete('reports/destroy/{report}', 'destroy')->name('front.reports.destroy');
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
    Route::get('cashiers', 'cashier')->name('cashiers');
});

Route::middleware(['auth', 'verified', 'dynamic.role_permission'])->controller(CashierFrontController::class)->group(function () {
    Route::get('cashiers', 'index')->name('cashiers');
});

Route::middleware(['auth', 'verified', 'dynamic.role_permission'])->controller(BookFrontController::class)->group(function () {
    Route::get('books', 'index')->name('front.books.index');
    Route::get('books/{book:slug}', 'show')->name('front.books.show');
});

Route::middleware(['auth', 'verified', 'dynamic.role_permission'])->controller(CategoryFrontController::class)->group(function () {
    Route::get('categories', 'index')->name('front.categories.index');
    Route::get('categories/{category:slug}', 'show')->name('front.categories.show');
});

Route::middleware(['auth', 'verified', 'dynamic.role_permission'])->controller(CompanyController::class)->group(function () {
    Route::get('companies', 'index')->name('front.companies.index');
    Route::get('companies/create', 'create')->name('front.companies.create');
    Route::post('companies/create', 'store')->name('front.companies.store');
    Route::get('companies/edit/{company}', 'edit')->name('front.companies.edit');
    Route::put('companies/edit/{company}', 'update')->name('front.companies.update');
    Route::delete('companies/destroy/{company}', 'destroy')->name('front.companies.destroy');
});

Route::middleware(['auth', 'verified', 'dynamic.role_permission'])->controller(SettingController::class)->group(function () {
    Route::get('settings', 'index')->name('front.settings.index');
    Route::get('settings/create', 'create')->name('front.settings.create');
    Route::post('settings/create', 'store')->name('front.settings.store');
    Route::get('settings/edit/{setting}', 'edit')->name('front.settings.edit');
    Route::put('settings/edit/{setting}', 'update')->name('front.settings.update');
});

Route::middleware(['auth', 'verified', 'dynamic.role_permission'])->controller(ProductController::class)->group(function () {
    Route::get('products', 'index')->name('front.products.index');
    Route::get('products/create', 'create')->name('front.products.create');
    Route::post('products/create', 'store')->name('front.products.store');
    Route::get('products/edit/{product}', 'edit')->name('front.products.edit');
    Route::put('products/edit/{product}', 'update')->name('front.products.update');
});


Route::middleware(['auth', 'verified', 'dynamic.role_permission'])->controller(LoanFrontController::class)->group(function () {
    Route::get('loans', 'index')->name('front.loans.index');
    Route::get('loans/{loan:loan_code}/detail', 'show')->name('front.loans.show');
    Route::post('loans/{book:slug}/create', 'store')->name('front.loans.store');
});

Route::middleware(['auth', 'verified', 'dynamic.role_permission'])->controller(ReturnBookFrontController::class)->group(function () {
    Route::get('return-books', 'index')->name('front.return-books.index');
    Route::get('return-books/{returnBook:return_book_code}/detail', 'show')->name('front.return-books.show');
    Route::post('return-books/{book:slug}/create/{loan:loan_code}', 'store')->name('front.return-books.store');
});

Route::get('fines', FineFrontController::class)
    ->middleware(['auth', 'verified', 'dynamic.role_permission'])
    ->name('front.fines.index');

Route::controller(PaymentController::class)->group(function () {
    Route::post('payments', 'create')->name('payments.create');
    Route::post('payments/callback', 'callback')->name('payments.callback');
    Route::get('payments/success', 'success')->name('payments.success');
});

Route::middleware(['auth'])->controller(ProfileController::class)->group(function () {
    Route::get('profile', 'edit')->name('profile.edit');
    Route::patch('profile', 'update')->name('profile.update');
    Route::delete('profile', 'destroy')->name('profile.destroy');
});

require __DIR__ . '/auth.php';
require __DIR__ . '/admin.php';

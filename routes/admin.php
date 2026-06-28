<?php

use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\AssignPermissionController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\RouteAccessController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|superadmin'])->prefix('admin')->group(function () {

    // Manajemen pengguna ter-scope yurisdiksi: admin wilayah boleh, dibatasi UserPolicy
    // (withinJurisdiction) + whitelist peran/level di UserController::assignRole.
    Route::controller(UserController::class)->group(function () {
        Route::get('users', 'index')->name('admin.users.index');
        Route::get('users/create', 'create')->name('admin.users.create');
        Route::post('users/create', 'store')->name('admin.users.store');
        Route::get('users/edit/{user}', 'edit')->name('admin.users.edit');
        Route::put('users/edit/{user}', 'update')->name('admin.users.update');
        Route::put('users/assign-role/{user}', 'assignRole')->name('admin.users.assign-role');
        Route::delete('users/destroy/{user}', 'destroy')->name('admin.users.destroy');
    });

    // RBAC sistem (role/permission/assign-permission/route-access), pengumuman, & pengaturan
    // notifikasi bersifat GLOBAL lintas-tenant — dibatasi superadmin saja. Admin wilayah
    // (mis. admin@denpasar.go.id) tidak boleh mendefinisikan ulang model akses seluruh sistem
    // maupun broadcast pengumuman nasional.
    Route::middleware('role:superadmin')->group(function () {
        Route::controller(AnnouncementController::class)->group(function () {
            Route::get('announcements', 'index')->name('admin.announcements.index');
            Route::get('announcements/create', 'create')->name('admin.announcements.create');
            Route::post('announcements/create', 'store')->name('admin.announcements.store');
            Route::get('announcements/edit/{announcement}', 'edit')->name('admin.announcements.edit');
            Route::put('announcements/edit/{announcement}', 'update')->name('admin.announcements.update');
            Route::delete('announcements/destroy/{announcement}', 'destroy')->name('admin.announcements.destroy');
        });

        Route::controller(RoleController::class)->group(function () {
            Route::get('roles', 'index')->name('admin.roles.index');
            Route::get('roles/create', 'create')->name('admin.roles.create');
            Route::post('roles/create', 'store')->name('admin.roles.store');
            Route::get('roles/edit/{role}', 'edit')->name('admin.roles.edit');
            Route::put('roles/edit/{role}', 'update')->name('admin.roles.update');
            Route::delete('roles/destroy/{role}', 'destroy')->name('admin.roles.destroy');
        });

        Route::controller(PermissionController::class)->group(function () {
            Route::get('permissions', 'index')->name('admin.permissions.index');
            Route::get('permissions/create', 'create')->name('admin.permissions.create');
            Route::post('permissions/create', 'store')->name('admin.permissions.store');
            Route::get('permissions/edit/{permission}', 'edit')->name('admin.permissions.edit');
            Route::put('permissions/edit/{permission}', 'update')->name('admin.permissions.update');
            Route::delete('permissions/destroy/{permission}', 'destroy')->name('admin.permissions.destroy');
        });

        Route::controller(AssignPermissionController::class)->group(function () {
            Route::get('assign-permissions', 'index')->name('admin.assign-permissions.index');
            Route::get('assign-permissions/edit/{role}', 'edit')->name('admin.assign-permissions.edit');
            Route::put('assign-permissions/edit/{role}', 'update')->name('admin.assign-permissions.update');
        });

        Route::controller(RouteAccessController::class)->group(function () {
            Route::get('route-accesses', 'index')->name('admin.route-accesses.index');
            Route::get('route-accesses/create', 'create')->name('admin.route-accesses.create');
            Route::post('route-accesses/create', 'store')->name('admin.route-accesses.store');
            Route::get('route-accesses/edit/{routeAccess}', 'edit')->name('admin.route-accesses.edit');
            Route::put('route-accesses/edit/{routeAccess}', 'update')->name('admin.route-accesses.update');
            Route::delete('route-accesses/destroy/{routeAccess}', 'destroy')->name('admin.route-accesses.destroy');
        });

        Route::controller(SettingController::class)->group(function () {
            Route::get('settings', 'edit')->name('admin.settings.edit');
            Route::put('settings', 'update')->name('admin.settings.update');
        });
    });
});

<?php

use App\Http\Controllers\Api\FcmController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/fcm-token', [FcmController::class, 'store'])->middleware('auth');
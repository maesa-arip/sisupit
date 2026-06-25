<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Lepas token FCM milik device yang sedang logout supaya server berhenti
        // mengirim notifikasi (sirine) ke HP ini setelah user keluar. Token bersifat
        // per-DEVICE — hanya hapus token device ini (dikirim frontend), jangan ganggu
        // device lain milik user yang sama. Dijalankan SEBELUM logout(), selagi
        // Auth::user() masih tersedia. Ini sisi simetris dari FcmController::store
        // yang memindahkan token ke user saat login.
        $token = $request->input('fcm_token');
        if ($token && $request->user()) {
            $deleted = $request->user()->fcmTokens()->where('token', $token)->delete();

            Log::info('FCM token released on logout', [
                'user_id' => $request->user()->id,
                'token_tail' => substr($token, -10),
                'deleted' => $deleted,
            ]);
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}

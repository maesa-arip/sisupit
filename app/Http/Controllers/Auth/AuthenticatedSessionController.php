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
        // Cadangan dari sesi (dicatat FcmController::store, TASK_73): tombol Keluar di Profil,
        // VerifyEmail, dan AuthenticatedLayout tak pernah mengirim fcm_token, sehingga keluar
        // lewat sana dulu meninggalkan token - HP tampak keluar tapi tetap bersirine.
        $token = $request->input('fcm_token') ?: $request->session()->get('fcm_token');
        if ($token && $request->user()) {
            $deleted = $request->user()->fcmTokens()->where('token', $token)->delete();

            Log::info('FCM token released on logout', [
                'user_id' => $request->user()->id,
                'token_tail' => substr($token, -10),
                'deleted' => $deleted,
            ]);
        }

        // logoutCurrentDevice, BUKAN logout (TASK_73): logout() mengganti remember_token yang
        // hanya SATU per user, sehingga keluar di laptop diam-diam mencabut "ingat saya" di HP.
        // HP itu lalu terlempar ke halaman masuk setelah sesinya habis - dengan token FCM yang
        // tertinggal, jadi sirine tetap datang. Cabut semua perangkat = Profil > "Keluar dari
        // semua perangkat" (ProfileController::logoutEverywhere).
        Auth::guard('web')->logoutCurrentDevice();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}

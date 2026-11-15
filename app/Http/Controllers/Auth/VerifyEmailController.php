<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    /**
     * Tandai email pemilik tautan terverifikasi - TANPA mensyaratkan login (2026-11-15).
     *
     * Route ini dijaga middleware `signed` (tautan dibuat server, kedaluwarsa) dan hash email
     * di bawah, sama dengan pemeriksaan EmailVerificationRequest bawaan Laravel kecuali syarat
     * "harus sudah login di browser yang sama". Syarat itu yang membuat verifikasi gagal di
     * iPhone: tautan dari aplikasi Mail terbuka di Safari, bukan di aplikasi Sisupit.
     */
    public function __invoke(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::find($id);

        abort_unless($user && hash_equals(sha1($user->getEmailForVerification()), $hash), 403);

        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // Browser yang sama dengan akun ini: langsung ke dasbor seperti dulu.
        if ($request->user()?->is($user)) {
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        // Browser lain (Safari dari aplikasi Mail) atau belum login: cukup kabari. Pengguna
        // kembali ke aplikasi dan sesinya di sana kini lolos `verified`.
        return redirect()->route('login')->with('status', 'Email Anda berhasil diverifikasi. Silakan kembali ke aplikasi atau masuk.');
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\PasswordCreatedNotification;
use App\Notifications\PasswordSetupCodeNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

class PasswordController extends Controller
{
    /** Masa berlaku kode buat-kata-sandi (TASK_82), detik. Teks email & layar menyebut "10 menit". */
    public const SETUP_CODE_TTL = 600;

    /** Percobaan kode salah sebelum kode hangus - 5 tebakan dari sejuta kemungkinan. */
    public const SETUP_CODE_MAX_ATTEMPTS = 5;

    /** Batas minta kode: sekali per menit, lima kali per jam (penangkal spam email). */
    public const SETUP_CODE_SENDS_PER_HOUR = 5;

    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        $this->signOutOtherDevices($request);

        return back();
    }

    /**
     * Kirim kode 6 angka ke email akun yang BELUM punya kata sandi (masuk lewat Google/Apple,
     * TASK_82). Kode membuktikan pemilik email: sesi yang dibajak (HP dipinjam) tidak cukup
     * untuk memasang kata sandi dan menguasai akun selamanya.
     *
     * Disimpan di cache (CACHE_STORE=database di prod = tetap ada saat deploy) sebagai HASH,
     * bukan angkanya - tanpa migrasi, kedaluwarsa sendiri (keputusan user 2026-10-24).
     */
    public function sendSetupCode(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->ensureWithoutPassword($user);

        if (blank($user->email)) {
            throw ValidationException::withMessages([
                'code' => 'Akun Anda belum punya email. Isi email di tab Profil terlebih dahulu.',
            ]);
        }

        $perMinute = self::sendLimiterKey($user, 'minute');
        $perHour = self::sendLimiterKey($user, 'hour');
        $hourFull = RateLimiter::tooManyAttempts($perHour, self::SETUP_CODE_SENDS_PER_HOUR);
        if ($hourFull || RateLimiter::tooManyAttempts($perMinute, 1)) {
            $seconds = RateLimiter::availableIn($hourFull ? $perHour : $perMinute);
            $wait = $seconds < 60 ? "{$seconds} detik" : ((int) ceil($seconds / 60)).' menit';

            throw ValidationException::withMessages([
                'code' => "Kode baru bisa diminta lagi dalam {$wait}.",
            ]);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put(self::codeCacheKey($user), Hash::make($code), self::SETUP_CODE_TTL);
        // Kode baru = jatah tebakan baru; batas kirim di atas yang membatasi totalnya.
        RateLimiter::clear(self::attemptLimiterKey($user));

        try {
            $user->notify(new PasswordSetupCodeNotification($code));
        } catch (Throwable $e) {
            Cache::forget(self::codeCacheKey($user));
            report($e);

            throw ValidationException::withMessages([
                'code' => 'Email kode gagal dikirim. Coba lagi beberapa saat lagi.',
            ]);
        }

        RateLimiter::hit($perMinute, 60);
        RateLimiter::hit($perHour, 3600);

        flashMessage('Kode dikirim ke '.self::maskEmail($user->email).'. Berlaku 10 menit.');

        return back();
    }

    /**
     * Pasang kata sandi pertama dengan kode dari sendSetupCode() (TASK_82).
     */
    public function setup(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ], [], ['code' => 'kode']);

        $user = $request->user();
        $this->ensureWithoutPassword($user);

        $cacheKey = self::codeCacheKey($user);
        $attemptKey = self::attemptLimiterKey($user);
        $hash = Cache::get($cacheKey);

        if (! $hash) {
            throw ValidationException::withMessages([
                'code' => 'Kode tidak berlaku lagi. Minta kode baru.',
            ]);
        }

        // Hitung DULU, periksa kemudian: increment atomik, jadi permintaan serentak tak bisa
        // menebak melewati batas.
        $attempts = RateLimiter::hit($attemptKey, self::SETUP_CODE_TTL);

        if ($attempts > self::SETUP_CODE_MAX_ATTEMPTS || ! Hash::check($validated['code'], $hash)) {
            $left = self::SETUP_CODE_MAX_ATTEMPTS - $attempts;
            if ($left <= 0) {
                Cache::forget($cacheKey);
            }

            throw ValidationException::withMessages([
                'code' => $left > 0
                    ? "Kode salah. Sisa {$left} percobaan."
                    : 'Kode salah terlalu sering dan sudah tidak berlaku. Minta kode baru.',
            ]);
        }

        Cache::forget($cacheKey);
        RateLimiter::clear($attemptKey);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        $this->signOutOtherDevices($request);

        try {
            $user->notify(new PasswordCreatedNotification);
        } catch (Throwable $e) {
            // Kata sandinya sudah terpasang; email pemberitahuan yang gagal tak boleh
            // membuatnya tampak gagal di layar.
            report($e);
        }

        flashMessage('Kata sandi dibuat. Kini Anda juga bisa masuk dengan email dan kata sandi.');

        return back();
    }

    /**
     * Ganti/buat sandi = cabut login di perangkat LAIN (TASK_73, OWASP), termasuk token FCM-nya.
     * Perangkat ini tetap masuk & tetap menerima notifikasi: tokennya dan sesinya dikecualikan.
     */
    private function signOutOtherDevices(Request $request): void
    {
        $guard = Auth::guard('web');
        $hadRememberCookie = $request->hasCookie($guard->getRecallerName());

        $request->user()->signOutEverywhere($request->session()->get('fcm_token'), $request->session()->getId());

        // remember_token baru membatalkan cookie "ingat saya" perangkat ini juga. Pasang ulang,
        // kalau tidak HP yang mengganti sandi terlempar keluar setelah sesinya habis - dengan
        // tokennya yang masih terdaftar (persis keluhan asal TASK_73).
        if ($hadRememberCookie) {
            $guard->login($request->user(), true);
        }
    }

    /** Jalur kode hanya untuk akun TANPA kata sandi; yang sudah punya wajib lewat sandi lama. */
    private function ensureWithoutPassword(User $user): void
    {
        if (filled($user->getAuthPassword())) {
            throw ValidationException::withMessages([
                'code' => 'Akun Anda sudah punya kata sandi. Gunakan form Ganti Kata Sandi.',
            ]);
        }
    }

    public static function codeCacheKey(User $user): string
    {
        return 'password-setup:code:'.$user->getKey();
    }

    private static function attemptLimiterKey(User $user): string
    {
        return 'password-setup:attempts:'.$user->getKey();
    }

    private static function sendLimiterKey(User $user, string $window): string
    {
        return 'password-setup:send-'.$window.':'.$user->getKey();
    }

    /** a***@gmail.com - cukup untuk dikenali pemiliknya, tak membeberkan alamat utuh. */
    public static function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($name, 0, 1).'***@'.$domain;
    }
}

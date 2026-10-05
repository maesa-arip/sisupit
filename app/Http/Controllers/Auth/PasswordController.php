<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
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

        // Ganti sandi = cabut login di perangkat LAIN (TASK_73, OWASP), termasuk token FCM-nya.
        // Perangkat ini tetap masuk & tetap menerima notifikasi: tokennya dan sesinya dikecualikan.
        $guard = Auth::guard('web');
        $hadRememberCookie = $request->hasCookie($guard->getRecallerName());

        $user->signOutEverywhere($request->session()->get('fcm_token'), $request->session()->getId());

        // remember_token baru membatalkan cookie "ingat saya" perangkat ini juga. Pasang ulang,
        // kalau tidak HP yang mengganti sandi terlempar keluar setelah sesinya habis - dengan
        // tokennya yang masih terdaftar (persis keluhan asal TASK_73).
        if ($hadRememberCookie) {
            $guard->login($user, true);
        }

        return back();
    }
}

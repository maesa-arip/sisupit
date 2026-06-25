<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Spatie\Permission\Models\Role;

class SocialiteController extends Controller
{
    public function redirectToProvider($provider)
    {
        return Socialite::driver($provider)->redirect();
    }

    public function handleProvideCallback($provider)
    {
        try {

            $user = Socialite::driver($provider)->stateless()->user();
        } catch (Exception $e) {
            return redirect()->back();
        }
        // find or create user and send params user get from socialite and provider
        $authUser = $this->findOrCreateUser($user, $provider);

        // login user
        Auth()->login($authUser, true);

        // setelah login redirect ke dashboard
        return redirect()->route('dashboard');
    }

    /**
     * Login dari aplikasi WebView (native Google Sign-In).
     *
     * Aplikasi Android memunculkan account picker bawaan HP lewat Credential Manager,
     * lalu mengirim Google ID token ke endpoint ini. Token diverifikasi server-side ke
     * Google (memvalidasi signature & masa berlaku), lalu user di-login sehingga cookie
     * sesi ikut tersimpan di WebView. Memakai ulang findOrCreateUser() agar perilaku
     * find/create sama persis dengan alur OAuth redirect biasa.
     */
    public function handleNativeGoogle(Request $request)
    {
        $request->validate([
            'credential' => ['required', 'string'],
        ]);

        try {
            $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $request->input('credential'),
            ]);
        } catch (\Throwable $e) {
            return back()->withErrors(['email' => 'Gagal menghubungi server verifikasi Google. Coba lagi.']);
        }

        if (! $response->ok()) {
            return back()->withErrors(['email' => 'Token Google tidak valid atau sudah kedaluwarsa.']);
        }

        $payload = $response->json();

        // aud HARUS sama dengan Web Client ID kita (cegah token yang diterbitkan untuk app lain).
        $expectedAud = config('services.google.client_id');
        $validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (
            empty($payload['aud']) || $payload['aud'] !== $expectedAud ||
            empty($payload['iss']) || ! in_array($payload['iss'], $validIssuers, true) ||
            empty($payload['sub']) || empty($payload['email']) || ! $emailVerified
        ) {
            return back()->withErrors(['email' => 'Akun Google tidak dapat diverifikasi.']);
        }

        // Bungkus payload sebagai user Socialite agar bisa lewat findOrCreateUser() yang sudah ada.
        $socialUser = (new SocialiteUser())->setRaw($payload)->map([
            'id'       => $payload['sub'],
            'name'     => $payload['name'] ?? $payload['email'],
            'email'    => $payload['email'],
            'nickname' => $payload['given_name'] ?? null,
            'avatar'   => $payload['picture'] ?? null,
        ]);

        $authUser = $this->findOrCreateUser($socialUser, 'google');

        auth()->login($authUser, true);

        return redirect()->route('dashboard');
    }

    public function findOrCreateUser($socialUser, $provider)
    {
        // Get Social Account
        $socialAccount = SocialAccount::where('provider_id', $socialUser->getId())
            ->where('provider_name', $provider)
            ->first();

        // Jika sudah ada
        if ($socialAccount) {
            // return user
            return $socialAccount->user;

            // Jika belum ada
        } else {

            // User berdasarkan email 
            $user = User::where('email', $socialUser->getEmail())->first();

            // Jika Tidak ada user
            if (!$user) {
                // Create user baru
                $user = User::create([
                    'name'  => $socialUser->getName(),
                    'email' => $socialUser->getEmail(),
                    'email_verified_at' => Carbon::now(),
                    'username' => str($socialUser->getNickname() ?? $socialUser->getName())->slug() . '-' . Str::lower(Str::random(6)),
                ])->assignRole('masyarakat');
            }

            // Buat Social Account baru
            $user->socialAccounts()->create([
                'provider_id'   => $socialUser->getId(),
                'provider_name' => $provider
            ]);

            // return user
            return $user;
        }
    }
}
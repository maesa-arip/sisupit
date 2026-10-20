<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\AppleSignIn;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

class SocialiteController extends Controller
{
    public function redirectToProvider($provider)
    {
        return Socialite::driver($provider)->redirect();
    }

    public function handleProvideCallback($provider)
    {
        // \Throwable, BUKAN `Exception` tanpa impor: di namespace ini nama itu berarti
        // App\Http\Controllers\Auth\Exception - kelas yang tak ada - sehingga catch-nya tak pernah
        // cocok dan setiap callback gagal (Batal di layar persetujuan Google, URL callback dibuka
        // ulang, kode kedaluwarsa) jadi halaman 500 (#135). Tujuannya halaman masuk, bukan back():
        // sesudah bolak-balik ke Google, referer tak bisa diandalkan.
        try {
            $user = Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning('Login '.$provider.' gagal di callback: '.$e->getMessage());

            return redirect()->route('login')->withErrors([
                'email' => 'Login dengan Google gagal atau dibatalkan. Silakan coba lagi.',
            ]);
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

        // aud HARUS salah satu Client ID milik kita (cegah token yang diterbitkan untuk app
        // lain). Berupa DAFTAR, bukan nilai tunggal: tiap klien native menerbitkan token
        // dengan aud client-nya sendiri — browser & Android memakai Web Client ID, sedangkan
        // GIDSignIn di iOS memakai iOS Client ID sehingga token iPhone akan selalu ditolak
        // bila dibandingkan dengan satu nilai saja. array_filter() membuang kunci yang belum
        // diisi di .env agar string kosong tidak pernah lolos sebagai aud yang sah.
        $allowedAuds = array_filter([
            config('services.google.client_id'),
            config('services.google.ios_client_id'),
        ]);
        $validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (
            empty($payload['aud']) || ! in_array($payload['aud'], $allowedAuds, true) ||
            empty($payload['iss']) || ! in_array($payload['iss'], $validIssuers, true) ||
            empty($payload['sub']) || empty($payload['email']) || ! $emailVerified
        ) {
            return back()->withErrors(['email' => 'Akun Google tidak dapat diverifikasi.']);
        }

        // Bungkus payload sebagai user Socialite agar bisa lewat findOrCreateUser() yang sudah ada.
        $socialUser = (new SocialiteUser)->setRaw($payload)->map([
            'id' => $payload['sub'],
            'name' => $payload['name'] ?? $payload['email'],
            'email' => $payload['email'],
            'nickname' => $payload['given_name'] ?? null,
            'avatar' => $payload['picture'] ?? null,
        ]);

        $authUser = $this->findOrCreateUser($socialUser, 'google');

        auth()->login($authUser, true);

        return redirect()->route('dashboard');
    }

    /**
     * Login dari aplikasi iOS (Masuk dengan Apple, App Store Guideline 4.8).
     *
     * App mengirim identity token + nonce mentah + authorization code. Nama HANYA dikirim
     * Apple pada otorisasi pertama (dan tidak ada di dalam token), jadi diteruskan app
     * sebagai field terpisah dan dipakai saat akun dibuat. Email boleh berupa alamat relay
     * pribadi @privaterelay.appleid.com - tetap email sah yang meneruskan ke pengguna.
     */
    public function handleNativeApple(Request $request, AppleSignIn $apple)
    {
        $request->validate([
            'id_token' => ['required', 'string'],
            'nonce' => ['required', 'string', 'max:255'],
            'authorization_code' => ['nullable', 'string'],
            'given_name' => ['nullable', 'string', 'max:100'],
            'family_name' => ['nullable', 'string', 'max:100'],
        ]);

        $claims = $apple->verifyIdentityToken($request->input('id_token'), $request->input('nonce'));
        if (! $claims) {
            return back()->withErrors(['email' => 'Akun Apple tidak dapat diverifikasi.']);
        }

        $email = $claims['email'] ?? null;
        $emailVerified = filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $alreadyLinked = SocialAccount::where('provider_id', $claims['sub'])
            ->where('provider_name', 'apple')
            ->exists();

        // Akun baru wajib punya email terverifikasi (kolom unik pencocok akun & tujuan reset
        // sandi). Apple selalu mengirimnya di token, kecuali pengguna mencabut lalu memberi
        // izin lagi tanpa membagikan email - kasus langka, minta coba lewat cara lain.
        if (! $alreadyLinked && (! $email || ! $emailVerified)) {
            return back()->withErrors(['email' => 'Apple tidak membagikan email terverifikasi. Coba masuk dengan email atau Google.']);
        }

        $name = trim($request->input('given_name', '').' '.$request->input('family_name', ''));

        $socialUser = (new SocialiteUser)->setRaw($claims)->map([
            'id' => $claims['sub'],
            'name' => $name !== '' ? $name : 'Pengguna Apple',
            'email' => $email,
            'nickname' => $request->input('given_name') ?: null,
            'avatar' => null,
        ]);

        $authUser = $this->findOrCreateUser($socialUser, 'apple');

        // Disimpan hanya untuk dicabut saat hapus akun. Gagal ditukar = login tetap jalan.
        if ($refreshToken = $apple->exchangeCode((string) $request->input('authorization_code'))) {
            SocialAccount::where('provider_id', $claims['sub'])
                ->where('provider_name', 'apple')
                ->first()
                ?->update(['refresh_token' => $refreshToken]);
        }

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
            if (! $user) {
                // Create user baru
                $user = User::create([
                    'name' => $socialUser->getName(),
                    'email' => $socialUser->getEmail(),
                    'email_verified_at' => Carbon::now(),
                    // Masuk dengan Google = mendaftar sekaligus. Persetujuan Syarat &
                    // Ketentuan disampaikan sebagai keterangan di bawah tombol Google
                    // (halaman Login & Register), jadi waktunya dicatat di sini (TASK_19).
                    'terms_accepted_at' => Carbon::now(),
                    'username' => str($socialUser->getNickname() ?? $socialUser->getName())->slug().'-'.Str::lower(Str::random(6)),
                ])->assignRole('warga');
            }

            // Buat Social Account baru
            $user->socialAccounts()->create([
                'provider_id' => $socialUser->getId(),
                'provider_name' => $provider,
            ]);

            // return user
            return $user;
        }
    }
}

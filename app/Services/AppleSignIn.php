<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Masuk dengan Apple dari aplikasi iOS (App Store Guideline 4.8).
 *
 * Berbeda dengan Google (cukup tanya endpoint tokeninfo), Apple tidak punya endpoint
 * verifikasi: identity token adalah JWT RS256 yang tanda tangannya HARUS diperiksa sendiri
 * terhadap kunci publik Apple (JWKS). firebase/php-jwt sudah ada di vendor (dipakai
 * google/auth lewat kanal FCM) dan memeriksa exp/iat/nbf; sisanya diperiksa di sini.
 */
class AppleSignIn
{
    public const ISSUER = 'https://appleid.apple.com';

    private const KEYS_URL = 'https://appleid.apple.com/auth/keys';

    private const TOKEN_URL = 'https://appleid.apple.com/auth/token';

    private const REVOKE_URL = 'https://appleid.apple.com/auth/revoke';

    /**
     * Klaim identity token yang sudah terverifikasi, atau null bila token tidak sah.
     *
     * $rawNonce = nonce MENTAH dari app; yang dikirim app ke Apple adalah SHA-256-nya, jadi
     * klaim `nonce` harus sama dengan hash nilai ini. Mencegah identity token yang bocor
     * (mis. dari log atau proxy) diputar ulang tanpa nonce pasangannya.
     */
    public function verifyIdentityToken(string $idToken, string $rawNonce): ?array
    {
        $clientId = config('services.apple.client_id');
        if (blank($clientId) || blank($rawNonce)) {
            return null;
        }

        try {
            $claims = (array) JWT::decode($idToken, JWK::parseKeySet($this->publicKeys()));
        } catch (\Throwable $e) {
            // Kunci Apple bisa berganti; satu kali coba ulang dengan JWKS segar sebelum menolak.
            Cache::forget('apple-signin-jwks');
            try {
                $claims = (array) JWT::decode($idToken, JWK::parseKeySet($this->publicKeys()));
            } catch (\Throwable $e) {
                Log::info('Identity token Apple ditolak: '.$e->getMessage());

                return null;
            }
        }

        if (
            ($claims['iss'] ?? null) !== self::ISSUER ||
            ($claims['aud'] ?? null) !== $clientId ||
            empty($claims['sub']) ||
            ! hash_equals(hash('sha256', $rawNonce), (string) ($claims['nonce'] ?? ''))
        ) {
            return null;
        }

        return $claims;
    }

    /**
     * Tukar authorization code (sekali pakai, berlaku 5 menit) dengan refresh token.
     * Null bila kunci Apple belum dikonfigurasi atau Apple menolak - login tetap jalan.
     */
    public function exchangeCode(string $code): ?string
    {
        $secret = $this->clientSecret();
        if (! $secret || blank($code)) {
            return null;
        }

        try {
            $response = Http::asForm()->timeout(10)->post(self::TOKEN_URL, [
                'client_id' => config('services.apple.client_id'),
                'client_secret' => $secret,
                'code' => $code,
                'grant_type' => 'authorization_code',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Gagal menukar kode Apple: '.$e->getMessage());

            return null;
        }

        if (! $response->ok()) {
            Log::warning('Apple menolak penukaran kode: '.$response->body());

            return null;
        }

        return $response->json('refresh_token');
    }

    /**
     * Cabut refresh token saat akun dihapus. Mengembalikan true bila Apple menerima.
     * Kegagalan TIDAK menggagalkan penghapusan akun - hanya dicatat.
     */
    public function revoke(string $refreshToken): bool
    {
        $secret = $this->clientSecret();
        if (! $secret) {
            Log::warning('Token Apple tidak dicabut: APPLE_TEAM_ID/KEY_ID/PRIVATE_KEY belum diisi.');

            return false;
        }

        try {
            $response = Http::asForm()->timeout(10)->post(self::REVOKE_URL, [
                'client_id' => config('services.apple.client_id'),
                'client_secret' => $secret,
                'token' => $refreshToken,
                'token_type_hint' => 'refresh_token',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Gagal mencabut token Apple: '.$e->getMessage());

            return false;
        }

        if (! $response->ok()) {
            Log::warning('Apple menolak pencabutan token: '.$response->body());

            return false;
        }

        return true;
    }

    /** JWKS Apple, di-cache sejam - dipanggil di setiap login. */
    private function publicKeys(): array
    {
        return Cache::remember('apple-signin-jwks', now()->addHour(), function () {
            return Http::timeout(10)->get(self::KEYS_URL)->throw()->json();
        });
    }

    /**
     * client_secret Apple = JWT ES256 yang ditandatangani kunci .p8 "Sign in with Apple".
     * Dibuat per permintaan (murah), berlaku 5 menit.
     */
    private function clientSecret(): ?string
    {
        $teamId = config('services.apple.team_id');
        $keyId = config('services.apple.key_id');
        $privateKey = config('services.apple.private_key');

        if (blank($teamId) || blank($keyId) || blank($privateKey)) {
            return null;
        }

        $now = time();

        return JWT::encode([
            'iss' => $teamId,
            'iat' => $now,
            'exp' => $now + 300,
            'aud' => self::ISSUER,
            'sub' => config('services.apple.client_id'),
        ], str_replace('\n', "\n", $privateKey), 'ES256', $keyId);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileComplete
{
    /**
     * Rute yang tetap boleh diakses meski profil belum lengkap, agar tidak terjadi
     * redirect loop dan agar halaman lengkapi profil sendiri bisa memanggil dependensinya
     * (geocode proxy, lookup wilayah, logout).
     */
    private const EXEMPT_ROUTE_PATTERNS = [
        'profile.*',
        'logout',
        'verification.*',
        'password.*',
        'api.geocode.*',
        'api.regions.*',
    ];

    /**
     * Fallback berbasis path untuk rute yang sengaja tidak diberi nama (mis. POST
     * confirm-password bawaan Breeze), supaya tetap bisa dikecualikan tanpa nama rute.
     */
    private const EXEMPT_PATH_PATTERNS = [
        'confirm-password',
    ];

    /**
     * Akun staf (superadmin + peran yurisdiksi: admin/petugas/pejabat) dikelola terpusat
     * lewat Admin\UserController (assignRole), bukan lewat pendaftaran mandiri - jadi tidak wajib lewat
     * onboarding ini. Penting untuk petugas: saat diberi yurisdiksi kecamatan/kabupaten/
     * provinsi, Admin\UserController::trimRegionToLevel() sengaja meng-null-kan village_code
     * agar tenant scope berhenti di tingkat itu - tanpa pengecualian ini mereka akan terjebak
     * loop "lengkapi profil sampai desa" (lihat cek village_code di handle()).
     */
    private const EXEMPT_ROLES = ['superadmin', 'admin', 'petugas', 'pejabat'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();

        if ($routeName && $this->isExempt($routeName)) {
            return $next($request);
        }

        if ($request->is(self::EXEMPT_PATH_PATTERNS)) {
            return $next($request);
        }

        if ($user->hasAnyRole(self::EXEMPT_ROLES)) {
            return $next($request);
        }

        if (is_null($user->phone) || is_null($user->village_code)) {
            return redirect()->route('profile.complete');
        }

        return $next($request);
    }

    private function isExempt(string $routeName): bool
    {
        foreach (self::EXEMPT_ROUTE_PATTERNS as $pattern) {
            if (\Illuminate\Support\Str::is($pattern, $routeName)) {
                return true;
            }
        }

        return false;
    }
}

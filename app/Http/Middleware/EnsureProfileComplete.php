<?php

namespace App\Http\Middleware;

use App\Models\User;
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
        // Dropdown banjar di halaman lengkapi-profil membaca endpoint ini. Tanpa pengecualian,
        // middleware ini memantulkannya balik ke /complete-profile dan dropdown-nya kosong
        // selamanya — tanpa galat apa pun di layar. Ditemukan oleh test, bukan oleh mata.
        'api.banjars',
        'api.banjars.usul',
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
     *
     * Daftarnya sengaja menunjuk User::CENTRALLY_MANAGED_ROLES (= STAFF_ROLES + `opd`, TASK_27)
     * agar aturan "akun ini diberi wilayah oleh admin, bukan mengisi sendiri" hanya punya satu
     * sumber. Perhatikan bahwa itu BUKAN STAFF_ROLES: peran `opd` sengaja tidak ikut ke sana
     * supaya kolom wilayahnya yang kosong tidak diartikan "yurisdiksi nasional" oleh
     * scopeNotifiableForReport (#56).
     */
    private const EXEMPT_ROLES = User::CENTRALLY_MANAGED_ROLES;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
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

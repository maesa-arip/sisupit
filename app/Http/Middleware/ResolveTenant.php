<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolusi tenant per request (TASK_17). Menentukan "wajah publik" dari SUBDOMAIN Host:
 * badung.sisupit.com → tenant Badung; apex/unknown → Tenant::default() (Denpasar, kosmetik).
 * Hasil disimpan di container (`currentTenant()`), dipakai shared prop Inertia + Spotlight.
 *
 * CATATAN: ini TIDAK menyentuh Tenantable (scoping data user login tetap by region user).
 * Fail-safe: Tenant::* menangkap error DB sendiri, jadi request tetap jalan bila tabel
 * tenants belum ter-migrate/seed.
 */
class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::resolveFromHost($request->getHost()) ?? Tenant::default();
        app()->instance('currentTenant', $tenant);

        return $next($request);
    }
}

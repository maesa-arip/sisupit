<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MessageType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TenantRequest;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Throwable;

/**
 * CRUD Tenant per kabupaten/kota (TASK_17). Superadmin-only (lihat routes/admin.php):
 * identitas publik lintas-tenant, sekelas Announcement/Setting/RBAC. Admin wilayah tidak
 * boleh mendefinisikan ulang instansi/pejabat kabupaten lain.
 */
class TenantController extends Controller
{
    public function index(Request $request): Response
    {
        $tenants = Tenant::query()
            ->filter($request->only('search'))
            ->sorting($request->only(['field', 'direction']))
            ->paginate(10)
            ->withQueryString();

        // Lampirkan nama kota (city_code → indonesia_cities.name) hanya untuk tampilan tabel.
        $cityNames = DB::table('indonesia_cities')
            ->whereIn('code', collect($tenants->items())->pluck('city_code')->all())
            ->pluck('name', 'code');

        $tenants->getCollection()->transform(function ($tenant) use ($cityNames) {
            $tenant->city_name = $cityNames[$tenant->city_code] ?? $tenant->city_code;

            return $tenant;
        });

        return inertia('Admin/Tenants/Index', [
            'tenants' => $tenants,
            'filters' => $request->only(['search']),
            'page_settings' => [
                'title' => 'Instansi / Kabupaten',
                'subtitle' => 'Kelola identitas publik tiap Damkar kabupaten: nama instansi, pejabat, nomor darurat, & subdomain.',
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Admin/Tenants/Form', [
            'tenant' => null,
            'provinces' => DB::table('indonesia_provinces')->orderBy('name')->get(['code', 'name']),
            'cities' => [],
            'app_base_domain' => $this->baseDomain(),
            'page_settings' => [
                'title' => 'Tambah Instansi / Kabupaten',
                'subtitle' => 'Daftarkan kabupaten/kota baru. Klik simpan setelah selesai.',
                'method' => 'POST',
                'action' => route('admin.tenants.store'),
            ],
        ]);
    }

    public function store(TenantRequest $request): RedirectResponse
    {
        try {
            Tenant::create([
                ...$request->validated(),
                'pejabat_foto' => (new Tenant)->upload_file($request, 'pejabat_foto', 'tenants'),
            ]);

            Tenant::flushResolutionCache();
            flashMessage(MessageType::CREATED->message('tenant'));

            return to_route('admin.tenants.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message($e->getMessage()), 'error');

            return to_route('admin.tenants.index');
        }
    }

    public function edit(Tenant $tenant): Response
    {
        $provinceCode = $tenant->province_code
            ?: DB::table('indonesia_cities')->where('code', $tenant->city_code)->value('province_code');

        return inertia('Admin/Tenants/Form', [
            'tenant' => $tenant,
            'provinces' => DB::table('indonesia_provinces')->orderBy('name')->get(['code', 'name']),
            'cities' => $provinceCode
                ? DB::table('indonesia_cities')->where('province_code', $provinceCode)->orderBy('name')->get(['code', 'name'])
                : [],
            'app_base_domain' => $this->baseDomain(),
            'page_settings' => [
                'title' => 'Edit Instansi / Kabupaten',
                'subtitle' => 'Perbarui identitas publik kabupaten ini. Klik simpan setelah selesai.',
                'method' => 'PUT',
                'action' => route('admin.tenants.update', $tenant),
            ],
        ]);
    }

    public function update(TenantRequest $request, Tenant $tenant): RedirectResponse
    {
        try {
            $oldSubdomain = $tenant->subdomain;
            $oldCity = $tenant->city_code;

            $tenant->update([
                ...$request->validated(),
                'pejabat_foto' => $tenant->update_file($request, $tenant, 'pejabat_foto', 'tenants'),
            ]);

            $this->forgetResolution($oldSubdomain, $oldCity, $tenant);
            flashMessage(MessageType::UPDATED->message('tenant'));

            return to_route('admin.tenants.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message($e->getMessage()), 'error');

            return to_route('admin.tenants.index');
        }
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        try {
            $subdomain = $tenant->subdomain;
            $city = $tenant->city_code;
            $tenant->delete();

            $this->forgetResolution($subdomain, $city, $tenant);
            flashMessage(MessageType::DELETED->message('tenant'));

            return to_route('admin.tenants.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message($e->getMessage()), 'error');

            return to_route('admin.tenants.index');
        }
    }

    /** Buang seluruh kunci cache resolusi yang mungkin menyentuh tenant ini. */
    private function forgetResolution(?string $oldSubdomain, ?string $oldCity, Tenant $tenant): void
    {
        foreach (array_unique(array_filter([$oldSubdomain, $tenant->subdomain])) as $sub) {
            Cache::forget("tenant:subdomain:{$sub}");
        }
        foreach (array_unique(array_filter([$oldCity, $tenant->city_code])) as $code) {
            Cache::forget("tenant:city:{$code}");
        }
        Tenant::flushResolutionCache();
    }

    private function baseDomain(): string
    {
        return (string) (config('services.tenant.base_domain')
            ?: parse_url((string) config('app.url'), PHP_URL_HOST)
            ?: 'sisupit.com');
    }
}

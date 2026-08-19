<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hydrant;
use App\Models\HydrantWarga;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class HydrantController extends Controller
{
    public function index(Request $request)
    {
        $query = Hydrant::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('address', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        $hydrants = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Hydrants/Index', [
            // Halaman ini melayani DUA route (hydrant resmi & hydrant warga) dengan komponen
            // React yang sama; `variant` yang menentukan judul, warna, dan route tujuan tombol.
            'variant' => 'resmi',
            // Jumlah KEDUA daftar dikirim supaya tab bisa menampilkan angkanya. Ini yang
            // paling cepat memberi tahu pengguna bahwa keduanya dataset berbeda, bukan
            // sekadar filter. Ter-scope Tenantable, jadi angkanya sesuai wilayah admin.
            'counts' => [
                'resmi' => Hydrant::count(),
                'warga' => HydrantWarga::count(),
            ],
            'hydrants' => $hydrants,
            'filters' => $request->only(['search', 'status']),
            'tenant_location' => $this->getTenantDefaultLocation(),
        ]);
    }

    public function create()
    {
        $user = auth()->user();

        $provinces = [];
        $cities = [];
        $districts = [];

        if (! $user->province_code) {
            $provinces = DB::table('indonesia_provinces')->get();
        } elseif (! $user->city_code) {
            $cities = DB::table('indonesia_cities')->where('province_code', $user->province_code)->get();
        } else {
            $districts = DB::table('indonesia_districts')->where('city_code', $user->city_code)->get();
        }

        return Inertia::render('Admin/Hydrants/Create', [
            'variant' => 'resmi',
            'tenant_location' => $this->getTenantDefaultLocation(),
            'provinces' => $provinces,
            'cities' => $cities,
            'districts' => $districts,
            'admin_region_names' => $this->getAdminRegionNames($user), // TAMBAHAN NAMA WILAYAH
            'admin_level' => [
                'province_code' => $user->province_code,
                'city_code' => $user->city_code,
                'district_code' => $user->district_code,
                'village_code' => $user->village_code,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        $user = auth()->user();
        $validated['city_code'] = $user->city_code ?? $request->city_code;
        $validated['district_code'] = $user->district_code ?? $request->district_code;
        $validated['village_code'] = $user->village_code ?? $request->village_code;

        Hydrant::create($validated);

        return redirect()->route('admin.hydrants.index')->with('success', 'Hydrant berhasil ditambahkan.');
    }

    public function edit(Hydrant $hydrant)
    {
        $user = auth()->user();

        $provinces = [];
        $cities = [];
        $districts = [];
        $hydrantProvinceCode = null;

        if (! $user->province_code) {
            $provinces = DB::table('indonesia_provinces')->get();
            if ($hydrant->city_code) {
                $hydrantProvinceCode = DB::table('indonesia_cities')->where('code', $hydrant->city_code)->value('province_code');
                $cities = DB::table('indonesia_cities')->where('province_code', $hydrantProvinceCode)->get();
                $districts = DB::table('indonesia_districts')->where('city_code', $hydrant->city_code)->get();
            }
        } elseif (! $user->city_code) {
            $cities = DB::table('indonesia_cities')->where('province_code', $user->province_code)->get();
            if ($hydrant->city_code) {
                $districts = DB::table('indonesia_districts')->where('city_code', $hydrant->city_code)->get();
            }
        } else {
            $districts = DB::table('indonesia_districts')->where('city_code', $user->city_code)->get();
        }

        return Inertia::render('Admin/Hydrants/Edit', [
            'variant' => 'resmi',
            'hydrant' => $hydrant,
            'hydrant_province' => $hydrantProvinceCode,
            'tenant_location' => $this->getTenantDefaultLocation(),
            'provinces' => $provinces,
            'cities' => $cities,
            'districts' => $districts,
            'admin_region_names' => $this->getAdminRegionNames($user), // TAMBAHAN NAMA WILAYAH
            'admin_level' => [
                'province_code' => $user->province_code,
                'city_code' => $user->city_code,
                'district_code' => $user->district_code,
                'village_code' => $user->village_code,
            ],
        ]);
    }

    public function update(Request $request, Hydrant $hydrant)
    {
        $validated = $this->validateData($request);

        $user = auth()->user();
        $validated['city_code'] = $user->city_code ?? $request->city_code;
        $validated['district_code'] = $user->district_code ?? $request->district_code;
        $validated['village_code'] = $user->village_code ?? $request->village_code;

        $hydrant->update($validated);

        return redirect()->route('admin.hydrants.index')->with('success', 'Data Hydrant berhasil diperbarui.');
    }

    public function destroy(Hydrant $hydrant)
    {
        $hydrant->delete();

        return redirect()->back()->with('success', 'Hydrant berhasil dihapus.');
    }

    /**
     * Aturan validasi bersama store & update — mengikuti pola PompaController::validateData.
     *
     * `debit_lpm` OPSIONAL di sini: hydrant resmi dimiliki PDAM/instansi dan angkanya dipegang
     * mereka, bukan Damkar. Yang mewajibkannya adalah HydrantWargaController — di sanalah rekap
     * debit per desa bergantung pada kelengkapan data.
     */
    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'status' => 'required|in:Aktif,Perbaikan',
            'type' => 'required|in:Stick,Jongkok',
            'water_pressure' => ['nullable', Rule::in(Hydrant::WATER_PRESSURES)],
            'debit_lpm' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'city_code' => 'nullable|string',
            'district_code' => 'nullable|string',
            'village_code' => 'nullable|string',
        ]);
    }

    private function getTenantDefaultLocation()
    {
        $user = auth()->user();

        return [
            'lat' => $user->lat ?? -8.650000,
            'lng' => $user->lng ?? 115.220000,
        ];
    }

    // FUNGSI BARU: Untuk Mengambil Nama Wilayah Real Admin
    private function getAdminRegionNames($user)
    {
        return [
            'province' => $user->province_code ? DB::table('indonesia_provinces')->where('code', $user->province_code)->value('name') : null,
            'city' => $user->city_code ? DB::table('indonesia_cities')->where('code', $user->city_code)->value('name') : null,
            'district' => $user->district_code ? DB::table('indonesia_districts')->where('code', $user->district_code)->value('name') : null,
            'village' => $user->village_code ? DB::table('indonesia_villages')->where('code', $user->village_code)->value('name') : null,
        ];
    }
}

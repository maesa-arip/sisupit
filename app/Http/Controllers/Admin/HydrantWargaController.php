<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hydrant;
use App\Models\HydrantWarga;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * CRUD hydrant swadaya warga — kembaran `HydrantController` dengan tabel & route sendiri.
 *
 * PENGECUALIAN ATURAN disetujui user 2026-08-19, lihat `prompt/docs/PENGECUALIAN_ATURAN.md` #1.
 * Controller ini sengaja menyalin bentuk `HydrantController` (dan `PompaController`,
 * `PosPemadamController` yang memang sudah kembar sejak dulu) alih-alih mengangkatnya jadi
 * kelas induk — mengikuti pola CRUD fasilitas yang sudah ada di repo ini. Yang TIDAK
 * diduplikasi: komponen React-nya (satu form, dua route, dibedakan prop `variant`).
 *
 * Beda nyata dari kembarannya hanya SATU: di sini `debit_lpm` WAJIB diisi, karena rekap
 * "berapa total debit air di desa ini" (`Admin\PompaController::debitSummary`) berdiri di atas
 * kelengkapan data ini. Untuk hydrant resmi angkanya dipegang PDAM, jadi di sana opsional.
 */
class HydrantWargaController extends Controller
{
    public function index(Request $request)
    {
        $query = HydrantWarga::query();

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
            // Komponen halaman sama dengan hydrant resmi; `variant` yang membedakan judul,
            // warna, dan route tujuan tombol — sehingga bagi pengguna keduanya terasa satu
            // kesatuan dengan dua tab.
            'variant' => 'warga',
            // Lihat catatan di HydrantController::index — angka di tab yang membuat pengguna
            // langsung paham ini dua daftar terpisah.
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
            'variant' => 'warga',
            'tenant_location' => $this->getTenantDefaultLocation(),
            'provinces' => $provinces,
            'cities' => $cities,
            'districts' => $districts,
            'admin_region_names' => $this->getAdminRegionNames($user),
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

        HydrantWarga::create($validated);

        return redirect()->route('admin.hydrant-warga.index')->with('success', 'Hydrant warga berhasil ditambahkan.');
    }

    public function edit(HydrantWarga $hydrant_warga)
    {
        $user = auth()->user();

        $provinces = [];
        $cities = [];
        $districts = [];
        $hydrantProvinceCode = null;

        if (! $user->province_code) {
            $provinces = DB::table('indonesia_provinces')->get();
            if ($hydrant_warga->city_code) {
                $hydrantProvinceCode = DB::table('indonesia_cities')->where('code', $hydrant_warga->city_code)->value('province_code');
                $cities = DB::table('indonesia_cities')->where('province_code', $hydrantProvinceCode)->get();
                $districts = DB::table('indonesia_districts')->where('city_code', $hydrant_warga->city_code)->get();
            }
        } elseif (! $user->city_code) {
            $cities = DB::table('indonesia_cities')->where('province_code', $user->province_code)->get();
            if ($hydrant_warga->city_code) {
                $districts = DB::table('indonesia_districts')->where('city_code', $hydrant_warga->city_code)->get();
            }
        } else {
            $districts = DB::table('indonesia_districts')->where('city_code', $user->city_code)->get();
        }

        return Inertia::render('Admin/Hydrants/Edit', [
            'variant' => 'warga',
            'hydrant' => $hydrant_warga,
            'hydrant_province' => $hydrantProvinceCode,
            'tenant_location' => $this->getTenantDefaultLocation(),
            'provinces' => $provinces,
            'cities' => $cities,
            'districts' => $districts,
            'admin_region_names' => $this->getAdminRegionNames($user),
            'admin_level' => [
                'province_code' => $user->province_code,
                'city_code' => $user->city_code,
                'district_code' => $user->district_code,
                'village_code' => $user->village_code,
            ],
        ]);
    }

    public function update(Request $request, HydrantWarga $hydrant_warga)
    {
        $validated = $this->validateData($request);

        $user = auth()->user();
        $validated['city_code'] = $user->city_code ?? $request->city_code;
        $validated['district_code'] = $user->district_code ?? $request->district_code;
        $validated['village_code'] = $user->village_code ?? $request->village_code;

        $hydrant_warga->update($validated);

        return redirect()->route('admin.hydrant-warga.index')->with('success', 'Data hydrant warga berhasil diperbarui.');
    }

    public function destroy(HydrantWarga $hydrant_warga)
    {
        $hydrant_warga->delete();

        return redirect()->back()->with('success', 'Hydrant warga berhasil dihapus.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'status' => 'required|in:Aktif,Perbaikan',
            'type' => 'required|in:Stick,Jongkok',
            // Daftar nilainya sengaja dirujuk dari Hydrant, bukan disalin — dua tabel boleh
            // terpisah, tapi kosakata kondisi airnya harus tetap satu.
            'water_pressure' => ['nullable', Rule::in(Hydrant::WATER_PRESSURES)],
            'debit_lpm' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'city_code' => 'nullable|string',
            'district_code' => 'nullable|string',
            'village_code' => 'nullable|string',
        ], [
            'debit_lpm.required' => 'Debit air wajib diisi — angka ini dipakai menghitung total debit air per desa.',
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

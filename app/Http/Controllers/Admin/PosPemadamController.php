<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PosPemadam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosPemadamController extends Controller
{
    public function index(Request $request)
    {
        $query = PosPemadam::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('address', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        $stations = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/FireStations/Index', [
            'stations' => $stations,
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

        return Inertia::render('Admin/FireStations/Create', [
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

        PosPemadam::create($this->withTenantCodes($validated, $request));

        return redirect()->route('admin.fire-stations.index')->with('success', 'Pos Pemadam berhasil ditambahkan.');
    }

    public function edit(PosPemadam $fire_station)
    {
        $user = auth()->user();

        $provinces = [];
        $cities = [];
        $districts = [];
        $stationProvinceCode = null;

        if (! $user->province_code) {
            $provinces = DB::table('indonesia_provinces')->get();
            if ($fire_station->city_code) {
                $stationProvinceCode = DB::table('indonesia_cities')->where('code', $fire_station->city_code)->value('province_code');
                $cities = DB::table('indonesia_cities')->where('province_code', $stationProvinceCode)->get();
                $districts = DB::table('indonesia_districts')->where('city_code', $fire_station->city_code)->get();
            }
        } elseif (! $user->city_code) {
            $cities = DB::table('indonesia_cities')->where('province_code', $user->province_code)->get();
            if ($fire_station->city_code) {
                $districts = DB::table('indonesia_districts')->where('city_code', $fire_station->city_code)->get();
            }
        } else {
            $districts = DB::table('indonesia_districts')->where('city_code', $user->city_code)->get();
        }

        return Inertia::render('Admin/FireStations/Edit', [
            'station' => $fire_station,
            'station_province' => $stationProvinceCode,
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

    public function update(Request $request, PosPemadam $fire_station)
    {
        $validated = $this->validateData($request);

        $fire_station->update($this->withTenantCodes($validated, $request));

        return redirect()->route('admin.fire-stations.index')->with('success', 'Data Pos Pemadam berhasil diperbarui.');
    }

    public function destroy(PosPemadam $fire_station)
    {
        $fire_station->delete();

        return redirect()->back()->with('success', 'Pos Pemadam berhasil dihapus.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'status' => 'required|in:Aktif,Perbaikan',
            'type' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'vehicle_count' => 'nullable|integer|min:0',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'province_code' => 'nullable|string',
            'city_code' => 'nullable|string',
            'district_code' => 'nullable|string',
            'village_code' => 'nullable|string',
        ]);
    }

    private function withTenantCodes(array $validated, Request $request): array
    {
        $user = auth()->user();
        $validated['province_code'] = $user->province_code ?? $request->province_code;
        $validated['city_code'] = $user->city_code ?? $request->city_code;
        $validated['district_code'] = $user->district_code ?? $request->district_code;
        $validated['village_code'] = $user->village_code ?? $request->village_code;

        return $validated;
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

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PosPemadam;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * CRUD katalog armada/unit (TASK_09 Fase 1). Ter-scope wilayah via Tenantable (model Unit).
 * Pola dasar mengikuti Admin\PompaController, tanpa peta/lat-lng (unit = aset, lokasi
 * lapangan dipegang tracking petugas).
 */
class UnitController extends Controller
{
    private const TYPES = ['Truk Pemadam', 'Mobil Tangki', 'Rescue', 'Ambulans', 'Komando', 'Lainnya'];

    public function index(Request $request)
    {
        $query = Unit::query()->with('posPemadam:id,name');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        return Inertia::render('Admin/Units/Index', [
            'units' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Units/Create', [
            'pos_options' => PosPemadam::select('id', 'name')->orderBy('name')->get(),
            'type_options' => self::TYPES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        Unit::create($this->withTenantCodes($validated));

        return redirect()->route('admin.units.index')->with('success', 'Unit berhasil ditambahkan.');
    }

    public function edit(Unit $unit)
    {
        return Inertia::render('Admin/Units/Edit', [
            'unit' => $unit,
            'pos_options' => PosPemadam::select('id', 'name')->orderBy('name')->get(),
            'type_options' => self::TYPES,
        ]);
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $this->validateData($request);

        $unit->update($this->withTenantCodes($validated));

        return redirect()->route('admin.units.index')->with('success', 'Data unit berhasil diperbarui.');
    }

    public function destroy(Unit $unit)
    {
        $unit->delete();

        return redirect()->back()->with('success', 'Unit berhasil dihapus.');
    }

    private function validateData(Request $request): array
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            // status dispatched dikelola lewat alur insiden, bukan CRUD.
            'status' => ['required', Rule::in(['available', 'maintenance'])],
            'pos_pemadam_id' => 'nullable|integer',
        ]);

        // Homebase pos wajib berada dalam yurisdiksi admin (Tenantable). Bila id di luar
        // wilayah/ tak ada, null-kan agar tak menautkan aset lintas wilayah.
        if (! empty($validated['pos_pemadam_id']) && ! PosPemadam::whereKey($validated['pos_pemadam_id'])->exists()) {
            $validated['pos_pemadam_id'] = null;
        }

        return $validated;
    }

    // Yurisdiksi admin menentukan wilayah unit (admin wilayah tak bisa simpan unit di luar
    // wewenangnya). Admin nasional (tanpa kode) → unit global.
    private function withTenantCodes(array $validated): array
    {
        $user = auth()->user();
        $validated['province_code'] = $user->province_code;
        $validated['city_code'] = $user->city_code;
        $validated['district_code'] = $user->district_code;
        $validated['village_code'] = $user->village_code;

        return $validated;
    }
}

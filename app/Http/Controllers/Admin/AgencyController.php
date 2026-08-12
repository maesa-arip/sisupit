<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * CRUD master OPD/instansi terkait (TASK_27). Ter-scope wilayah via Tenantable (model Agency).
 * Pola dasar mengikuti Admin\UnitController.
 *
 * Halaman inilah yang membuat fitur "OPD terkait" dinamis: menambah instansi baru, mengubah
 * jenis kejadian yang membuatnya tercentang otomatis, dan menyalakan konfirmasi berkondisi
 * semuanya terjadi di sini — bukan lewat deploy kode.
 */
class AgencyController extends Controller
{
    private const CATEGORIES = ['Kebencanaan', 'Utilitas', 'Kesehatan', 'Keamanan', 'Lingkungan', 'Lainnya'];

    public function index(Request $request)
    {
        $agencies = Agency::query()
            ->filter($request->only(['search']))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Agencies/Index', [
            'agencies' => $agencies,
            'filters' => $request->only(['search']),
            'incident_types' => Report::INCIDENT_TYPES,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Agencies/Create', [
            'category_options' => self::CATEGORIES,
            'incident_types' => Report::INCIDENT_TYPES,
        ]);
    }

    public function store(Request $request)
    {
        Agency::create($this->withTenantCodes($this->validateData($request)));

        return redirect()->route('admin.agencies.index')->with('success', 'OPD berhasil ditambahkan.');
    }

    public function edit(Agency $agency)
    {
        return Inertia::render('Admin/Agencies/Edit', [
            'agency' => $agency,
            'category_options' => self::CATEGORIES,
            'incident_types' => Report::INCIDENT_TYPES,
        ]);
    }

    public function update(Request $request, Agency $agency)
    {
        $agency->update($this->withTenantCodes($this->validateData($request)));

        return redirect()->route('admin.agencies.index')->with('success', 'Data OPD berhasil diperbarui.');
    }

    public function destroy(Agency $agency)
    {
        // SoftDeletes: pelibatan OPD ini di insiden lama tetap terbaca lewat kolom snapshot
        // di report_agencies, jadi menghapus master tidak menghilangkan riwayat.
        $agency->delete();

        return redirect()->back()->with('success', 'OPD berhasil dihapus.');
    }

    private function validateData(Request $request): array
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'default_incident_types' => 'nullable|array',
            'default_incident_types.*' => ['string', Rule::in(Report::INCIDENT_TYPES)],
            'requires_confirmation' => 'boolean',
            'confirmation_label' => 'nullable|string|max:255',
        ]);

        // Konfirmasi berkondisi tanpa kalimatnya = tombol tanpa arti bagi petugas maupun OPD.
        // Divalidasi di sini (bukan di frontend saja) supaya aturannya tetap berlaku pada
        // request langsung.
        if (! empty($validated['requires_confirmation']) && empty($validated['confirmation_label'])) {
            throw ValidationException::withMessages([
                'confirmation_label' => 'Isi kalimat konfirmasi yang harus dipenuhi OPD ini (mis. "Listrik sudah dipadamkan di lokasi kejadian").',
            ]);
        }

        return $validated;
    }

    // Yurisdiksi admin menentukan wilayah OPD (admin wilayah tak bisa menyimpan OPD di luar
    // wewenangnya). Admin nasional (tanpa kode) → OPD global. Sama persis dengan UnitController.
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

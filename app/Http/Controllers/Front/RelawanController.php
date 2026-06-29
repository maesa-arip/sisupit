<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Village;

class RelawanController extends Controller
{
    public function index(Request $request)
    {
        // Hanya user ber-role 'relawan', dan hanya dalam yurisdiksi petugas/admin
        // yang login (scopeIsAdmin; superadmin lihat semua). Eager load wilayah agar
        // area bisa dirangkai dari nama (bukan kolom mentah yang tidak ada di tabel users).
        $query = User::query()
            ->isAdmin()
            ->whereHas('roles', fn ($q) => $q->where('name', 'relawan'))
            ->with(['city', 'district', 'village']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        // Filter wilayah memakai kolom *_code yang sebenarnya ada di tabel users.
        if ($request->filled('kabupaten')) {
            $query->where('city_code', $request->kabupaten);
        }
        if ($request->filled('kecamatan')) {
            $query->where('district_code', $request->kecamatan);
        }
        if ($request->filled('desa')) {
            $query->where('village_code', $request->desa);
        }

        // Filter keahlian: kolom skills berupa JSON array (cast 'array').
        // whereJsonContains mencari relawan yang punya keahlian terpilih.
        if ($request->filled('keahlian')) {
            $query->whereJsonContains('skills', $request->keahlian);
        }

        $volunteers = $query->latest()->paginate(12)->withQueryString();

        $volunteers->getCollection()->transform(fn (User $user) => $this->transformList($user));

        return Inertia::render('Volunteers/Index', [
            'volunteers' => $volunteers,
            'filterOptions' => $this->regionFilterOptions(),
            'filters' => $request->only(['search', 'kabupaten', 'kecamatan', 'desa', 'keahlian']),
        ]);
    }

    public function show($id)
    {
        // isAdmin() membatasi ke yurisdiksi petugas/admin yang login — relawan di
        // luar wilayah → 404 (cegah akses detail lintas yurisdiksi via ID).
        $user = User::query()
            ->isAdmin()
            ->whereHas('roles', fn ($q) => $q->where('name', 'relawan'))
            ->with(['city', 'district', 'village'])
            ->findOrFail($id);

        $volunteer = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->is_standby ? 'Siaga' : 'Nonaktif',
            'kabupaten' => $user->city?->name ?? '-',
            'kecamatan' => $user->district?->name ?? '-',
            'desa' => $user->village?->name ?? '-',
            'address' => $user->address ?? 'Tidak ada detail alamat.',
            'join_date' => Carbon::parse($user->created_at)->translatedFormat('d F Y'),
            'avatar' => $user->avatar ? asset('storage/'.$user->avatar) : null,
            'skills' => $user->skills ?? [],
            'reports_handled' => $user->reports()->count(),
        ];

        return Inertia::render('Volunteers/Show', [
            'volunteer' => $volunteer,
        ]);
    }

    /**
     * Rangkai data kartu relawan untuk daftar.
     */
    private function transformList(User $user): array
    {
        $area = $user->district?->name && $user->city?->name
            ? "Kec. {$user->district->name}, {$user->city->name}"
            : ($user->city?->name ?? $user->address ?? 'Lokasi tidak diketahui');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'area' => $area,
            'skills' => $user->skills ?? [],
            'avatar' => $user->avatar ? asset('storage/'.$user->avatar) : null,
            'status' => $user->is_standby ? 'Siaga' : 'Nonaktif',
        ];
    }

    /**
     * Opsi dropdown filter. Wilayah dibatasi hanya yang benar-benar dihuni
     * relawan dalam yurisdiksi (agar tak menampilkan ribuan wilayah kosong);
     * keahlian memakai master penuh (Skill::options) seperti editor dashboard.
     */
    private function regionFilterOptions(): array
    {
        $relawan = User::query()
            ->isAdmin()
            ->whereHas('roles', fn ($q) => $q->where('name', 'relawan'));

        $cityCodes = (clone $relawan)->whereNotNull('city_code')->distinct()->pluck('city_code');
        $districtCodes = (clone $relawan)->whereNotNull('district_code')->distinct()->pluck('district_code');
        $villageCodes = (clone $relawan)->whereNotNull('village_code')->distinct()->pluck('village_code');

        // Keahlian: tampilkan seluruh master keahlian (sama dgn editor di dashboard
        // relawan), bukan hanya yang sedang terpakai, agar filter lengkap.
        $keahlian = Skill::options();

        return [
            'kabupaten' => City::whereIn('code', $cityCodes)->orderBy('name')->get(['code', 'name'])
                ->map(fn ($r) => ['value' => $r->code, 'label' => $r->name])->all(),
            'kecamatan' => District::whereIn('code', $districtCodes)->orderBy('name')->get(['code', 'name'])
                ->map(fn ($r) => ['value' => $r->code, 'label' => $r->name])->all(),
            'desa' => Village::whereIn('code', $villageCodes)->orderBy('name')->get(['code', 'name'])
                ->map(fn ($r) => ['value' => $r->code, 'label' => $r->name])->all(),
            'keahlian' => array_map(fn ($s) => ['value' => $s, 'label' => $s], $keahlian),
        ];
    }
}

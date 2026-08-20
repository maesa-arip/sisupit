<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HydrantWarga;
use App\Models\Pompa;
use App\Traits\ResolvesFacilityJurisdiction;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PompaController extends Controller
{
    use ResolvesFacilityJurisdiction;

    /**
     * Daftar SKKL (Sistem Ketahanan Kebakaran Lingkungan) = DUA sumber dalam satu halaman
     * sejak TASK_30: aset pompa (tabel `pompas`) + hydrant swadaya warga (tabel
     * `hydrant_wargas`). Hydrant warga tetap DISUNTING di menu Hydrant Warga — di sini ia
     * hanya dibaca, dan tombol editnya menunjuk balik ke form asalnya.
     *
     * Penggabungan dilakukan di PHP, bukan lewat UNION SQL, dengan alasan yang disengaja:
     * query Eloquent biasa dijamin membawa global scope `Tenantable`, sedangkan sub-query
     * union gampang lolos darinya — kebocoran data lintas wilayah persis jenis bug yang
     * pernah terjadi di repo ini (FINDINGS #32). Jumlah fasilitas per kabupaten ada di
     * kisaran puluhan, jadi biayanya tak berarti.
     */
    public function index(Request $request)
    {
        $rows = $this->filtered(Pompa::query(), $request)->get()->map->toSkklRow()
            ->concat($this->filtered(HydrantWarga::query(), $request)->get()->map->toSkklRow())
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('Admin/Pumps/Index', [
            'pumps' => $this->paginateRows($rows, $request),
            'summary' => $this->waterSummary($rows),
            'filters' => $request->only(['search', 'status']),
            'tenant_location' => $this->getTenantDefaultLocation(),
        ]);
    }

    /** Filter daftar yang berlaku sama untuk kedua sumber (kolom name/address/status identik). */
    private function filtered($query, Request $request)
    {
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('address', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        return $query;
    }

    /**
     * Paginator manual: dua sumber sudah terlanjur disatukan sebagai koleksi, jadi paginasi
     * DB tak bisa dipakai lagi. `query()` disertakan supaya pencarian & filter tidak hilang
     * saat pindah halaman (padanan ->withQueryString()).
     */
    private function paginateRows(Collection $rows, Request $request, int $perPage = 10): LengthAwarePaginator
    {
        $page = LengthAwarePaginator::resolveCurrentPage();

        return new LengthAwarePaginator(
            $rows->forPage($page, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );
    }

    /**
     * Rekap air per desa — menjawab "berapa banyak air yang bisa diandalkan di desa ini" saat
     * menyusun kesiapsiagaan wilayah (TASK_30).
     *
     * DUA angka, bukan satu (permintaan user 2026-08-21). Sampai 2026-08-20 hydrant warga
     * memakai `debit_lpm` dengan satuan yang sengaja disamakan dengan `pompas.capacity_lpm`
     * supaya bisa dijumlahkan. Sejak hydrant warga jadi tandon/groundtank, angkanya adalah
     * KAPASITAS dalam liter — simpanan, bukan aliran. Menjumlahkan 800 lpm dengan 5.000 liter
     * menghasilkan bilangan yang tidak punya arti fisik apa pun namun akan terbaca sebagai
     * debit, jadi keduanya dipisah dan masing-masing membawa satuannya sendiri.
     *
     * Pemisahnya `water_metric` dari `toSkklRow()`, BUKAN `source`: yang menentukan sebuah
     * angka boleh dijumlahkan adalah satuannya, dan menuliskan nama tabel di sini akan pecah
     * begitu ada sumber SKKL ketiga.
     *
     * `unknown_*` sengaja ikut dikirim: total yang menyembunyikan berapa titik yang BELUM
     * didata akan dibaca sebagai angka pasti, padahal ia batas bawah. Aset pompa lama umumnya
     * belum mengisi `capacity_lpm`, jadi kasus ini normal, bukan langka.
     */
    private function waterSummary(Collection $rows): array
    {
        $names = DB::table('indonesia_villages')
            ->whereIn('code', $rows->pluck('village_code')->filter()->unique()->all())
            ->pluck('name', 'code');

        return $rows
            ->groupBy(fn ($row) => $row['village_code'] ?: '')
            ->map(function (Collection $group, $code) use ($names) {
                $flowing = $group->where('water_metric', 'debit');
                $stored = $group->where('water_metric', 'capacity');

                return [
                    'village_code' => $code ?: null,
                    'village' => $code ? ($names[$code] ?? $code) : 'Tanpa data desa',
                    'points' => $group->count(),
                    // Aliran: pompa & aset air bertekanan, liter per menit.
                    'debit_points' => $flowing->count(),
                    'debit_lpm' => $flowing->sum(fn ($row) => (int) ($row['debit_lpm'] ?? 0)),
                    'unknown_debit' => $flowing->whereNull('debit_lpm')->count(),
                    // Simpanan: tandon/groundtank warga, liter.
                    'capacity_points' => $stored->count(),
                    'capacity_liter' => $stored->sum(fn ($row) => (int) ($row['capacity_liter'] ?? 0)),
                    'unknown_capacity' => $stored->whereNull('capacity_liter')->count(),
                ];
            })
            // Desa berair paling banyak di atas. Debit dinilai lebih dulu karena ia yang
            // menentukan kesanggupan memadamkan; kapasitas jadi penentu bila debitnya seri
            // (termasuk seri di angka nol — desa yang hanya punya tandon warga).
            ->sortByDesc(fn (array $row) => [$row['debit_lpm'], $row['capacity_liter']])
            ->values()
            ->all();
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

        return Inertia::render('Admin/Pumps/Create', [
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

        Pompa::create($this->withTenantCodes($validated, $request));

        return redirect()->route('admin.pumps.index')->with('success', 'Aset SKKL berhasil ditambahkan.');
    }

    public function edit(Pompa $pump)
    {
        $user = auth()->user();

        $provinces = [];
        $cities = [];
        $districts = [];
        $pumpProvinceCode = null;

        if (! $user->province_code) {
            $provinces = DB::table('indonesia_provinces')->get();
            if ($pump->city_code) {
                $pumpProvinceCode = DB::table('indonesia_cities')->where('code', $pump->city_code)->value('province_code');
                $cities = DB::table('indonesia_cities')->where('province_code', $pumpProvinceCode)->get();
                $districts = DB::table('indonesia_districts')->where('city_code', $pump->city_code)->get();
            }
        } elseif (! $user->city_code) {
            $cities = DB::table('indonesia_cities')->where('province_code', $user->province_code)->get();
            if ($pump->city_code) {
                $districts = DB::table('indonesia_districts')->where('city_code', $pump->city_code)->get();
            }
        } else {
            $districts = DB::table('indonesia_districts')->where('city_code', $user->city_code)->get();
        }

        return Inertia::render('Admin/Pumps/Edit', [
            'pump' => $pump,
            'pump_province' => $pumpProvinceCode,
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

    public function update(Request $request, Pompa $pump)
    {
        $validated = $this->validateData($request);

        $pump->update($this->withTenantCodes($validated, $request));

        return redirect()->route('admin.pumps.index')->with('success', 'Data aset SKKL berhasil diperbarui.');
    }

    public function destroy(Pompa $pump)
    {
        $pump->delete();

        return redirect()->back()->with('success', 'Aset SKKL berhasil dihapus.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'status' => 'required|in:Aktif,Perbaikan',
            'type' => 'required|string|max:255',
            'capacity_lpm' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'province_code' => 'nullable|string',
            'city_code' => 'nullable|string',
            'district_code' => 'nullable|string',
            'village_code' => 'nullable|string',
        ]);
    }

    // Yurisdiksi admin selalu menang atas input form: admin wilayah tidak bisa menyimpan
    // aset di luar wewenangnya. Untuk level yang belum dikunci, pakai pilihan dari form —
    // tapi pilihan itu wajib masih berada di dalam level di atasnya (lihat trait).
    private function withTenantCodes(array $validated, Request $request): array
    {
        return $this->withJurisdictionCodes($validated, $request);
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

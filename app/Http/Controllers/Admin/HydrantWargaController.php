<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banjar;
use App\Models\Hydrant;
use App\Models\HydrantWarga;
use App\Traits\ResolvesFacilityJurisdiction;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
 * Sejak 2026-08-21 (permintaan user) kosakata formnya BEDA dari hydrant resmi, bukan sekadar
 * beda wajib/opsional: `type` = Sumber Air (Tandon/Groundtank, bukan konstruksi Stick/Jongkok),
 * `status` = sudah/belum dimodifikasi (bukan Aktif/Perbaikan), `water_pressure` tidak ada, dan
 * angka airnya `capacity_liter` (simpanan, liter) bukan `debit_lpm` (aliran, liter/menit).
 * Alasan tiap perubahan ada di migrasi 2026_08_21_100000. `capacity_liter` WAJIB karena rekap
 * air per desa (`waterSummary()` di controller ini, pindahan dari `Admin\PompaController`
 * pada 2026-08-26) berdiri di atas kelengkapan data ini.
 */
class HydrantWargaController extends Controller
{
    use ResolvesFacilityJurisdiction;

    public function index(Request $request)
    {
        // Relasi banjar ikut dimuat supaya daftarnya menampilkan kembali apa yang diisi di
        // form. Kolom yang bisa diisi tapi tak pernah terlihat lagi akan dianggap tidak
        // tersimpan, dan lama-lama berhenti diisi.
        $query = HydrantWarga::query()->with('banjar:id,name');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('address', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        // Rekap dihitung dari SELURUH baris yang lolos filter, bukan dari satu halaman —
        // rekap yang berubah saat pengguna pindah halaman akan terbaca sebagai data yang
        // berubah. Diambil sebelum paginate() supaya filternya persis sama.
        $summary = $this->waterSummary((clone $query)->get());

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
            // Rekap air per desa PINDAH ke sini dari daftar SKKL (permintaan user 2026-08-26)
            // dan kini menjumlahkan HYDRANT WARGA SAJA. Halaman hydrant resmi sengaja TIDAK
            // mengirim prop ini — kartunya muncul karena datanya ada, bukan karena komponennya
            // memeriksa `variant === 'warga'` (percabangan yang memang dihindari modul ini).
            'summary' => $summary,
            'filters' => $request->only(['search', 'status']),
            'tenant_location' => $this->getTenantDefaultLocation(),
        ]);
    }

    /**
     * Rekap kapasitas air per desa — menjawab "berapa simpanan air swadaya yang bisa
     * diandalkan di desa ini" saat menyusun kesiapsiagaan wilayah.
     *
     * Pindahan dari `Admin\PompaController::waterSummary()` (TASK_30/TASK_33) dan
     * DISEDERHANAKAN: di sana ia harus membawa DUA satuan berdampingan karena halamannya
     * memuat pompa (liter/menit, aliran) sekaligus tandon warga (liter, simpanan) — dua angka
     * yang tak boleh dijumlahkan. Di sini sumbernya tinggal satu, jadi satuannya pun satu.
     *
     * `unknown_capacity` sengaja ikut dikirim: total yang menyembunyikan berapa titik yang
     * BELUM mengisi angkanya akan dibaca sebagai angka pasti, padahal ia batas bawah.
     */
    private function waterSummary(Collection $rows): array
    {
        $codes = $rows->pluck('village_code')->filter()->unique()->values()->all();

        $names = DB::table('indonesia_villages')->whereIn('code', $codes)->pluck('name', 'code');

        // Nama kecamatan hanya diperlukan untuk kode desa yang TIDAK dikenal — lihat villageLabel().
        $unknown = array_values(array_diff($codes, $names->keys()->all()));

        $districts = $unknown === []
            ? collect()
            : DB::table('indonesia_districts')
                ->whereIn('code', array_map(fn ($code) => $this->districtCodeFromVillage((string) $code), $unknown))
                ->pluck('name', 'code');

        return $rows
            ->groupBy(fn (HydrantWarga $row) => $row->village_code ?: '')
            ->map(fn (Collection $group, $code) => [
                'village_code' => $code ?: null,
                'village' => $this->villageLabel($code, $names, $districts),
                'points' => $group->count(),
                'capacity_liter' => $group->sum(fn (HydrantWarga $row) => (int) $row->capacity_liter),
                'unknown_capacity' => $group->whereNull('capacity_liter')->count(),
            ])
            ->sortByDesc('capacity_liter')
            ->values()
            ->all();
    }

    /**
     * Judul baris rekap. Kode wilayah TIDAK PERNAH sampai ke layar: sebuah baris berjudul
     * "5171012001" muncul begitu kode desa yang tersimpan tidak ada di `indonesia_villages`,
     * dan itu bukan kasus langka — seeder fasilitas pernah mengarang kode desa (FINDINGS #78).
     * Angka 10 digit tak berarti apa pun bagi operator; nama kecamatannya masih bisa diturunkan
     * dari AWALAN kode BPS, jadi barisnya tetap punya tempat yang dikenali sekaligus mengaku
     * datanya belum beres. Perbaikan datanya sendiri lewat
     * `php artisan sisupit:fix-facility-village-codes`.
     */
    private function villageLabel(?string $code, Collection $names, Collection $districts): string
    {
        if (! $code) {
            return 'Tanpa data desa';
        }

        if (isset($names[$code])) {
            return $names[$code];
        }

        $district = $districts[$this->districtCodeFromVillage($code)] ?? null;

        return $district ? 'Desa tidak dikenal · Kec. '.$district : 'Desa tidak dikenal';
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
        HydrantWarga::create($this->preparedData($request));

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
        $hydrant_warga->update($this->preparedData($request));

        return redirect()->route('admin.hydrant-warga.index')->with('success', 'Data hydrant warga berhasil diperbarui.');
    }

    public function destroy(HydrantWarga $hydrant_warga)
    {
        $hydrant_warga->delete();

        return redirect()->back()->with('success', 'Hydrant warga berhasil dihapus.');
    }

    /**
     * Data siap simpan: hasil validasi + kode wilayah yang sudah diselaraskan yurisdiksi.
     *
     * Urutannya mengikat. Banjar diadu dengan `village_code` HASIL penyelarasan, bukan dengan
     * yang dikirim form: untuk admin yang desanya terkunci, kode dari akunlah yang menang
     * (ResolvesFacilityJurisdiction), sehingga memeriksa isi request akan memeriksa kode yang
     * bahkan tidak jadi tersimpan.
     */
    private function preparedData(Request $request): array
    {
        $data = $this->withJurisdictionCodes($this->validateData($request), $request);

        Banjar::assertBelongsToVillage($data['banjar_id'] ?? null, $data['village_code'] ?? null);

        return $data;
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'status' => ['required', Rule::in(HydrantWarga::STATUSES)],
            'type' => ['required', Rule::in(HydrantWarga::WATER_SOURCES)],
            'capacity_liter' => 'required|integer|min:0',
            // Banjar OPSIONAL walau tandon memang milik komunitas: master banjar diisi
            // belakangan (daftarnya harus diminta ke BPS/Pemkot), dan pendataan tandon tidak
            // boleh terhenti menunggu data master turun. `exists` memakai tabel apa adanya —
            // Tenantable tidak berlaku pada rule ini, dan itu memang yang diinginkan: yang
            // menentukan sah-tidaknya di sini adalah keberadaan barisnya.
            'banjar_id' => 'nullable|integer|exists:banjars,id',
            'description' => 'nullable|string',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'city_code' => 'nullable|string',
            'district_code' => 'nullable|string',
            'village_code' => 'nullable|string',
        ], [
            'type.required' => 'Sumber air wajib dipilih.',
            'capacity_liter.required' => 'Kapasitas volume wajib diisi — angka ini dipakai menghitung total simpanan air per desa.',
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

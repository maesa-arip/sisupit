<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banjar;
use App\Models\Setting;
use App\Traits\ResolvesFacilityJurisdiction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * CRUD master banjar (permintaan user 2026-08-26). Ter-scope wilayah via Tenantable pada model
 * `Banjar`, jadi tiap kabupaten mengelola daftarnya sendiri — pola `Admin\AgencyController`.
 *
 * Bedanya dengan AgencyController: kode wilayah TIDAK diambil bulat-bulat dari yurisdiksi admin.
 * Banjar menempel pada satu DESA tertentu, sedangkan admin kota tidak punya `village_code`
 * (kolomnya sengaja NULL, #56). Karena itu jalurnya lewat `ResolvesFacilityJurisdiction`
 * (#75/TASK_32): level yang dikunci akun tetap menang, level terbuka diambil dari form TAPI
 * wajib masih berada di dalam induknya, dan level atas yang kosong diturunkan dari kode desa.
 */
class BanjarController extends Controller
{
    use ResolvesFacilityJurisdiction;

    public function index(Request $request)
    {
        $banjars = Banjar::query()
            ->filter($request->only(['search', 'jenis', 'status']))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Nama desa untuk baris yang tampil saja — daftar banjar bisa ribuan, memuat seluruh
        // indonesia_villages untuk 15 baris jelas berlebihan.
        $villages = DB::table('indonesia_villages')
            ->whereIn('code', collect($banjars->items())->pluck('village_code')->filter()->unique())
            ->pluck('name', 'code');

        return Inertia::render('Admin/Banjars/Index', [
            'banjars' => $banjars->through(fn (Banjar $banjar) => [
                'id' => $banjar->id,
                'name' => $banjar->name,
                'code' => $banjar->code,
                'jenis' => $banjar->jenis,
                'is_active' => $banjar->is_active,
                'status' => $banjar->status,
                'village_code' => $banjar->village_code,
                'village' => $villages[$banjar->village_code] ?? null,
            ]),
            'filters' => $request->only(['search', 'jenis', 'status']),
            'jenis_options' => Banjar::JENIS,
            'total' => Banjar::count(),
            // Ditampilkan sebagai lencana pada penyaring: usulan yang tak pernah ditinjau akan
            // menumpuk diam-diam, dan admin tak punya alasan membuka halaman ini tiap hari.
            'jumlah_usulan' => Banjar::where('status', Banjar::STATUS_USULAN)->count(),
            'status_options' => Banjar::STATUSES,
            'cakupan' => $this->cakupanDesa(),
            'require_banjar' => $this->requireBanjar(),
        ]);
    }

    /**
     * Saklar "warga wajib memilih banjar saat melengkapi profil".
     *
     * Ditaruh di halaman ini, bukan di /admin/settings, supaya ia berdiri tepat di sebelah
     * daftar yang menentukan boleh-tidaknya ia dinyalakan: mewajibkan banjar sementara
     * masternya kosong berarti mengunci seluruh pendaftaran warga (gema #61). Karena itu
     * permintaan menyalakan saat master kosong DITOLAK di server, bukan cuma di layar.
     */
    public function toggleRequirement(Request $request)
    {
        $validated = $request->validate(['require' => 'required|boolean']);

        if ($validated['require'] && Banjar::count() === 0) {
            return redirect()->back()->withErrors([
                'require' => 'Master banjar masih kosong. Isi daftarnya dulu - mewajibkan banjar sekarang akan memblokir pendaftaran warga.',
            ]);
        }

        Setting::setValue(Setting::KEY_REQUIRE_BANJAR, $validated['require'] ? '1' : '0');

        return redirect()->back()->with(
            'success',
            $validated['require']
                ? 'Warga kini wajib memilih banjar saat melengkapi profil.'
                : 'Banjar kembali opsional saat melengkapi profil.'
        );
    }

    public function create()
    {
        return Inertia::render('Admin/Banjars/Form', $this->formProps());
    }

    public function store(Request $request)
    {
        Banjar::create($this->withJurisdictionCodes($this->validateData($request), $request));

        return redirect()->route('admin.banjars.index')->with('success', 'Banjar berhasil ditambahkan.');
    }

    public function edit(Banjar $banjar)
    {
        return Inertia::render('Admin/Banjars/Form', array_merge($this->formProps(), [
            'banjar' => $banjar->only(['id', 'name', 'code', 'jenis', 'description', 'is_active', 'district_code', 'village_code']),
        ]));
    }

    public function update(Request $request, Banjar $banjar)
    {
        $banjar->update($this->withJurisdictionCodes($this->validateData($request), $request));

        return redirect()->route('admin.banjars.index')->with('success', 'Data banjar berhasil diperbarui.');
    }

    public function destroy(Banjar $banjar)
    {
        // SoftDeletes + nullOnDelete di kolom penunjuk: menghapus banjar dari master TIDAK
        // menghapus warga maupun tandon yang terlanjur menunjuk ke sana.
        $banjar->delete();

        return redirect()->back()->with('success', 'Banjar berhasil dihapus.');
    }

    /**
     * Setujui banjar usulan warga — MEMBALIK KOLOM, bukan memindahkan baris.
     *
     * Inilah alasan usulan tidak ditaruh di tabel terpisah (migrasi 2026_08_26_140000): id-nya
     * tetap, sehingga `users.banjar_id` dan `hydrant_wargas.banjar_id` yang sudah terlanjur
     * menunjuk ke baris ini tidak berubah sama sekali. Warga yang mengusulkannya tak perlu
     * memilih ulang banjarnya, dan tak ada penunjuk yang jadi yatim.
     */
    public function verify(Banjar $banjar)
    {
        $banjar->update(['status' => Banjar::STATUS_TERVERIFIKASI]);

        return redirect()->back()->with('success', $banjar->name.' ditandai terverifikasi.');
    }

    /**
     * Berapa desa di wilayah admin ini yang sudah punya banjar.
     *
     * Ditampilkan tepat di sebelah saklar kewajiban supaya keputusannya diambil sambil melihat
     * kelengkapannya. Penjaga di server SENGAJA tetap sekadar 'master tak boleh kosong', bukan
     * 'semua desa harus terisi': sejak warga bisa mengusulkan banjarnya sendiri, desa yang
     * masternya kosong bukan lagi jalan buntu — dropdown kosong menawarkan tombol tambah.
     * Menuntut kelengkapan 100% berarti kewajiban itu tak akan pernah bisa dinyalakan.
     */
    private function cakupanDesa(): array
    {
        $user = auth()->user();

        if (! $user->city_code) {
            return ['terisi' => 0, 'total' => 0];
        }

        $total = DB::table('indonesia_villages as v')
            ->join('indonesia_districts as d', 'd.code', '=', 'v.district_code')
            ->where('d.city_code', $user->city_code)
            ->count();

        $terisi = Banjar::query()
            ->whereNotNull('village_code')
            ->distinct()
            ->count('village_code');

        return ['terisi' => $terisi, 'total' => $total];
    }

    private function requireBanjar(): bool
    {
        return filter_var(Setting::getValue(Setting::KEY_REQUIRE_BANJAR, '0'), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Pilihan wilayah untuk form — hanya level yang MASIH TERBUKA bagi admin ini yang perlu
     * dipilih; sisanya sudah dikunci yurisdiksinya (pola HydrantWargaController::create).
     */
    private function formProps(): array
    {
        $user = auth()->user();

        return [
            'districts' => $user->city_code
                ? DB::table('indonesia_districts')->where('city_code', $user->city_code)->orderBy('name')->get(['code', 'name'])
                : [],
            'jenis_options' => Banjar::JENIS,
            'admin_level' => [
                'province_code' => $user->province_code,
                'city_code' => $user->city_code,
                'district_code' => $user->district_code,
                'village_code' => $user->village_code,
            ],
        ];
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            // Boleh kosong: daftar dari Pemkot/MDA sering belum memilah dinas & adat, dan
            // menebak jenisnya jauh lebih berbahaya daripada mengakui belum tahu.
            'jenis' => ['nullable', Rule::in(Banjar::JENIS)],
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            // Desa WAJIB di form (kolomnya nullable hanya demi baris impor yang desanya belum
            // terpetakan): banjar tanpa desa induk tak bisa muncul di dropdown mana pun.
            'village_code' => 'required|string|max:20',
            'district_code' => 'nullable|string|max:20',
        ]);
    }
}

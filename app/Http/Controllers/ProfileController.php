<?php

namespace App\Http\Controllers;

use App\Models\Banjar;
use App\Models\Setting;
use App\Models\User;
use App\Traits\HasFile;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Laravolt\Indonesia\Models\Province;

class ProfileController extends Controller
{
    use HasFile;

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'page_settings' => [
                'title' => 'Profil',
                'subtitle' => 'Perbarui profil melalui halaman ini',
            ],
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            // Menentukan konfirmasi hapus akun: password, atau ketik HAPUS bagi akun Google.
            'hasPassword' => filled($request->user()->getAuthPassword()),
            'jurisdiction' => $this->resolveJurisdiction($request->user()),
            // Banjar hanya relevan bagi akun yang punya desa. Staf kabupaten/kecamatan sengaja
            // tak berbanjar (#56), jadi kartunya tak perlu muncul sama sekali bagi mereka.
            'banjar' => $request->user()->village_code ? [
                'village_code' => $request->user()->village_code,
                'banjar_id' => $request->user()->banjar_id ? (string) $request->user()->banjar_id : '',
                'required' => $this->banjarRequired(),
            ] : null,
            'skillOptions' => \App\Models\Skill::options(), // master keahlian untuk editor relawan di profil
        ]);
    }

    /**
     * Susun cakupan yurisdiksi akun untuk ditampilkan di profil: daftar level wilayah yang
     * terisi (nama) + level paling spesifik sebagai cakupan kewenangan. Akun tanpa kode wilayah:
     * hanya SUPERADMIN yang benar-benar nasional; user lain "Belum diisi" (aksesnya justru kosong,
     * lihat scopeIsAdmin/Tenantable #44) — jangan ditampilkan "Nasional" yang menyesatkan.
     */
    private function resolveJurisdiction(\App\Models\User $user): array
    {
        // Wilayah EFEKTIF (TASK_63): bagi petugas yang diperluas sampai tingkat setelan
        // kabupatennya, kartu ini harus menyebut jangkauan yang benar-benar berlaku - bukan desa
        // akunnya, yang tak lagi membatasi apa pun. Peran lain = kolom akun apa adanya.
        $codes = $user->effectiveJurisdictionCodes();
        $name = fn (string $column, string $relation) => $codes[$column] ? optional($user->{$relation})->name : null;

        $levels = [
            ['label' => 'Provinsi', 'name' => $name('province_code', 'province')],
            ['label' => 'Kabupaten/Kota', 'name' => $name('city_code', 'city')],
            ['label' => 'Kecamatan', 'name' => $name('district_code', 'district')],
            ['label' => 'Desa/Kelurahan', 'name' => $name('village_code', 'village')],
        ];

        $scopeLevel = $codes['village_code'] ? 'Desa/Kelurahan'
            : ($codes['district_code'] ? 'Kecamatan'
            : ($codes['city_code'] ? 'Kabupaten/Kota'
            : ($codes['province_code'] ? 'Provinsi'
            : ($user->hasRole('superadmin') ? 'Nasional' : 'Belum diisi'))));

        // Nama wilayah pada level terspesifik (= cakupan kewenangan). Mis. cakupan desa →
        // nama desa, cakupan kecamatan → nama kecamatan, dst.
        $scopeName = $name('village_code', 'village')
            ?? $name('district_code', 'district')
            ?? $name('city_code', 'city')
            ?? $name('province_code', 'province');

        return [
            // Makna kode wilayah akun berbeda per peran (TASK_61): peran yang wilayahnya
            // DITETAPKAN ADMIN (CENTRALLY_MANAGED_ROLES - daftar yang sama yang dikecualikan dari
            // layar Lengkapi Profil) memakainya sebagai wilayah TUGAS, bukan tempat tinggal.
            // Dikirim dari server supaya layar tak menyusun daftar perannya sendiri (#101).
            'kind' => $user->hasAnyRole(\App\Models\User::CENTRALLY_MANAGED_ROLES) ? 'tugas' : 'domisili',
            'levels' => array_values(array_filter($levels, fn ($level) => ! empty($level['name']))),
            'scope' => [
                'level' => $scopeLevel,
                'name' => $scopeName,
            ],
        ];
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        // dd($request->all());
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            // Alamat tinggal, teks bebas (TASK_61). Hanya catatan: TIDAK mengubah kode wilayah
            // akun, yang menentukan laporan & notifikasi (bagi petugas = wilayah tugas).
            'address' => 'nullable|string|max:255',
            'ktp' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $user = auth()->user();

        // Simpan file jika ada
        if ($request->hasFile('ktp')) {
            // Tangkap path kembaliannya dan timpa ke array $data['ktp']
            $data['ktp'] = $this->update_file($request, $user, 'ktp', 'users');
        } else {
            // Hapus ktp dari data jika tidak ada file, agar file lama tidak tertimpa null
            unset($data['ktp']);
        }

        if ($data['email'] !== $user->email) {
            $data['email_verified_at'] = null;
        }

        $user->update($data);

        return Redirect::route('profile.edit');
    }

    /**
     * Halaman wajib lengkapi profil (no. HP + wilayah sampai desa) di login pertama.
     * Diarahkan ke sini oleh middleware EnsureProfileComplete.
     */
    public function completeProfile(Request $request): Response
    {
        return Inertia::render('Profile/CompleteProfile', [
            'provinces' => Province::select('code', 'name')->get(),
            'user' => [
                'phone' => $request->user()->phone,
            ],
            // Saklar "banjar wajib" (2026-08-26). DEFAULT MATI dan hanya boleh dinyalakan
            // SETELAH master banjar wilayah itu terisi — dropdown kosong yang diwajibkan akan
            // memblokir seluruh pendaftaran warga (gema #61). Lihat Setting::KEY_REQUIRE_BANJAR.
            'banjar_required' => $this->banjarRequired(),
        ]);
    }

    /** Apakah warga wajib memilih banjar saat melengkapi profil? */
    private function banjarRequired(): bool
    {
        return filter_var(
            Setting::getValue(Setting::KEY_REQUIRE_BANJAR, '0'),
            FILTER_VALIDATE_BOOLEAN
        );
    }

    /**
     * Ubah banjar akun sendiri.
     *
     * Desanya TIDAK ikut dikirim: yang berlaku adalah `village_code` yang sudah tersimpan di
     * akun. Menerima desa dari form di sini berarti membuka jalan memindahkan diri ke desa lain
     * lewat layar yang niatnya cuma mengganti banjar — dan kolom wilayah akun menentukan apa
     * yang dilihat serta notifikasi apa yang diterima.
     */
    public function updateBanjar(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'banjar_id' => [$this->banjarRequired() ? 'required' : 'nullable', 'integer', 'exists:banjars,id'],
        ], [
            'banjar_id.required' => 'Pilih banjar tempat Anda tinggal.',
        ]);

        Banjar::assertBelongsToVillage($data['banjar_id'] ?? null, $user->village_code);

        $user->update(['banjar_id' => $data['banjar_id'] ?? null]);

        return Redirect::route('profile.edit')->with('success', 'Banjar berhasil diperbarui.');
    }

    /**
     * Simpan no. HP + wilayah hasil onboarding, lalu lanjut ke dashboard.
     */
    public function storeCompleteProfile(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'phone' => 'required|string|max:20',
            'province_code' => 'required|exists:indonesia_provinces,code',
            'city_code' => 'required|exists:indonesia_cities,code',
            'district_code' => 'required|exists:indonesia_districts,code',
            'village_code' => 'required|exists:indonesia_villages,code',
            // Kewajibannya SAKLAR, bukan aturan mati: master banjar diisi belakangan, dan
            // mewajibkan kolom yang pilihannya belum ada berarti mengunci pendaftaran warga.
            // Kolomnya sendiri tetap nullable di database — akun staf/OPD memang tak berbanjar.
            'banjar_id' => [$this->banjarRequired() ? 'required' : 'nullable', 'integer', 'exists:banjars,id'],
        ], [
            'banjar_id.required' => 'Pilih banjar tempat Anda tinggal.',
        ]);

        // `exists:banjars,id` hanya membuktikan barisnya ada, bukan bahwa ia milik desa yang
        // baru saja dipilih. Layar ini memang mengosongkan pilihan banjar tiap kali desanya
        // berganti, tapi aturan yang menjaga isi tabel tidak boleh bersandar pada urutan klik
        // di satu layar — lihat Banjar::assertBelongsToVillage().
        Banjar::assertBelongsToVillage($data['banjar_id'] ?? null, $data['village_code'] ?? null);

        $request->user()->update($data);

        return Redirect::route('dashboard');
    }

    /**
     * Nyalakan/matikan siaga notifikasi milik user yang sedang login.
     *
     * Dipakai DUA peran (User::STANDBY_ROLES): relawan di `Pages/Dashboard.jsx` dan pejabat di
     * `Pages/Admin/Dashboard.jsx`. Dulu method ini tinggal di VolunteerController dengan nama
     * route `volunteer.standby` — dipindah ke sini saat pejabat ikut memakainya (2026-08-25),
     * karena pejabat mem-POST ke endpoint bernama "volunteer" akan terbaca sebagai bug.
     * Saat nonaktif, ReportActionController::approve melewatinya.
     */
    public function toggleStandby(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->hasAnyRole(User::STANDBY_ROLES), 403);

        $user->update(['is_standby' => ! $user->is_standby]);

        // Konsisten dengan register()/updateSkills(): toast ditangani frontend.
        return back();
    }

    /**
     * Hapus akun oleh pemiliknya (syarat Google Play: hapus akun dari dalam aplikasi).
     *
     * Bentuknya ANONIMISASI, bukan DELETE baris: reports.user_id tanpa onDelete (DELETE
     * ditolak DB bagi siapa pun yang pernah melapor) dan report_officers/report_helpers
     * cascade (jejak penanganan insiden ikut lenyap). Kebijakan Privasi & S&K memang
     * menjanjikan data kejadian tetap diarsipkan instansi - yang dihapus identitasnya.
     * Akun Google tak punya password, jadi konfirmasinya mengetik HAPUS.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        $request->validate(filled($user->getAuthPassword())
            ? ['password' => ['required', 'current_password']]
            : ['confirmation' => ['required', 'in:HAPUS']], [
                'confirmation.required' => 'Ketik HAPUS untuk mengonfirmasi.',
                'confirmation.in' => 'Ketik HAPUS (huruf besar) untuk mengonfirmasi.',
            ]);

        $this->delete_file($user, 'avatar');
        $this->delete_file($user, 'ktp');

        DB::transaction(function () use ($user) {
            DB::table('social_accounts')->where('user_id', $user->id)->delete();
            DB::table('fcm_tokens')->where('user_id', $user->id)->delete();
            DB::table('regu_members')->where('user_id', $user->id)->delete();
            DB::table('regus')->where('leader_id', $user->id)->update(['leader_id' => null]);
            DB::table('sessions')->where('user_id', $user->id)->delete();
            if ($user->email) {
                DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            }
            $user->notifications()->delete();
            $user->syncRoles([]);
            $user->syncPermissions([]);

            $user->forceFill([
                'name' => 'Akun Dihapus',
                'username' => 'dihapus-'.$user->id,
                'email' => null,
                'email_verified_at' => null,
                'password' => null,
                'phone' => null,
                'avatar' => null,
                'gender' => null,
                'date_of_birth' => null,
                'address' => null,
                'ktp' => null,
                'province_code' => null,
                'city_code' => null,
                'district_code' => null,
                'village_code' => null,
                'is_standby' => false,
                'skills' => null,
                'agency_id' => null,
                'banjar_id' => null,
                'remember_token' => null,
            ])->save();
        });

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}

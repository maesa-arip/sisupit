<?php

namespace App\Http\Controllers;

use App\Traits\HasFile;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
                'title' => 'Profile',
                'subtitle' => 'Perbarui profil melalui halaman ini',
            ],
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'jurisdiction' => $this->resolveJurisdiction($request->user()),
            'skillOptions' => \App\Models\Skill::options(), // master keahlian untuk editor relawan di profil
        ]);
    }

    /**
     * Susun cakupan yurisdiksi akun untuk ditampilkan di profil: daftar level wilayah yang
     * terisi (nama) + level paling spesifik sebagai cakupan kewenangan. Selaras dengan logika
     * di User::withinReportJurisdiction() — akun tanpa kode wilayah berarti cakupan nasional.
     */
    private function resolveJurisdiction(\App\Models\User $user): array
    {
        $levels = [
            ['label' => 'Provinsi', 'name' => optional($user->province)->name],
            ['label' => 'Kabupaten/Kota', 'name' => optional($user->city)->name],
            ['label' => 'Kecamatan', 'name' => optional($user->district)->name],
            ['label' => 'Desa/Kelurahan', 'name' => optional($user->village)->name],
        ];

        $scopeLevel = $user->village_code ? 'Desa/Kelurahan'
            : ($user->district_code ? 'Kecamatan'
            : ($user->city_code ? 'Kabupaten/Kota'
            : ($user->province_code ? 'Provinsi' : 'Nasional')));

        // Nama wilayah pada level terspesifik (= cakupan kewenangan). Mis. cakupan desa →
        // nama desa, cakupan kecamatan → nama kecamatan, dst.
        $scopeName = optional($user->village)->name
            ?? optional($user->district)->name
            ?? optional($user->city)->name
            ?? optional($user->province)->name;

        return [
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
        ]);
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
        ]);

        $request->user()->update($data);

        return Redirect::route('dashboard');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}

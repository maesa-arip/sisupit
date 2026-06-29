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
        ]);
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

<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VolunteerController extends Controller
{
    /**
     * Daftarkan user yang sedang login menjadi relawan.
     */
    public function register(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Pastikan user belum memiliki role relawan agar tidak dobel
        if (! $user->hasRole('relawan')) {
            $user->assignRole('relawan');

            // Opsional: Jika Anda ingin mencabut role warga saat dia jadi relawan
            if ($user->hasRole('warga')) {
                $user->removeRole('warga');
            }
        }

        // Return back akan otomatis memicu Inertia untuk merefresh props (termasuk auth.user.role)
        return back();
    }

    /**
     * Perbarui daftar keahlian relawan. Hanya menerima nilai dari master
     * keahlian (Skill::options()) agar badge di daftar relawan tetap konsisten.
     */
    public function updateSkills(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->hasRole('relawan'), 403);

        $options = Skill::options();

        $validated = $request->validate([
            'skills' => ['present', 'array', 'max:'.count($options)],
            'skills.*' => ['string', Rule::in($options)],
        ]);

        // values() agar tersimpan sebagai array terindeks (bukan object) di JSON.
        $user->update(['skills' => array_values(array_unique($validated['skills']))]);

        // Konsisten dengan register()/ProfileController::toggleStandby(): toast ditangani frontend.
        return back();
    }
}

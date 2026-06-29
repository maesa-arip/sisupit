<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VolunteerController extends Controller
{
    /**
     * Daftar keahlian yang boleh dipilih relawan. Ditampilkan sebagai chip
     * di dashboard relawan & badge di daftar relawan (lihat Volunteers/Index).
     */
    public const SKILL_OPTIONS = [
        'Pemadaman',
        'P3K / Medis',
        'Evakuasi',
        'SAR',
        'Distribusi Air',
        'Logistik',
        'Komunikasi',
        'Pengaturan Lalu Lintas',
    ];

    /**
     * Daftarkan user yang sedang login menjadi relawan.
     */
    public function register(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Pastikan user belum memiliki role relawan agar tidak dobel
        if (! $user->hasRole('relawan')) {
            $user->assignRole('relawan');

            // Opsional: Jika Anda ingin mencabut role masyarakat saat dia jadi relawan
            if ($user->hasRole('masyarakat')) {
                $user->removeRole('masyarakat');
            }
        }

        // Return back akan otomatis memicu Inertia untuk merefresh props (termasuk auth.user.role)
        return back();
    }

    /**
     * Toggle status siaga relawan. Saat nonaktif, relawan tidak disiarkan
     * notifikasi insiden (lihat ReportActionController::approve).
     */
    public function toggleStandby(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->hasRole('relawan'), 403);

        $user->update(['is_standby' => ! $user->is_standby]);

        return back();
    }

    /**
     * Perbarui daftar keahlian relawan. Hanya menerima nilai dari whitelist
     * SKILL_OPTIONS agar badge di daftar relawan tetap konsisten.
     */
    public function updateSkills(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->hasRole('relawan'), 403);

        $validated = $request->validate([
            'skills' => ['present', 'array', 'max:'.count(self::SKILL_OPTIONS)],
            'skills.*' => ['string', 'in:'.implode(',', self::SKILL_OPTIONS)],
        ]);

        // values() agar tersimpan sebagai array terindeks (bukan object) di JSON.
        $user->update(['skills' => array_values(array_unique($validated['skills']))]);

        // Konsisten dengan register()/toggleStandby(): toast ditangani frontend.
        return back();
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class VolunteerController extends Controller
{
    /**
     * Daftarkan user yang sedang login menjadi relawan.
     */
    public function register(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Pastikan user belum memiliki role relawan agar tidak dobel
        if (!$user->hasRole('relawan')) {
            $user->assignRole('relawan');
            
            // Opsional: Jika Anda ingin mencabut role masyarakat saat dia jadi relawan
            if ($user->hasRole('masyarakat')) {
                $user->removeRole('masyarakat');
            }
        }

        // Return back akan otomatis memicu Inertia untuk merefresh props (termasuk auth.user.role)
        return back();
    }
}
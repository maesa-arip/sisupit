<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Penerima undangan petugas (2026-11-06). Pintu masuknya TOKEN di tautan email - hash-nya harus
 * cocok dengan baris yang belum dipakai & belum kedaluwarsa; itulah otorisasinya. Akun yang
 * dipakai WAJIB beremail sama dengan undangan, jadi tautan yang bocor ke orang lain tak bisa
 * mengangkat akun lain menjadi petugas.
 *
 * Wilayah akun langsung = wilayah TUGAS dari undangan; layar Lengkapi Profil (dan deteksi GPS-
 * nya) tak pernah dilewati petugas (CENTRALLY_MANAGED_ROLES).
 */
class InvitationController extends Controller
{
    public function show(Request $request, string $token): Response
    {
        $invitation = UserInvitation::findUsable($token);

        if (! $invitation) {
            return Inertia::render('Auth/Invitation', ['valid' => false]);
        }

        $user = $request->user();

        return Inertia::render('Auth/Invitation', [
            'valid' => true,
            'token' => $token,
            'email' => $invitation->email,
            'region' => UserInvitation::regionNameOf($invitation->regionCodes()),
            'inviter' => optional($invitation->inviter)->name,
            'expiresAt' => $invitation->expires_at->toIso8601String(),
            // guest = isi form akun baru (atau masuk bila emailnya sudah terdaftar);
            // same = cukup tombol Terima; other = sedang masuk dengan akun lain.
            'mode' => ! $user ? 'guest' : (strcasecmp($user->email ?? '', $invitation->email) === 0 ? 'same' : 'other'),
            'accountExists' => ! $user && User::where('email', $invitation->email)->exists(),
            'currentEmail' => $user?->email,
        ]);
    }

    /** "Sudah punya akun? Masuk" - kembali ke tautan ini setelah login (url.intended). */
    public function login(string $token): RedirectResponse
    {
        session()->put('url.intended', route('invitations.show', $token));

        return redirect()->route('login');
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = UserInvitation::findUsable($token);
        if (! $invitation) {
            return redirect()->route('invitations.show', $token);
        }

        $user = $request->user();

        if ($user) {
            if (strcasecmp($user->email ?? '', $invitation->email) !== 0) {
                throw ValidationException::withMessages(['email' => 'Undangan ini untuk '.$invitation->email.'. Keluar dulu, lalu masuk dengan email tersebut.']);
            }
            $this->assertPromotable($user);

            DB::transaction(fn () => $this->promote($user, $invitation));
        } else {
            if (User::where('email', $invitation->email)->exists()) {
                throw ValidationException::withMessages(['email' => 'Email ini sudah punya akun. Masuk dulu, lalu buka lagi tautan undangan.']);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:20',
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
                'terms' => ['accepted'],
            ], [
                'terms.accepted' => 'Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.',
            ]);

            $user = DB::transaction(function () use ($request, $invitation) {
                $user = User::create([
                    'name' => $name = $request->name,
                    'username' => usernameGenerator($name),
                    'email' => $invitation->email,
                    'phone' => $request->phone,
                    'password' => Hash::make($request->password),
                    'terms_accepted_at' => now(),
                ]);
                $this->promote($user, $invitation);

                return $user;
            });

            // Di aplikasi: langsung "ingat saya", sama dengan pendaftaran biasa (TASK_73).
            Auth::login($user, isNativeApp($request));
        }

        flashMessage('Selamat bergabung. Akun Anda kini petugas.');

        return redirect()->route('dashboard');
    }

    /** Peran terpusat lain (admin/pejabat/OPD/superadmin) tak boleh berubah lewat tautan email. */
    private function assertPromotable(User $user): void
    {
        $others = array_diff(User::CENTRALLY_MANAGED_ROLES, ['petugas']);
        if ($user->hasAnyRole($others)) {
            throw ValidationException::withMessages(['email' => 'Akun ini sudah memegang peran lain. Hubungi admin untuk mengubah peran.']);
        }
    }

    /**
     * Klaim undangan (UPDATE bersyarat = hanya satu yang menang bila tautan dibuka dua kali
     * bersamaan) lalu angkat akun: peran, wilayah tugas, email terverifikasi (tautan email
     * membuktikannya). Banjar/instansi dilepas - petugas tak berbanjar (#56), bukan akun OPD.
     */
    private function promote(User $user, UserInvitation $invitation): void
    {
        $claimed = UserInvitation::whereKey($invitation->id)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->update(['accepted_at' => now(), 'accepted_user_id' => $user->id]);

        if ($claimed !== 1) {
            throw ValidationException::withMessages(['email' => 'Undangan ini sudah dipakai atau kedaluwarsa.']);
        }

        $user->syncRoles([$invitation->role]);
        $user->forceFill([
            ...$invitation->regionCodes(),
            'agency_id' => null,
            'banjar_id' => null,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();
    }
}

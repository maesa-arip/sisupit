<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmToken;
use Illuminate\Http\Request;

class FcmController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'device_type' => 'nullable|string'
        ]);

        // Token FCM bersifat per-DEVICE, bukan per-akun. Saat satu HP dipakai login
        // berganti akun, token yang sama harus PINDAH ke user yang sekarang login,
        // bukan menempel di pemilik lama (penyebab notif nyangkut di device yang salah).
        // Lepaskan token ini dari user lain dulu, lalu pasang ke user sekarang.
        FcmToken::where('token', $request->token)
            ->where('user_id', '!=', $request->user()->id)
            ->delete();

        $request->user()->fcmTokens()->updateOrCreate(
            ['token' => $request->token],
            ['device_type' => $request->device_type ?? 'android']
        );

        return response()->json(['status' => 'success', 'message' => 'FCM Token registered.']);
    }
}
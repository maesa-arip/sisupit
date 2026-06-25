<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        $record = $request->user()->fcmTokens()->updateOrCreate(
            ['token' => $request->token],
            ['device_type' => $request->device_type ?? 'android']
        );

        // Audit: bantu lacak kasus "device baru tidak terdaftar". Token disingkat agar
        // tidak membocorkan token penuh ke log.
        Log::info('FCM token registered', [
            'user_id' => $request->user()->id,
            'device_type' => $record->device_type,
            'token_tail' => substr($request->token, -10),
            'was_new' => $record->wasRecentlyCreated,
        ]);

        return response()->json(['status' => 'success', 'message' => 'FCM Token registered.']);
    }
}
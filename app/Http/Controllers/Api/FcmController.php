<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FcmController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'device_type' => 'nullable|string'
        ]);

        // Simpan atau update token untuk user yang sedang login
        $request->user()->fcmTokens()->firstOrCreate([
            'token' => $request->token,
        ], [
            'device_type' => $request->device_type ?? 'android'
        ]);

        return response()->json(['status' => 'success', 'message' => 'FCM Token registered.']);
    }
}
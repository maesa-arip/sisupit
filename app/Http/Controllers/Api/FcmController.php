<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmToken;
use App\Notifications\DeviceTestNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\Messaging\NotFound;
use Kreait\Firebase\Exception\MessagingException;

class FcmController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'device_type' => 'nullable|string',
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

        // updated_at = "terakhir terlihat" (TASK_73, dasar FcmToken::prunable). updateOrCreate
        // tak menyentuhnya bila tak ada yang berubah; disentuh paling sering sehari sekali
        // karena endpoint ini terpanggil di setiap pindah halaman.
        if (! $record->wasRecentlyCreated && ! $record->wasChanged() && $record->updated_at?->lt(now()->subDay())) {
            $record->touch();
        }

        // Token perangkat ini diingat sesi supaya Keluar dari tombol MANA PUN melepasnya,
        // juga yang tak mengirim fcm_token (AuthenticatedSessionController::destroy).
        $request->session()->put('fcm_token', $request->token);

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

    /**
     * Kirim notifikasi uji ke HP yang sedang dipakai (#182). Hanya ke token yang dikirim
     * perangkat itu sendiri dan memang milik akun ini - tak pernah ke HP lain, jadi tak ada
     * "sirine iseng" ke orang lain. Tingkatnya dibatasi ke yang memang diterima perannya.
     */
    public function test(Request $request, Messaging $messaging)
    {
        $user = $request->user();

        $request->validate([
            'token' => 'required|string|max:4096',
            'tier' => ['required', Rule::in(array_column(DeviceTestNotification::tiersFor($user), 'key'))],
        ]);

        if (! $user->fcmTokens()->where('token', $request->token)->exists()) {
            return response()->json([
                'message' => 'HP ini belum terdaftar untuk menerima notifikasi. Tutup lalu buka lagi aplikasinya.',
            ], 422);
        }

        $message = (new DeviceTestNotification($request->tier))->toFcm()->token($request->token);

        try {
            $messaging->send($message);
        } catch (NotFound $e) {
            // Token tak dikenal FCM lagi (aplikasi dipasang ulang/datanya dihapus) - aturan yang
            // sama dengan DeleteInvalidFcmToken. Aplikasi akan mendaftarkan token baru saat dibuka.
            FcmToken::where('token', $request->token)->delete();

            return response()->json([
                'message' => 'Pendaftaran HP ini sudah tidak berlaku. Tutup lalu buka lagi aplikasinya, kemudian coba lagi.',
            ], 422);
        } catch (MessagingException $e) {
            Log::warning('FCM test send failed', [
                'user_id' => $user->id,
                'token_tail' => substr($request->token, -10),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Layanan notifikasi sedang bermasalah. Coba lagi beberapa saat lagi.',
            ], 503);
        }

        Log::info('FCM test sent', [
            'user_id' => $user->id,
            'tier' => $request->tier,
            'token_tail' => substr($request->token, -10),
        ]);

        return response()->json(['status' => 'success']);
    }

    /**
     * Jaring pengaman (TASK_73): aplikasi yang tampil sebagai TAMU melepas token perangkatnya,
     * sehingga aturannya selalu "layar masuk = tidak ada notifikasi" - apa pun sebab ia
     * keluar (sesi dicabut, sandi diganti di perangkat lain, data aplikasi dihapus sebagian).
     *
     * Tanpa login: yang mengirim token ini terbukti memegang perangkatnya - token FCM ±160
     * karakter acak dan tak pernah ditampilkan. Rute dibatasi middleware guest + throttle;
     * pemanggil yang sudah masuk tidak pernah sampai ke sini.
     */
    public function release(Request $request)
    {
        $request->validate(['token' => 'required|string|max:4096']);

        $deleted = FcmToken::where('token', $request->token)->delete();

        if ($deleted) {
            Log::info('FCM token released by guest app', [
                'token_tail' => substr($request->token, -10),
            ]);
        }

        return response()->json(['status' => 'success']);
    }
}

<?php

namespace App\Listeners;

use App\Models\FcmToken;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging\SendReport;
use NotificationChannels\Fcm\FcmChannel;

/**
 * Hapus token yang ditolak FCM (TASK_73). Firebase: balasan UNREGISTERED (404) atau
 * INVALID_ARGUMENT (400) untuk sebuah token berarti token itu aman dihapus - aplikasinya
 * sudah dicopot, datanya dihapus, atau token kedaluwarsa (Android: 270 hari tak aktif).
 * Tanpa ini token mati menumpuk selamanya dan tiap siaran mengirim ke alamat kosong.
 *
 * Kegagalan lain (kuota, jaringan, galat server FCM) SENGAJA tidak menghapus apa pun:
 * token itu masih sah, dan menghapusnya berarti petugas kehilangan sirine diam-diam.
 */
class DeleteInvalidFcmToken
{
    public function handle(NotificationFailed $event): void
    {
        if ($event->channel !== FcmChannel::class) {
            return;
        }

        $report = $event->data['report'] ?? null;

        if (! $report instanceof SendReport) {
            return;
        }

        if (! $report->messageWasSentToUnknownToken() && ! $report->messageTargetWasInvalid()) {
            return;
        }

        $token = $report->target()->value();
        $deleted = FcmToken::where('token', $token)->delete();

        Log::info('FCM token deleted after send failure', [
            'user_id' => $event->notifiable?->id ?? null,
            'token_tail' => substr($token, -10),
            'deleted' => $deleted,
            'error' => $report->error()?->getMessage(),
        ]);
    }
}

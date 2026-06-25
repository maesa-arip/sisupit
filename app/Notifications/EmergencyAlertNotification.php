<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class EmergencyAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $report;
    public $userRole;

    public function __construct(Report $report, string $userRole)
    {
        $this->report = $report;
        $this->userRole = $userRole;
    }

    public function via($notifiable)
    {
        // WebPush (browser) sementara DIMATIKAN — fokus hanya FCM (mobile) dulu.
        // toWebPush() & import WebPush sengaja dibiarkan agar mudah diaktifkan lagi:
        // cukup kembalikan WebPushChannel::class ke array di bawah.
        // Kirim via Firebase (mobile), simpan di database (lonceng web), broadcast (live map).
        return [FcmChannel::class, 'database', 'broadcast'];
    }

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title('🚨 DARURAT ' . strtoupper($this->report->category ?? 'KEBAKARAN') . '!')
            ->body($this->report->address)
            ->action('Lihat', 'view_app')
            ->data(['url' => url('/reports/show/' . $this->report->id)]);
    }

    public function toFcm($notifiable)
    {
        $title = '🚨 DARURAT ' . strtoupper($this->report->category ?? 'KEBAKARAN') . '!';

        return FcmMessage::create()
            // 1. VISUAL NOTIFIKASI
            ->notification(new FcmNotification(
                title: $title,
                body: $this->report->address,
            ))
            // 2. DATA PAYLOAD (Untuk Deep Linking di WebView) — nilai wajib string
            ->data([
                'report_id' => (string) $this->report->id,
                'action_url' => url('/reports/' . $this->report->id),
                'type' => 'emergency',
                'user_role' => $this->userRole, // role pengguna untuk logika di client
            ])
            // 3. KONFIGURASI ANDROID (struktur FCM HTTP v1) — sirine & bypass DnD
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'sound' => 'sirine', // file sirine di res/raw Android
                        'channel_id' => 'emergency_channel', // WAJIB sama dgn channel di Android
                        'color' => '#b42826', // warna icon merah Damkar
                        'default_vibrate_timings' => false,
                        'vibrate_timings' => ['1.0s', '1.0s', '1.0s', '1.0s'], // getar ekstrim
                    ],
                ],
            ]);
    }

    public function toArray($notifiable)
    {
        return [
            'report_id' => $this->report->id,
            'title' => 'Darurat: ' . $this->report->title,
            'address' => $this->report->address,
        ];
    }
}
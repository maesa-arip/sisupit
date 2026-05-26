<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\Fcm\Resources\AndroidConfig;
use NotificationChannels\Fcm\Resources\AndroidNotification;

class EmergencyAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $report;

    public function __construct(Report $report)
    {
        $this->report = $report;
    }

    public function via($notifiable)
    {
        // Kirim via Firebase dan simpan di database (lonceng web)
        return [FcmChannel::class, 'database', 'broadcast'];
    }

    public function toFcm($notifiable)
    {
        return FcmMessage::create()
            // 1. DATA PAYLOAD (Untuk Deep Linking di WebView)
            ->setData([
                'report_id' => (string) $this->report->id,
                'action_url' => url('/reports/' . $this->report->id),
                'type' => 'emergency'
            ])
            // 2. VISUAL NOTIFIKASI
            ->setNotification(FcmNotification::create()
                ->setTitle('🚨 DARURAT ' . strtoupper($this->report->category ?? 'KEBAKARAN') . '!')
                ->setBody($this->report->address)
            )
            // 3. KONFIGURASI ANDROID (BYPASS DO NOT DISTURB & SUARA SIRINE)
            ->setAndroid(
                AndroidConfig::create()
                    ->setPriority('high')
                    ->setNotification(AndroidNotification::create()
                        ->setSound('sirine') // Pastikan file sirine.mp3 ada di folder res/raw di Android
                        ->setChannelId('emergency_channel') // WAJIB SAMA dengan channel di Android
                        ->setColor('#b42826') // Warna icon merah Damkar
                        ->setDefaultVibrateTimings(false)
                        ->setVibrateTimings(['1.0s', '1.0s', '1.0s', '1.0s']) // Getar ekstrim
                    )
            );
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
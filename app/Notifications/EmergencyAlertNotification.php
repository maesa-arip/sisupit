<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
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

        // PESAN DATA-ONLY (tanpa blok notification()).
        // Alasan: dengan notification message, saat app di background sistem yang menangani
        // tampilan & klik → onMessageReceived() di Android TIDAK dipanggil, sehingga:
        //   - sirine hanya bergantung pada channel (sering tidak bunyi saat HP silent), dan
        //   - klik notifikasi tidak bisa deep-link ke detail (jatuh ke dashboard).
        // Data-only membuat onMessageReceived() SELALU jalan (foreground & background) sehingga
        // app bisa: memutar sirine manual lewat stream ALARM (tahan mode silent) + deep-link
        // akurat ke detail laporan. title/body ikut di data karena tak ada blok notification.
        return FcmMessage::create()
            ->data([
                'title' => $title,
                'body' => (string) $this->report->address,
                'report_id' => (string) $this->report->id,
                'action_url' => url('/reports/' . $this->report->id),
                'type' => 'emergency',
                'user_role' => $this->userRole, // role pengguna untuk logika di client
            ])
            // priority "high" WAJIB agar data-only message tetap dikirim cepat saat app di
            // background / device dalam mode Doze.
            ->custom([
                'android' => [
                    'priority' => 'high',
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
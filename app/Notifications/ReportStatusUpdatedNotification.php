<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;

/**
 * Notifikasi BALIK ke pelapor (report->user) saat status laporannya berubah — loop-balik
 * kepercayaan ("laporanmu sedang ditangani"). Beda dari EmergencyAlertNotification yang
 * menyiarkan KE responder. Tanpa channel 'broadcast' karena pelapor tidak ada di peta
 * command center. $event ∈ {approved, en_route, arrived, resolved}.
 */
class ReportStatusUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $report;
    public $event;

    public function __construct(Report $report, string $event)
    {
        $this->report = $report;
        $this->event = $event;
    }

    public function via($notifiable)
    {
        // FCM (mobile) + database (lonceng web). Tanpa broadcast.
        return [FcmChannel::class, 'database'];
    }

    /**
     * Judul & isi per transisi, dipakai FCM (data-only) maupun lonceng web (toArray).
     */
    private function content(): array
    {
        return match ($this->event) {
            'approved' => ['title' => 'Laporan Anda divalidasi', 'body' => 'Pusat Komando menyiagakan tim untuk "' . $this->report->title . '".'],
            'en_route' => ['title' => 'Bantuan dalam perjalanan', 'body' => 'Responder sedang menuju lokasi "' . $this->report->title . '".'],
            'arrived' => ['title' => 'Responder tiba di lokasi', 'body' => 'Tim telah sampai di lokasi "' . $this->report->title . '".'],
            'resolved' => ['title' => 'Insiden selesai ditangani', 'body' => 'Laporan "' . $this->report->title . '" telah dinyatakan selesai.'],
            default => ['title' => 'Status laporan diperbarui', 'body' => $this->report->title],
        };
    }

    public function toFcm($notifiable)
    {
        $content = $this->content();

        // Data-only (alasan sama dengan EmergencyAlertNotification::toFcm): onMessageReceived()
        // di Android selalu jalan → bisa deep-link akurat ke detail laporan.
        return FcmMessage::create()
            ->data([
                'title' => $content['title'],
                'body' => $content['body'],
                'report_id' => (string) $this->report->id,
                'action_url' => route('reports.show', $this->report->id),
                'type' => 'report_status',
                'event' => $this->event,
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                ],
            ]);
    }

    public function toArray($notifiable)
    {
        $content = $this->content();

        return [
            'report_id' => $this->report->id,
            'title' => $content['title'],
            'message' => $content['body'],
            'status' => $this->report->status,
            'event' => $this->event,
        ];
    }
}

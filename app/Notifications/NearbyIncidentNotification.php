<?php

namespace App\Notifications;

use App\Models\Report;
use App\Notifications\Concerns\DipicuAkunDemo;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;

/**
 * Kabar BIASA (bukan sirine) ke warga di sekitar kejadian sesudah admin memverifikasi laporan
 * (TASK_89). Penerimanya User::scopeWargaNearReport - pelapor & pelapor laporan gabungan tidak
 * ikut, mereka sudah mendapat "Laporan Anda divalidasi".
 *
 * `type` WAJIB `report_status`: APK yang sudah terpasang memilih channel dari `type`, dan jenis
 * yang tak dikenalnya jatuh ke SIRINE (mobile/ATURAN_NOTIFIKASI.md). `report_status` =
 * channel status_update_v2, nada bawaan HP. `event` hanya keterangan, tidak dibaca APK.
 *
 * Tujuan ketuk = halaman terbatas front.incidents.show, BUKAN reports.show: detail laporan
 * memuat nama & HP pelapor/responder, foto, dan jejak GPS, dan bagi warga lain 403.
 */
class NearbyIncidentNotification extends Notification implements ShouldQueue
{
    use DipicuAkunDemo, Queueable;

    public const EVENT = 'nearby_incident';

    public $report;

    public function __construct(Report $report)
    {
        $this->report = $report;
        $this->catatPemicu();
    }

    public function via($notifiable)
    {
        // FCM (HP) + database (lonceng web). Tanpa broadcast: warga tak ada di peta komando.
        return [FcmChannel::class, 'database'];
    }

    private function content(): array
    {
        $jenis = $this->report->incident_type === 'lainnya' ? 'Kejadian darurat' : 'Kebakaran';
        $lokasi = $this->report->alamatTampil();

        return [
            'title' => $jenis.' di sekitar Anda',
            'body' => ($lokasi ? $lokasi.'. ' : '').'Laporan sudah diverifikasi dan petugas disiagakan. Beri jalan bagi petugas dan jauhi lokasi.',
        ];
    }

    private function url(): string
    {
        return route('front.incidents.show', $this->report->id);
    }

    public function toFcm($notifiable)
    {
        $content = $this->content();

        return FcmMessage::create()
            ->data([
                'title' => $content['title'],
                'body' => $content['body'],
                'report_id' => (string) $this->report->id,
                'action_url' => $this->url(),
                'type' => 'report_status',
                'event' => self::EVENT,
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                ],
                // Sama dengan kabar ke pelapor: bunyi bawaan sistem, `active` (tak menembus Focus).
                'apns' => [
                    'headers' => [
                        'apns-priority' => '10',
                        'apns-push-type' => 'alert',
                    ],
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $content['title'],
                                'body' => $content['body'],
                            ],
                            'sound' => 'default',
                            'interruption-level' => 'active',
                            'thread-id' => 'nearby-incident',
                        ],
                    ],
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
            'event' => self::EVENT,
            // Dibaca NotificationController::read lebih dulu dari reports.show (TASK_89).
            'url' => $this->url(),
        ];
    }
}

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
 * "Damkar sedang menelepon Anda" ke pelapor BER-AKUN saat Pusat Komando memanggil lewat Sisupit
 * (TASK_90). Panggilannya sendiri berdering di aplikasi yang sedang terbuka (ReporterCallChanged);
 * push ini untuk pelapor yang aplikasinya tertutup - ketuk, aplikasi terbuka, panggilan yang masih
 * berdering muncul dari shared prop `incomingCall`.
 *
 * `type` WAJIB `report_status`: APK terpasang memilih channel dari `type`, dan jenis tak dikenal
 * jatuh ke SIRINE (mobile/ATURAN_NOTIFIKASI.md). Tanpa 'broadcast': exe desktop membunyikan
 * notifikasi broadcast apa pun yang tak dikenalnya (CONVENTIONS, TASK_54).
 */
class ReporterCallNotification extends Notification implements ShouldQueue
{
    use DipicuAkunDemo, Queueable;

    public const EVENT = 'reporter_call';

    public $report;

    public function __construct(Report $report)
    {
        $this->report = $report;
        $this->catatPemicu();
    }

    public function via($notifiable)
    {
        return [FcmChannel::class, 'database'];
    }

    private function content(): array
    {
        return [
            'title' => 'Damkar sedang menelepon Anda',
            'body' => 'Buka Sisupit untuk menjawab panggilan tentang laporan '.Report::nomorLaporan($this->report).'.',
        ];
    }

    private function url(): string
    {
        return route('reports.show', $this->report->id);
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
                // Panggilan yang berdering memang mendesak: `time-sensitive` menembus mode Fokus,
                // tapi bunyinya tetap bawaan sistem (bukan sirine).
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
                            'interruption-level' => 'time-sensitive',
                            'thread-id' => 'reporter-call',
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
            'url' => $this->url(),
        ];
    }
}

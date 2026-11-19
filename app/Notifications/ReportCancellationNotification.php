<?php

namespace App\Notifications;

use App\Models\Report;
use App\Models\ReportCancellation;
use App\Notifications\Concerns\DipicuAkunDemo;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;

/**
 * Pengajuan pembatalan laporan (TASK_91), tiga kabar:
 * - REQUESTED -> admin/superadmin wilayah laporan: ada pengajuan yang menunggu keputusannya.
 * - APPROVED  -> responder yang masih Meluncur/Tiba + pengaju: misi dihentikan.
 * - DECLINED  -> pengaju: pengajuannya ditolak, misi tetap berjalan.
 *
 * FCM `type: report_status` SENGAJA (pola TriageDecidedNotification #209): APK terpasang
 * memetakannya ke channel STATUS (nada bawaan). Jenis baru = sirine di build lama (KONTRAK 4.2).
 * `report_id` sebagai ID notifikasi Android membuat "Misi dibatalkan" MENIMPA sirine dispatch
 * laporan yang sama di HP petugas. Tanpa 'broadcast': exe desktop membunyikan sirine untuk
 * notifikasi siaran yang tak dikenalnya; lonceng web cukup lewat 'database'.
 */
class ReportCancellationNotification extends Notification implements ShouldQueue
{
    use DipicuAkunDemo, Queueable;

    public const REQUESTED = 'requested';

    public const APPROVED = 'approved';

    public const DECLINED = 'declined';

    public $report;

    public $event;

    public $reason;

    public $actorName;

    public function __construct(Report $report, string $event, ReportCancellation $cancellation, ?string $actorName = null)
    {
        $this->report = $report;
        $this->event = $event;
        // Nilai disalin, bukan modelnya: notifikasi antre dibangun belakangan, sedangkan isi
        // pengajuan yang dikabarkan harus yang berlaku saat keputusan diambil.
        $this->reason = $event === self::DECLINED ? $cancellation->decision_note : $cancellation->reason;
        $this->actorName = $actorName;
        $this->catatPemicu();
    }

    public function via($notifiable)
    {
        return [FcmChannel::class, 'database'];
    }

    private function content(): array
    {
        $laporan = '"'.$this->report->title.'"';
        $oleh = $this->actorName ? ' oleh '.$this->actorName : '';
        $alasan = $this->reason ? ' Alasan: '.$this->reason : '';

        return match ($this->event) {
            self::REQUESTED => [
                'title' => 'Pengajuan pembatalan laporan',
                'body' => 'Laporan '.$laporan.' diajukan untuk dibatalkan'.$oleh.'.'.$alasan,
            ],
            self::APPROVED => [
                'title' => 'Misi dibatalkan',
                'body' => 'Laporan '.$laporan.' dibatalkan'.$oleh.'. Penugasan dihentikan.'.$alasan,
            ],
            self::DECLINED => [
                'title' => 'Pengajuan pembatalan ditolak',
                'body' => 'Laporan '.$laporan.' tetap berjalan, pengajuan ditolak'.$oleh.'.'.$alasan,
            ],
            default => ['title' => 'Pembatalan laporan', 'body' => 'Laporan '.$laporan],
        };
    }

    public function toFcm($notifiable)
    {
        $content = $this->content();

        return FcmMessage::create()
            ->data([
                'title' => $content['title'],
                'body' => $content['body'],
                'report_id' => (string) $this->report->id,
                'action_url' => route('reports.show', $this->report->id),
                'type' => 'report_status',
                'event' => 'cancellation_'.$this->event,
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                ],
                'apns' => [
                    'headers' => [
                        'apns-priority' => '10',
                        'apns-push-type' => 'alert',
                        'apns-collapse-id' => EmergencyAlertNotification::collapseId($this->report),
                    ],
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $content['title'],
                                'body' => $content['body'],
                            ],
                            'sound' => 'default',
                            'interruption-level' => 'active',
                            'thread-id' => 'emergency',
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
            'event' => 'cancellation_'.$this->event,
        ];
    }
}

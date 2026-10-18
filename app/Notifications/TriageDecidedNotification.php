<?php

namespace App\Notifications;

use App\Models\Report;
use App\Models\User;
use App\Notifications\Concerns\DipicuAkunDemo;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;

/**
 * Kabar ke admin/superadmin bahwa laporan yang tadi "menunggu verifikasi" SUDAH DIPUTUSKAN
 * admin lain (#209). Tujuannya MENIMPA notifikasi triase di laci notifikasi HP, bukan
 * menambah satu lagi:
 *
 * - Android: wrapper memakai `report_id` sebagai ID notifikasi, jadi pesan ini mengganti
 *   notifikasi "📥 Laporan baru menunggu verifikasi" laporan yang sama. Petugas tak butuh ini -
 *   sirine dispatch sudah menimpanya; admin tak pernah menerima dispatch, jadi notifikasi
 *   triasenya tertinggal walau laporannya sudah dalam penanganan.
 * - `type` = `report_status` SENGAJA: APK yang sudah terpasang memetakannya ke channel
 *   STATUS (nada bawaan, tidak insisten). Nilai `type` baru akan jatuh ke DARURAT di build
 *   lama (aturan "tak dikenal = sirine", mobile/KONTRAK.md 4.2) - sirine untuk kabar bahwa
 *   urusannya sudah beres.
 * - iOS: `apns-collapse-id` sama dengan milik EmergencyAlertNotification.
 *
 * Hanya FCM: lonceng web sudah menampilkan status terkini, dan channel 'broadcast' akan
 * memunculkan notifikasi baru di aplikasi desktop alih-alih menimpa apa pun.
 */
class TriageDecidedNotification extends Notification implements ShouldQueue
{
    use DipicuAkunDemo, Queueable;

    public const APPROVED = 'approved';

    public const REJECTED = 'rejected';

    public const MERGED = 'merged';

    public $report;

    public $decision;

    public $actorName;

    public function __construct(Report $report, string $decision, ?string $actorName = null)
    {
        $this->report = $report;
        $this->decision = $decision;
        $this->actorName = $actorName;
        $this->catatPemicu();
    }

    public function via($notifiable)
    {
        return [FcmChannel::class];
    }

    private function content(): array
    {
        $alamat = $this->report->alamatTampil();
        $laporan = trim($this->report->title.($alamat ? ' - '.$alamat : ''));
        $oleh = $this->actorName ? ' oleh '.$this->actorName : '';

        return match ($this->decision) {
            self::APPROVED => ['title' => '✅ Laporan sudah diverifikasi', 'body' => $laporan.'. Diverifikasi'.$oleh.' dan disiarkan ke lapangan.'],
            self::REJECTED => ['title' => 'Laporan ditolak', 'body' => $laporan.'. Ditolak'.$oleh.'.'],
            self::MERGED => ['title' => 'Laporan digabung', 'body' => $laporan.'. Digabung'.$oleh.' ke kejadian yang sudah ada.'],
            default => ['title' => 'Laporan sudah diproses', 'body' => $laporan],
        };
    }

    public function toFcm($notifiable)
    {
        $content = $this->content();

        return FcmMessage::create()
            ->data([
                'title' => $content['title'],
                'body' => $content['body'],
                // ID notifikasi di Android - inilah yang membuat pesan ini MENIMPA, bukan menambah.
                'report_id' => (string) $this->report->id,
                'action_url' => route('reports.show', $this->report->id),
                'type' => 'report_status',
                'event' => 'triage_'.$this->decision,
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

    /**
     * Penerima = penerima nada triase laporan ini, dikurangi yang memutuskan (ia sudah tahu,
     * dan bila ia memutuskan dari notifikasinya, notifikasi itu sudah hilang saat disentuh).
     *
     * Laporan yang diusulkan ganda TIDAK pernah membunyikan nada triase (ReportController::store),
     * jadi tak ada yang perlu ditimpa - mengirim ke sana malah memunculkan notifikasi baru.
     * Usulan yang diabaikan admin (dismissDuplicate) membuat syarat ini tak bisa dipastikan
     * dari data; arah salahnya satu kabar yang tak menimpa apa pun, bukan kabar yang hilang.
     */
    public static function recipientsFor(Report $report, bool $wasDuplicateCandidate, ?int $actorId)
    {
        if ($wasDuplicateCandidate) {
            return collect();
        }

        return User::triageAdminsFor($report)
            ->reject(fn (User $u) => $u->id === $actorId || ($report->user_id && $u->id === $report->user_id))
            ->values();
    }
}

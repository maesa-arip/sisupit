<?php

namespace App\Notifications;

use App\Models\Report;
use App\Models\ReportAgency;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;

/**
 * Permintaan bantuan ke OPD/instansi terkait (TASK_27) — dikirim ke akun berperan `opd` yang
 * mewakili instansi itu. Beda dari EmergencyAlertNotification (menyiarkan ke responder Damkar
 * di wilayah) : ini DITUJUKAN, hanya ke instansi yang dipilih operator saat verifikasi.
 *
 * Bila pelibatan itu menuntut tindakan berkondisi (mis. PLN memadamkan aliran listrik),
 * kalimatnya ikut di badan notifikasi — diambil dari snapshot pivot, bukan dari nama instansi,
 * supaya OPD baru yang butuh konfirmasi tidak menuntut perubahan kode.
 */
class AgencyDispatchNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $report;

    public $reportAgency;

    public function __construct(Report $report, ReportAgency $reportAgency)
    {
        $this->report = $report;
        $this->reportAgency = $reportAgency;
    }

    public function via($notifiable)
    {
        // FCM (mobile) + database (lonceng web) + broadcast.
        //
        // Alasan lama "tanpa broadcast" sudah tidak berlaku: ia mengira channel privat hanya
        // dipakai menggambar responder di peta command center. Sejak ada aplikasi desktop
        // (.exe), channel App.Models.User.{id} juga jalur notifikasi — dan .exe tidak memakai
        // FCM sama sekali. Akun OPD yang bekerja dari desktop tak akan pernah tahu ia diminta
        // bantuan tanpa ini (TASK_50).
        return [FcmChannel::class, 'database', 'broadcast'];
    }

    private function content(): array
    {
        $body = 'Damkar meminta bantuan di "'.$this->report->title.'" — '.$this->report->address;

        if ($this->reportAgency->requires_confirmation && $this->reportAgency->confirmation_label) {
            $body .= '. Dibutuhkan: '.$this->reportAgency->confirmation_label;
        }

        return [
            'title' => 'Permintaan Bantuan: '.$this->reportAgency->agency_name,
            'body' => $body,
        ];
    }

    public function toFcm($notifiable)
    {
        $content = $this->content();

        // Data-only + blok android & apns berdampingan: alasan lengkapnya ada di
        // EmergencyAlertNotification::toFcm() (TASK_26). Singkatnya, tanpa blok `apns` pesan
        // data-only dianggap background push oleh iOS dan TIDAK PERNAH muncul di layar —
        // sedangkan permintaan bantuan ini justru harus terlihat segera.
        return FcmMessage::create()
            ->data([
                'title' => $content['title'],
                'body' => $content['body'],
                'report_id' => (string) $this->report->id,
                'action_url' => route('reports.show', $this->report->id),
                'type' => 'agency_dispatch',
                'agency_id' => (string) $this->reportAgency->agency_id,
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                ],
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
                            // Tanpa sirine: ini permintaan koordinasi ke instansi mitra, bukan
                            // panggilan darurat ke responder yang harus meluncur.
                            'interruption-level' => 'time-sensitive',
                            'content-available' => 1,
                            'thread-id' => 'agency',
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
            'agency_id' => $this->reportAgency->agency_id,
            'type' => 'agency_dispatch',
        ];
    }
}

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
 * Kabar balik dari OPD ke Pusat Komando (TASK_30): tindakan berkondisi yang diminta sudah
 * dipenuhi — mis. PLN menandai "Listrik sudah dipadamkan di lokasi kejadian".
 *
 * Ini arah SEBALIKNYA dari AgencyDispatchNotification. Sebelumnya konfirmasi hanya mengubah
 * satu baris pivot lalu menampilkan flash message kepada orang yang menekannya; kalau yang
 * menekan adalah akun OPD, Pusat Komando & petugas di lokasi TIDAK pernah diberi tahu dan
 * harus menebak-nebak apakah aman menyentuh material basah. Justru merekalah yang menunggu
 * kabar ini.
 *
 * Kalimatnya diambil dari snapshot `confirmation_label` pada pivot — bukan dari nama instansi
 * — supaya OPD baru yang butuh konfirmasi (Dinas PU, Pertamina, ...) cukup didaftarkan lewat
 * /admin/agencies tanpa menyentuh kode ini (aturan TASK_27).
 */
class AgencyConfirmationNotification extends Notification implements ShouldQueue
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
        // FCM (mobile) + database (lonceng web) + broadcast — sama seperti permintaan bantuannya.
        //
        // 'broadcast' ditambahkan TASK_50. Aplikasi desktop (.exe) yang dipakai Pusat Komando
        // TIDAK memakai FCM sama sekali; ia mendengar Reverb di channel privat
        // App.Models.User.{id}, jadi tanpa channel ini kabar "listrik sudah dipadamkan" —
        // justru yang paling ditunggu operator — tak pernah tiba di layar tempat mereka
        // bekerja. Tidak ada permukaan otorisasi baru: channel itu milik penerima sendiri dan
        // daftar penerimanya tidak diubah sebaris pun.
        return [FcmChannel::class, 'database', 'broadcast'];
    }

    private function content(): array
    {
        $label = $this->reportAgency->confirmation_label ?: 'Tindakan yang diminta sudah dipenuhi';

        $body = $label.' - "'.$this->report->title.'"';

        // Bobot buktinya berbeda dan operator berhak tahu yang mana: konfirmasi dari akun OPD
        // sendiri vs dicatatkan operator atas laporan lisan/telepon (TASK_27).
        $body .= $this->reportAgency->confirmed_source === ReportAgency::SOURCE_OPERATOR
            ? ' (dicatat operator)'
            : ' (dikonfirmasi '.$this->reportAgency->agency_name.')';

        if ($this->reportAgency->confirmation_note) {
            $body .= '. Catatan: '.$this->reportAgency->confirmation_note;
        }

        return [
            'title' => 'Konfirmasi '.$this->reportAgency->agency_name,
            'body' => $body,
        ];
    }

    public function toFcm($notifiable)
    {
        $content = $this->content();

        // Data-only + blok android & apns berdampingan (TASK_26): tanpa `apns` pesan data-only
        // dianggap background push oleh iOS dan tak pernah muncul di layar.
        return FcmMessage::create()
            ->data([
                'title' => $content['title'],
                'body' => $content['body'],
                'report_id' => (string) $this->report->id,
                'action_url' => route('reports.show', $this->report->id),
                'type' => 'agency_confirmation',
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
                            // Tanpa sirine: ini kabar koordinasi, bukan panggilan meluncur.
                            // Tetap time-sensitive karena menentukan aman/tidaknya tindakan
                            // petugas di lokasi.
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
            'type' => 'agency_confirmation',
        ];
    }
}

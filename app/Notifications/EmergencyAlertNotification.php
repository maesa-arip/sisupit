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
            ->title('🚨 DARURAT KEBAKARAN!')
            ->body($this->report->address)
            ->action('Lihat', 'view_app')
            ->data(['url' => url('/reports/show/'.$this->report->id)]);
    }

    public function toFcm($notifiable)
    {
        // Sisupit = layanan kebakaran; tak ada kolom `category` di reports (sebelumnya
        // `$report->category ?? 'KEBAKARAN'` selalu jatuh ke fallback). Pakai literal.
        $title = '🚨 DARURAT KEBAKARAN!';

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
                // Rute detail laporan = reports/show/{report} (name reports.show); URL lama
                // '/reports/{id}' tidak ada → 404 saat deep-link. Pakai route() agar ikut prefix.
                'action_url' => route('reports.show', $this->report->id),
                'type' => 'emergency',
                'user_role' => $this->userRole, // role pengguna untuk logika di client
            ])
            // priority "high" WAJIB agar data-only message tetap dikirim cepat saat app di
            // background / device dalam mode Doze.
            ->custom([
                'android' => [
                    'priority' => 'high',
                ],
                // iOS TIDAK memperlakukan data-only seperti Android. Pesan tanpa blok
                // apns.payload.aps.alert dianggap BACKGROUND push: tidak menampilkan UI
                // apa pun, dibatasi (throttled) sistem, dan tidak terkirim saat app
                // ditutup — artinya tanpa blok ini notifikasi darurat TIDAK PERNAH muncul
                // di iPhone. Blok `data` di atas tetap ikut terkirim dan tetap terbaca
                // aplikasi iOS untuk deep-link (action_url), jadi keduanya saling
                // melengkapi, bukan menggantikan.
                'apns' => [
                    'headers' => [
                        // 10 = kirim segera; padanan priority "high" milik Android.
                        'apns-priority' => '10',
                        // Wajib sejak iOS 13 bila payload memuat aps.alert.
                        'apns-push-type' => 'alert',
                    ],
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $title,
                                'body' => (string) $this->report->address,
                            ],
                            // Berkas suara di dalam bundle aplikasi iOS (hasil konversi
                            // sirine.mp3 milik Android — iOS hanya menerima caf/wav/aiff
                            // dan memotong diam-diam bila lebih dari 30 detik).
                            'sound' => 'sirine.caf',
                            // time-sensitive menembus Focus/DND dan TIDAK butuh
                            // persetujuan Apple. Menembus saklar senyap hanya mungkin
                            // dengan 'critical' + sound objek {critical:1,...}, dan itu
                            // menuntut entitlement Critical Alerts yang harus disetujui
                            // Apple lebih dulu — jangan dinaikkan sebelum surat itu ada.
                            'interruption-level' => 'time-sensitive',
                            // Bangunkan app agar sempat memproses data (deep-link).
                            'content-available' => 1,
                            'mutable-content' => 1,
                            'thread-id' => 'emergency',
                        ],
                    ],
                ],
            ]);
    }

    public function toArray($notifiable)
    {
        return [
            'report_id' => $this->report->id,
            'title' => 'Darurat: '.$this->report->title,
            'address' => $this->report->address,
        ];
    }
}

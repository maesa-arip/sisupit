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

    /**
     * Laporan warga BARU MASUK, belum diverifikasi siapa pun — hanya ke Pusat Komando
     * (SOP anti-hoax di ReportController::store). Yang diminta: buka & nilai.
     */
    public const STAGE_REPORT_INCOMING = 'report_incoming';

    /**
     * Laporan SUDAH divalidasi operator dan disiarkan ke responder. Yang diminta:
     * tinggalkan semuanya dan meluncur. Hanya tahap INI yang bersirine.
     */
    public const STAGE_DISPATCH = 'dispatch';

    public $report;

    public $userRole;

    public $stage;

    /**
     * @param  string  $stage  Salah satu STAGE_*. Menentukan kalimat DAN suara yang dipilih
     *                         klien; lihat komentar di toFcm(). Bawaannya STAGE_DISPATCH
     *                         supaya pemanggil yang tak menyebutkan apa-apa jatuh ke perilaku
     *                         lama (sirine), bukan ke perilaku baru yang lebih senyap.
     */
    public function __construct(Report $report, string $userRole, string $stage = self::STAGE_DISPATCH)
    {
        $this->report = $report;
        $this->userRole = $userRole;
        $this->stage = $stage;
    }

    /**
     * Judul & isi per tahap, dipakai FCM, WebPush, lonceng web, dan siaran ke aplikasi desktop.
     *
     * Kalimatnya WAJIB berbeda antar tahap, bukan cuma suaranya: notifikasi yang sudah
     * menyingkir ke Pusat Tindakan Windows / laci notifikasi Android tidak lagi berbunyi, dan
     * di sana yang tersisa hanya teksnya. Tahap masuk sengaja BERHENTI berkata "DARURAT
     * KEBAKARAN!" — laporan itu belum diverifikasi siapa pun.
     */
    private function content(): array
    {
        // alamatTampil() (bukan ->address langsung) sesuai aturan TASK_49/#95: patokan yang
        // diketik warga boleh kosong, dan di produksi 8 dari 22 laporan memang begitu — tanpa
        // ini badan notifikasinya kosong melompong tanpa galat.
        $alamat = $this->report->alamatTampil();

        if ($this->stage === self::STAGE_REPORT_INCOMING) {
            return [
                'title' => '📥 Laporan baru menunggu verifikasi',
                'body' => trim($this->report->title.($alamat ? ' — '.$alamat : '')),
            ];
        }

        return [
            'title' => '🚨 DARURAT KEBAKARAN!',
            'body' => (string) ($alamat ?: $this->report->title),
        ];
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
        $content = $this->content();

        return (new WebPushMessage)
            ->title($content['title'])
            ->body($content['body'])
            ->action('Lihat', 'view_app')
            ->data(['url' => url('/reports/show/'.$this->report->id)]);
    }

    public function toFcm($notifiable)
    {
        // Sisupit = layanan kebakaran; tak ada kolom `category` di reports (sebelumnya
        // `$report->category ?? 'KEBAKARAN'` selalu jatuh ke fallback). Judulnya kini
        // mengikuti TAHAP, lihat content().
        $content = $this->content();
        $title = $content['title'];

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
                'body' => $content['body'],
                'report_id' => (string) $this->report->id,
                // Penentu SUARA di wrapper Android (TASK_50). Di Android suara melekat pada
                // notification channel dan setelan channel bersifat permanen, jadi server
                // tidak bisa mengirim "mainkan berkas X" — yang bisa dikirim hanya penanda
                // ini, lalu wrapper memilih channel dari sini. Wrapper LAMA yang belum tahu
                // kunci ini mengabaikannya dan tetap bersirine; itu tempat jatuh yang
                // disengaja (keputusan user: gagal berisik lebih aman daripada gagal diam).
                'alert_stage' => $this->stage,
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
                                'body' => $content['body'],
                            ],
                            // Berkas suara di dalam bundle aplikasi iOS (hasil konversi
                            // sirine.mp3 milik Android — iOS hanya menerima caf/wav/aiff
                            // dan memotong diam-diam bila lebih dari 30 detik).
                            //
                            // Beda dari Android: di iOS berkasnya DITENTUKAN PAYLOAD, jadi
                            // pembedaan tahap sudah selesai di sini. Aplikasi iOS-nya sendiri
                            // belum dibangun; kalau `masuk.caf` belum ikut di bundle, iOS
                            // memakai bunyi bawaan — arah gagal yang benar untuk tahap yang
                            // memang seharusnya lebih tenang. Ikutkan berkasnya saat app iOS
                            // dibangun (lihat docs/ios/PROMPT_SISUPIT_IOS.md).
                            'sound' => $this->stage === self::STAGE_REPORT_INCOMING ? 'masuk.caf' : 'sirine.caf',
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

    /**
     * Dipakai channel 'database' (lonceng web) DAN channel 'broadcast' — yang terakhir itulah
     * satu-satunya jalan notifikasi sampai ke aplikasi desktop (.exe), yang tidak memakai FCM
     * sama sekali melainkan mendengar Reverb di channel privat App.Models.User.{id}.
     *
     * Judulnya sengaja TIDAK sama dengan content(): lonceng adalah DAFTAR, jadi tiap barisnya
     * harus menyebutkan laporan MANA. Notifikasi push adalah satu interupsi, jadi di sana yang
     * didahulukan seberapa mendesaknya.
     *
     * JANGAN menamai penanda tahap `type`: Illuminate\Notifications\Events\
     * BroadcastNotificationCreated::broadcastWith() melakukan array_merge(data, ['type' =>
     * nama kelas]), jadi kunci `type` apa pun di sini DITIMPA saat disiarkan — Android akan
     * melihat nilai kita (payload FCM tak lewat jalur itu) sementara .exe tidak, dan gejalanya
     * cuma "kok di desktop masih sirine" tanpa galat di mana pun. Dijaga
     * NotificationSoundStageTest.
     */
    public function toArray($notifiable)
    {
        return [
            'report_id' => $this->report->id,
            'title' => ($this->stage === self::STAGE_REPORT_INCOMING ? 'Laporan baru: ' : 'Darurat: ').$this->report->title,
            'address' => $this->report->alamatTampil(),
            'alert_stage' => $this->stage,
        ];
    }
}

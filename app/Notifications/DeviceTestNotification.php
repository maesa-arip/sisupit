<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;

/**
 * Notifikasi uji ke HP yang sedang dipakai (#182, Profil > "Notifikasi di HP ini").
 *
 * Payloadnya MENIRU notifikasi asli per tingkat suara (TASK_50, mobile/ATURAN_NOTIFIKASI.md
 * §2) - `type` + `alert_stage` yang sama persis - supaya wrapper Android memilih CHANNEL yang
 * sama dan pengguna mendengar bunyi, getar, dan perilaku berulang yang benar-benar akan ia
 * dengar saat kejadian. Jangan pakai `type` baru: APK menjatuhkan payload tak dikenal ke
 * channel darurat, jadi uji nada koordinasi akan berbunyi sirine.
 *
 * Dikirim langsung lewat Messaging oleh FcmController::test (bukan Notification::send) supaya
 * galat FCM bisa dilaporkan balik ke layar; tak pernah masuk lonceng web maupun Reverb.
 */
class DeviceTestNotification extends Notification
{
    public const TIERS = [
        'sirine' => [
            'label' => 'Sirine',
            'description' => 'Panggilan meluncur - laporan sudah diverifikasi admin.',
            'title' => '🚨 UJI SIRINE',
        ],
        'masuk' => [
            'label' => 'Nada laporan masuk',
            'description' => 'Laporan warga baru yang menunggu verifikasi.',
            'title' => '📥 Uji nada laporan masuk',
        ],
        'koordinasi' => [
            'label' => 'Nada koordinasi OPD',
            'description' => 'Permintaan bantuan & konfirmasi dari instansi terkait.',
            'title' => '🤝 Uji nada koordinasi OPD',
        ],
        'status' => [
            'label' => 'Bunyi kabar laporan',
            'description' => 'Perkembangan laporan yang Anda kirim (bunyi bawaan HP).',
            'title' => '🔔 Uji kabar laporan',
        ],
    ];

    /** Tingkat yang diterima tiap peran - cermin tabel di mobile/ATURAN_NOTIFIKASI.md §3. */
    private const ROLE_TIERS = [
        'petugas' => ['sirine', 'masuk', 'koordinasi'],
        'relawan' => ['sirine', 'koordinasi'],
        'pejabat' => ['sirine'],
        'admin' => ['masuk', 'koordinasi'],
        'superadmin' => ['masuk', 'koordinasi'],
        'opd' => ['koordinasi'],
    ];

    public function __construct(public string $tier) {}

    /**
     * Daftar uji yang boleh dicoba pengguna ini, urut dari yang paling keras. Warga (dan peran
     * lain yang tak tercantum) hanya menerima kabar status laporannya sendiri.
     *
     * @return array<int, array{key: string, label: string, description: string}>
     */
    public static function tiersFor(User $user): array
    {
        $keys = collect(self::ROLE_TIERS)
            ->filter(fn ($tiers, $role) => $user->hasRole($role))
            ->flatten()
            ->unique();

        if ($keys->isEmpty()) {
            $keys = collect(['status']);
        }

        return collect(array_keys(self::TIERS))
            ->filter(fn ($key) => $keys->contains($key))
            ->map(fn ($key) => [
                'key' => $key,
                'label' => self::TIERS[$key]['label'],
                'description' => self::TIERS[$key]['description'],
            ])
            ->values()
            ->all();
    }

    public function via($notifiable)
    {
        return [FcmChannel::class];
    }

    public function toFcm($notifiable = null): FcmMessage
    {
        $tier = self::TIERS[$this->tier];
        $body = $this->tier === 'sirine' || $this->tier === 'masuk'
            ? 'Ini hanya uji. Bunyinya berulang sampai notifikasi ini disentuh.'
            : 'Ini hanya uji. Begini bunyi notifikasi ini di HP Anda.';

        // Penentu channel Android - SAMA dengan notifikasi aslinya (lihat docblock kelas).
        $penanda = match ($this->tier) {
            'sirine' => ['type' => 'emergency', 'alert_stage' => 'dispatch'],
            'masuk' => ['type' => 'emergency', 'alert_stage' => 'report_incoming'],
            'koordinasi' => ['type' => 'agency_confirmation'],
            'status' => ['type' => 'report_status', 'event' => 'test'],
        };

        // Padanan iOS (aps.sound) dari blok apns notifikasi aslinya.
        [$sound, $level, $thread] = match ($this->tier) {
            'sirine' => ['sirine.caf', 'time-sensitive', 'emergency'],
            'masuk' => ['masuk.caf', 'time-sensitive', 'emergency'],
            'koordinasi' => ['konfirmasi.caf', 'time-sensitive', 'agency'],
            'status' => ['default', 'active', 'report-status'],
        };

        return FcmMessage::create()
            ->data([
                'title' => $tier['title'],
                'body' => $body,
                // Ketukan kembali ke kartu uji di Profil.
                'action_url' => route('profile.edit').'#notifikasi-hp',
                'is_test' => '1',
                ...$penanda,
            ])
            ->custom([
                'android' => ['priority' => 'high'],
                'apns' => [
                    'headers' => ['apns-priority' => '10', 'apns-push-type' => 'alert'],
                    'payload' => [
                        'aps' => [
                            'alert' => ['title' => $tier['title'], 'body' => $body],
                            'sound' => $sound,
                            'interruption-level' => $level,
                            'content-available' => 1,
                            'thread-id' => $thread,
                        ],
                    ],
                ],
            ]);
    }
}

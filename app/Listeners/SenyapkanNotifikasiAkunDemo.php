<?php

namespace App\Listeners;

use App\Models\Report;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Notifications\Events\NotificationSending;

/**
 * Akun demo (TASK_81): satu-satunya titik yang menyenyapkan notifikasi akibat akun demo, di SEMUA
 * kanal (FCM, database/lonceng, broadcast). Mengembalikan false = Laravel membatalkan kirim.
 *
 * Senyap bila saklar global "Akun Demo" menyala DAN salah satu:
 *   - notifikasinya dipicu akun demo (trait DipicuAkunDemo), atau
 *   - laporannya dibuat akun demo (reports.is_demo) - jadi admin asli yang menyetujui laporan
 *     demo tidak membangunkan petugas dengan sirine.
 * PENERIMA yang juga akun demo tetap menerimanya, supaya peragaan antar-akun demo (demo admin ->
 * demo petugas, kabar status ke pelapor demo) tetap berbunyi lengkap.
 * Saklar global mati = akun demo berperilaku seperti akun biasa.
 */
class SenyapkanNotifikasiAkunDemo
{
    public function handle(NotificationSending $event): ?bool
    {
        if (! Setting::akunDemoAktif()) {
            return null;
        }

        if ($event->notifiable instanceof User && $event->notifiable->is_demo) {
            return null;
        }

        $notification = $event->notification;
        $report = $notification->report ?? null;

        if (($notification->dipicuAkunDemo ?? false) || ($report instanceof Report && $report->is_demo)) {
            return false;
        }

        return null;
    }
}

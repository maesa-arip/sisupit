<?php

namespace App\Notifications;

use App\Models\ForumThread;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Kabar forum (TASK_54): pertanyaan menunggu moderasi, pertanyaan disetujui, ada balasan.
 *
 * HANYA `database` (lonceng web). JANGAN tambahkan FcmChannel maupun 'broadcast':
 *  - Wrapper Android memilih channel SUARA dari payload dan hanya mengenali tahap yang sudah
 *    ada (`alert_stage` TASK_50, `type: report_status`). Payload tak dikenal jatuh ke channel
 *    darurat - keputusan TASK_50 "gagal berisik lebih aman" - jadi balasan forum akan
 *    membunyikan SIRINE di ponsel warga.
 *  - Aplikasi .exe Pusat Komando mendengar Reverb di App.Models.User.{id} dan memakai aturan
 *    yang sama, jadi 'broadcast' membuat layar operator bersirine karena ada pertanyaan forum.
 * Sirine harus tetap berarti satu hal. Mengubah ini menuntut tahap baru + rilis kedua wrapper.
 * Dijaga ForumTest.
 */
class ForumNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ForumThread $thread,
        public string $title,
        public string $message,
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'forum_thread_id' => $this->thread->id,
        ];
    }
}

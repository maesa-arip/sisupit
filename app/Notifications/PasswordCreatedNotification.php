<?php

namespace App\Notifications;

use App\Notifications\Concerns\DipicuAkunDemo;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Pemberitahuan "kata sandi baru saja dibuat" (TASK_82, PasswordController::setup) - pemilik
 * akun tahu bila bukan dia yang membuatnya. Email SISTEM lewat kanal `mail` bawaan.
 *
 * Penerimanya selalu pemicunya sendiri, jadi akun demo tetap menerimanya (TASK_81: penerima
 * demo tidak disenyapkan); catatPemicu() dipanggil demi aturan seragam AkunDemoTest.
 */
class PasswordCreatedNotification extends Notification
{
    use DipicuAkunDemo;

    public function __construct()
    {
        $this->catatPemicu();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Kata sandi akun '.config('app.name').' Anda telah dibuat')
            ->line('Kata sandi untuk akun Anda baru saja dibuat. Kini Anda bisa masuk dengan email dan kata sandi, selain lewat Google/Apple.')
            ->line('Login di perangkat lain sudah diakhiri demi keamanan.')
            ->line('Bukan Anda yang membuatnya? Segera atur ulang kata sandi lewat "Lupa kata sandi" di halaman Masuk.');
    }
}

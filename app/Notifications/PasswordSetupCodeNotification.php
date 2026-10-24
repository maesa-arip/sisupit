<?php

namespace App\Notifications;

use App\Notifications\Concerns\DipicuAkunDemo;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Kode 6 angka untuk membuat kata sandi pertama akun Google/Apple (TASK_82,
 * PasswordController::sendSetupCode).
 *
 * Email SISTEM lewat kanal `mail` bawaan - jalur yang sama dengan reset password Laravel,
 * bukan Mail::to() (CONVENTIONS: dua jalur email). Sengaja TIDAK ShouldQueue: kirim yang gagal
 * harus sampai ke layar sebagai pesan, bukan kode yang tak pernah tiba.
 *
 * Penerimanya selalu pemicunya sendiri, jadi akun demo tetap menerimanya (TASK_81: penerima
 * demo tidak disenyapkan); catatPemicu() dipanggil demi aturan seragam AkunDemoTest.
 */
class PasswordSetupCodeNotification extends Notification
{
    use DipicuAkunDemo;

    public function __construct(public string $code)
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
            ->subject("Kode {$this->code} untuk membuat kata sandi ".config('app.name'))
            ->line('Gunakan kode berikut untuk membuat kata sandi akun Anda:')
            ->line("# {$this->code}")
            ->line('Kode berlaku 10 menit dan hanya bisa dipakai sekali.')
            ->line('Jangan berikan kode ini kepada siapa pun, termasuk petugas. Bila Anda tidak memintanya, abaikan email ini - kata sandi tidak bisa dibuat tanpa kode ini.');
    }
}

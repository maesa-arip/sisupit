<?php

namespace App\Notifications;

use App\Notifications\Concerns\DipicuAkunDemo;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email undangan menjadi petugas (2026-11-06). Dikirim ke ALAMAT (Notification::route), bukan
 * ke akun - penerimanya bisa belum punya akun. Kanal `mail` bawaan, sengaja tidak ShouldQueue:
 * kirim yang gagal harus sampai ke layar admin (pola PasswordSetupCodeNotification).
 * catatPemicu(): undangan dari akun demo tidak sampai ke alamat asli (TASK_81).
 */
class PetugasInvitationNotification extends Notification
{
    use DipicuAkunDemo;

    public function __construct(
        public string $url,
        public string $inviterName,
        public string $regionName,
        public string $expiresAt,
    ) {
        $this->catatPemicu();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Undangan menjadi petugas di '.config('app.name'))
            ->line("{$this->inviterName} mengundang Anda menjadi **petugas** dengan wilayah tugas **{$this->regionName}**.")
            ->line('Buka tautan di bawah untuk membuat akun, atau masuk dengan akun yang sudah ada bila email ini sudah terdaftar.')
            ->action('Terima Undangan', $this->url)
            ->line("Tautan berlaku sampai {$this->expiresAt} WITA dan hanya bisa dipakai sekali.")
            ->line('Bila Anda tidak merasa diundang, abaikan email ini.');
    }
}

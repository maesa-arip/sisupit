<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewReportNotification extends Notification implements ShouldQueue
{
    use Queueable;
    private $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $latitude = $this->data['location_lat'] ?? 0;
        $longitude = $this->data['location_lng'] ?? 0;
        $mapUrl = "https://www.google.com/maps/dir/?api=1&destination={$latitude},{$longitude}";
        return (new MailMessage)
            ->subject('Laporan Kejadian Baru')
            ->greeting('Hello!')
            // ->line('Test isi Notifikasi:' . $this->data)
            // ->action('Notification Action', url('/'))
            ->action('Lihat Lokasi di Google Maps', $mapUrl)
            ->salutation('Terima kasih telah menggunakan sistem kami.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'data' => $this->data
        ];
    }
}

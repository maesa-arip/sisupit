<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class WebPushNotification extends Notification
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
        return [WebPushChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toWebPush($notifiable, $notification)
    {
         $latitude = $this->data['location_lat'] ?? 0;
        $longitude = $this->data['location_lng'] ?? 0;
        $mapUrl = "https://www.google.com/maps/dir/?api=1&destination={$latitude},{$longitude}";
        return (new WebPushMessage)
            ->title('Laporan Kejadian Baru')
            ->icon('/icon.png') // opsional
            ->body('Notifikasi Kejadian Baru, Silakan Lihat di Aplikasi Untuk Detail')
            ->action('Lihat', 'view_app')
            ->data(['url' => 'https://sisupit.test']);
    }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->line('The introduction to the notification.')
                    ->action('Notification Action', url('/'))
                    ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}

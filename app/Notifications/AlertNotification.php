<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class AlertNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    protected $title;
    protected $body;
    protected $url;
    public function __construct($title, $body, $url = '/')
    {
        $this->title = $title;
        $this->body = $body;
        $this->url = $url;
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
        // return WebPushMessage::create()
        //     ->title($this->title)
        //     ->body($this->body)
        //     ->icon('/icons/icon-192x192.png')
        //     ->badge('/icons/icon-96x96.png')
        //     ->data(['url' => $this->url]);
        return (new WebPushMessage)
            ->title('Notifikasi Baru!')
            ->body('Ini isi pesan notifikasinya.')
            ->action('Lihat', 'view_app')
            ->data(['url' => 'https://sisupit.test']);
    
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

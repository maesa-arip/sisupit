<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentLocationCorrected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reportId;

    public $lat;

    public $lng;

    /**
     * Alamat hasil reverse-geocode dari titik BARU. Dulu bernama `address` dan memang
     * menimpa kolom `reports.address` di seberang sana — yaitu patokan yang diketik warga
     * (TASK_49). Namanya diperjelas supaya penerimanya tak lagi bisa keliru menaruhnya di
     * tempat patokan; koreksi pin TIDAK mengubah patokan.
     */
    public $geoAddress;

    public function __construct($reportId, $lat, $lng, $geoAddress)
    {
        $this->reportId = $reportId;
        $this->lat = $lat;
        $this->lng = $lng;
        $this->geoAddress = $geoAddress;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('report-tracking.'.$this->reportId);
    }
}

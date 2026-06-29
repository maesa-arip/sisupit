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

    public $address;

    public function __construct($reportId, $lat, $lng, $address)
    {
        $this->reportId = $reportId;
        $this->lat = $lat;
        $this->lng = $lng;
        $this->address = $address;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('report-tracking.'.$this->reportId);
    }
}

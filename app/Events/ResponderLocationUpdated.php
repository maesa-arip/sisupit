<?php

// app/Events/ResponderLocationUpdated.php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Gunakan ShouldBroadcastNow agar real-time instan
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResponderLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reportId;
    public $responderId;
    public $responderType; // 'relawan' atau 'petugas'
    public $responderName;
    public $lat;
    public $lng;

    public function __construct($reportId, $responderId, $responderType, $responderName, $lat, $lng)
    {
        $this->reportId = $reportId;
        $this->responderId = $responderId;
        $this->responderType = $responderType;
        $this->responderName = $responderName;
        $this->lat = $lat;
        $this->lng = $lng;
    }

    // Hanya pancarkan di PRIVATE channel milik laporan ini
    public function broadcastOn()
    {
        return new PrivateChannel('report-tracking.' . $this->reportId);
    }
}
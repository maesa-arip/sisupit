<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // instan, sama dengan ResponderLocationUpdated
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Disiarkan saat status laporan berubah (approve/reject/handling/resolved) agar halaman
 * Reports/Show yang sedang terbuka di perangkat lain (pelapor/responder/komando) ikut
 * update tanpa refresh (FINDINGS #28). Pakai channel privat yang sama dengan tracking lokasi.
 */
class ReportStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reportId;

    public $status;

    public $rejectedReason;

    public function __construct($reportId, $status, $rejectedReason = null)
    {
        $this->reportId = $reportId;
        $this->status = $status;
        $this->rejectedReason = $rejectedReason;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('report-tracking.'.$this->reportId);
    }
}

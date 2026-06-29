<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // instan, sama dengan ResponderLocationUpdated
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Disiarkan saat DAFTAR responder sebuah insiden berubah — responder baru meluncur
 * (takeAction), membatalkan keberangkatan (cancelResponse), tiba (arrive), atau insiden
 * ditutup (resolve). Halaman Reports/Show yang terbuka di perangkat lain (pelapor/komando/
 * responder lain) memuat ulang prop `report` agar manifes & marker peta ikut update tanpa
 * refresh. Hanya sinyal (reportId); data aktual diambil ulang lewat controller agar tetap
 * ter-scope otorisasi & konsisten bentuknya. Pakai channel privat yang sama dgn tracking.
 */
class ResponderRosterChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reportId;

    public function __construct($reportId)
    {
        $this->reportId = $reportId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('report-tracking.'.$this->reportId);
    }
}

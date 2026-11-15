<?php

namespace App\Events;

use App\Models\ReporterCall;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Aba-aba panggilan Sisupit (TASK_90): "panggilan #X berubah, ambil keadaannya". Dikirim ke
 * channel pribadi pemanggil dan pelapor ber-akun, atau ke channel publik bernama rahasia milik
 * halaman status tamu (ReporterCall::guestChannel).
 *
 * ABA-ABA, BUKAN DATA: SDP memuat alamat jaringan peserta, jadi tak pernah ikut siaran -
 * keduanya diambil lewat route yang memeriksa peserta (pola ReportRecordChanged).
 *
 * Aman bagi exe desktop: ia mendengar channel App.Models.User.{id} tapi hanya bereaksi pada
 * BroadcastNotificationCreated (SisupitDesktop src/realtime.js), jadi event bernama lain ini
 * tak pernah dibunyikan sebagai sirine. JANGAN ubah ini menjadi Notification ber-'broadcast'.
 */
class ReporterCallChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public int $callId;

    public string $status;

    private array $channels;

    public function __construct(ReporterCall $call)
    {
        $this->callId = $call->id;
        $this->status = $call->status;

        $this->channels = array_values(array_filter([
            $call->caller_id ? new PrivateChannel('App.Models.User.'.$call->caller_id) : null,
            $call->callee_user_id
                ? new PrivateChannel('App.Models.User.'.$call->callee_user_id)
                : new Channel(ReporterCall::guestChannel($call->report_id)),
        ]));
    }

    public function broadcastOn(): array
    {
        return $this->channels;
    }

    public function broadcastAs(): string
    {
        return 'reporter-call.changed';
    }

    public function broadcastWith(): array
    {
        return ['callId' => $this->callId, 'status' => $this->status];
    }
}

<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // instan, sama dengan ResponderRosterChanged
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Disiarkan saat CATATAN sebuah insiden berubah tanpa status maupun daftar respondernya
 * ikut berpindah — OPD dilibatkan/dilepas/mengonfirmasi tindakannya, entri berita acara
 * dibuat/dihapus, atau pelapor menyunting isi laporannya sendiri (FINDINGS #113).
 *
 * Kenapa ia perlu ada di samping ReportStatusChanged & ResponderRosterChanged: kedua event
 * itu menjawab pertanyaan lain, dan sebelum ini SELURUH mutasi di atas tidak menyiarkan
 * apa pun. Gejalanya senyap total — panel OPD di layar petugas yang sedang berdiri di TKP
 * tetap berbunyi "menunggu konfirmasi" sesudah PLN benar-benar mengonfirmasi listrik sudah
 * padam, tanpa satu pun galat; yang berubah cuma isi database.
 *
 * ABA-ABA, BUKAN DATA (alasan yang sama dengan ReportFeedChanged): channel ini juga
 * didengar pelapor & relawan yang mengambil tugas, sementara yang berubah bisa berupa
 * catatan konfirmasi OPD atau ringkasan berita acara. Karena itu payloadnya hanya reportId
 * dan yang menyajikan datanya tetap server lewat `router.reload()` di sisi klien, sehingga
 * gerbang per-peran di ReportController::show() dihitung ulang untuk tiap penonton.
 */
class ReportRecordChanged implements ShouldBroadcastNow
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

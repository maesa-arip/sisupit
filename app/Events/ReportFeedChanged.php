<?php

namespace App\Events;

use App\Models\Report;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

/**
 * Disiarkan saat DAFTAR laporan sebuah wilayah berubah (laporan baru masuk, atau status
 * sebuah laporan berpindah) agar keempat dashboard yang sedang terbuka ikut memperbarui
 * diri tanpa perlu di-reload manual.
 *
 * BEDA dari ReportStatusChanged, dan sengaja tidak digabung dengannya:
 * - ReportStatusChanged berbicara kepada orang-orang SATU laporan (pelapor, responder,
 *   komando yang membuka halaman detail) lewat channel `report-tracking.{id}`, dan
 *   payloadnya boleh rinci — termasuk alasan penolakan.
 * - ReportFeedChanged berbicara kepada SATU WILAYAH. Penerimanya jauh lebih luas, jadi
 *   payloadnya sengaja hanya id + status: cukup untuk menjadi ABA-ABA, tidak cukup untuk
 *   membocorkan apa pun. Yang menampilkan datanya tetap server, lewat `router.reload()`
 *   di sisi klien, sehingga otorisasi & scope Tenantable dihitung ulang di sana.
 *
 * Menggabungkan keduanya berarti alasan penolakan sebuah laporan ikut tersiar ke seluruh
 * wilayah — karena satu payload berlaku untuk semua channel sebuah event.
 */
class ReportFeedChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<int, string>  $channelNames
     */
    public function __construct(
        public int $reportId,
        public string $status,
        public array $channelNames,
    ) {}

    /**
     * Satu-satunya tempat "laporan ini membangunkan siapa" ditentukan. Disiarkan ke SEMUA
     * tingkat wilayah laporan sekaligus, karena tiap akun mendengar di tingkatnya sendiri
     * (lihat User::reportFeedChannel) — staf desa di `reports.village.*`, admin kota di
     * `reports.city.*`, dan seterusnya. Ditambah tiap OPD yang diminta membantu insiden ini,
     * yang relevansinya keanggotaan dan bukan wilayah.
     */
    public static function for(Report $report, ?string $status = null): self
    {
        $channels = ['reports.all'];

        foreach (['province', 'city', 'district', 'village'] as $level) {
            if ($code = $report->{$level.'_code'}) {
                $channels[] = 'reports.'.$level.'.'.$code;
            }
        }

        // DB::table (bukan relasi Eloquent) supaya global scope model mana pun tak bisa
        // diam-diam memangkas daftar penerima: yang menentukan hak dengar adalah
        // routes/channels.php, bukan scope yang kebetulan aktif saat event dibuat.
        foreach (DB::table('report_agencies')->where('report_id', $report->id)->pluck('agency_id') as $agencyId) {
            $channels[] = 'reports.agency.'.$agencyId;
        }

        // $status ditegaskan pemanggil di titik-titik yang baru saja menulis status lewat
        // query (objek di memori masih membawa status lama di sana).
        return new self($report->id, (string) ($status ?? $report->status), $channels);
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return array_map(fn (string $name) => new PrivateChannel($name), $this->channelNames);
    }

    /**
     * Aba-aba, bukan data. Tanpa ini payload default akan ikut membawa `channelNames`
     * (peta wilayah insiden) ke setiap pendengar.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'reportId' => $this->reportId,
            'status' => $this->status,
        ];
    }
}

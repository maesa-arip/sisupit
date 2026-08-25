<?php

namespace App\Console\Commands;

use App\Models\Agency;
use App\Models\Report;
use App\Models\ReportAgency;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

// Lengkapi satu laporan menjadi contoh peragaan yang utuh: responder petugas & relawan berikut
// JEJAK RUTE-nya di peta, OPD terkait beserta konfirmasinya, dan berita acara final.
//
// Bedanya dengan `sisupit:simulate-responders`: perintah itu menggerakkan responder secara live
// (butuh Reverb) atau menaruhnya di tengah jalan menuju TKP, selalu berstatus `en_route`, dan
// respondennya dipilih acak. Yang ini menyusun KEADAAN AKHIR sebuah insiden dengan responder
// yang DITENTUKAN, tahapnya mengikuti status laporan (handling → sebagian tiba & sebagian masih
// di jalan; resolved → semua selesai), sehingga satu laporan bisa dipakai memperagakan seluruh
// alur tanpa menunggu apa pun.
//
// Perhitungan geometri & pengambilan rute sengaja disalin dari SimulateResponders alih-alih
// diangkat jadi trait bersama: perintah itu dipakai di produksi dan tidak punya test, jadi
// menyentuhnya demi berbagi tiga fungsi kecil lebih berisiko daripada menyalinnya. Kalau ada
// yang ketiga, barulah pantas diangkat.
class SeedDemoIncident extends Command
{
    protected $signature = 'sisupit:demo-incident
        {report : ID laporan yang akan dilengkapi}
        {--officers= : ID user petugas, dipisah koma}
        {--volunteers= : ID user relawan, dipisah koma}
        {--agencies=none : none|notified|confirmed — lampirkan OPD aktif di kota laporan}
        {--resolution : buat berita acara final (hanya untuk laporan yang sudah selesai)}';

    protected $description = 'Lengkapi sebuah laporan jadi contoh peragaan: responder + jejak rute di peta, OPD terkait, berita acara';

    /** Jumlah titik rute yang disimpan per responder. */
    private const ROUTE_POINTS = 30;

    public function handle(): int
    {
        $report = Report::withoutGlobalScopes()->find($this->argument('report'));

        if (! $report) {
            $this->error('Laporan #'.$this->argument('report').' tidak ditemukan.');

            return self::FAILURE;
        }

        if (is_null($report->lat) || is_null($report->lng)) {
            $this->error("Laporan #{$report->id} tidak punya koordinat, rute tak bisa dibangun.");

            return self::FAILURE;
        }

        $officers = $this->resolveUsers('officers', 'petugas');
        $volunteers = $this->resolveUsers('volunteers', 'relawan');

        if ($officers === null || $volunteers === null) {
            return self::FAILURE;
        }

        // Tahap responder mengikuti STATUS laporan, bukan opsi tersendiri: laporan yang belum
        // ditangani tidak boleh punya responder di lapangan, dan laporan yang sudah selesai
        // tidak boleh menyisakan responder yang masih di jalan. Menaruhnya di satu tempat
        // mencegah contoh peragaan yang isinya bertentangan dengan statusnya sendiri.
        if (($officers->isNotEmpty() || $volunteers->isNotEmpty())
            && ! in_array($report->status, ['handling', 'resolved'], true)) {
            $this->error("Laporan #{$report->id} berstatus '{$report->status}' — responder hanya untuk status handling atau resolved.");

            return self::FAILURE;
        }

        $bearing = rand(0, 359);

        foreach ([['petugas', $officers], ['relawan', $volunteers]] as [$type, $users]) {
            foreach ($users->values() as $index => $user) {
                $this->attachResponder($report, $user, $type, $index === 0, $bearing);
                $bearing = ($bearing + rand(60, 110)) % 360;
            }
        }

        if ($this->option('agencies') !== 'none') {
            $this->attachAgencies($report, $this->option('agencies') === 'confirmed');
        }

        if ($this->option('resolution')) {
            if ($report->status !== 'resolved') {
                $this->error("Berita acara dilewati: laporan #{$report->id} belum berstatus resolved.");

                return self::FAILURE;
            }

            $this->writeResolution($report, $officers->first());
        }

        $this->info("✅ Laporan #{$report->id} dilengkapi. Buka /reports/{$report->id} untuk melihat.");

        return self::SUCCESS;
    }

    /** @return \Illuminate\Support\Collection<int, User>|null null bila ada id yang tak sah */
    private function resolveUsers(string $option, string $role)
    {
        $ids = array_filter(array_map('trim', explode(',', (string) $this->option($option))), 'strlen');

        if ($ids === []) {
            return collect();
        }

        $users = User::withoutGlobalScopes()->whereIn('id', $ids)->get();

        foreach ($ids as $id) {
            $user = $users->firstWhere('id', (int) $id);

            if (! $user) {
                $this->error("User #{$id} tidak ditemukan.");

                return null;
            }

            // Peran diperiksa karena tabel tujuannya berbeda per peran: relawan yang masuk
            // report_officers akan muncul sebagai petugas di seluruh UI tanpa ada yang menolak.
            if (! $user->hasRole($role)) {
                $this->error("User #{$id} ({$user->name}) bukan {$role}.");

                return null;
            }
        }

        return $users->sortBy(fn ($user) => array_search((string) $user->id, $ids))->values();
    }

    /**
     * Satu responder: baris keanggotaan (report_officers/report_helpers) + jejak lokasinya di
     * `tracking_logs`, yang itulah yang digambar sebagai garis rute di halaman detail insiden.
     */
    private function attachResponder(Report $report, User $user, string $type, bool $isLead, int $bearing): void
    {
        $isOfficer = $type === 'petugas';
        $arrived = $report->status === 'resolved' || $isLead;

        $route = $this->buildRoute($report, $bearing, $isOfficer ? 3.5 : 2.2);
        $lastIndex = count($route) - 1;
        $reached = $arrived ? $lastIndex : (int) round(($isOfficer ? 0.55 : 0.7) * $lastIndex);

        $startedAt = Carbon::parse($report->created_at)->addMinutes($isOfficer ? 6 : 9);
        $arrivedAt = $arrived ? $startedAt->copy()->addMinutes(12) : null;
        $finishedAt = $report->status === 'resolved' ? $startedAt->copy()->addMinutes(89) : null;

        DB::table($isOfficer ? 'report_officers' : 'report_helpers')->updateOrInsert(
            ['report_id' => $report->id, 'user_id' => $user->id],
            [
                'status' => $finishedAt ? 'finished' : ($arrived ? 'arrived' : 'en_route'),
                'location_lat' => $route[$reached][0],
                'location_lng' => $route[$reached][1],
                $isOfficer ? 'dispatched_at' : 'started_at' => $startedAt,
                'arrived_at' => $arrivedAt,
                'finished_at' => $finishedAt,
                'created_at' => $startedAt,
                'updated_at' => $finishedAt ?? $arrivedAt ?? $startedAt->copy()->addMinutes(6),
            ]
        );

        // Jejak lama responder ini dibuang dulu supaya perintah bisa dijalankan berulang tanpa
        // menumpuk garis rute di peta.
        DB::table('tracking_logs')->where('report_id', $report->id)->where('user_id', $user->id)->delete();

        $rows = [];
        for ($i = 0; $i <= $reached; $i++) {
            $recordedAt = $startedAt->copy()->addSeconds($i * 40);
            $rows[] = [
                'report_id' => $report->id,
                'user_id' => $user->id,
                'user_type' => $type,
                'lat' => $route[$i][0],
                'lng' => $route[$i][1],
                'recorded_at' => $recordedAt,
                'created_at' => $recordedAt,
                'updated_at' => $recordedAt,
            ];
        }
        DB::table('tracking_logs')->insert($rows);

        $status = $finishedAt ? 'selesai' : ($arrived ? 'tiba di lokasi' : 'masih di jalan');
        $this->line("  {$type}: {$user->name} — {$status}, ".count($rows).' titik jejak');
    }

    /** OPD terkait + konfirmasinya, meniru apa yang ditulis ReportActionController saat broadcast. */
    private function attachAgencies(Report $report, bool $confirmed): void
    {
        $agencies = Agency::withoutGlobalScopes()
            ->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('city_code')->orWhere('city_code', $report->city_code))
            ->get();

        if ($agencies->isEmpty()) {
            $this->warn('  Tidak ada OPD aktif untuk kota laporan ini — bagian OPD dilewati.');

            return;
        }

        $operator = User::withoutGlobalScopes()
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->where('city_code', $report->city_code)
            ->first();

        $notifiedAt = Carbon::parse($report->created_at)->addMinutes(4);

        foreach ($agencies as $agency) {
            DB::table('report_agencies')->updateOrInsert(
                ['report_id' => $report->id, 'agency_id' => $agency->id],
                [
                    'notified_by' => $operator?->id,
                    'notified_at' => $notifiedAt,
                    'status' => $confirmed ? ReportAgency::STATUS_RESPONDED : ReportAgency::STATUS_NOTIFIED,
                    'agency_name' => $agency->name,
                    'requires_confirmation' => $agency->requires_confirmation,
                    'confirmation_label' => $agency->confirmation_label,
                    'confirmed_at' => $confirmed ? $notifiedAt->copy()->addMinutes(11) : null,
                    'confirmed_by' => $confirmed ? $operator?->id : null,
                    'confirmed_source' => $confirmed ? ReportAgency::SOURCE_OPD : null,
                    'confirmation_note' => $confirmed && $agency->requires_confirmation
                        ? $agency->confirmation_label.' — dikonfirmasi petugas instansi di lokasi.'
                        : null,
                    'created_at' => $notifiedAt,
                    'updated_at' => $notifiedAt->copy()->addMinutes(11),
                ]
            );

            $this->line("  OPD: {$agency->name} — ".($confirmed ? 'terkonfirmasi' : 'menunggu konfirmasi'));
        }
    }

    /** Berita acara final (TASK_39), append-only: yang lama untuk laporan ini dibuang dulu. */
    private function writeResolution(Report $report, ?User $author): void
    {
        $team = DB::table('report_officers as o')->join('users as u', 'u.id', '=', 'o.user_id')
            ->where('o.report_id', $report->id)->pluck('u.name')
            ->merge(
                DB::table('report_helpers as h')->join('users as u', 'u.id', '=', 'h.user_id')
                    ->where('h.report_id', $report->id)->pluck('u.name')
            )->implode(', ');

        DB::table('report_resolutions')->where('report_id', $report->id)->delete();

        DB::table('report_resolutions')->insert([
            'report_id' => $report->id,
            'created_by' => $author?->id,
            'status' => 'final',
            'jenis_kejadian' => $report->title,
            'sumber_informasi' => 'Laporan warga melalui aplikasi Sisupit',
            'occurred_at' => $report->created_at,
            'lokasi_alamat' => $report->address,
            'kelurahan' => DB::table('indonesia_villages')->where('code', $report->village_code)->value('name'),
            'kecamatan' => DB::table('indonesia_districts')->where('code', $report->district_code)->value('name'),
            'kerugian' => 'Tidak ada korban jiwa maupun luka',
            'tim_atensi' => $team,
            'kronologi' => 'Laporan diterima Pusat Komando, diverifikasi, lalu disiarkan ke petugas dan relawan '
                .'di sekitar lokasi. Regu tiba di TKP dan melakukan pemadaman hingga api dinyatakan padam, '
                .'dilanjutkan pendinginan sebelum lokasi ditinggalkan.',
            'created_at' => Carbon::parse($report->created_at)->addMinutes(110),
            'updated_at' => Carbon::parse($report->created_at)->addMinutes(110),
        ]);

        $this->line('  Berita acara final ditulis (tim: '.$team.')');
    }

    /** Rute jalan asli dari titik ~$km dari TKP menuju TKP, di-resample ke ROUTE_POINTS titik. */
    private function buildRoute(Report $report, int $bearing, float $km): array
    {
        [$startLat, $startLng] = $this->destinationPoint((float) $report->lat, (float) $report->lng, $bearing, $km);

        $coords = $this->fetchRoute($startLat, $startLng, (float) $report->lat, (float) $report->lng);

        return $this->resample($coords, self::ROUTE_POINTS);
    }

    /** Titik sejauh $km dari ($lat,$lng) ke arah $bearing derajat. */
    private function destinationPoint(float $lat, float $lng, float $bearing, float $km): array
    {
        $radius = 6371;
        $angular = $km / $radius;
        $b = deg2rad($bearing);
        $latR = deg2rad($lat);
        $lngR = deg2rad($lng);

        $lat2 = asin(sin($latR) * cos($angular) + cos($latR) * sin($angular) * cos($b));
        $lng2 = $lngR + atan2(sin($b) * sin($angular) * cos($latR), cos($angular) - sin($latR) * sin($lat2));

        return [rad2deg($lat2), rad2deg($lng2)];
    }

    /**
     * Geometri rute jalan asli dari OSRM. Fallback ke garis lurus bila OSRM tak tersedia —
     * contoh peragaan tetap terbentuk, garisnya saja yang tidak mengikuti jalan.
     */
    private function fetchRoute(float $fromLat, float $fromLng, float $toLat, float $toLng): array
    {
        $baseUrl = rtrim(config('services.osrm.base_url'), '/');

        try {
            $response = Http::withHeaders(['User-Agent' => config('services.osrm.user_agent')])
                ->timeout(10)
                ->get("{$baseUrl}/route/v1/driving/{$fromLng},{$fromLat};{$toLng},{$toLat}", [
                    'overview' => 'full',
                    'geometries' => 'geojson',
                ]);

            if ($response->ok()) {
                $coords = $response->json('routes.0.geometry.coordinates');

                if (is_array($coords) && count($coords) >= 2) {
                    return array_map(fn ($c) => [(float) $c[1], (float) $c[0]], $coords);
                }
            }

            $this->warn('  OSRM tidak mengembalikan rute, dipakai garis lurus.');
        } catch (\Throwable $e) {
            $this->warn('  OSRM gagal dihubungi ('.$e->getMessage().'), dipakai garis lurus.');
        }

        $coords = [];
        for ($i = 0; $i <= 30; $i++) {
            $t = $i / 30;
            $coords[] = [$fromLat + ($toLat - $fromLat) * $t, $fromLng + ($toLng - $fromLng) * $t];
        }

        return $coords;
    }

    /** Resample polyline ke $n titik berjarak indeks merata, titik akhir selalu ikut. */
    private function resample(array $coords, int $n): array
    {
        $count = count($coords);

        if ($count <= $n) {
            return $coords;
        }

        $out = [];
        for ($i = 0; $i < $n; $i++) {
            $out[] = $coords[(int) round($i * ($count - 1) / ($n - 1))];
        }

        return $out;
    }
}

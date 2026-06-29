<?php

namespace App\Console\Commands;

use App\Events\ResponderLocationUpdated;
use App\Models\Report;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

// Simulasikan posisi petugas & relawan yang benar-benar bergerak menyusuri rute jalan asli
// (lewat OSRM) menuju titik insiden, agar peta komando terlihat real. Dua mode:
//   - default (live): gerakkan posisi tiap beberapa detik + broadcast ke peta (butuh Reverb)
//   - --snapshot     : tulis sekali jejak + posisi terkini di tengah jalan menuju TKP, lalu keluar
class SimulateResponders extends Command
{
    protected $signature = 'sisupit:simulate-responders
        {report? : ID laporan (default: laporan aktif terbaru yang belum selesai)}
        {--officers=1 : jumlah petugas yang disimulasikan}
        {--volunteers=2 : jumlah relawan yang disimulasikan}
        {--radius=4 : jarak titik awal responder dari TKP (km)}
        {--steps=40 : jumlah titik di sepanjang rute}
        {--interval=2 : jeda antar langkah saat mode live (detik)}
        {--progress=0.6 : seberapa jauh responder sudah berjalan saat mode --snapshot (0..1)}
        {--snapshot : tulis jejak sekali lalu keluar (tanpa animasi live)}';

    protected $description = 'Simulasikan posisi petugas & relawan bergerak menyusuri rute jalan asli menuju titik insiden';

    public function handle(): int
    {
        $report = $this->resolveReport();
        if (! $report) {
            return self::FAILURE;
        }

        if (is_null($report->lat) || is_null($report->lng)) {
            $this->error("Laporan #{$report->id} tidak punya koordinat (lat/lng).");

            return self::FAILURE;
        }

        if ($report->status === 'resolved') {
            $this->error("Laporan #{$report->id} sudah selesai (resolved), tidak ada yang perlu disimulasikan.");

            return self::FAILURE;
        }

        // Pastikan laporan dalam status yang menampilkan panel tracking di UI.
        if (in_array($report->status, ['TERLAPOR', 'pending'])) {
            $report->update(['status' => 'handling']);
            $this->info("Status laporan #{$report->id} diset ke 'handling'.");
        }

        $officers = $this->pickUsers('petugas', (int) $this->option('officers'));
        $volunteers = $this->pickUsers('relawan', (int) $this->option('volunteers'));

        if ($officers->isEmpty() && $volunteers->isEmpty()) {
            $this->error('Tidak ada user dengan role petugas/relawan untuk disimulasikan (jalankan UserTenantSeeder dulu).');

            return self::FAILURE;
        }

        // Bangun manifes responden + rute jalan asli masing-masing.
        $responders = [];
        $bearing = rand(0, 359);
        foreach ($officers as $u) {
            $responders[] = $this->buildResponder($report, $u, 'petugas', $bearing);
            $bearing = ($bearing + rand(40, 90)) % 360;
        }
        foreach ($volunteers as $u) {
            $responders[] = $this->buildResponder($report, $u, 'relawan', $bearing);
            $bearing = ($bearing + rand(40, 90)) % 360;
        }

        $responders = array_filter($responders);
        if (empty($responders)) {
            $this->error('Gagal membangun rute untuk responden.');

            return self::FAILURE;
        }

        return $this->option('snapshot')
            ? $this->runSnapshot($report, $responders)
            : $this->runLive($report, $responders);
    }

    private function resolveReport(): ?Report
    {
        $query = Report::withoutGlobalScopes();

        if ($id = $this->argument('report')) {
            $report = $query->find($id);
            if (! $report) {
                $this->error("Laporan #{$id} tidak ditemukan.");
            }

            return $report;
        }

        $report = $query->whereNotIn('status', ['resolved'])
            ->whereNotNull('lat')->whereNotNull('lng')
            ->latest('id')->first();

        if (! $report) {
            $this->error('Tidak ada laporan aktif (non-resolved) dengan koordinat. Beri argumen ID laporan.');
        }

        return $report;
    }

    private function pickUsers(string $role, int $count)
    {
        if ($count <= 0) {
            return collect();
        }

        return User::whereHas('roles', fn ($q) => $q->where('name', $role))
            ->inRandomOrder()
            ->take($count)
            ->get();
    }

    /**
     * Bangun data responder: titik awal acak ~radius km dari TKP + rute jalan asli ke TKP
     * (di-resample ke --steps titik). Mengembalikan null bila rute gagal dibangun.
     */
    private function buildResponder(Report $report, User $user, string $type, int $bearing): ?array
    {
        $radiusKm = (float) $this->option('radius');
        [$startLat, $startLng] = $this->destinationPoint((float) $report->lat, (float) $report->lng, $bearing, $radiusKm);

        $coords = $this->fetchRoute($startLat, $startLng, (float) $report->lat, (float) $report->lng);
        if (count($coords) < 2) {
            return null;
        }

        $coords = $this->resample($coords, max(2, (int) $this->option('steps')));

        $this->line("  {$type}: {$user->name} — titik awal ".number_format($startLat, 5).','.number_format($startLng, 5).' ('.count($coords).' titik rute)');

        return [
            'user' => $user,
            'type' => $type,
            'table' => $type === 'petugas' ? 'report_officers' : 'report_helpers',
            'timeColumn' => $type === 'petugas' ? 'dispatched_at' : 'started_at',
            'coords' => $coords,
        ];
    }

    private function runSnapshot(Report $report, array $responders): int
    {
        $progress = min(1, max(0, (float) $this->option('progress')));

        foreach ($responders as $r) {
            $coords = $r['coords'];
            $lastIndex = count($coords) - 1;
            $k = (int) round($progress * $lastIndex);
            $now = Carbon::now();
            $dispatchedAt = $now->copy()->subMinutes($k * 2 + 2);

            DB::transaction(function () use ($report, $r, $coords, $k, $dispatchedAt) {
                DB::table($r['table'])->updateOrInsert(
                    ['report_id' => $report->id, 'user_id' => $r['user']->id],
                    [
                        'status' => 'en_route',
                        'location_lat' => $coords[$k][0],
                        'location_lng' => $coords[$k][1],
                        $r['timeColumn'] => $dispatchedAt,
                        'arrived_at' => null,
                        'finished_at' => null,
                        'created_at' => $dispatchedAt,
                        'updated_at' => Carbon::now(),
                    ]
                );

                // Hapus jejak lama responder ini agar tidak menumpuk saat di-run ulang.
                DB::table('tracking_logs')
                    ->where('report_id', $report->id)
                    ->where('user_id', $r['user']->id)
                    ->whereIn('user_type', ['petugas', 'relawan'])
                    ->delete();

                $rows = [];
                for ($i = 0; $i <= $k; $i++) {
                    $logTime = $dispatchedAt->copy()->addMinutes($i * 2);
                    $rows[] = [
                        'report_id' => $report->id,
                        'user_id' => $r['user']->id,
                        'user_type' => $r['type'],
                        'lat' => $coords[$i][0],
                        'lng' => $coords[$i][1],
                        'recorded_at' => $logTime,
                        'created_at' => $logTime,
                        'updated_at' => $logTime,
                    ];
                }
                DB::table('tracking_logs')->insert($rows);
            });
        }

        $this->info('✅ Snapshot ditulis: responden berada di tengah rute jalan menuju TKP. Buka /reports/'.$report->id.' untuk melihat.');

        return self::SUCCESS;
    }

    private function runLive(Report $report, array $responders): int
    {
        $interval = max(0, (int) $this->option('interval'));

        // Tempatkan semua responden di titik awal rutenya.
        foreach ($responders as $r) {
            $start = $r['coords'][0];
            DB::table($r['table'])->updateOrInsert(
                ['report_id' => $report->id, 'user_id' => $r['user']->id],
                [
                    'status' => 'en_route',
                    'location_lat' => $start[0],
                    'location_lng' => $start[1],
                    $r['timeColumn'] => Carbon::now(),
                    'arrived_at' => null,
                    'finished_at' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]
            );
        }

        $maxLen = max(array_map(fn ($r) => count($r['coords']), $responders));
        $this->info("▶ Mode live: {$maxLen} langkah, jeda {$interval}s. Tekan Ctrl+C untuk berhenti.");

        for ($step = 0; $step < $maxLen; $step++) {
            foreach ($responders as $r) {
                $idx = min($step, count($r['coords']) - 1);
                $pos = $r['coords'][$idx];
                $this->advance($report, $r, $pos[0], $pos[1]);
            }
            $this->line('  langkah '.($step + 1)."/{$maxLen}");
            if ($step < $maxLen - 1 && $interval > 0) {
                sleep($interval);
            }
        }

        // Tandai semua responden tiba di lokasi.
        foreach ($responders as $r) {
            DB::table($r['table'])
                ->where('report_id', $report->id)
                ->where('user_id', $r['user']->id)
                ->update(['status' => 'arrived', 'arrived_at' => Carbon::now(), 'updated_at' => Carbon::now()]);
        }

        $this->info('✅ Simulasi live selesai: semua responden tiba di TKP.');

        return self::SUCCESS;
    }

    /** Satu langkah pergerakan: update posisi terkini + catat jejak + broadcast ke peta. */
    private function advance(Report $report, array $r, float $lat, float $lng): void
    {
        DB::transaction(function () use ($report, $r, $lat, $lng) {
            DB::table($r['table'])
                ->where('report_id', $report->id)
                ->where('user_id', $r['user']->id)
                ->update(['location_lat' => $lat, 'location_lng' => $lng, 'updated_at' => Carbon::now()]);

            DB::table('tracking_logs')->insert([
                'report_id' => $report->id,
                'user_id' => $r['user']->id,
                'user_type' => $r['type'],
                'lat' => $lat,
                'lng' => $lng,
                'recorded_at' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        });

        try {
            broadcast(new ResponderLocationUpdated($report->id, $r['user']->id, $r['type'], $r['user']->name, $lat, $lng));
        } catch (\Throwable $e) {
            // Broadcast best-effort (butuh Reverb aktif); DB tetap terupdate walau gagal.
        }
    }

    /**
     * Ambil geometri rute jalan asli dari OSRM. Fallback ke interpolasi garis lurus
     * bila OSRM tidak tersedia agar simulasi tetap jalan offline.
     */
    private function fetchRoute(float $fromLat, float $fromLng, float $toLat, float $toLng): array
    {
        $baseUrl = rtrim(config('services.osrm.base_url'), '/');
        $userAgent = config('services.osrm.user_agent');

        try {
            $response = Http::withHeaders(['User-Agent' => $userAgent])
                ->timeout(10)
                ->get("{$baseUrl}/route/v1/driving/{$fromLng},{$fromLat};{$toLng},{$toLat}", [
                    'overview' => 'full',
                    'geometries' => 'geojson',
                ]);

            if ($response->ok()) {
                $coords = $response->json('routes.0.geometry.coordinates');
                if (is_array($coords) && count($coords) >= 2) {
                    // GeoJSON [lng,lat] -> [lat,lng]
                    return array_map(fn ($c) => [(float) $c[1], (float) $c[0]], $coords);
                }
            }
            $this->warn('  OSRM tidak mengembalikan rute, pakai garis lurus sebagai fallback.');
        } catch (\Throwable $e) {
            $this->warn('  OSRM gagal dihubungi ('.$e->getMessage().'), pakai garis lurus sebagai fallback.');
        }

        // Fallback: interpolasi linear.
        $n = 30;
        $coords = [];
        for ($i = 0; $i <= $n; $i++) {
            $t = $i / $n;
            $coords[] = [$fromLat + ($toLat - $fromLat) * $t, $fromLng + ($toLng - $fromLng) * $t];
        }

        return $coords;
    }

    /** Resample polyline ke N titik dengan jarak indeks merata (selalu sertakan titik akhir). */
    private function resample(array $coords, int $n): array
    {
        $count = count($coords);
        if ($count <= $n) {
            return $coords;
        }

        $out = [];
        for ($i = 0; $i < $n; $i++) {
            $idx = (int) round($i / ($n - 1) * ($count - 1));
            $out[] = $coords[$idx];
        }

        return $out;
    }

    /** Titik tujuan dari (lat,lng) sejauh distanceKm pada bearing tertentu (derajat). */
    private function destinationPoint(float $lat, float $lng, float $bearingDeg, float $distanceKm): array
    {
        $R = 6371.0;
        $bearing = deg2rad($bearingDeg);
        $latR = deg2rad($lat);
        $lngR = deg2rad($lng);
        $angular = $distanceKm / $R;

        $lat2 = asin(sin($latR) * cos($angular) + cos($latR) * sin($angular) * cos($bearing));
        $lng2 = $lngR + atan2(
            sin($bearing) * sin($angular) * cos($latR),
            cos($angular) - sin($latR) * sin($lat2)
        );

        return [rad2deg($lat2), rad2deg($lng2)];
    }
}

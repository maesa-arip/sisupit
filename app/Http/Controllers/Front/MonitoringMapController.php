<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Hydrant;
use App\Models\HydrantWarga;
use App\Models\Pompa;
use App\Models\PosPemadam;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MonitoringMapController extends Controller
{
    /**
     * Peta Pemantauan terpadu (Pusat Komando): satu peta berisi semua layer —
     * kejadian, hydrant, pos pemadam, pompa, dan relawan — masing-masing dengan
     * filternya sendiri di sisi klien. Kejadian juga disaring di SERVER (periode, jenis,
     * kecamatan - TASK_78) karena jumlahnya terus bertambah; fasilitas & relawan tidak.
     * Data sudah ter-scope yurisdiksi di server: Report/Hydrant/Pompa/PosPemadam via trait
     * Tenantable (superadmin & admin nasional otomatis bypass), relawan via User::scopeIsAdmin().
     */
    public function index(Request $request)
    {
        $filters = $this->reportFilters($request);

        // Kejadian adalah prop SENDIRI (bukan bagian `layers`) dan semua prop berupa closure:
        // mengganti periode/jenis/kecamatan memuat ulang parsial `reports` saja, tanpa
        // menghitung ulang hydrant/pompa/pos/relawan yang tak ikut berubah (TASK_78).
        return Inertia::render('Monitoring/Map', [
            'reports' => fn () => $this->reports($filters),
            'report_filters' => $filters,
            'district_options' => fn () => Report::districtOptionsFor($request->user()),
            'layers' => fn () => $this->facilityLayers(),
        ]);
    }

    /**
     * Saringan kejadian peta. Tanpa periode = bawaan 7 hari (Report::MAP_DEFAULT_PERIODE);
     * 'semua' = tanpa batas tanggal, tetap dibatasi MAP_MARKER_LIMIT.
     */
    private function reportFilters(Request $request): array
    {
        $filters = Report::normalizeListFilters($request->only(['periode', 'from', 'to', 'jenis', 'kecamatan']));

        if ($request->input('periode') === 'semua') {
            return [...$filters, 'periode' => 'semua', 'from' => null, 'to' => null];
        }

        if (! $filters['periode'] && ! $filters['from'] && ! $filters['to']) {
            $filters['periode'] = Report::MAP_DEFAULT_PERIODE;
        }

        return $filters;
    }

    /**
     * Kejadian AKTIF (Laporan Masuk/Terverifikasi/Penanganan) selalu tampil berapa pun umurnya -
     * kebakaran yang belum selesai tak boleh hilang dari peta hanya karena laporannya lama.
     * Periode hanya membatasi RIWAYAT (Selesai/Ditolak/Digabung). Yang aktif diurutkan dulu,
     * jadi batas marker memotong riwayat paling lama lebih dulu, bukan kejadian berjalan.
     *
     * `regus` = regu yang meluncur ke kejadian itu (TASK_60), dari SNAPSHOT nama regu di baris
     * responder - sumber yang sama dengan halaman detail, dashboard petugas, & Export Excel.
     */
    private function reports(array $filters): array
    {
        [$start, $end] = Report::periodeRange($filters);
        $limit = Report::MAP_MARKER_LIMIT;

        $rows = Report::query()
            ->select(['id', 'title', 'address', 'geo_address', 'status', 'lat', 'lng', 'created_at'])
            ->whereNotNull('lat')->whereNotNull('lng')
            ->listFilter([...$filters, 'search' => null, 'periode' => null, 'from' => null, 'to' => null])
            ->when($start || $end, fn ($query) => $query->where(function ($query) use ($start, $end) {
                $query->whereIn('status', Report::STATUS_AKTIF)
                    ->orWhere(fn ($query) => $query
                        ->when($start, fn ($query) => $query->where('created_at', '>=', $start))
                        ->when($end, fn ($query) => $query->where('created_at', '<=', $end)));
            }))
            ->with(['officers' => fn ($q) => $q->whereNotNull('regu_name')->select('id', 'report_id', 'regu_name')])
            ->orderByRaw('CASE WHEN status IN (?, ?, ?) THEN 0 ELSE 1 END', Report::STATUS_AKTIF)
            ->latest('created_at')
            ->limit($limit + 1)
            ->get();

        return [
            'data' => $rows->take($limit)->map(fn (Report $report) => [
                'id' => $report->id,
                'title' => $report->title,
                'location' => $report->alamatTampil(),
                'time' => $report->created_at->diffForHumans(),
                'status' => $report->status,
                'lat' => (float) $report->lat,
                'lng' => (float) $report->lng,
                'regus' => $report->officers->pluck('regu_name')->unique()->sort()->values(),
            ])->values(),
            'truncated' => $rows->count() > $limit,
            'limit' => $limit,
        ];
    }

    private function facilityLayers(): array
    {
        // Layer hydrant = hydrant resmi (tabel `hydrants`). Hydrant swadaya warga punya
        // tabel sendiri dan ikut layer SKKL di bawah, mengikuti pembagian yang sama dengan
        // menu & halaman publik (TASK_30).
        $hydrants = Hydrant::whereNotNull('lat')->whereNotNull('lng')->get()
            ->map(fn (Hydrant $h) => [
                'id' => $h->id,
                'name' => $h->name,
                'address' => $h->address ?? 'Alamat tidak tersedia',
                'status' => $h->status ?? 'Aktif',
                'type' => $h->type ?? 'Stick',
                'lat' => (float) $h->lat,
                'lng' => (float) $h->lng,
            ])->values();

        $pumps = Pompa::whereNotNull('lat')->whereNotNull('lng')->get()
            ->map(fn (Pompa $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'address' => $p->address ?? 'Alamat tidak tersedia',
                'status' => $p->status ?? 'Aktif',
                'type' => $p->type ?? 'Statis (Hydrant)',
                'lat' => (float) $p->lat,
                'lng' => (float) $p->lng,
            ])
            ->concat(
                HydrantWarga::whereNotNull('lat')->whereNotNull('lng')->get()
                    ->map(fn (HydrantWarga $h) => [
                        'id' => $h->id,
                        'name' => $h->name,
                        'address' => $h->address ?? 'Alamat tidak tersedia',
                        // Hydrant warga punya kosakata statusnya sendiri sejak 2026-08-21
                        // (Belum/Sudah Modifikasi) — 'Aktif' di sini akan jadi nilai asing
                        // yang tak dikenali legenda peta.
                        'status' => $h->status ?? HydrantWarga::STATUSES[0],
                        'type' => $h->type ? 'Hydrant Warga · '.$h->type : 'Hydrant Warga',
                        'lat' => (float) $h->lat,
                        'lng' => (float) $h->lng,
                    ])
            )
            ->values();

        $stations = PosPemadam::whereNotNull('lat')->whereNotNull('lng')->get()
            ->map(fn (PosPemadam $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'address' => $s->address ?? 'Alamat tidak tersedia',
                'phone' => $s->phone ?? '113',
                'status' => $s->status ?? 'Aktif',
                'type' => $s->type ?? 'Pos Induk',
                'lat' => (float) $s->lat,
                'lng' => (float) $s->lng,
            ])->values();

        return [
            'hydrants' => $hydrants,
            'pumps' => $pumps,
            'stations' => $stations,
            'volunteers' => $this->volunteers(),
        ];
    }

    /**
     * Relawan tidak menyimpan koordinat sendiri (hanya kode wilayah), jadi
     * posisinya diperkirakan dari centroid wilayah terdekat yang tersedia:
     * desa → kecamatan → kabupaten (kolom `meta` tabel indonesia_* menyimpan
     * {lat, long}). Relawan tanpa data wilayah sama sekali tidak ditampilkan.
     */
    private function volunteers()
    {
        $relawan = User::query()
            ->isAdmin()
            ->whereHas('roles', fn ($q) => $q->where('name', 'relawan'))
            ->with(['city', 'district', 'village'])
            ->get();

        if ($relawan->isEmpty()) {
            return collect();
        }

        $villageCoords = $this->regionCoords('indonesia_villages', $relawan->pluck('village_code')->filter());
        $districtCoords = $this->regionCoords('indonesia_districts', $relawan->pluck('district_code')->filter());
        $cityCoords = $this->regionCoords('indonesia_cities', $relawan->pluck('city_code')->filter());

        $resolved = $relawan->map(function (User $user) use ($villageCoords, $districtCoords, $cityCoords) {
            $coord = $villageCoords[$user->village_code] ?? $districtCoords[$user->district_code] ?? $cityCoords[$user->city_code] ?? null;
            if (! $coord) {
                return null;
            }

            $area = $user->district?->name && $user->city?->name
                ? "Kec. {$user->district->name}, {$user->city->name}"
                : ($user->city?->name ?? 'Lokasi tidak diketahui');

            return [
                'id' => $user->id,
                'name' => $user->name,
                'area' => $area,
                'skills' => $user->skills ?? [],
                'status' => $user->is_standby ? 'Siaga' : 'Nonaktif',
                'lat' => $coord['lat'],
                'lng' => $coord['lng'],
            ];
        })->filter()->values();

        return $this->spreadOverlapping($resolved);
    }

    /**
     * Karena posisi relawan diperkirakan dari centroid wilayah, banyak relawan
     * satu desa/kecamatan mendarat di titik yang sama persis → markernya bertumpuk
     * (mis. 12 relawan hanya tampak 6 pin). Sebarkan relawan yang setitik ke cincin
     * kecil (~180 m) mengelilingi centroid supaya tiap orang punya pin sendiri.
     * Deterministik (urut kemunculan) agar posisi stabil di tiap muat halaman.
     */
    private function spreadOverlapping($volunteers)
    {
        $radius = 180; // meter

        return $volunteers
            ->groupBy(fn ($v) => round($v['lat'], 5).','.round($v['lng'], 5))
            ->flatMap(function ($group) use ($radius) {
                $count = $group->count();
                if ($count === 1) {
                    return $group;
                }

                return $group->values()->map(function ($v, $i) use ($count, $radius) {
                    $angle = 2 * M_PI * $i / $count;
                    $v['lat'] = round($v['lat'] + ($radius * cos($angle)) / 111320, 6);
                    $v['lng'] = round($v['lng'] + ($radius * sin($angle)) / (111320 * cos(deg2rad($v['lat']))), 6);

                    return $v;
                });
            })
            ->values();
    }

    /**
     * Ambil peta code => {lat, lng} dari kolom meta (JSON) tabel wilayah laravolt.
     */
    private function regionCoords(string $table, $codes): array
    {
        $codes = collect($codes)->unique()->all();
        if (empty($codes)) {
            return [];
        }

        return DB::table($table)->whereIn('code', $codes)->whereNotNull('meta')
            ->pluck('meta', 'code')
            ->map(function ($meta) {
                $data = json_decode($meta, true);
                if (! isset($data['lat'], $data['long'])) {
                    return null;
                }

                return ['lat' => (float) $data['lat'], 'lng' => (float) $data['long']];
            })
            ->filter()
            ->all();
    }
}

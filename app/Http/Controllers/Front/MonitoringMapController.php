<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Hydrant;
use App\Models\Pompa;
use App\Models\PosPemadam;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MonitoringMapController extends Controller
{
    /**
     * Peta Pemantauan terpadu (Pusat Komando): satu peta berisi semua layer —
     * kejadian, hydrant, pos pemadam, pompa, dan relawan — masing-masing dengan
     * filternya sendiri di sisi klien. Data sudah ter-scope yurisdiksi di server:
     * Report/Hydrant/Pompa/PosPemadam via trait Tenantable (superadmin & admin
     * nasional otomatis bypass), relawan via User::scopeIsAdmin().
     */
    public function index()
    {
        // Kejadian: semua status (termasuk 'ditolak' yang diarsipkan, bukan dihapus)
        // dengan koordinat valid. Difilter per status di klien.
        $reports = Report::whereNotNull('lat')->whereNotNull('lng')
            ->latest('created_at')
            ->get()
            ->map(fn (Report $report) => [
                'id' => $report->id,
                'title' => $report->title,
                'location' => $report->address,
                'time' => $report->created_at->diffForHumans(),
                'status' => $report->status,
                'lat' => (float) $report->lat,
                'lng' => (float) $report->lng,
            ])->values();

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
            ])->values();

        $stations = PosPemadam::whereNotNull('lat')->whereNotNull('lng')->get()
            ->map(fn (PosPemadam $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'address' => $s->address ?? 'Alamat tidak tersedia',
                'phone' => $s->phone ?? '112',
                'status' => $s->status ?? 'Aktif',
                'type' => $s->type ?? 'Pos Induk',
                'lat' => (float) $s->lat,
                'lng' => (float) $s->lng,
            ])->values();

        return Inertia::render('Monitoring/Map', [
            'layers' => [
                'reports' => $reports,
                'hydrants' => $hydrants,
                'pumps' => $pumps,
                'stations' => $stations,
                'volunteers' => $this->volunteers(),
            ],
        ]);
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

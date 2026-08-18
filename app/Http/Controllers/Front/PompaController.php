<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\HydrantWarga;
use App\Models\Pompa;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class PompaController extends Controller
{
    /**
     * Halaman publik "Lokasi SKKL" (Sistem Ketahanan Kebakaran Lingkungan).
     *
     * Sejak TASK_30 isinya DUA sumber: aset pompa (tabel `pompas`) + hydrant swadaya warga
     * (tabel `hydrant_wargas`). Hydrant RESMI sengaja tidak ikut — ia punya
     * halamannya sendiri di /hydrants, dan menggandakannya di sini hanya membuat warga
     * mengira ada dua titik air di tempat yang sama.
     *
     * `withoutGlobalScope('tenant')` dipertahankan seperti sebelumnya: ini katalog publik
     * (pengunjung belum tentu login & belum tentu punya kode wilayah), bukan halaman kerja
     * per wilayah. Tidak ada data pribadi di sini — hanya nama, alamat, dan koordinat aset.
     */
    public function index(Request $request)
    {
        $rows = $this->filtered(Pompa::withoutGlobalScope('tenant'), $request)->get()->map->toSkklRow()
            ->concat($this->filtered(HydrantWarga::withoutGlobalScope('tenant'), $request)->get()->map->toSkklRow());

        $rows = $this->sortForDisplay($rows, $request)->values();

        return Inertia::render('Pumps/Index', [
            'pumps' => $this->paginateRows($rows, $request),
            'filters' => $request->only(['search', 'status', 'is_nearest', 'lat', 'lng']),
        ]);
    }

    /** Pencarian teks & filter status — kolom name/address/status identik di kedua tabel. */
    private function filtered($query, Request $request)
    {
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('address', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        return $query;
    }

    /**
     * Urutan tampil: terdekat dulu bila tombol "Cari SKKL Terdekat" dipakai, selain itu
     * terbaru dulu.
     *
     * Jaraknya dihitung di PHP, bukan lewat `selectRaw` haversine seperti dulu. Dua alasan:
     * (1) daftar ini kini gabungan dua tabel sehingga satu ORDER BY di salah satu query tak
     * lagi mengurutkan keseluruhan; (2) fungsi `acos()/radians()` TIDAK tersedia di SQLite
     * bawaan PHP (dipakai lokal & testing), jadi versi SQL-nya hanya jalan di MySQL produksi.
     */
    private function sortForDisplay(Collection $rows, Request $request): Collection
    {
        if (! ($request->boolean('is_nearest') && $request->filled('lat') && $request->filled('lng'))) {
            return $rows->sortByDesc('created_at')->map(fn ($row) => $row + ['distance' => '-']);
        }

        $lat = (float) $request->lat;
        $lng = (float) $request->lng;

        // Aset tanpa koordinat tak bisa dinilai jaraknya. Ia dipisah lebih dulu, bukan diberi
        // jarak sentinel: nilai tak-hingga tidak bisa di-encode ke JSON (respons Inertia akan
        // gagal), dan menganggapnya 0 km justru menaruhnya di puncak daftar "terdekat".
        [$located, $unlocated] = $rows->partition(
            fn (array $row) => is_numeric($row['lat']) && is_numeric($row['lng'])
        );

        return $located
            ->map(function (array $row) use ($lat, $lng) {
                $km = $this->haversineKm($lat, $lng, (float) $row['lat'], (float) $row['lng']);

                return $row + ['distance_km' => round($km, 3), 'distance' => number_format($km, 1).' km'];
            })
            ->sortBy('distance_km')
            ->concat($unlocated->map(fn (array $row) => $row + ['distance' => '-']));
    }

    /** Jarak dua titik di permukaan bumi (km). */
    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /** Paginator manual — dua sumber sudah disatukan jadi koleksi, paginasi DB tak berlaku lagi. */
    private function paginateRows(Collection $rows, Request $request, int $perPage = 10): LengthAwarePaginator
    {
        $page = LengthAwarePaginator::resolveCurrentPage();

        return new LengthAwarePaginator(
            $rows->forPage($page, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );
    }
}

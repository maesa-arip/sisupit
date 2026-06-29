<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Hydrant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HydrantController extends Controller
{
    public function index(Request $request)
    {
        // Gunakan Hydrant::query() agar data yang muncul sesuai trait Tenantable.
        // $query = Hydrant::query();

        // KUNCI UTAMANYA DI SINI:
        // Gunakan withoutGlobalScope('tenant') agar trait Tenantable diabaikan.
        // Dengan ini, SEMUA hydrant se-Indonesia akan ditarik ke peta.
        $query = Hydrant::withoutGlobalScope('tenant');

        // 1. Filter Pencarian Teks
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('address', 'like', '%'.$request->search.'%');
            });
        }

        // 2. Filter Status
        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        // 3. Jarak Terdekat
        if ($request->boolean('is_nearest') && $request->filled('lat') && $request->filled('lng')) {
            $userLat = $request->lat;
            $userLng = $request->lng;

            $query->selectRaw('hydrants.*, 
                ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(?) ) + 
                sin( radians(?) ) * sin( radians( lat ) ) ) 
                ) AS distance', [$userLat, $userLng, $userLat])
                ->orderBy('distance', 'asc');
        } else {
            $query->latest();
        }

        // FUNGSI TRANSFORMASI
        $transformFunc = function ($hydrant) {
            return [
                'id' => $hydrant->id,
                'name' => $hydrant->name,
                'address' => $hydrant->address ?? 'Alamat tidak tersedia',
                'description' => $hydrant->description,
                'status' => $hydrant->status ?? 'Aktif',
                'type' => $hydrant->type ?? 'Stick',
                'distance' => isset($hydrant->distance) ? number_format($hydrant->distance, 1).' km' : '-',
                'lat' => $hydrant->lat,
                'lng' => $hydrant->lng,
                'category' => 'hydrant',
            ];
        };

        // PERBAIKAN 1: Gunakan ->values()->all() agar menjadi Array murni (Bukan Object)
        $mapQuery = clone $query;
        $mapMarkers = $mapQuery->get()->map($transformFunc)->values()->all();

        // 4. Pagination List Kartu (Selalu gunakan page 1, 2, 3 dst dari Laravel)
        $hydrants = $query->paginate(10)->withQueryString();
        $hydrants->getCollection()->transform($transformFunc);

        return Inertia::render('Hydrants/Index', [
            'map_markers' => $mapMarkers,
            'hydrants' => $hydrants,
            'filters' => $request->only(['search', 'status', 'is_nearest', 'lat', 'lng']),
        ]);
    }
}

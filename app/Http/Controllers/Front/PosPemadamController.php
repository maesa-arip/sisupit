<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\PosPemadam;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosPemadamController extends Controller
{
    public function index(Request $request)
    {
        $query = PosPemadam::withoutGlobalScope('tenant');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('address', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        // Fitur Jarak Terdekat
        if ($request->boolean('is_nearest') && $request->filled('lat') && $request->filled('lng')) {
            $userLat = $request->lat;
            $userLng = $request->lng;

            $query->selectRaw('pos_pemadams.*, 
                ( 6371 * acos( cos( radians(?) ) * 
                cos( radians( lat ) ) * 
                cos( radians( lng ) - radians(?) ) + 
                sin( radians(?) ) * 
                sin( radians( lat ) ) ) 
                ) AS distance', [$userLat, $userLng, $userLat])
                ->orderBy('distance', 'asc');
        } else {
            $query->latest();
        }

        $stations = $query->paginate(10)->withQueryString();

        $stations->getCollection()->transform(function ($station) {
            return [
                'id' => $station->id,
                'name' => $station->name,
                'address' => $station->address ?? 'Alamat tidak tersedia',
                'phone' => $station->phone ?? '112',
                'vehicle_count' => $station->vehicle_count,
                'status' => $station->status ?? 'Aktif',
                'type' => $station->type ?? 'Pos Induk',
                'distance' => isset($station->distance) ? number_format($station->distance, 1).' km' : '-',
                'lat' => $station->lat,
                'lng' => $station->lng,
                // Kita tambahkan flag category agar peta tahu ini Pos Pemadam
                'category' => 'pos_pemadam',
            ];
        });

        return Inertia::render('FireStations/Index', [
            'stations' => $stations,
            'filters' => $request->only(['search', 'status', 'is_nearest', 'lat', 'lng']),
        ]);
    }
}

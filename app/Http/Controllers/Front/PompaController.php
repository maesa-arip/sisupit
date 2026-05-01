<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pompa; // Pastikan model ini sudah Anda buat
use Inertia\Inertia;

class PompaController extends Controller
{
    public function index(Request $request)
    {
        // 1. Inisiasi Query Database (Ganti 'pompas' dengan nama tabel asli Anda jika berbeda)
        $query = Pompa::query();

        // 2. Filter Pencarian Teks (Nama atau Alamat Pompa)
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('address', 'like', '%' . $request->search . '%');
            });
        }

        // 3. Filter Status (Semua / Siap Pakai / Perbaikan)
        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        // 4. Fitur Jarak Terdekat (Haversine Formula) jika tombol "Cari Terdekat" diklik
        if ($request->boolean('is_nearest') && $request->filled('lat') && $request->filled('lng')) {
            $userLat = $request->lat;
            $userLng = $request->lng;

            // Ganti 'pompas.*' sesuai nama tabel database Anda
            $query->selectRaw("pompas.*, 
                ( 6371 * acos( cos( radians(?) ) * 
                cos( radians( location_lat ) ) * 
                cos( radians( location_lng ) - radians(?) ) + 
                sin( radians(?) ) * 
                sin( radians( location_lat ) ) ) 
                ) AS distance", [$userLat, $userLng, $userLat])
            ->orderBy('distance', 'asc'); // Urutkan dari yang paling dekat
        } else {
            // Jika tidak pakai lokasi, urutkan dari data terbaru
            $query->latest();
        }

        // 5. Pagination
        $pumps = $query->paginate(10)->withQueryString();

        // 6. Mapping Data untuk Frontend (React)
        $pumps->getCollection()->transform(function ($pump) {
            return [
                'id'       => $pump->id,
                'name'     => $pump->name,
                'address'  => $pump->address ?? 'Alamat tidak tersedia',
                'status'   => $pump->status ?? 'Aktif',
                'type'     => $pump->type ?? 'Statis (Hydrant)',
                // Jika hasil pencarian terdekat digunakan, format angkanya. Jika tidak, kosongkan.
                'distance' => isset($pump->distance) ? number_format($pump->distance, 1) . ' km' : '-',
                // Kirim koordinat ke React agar bisa di-render jadi pin/marker di Peta
                'lat'      => $pump->location_lat,
                'lng'      => $pump->location_lng,
            ];
        });

        // 7. Render ke Halaman React (Inertia)
        return Inertia::render('Pumps/Index', [
            'pumps'   => $pumps,
            'filters' => $request->only(['search', 'status', 'is_nearest', 'lat', 'lng'])
        ]);
    }
}
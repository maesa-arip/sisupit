<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;
use Carbon\Carbon; // Pastikan Carbon di-import untuk format tanggal

class RelawanController extends Controller
{
    public function index(Request $request)
    {
        // 1. Ambil data User yang memiliki role 'relawan'
        // (Asumsi menggunakan Spatie Permission atau kolom role)
        $query = User::query()->whereHas('roles', function($q) {
            $q->where('name', 'relawan');
        });

        // 2. Filter Pencarian Teks (Nama Relawan)
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // 3. Filter Wilayah (Dropdown)
        if ($request->filled('kabupaten')) {
            $query->where('kabupaten', $request->kabupaten);
        }
        if ($request->filled('kecamatan')) {
            $query->where('kecamatan', $request->kecamatan);
        }
        if ($request->filled('desa')) {
            $query->where('desa', $request->desa);
        }

        // 4. Fitur Geolokasi "Relawan di Daerah Saya" (Haversine Formula)
        if ($request->boolean('is_my_area') && $request->filled('lat') && $request->filled('lng')) {
            $userLat = $request->lat;
            $userLng = $request->lng;
            $radius = 15; // Jangkauan pencarian: 15 Kilometer

            // Asumsi kolom di database bernama 'location_lat' dan 'location_lng'
            $query->selectRaw("users.*, 
                ( 6371 * acos( cos( radians(?) ) * 
                cos( radians( location_lat ) ) * 
                cos( radians( location_lng ) - radians(?) ) + 
                sin( radians(?) ) * 
                sin( radians( location_lat ) ) ) 
                ) AS distance", [$userLat, $userLng, $userLat])
            ->having('distance', '<=', $radius)
            ->orderBy('distance', 'asc'); // Urutkan dari yang paling dekat
        } else {
            // Jika tidak pakai GPS, urutkan dari yang terbaru
            $query->latest();
        }

        // 5. Pagination
        $volunteers = $query->paginate(12)->withQueryString();

        // 6. Mapping / Formatting data agar rapi saat dibaca oleh React (Frontend)
        $volunteers->getCollection()->transform(function ($user) {
            return [
                'id'     => $user->id,
                'name'   => $user->name,
                // Format area dengan ternary agar aman jika datanya kosong
                'area'   => ($user->kecamatan && $user->kabupaten) 
                            ? "Kec. {$user->kecamatan}, {$user->kabupaten}" 
                            : ($user->address ?? 'Lokasi tidak diketahui'),
                // Contoh dummy skills, sesuaikan jika Anda punya relasi tabel keahlian
                'skills' => $user->skills ?? ['Siaga Darurat'], 
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'status' => $user->is_active ? 'Aktif' : 'Sibuk',
            ];
        });

        // 7. Render ke halaman Inertia
        return Inertia::render('Volunteers/Index', [
            // Kirim data relawan
            'volunteers' => $volunteers,
            
            // Kirim kembali filter yang sedang aktif agar form tetap terisi setelah halaman refresh
            'filters' => $request->only(['search', 'kabupaten', 'kecamatan', 'desa', 'is_my_area', 'lat', 'lng'])
        ]);
    }
    public function show($id)
    {
        // Cari user berdasarkan ID, pastikan dia memiliki role 'relawan'
        $user = User::whereHas('roles', function($q) {
            // $q->where('name', 'relawan');
        })->findOrFail($id);
    // dd($user);
        // Format data agar sesuai dengan yang dibutuhkan oleh React Show.jsx
        $volunteer = [
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'phone'           => $user->phone ?? 'Tidak ada nomor telepon',
            'status'          => $user->is_active ? 'Aktif' : 'Sibuk',
            'kabupaten'       => $user->kabupaten ?? 'Tidak diketahui',
            'kecamatan'       => $user->kecamatan ?? '-',
            'desa'            => $user->desa ?? '-',
            'address'         => $user->address ?? 'Tidak ada detail alamat.',
            // Format tanggal menggunakan Carbon (contoh: 12 Agustus 2023)
            'join_date'       => Carbon::parse($user->created_at)->translatedFormat('d F Y'),
            'avatar'          => $user->avatar ? asset('storage/' . $user->avatar) : null,
            // Asumsi: jika belum ada tabel/kolom keahlian, kita set default array
            'skills'          => $user->skills ?? ['Siaga Darurat', 'Bantuan Umum'],
            // Asumsi: menghitung jumlah laporan/kasus yang pernah ditangani relawan ini
            'reports_handled' => $user->reports()->count() ?? 0, 
        ];

        return Inertia::render('Volunteers/Show', [
            'volunteer' => $volunteer
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Hydrant;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // ====================================================================
        // JALUR 1: DASHBOARD PEJABAT, ADMIN, & SUPERADMIN (PUSAT KOMANDO)
        // ====================================================================
        if ($user->hasAnyRole(['admin', 'superadmin', 'pejabat'])) {
            
            $queryHelpers = User::role(['relawan', 'petugas']);
            $queryHydrant = Hydrant::query(); 
            $queryReportsActive = Report::whereIn('status', ['pending', 'handling', 'TERLAPOR']);
            $queryReportsResolved = Report::where('status', 'resolved')->whereMonth('created_at', now()->month);
            $queryRecentList = Report::query();

            // ISOLASI YURISDIKSI
            if (!$user->hasRole('superadmin')) {
                $levelCode = $user->village_code ?? $user->district_code ?? $user->city_code ?? $user->province_code;
                $column = $user->village_code ? 'village_code' : ($user->district_code ? 'district_code' : ($user->city_code ? 'city_code' : 'province_code'));
                
                if ($levelCode) {
                    $queryHelpers->where($column, $levelCode);
                    $queryHydrant->where($column, $levelCode);
                    $queryReportsActive->where($column, $levelCode);
                    $queryReportsResolved->where($column, $levelCode);
                    $queryRecentList->where($column, $levelCode);
                }
            }

            $mapMarkers = (clone $queryHydrant)->whereNotNull('lat')->whereNotNull('lng')
                ->get(['id', 'name', 'lat', 'lng', 'type', 'status']);

            $activeIncidents = (clone $queryReportsActive)->whereNotNull('lat')->whereNotNull('lng')
                ->get(['id', 'title', 'lat', 'lng', 'status']);

            $stats = [
                'active_reports'      => (clone $queryReportsActive)->count(),
                'standby_helpers'     => (clone $queryHelpers)->count(),
                'active_hydrants'     => (clone $queryHydrant)->count(),
                'resolved_this_month' => (clone $queryReportsResolved)->count()
            ];

            $recentReports = (clone $queryRecentList)->orderBy('created_at', 'desc')->limit(5)->get()
                ->map(fn($report) => [
                    'id'       => $report->id,
                    'title'    => $report->title,
                    'location' => $report->address,
                    'time'     => $report->created_at->diffForHumans(),
                    'status'   => $report->status,
                ]);

            // Jika dia Pejabat (tapi bukan Admin/Superadmin), kirim flag isPejabat untuk menyembunyikan tombol Edit
            $isPejabat = $user->hasRole('pejabat') && !$user->hasAnyRole(['admin', 'superadmin']);

            return Inertia::render('Admin/Dashboard', [
                'stats'           => $stats,
                'recentReports'   => $recentReports->toArray(),
                'mapMarkers'      => $mapMarkers->toArray(),
                'activeIncidents' => $activeIncidents->toArray(),
                'isPejabat'       => $isPejabat
            ]);
        }

        // ====================================================================
        // JALUR 2: DASHBOARD PETUGAS DAMKAR (OPERASIONAL TAKTIS)
        // ====================================================================
        if ($user->hasRole('petugas')) {
            $queryMissions = Report::whereIn('status', ['pending', 'handling', 'TERLAPOR']);
            
            // Isolasi Misi: Petugas hanya melihat misi di wilayah penugasannya
            $levelCode = $user->village_code ?? $user->district_code ?? $user->city_code ?? $user->province_code;
            $column = $user->village_code ? 'village_code' : ($user->district_code ? 'district_code' : ($user->city_code ? 'city_code' : 'province_code'));
            if ($levelCode) {
                $queryMissions->where($column, $levelCode);
            }

            $activeMissions = $queryMissions->orderBy('created_at', 'desc')->get()->map(fn($report) => [
                'id'       => $report->id,
                'title'    => $report->title,
                'location' => $report->address,
                'lat'      => $report->lat,
                'lng'      => $report->lng,
                'time'     => $report->created_at->diffForHumans(),
                'status'   => $report->status,
            ]);

            return Inertia::render('Petugas/Dashboard', [
                'activeMissions' => $activeMissions->toArray()
            ]);
        }

        // ====================================================================
        // JALUR 3: DASHBOARD PUBLIK (WARGA & RELAWAN)
        // ====================================================================
        
        // 1. Data Riwayat Laporan Milik Sendiri (Di-bypass Tenantable agar terlihat walau melapor di luar kota)
        $myReports = Report::withoutGlobalScopes() 
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // 2. Data Radar Khusus Relawan (Di-filter berdasarkan area relawan)
        $nearbyEmergencies = [];
        if ($user->hasRole('relawan')) {
            $queryEmergencies = Report::whereIn('status', ['pending', 'TERLAPOR']);
            
            $levelCode = $user->village_code ?? $user->district_code ?? $user->city_code ?? $user->province_code;
            $column = $user->village_code ? 'village_code' : ($user->district_code ? 'district_code' : ($user->city_code ? 'city_code' : 'province_code'));
            
            if ($levelCode) {
                $queryEmergencies->where($column, $levelCode);
            }

            $nearbyEmergencies = $queryEmergencies->orderBy('created_at', 'desc')->get()->map(fn($report) => [
                'id'       => $report->id,
                'title'    => $report->title,
                'location' => $report->address,
                'time'     => $report->created_at->diffForHumans(),
                'status'   => $report->status,
            ]);
        }

        // 3. Data Feed Laporan untuk TABS (Butuh Respons / Tugas Saya / Semua Laporan)
        // Ini yang sebelumnya KURANG. Wajib include helpers.user agar React tahu laporan mana yang sudah/belum diambil relawan.
        $reportsFeed = Report::withoutGlobalScopes()
            ->with(['helpers.user']) 
            ->latest('created_at')
            ->paginate(request()->load ?? 6)
            ->withQueryString();

        return Inertia::render('Dashboard', [
            'myReports'         => $myReports,
            'isRelawan'         => $user->hasRole('relawan'),
            'nearbyEmergencies' => $nearbyEmergencies,
            'page_data'         => [
                'reports' => $reportsFeed  // Sekarang page_data.reports terisi dengan sempurna!
            ]
        ]);
    }
}
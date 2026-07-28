<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Landing publik (browser). Aplikasi WebView TIDAK menampilkan landing ini:
     * User-Agent WebView mengandung token 'SisupitApp' (dipakai juga di
     * resources/js/Pages/Auth/Login.jsx). Deteksi di server agar redirect terjadi
     * sebelum render — tidak ada flash konten landing di dalam app. WebView diarahkan
     * ke Spotlight (beranda app) bila belum login, atau langsung dashboard bila sudah.
     */
    public function landing(Request $request): Response|RedirectResponse
    {
        if (str_contains($request->userAgent() ?? '', 'SisupitApp')) {
            return auth()->check()
                ? redirect()->route('dashboard')
                : redirect()->route('home.spotlight');
        }

        // `/` sengaja tetap menampilkan Spotlight (keputusan 2026-07-11). Halaman Landing
        // yang sudah dipoles TIDAK hilang — diakses langsung di `/landing` via landingPage().
        return $this->spotlight();
    }

    /**
     * Halaman Landing publik (hero darurat-first + statistik). Dipisah dari `/` yang
     * tetap ke Spotlight; dijangkau lewat route bernama `home.landing.page` (`/landing`).
     */
    public function landingPage(): Response
    {
        return inertia('Landing', [
            'page_data' => [
                ...$this->pageStats(),
            ],
        ]);
    }

    public function index(): Response
    {
        return inertia('Home', [
            'page_settings' => [
                'title' => 'SiSUPIT DAMKAR',
                'subtitle' => 'SISTEM INFORMASI KESIAPSIAGAAN UNTUK PEMADAM KEBAKARAN TERINTEGRASI',
            ],
            'page_data' => [
                'reportChart' => $this->chart(),
                ...$this->pageStats(),
            ],
        ]);
    }

    public function spotlight(): Response
    {
        return inertia('Spotlight', [
            'page_settings' => [
                'title' => 'SiSUPIT DAMKAR',
                'subtitle' => 'SISTEM INFORMASI KESIAPSIAGAAN UNTUK PEMADAM KEBAKARAN TERINTEGRASI',
            ],
            'page_data' => [
                'reportChart' => $this->chart(),
                ...$this->pageStats(),
            ],
        ]);
    }

    /**
     * Statistik publik. Di-scope ke kota tenant HANYA bila request datang dari subdomain
     * tenant (badung.sisupit.com → angka Badung); apex/unknown → null → GLOBAL (perilaku
     * lama tak berubah). Keputusan TASK_17.
     */
    private function tenantCityCode(): ?string
    {
        return Tenant::resolveFromHost(request()->getHost())?->city_code;
    }

    private function pageStats(): array
    {
        $cityCode = $this->tenantCityCode();

        return [
            'total_reports' => Report::query()
                ->when($cityCode, fn ($q) => $q->where('city_code', $cityCode))
                ->count(),
            'total_handled_reports' => Report::query()
                ->when($cityCode, fn ($q) => $q->where('city_code', $cityCode))
                ->where('status', 'TERKENDALI')
                ->count(),
            'total_users' => $this->countRespondersByRole($cityCode),
        ];
    }

    /**
     * User::role() throws RoleDoesNotExist if the role row hasn't been seeded yet
     * (e.g. fresh install before RolePermissionSeeder runs), which would crash this
     * public landing page. whereHas() on the relation simply returns 0 instead.
     */
    private function countRespondersByRole(?string $cityCode = null): int
    {
        return User::query()
            ->when($cityCode, fn ($q) => $q->where('city_code', $cityCode))
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['petugas', 'relawan']);
            })->count();
    }

    public function chart(): array
    {
        $end_date = Carbon::now();
        $start_date = $end_date->copy()->subMonth()->startOfMonth();
        $cityCode = $this->tenantCityCode();
        $reports = Report::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->when($cityCode, fn ($query) => $query->where('city_code', $cityCode))
            ->whereBetween('created_at', [$start_date, $end_date])
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total', 'date');

        $handled_reports = Report::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->when($cityCode, fn ($query) => $query->where('city_code', $cityCode))
            ->where('status', 'TERKENDALI')
            ->whereNotNull('created_at')
            ->whereBetween('created_at', [$start_date, $end_date])
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total', 'date');
        $charts = [];
        $period = Carbon::parse($start_date)->daysUntil($end_date);
        foreach ($period as $date) {
            $date_string = $date->toDateString();
            $charts[] = [
                'date' => $date_string,
                'reports' => $reports->get($date_string, 0),
                'handled_reports' => $handled_reports->get($date_string, 0),
            ];
        }

        return $charts;
    }
}

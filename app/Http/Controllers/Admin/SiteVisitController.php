<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

/**
 * Statistik kunjungan web per hari (TASK_79). Superadmin-only (routes/admin.php).
 *
 * "Pengunjung" = pengunjung unik PER HARI (hash bergaram harian, lihat RecordSiteVisit), jadi
 * angka periode adalah JUMLAH pengunjung harian - orang yang sama di dua hari terhitung dua.
 * Itu disengaja: tanpa pengenal lintas hari, statistik ini tak bisa melacak orang.
 */
class SiteVisitController extends Controller
{
    public const RANGE_OPTIONS = [7, 30, 90, 365];

    public function index(Request $request): Response
    {
        $range = (int) $request->query('range', 30);
        if (! in_array($range, self::RANGE_OPTIONS, true)) {
            $range = 30;
        }

        $tenants = Tenant::query()->orderBy('nama_instansi')->pluck('nama_instansi', 'subdomain');
        $tenant = (string) $request->query('tenant', '');
        if ($tenant !== '' && ! $tenants->has($tenant)) {
            $tenant = '';
        }

        $today = Carbon::now(config('app.local_timezone'))->startOfDay();
        $from = $today->copy()->subDays($range - 1)->toDateString();

        $scope = fn (string $table) => DB::table($table)
            ->where('date', '>=', $from)
            ->when($tenant !== '', fn ($q) => $q->where('tenant', $tenant));

        $visitorsPerDay = $scope('site_visitors_daily')
            ->selectRaw('date, COUNT(DISTINCT visitor) as total')
            ->groupBy('date')->pluck('total', 'date');
        $viewsPerDay = $scope('site_page_views_daily')
            ->selectRaw('date, SUM(views) as total')
            ->groupBy('date')->pluck('total', 'date');

        // Hari tanpa kunjungan tetap tampil (nol), supaya grafik tidak melompati tanggal.
        $daily = [];
        for ($i = $range - 1; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i)->toDateString();
            $daily[] = [
                'date' => $date,
                'visitors' => (int) ($visitorsPerDay[$date] ?? 0),
                'views' => (int) ($viewsPerDay[$date] ?? 0),
            ];
        }

        $todayRow = end($daily);

        return inertia('Admin/Visits/Index', [
            'daily' => $daily,
            'summary' => [
                'today_visitors' => $todayRow['visitors'],
                'today_views' => $todayRow['views'],
                'avg_visitors' => (int) round(array_sum(array_column($daily, 'visitors')) / $range),
                'total_views' => array_sum(array_column($daily, 'views')),
            ],
            'byChannel' => $this->breakdown($scope, 'channel'),
            'byAuth' => $this->breakdown($scope, 'is_auth'),
            'byTenant' => $tenant === ''
                ? collect($this->breakdown($scope, 'tenant'))
                    ->map(fn ($row) => [...$row, 'label' => $tenants[$row['key']] ?? $row['key']])
                    ->all()
                : [],
            'topPages' => $scope('site_page_views_daily')
                ->selectRaw('page, SUM(views) as views')
                ->groupBy('page')->orderByDesc('views')->limit(10)->get()
                ->map(fn ($row) => ['page' => $row->page, 'views' => (int) $row->views])
                ->all(),
            'filters' => ['range' => $range, 'tenant' => $tenant],
            'rangeOptions' => self::RANGE_OPTIONS,
            'tenantOptions' => $tenants->map(fn ($name, $sub) => ['value' => $sub, 'label' => $name])->values(),
            'page_settings' => [
                'title' => 'Statistik Kunjungan',
                'subtitle' => 'Kunjungan web & aplikasi per hari: pengunjung unik dan halaman yang dibuka (tanggal WITA).',
            ],
        ]);
    }

    /**
     * Pengunjung (jumlah pengunjung unik harian) & tampilan halaman per nilai satu kolom rincian.
     *
     * @return array<int, array{key: string, visitors: int, views: int}>
     */
    private function breakdown(\Closure $scope, string $column): array
    {
        $visitors = $scope('site_visitors_daily')
            ->selectRaw("$column as k, COUNT(*) as total")->groupBy($column)->pluck('total', 'k');
        $views = $scope('site_page_views_daily')
            ->selectRaw("$column as k, SUM(views) as total")->groupBy($column)->pluck('total', 'k');

        return $views->keys()->merge($visitors->keys())->unique()
            ->map(fn ($key) => [
                'key' => (string) $key,
                'visitors' => (int) ($visitors[$key] ?? 0),
                'views' => (int) ($views[$key] ?? 0),
            ])
            ->sortByDesc('views')->values()->all();
    }
}

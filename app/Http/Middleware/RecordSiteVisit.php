<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Pencatat kunjungan web per hari (TASK_79). Bekerja di terminate() - SESUDAH respons terkirim
 * (PHP-FPM) - jadi tak menambah waktu muat halaman, dan galatnya tak pernah sampai ke pengguna.
 *
 * Yang dihitung = satu HALAMAN yang dibuka: GET berhasil (200) yang menghasilkan halaman HTML
 * atau kunjungan Inertia penuh. Tidak dihitung: muat ulang parsial (`router.reload({ only })`,
 * mis. polling 30 dtk status tamu), prefetch, JSON/aset, redirect, dan bot.
 */
class RecordSiteVisit
{
    private const BOT_PATTERN = '/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|monitor|uptime|curl|wget|python|httpclient|headless|lighthouse/i';

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! $this->shouldRecord($request, $response)) {
            return;
        }

        try {
            $this->record($request);
        } catch (Throwable $e) {
            // Statistik tak boleh mengganggu aplikasi darurat; cukup tercatat di log.
            report($e);
        }
    }

    private function shouldRecord(Request $request, Response $response): bool
    {
        if (! $request->isMethod('GET') || $response->getStatusCode() !== 200) {
            return false;
        }

        $page = $request->route()?->getName();
        if (! $page) {
            return false;
        }

        if ($request->hasHeader('X-Inertia-Partial-Component')
            || in_array(strtolower((string) ($request->header('Purpose') ?? $request->header('Sec-Purpose'))), ['prefetch', 'prerender'], true)) {
            return false;
        }

        $isPage = $request->hasHeader('X-Inertia')
            || str_contains((string) $response->headers->get('Content-Type'), 'text/html');
        if (! $isPage) {
            return false;
        }

        $agent = (string) $request->userAgent();

        return $agent !== '' && ! preg_match(self::BOT_PATTERN, $agent);
    }

    private function record(Request $request): void
    {
        $date = now(config('app.local_timezone'))->toDateString();
        $dims = [
            'date' => $date,
            'tenant' => (string) (currentTenant()->subdomain ?: '-'),
            'channel' => isDesktopApp($request) ? 'desktop' : (isNativeApp($request) ? 'apk' : 'web'),
            'is_auth' => $request->user() !== null,
        ];

        // Garam HARIAN dari APP_KEY: pengunjung yang sama di hari berbeda tak bisa dirangkai,
        // dan IP mentah tak pernah disimpan.
        $visitor = hash('sha256', config('app.key').'|'.$date.'|'.$request->ip().'|'.$request->userAgent());

        DB::table('site_visitors_daily')->insertOrIgnore([...$dims, 'visitor' => $visitor]);

        DB::table('site_page_views_daily')->upsert(
            [[...$dims, 'page' => substr($request->route()->getName(), 0, 100), 'views' => 1]],
            ['date', 'tenant', 'channel', 'is_auth', 'page'],
            ['views' => DB::raw('views + 1')],
        );
    }
}

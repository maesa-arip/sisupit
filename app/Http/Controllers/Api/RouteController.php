<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

// Proxy ke OSRM (Open Source Routing Machine) untuk mendapatkan geometri rute jalan
// asli (bukan garis lurus) antara posisi responder dan titik insiden. Mengikuti pola
// GeocodeController: cache + lock rate-limit di server, JANGAN panggil OSRM langsung
// dari frontend (kebijakan pemakaian server demo publik).
class RouteController extends Controller
{
    private const CACHE_TTL_SECONDS = 3600;

    // Server demo OSRM publik meminta pemakaian yang wajar; serialkan panggilan keluar.
    private const MIN_INTERVAL_MS = 350;

    public function directions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_lat' => 'required|numeric|between:-90,90',
            'from_lng' => 'required|numeric|between:-180,180',
            'to_lat' => 'required|numeric|between:-90,90',
            'to_lng' => 'required|numeric|between:-180,180',
        ]);

        // Dibulatkan supaya titik GPS yang berdekatan memakai entri cache yang sama.
        $fromLat = round((float) $validated['from_lat'], 5);
        $fromLng = round((float) $validated['from_lng'], 5);
        $toLat = round((float) $validated['to_lat'], 5);
        $toLng = round((float) $validated['to_lng'], 5);

        $cacheKey = "osrm:route:{$fromLat},{$fromLng}:{$toLat},{$toLng}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($fromLat, $fromLng, $toLat, $toLng) {
            return $this->callOsrm($fromLat, $fromLng, $toLat, $toLng);
        });

        return response()->json($data);
    }

    /**
     * OSRM memakai urutan koordinat lon,lat. Kembalikan geometri sebagai array [lat, lng]
     * (urutan yang dipakai Leaflet) plus jarak (meter) & durasi (detik). Jika routing gagal,
     * frontend bisa fallback ke garis lurus, jadi kembalikan route null alih-alih melempar 5xx.
     */
    private function callOsrm(float $fromLat, float $fromLng, float $toLat, float $toLng): array
    {
        $baseUrl = rtrim(config('services.osrm.base_url'), '/');
        $userAgent = config('services.osrm.user_agent');
        $path = "/route/v1/driving/{$fromLng},{$fromLat};{$toLng},{$toLat}";

        return Cache::lock('osrm:throttle-lock', 10)->block(10, function () use ($baseUrl, $userAgent, $path) {
            $lastCallAtMs = Cache::get('osrm:last-call-at-ms');
            $nowMs = (int) (microtime(true) * 1000);

            if ($lastCallAtMs !== null && ($nowMs - $lastCallAtMs) < self::MIN_INTERVAL_MS) {
                usleep((self::MIN_INTERVAL_MS - ($nowMs - $lastCallAtMs)) * 1000);
            }

            $response = Http::withHeaders(['User-Agent' => $userAgent])
                ->timeout(8)
                ->get($baseUrl.$path, [
                    'overview' => 'full',
                    'geometries' => 'geojson',
                ]);

            Cache::put('osrm:last-call-at-ms', (int) (microtime(true) * 1000), 60);

            if ($response->failed()) {
                return ['route' => null];
            }

            $body = $response->json();
            $first = $body['routes'][0] ?? null;
            if (! $first) {
                return ['route' => null];
            }

            // GeoJSON coordinates = [lng, lat]; balik ke [lat, lng] untuk Leaflet.
            $coordinates = collect($first['geometry']['coordinates'] ?? [])
                ->map(fn ($c) => [(float) $c[1], (float) $c[0]])
                ->all();

            return [
                'route' => $coordinates,
                'distance' => $first['distance'] ?? null,
                'duration' => $first['duration'] ?? null,
            ];
        });
    }
}

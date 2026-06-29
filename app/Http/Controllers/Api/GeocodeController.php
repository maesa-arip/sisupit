<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    private const CACHE_TTL_SECONDS = 86400;

    // Kebijakan penggunaan Nominatim membatasi maksimal ~1 request/detik.
    private const MIN_INTERVAL_MS = 1100;

    public function reverse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        // Dibulatkan supaya titik GPS yang berdekatan memakai entri cache yang sama.
        $lat = round((float) $validated['lat'], 5);
        $lng = round((float) $validated['lng'], 5);

        $data = Cache::remember("nominatim:reverse:{$lat}:{$lng}", self::CACHE_TTL_SECONDS, function () use ($lat, $lng) {
            return $this->callNominatim('/reverse', [
                'format' => 'json',
                'lat' => $lat,
                'lon' => $lng,
                'addressdetails' => 1,
                'accept-language' => 'id',
            ]);
        });

        return response()->json($data);
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'required|string|min:3|max:255',
        ]);

        $query = trim($validated['q']);

        $data = Cache::remember('nominatim:search:'.md5(strtolower($query)), self::CACHE_TTL_SECONDS, function () use ($query) {
            return $this->callNominatim('/search', [
                'format' => 'json',
                'q' => $query,
                'limit' => 4,
                'accept-language' => 'id',
            ]);
        });

        return response()->json($data);
    }

    /**
     * Nominatim requires an identifying User-Agent and caps usage at ~1 request/second
     * for the public instance. Cache::lock serializes every outgoing call app-wide
     * (not just per-browser) so many concurrent users can't collectively exceed that
     * limit, and the stored timestamp tracks when the last call actually went out.
     */
    private function callNominatim(string $path, array $query): array
    {
        $baseUrl = config('services.nominatim.base_url');
        $userAgent = config('services.nominatim.user_agent');

        return Cache::lock('nominatim:throttle-lock', 10)->block(10, function () use ($baseUrl, $userAgent, $path, $query) {
            $lastCallAtMs = Cache::get('nominatim:last-call-at-ms');
            $nowMs = (int) (microtime(true) * 1000);

            if ($lastCallAtMs !== null && ($nowMs - $lastCallAtMs) < self::MIN_INTERVAL_MS) {
                usleep((self::MIN_INTERVAL_MS - ($nowMs - $lastCallAtMs)) * 1000);
            }

            $response = Http::withHeaders(['User-Agent' => $userAgent])
                ->timeout(8)
                ->get($baseUrl.$path, $query);

            Cache::put('nominatim:last-call-at-ms', (int) (microtime(true) * 1000), 60);

            if ($response->failed()) {
                abort(502, 'Layanan pencarian lokasi sedang tidak tersedia, silakan isi alamat secara manual.');
            }

            return $response->json() ?? [];
        });
    }
}

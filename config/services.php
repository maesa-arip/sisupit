<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'github' => [
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect' => env('GITHUB_CLIENT_REDIRECT'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_CLIENT_REDIRECT'),
    ],

    'nominatim' => [
        // Default SENGAJA menunjuk instance LOKAL (bukan Nominatim publik): bila env lupa
        // di-set, panggilan gagal cepat (connection refused) alih-alih diam-diam membebani
        // server publik (langgar ToS + bocorkan lokasi user). Set NOMINATIM_BASE_URL ke
        // instance self-hosted - lihat docker/nominatim/.
        'base_url' => env('NOMINATIM_BASE_URL', 'http://127.0.0.1:8080'),
        // Tetap kirim User-Agent identifikasi (wajib bila suatu saat menunjuk instance publik).
        'user_agent' => env('NOMINATIM_USER_AGENT', 'SISUPIT-Damkar/1.0 (admin@sisupit.test)'),
    ],

    'osrm' => [
        // Engine routing (rute mengikuti jalan). Default LOKAL, alasan sama dgn nominatim di
        // atas: hindari fallback diam-diam ke server demo OSRM publik. Set OSRM_BASE_URL ke
        // instance self-hosted - lihat docker/osrm/.
        'base_url' => env('OSRM_BASE_URL', 'http://127.0.0.1:5000'),
        'user_agent' => env('OSRM_USER_AGENT', 'SISUPIT-Damkar/1.0 (admin@sisupit.test)'),
    ],

    'map' => [
        // URL tile basemap Leaflet. BEDA dari nominatim/osrm di atas: tile ditarik langsung
        // oleh BROWSER, bukan server, jadi nilainya di-inject ke window.MAP_TILE_URL lewat
        // app.blade.php lalu dibaca resources/js/lib/utils.js. Dibuat env agar bisa dialihkan
        // ke tile server sendiri cukup dengan 1 env var (MAP_TILE_URL) TANPA rebuild frontend.
        // Default = basemap CARTO Voyager (turunan OpenStreetMap). Untuk self-host penuh lihat
        // docker/ (pola Nominatim/OSRM) — mis. TileServer-GL/OpenMapTiles.
        'tile_url' => env('MAP_TILE_URL', 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'),
    ],

];

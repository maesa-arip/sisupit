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
        // Ganti ke instance self-hosted (mis. http://<vps-ip>:8080) saat sudah siap - lihat docker/nominatim/.
        'base_url' => env('NOMINATIM_BASE_URL', 'https://nominatim.openstreetmap.org'),
        // Wajib diisi sesuai kebijakan penggunaan Nominatim saat memakai instance publik.
        'user_agent' => env('NOMINATIM_USER_AGENT', 'SISUPIT-Damkar/1.0 (admin@sisupit.test)'),
    ],

    'osrm' => [
        // Engine routing (rute mengikuti jalan). Default: server demo OSRM publik.
        // Ganti ke instance self-hosted (mis. http://<vps-ip>:5000) untuk produksi - lihat docker/nominatim/ untuk pola serupa.
        'base_url' => env('OSRM_BASE_URL', 'https://router.project-osrm.org'),
        'user_agent' => env('OSRM_USER_AGENT', 'SISUPIT-Damkar/1.0 (admin@sisupit.test)'),
    ],

];

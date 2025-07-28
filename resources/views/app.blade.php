<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#0d6efd">

        <!-- iOS support -->
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
        <script src="/js/theme.js"></script>
        <!-- Leaflet CSS -->
        <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <!-- Leaflet JS -->
        <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        defer
        ></script>
    </head>
    <body class="max-h-screen font-sans antialiased">
        @inertia
        <script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="{{ config('services.midtrans.client_key') }}"></script>
    </body>
</html>

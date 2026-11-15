<?php

// #241 (2026-11-15): menggeser peta ke bawah memuat ulang halaman di APK (tarik-untuk-refresh
// merebut tarikan saat halaman di puncak). Penjaga sumber: perilaku sentuhnya hanya bisa diuji
// di HP sungguhan.

$lock = fn () => file_get_contents(resource_path('js/lib/pull-to-refresh-lock.js'));

it('installs one global guard for touches that start on any map', function () use ($lock) {
    expect($lock())->toContain("'.leaflet-container, [data-no-pull-refresh]'")
        ->and($lock())->toContain('export function installMapPullToRefreshGuard()')
        // Panel yang masih terbuka tetap memegang kuncinya.
        ->and($lock())->toContain('if (openPanelCount === 0) setNativePullToRefresh(true);')
        ->and(file_get_contents(resource_path('js/app.jsx')))->toContain('installMapPullToRefreshGuard();');
});

it('locks pull-to-refresh while the monitoring map is maximized', function () {
    $src = file_get_contents(resource_path('js/Pages/Monitoring/Map.jsx'));

    expect($src)->toContain('{isMaximized && <PullToRefreshLock />}')
        ->and($src)->toContain("data-no-pull-refresh={isMaximized ? '' : undefined}");
});

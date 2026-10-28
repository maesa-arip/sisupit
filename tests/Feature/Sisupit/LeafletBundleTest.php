<?php

/**
 * FINDINGS #225 - peta (form lapor, Peta Pemantauan) baru mulai meminta tile di detik ~2,7 pada
 * kunjungan pertama di HP 4G. Leaflet dulu dimuat dari unpkg.com sebagai <script defer> SESUDAH
 * bundel Vite: skrip defer & module dijalankan berurutan, jadi koneksi pihak ketiga itu menahan
 * seluruh aplikasi. Peta Pemantauan juga memuat tile dua kali (setView z11 lalu fitBounds).
 *
 * Membaca berkas sumber, pola LeafletDarkModeTest / LeafletFitBoundsTest.
 */
it('loads leaflet from the vite bundle, not a third-party cdn', function () {
    $blade = file_get_contents(resource_path('views/app.blade.php'));
    $app = file_get_contents(resource_path('js/app.jsx'));
    $lib = file_get_contents(resource_path('js/lib/leaflet.js'));

    expect($blade)->not->toMatch('/(src|href)="[^"]*leaflet/')
        // Impor STATIS di app.jsx (bukan import() malas): semua peta memakai window.L di efeknya.
        ->and($app)->toMatch("/^import '\\.\\/lib\\/leaflet';$/m")
        ->and($lib)->toContain("import 'leaflet/dist/leaflet.css';")
        ->and($lib)->toContain('window.L = L;')
        // Judul tombol zoom berbahasa Indonesia dulu dipasang skrip inline di blade.
        ->and($lib)->toContain("zoomInTitle: 'Perbesar'");

    // Leaflet menyentuh window saat diimpor - build SSR tak boleh mengimpornya.
    expect(file_get_contents(resource_path('js/ssr.jsx')))->not->toContain('leaflet');
});

it('gives the monitoring map its first view straight from the markers', function () {
    $peta = file_get_contents(resource_path('js/Pages/Monitoring/Map.jsx'));

    // setView berantai pada pembuatan peta = 9 tile z11 diminta lalu dibuang sebelum fitBounds.
    expect($peta)->not->toMatch('/L\.map\([^;]*\)\s*\.setView\(/')
        ->and($peta)->toContain('hasViewRef');
});

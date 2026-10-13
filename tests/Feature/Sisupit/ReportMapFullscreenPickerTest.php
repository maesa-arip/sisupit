<?php

/**
 * #192 - peta form lapor "terasa sangat kecil dan susah digunakan" (user 2026-10-07): 280px di
 * ponsel, ~200px tersisa setelah kolom cari, daftar hasil menutupi peta. Pola Google Maps /
 * ojek daring: pemilih lokasi LAYAR PENUH (cari di atas, pin di tengah, lembar "Pakai lokasi
 * ini" di bawah). Ditambah koreksi ejaan GeocodeController yang dilaporkan lewat header.
 *
 * ATURAN yang dijaga:
 *  - wadah peta yang SAMA yang dibesarkan (bukan peta kedua) dan lapisannya di atas bilah bawah
 *    (z-50) serta header/bar Kirim (z-40) - kalau z-nya turun, bilah bawah menutupi tombol
 *    "Pakai lokasi ini" tanpa galat;
 *  - layar penuh menjeda tarik-untuk-refresh APK (peta digeser ke bawah = refresh halaman);
 *  - frontend membaca header koreksi milik controller (namanya terikat di dua berkas).
 */
function reportCreateSource(): string
{
    return file_get_contents(resource_path('js/Pages/Front/Reports/Create.jsx'));
}

it('expands the one report map into a full-screen layer above the bottom nav', function () {
    $src = reportCreateSource();

    expect($src)->toContain("'fixed inset-0 z-[60] flex flex-col bg-background")
        ->and($src)->toContain('{mapExpanded && <PullToRefreshLock />}')
        ->and($src)->toContain('Pakai lokasi ini')
        // Satu peta saja: UserLeafletMap tak boleh dipasang dua kali di form lapor.
        ->and(substr_count($src, '<UserLeafletMap'))->toBe(1);

    // Bilah bawah tetap z-50; lapisan layar penuh harus di atasnya.
    expect(file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx')))
        ->toContain('fixed bottom-0 left-0 z-50');
});

it('reads the spelling-correction header the geocode proxy sends', function () {
    expect(reportCreateSource())
        ->toContain("'".strtolower(\App\Http\Controllers\Api\GeocodeController::CORRECTED_HEADER)."'")
        ->toContain('Menampilkan hasil untuk');
});

/*
 * #192 lanjutan (2026-10-13): Kembali APK (`goBack()`), geser-kembali iOS, dan Kembali browser
 * dulu MENINGGALKAN form lapor saat peta layar penuh terbuka. Kini lapisan mendorong satu entri
 * history; popstate dicegat + stopImmediatePropagation SEBELUM Inertia (yang memulihkan halaman
 * dengan preserveState:false = isian form hilang). Di `window` urutan listener = urutan
 * pendaftaran (capture TIDAK menolong - terbukti Playwright), jadi pemasangannya wajib di
 * app.jsx sebelum createInertiaApp.
 */
it('lets the back button close the full-screen map instead of leaving the form', function () {
    $hook = file_get_contents(resource_path('js/lib/back-closes-layer.js'));

    expect($hook)->toContain("window.history.pushState(window.history.state, '', window.location.href)")
        ->and($hook)->toContain('export function installBackClosesLayer()')
        ->and($hook)->toContain('event.stopImmediatePropagation()')
        ->and($hook)->toContain('window.history.back()');

    $app = file_get_contents(resource_path('js/app.jsx'));
    $install = strpos($app, 'installBackClosesLayer();');

    expect($install)->not->toBeFalse()
        ->and($install)->toBeLessThan(strpos($app, 'createInertiaApp({'));

    $src = reportCreateSource();

    expect($src)->toContain('const closeMap = useBackClosesLayer(mapExpanded, () => setMapExpanded(false))')
        // Semua jalur tutup lewat closeMap: tutup langsung = entri history tertinggal.
        ->and(substr_count($src, 'setMapExpanded(false)'))->toBe(1)
        ->and(substr_count($src, 'onClick={closeMap}'))->toBe(2)
        ->and($src)->toContain("if (e.key === 'Escape') closeMap();");
});

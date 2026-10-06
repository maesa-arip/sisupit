<?php

// #188 - peta form lapor gaya Google Maps. Penjaga sumber: perilaku sebenarnya (geser peta,
// "Lokasi saya", urutan jarak) diuji manual lewat Playwright headless (lihat file task).

$form = fn () => file_get_contents(resource_path('js/Pages/Front/Reports/Create.jsx'));
$map = fn () => file_get_contents(resource_path('js/Components/UserLeafletMap.jsx'));

it('drops the copy-to-patokan button because a machine address is not a landmark', function () use ($form) {
    expect($form())->not->toContain('Alamat disalin ke Patokan Lokasi.')
        ->and($form())->not->toContain("setData('address', data.geo_address)");
});

it('puts the search box on the map with a center pin and a locate button', function () use ($form) {
    $src = $form();
    $mapPos = strpos($src, '<UserLeafletMap');
    $searchPos = strpos($src, 'aria-label="Cari lokasi kejadian"');
    $regionPos = strpos($src, "selectRegion('village', val)");

    expect($src)->toContain('centerPin')
        ->and($src)->toContain('onLocate={locateMe}')
        // Kolom cari menempel pada peta, dan pilihan wilayah dilipat di kartu yang SAMA.
        ->and($searchPos)->toBeGreaterThan($mapPos)
        ->and($searchPos)->toBeLessThan($regionPos)
        // Pin bias ikut dikirim ke proxy.
        ->and($src)->toContain('params: { q, lat: data.lat || undefined, lng: data.lng || undefined }');
});

// Permintaan user 2026-10-07: kartu "Wilayah kejadian" terpisah boros & membingungkan (dua
// kartu seolah dua lokasi). Kini satu kartu: peta, baris lokasi + "Ubah", panel wilayah terlipat.
it('folds the region pickers into the map card instead of a separate section', function () use ($form) {
    $src = $form();
    $between = substr($src, strpos($src, '<UserLeafletMap'), strpos($src, "selectRegion('village', val)") - strpos($src, '<UserLeafletMap'));

    expect($between)->not->toContain('</section>')
        ->and($src)->toContain('const regionPanelOpen = regionOpen || regionForced;')
        // Desa belum terisi = panel wajib terbuka; server menolak laporan tanpa desa.
        ->and($src)->toContain('(!locationLoading && !!data.lat && !data.village_code)');
});

it('keeps the search overlay below the app header', function () use ($form) {
    // z-[1000] dulu membuat kolom cari menutupi header saat halaman digulir.
    expect($form())->toContain('absolute inset-x-2 top-2 z-10');
});

it('keeps pinch and wheel zoom anchored on the center pin', function () use ($map) {
    expect($map())->toContain("touchZoom: 'center'")
        ->and($map())->toContain("scrollWheelZoom: 'center'")
        ->and($map())->toContain("matchMedia?.('(pointer: fine)')");
});

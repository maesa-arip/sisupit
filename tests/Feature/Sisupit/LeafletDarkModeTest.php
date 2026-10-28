<?php

/**
 * FINDINGS #223 - teks popup Peta Pemantauan tak terbaca di mode gelap (paling sering di iPhone
 * yang bertema gelap otomatis), dan basemap tetap terang menyilaukan.
 *
 * Akarnya di luar markup kita: leaflet.css mematok popup/tombol zoom/atribusi PUTIH, sedangkan isi
 * popup memakai token (text-foreground dst.) yang ikut terang di mode gelap. Gejalanya senyap -
 * kelasnya benar di DOM, tak ada galat - jadi penjaganya mengunci TULISANNYA (Pest tak menjalankan
 * CSS), pola LeafletPopupLinkContrastTest (#98).
 */
$css = fn () => file_get_contents(resource_path('css/app.css'));

it('themes the leaflet popup chrome with tokens that beat leaflet.css', function () use ($css) {
    // `.leaflet-container` di depan WAJIB: menang lewat spesifisitas, tak bergantung urutan berkas
    // (leaflet.css dulu dari unpkg SESUDAH bundel - selektor setara kalah dan popup kembali putih).
    expect($css())
        ->toMatch('/\.leaflet-container \.leaflet-popup-content-wrapper,\s*\.leaflet-container \.leaflet-popup-tip[^{]*\{[^}]*background: hsl\(var\(--popover\)\);[^}]*color: hsl\(var\(--popover-foreground\)\);/')
        ->toMatch('/\.leaflet-container \.leaflet-bar a \{[^}]*background-color: hsl\(var\(--card\)\);/')
        ->toMatch('/\.leaflet-container \.leaflet-control-attribution \{[^}]*background: hsl\(var\(--card\) \/ 0\.8\);/');
});

it('builds every basemap through the theme-aware helper', function () {
    $offenders = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js')));
    foreach ($files as $file) {
        if (! preg_match('/\.jsx?$/', $file->getFilename())) {
            continue;
        }
        $path = str_replace('\\', '/', $file->getPathname());
        if (str_ends_with($path, 'lib/map-tiles.js')) {
            continue;
        }
        if (str_contains(file_get_contents($path), 'L.tileLayer(')) {
            $offenders[] = $path;
        }
    }

    // L.tileLayer langsung = peta yang tetap terang di mode gelap. Pakai addBaseTiles(map).
    expect($offenders)->toBe([]);
});

it('feeds the dark basemap url from env to the browser', function () {
    $helper = file_get_contents(resource_path('js/lib/map-tiles.js'));

    expect(file_get_contents(config_path('services.php')))->toContain("'tile_url_dark' => env('MAP_TILE_URL_DARK')")
        ->and(file_get_contents(resource_path('views/app.blade.php')))->toContain("window.MAP_TILE_URL_DARK = @json(config('services.map.tile_url_dark'))")
        ->and($helper)->toContain('window.MAP_TILE_URL_DARK')
        // Tema dibaca dari kelas <html> (ikut ThemeSwitcher), dan tile diganti saat kelas berubah.
        ->and($helper)->toContain("classList.contains('dark')")
        ->and($helper)->toContain('MutationObserver')
        ->and($helper)->toContain("map.on('unload'");
});

it('keeps the dark style a colour-only twin of the light style', function () {
    $dir = base_path('docker/tiles');
    $light = json_decode(file_get_contents("$dir/style/sisupit-light/style.json"), true);
    $dark = json_decode(file_get_contents("$dir/style/sisupit-dark/style.json"), true);
    $config = json_decode(file_get_contents("$dir/config.json"), true);

    $strip = function (array $style) {
        unset($style['name']);
        $style['layers'] = array_map(function ($layer) {
            unset($layer['paint']);

            return $layer;
        }, $style['layers']);

        return $style;
    };

    // Layer, filter, zoom, font, sumber sama persis - hanya warna (paint) yang boleh berbeda.
    expect($strip($dark))->toBe($strip($light))
        ->and($dark['layers'][0]['paint']['background-color'])->not->toBe($light['layers'][0]['paint']['background-color'])
        ->and($config['styles']['sisupit-dark']['style'] ?? null)->toBe('sisupit-dark/style.json')
        ->and($config['styles']['sisupit']['style'] ?? null)->toBe('sisupit-light/style.json');
});

it('follows a live system theme change while the theme is "system"', function () {
    $provider = file_get_contents(resource_path('js/Components/ThemeProvider.jsx'));

    // Dulu prefers-color-scheme dibaca sekali saat dimuat: HP yang berganti gelap otomatis
    // baru diikuti setelah halaman dimuat ulang.
    expect($provider)->toContain("media.addEventListener('change', sync)")
        ->and($provider)->toContain("media.removeEventListener('change', sync)");
});

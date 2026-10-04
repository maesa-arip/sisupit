<?php

/**
 * TASK_70 - navigasi instan: ketukan langsung mengganti isi dengan kerangka halaman tujuan dan
 * menu langsung menandai tujuan aktif, sebelum respons server tiba. Kegagalan yang dijaga
 * semuanya senyap di test PHP biasa:
 *  - halaman lama DILEPAS (bukan disembunyikan) -> isian form Lapor hilang bila kunjungan gagal;
 *  - reload parsial / filter daftar dihitung sebagai kunjungan -> kerangka berkedip tiap siaran Reverb;
 *  - prefetch dipasang di Inertia 2.0.3 -> link yang prefetch-nya gagal/disela tak bisa diklik lagi
 *    (dibuktikan di Chrome 2026-10-04, FINDINGS #166).
 * Komentar dibuang lebih dulu (pelajaran #108).
 */
function navSource(string $path): string
{
    $src = file_get_contents(base_path($path));

    return preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m', '#\{/\*.*?\*/\}#s'], '', $src);
}

it('installs the navigation tracker once from app.jsx in the browser branch', function () {
    $app = navSource('resources/js/app.jsx');

    expect($app)->toContain("import { installNavigationTracking } from './lib/navigation';")
        ->and(substr_count($app, 'installNavigationTracking();'))->toBe(1);

    // Di dalam blok khusus browser (SSR tak punya document) dan sebelum aplikasi dibuat.
    $guard = strpos($app, "if (typeof window !== 'undefined') {");
    $call = strpos($app, 'installNavigationTracking();');
    expect($guard)->not->toBeFalse()
        ->and($call)->toBeGreaterThan($guard)
        ->and($call)->toBeLessThan(strpos($app, 'createInertiaApp({'));
});

it('hides the previous page instead of unmounting it while the skeleton is shown', function () {
    $layout = navSource('resources/js/Layouts/AppLayout.jsx');

    expect($layout)->toContain('{pendingVisit?.skeleton && <PageSkeleton url={pendingVisit.url} />}')
        ->and($layout)->toContain("<div className={pendingVisit?.skeleton ? 'hidden' : 'contents'}>{children}</div>")
        // children dirender tepat SATU kali dan tak pernah di dalam cabang bersyarat.
        ->and(substr_count($layout, '{children}'))->toBe(1)
        ->and($layout)->not->toMatch('/&&\s*children|\?\s*children|:\s*children/');
});

it('only treats full GET visits to another path as page visits', function () {
    $nav = navSource('resources/js/lib/navigation.js');

    expect(preg_match('/function isPageVisit\(visit\) \{(.*?)\n\}/s', $nav, $m))->toBe(1);

    foreach ([
        "visit.method === 'get'",
        '!visit.prefetch',
        '!visit.async',
        'visit.preserveState === false',
        'visit.only.length === 0',
        'visit.except.length === 0',
        'visit.url.pathname !== window.location.pathname',
    ] as $condition) {
        expect($m[1])->toContain($condition);
    }
});

it('waits for other before-listeners and always clears the skeleton when the visit finishes', function () {
    $nav = navSource('resources/js/lib/navigation.js');

    // Konfirmasi "tinggalkan form" boleh membatalkan kunjungan -> diperiksa setelah semua listener.
    expect($nav)->toMatch('/queueMicrotask\(\(\) => \{\s*if \(event\.defaultPrevented\) return;/')
        // finish menyala untuk sukses, galat, batal & disela - satu-satunya jalan pulang yang pasti.
        ->and($nav)->toMatch("/router\.on\('finish'[^;]*;[\s\S]*?if \(!visit\.prefetch && pending\?\.url === pathOf\(visit\.url\)\) clearPending\(\);/")
        ->and($nav)->toMatch("/router\.on\('navigate'/");
});

it('hides the Inertia progress bar only when a layout that draws the skeleton is mounted', function () {
    $nav = navSource('resources/js/lib/navigation.js');

    // Sinkron di listener `before` (sebelum microtask) - router.visit menyalin objek visit sesudahnya.
    expect($nav)->toMatch("/router\.on\('before', \(event\) => \{\s*const visit = event\.detail\.visit;\s*if \(!isPageVisit\(visit\)\) return;\s*if \(skeletonHosts > 0\) visit\.showProgress = false;/")
        ->and(substr_count($nav, 'showProgress'))->toBe(1)
        ->and($nav)->toMatch('/skeletonHosts\+\+;[\s\S]*?skeletonHosts--;/');

    // Halaman tanpa AppLayout (Auth, Landing) tak memanggilnya -> progress bar tetap tampil di sana.
    expect(navSource('resources/js/Layouts/AppLayout.jsx'))->toContain('useSkeletonHost();');
    expect(navSource('resources/js/app.jsx'))->toContain('progress: {');
});

it('transitions page content with opacity only and no hard cut', function () {
    $nav = navSource('resources/js/lib/navigation.js');
    expect(preg_match('/export function usePageTransition\(ref, pendingVisit\) \{(.*?)\n\}/s', $nav, $m))->toBe(1);
    $hook = $m[1];

    // Hanya opacity (data yang dibaca tak boleh bergeser); tak ada transform/translate/scale.
    preg_match_all('/el\.animate\(\s*\[(.*?)\]/s', $hook, $frames);
    expect($frames[1])->toHaveCount(3);
    foreach ($frames[1] as $keyframes) {
        expect($keyframes)->toContain('opacity')->not->toMatch('/transform|translate|scale/');
    }

    // Halaman lama memudar keluar selama jeda kerangka; kunjungan gagal = fade dilepas (cancel).
    expect($hook)->toMatch('/duration: SKELETON_DELAY_MS,\s*easing: PAGE_FADE_EASING,\s*fill: \'forwards\'/')
        ->and($hook)->toContain('leaving.current?.cancel();')
        // Fade masuk sesudah frame berat: dua requestAnimationFrame bersarang + gaya inline dibersihkan.
        ->and($hook)->toMatch('/requestAnimationFrame\(\(\) => \{\s*second = requestAnimationFrame\(\(\) => \{\s*el\.style\.opacity = \'\';\s*el\.animate/')
        ->and($hook)->toMatch('/return \(\) => \{\s*cancelAnimationFrame\(first\);\s*cancelAnimationFrame\(second\);\s*el\.style\.opacity = \'\';/');

    // Kurva = token ease-spring repo, bukan kurva baru.
    expect($nav)->toContain("const PAGE_FADE_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';");
    expect(file_get_contents(base_path('tailwind.config.js')))->toContain("spring: 'cubic-bezier(0.32, 0.72, 0, 1)'");

    expect(navSource('resources/js/Layouts/AppLayout.jsx'))->toContain('usePageTransition(contentRef, pendingVisit);')
        ->toContain('<div ref={contentRef} className="p-4 lg:p-8">');
    expect(navSource('resources/js/Components/PageSkeleton.jsx'))->toMatch('/className="[^"]*\banimate-in\b[^"]*\bfade-in-0\b[^"]*"/');
});

it('does not animate the petugas dashboard mini map zoom while the page arrives', function () {
    expect(navSource('resources/js/Pages/Petugas/Dashboard.jsx'))
        ->toContain('map.fitBounds(group.getBounds().pad(0.3), { animate: false });');
});

it('never animates Leaflet markers (FINDINGS #167)', function () {
    // Denyut di dalam marker digambar ulang tiap frame selama peta terbuka - di dashboard petugas
    // ~31 marker sekaligus, di dalam filter drop-shadow (keputusan user 2026-10-04: matikan semua).
    $offenders = [];
    foreach (\Illuminate\Support\Facades\File::allFiles(resource_path('js')) as $file) {
        if ($file->getExtension() !== 'jsx' || ! str_contains($file->getContents(), 'divIcon(')) {
            continue;
        }
        $src = navSource('resources/js/'.str_replace(DIRECTORY_SEPARATOR, '/', $file->getRelativePathname()));
        preg_match_all('/html:\s*`([^`]*)`/s', $src, $html);
        foreach ($html[1] as $markup) {
            if (preg_match('/\banimate-(pulse|ping|bounce|spin)\b/', $markup)) {
                $offenders[] = $file->getRelativePathname();
            }
        }
    }
    expect($offenders)->toBe([]);

    // Kamus warna marker Peta Pemantauan diteruskan ke divIcon lewat glyphIcon(meta.marker, ...).
    preg_match_all("/marker: '([^']*)'/", navSource('resources/js/Pages/Monitoring/Map.jsx'), $markers);
    expect($markers[1])->not->toBeEmpty();
    foreach ($markers[1] as $classes) {
        expect($classes)->not->toContain('animate-');
    }
});

it('marks the destination active in both navigation surfaces', function () {
    expect(navSource('resources/js/Layouts/AppLayout.jsx'))->toContain('const url = useNavUrl();')
        ->toContain('<Sidebar url={url}');

    $bottom = navSource('resources/js/Layouts/Partials/MobileBottomNav.jsx');
    expect($bottom)->toContain('const url = useNavUrl();')
        ->and($bottom)->not->toContain('usePage()');
});

it('never prefetches while @inertiajs/core is still 2.0.3', function () {
    $lock = json_decode(file_get_contents(base_path('package-lock.json')), true);
    $version = $lock['packages']['node_modules/@inertiajs/core']['version'] ?? null;

    if ($version !== '2.0.3') {
        // Setelah upgrade, buktikan ulang bug #166 sudah hilang sebelum menghapus penjaga ini.
        $this->markTestSkipped("@inertiajs/core {$version}: periksa ulang FINDINGS #166 lalu sesuaikan test ini.");
    }

    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(base_path('resources/js')));
    $offenders = [];
    foreach ($files as $file) {
        if (! preg_match('/\.(jsx?|tsx?)$/', $file->getFilename())) {
            continue;
        }
        $src = navSource(str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname()));
        if (preg_match('/router\.prefetch\(|<Link\b[^>]*\sprefetch\b/s', $src)) {
            $offenders[] = $file->getFilename();
        }
    }

    expect($offenders)->toBe([]);
});

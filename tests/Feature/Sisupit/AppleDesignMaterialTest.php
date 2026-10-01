<?php

/**
 * TASK_69 bagian 2 (apple-design), KHUSUS branch feat/mobile-native-polish atas permintaan user
 * 2026-10-01 - PENGECUALIAN_ATURAN #5. Menjaga material tembus pandang, pegas, asal gerak dari
 * pemicu, reduced motion = cross-fade, dan tracking per ukuran. Bentuk kegagalan yang dijaga
 * semuanya senyap: utilitas `bg-*` di elemen yang sama diam-diam membuat material padat, dan
 * menolkan geser pada dialog yang dipusatkan lewat translate membuatnya melompat. Komentar
 * dibuang lebih dulu (pelajaran #108).
 */
function appleSource(string $path): string
{
    $src = file_get_contents(base_path($path));

    return preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m', '#\{/\*.*?\*/\}#s', '#\{\{--.*?--\}\}#s'], '', $src);
}

function appleClassesAround(string $path, string $needle): array
{
    $src = appleSource($path);
    $pos = strpos($src, $needle);
    expect($pos)->not->toBeFalse();
    expect(preg_match('/[\'"]([^\'"]*'.preg_quote($needle, '/').'[^\'"]*)[\'"]/', $src, $m))->toBe(1);

    return preg_split('/\s+/', trim($m[1]));
}

it('defines both materials with a blur and a solid fallback for reduced transparency and high contrast', function () {
    $css = appleSource('resources/css/app.css');

    expect($css)->toMatch('/\.material-chrome\s*\{[^}]*backdrop-filter:\s*blur\(/')
        ->and($css)->toMatch('/\.material-thick\s*\{[^}]*backdrop-filter:\s*blur\(/')
        ->and($css)->toMatch('/@media \(prefers-reduced-transparency: reduce\), \(prefers-contrast: more\)\s*\{[^@]*backdrop-filter:\s*none/')
        ->and($css)->toMatch('/@supports not \(\(backdrop-filter/');
});

it('builds the header and the bottom bar from the chrome material, never a solid background', function (string $path, string $needle) {
    $classes = appleClassesAround($path, $needle);

    expect($classes)->toContain('material-chrome')
        ->and(preg_grep('/^bg-/', $classes))->toBe([]);
})->with([
    ['resources/js/Layouts/AppLayout.jsx', 'sticky top-0 z-40'],
    ['resources/js/Layouts/Partials/MobileBottomNav.jsx', 'fixed bottom-0 left-0 z-50'],
]);

it('grows every floating surface from its trigger out of the thick material', function (string $path, string $needle, string $origin) {
    $classes = appleClassesAround($path, $needle);

    expect($classes)->toContain('material-thick')
        ->and($classes)->toContain($origin)
        ->and(preg_grep('/^bg-/', $classes))->toBe([]);
})->with([
    ['resources/js/Components/ui/popover.jsx', 'w-72 origin-', 'origin-[--radix-popover-content-transform-origin]'],
    ['resources/js/Components/ui/dropdown-menu.jsx', 'min-w-[8rem] origin-', 'origin-[--radix-dropdown-menu-content-transform-origin]'],
    ['resources/js/Components/ui/select.jsx', 'max-h-96 min-w-[8rem]', 'origin-[--radix-select-content-transform-origin]'],
    ['resources/js/Layouts/Partials/MobileBottomNav.jsx', 'absolute bottom-[72px]', 'origin-bottom'],
]);

it('keeps the solid command surface out of the material popovers that host it', function () {
    expect(appleClassesAround('resources/js/Components/ui/command.jsx', 'flex h-full w-full flex-col'))
        ->toContain('bg-transparent')->not->toContain('bg-popover');
});

it('turns reduced motion into a cross-fade without un-centering translated dialogs', function () {
    $css = appleSource('resources/css/app.css');

    expect(preg_match('/@media \(prefers-reduced-motion: reduce\)\s*\{(.*)\n\}/s', $css, $m))->toBe(1);
    expect($m[1])->toMatch('/--tw-enter-scale:\s*1/')
        ->and($m[1])->toMatch('/\.animate-in:not\(\.translate-x-\\\\\[-50\\\\%\\\\\], \.-translate-x-1\\\\\/2\)[^{]*\{[^}]*--tw-enter-translate-x:\s*0/');

    foreach (['DialogContent' => 'resources/js/Components/ui/dialog.jsx', 'AlertDialogContent' => 'resources/js/Components/ui/alert-dialog.jsx'] as $const => $path) {
        $classes = appleClassesAround($path, 'translate-x-[-50%]');
        expect($classes)->toContain('data-[state=open]:slide-in-from-left-1/2')
            ->and($classes)->toContain('data-[state=open]:slide-in-from-top-1/2')
            ->and($classes)->toContain('ease-spring')
            ->and($classes)->not->toContain('data-[state=open]:slide-in-from-top-[48%]');
    }
});

it('gives the bottom bar slots press feedback and defines the spring curve', function () {
    $slot = appleClassesAround('resources/js/Layouts/Partials/MobileBottomNav.jsx', 'group relative flex h-full w-full');
    expect($slot)->toContain('active:scale-[0.92]')->and($slot)->toContain('motion-reduce:active:scale-100');

    expect(appleSource('tailwind.config.js'))->toMatch("/transitionTimingFunction:\s*\{\s*spring:\s*'cubic-bezier\(0\.32, 0\.72, 0, 1\)'/");
});

it('matches the browser status bar to the header in each colour scheme', function () {
    $blade = appleSource('resources/views/app.blade.php');

    expect(preg_match_all('/<meta name="theme-color" media="\(prefers-color-scheme: (light|dark)\)"/', $blade))->toBe(2)
        ->and($blade)->not->toMatch('/<meta name="theme-color" content=/');
});

it('tightens large headings and leaves body text untracked', function () {
    $css = appleSource('resources/css/app.css');

    expect($css)->toMatch('/\bh1\s*\{\s*letter-spacing:\s*-0\.0\d+em/')
        ->and($css)->not->toMatch('/\bbody\s*\{[^}]*letter-spacing/');
});

it('keeps user management on the grouped form and off the old gradient button variants', function () {
    $pages = ['Index', 'Create', 'Edit'];

    foreach ($pages as $page) {
        $src = appleSource("resources/js/Pages/Admin/Users/{$page}.jsx");
        expect($src)->not->toMatch('/variant="(green|blue|red|orange|purple)"/')
            ->and($src)->not->toMatch('/>\s*(Save|Reset|Cancel|Continue)\s*</');
    }

    foreach (['Create', 'Edit'] as $page) {
        expect(appleSource("resources/js/Pages/Admin/Users/{$page}.jsx"))
            ->toContain('<FormSection')
            ->toContain('<SegmentedControl');
    }

    expect(appleSource('resources/js/Pages/Admin/Users/Index.jsx'))->toContain('roleLabel([role])');
});

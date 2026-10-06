<?php

/**
 * #159 / TASK_69: lapisan platform yang membuat Sisupit terasa "situs web di dalam ponsel" alih-alih
 * aplikasi - hover yang menempel setelah diketuk, kilatan tap, tombol tanpa umpan balik tekan, halaman
 * yang di-zoom iOS saat kolom bertulisan < 16px difokuskan, toast yang tak ikut tema aplikasi, gulir
 * daftar yang tembus ke halaman, dan 100vh di layar ponsel. Semuanya senyap: tak ada galat, build hijau,
 * dan tak satu pun terlihat di emulasi perangkat Chrome desktop. Komentar dibuang lebih dulu supaya
 * penjelasan di berkas tak ikut dihitung sebagai kode (pelajaran #108).
 */
function nativeSource(string $path): string
{
    $src = file_get_contents(base_path($path));

    return preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m', '#\{/\*.*?\*/\}#s'], '', $src);
}

/** Kelas di string pertama `cn('...')` / cva('...') milik sebuah konstanta komponen. */
function baseClassesOf(string $path, string $const): array
{
    $src = nativeSource($path);
    expect(preg_match('/const '.$const.' = .*?(?:cn|cva)\(\s*\'([^\']*)\'/s', $src, $m))->toBe(1);

    return preg_split('/\s+/', trim($m[1]));
}

it('only applies hover styles on devices that can really hover', function () {
    expect(nativeSource('tailwind.config.js'))->toMatch('/future\s*:\s*\{[^}]*hoverOnlyWhenSupported\s*:\s*true/');
});

it('removes the tap flash and the tap delay, and keeps control labels unselectable', function () {
    $css = nativeSource('resources/css/app.css');

    expect($css)->toMatch('/\bhtml\s*\{[^}]*-webkit-tap-highlight-color\s*:\s*transparent/');
    expect(preg_match('/\bbutton\s*,\s*\[role=.button.\][^{]*\{([^}]*)\}/', $css, $m))->toBe(1);
    expect($m[1])->toMatch('/touch-action\s*:\s*manipulation/')
        ->and($m[1])->toMatch('/(?<!-webkit-)user-select\s*:\s*none/')
        ->and($m[1])->toMatch('/-webkit-user-select\s*:\s*none/');
});

it('gives every Button press feedback that respects reduced motion', function () {
    $classes = baseClassesOf('resources/js/Components/ui/button.jsx', 'buttonVariants');

    expect($classes)->toContain('active:scale-[0.97]')
        ->and($classes)->toContain('motion-reduce:active:scale-100')
        ->and($classes)->not->toContain('transition-colors');
});

it('keeps every text field at 16px on phones so iOS never zooms the page', function () {
    $command = baseClassesOf('resources/js/Components/ui/command.jsx', 'CommandInput');
    expect($command)->toContain('text-base')->and($command)->toContain('md:text-sm')->and($command)->not->toContain('text-sm');

    $offenders = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js')));
    foreach ($files as $file) {
        if ($file->getExtension() !== 'jsx') {
            continue;
        }
        $src = nativeSource(substr($file->getPathname(), strlen(base_path()) + 1));
        preg_match_all('/<(?:select|textarea|input)\b(?:(?!\/?>).)*?className="([^"]*)"/s', $src, $all);
        foreach ($all[1] as $classes) {
            $list = preg_split('/\s+/', $classes);
            $small = array_intersect($list, ['text-xs', 'text-sm', 'text-[10px]', 'text-[11px]', 'text-[12px]', 'text-[13px]']);
            if ($small && ! in_array('sr-only', $list, true) && ! in_array('hidden', $list, true)) {
                $offenders[] = $file->getFilename().': '.implode(' ', $small);
            }
        }
    }

    expect($offenders)->toBe([]);
});

it('follows the theme the user picked in the app, not a provider that is never mounted', function () {
    $src = nativeSource('resources/js/Components/ui/sonner.jsx');

    expect($src)->not->toContain('next-themes')
        ->and($src)->toMatch('/import \{ useTheme \} from \'@\/Components\/ThemeProvider\'/');
});

it('stops inner scroll lists from dragging the page behind them', function (string $path, string $needle) {
    $src = nativeSource($path);
    $pos = strpos($src, $needle);
    expect($pos)->not->toBeFalse();

    expect(substr($src, $pos, 400))->toMatch('/overflow-y-auto[^"\']*overscroll-contain|overscroll-contain[^"\']*overflow-y-auto/');
})->with([
    ['resources/js/Components/ui/command.jsx', 'const CommandList'],
    ['resources/js/Layouts/Partials/MobileBottomNav.jsx', '<div className="px-5 pb-2 pt-3">'],
    ['resources/js/Layouts/AppLayout.jsx', 'max-h-80 divide-y'],
    ['resources/js/Components/TimePicker.jsx', 'const column = (items'],
]);

it('sizes phone-visible full-height layouts with dvh, not vh', function () {
    $offenders = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js/Pages')));
    foreach ($files as $file) {
        if ($file->getExtension() !== 'jsx') {
            continue;
        }
        preg_match_all('/(?<![\w:-])((?:[a-z]+:)*)(h-screen|h-\[calc\(100vh[^\]]*\])/', nativeSource(substr($file->getPathname(), strlen(base_path()) + 1)), $all, PREG_SET_ORDER);
        foreach ($all as $m) {
            if (! preg_match('/\b(lg|xl|2xl):/', $m[1])) {
                $offenders[] = $file->getFilename().': '.$m[1].$m[2];
            }
        }
    }

    expect($offenders)->toBe([]);
});

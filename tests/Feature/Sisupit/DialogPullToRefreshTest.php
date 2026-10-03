<?php

/*
 * TASK_65 (keluhan user 2026-09-29): "scroll di atur anggota regu saat tarik ke bawah bukan
 * datanya yang scroll tapi pagenya, jadi sering malah ke refresh di webview". Akarnya di APK:
 * SwipeRefreshLayout hanya melihat posisi gulir HALAMAN, jadi tarikan ke bawah di dalam dialog
 * saat halaman di puncak = muat ulang. Web meminta APK mematikannya selama dialog terbuka.
 *
 * Yang dijaga: (1) penguncinya terpasang di DALAM Content Radix (hanya ada selama terbuka) -
 * dipasang di DialogContent sendiri ia ikut berjalan saat dialog TERTUTUP dan refresh mati
 * selamanya di setiap halaman yang punya dialog; (2) pemanggilannya opsional, sebab APK lama
 * tak punya method itu dan panggilan tanpa pemeriksaan melempar galat di setiap dialog;
 * (3) daftar anggota /regu bergulir sendiri.
 */

function jsxWithoutComments(string $path): string
{
    return preg_replace(['~\{/\*.*?\*/\}~s', '~/\*.*?\*/~s', '~^\s*//.*$~m'], '', file_get_contents(resource_path($path)));
}

it('pauses native pull-to-refresh only while a dialog is actually open', function () {
    $jsx = jsxWithoutComments('js/Components/ui/dialog.jsx');

    expect($jsx)->toMatch('~<DialogPrimitive\.Content[^>]*>\s*<PullToRefreshLock\s*/>~s');
    expect(substr_count($jsx, '<PullToRefreshLock'))->toBe(1);

    $lock = jsxWithoutComments('js/lib/pull-to-refresh-lock.js');
    expect($lock)->toMatch("~typeof bridge\.setPullToRefreshEnabled === 'function'~");
    expect($lock)->toMatch('~openPanelCount === 0\) setNativePullToRefresh\(true\)~');
});

/*
 * Keluhan user 2026-10-03: "klik menu muncul list menu, scroll ke bawah lalu ke atas bukan
 * menunya yang ke-scroll tapi tarik layar untuk refresh". Popover Menu/Fasilitas bilah bawah
 * (dan panel melayang bergulir lain) tak pernah memasang kunci yang sama dengan dialog.
 */
it('pauses native pull-to-refresh inside every scrollable floating panel', function () {
    foreach ([
        'js/Components/ui/dropdown-menu.jsx' => '~<DropdownMenuPrimitive\.Content[^>]*>\s*<PullToRefreshLock\s*/>~s',
        'js/Components/ui/popover.jsx' => '~<PopoverPrimitive\.Content[^>]*>\s*<PullToRefreshLock\s*/>~s',
        'js/Components/ui/select.jsx' => '~<SelectPrimitive\.Content[^>]*>\s*<PullToRefreshLock\s*/>~s',
        'js/Components/ui/sheet.jsx' => '~</SheetPrimitive\.Close>\s*<PullToRefreshLock\s*/>~s',
        'js/Layouts/Partials/MobileBottomNav.jsx' => '~function FloatingPanel\(.*?<PullToRefreshLock\s*/>\s*\{children\}~s',
    ] as $path => $pattern) {
        expect(jsxWithoutComments($path))->toMatch($pattern);
    }

    // FloatingPanel hanya boleh ada selama panelnya terbuka (dirender bersyarat).
    $nav = jsxWithoutComments('js/Layouts/Partials/MobileBottomNav.jsx');
    expect($nav)->toMatch('~\{showMenu && \(\s*<FloatingPanel~');
    expect($nav)->toMatch('~\{showFasilitas && \(\s*<FloatingPanel~');
});

it('lets the regu member list scroll on its own', function () {
    $jsx = jsxWithoutComments('js/Pages/Regu/Index.jsx');

    expect($jsx)->toMatch('~className="[^"]*\boverflow-y-auto\b[^"]*\boverscroll-contain\b[^"]*">\s*\{visibleMembers\.map~');
});

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
    expect($jsx)->toMatch("~typeof bridge\.setPullToRefreshEnabled === 'function'~");
    expect($jsx)->toMatch('~openDialogCount === 0\) setNativePullToRefresh\(true\)~');
});

it('lets the regu member list scroll on its own', function () {
    $jsx = jsxWithoutComments('js/Pages/Regu/Index.jsx');

    expect($jsx)->toMatch('~className="[^"]*\boverflow-y-auto\b[^"]*\boverscroll-contain\b[^"]*">\s*\{visibleMembers\.map~');
});

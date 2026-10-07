<?php

/**
 * #190 - daftar di /admin/hydrants, /admin/pumps, /admin/fire-stations, /admin/reports terpotong
 * di desktop. Kolom daftar bertinggi tetap (`lg:h-[calc(100vh-240px)] lg:overflow-y-auto`) dan
 * flex-col, jadi kartu daftar ikut DIKECILKAN flexbox (flex-shrink bawaan 1) lalu
 * `overflow-hidden` kartu memotong isinya - kolom pun tak bisa di-scroll karena tak ada yang meluap.
 *
 * ATURAN: kartu `divide-y ... overflow-hidden` di dalam kolom scroll tetap wajib `shrink-0`.
 */
it('keeps list cards inside fixed-height scroll columns from shrinking', function () {
    $pages = collect(\Illuminate\Support\Facades\File::allFiles(resource_path('js/Pages')))
        ->filter(fn ($f) => $f->getExtension() === 'jsx')
        ->filter(fn ($f) => str_contains($f->getContents(), 'lg:h-[calc(100vh-240px)] lg:overflow-y-auto'));

    // Empat halaman saat #190 diperbaiki - kalau turun, pemindainya rusak (atau halaman sengaja
    // dirombak: turunkan angkanya dengan sadar).
    expect($pages->count())->toBeGreaterThanOrEqual(4);

    $offenders = [];
    foreach ($pages as $page) {
        preg_match_all('~className="([^"]*\bdivide-y\b[^"]*\boverflow-hidden\b[^"]*)"~', $page->getContents(), $m);
        expect($m[1])->not->toBeEmpty();
        foreach ($m[1] as $classes) {
            if (! preg_match('~(^|\s)shrink-0(\s|$)~', $classes)) {
                $offenders[] = $page->getRelativePathname().': '.$classes;
            }
        }
    }
    expect($offenders)->toBe([]);
});

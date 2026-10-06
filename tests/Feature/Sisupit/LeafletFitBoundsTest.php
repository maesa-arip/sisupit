<?php

/**
 * #183 - peta kadang terbuka di zoom paling jauh (peta dunia) dan baru benar setelah refresh.
 * Selama kerangka navigasi ditahan (TASK_70), halaman tujuan terpasang tapi display:none, jadi
 * `map.fitBounds` mengukur peta 0x0: tanpa padding zoom jatuh ke 0, dengan padding state peta
 * rusak (NaN). `invalidateSize` sesudahnya tak mengulang fit.
 *
 * ATURAN: halaman tidak memanggil `.fitBounds(` langsung - pakai `fitBoundsWhenSized` dari
 * `lib/leaflet-fit.js`, yang menunda fit sampai peta punya ukuran.
 */
function jsSourcesWithoutComments(): array
{
    return collect(\Illuminate\Support\Facades\File::allFiles(resource_path('js')))
        ->filter(fn ($f) => in_array($f->getExtension(), ['js', 'jsx'], true))
        ->mapWithKeys(fn ($f) => [
            str_replace('\\', '/', $f->getRelativePathname()) => preg_replace(['~/\*.*?\*/~s', '~^\s*//.*$~m'], '', $f->getContents()),
        ])->all();
}

it('fits leaflet bounds only through fitBoundsWhenSized', function () {
    $sources = jsSourcesWithoutComments();

    $direct = collect($sources)
        ->except('lib/leaflet-fit.js')
        ->filter(fn ($source) => str_contains($source, '.fitBounds('))
        ->keys()->all();
    expect($direct)->toBe([]);

    // Tujuh pemanggil saat #183 diperbaiki - kalau angkanya turun, pemindainya rusak (atau
    // peta sungguh dihapus: turunkan angkanya dengan sadar).
    $callers = collect($sources)->filter(fn ($source) => str_contains($source, 'fitBoundsWhenSized('))->count();
    expect($callers)->toBeGreaterThanOrEqual(8); // 7 halaman + definisi helper
});

it('defers the fit until the map has a size', function () {
    $helper = file_get_contents(resource_path('js/lib/leaflet-fit.js'));

    expect($helper)
        ->toContain("map.on('resize'")
        ->toContain('size.x > 0 && size.y > 0');
});

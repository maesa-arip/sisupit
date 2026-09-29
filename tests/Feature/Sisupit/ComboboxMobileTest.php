<?php

/**
 * #144: di ponsel, membuka ui/combobox dulu langsung memfokuskan kolom cari -> keyboard muncul,
 * layar tinggal separuh, popover berbalik ke atas dan terpotong di balik bilah notifikasi.
 * Dua penjaganya hidup di JSX, jadi test ini membaca berkasnya (komentar dibuang lebih dulu supaya
 * penjelasan di berkas tak ikut dihitung sebagai kode).
 */
function comboboxSource(): string
{
    $src = file_get_contents(resource_path('js/Components/ui/combobox.jsx'));

    return preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m'], '', $src);
}

it('does not auto-focus the search field on touch devices', function () {
    $src = comboboxSource();

    expect($src)->toMatch('/onOpenAutoFocus=\{\(e\)\s*=>\s*\{\s*if \(isTouch\(\)\) e\.preventDefault\(\);/')
        ->and($src)->toMatch("/matchMedia\?\.\('\(pointer: coarse\)'\)/");
});

it('caps the popover to the space left on screen so it never runs past the screen edge', function () {
    expect(comboboxSource())->toMatch('/<PopoverContent\s+className="[^"]*\bmax-h-\[var\(--radix-popover-content-available-height\)\]/');
});

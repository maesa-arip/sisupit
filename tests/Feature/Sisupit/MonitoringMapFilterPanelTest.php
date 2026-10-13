<?php

/**
 * #204 - pop-up filter Peta Pemantauan terpotong di bawah pada ponsel. Kartu panel memakai
 * `max-h-[calc(100%-5rem)]`, tapi pembungkusnya (`absolute left-0 top-0`) tak punya tinggi, jadi
 * persentase itu tak berlaku: kartu memanjang mengikuti isi (filter #202) dan dipotong
 * `overflow-hidden` wadah peta - area gulirnya tak pernah aktif.
 *
 * ATURAN: pembungkus panel setinggi peta (top-0 + bottom-0) dan meneruskan ketukan
 * (`pointer-events-none`); kartunya `pointer-events-auto`.
 */
it('gives the monitoring map filter panel wrapper a height so the card can scroll', function () {
    $src = file_get_contents(resource_path('js/Pages/Monitoring/Map.jsx'));

    preg_match("~'([^']*\\bmax-w-\\[17rem\\][^']*)'~", $src, $wrapper);
    expect($wrapper)->not->toBeEmpty();
    $classes = ' '.$wrapper[1].' ';
    expect($classes)->toContain(' top-0 ')
        ->toContain(' bottom-0 ')
        ->toContain(' pointer-events-none ');

    preg_match('~className="([^"]*\bmax-h-\[calc\(100%-5rem\)\][^"]*)"~', $src, $card);
    expect($card)->not->toBeEmpty();
    expect(' '.$card[1].' ')->toContain(' pointer-events-auto ')->toContain(' overflow-hidden ');
});

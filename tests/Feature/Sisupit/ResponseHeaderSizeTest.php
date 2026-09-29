<?php

/*
 * FINDINGS #155 (2026-09-30): membuka Profil di VPS = 502 Bad Gateway. Nginx: "upstream sent too
 * big header" - header respons (Link preload ~4 KB + cookie sesi) melewati buffer FastCGI 4 KB.
 * Buffer Nginx dinaikkan di server, DAN header `Link` dicabut di aplikasi: tag modulepreload yang
 * sama sudah ada di HTML (@vite), jadi header itu mubazir - dan ia tumbuh diam-diam tiap halaman
 * bertambah impor sampai suatu hari melewati batas tanpa galat saat build maupun test.
 *
 * Hanya penjaga STATIS: di lingkungan test Vite tidak menghasilkan daftar preload, jadi test yang
 * mengukur header respons tetap hijau walau middleware-nya dipasang lagi (dibuktikan lewat sabotase
 * 2026-09-30) - penjaga semacam itu tidak menjaga apa pun.
 */
it('does not register the Link preload header middleware', function () {
    $src = preg_replace('~//.*$~m', '', file_get_contents(base_path('bootstrap/app.php')));

    expect($src)->not->toContain('AddLinkHeadersForPreloadedAssets');
});

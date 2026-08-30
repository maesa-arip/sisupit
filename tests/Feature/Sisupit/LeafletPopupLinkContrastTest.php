<?php

/**
 * FINDINGS #98 — tombol "Lihat Detail" di popup Peta Pemantauan berteks BIRU LEAFLET di atas
 * latar merah, praktis tak terbaca. Akarnya bukan di markup kita: `leaflet.css` memasang
 * `.leaflet-container a { color:#0078A8 }` — spesifisitas (0,1,1) mengalahkan utility Tailwind
 * (0,1,0) — dan `app.blade.php` memuat berkas itu SESUDAH bundel Vite, jadi ia menang lewat
 * spesifisitas maupun urutan. Satu-satunya penawarnya `!` (important).
 *
 * Gejalanya senyap sempurna: kelas warnanya TETAP terbaca benar di DOM, tak ada galat, tak ada
 * baris log — hanya warna yang menang yang berbeda. Karena itu penjaganya harus mengunci
 * bentuk TULISANNYA; tak ada test render yang bisa menangkap ini (Pest tak menjalankan CSS).
 *
 * Membaca berkas sumber mengikuti pola MobileNavParityTest / RoleLabelParityTest / #94.
 */
$peta = fn () => file_get_contents(resource_path('js/Pages/Monitoring/Map.jsx'));

// Ambil SETIAP <a ...> yang ditulis ke dalam string popup Leaflet di berkas ini.
$popupAnchors = function () use ($peta) {
    preg_match_all('/<a\s[^>]*class="([^"]*)"[^>]*>/', $peta(), $m);

    return $m[1];
};

it('gives every leaflet popup link an important text colour', function () use ($popupAnchors) {
    $anchors = $popupAnchors();

    // Kalau tautannya lenyap, penjaga ini diam-diam berhenti menjaga apa pun.
    expect($anchors)->not->toBeEmpty();

    foreach ($anchors as $classes) {
        expect($classes)->toMatch('/(^|\s)!text-/',
            'Tautan di dalam popup Leaflet wajib memakai `!` pada warna teksnya, kalau tidak '
            .'`.leaflet-container a { color:#0078A8 }` yang menang dan teksnya tak terbaca (#98). '
            ."Kelas yang ditemukan: {$classes}");
    }
});

it('keeps the detail button on the destructive button tokens', function () use ($peta) {
    preg_match('/<a\s[^>]*data-report-detail[^>]*class="([^"]*)"/', $peta(), $m);

    $classes = $m[1] ?? '';

    // Warna latar + warna teks harus sepasang: latar merah dengan teks yang bukan
    // destructive-foreground adalah persis keadaan yang dilaporkan user.
    expect($classes)->toContain('bg-destructive')
        ->and($classes)->toContain('!text-destructive-foreground')
        // Bentuknya menyalin Button varian `destructive`, bukan dialek khusus peta.
        ->and($classes)->toContain('rounded-md')
        ->and($classes)->toContain('text-xs')
        // Label mungil huruf kapital sudah ditinggalkan sejak kluster H (#37).
        ->and($classes)->not->toContain('uppercase')
        ->and($classes)->not->toContain('text-[11px]');
});

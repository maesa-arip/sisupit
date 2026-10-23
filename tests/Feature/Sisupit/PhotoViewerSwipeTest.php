<?php

/**
 * #215 - penampil foto Detail Insiden dulu memegang SATU path (`modalPhoto`), jadi foto
 * berikutnya hanya bisa dilihat dengan tutup lalu buka lagi. Kini PhotoViewer menerima satu
 * kelompok foto + indeks yang diketuk dan bisa digeser (carousel Embla).
 *
 * ATURAN yang dijaga:
 *  - kedua pemakai (lampiran laporan & foto berita acara) mengirim DAFTAR foto + indeks;
 *  - penampil memakai carousel yang mulai dari foto yang diketuk.
 */
it('opens the viewer with the whole photo group so it can be swiped', function () {
    $show = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));

    expect($show)->not->toContain('setModalPhoto')
        ->and($show)->toContain('setPhotoViewer({ photos, index: i })')
        ->and($show)->toContain('photos: r.photos.map((x) => x.path),')
        ->and($show)->toContain('<PhotoViewer viewer={photoViewer} onClose={() => setPhotoViewer(null)} />');
});

it('renders the photos in a carousel starting at the tapped photo', function () {
    $viewer = file_get_contents(resource_path('js/Components/PhotoViewer.jsx'));

    expect($viewer)->toContain("from '@/Components/ui/carousel';")
        ->and($viewer)->toContain('opts={{ startIndex: viewer.index }}')
        ->and($viewer)->toContain('{photos.map((path, i) => (')
        ->and($viewer)->toContain('{current + 1} / {photos.length}');
});

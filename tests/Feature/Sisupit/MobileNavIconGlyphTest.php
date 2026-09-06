<?php

// FINDINGS #106 — akar temuan itu bukan "logonya salah warna" melainkan LETAK warnanya:
// slot "Lapor" merender `/icon.png`, sebuah petir putih DI DALAM kotak merah penuh, sehingga
// satu slot tampak aktif di setiap halaman. Pelanggarannya ada di dalam PIKSEL, bukan di satu
// kelas Tailwind pun — jadi ia lolos dari setiap pemeriksaan yang membaca kelas, dan tak ada
// test lama yang bisa melihatnya.
//
// Sejak 2026-09-06 slot itu kembali memakai petir brand atas permintaan user, tapi sebagai
// GLYPH (`Components/BrandBoltIcon.jsx`, `currentColor`) — bukan gambar. Perbedaan itulah yang
// dijaga di sini: yang terlarang di bilah bukan MOTIF petirnya, melainkan aset yang membawa
// warnanya sendiri. Tanpa penjaga ini, mengembalikan `<img src="/icon.png">` ke bilah adalah
// satu baris yang hijau di seluruh test suite.
//
// Diuji dari BERKAS SUMBER karena di situlah sifatnya hidup — komponen React tidak dirender
// oleh Pest.

$stripComments = fn (string $source) => preg_replace(['#/\*.*?\*/#s', '#//[^\n]*#'], '', $source);

// Inilah akar #106. Komentar dibuang lebih dulu: berkas itu MENJELASKAN kenapa `/icon.png`
// dilarang di sana, dan penjaga yang tersandung penjelasannya sendiri akan dimatikan orang
// berikutnya alih-alih dipatuhi (pelajaran yang sama dari #108).
it('never renders a colored image asset in the mobile bottom bar', function () use ($stripComments) {
    $source = $stripComments(file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx')));

    expect($source)
        ->not->toContain('<img')
        ->not->toContain('.png')
        ->not->toContain('.jpg')
        ->not->toContain('.webp');
});

// Slot "Lapor" memakai petir brand — permintaan user 2026-09-06, membalik IconFlame yang
// dipasang 2026-09-01. `IconBolt` milik @tabler SENGAJA tidak dipakai: di repo ini petir @tabler
// sudah berarti jenis kejadian LISTRIK (`Admin/Dashboard.jsx`), dan satu ikon tak boleh punya
// dua makna.
it('draws the brand bolt in the Lapor slot, not the tabler bolt', function () use ($stripComments) {
    $source = $stripComments(file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx')));

    expect($source)
        ->toContain("from '@/Components/BrandBoltIcon'")
        ->toContain('icon={BrandBoltIcon}')
        ->not->toContain('IconBolt');
});

// Yang membuat #106 mustahil terulang: petirnya tidak memiliki warna sendiri. Begitu sebuah
// nilai warna ditulis di dalam glyph ini — hex, rgb, atau `fill` selain none — ia berhenti
// mengikuti `text-destructive`/`text-muted-foreground` milik slotnya dan kembali jadi bidang
// yang berbicara sendiri, tepat seperti PNG yang dulu dilepas.
it('keeps the brand bolt a glyph that inherits its color', function () use ($stripComments) {
    $source = $stripComments(file_get_contents(resource_path('js/Components/BrandBoltIcon.jsx')));

    // Baik garis maupun padat mengambil warnanya dari slot; tak ada satu pun nilai warna yang
    // ditulis di dalam glyph ini. Itulah yang membedakannya dari `/icon.png`.
    expect($source)
        ->toContain('stroke="currentColor"')
        ->toContain("filled ? 'currentColor' : 'none'");

    expect(preg_match('/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/', $source))->toBe(0);
});

// Permintaan user 2026-09-06: petir MEMADAT saat slotnya aktif. Syarat "hanya saat aktif" itulah
// yang membuatnya sah — "bidang terisi HANYA milik slot aktif" adalah aturan yang lahir dari #106
// putaran kedua. Kalau bawaan `filled` suatu saat dibalik jadi true, atau slot itu berhenti
// mengikat fill-nya ke keadaan aktifnya, petir kembali terisi di SETIAP halaman: bentuk #106
// persis, cuma dari arah yang berbeda, dan tanpa satu pun gejala lain.
it('fills the brand bolt only while its slot is the active page', function () use ($stripComments) {
    $icon = $stripComments(file_get_contents(resource_path('js/Components/BrandBoltIcon.jsx')));
    $nav = $stripComments(file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx')));

    expect($icon)->toContain('filled = false');
    expect($nav)->toContain('iconActive={BrandBoltIconFilled}');
});

// Permintaan user 2026-09-06 yang menyusul: BUKAN cuma "Lapor" — kelima slot memadat saat aktif.
// Dua ikon harus diganti supaya itu mungkin (`IconHistory` & `IconMenu2` bentuknya GARIS TERBUKA,
// tak punya bagian dalam untuk diisi, dan @tabler tak menyediakan kembaran padatnya). Penjaga ini
// mengunci keduanya sekaligus: setiap slot bilah punya pasangan padatnya, dan kedua ikon yang
// mustahil memadat itu tidak diam-diam kembali. Tanpa ini, satu slot yang kehilangan `iconActive`
// akan berhenti memadat tanpa galat apa pun — persis jenis penyimpangan senyap yang melahirkan
// #94 dan #106.
it('gives every bottom-bar slot a filled twin for its active state', function () use ($stripComments) {
    $nav = $stripComments(file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx')));

    foreach ([
        'iconActive={IconDashboardFilled}',
        'iconActive={IconMapPinFilled}',
        'iconActive={BrandBoltIconFilled}',
        'iconActive={IconClockFilled}',
        'iconActive={IconLayoutGridFilled}',
    ] as $pair) {
        expect($nav)->toContain($pair);
    }

    // Keduanya mustahil memadat; kalau salah satu kembali, slotnya diam-diam berhenti seragam.
    expect($nav)
        ->not->toContain('IconHistory')
        ->not->toContain('IconMenu2');
});

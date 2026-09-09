<?php

// Keluhan user 2026-09-09: "versi mobile masih seperti versi desktop hanya dilayar kecil saja
// tidak seperti tampilan aplikasi native mobile". KEEMPAT dashboard (warga/relawan, admin/pejabat,
// petugas, OPD) dirombak lewat satu primitif bersama, `resources/js/Components/AppSection.jsx`.
//
// DUA bentuk sempat dipasang hari itu juga lalu DICABUT atas koreksi user, dan dua test pertama
// di bawah menjaga pencabutan itu - keduanya gampang "diperbaiki" kembali oleh sesi berikutnya
// yang mengira itu kelalaian, padahal itu keputusan.
//
// Sifat-sifat ini hidup HANYA di berkas JSX/CSS - komponen React tidak dirender Pest - jadi
// penjaganya membaca berkas sumbernya, pola yang sama dengan `MobileNavParityTest` &
// `MobileNavIconGlyphTest`.

$shell = 'js/Components/AppSection.jsx';

$dashboards = [
    'js/Pages/Dashboard.jsx',
    'js/Pages/Admin/Dashboard.jsx',
    'js/Pages/Petugas/Dashboard.jsx',
    'js/Pages/Opd/Dashboard.jsx',
];

// Komentar DIBUANG lebih dulu di kedua penjaga di bawah: berkas yang MENJELASKAN kedua larangan
// ini menyebut `-mx-4` dan "sticky" di dalam komentarnya sendiri, dan penjaga yang tersandung
// penjelasannya sendiri akan dimatikan orang berikutnya alih-alih dipatuhi (pelajaran #108).
$sourceOf = fn (string $path) => preg_replace(
    ['#/\*.*?\*/#s', '#//[^\n]*#'],
    '',
    file_get_contents(resource_path($path))
);

// PERMINTAAN USER 2026-09-09: "jangan ada tampilan yang full kanan kiri harus tetap ada margin
// atau padding". Daftar, peta taktis, dan baris statistik sempat dibuat menempel tepi layar lewat
// margin negatif seukuran padding halaman (`-mx-4`); semuanya dicabut. Margin negatif mendatar
// adalah SATU-SATUNYA cara bentuk itu bisa kembali, jadi di situlah penjaganya dipasang.
it('never lets the dashboard shell bleed to the screen edges', function () use ($shell, $dashboards, $sourceOf) {
    foreach (array_merge([$shell], $dashboards) as $path) {
        expect($sourceOf($path))->not->toMatch('/-m[xlr]-\d/');
    }
});

// PERMINTAAN USER 2026-09-09: "scrollnya menumpuk". Sapaan yang menyusut jadi baris ringkas
// `fixed` di bawah header, DITAMBAH judul seksi yang ikut lengket, membuat pita-pita bertumpuk di
// atas header `AppLayout` yang MEMANG SUDAH `sticky` - layar termakan dan gulir terasa berlapis.
// Satu pita lengket per layar sudah cukup, dan pita itu milik AppLayout.
it('never stacks another sticky bar under the app header', function () use ($shell, $dashboards, $sourceOf) {
    foreach (array_merge([$shell], $dashboards) as $path) {
        expect($sourceOf($path))
            ->not->toMatch('/\bsticky\b/')
            ->not->toMatch('/\bfixed\b/');
    }
});

// Keempat dashboard WAJIB lewat primitif yang sama. Bentuk lama - tiap layar membungkus
// daftarnya dengan chrome-nya sendiri - bukan kesalahan satu halaman melainkan kebiasaan yang
// terulang empat kali; begitu satu layar kembali menulis chrome-nya sendiri, layar itu menyimpang
// tanpa gejala dan keluhan yang sama akan lahir lagi hanya untuk sebagian peran.
it('renders every dashboard through the shared mobile shell', function () use ($dashboards) {
    foreach ($dashboards as $page) {
        // Catatan: `toContain()` di Pest bersifat VARIADIC - argumen kedua akan dibaca sebagai
        // needle tambahan, bukan pesan kegagalan. Jadi jangan menambahkan pesan di sini.
        //
        // `<AppGreeting` saja terlalu longgar - `<AppGreetingApaPun` ikut lolos. Batas kata di
        // belakangnya yang membuat penjaganya benar-benar menuntut komponen ITU.
        expect(file_get_contents(resource_path($page)))
            ->toContain("from '@/Components/AppSection'")
            ->toMatch('/<AppGreeting[\s>]/');
    }
});

// `no-scrollbar` dipakai di lima berkas tapi selama ini TIDAK PERNAH didefinisikan di mana pun -
// bukan utility Tailwind, bukan plugin (#120). Ia karena itu tidak melakukan apa-apa: tak ada
// galat, build hijau, kelasnya terbaca benar di DOM, hanya batang gulir yang tetap terlihat -
// keluarga yang sama dengan `fles-wrap` (#109).
it('actually defines the no-scrollbar utility it uses', function () {
    $css = file_get_contents(resource_path('css/app.css'));

    // Menuntut BLOK ATURANNYA, bukan sekadar nama kelasnya muncul di suatu tempat: nama yang
    // muncul di dalam komentar atau di dalam kelas lain (`.no-scrollbar-apa-pun`) akan meloloskan
    // penjaga yang cuma mencari substring, dan yang dijaga di sini justru keberadaan ATURANNYA -
    // itu yang selama ini tidak ada.
    expect($css)
        ->toMatch('/\.no-scrollbar\s*\{[^}]*scrollbar-width:\s*none/')
        ->toMatch('/\.no-scrollbar::-webkit-scrollbar\s*\{[^}]*display:\s*none/');
});

// Footer `AppLayout` adalah SATU-SATUNYA jalan ke halaman legal sejak seksi nav "Bantuan &
// Legal" dihapus 2026-08-28. Ia BOLEH diringkas di ponsel (dan memang diringkas 2026-09-09),
// tapi tidak boleh disembunyikan: kelima tautan itu akan lenyap dari perangkat yang paling
// banyak dipakai tanpa satu pun galat. Keputusan user 2026-09-09 saat disodori harganya.
it('keeps the legal footer links reachable on phones', function () {
    $layout = file_get_contents(resource_path('js/Layouts/AppLayout.jsx'));

    expect(preg_match('/<footer.*?<\/footer>/s', $layout, $footer))->toBe(1);

    foreach (['info.help', 'info.terms', 'info.privacy', 'info.about', 'info.pricing'] as $name) {
        expect($footer[0])->toContain("route('{$name}')");
    }

    // `hidden` TANPA awalan breakpoint = tersembunyi justru di ponsel. `md:hidden` (tersembunyi
    // di desktop saja) sengaja tidak ikut terjaring.
    expect($footer[0])->not->toMatch('/(?<![:\w-])hidden\b/');
});

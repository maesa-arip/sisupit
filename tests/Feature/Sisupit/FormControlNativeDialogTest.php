<?php

// FINDINGS #108 & #109 — dua cacat yang dilaporkan user 2026-09-02, keduanya hidup HANYA di
// berkas JSX sehingga tak ada satu pun test lama yang bisa melihatnya.
//
// #108: `<input type="time">` di form Berita Acara. Pemilih jam bawaan diserahkan ke dialog
// NATIVE milik WebView, dan di APK Android mengetuknya MENUTUP APLIKASI. Input itu adalah
// satu-satunya input tanggal/jam native di seluruh `resources/js/` — tanggal di sebelahnya, dan
// setiap tanggal lain di aplikasi ini, sudah lama memakai `Components/DatePicker.jsx` yang murni
// JavaScript. Jadi yang crash bukan "cara aplikasi memilih waktu", melainkan satu tempat yang
// menyimpang dari caranya sendiri.
//
// #109: `PaginationContent` dikelasi `fles-wrap` — Tailwind tak pernah memancarkan kelas itu,
// jadi `flex-wrap` TIDAK PERNAH berlaku dan daftar halaman melewati tepi kartu di ponsel. Salah
// ketik satu huruf, tanpa galat, tanpa peringatan build; ia tersalin ke TIGA berkas.
//
// Keduanya diuji dari BERKAS SUMBER karena di situlah sifatnya hidup — komponen React tidak
// dirender oleh Pest.
$jsxFiles = function () {
    $files = [];
    $dir = new RecursiveDirectoryIterator(resource_path('js'), FilesystemIterator::SKIP_DOTS);

    foreach (new RecursiveIteratorIterator($dir) as $file) {
        if (in_array($file->getExtension(), ['js', 'jsx'], true)) {
            $files[] = $file->getPathname();
        }
    }

    return $files;
};

// Pemilih tanggal/jam native membuka dialog milik WebView. Kalau salah satunya lahir kembali,
// APK Android bisa tertutup lagi saat pengguna mengetuknya — dan gejalanya cuma muncul di
// PERANGKAT, tak pernah di browser desktop tempat perubahan itu biasanya diperiksa.
it('never hands a date or time picker to the native WebView dialog', function () use ($jsxFiles) {
    $offenders = [];

    foreach ($jsxFiles() as $path) {
        // Komentar dibuang lebih dulu: berkas yang MENJELASKAN kenapa input native dilarang
        // (mis. TimePicker.jsx) menyebut bentuknya apa adanya, dan penjaga yang tersandung
        // penjelasannya sendiri akan dimatikan orang berikutnya alih-alih dipatuhi.
        $source = preg_replace(['#/\*.*?\*/#s', '#//[^\n]*#'], '', file_get_contents($path));

        if (preg_match('/type=(["\'])(?:time|date|datetime-local|month|week)\1/', $source)) {
            $offenders[] = str_replace(resource_path('js'), '', $path);
        }
    }

    expect($offenders)->toBe([]);
});

// Form Berita Acara adalah tempat cacat itu benar-benar terjadi; pastikan ia memakai pemilih
// milik aplikasi sendiri, bukan sekadar "tidak memakai input native".
it('picks the incident time with the app own picker, not a native input', function () {
    $source = file_get_contents(resource_path('js/Pages/Front/Reports/Resolution/Create.jsx'));

    expect($source)
        ->toContain("import TimePicker from '@/Components/TimePicker'")
        ->toContain('<TimePicker');
});

// Kelas yang salah ketik tidak pernah bergalat — ia hanya diam-diam tidak berlaku. Menuntut
// ejaan yang benar di SELURUH resources/js (bukan di dua berkas yang kebetulan diperbaiki)
// karena salah ketik ini menyebar lewat salin-tempel, dan salinan keempat akan lolos dari
// penjaga yang menyebut nama berkas.
it('spells flex-wrap correctly everywhere', function () use ($jsxFiles) {
    $offenders = [];

    foreach ($jsxFiles() as $path) {
        if (str_contains(file_get_contents($path), 'fles-wrap')) {
            $offenders[] = str_replace(resource_path('js'), '', $path);
        }
    }

    expect($offenders)->toBe([]);
});

// Daftar halaman WAJIB bisa membungkus: `/admin/users` memaginasi 10 per halaman, jadi 88 akun
// produksi menghasilkan sebelas tautan yang tak muat di satu baris ponsel. `PaginationItem` di
// ketiga berkas itu memang sudah ber-`mb-1 lg:mb-0` — jarak antar-BARIS yang hanya masuk akal
// bila barisnya memang lebih dari satu; itulah bukti bahwa membungkus memang niat aslinya.
it('lets every paginator wrap its page links', function () use ($jsxFiles) {
    $offenders = [];

    foreach ($jsxFiles() as $path) {
        preg_match_all('/<PaginationContent\s+className="([^"]*)"/', file_get_contents($path), $matches);

        foreach ($matches[1] as $classes) {
            if (! str_contains($classes, 'flex-wrap')) {
                $offenders[] = str_replace(resource_path('js'), '', $path);
            }
        }
    }

    expect($offenders)->toBe([]);
});

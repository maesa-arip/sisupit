<?php

/*
 * Permintaan user 2026-09-30: "masih ada tombol dengan warna hitam dan teks putih, ganti semua
 * tombol itu" -> merah brand (dipilih user dari tiga warna, PENGECUALIAN_ATURAN #4).
 *
 * Hitamnya datang dari DUA jalan dan keduanya dijaga di sini:
 *  (1) token `--primary` (hitam kebiruan) yang dibaca varian Button `default` & `orange`, checkbox,
 *      switch, radio, badge, kalender, dan pagination aktif - kini SAMA dengan `--destructive`
 *      (#E0241B) di mode terang & gelap. Diadu nilai-lawan-nilai dari app.css, bukan angka yang
 *      ditulis ulang di test (pelajaran #79).
 *  (2) tombol/chip yang menulis latar hitam SENDIRI (`bg-foreground text-background` dkk.) -
 *      token tak menjangkaunya, jadi satu salinan baru sudah cukup untuk menghidupkan keluhan ini.
 */

function cssTokens(string $block): array
{
    preg_match_all('~--([\w-]+):\s*([^;]+);~', $block, $m);

    return array_combine($m[1], array_map('trim', $m[2]));
}

it('paints the primary token in the brand red, in light and dark mode', function () {
    $css = file_get_contents(resource_path('css/app.css'));
    $css = preg_replace('~/\*.*?\*/~s', '', $css);

    preg_match('~:root\s*\{(.*?)\}~s', $css, $light);
    preg_match('~\.dark\s*\{(.*?)\}~s', $css, $dark);
    expect($light)->not->toBeEmpty()->and($dark)->not->toBeEmpty();

    foreach ([cssTokens($light[1]), cssTokens($dark[1])] as $tokens) {
        expect($tokens['primary'])->toBe($tokens['destructive'])
            ->and($tokens['primary-foreground'])->toBe($tokens['destructive-foreground']);
    }
});

it('leaves no button or chip painting itself black', function () {
    $black = '~\bbg-(foreground|black|neutral-(800|900|950)|gray-(800|900|950)|slate-(800|900|950)|zinc-(800|900|950))\b(?!/)~';
    $offenders = [];

    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js')));
    foreach ($files as $file) {
        $path = str_replace('\\', '/', $file->getPathname());
        if (! str_ends_with($path, '.jsx') || str_contains($path, 'Pages/Front/Settings') || str_contains($path, 'Pages/Guideline.jsx')) {
            continue;
        }
        $src = preg_replace('~/\*.*?\*/~s', '', file_get_contents($path));
        foreach (preg_split('~\R~', $src) as $i => $line) {
            // Latar hitam PLUS teks putih = bentuk tombol/chip yang dikeluhkan. Overlay (`bg-black/80`),
            // panel dekoratif, dan lencana bukan sasaran - lencana/avatar tak berteks text-background.
            if (preg_match($black, $line) && preg_match('~\btext-(background|white|primary-foreground)\b~', $line)
                && ! str_contains($line, 'rounded-full border border-card')) {
                $offenders[] = basename($path).':'.($i + 1);
            }
        }
    }

    expect($offenders)->toBe([]);
});

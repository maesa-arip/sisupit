<?php

/**
 * #187: di APK, keyboard layar menyusutkan WebView ke ruang di atasnya, dan header + bar Kirim form
 * lapor + bilah bawah ikut naik - kolom Patokan Lokasi jatuh di belakang keduanya. Aturannya: bilah
 * bawah disembunyikan selama mengetik, bar Kirim turun menempel di atas keyboard, kolom terfokus
 * ditengahkan. Penjaganya hidup di JS/JSX, jadi test ini membaca berkasnya (komentar dibuang lebih dulu).
 */
function keyboardSource(string $path): string
{
    $src = file_get_contents(resource_path('js/'.$path));

    return preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m'], '', $src);
}

it('marks <html data-keyboard="open"> from the visible viewport and centers the focused field', function () {
    $src = keyboardSource('lib/keyboard-open.js');

    expect($src)->toContain('window.visualViewport')
        ->and($src)->toContain("root.dataset.keyboard = 'open'")
        ->and($src)->toContain("'--keyboard-inset'")
        ->and($src)->toContain("window.addEventListener('resize', schedule)")
        ->and($src)->toContain("scrollIntoView({ block: 'center'");
});

it('installs the keyboard flag in AppLayout', function () {
    expect(keyboardSource('Layouts/AppLayout.jsx'))->toMatch('/^\s*useKeyboardOpenFlag\(\);/m');
});

it('hides the bottom nav while the keyboard is open', function () {
    expect(keyboardSource('Layouts/Partials/MobileBottomNav.jsx'))
        ->toMatch('/className="material-chrome fixed bottom-0[^"]*\[html\[data-keyboard=open\]_&\]:hidden/');
});

it('drops the report submit bar onto the keyboard', function () {
    expect(keyboardSource('Pages/Front/Reports/Create.jsx'))
        ->toMatch('/bottom-\[calc\(4rem\+env\(safe-area-inset-bottom\)\)\][^"]*\[html\[data-keyboard=open\]_&\]:bottom-\[var\(--keyboard-inset,0px\)\]/')
        ->toContain('enterKeyHint="search"');
});

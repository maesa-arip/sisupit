<?php

/**
 * #186: kolom isian bebas (patokan lokasi, judul, keterangan, nama OPD, kata kunci cari...) dulu
 * memunculkan riwayat ketikan browser/WebView tiap diketuk. Bawaan ui/input & ui/textarea kini
 * autoComplete="off"; kolom data milik pengguna sendiri menulis autoComplete-nya sendiri supaya
 * isi-otomatis (email, sandi, HP) tetap jalan. Penjaganya hidup di JSX, jadi test ini membaca
 * berkasnya (komentar dibuang lebih dulu).
 */
function jsxSource(string $path): string
{
    $src = file_get_contents(resource_path('js/'.$path));

    return preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m'], '', $src);
}

it('defaults autoComplete to off on ui/input and ui/textarea', function (string $path) {
    $src = jsxSource($path);

    expect($src)->toMatch("/autoComplete = 'off'/")
        ->and($src)->toMatch('/autoComplete=\{autoComplete\}/');
})->with(['Components/ui/input.jsx', 'Components/ui/textarea.jsx']);

it('passes the default before the spread so a caller can still override it', function (string $path) {
    $src = jsxSource($path);

    expect(strpos($src, 'autoComplete={autoComplete}'))->toBeLessThan(strpos($src, '{...props}'));
})->with(['Components/ui/input.jsx', 'Components/ui/textarea.jsx']);

it('keeps autofill on the fields that hold the user own data', function (string $path, string $value) {
    expect(jsxSource($path))->toContain('autoComplete="'.$value.'"');
})->with([
    ['Pages/Auth/Login.jsx', 'username'],
    ['Pages/Auth/Login.jsx', 'current-password'],
    ['Pages/Auth/Register.jsx', 'new-password'],
    ['Pages/Auth/ForgotPassword.jsx', 'username'],
    ['Pages/Auth/ConfirmPassword.jsx', 'current-password'],
    ['Pages/Profile/CompleteProfile.jsx', 'tel'],
    ['Pages/Profile/Partials/UpdateProfileInformationForm.jsx', 'tel'],
]);

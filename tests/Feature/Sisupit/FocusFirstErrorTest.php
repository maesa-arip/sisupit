<?php

// Validasi server gagal -> fokus & gulir ke isian teratas yang bermasalah, di SEMUA form
// (keluhan user 2026-10-03: pesan "wajib diisi" di bagian atas tak terlihat, pengguna
// mengira form tidak bekerja). Dipasang sekali di app.jsx, bukan per halaman.

$stripComments = fn (string $source) => preg_replace(['#/\*.*?\*/#s', '#//[^\n]*#'], '', $source);

it('focuses the first invalid field after any failed form submit', function () use ($stripComments) {
    $app = $stripComments(file_get_contents(resource_path('js/app.jsx')));

    expect($app)->toMatch("/router\.on\(\s*'error'[^\n]*focusFirstError/");
});

it('marks InputError so the global handler can find it in DOM order', function () use ($stripComments) {
    $inputError = $stripComments(file_get_contents(resource_path('js/Components/InputError.jsx')));
    $helper = $stripComments(file_get_contents(resource_path('js/lib/focus-first-error.js')));

    expect($inputError)->toContain('data-input-error');
    expect($helper)->toContain("querySelectorAll('[data-input-error]')");
    expect($helper)->toContain('.focus(');
    expect($helper)->toContain('scrollIntoView(');
});

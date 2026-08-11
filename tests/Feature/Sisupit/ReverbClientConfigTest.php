<?php

// FINDINGS #58 — konfigurasi Reverb untuk browser dulu ditanam ke bundel saat `npm run build`
// lewat import.meta.env.VITE_REVERB_*. Sekali build dijalankan tanpa env itu (mis. dari git
// worktree yang tak punya .env), window.Echo tak pernah dibuat dan seluruh fitur realtime mati
// TANPA gejala. Sekarang nilainya di-inject runtime oleh server; test ini menjaga agar
// injeksinya tetap ada, benar isinya, dan TIDAK pernah membocorkan app secret.
beforeEach(function () {
    config([
        'services.reverb.key' => 'kunci-publik-uji',
        'services.reverb.host' => 'staging.sisupit.test',
        'services.reverb.port' => 443,
        'services.reverb.scheme' => 'https',
        'broadcasting.connections.reverb.secret' => 'RAHASIA-JANGAN-BOCOR',
    ]);
});

it('injects the reverb browser config into every page', function () {
    $html = $this->get('/')->assertOk()->getContent();

    expect($html)->toContain('window.REVERB_CONFIG')
        ->and($html)->toContain('kunci-publik-uji')
        ->and($html)->toContain('staging.sisupit.test');
});

// App secret dipakai untuk menandatangani otorisasi channel — kalau bocor ke browser,
// siapa pun bisa memalsukan langganan channel privat siapa pun.
it('never leaks the reverb app secret to the browser', function () {
    $html = $this->get('/')->assertOk()->getContent();

    expect($html)->not->toContain('RAHASIA-JANGAN-BOCOR');
});

// Host mengikuti env server, bukan nilai yang dipaku saat build — inilah yang membuat
// staging/dev berhenti menyambung ke Reverb produksi.
it('follows the server env so each environment points at its own reverb', function () {
    config(['services.reverb.host' => 'dev.sisupit.test']);

    expect($this->get('/')->assertOk()->getContent())
        ->toContain('dev.sisupit.test')
        ->not->toContain('staging.sisupit.test');
});

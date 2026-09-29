<?php

/*
 * TASK_65 (permintaan user 2026-09-29): "kasi pilihan telp biasa atau WhatsApp saat akan
 * konfirmasi laporan". Panel verifikasi admin dulu hanya punya satu tautan tel: di tengah
 * kalimat. Kini dua tombol - Telepon & WhatsApp. Yang dikunci: kedua tombol hidup DI panel
 * verifikasi (bukan di tempat lain), dan nomor WhatsApp dinormalkan 08xx -> 628xx; wa.me
 * dengan nomor berawalan 0 membuka obrolan ke nomor yang tak ada, tanpa galat.
 */

function showJsxWithoutComments(): string
{
    $jsx = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));

    return preg_replace(['~\{/\*.*?\*/\}~s', '~/\*.*?\*/~s', '~^\s*//.*$~m'], '', $jsx);
}

it('offers both a phone call and a WhatsApp chat inside the verification panel', function () {
    $jsx = showJsxWithoutComments();

    $start = strpos($jsx, "reportStatus === 'TERLAPOR' && canVerify");
    expect($start)->not->toBeFalse();
    $panel = substr($jsx, $start, 4000);

    expect($panel)->toMatch('~href=\{`tel:\$\{reporterPhone\.tel\}`\}~');
    expect($panel)->toMatch('~href=\{reporterPhone\.whatsapp\}~');
    expect($panel)->toMatch('~IconBrandWhatsapp~');
});

it('normalises the reporter number to the international form wa.me expects', function () {
    $jsx = showJsxWithoutComments();

    expect($jsx)->toMatch("~digits\.startsWith\('0'\) \? '62' \+ digits\.slice\(1\)~");
    expect($jsx)->toMatch('~https://wa\.me/\$\{wa\}~');
});

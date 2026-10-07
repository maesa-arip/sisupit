<?php

/**
 * #193 - animasi ikon bilah bawah (garis -> terisi merah) "tidak smooth cenderung patah" (user
 * 2026-10-07). Dua sebab, keduanya terukur Playwright dengan CPU 4x lebih lambat:
 *  1. `animationDelay` dihitung ulang tiap render lewat prop `style`; bilah dirender berkali-kali
 *     selama pindah halaman, dan tiap penggantian jeda membuat animasi yang SEDANG berjalan
 *     melompat maju (isi tampil pertama kali di ~40%).
 *  2. Isi memakai clip-path dan lingkaran Lapor memakai transisi background-color - keduanya
 *     dihitung main thread, jadi membeku saat halaman tujuan dirender lalu melompat. Pembanding
 *     main thread diblokir 400 ms: height diam ~435 ms, clip-path diam ~110 ms, transform 0 ms.
 *
 * ATURAN yang dijaga: animasi ketuk bilah bawah hanya transform/opacity, dan jedanya ditulis lewat
 * useTapClock (variabel CSS, sekali per ketukan), bukan prop style per render.
 */
function bottomNavSource(): string
{
    return file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx'));
}

it('animates the tap fill with compositor-only properties', function () {
    $tailwind = file_get_contents(base_path('tailwind.config.js'));

    preg_match_all("~'(slot-[a-z-]+|lapor-[a-z-]+)':\s*\{(.*?)\n\t\t\t\t\},~s", $tailwind, $m, PREG_SET_ORDER);
    expect($m)->not->toBeEmpty();

    foreach ($m as [, $name, $body]) {
        preg_match_all('~\b([a-zA-Z]+):\s*\'~', $body, $props);
        expect(array_diff(array_unique($props[1]), ['transform', 'opacity']))
            ->toBe([], "keyframe {$name} menganimasikan properti main thread");
    }

    // Lingkaran Lapor tak lagi bertransisi warna latar (terpotong saat bilah dipasang ulang).
    expect(bottomNavSource())->not->toContain('transition-[background-color,color,box-shadow]');
});

it('sets the tap animation delay once per tap, not on every render', function () {
    $src = bottomNavSource();

    expect($src)->not->toContain('animationDelay')
        ->and($src)->toContain("const TAP_DELAY = '[animation-delay:var(--tap-delay,0ms)]';")
        ->and($src)->toContain('function useTapClock(clock, running)')
        ->and($src)->toContain('useTapClock(slotTap, filling)')
        ->and($src)->toContain('useTapClock(laporTap, Boolean(pop))');
});

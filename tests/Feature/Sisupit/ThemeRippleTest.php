<?php

/**
 * Pergantian tema gelap/terang = ripple dari ikon (permintaan user 2026-10-28: "tidak smooth ...
 * terangnya atau gelapnya menjalar dari ikon"). Dulu kelas `dark` ditukar langsung: elemen
 * ber-`transition-colors` memudar sendiri-sendiri, sisanya patah - halaman belang.
 */
it('switches theme with a circular view-transition ripple from the toggle icon', function () {
    $switcher = file_get_contents(resource_path('js/Components/ThemeSwitcher.jsx'));
    $css = file_get_contents(resource_path('css/app.css'));

    expect($switcher)->toContain('document.startViewTransition(apply)')
        ->and($switcher)->toContain("pseudoElement: '::view-transition-new(root)'")
        ->and($switcher)->toContain('circle(0px at ${x}px ${y}px)')
        ->and($switcher)->toContain('event.currentTarget.getBoundingClientRect()')
        // Kurangi gerakan & browser tanpa View Transitions: instan, tanpa ripple.
        ->and($switcher)->toContain("matchMedia('(prefers-reduced-motion: reduce)')")
        ->and($switcher)->toContain('!document.startViewTransition || reduceMotion')
        // Arah toggle dibaca dari tampilan sungguhan, bukan state 'system'.
        ->and($switcher)->toContain("root.classList.contains('dark') ? 'light' : 'dark'")
        ->and($switcher)->toMatch("/\(theme === 'system' &&\s+typeof window !== 'undefined' &&\s+window\.matchMedia\('\(prefers-color-scheme: dark\)'\)\.matches\)/")
        ->and($switcher)->toContain("root.classList.add('theme-switching')");

    // Cross-fade bawaan dimatikan & transition dibekukan selama pergantian (tanpa !important).
    expect($css)->toMatch('/::view-transition-old\(root\),\s*::view-transition-new\(root\) \{\s*animation: none;/')
        ->and($css)->toMatch('/html\.theme-switching \*,\s*html\.theme-switching \*::before,\s*html\.theme-switching \*::after \{\s*transition: none;\s*\}/');
});

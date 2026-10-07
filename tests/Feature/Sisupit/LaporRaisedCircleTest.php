<?php

/**
 * Lingkaran Lapor di bilah bawah MENONJOL melewati tepi atas bilah (permintaan user 2026-10-07:
 * "lewat sedikit dari batas tapi tidak boleh menyentuh tombol kirim laporan darurat pada form lapor").
 *
 * Tonjolan = `-mt-N` lingkaran + tebal cincin. Bar Kirim di /reports/create menempel di atas bilah,
 * jadi ruang di bawah tombolnya (`py-N`) WAJIB lebih besar dari tonjolan itu - kalau tidak lingkaran
 * menyentuh tombol tanpa galat apa pun. Ruang konten AppLayout & popover bilah ikut terikat.
 */
it('keeps the raised Lapor circle clear of the report send button, page footer and nav popovers', function () {
    $nav = file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx'));
    $create = file_get_contents(resource_path('js/Pages/Front/Reports/Create.jsx'));
    $layout = file_get_contents(resource_path('js/Layouts/AppLayout.jsx'));

    expect($nav)->toMatch('/<span className="relative -mt-(\d+) flex h-(\d+) w-\2 shrink-0/')
        ->and($nav)->toContain('rounded-full ring-[3px] ring-background');
    preg_match('/<span className="relative -mt-(\d+) flex h-(\d+) w-\2 shrink-0/', $nav, $mt);
    $size = (int) $mt[2] * 4;
    $raise = (int) $mt[1] * 4 + 3; // px di atas tepi bilah, cincin termasuk

    // Tinggi bilah dibaca dari kelasnya (`h-14` = 56px) - semua angka di bawah turunan darinya.
    preg_match('/<div className="mx-auto grid h-(\d+) max-w-md grid-cols-5 px-1">/', $nav, $bar);
    expect($bar)->not->toBeEmpty();
    $barPx = (int) $bar[1] * 4;

    // Lingkaran memang melewati batas, tapi "sedikit" (user: "turunkan lagi") - dan lingkaran +
    // label harus sebaris dengan empat tetangganya: isi slot 20px ikon + 16px label ditengahkan di
    // bilah -> baris label mulai di (bilah - 36) / 2 + 20, jadi bawah lingkaran + mt label = itu.
    expect($raise)->toBeGreaterThan(3)->toBeLessThanOrEqual(15);
    expect($nav)->toMatch("/'mt-(0\.5|\d+) max-w-full truncate text-\[11px\] leading-4[^']*',[\s\S]{0,200}?>\s*Lapor\s*<\/span>/");
    preg_match("/'mt-(0\.5|\d+) max-w-full truncate text-\[11px\] leading-4/", $nav, $labelMt);
    expect($size - (int) $mt[1] * 4 + (float) $labelMt[1] * 4)->toEqual(($barPx - 36) / 2 + 20);
    expect($nav)->toContain('<span className="flex h-5 items-center justify-center">')
        ->and($nav)->not->toMatch("/'group relative flex h-full w-full flex-col items-center justify-center gap-/");

    // Bilah 56px: ruang di atas ikon & di bawah label tidak lagi membengkak setelah jarak ikon-label
    // dirapatkan (user: "sesuaikan jarak antara bawah label dan jarak diatas icon").
    expect($barPx)->toBeLessThanOrEqual(56);

    // Bar Kirim menempel tepat di atas bilah, dan padding atas-bawah tombolnya SIMETRIS (user: "tidak
    // balance antara atas bawah tombol kirim"); ruang di bawah tombol minus tonjolan = celah >= 4px.
    preg_match('/bottom-\[calc\(([\d.]+)rem\+env\(safe-area-inset-bottom\)\)\] z-40 border-t border-border bg-card px-4 py-(\d+) sm:hidden/', $create, $send);
    expect($send)->not->toBeEmpty()
        ->and((float) $send[1] * 16)->toEqual($barPx)
        ->and((int) $send[2] * 4 - $raise)->toBeGreaterThanOrEqual(4);

    // Ruang konten (bilah + tonjolan + napas) dan popover yang melintang di atas slot tengah.
    preg_match('/pb-\[calc\((\d+)rem\+env\(safe-area-inset-bottom\)\)\] md:pb-0/', $layout, $rem);
    expect($rem)->not->toBeEmpty()
        ->and((int) $rem[1] * 16)->toBeGreaterThanOrEqual($barPx + $raise + 8);

    preg_match('/absolute bottom-\[(\d+)px\] z-50/', $nav, $panel);
    expect($panel)->not->toBeEmpty()
        ->and((int) $panel[1])->toBeGreaterThanOrEqual($barPx + $raise + 4);
});

// Video referensi (mobile/aset/Referensi MobileBottomNav.mp4): ikon slot yang diketuk "terisi" dari
// bawah ke atas sambil memantul kecil; slot yang ditinggalkan langsung abu. Bilah dipasang ulang tiap
// pindah halaman, jadi animasinya HARUS dilanjutkan lewat waktu ketukan tingkat modul + delay negatif.
it('fills the tapped bottom-nav icon from the bottom up and carries the animation across pages', function () {
    $nav = file_get_contents(resource_path('js/Layouts/Partials/MobileBottomNav.jsx'));
    $tailwind = file_get_contents(base_path('tailwind.config.js'));

    expect($nav)->toContain("let slotTap = { label: null, at: 0 };")
        ->toContain('onClick={() => markSlotTap(label)}')
        ->toContain("markSlotTap('Fasilitas');")
        ->toContain("markSlotTap('Menu');")
        ->toContain('animate-slot-fill motion-reduce:animate-none')
        ->toContain('animate-slot-pop motion-reduce:animate-none')
        ->toContain('animate-slot-outline motion-reduce:animate-none')
        ->toContain('`${-elapsed}ms`');

    preg_match('/const SLOT_FILL_MS = (\d+);/', $nav, $ms);
    expect($ms)->not->toBeEmpty()
        ->and($tailwind)->toContain("'slot-fill': 'slot-fill {$ms[1]}ms")
        ->and($tailwind)->toContain("'slot-pop': 'slot-pop {$ms[1]}ms")
        ->and($tailwind)->toContain("'slot-outline': 'slot-outline {$ms[1]}ms")
        ->and($tailwind)->toContain("clipPath: 'inset(100% 0 0 0)'");
});

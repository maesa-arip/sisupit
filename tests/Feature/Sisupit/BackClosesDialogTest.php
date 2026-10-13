<?php

/**
 * #205 - tombol Kembali APK (`goBack()`), geser-kembali iOS, dan Kembali browser dulu
 * MENINGGALKAN halaman saat dialog terbuka (lanjutan #192 yang hanya untuk peta layar penuh).
 * Kini setiap Content Radix (Dialog, AlertDialog, Sheet) merender <DismissOnBack /> yang
 * mendorong satu entri history selama terbuka; Kembali = Escape untuk lapisan teratas.
 *
 * ATURAN yang dijaga:
 *  - keempat komponen dasar dialog memasangnya - satu tempat, semua halaman ikut;
 *  - dialog yang ditutup lewat UI mencabut entrinya (`history.back()`) dan entri di bawahnya
 *    diisi ulang dengan state terbaru (simpan dari dialog = replaceState pada entri lapisan;
 *    tanpa pengisian ulang, Kembali/Maju nanti menampilkan data sebelum simpan).
 */
it('mounts the back-button dismissal inside every dialog primitive', function () {
    foreach (['ui/dialog.jsx', 'ui/alert-dialog.jsx', 'ui/sheet.jsx'] as $file) {
        $src = file_get_contents(resource_path("js/Components/{$file}"));

        expect($src)->toContain("import { DismissOnBack } from '@/lib/back-closes-layer';")
            ->and($src)->toContain('<DismissOnBack />');
    }

    expect(file_get_contents(resource_path('js/Components/Modal.jsx')))
        ->toContain('useBackClosesLayer(show, close);');
});

it('unwinds the layer entry and refreshes the entry beneath it', function () {
    $lib = file_get_contents(resource_path('js/lib/back-closes-layer.js'));

    expect($lib)->toContain('export function DismissOnBack()')
        ->and($lib)->toContain("new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })")
        ->and($lib)->toContain('unwinding = { count: 1, state: window.history.state };')
        ->and($lib)->toContain("window.history.replaceState(unwinding.state, '', window.location.href);")
        // Pindah halaman selagi dialog terbuka: entri terkubur dibuang dari tumpukan.
        ->and($lib)->toContain("router.on('navigate'");
});

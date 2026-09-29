<?php

/**
 * #145: pop-up di ponsel dulu menempel tepi kanan-kiri layar dengan sudut siku - DialogContent &
 * AlertDialogContent ber-`w-full` dan baru membulat mulai `sm:`. Permintaan user: "untuk semua pop up
 * di mobile jangan ada yang full kanan kiri, harus tetap ada space sehingga tetap ada roundednya".
 * Aturannya kini di kedua primitif, jadi pemanggil tak perlu (dan tak boleh) menambalnya sendiri.
 * Komentar dibuang lebih dulu supaya penjelasan di berkas tak ikut dihitung sebagai kode.
 */
function dialogSource(string $relative): string
{
    $src = file_get_contents(resource_path('js/'.$relative));

    return preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m', '#\{/\*.*?\*/\}#s'], '', $src);
}

it('keeps a side gap and rounded corners on both dialog primitives at every screen size', function (string $file, string $component) {
    $src = dialogSource($file);

    expect(preg_match('/const '.$component.' = .*?className=\{cn\(\s*\'([^\']*)\'/s', $src, $m))->toBe(1);
    $classes = preg_split('/\s+/', $m[1]);

    expect($classes)->toContain('w-[calc(100%-2rem)]')
        ->and($classes)->toContain('rounded-xl')
        ->and($classes)->not->toContain('w-full')
        ->and($classes)->not->toContain('sm:rounded-lg');
})->with([
    ['Components/ui/dialog.jsx', 'DialogContent'],
    ['Components/ui/alert-dialog.jsx', 'AlertDialogContent'],
]);

it('never lets a page stretch a dialog edge to edge or square its corners on mobile', function () {
    $offenders = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js')));

    foreach ($files as $file) {
        if ($file->getExtension() !== 'jsx' || str_contains($file->getPathname(), 'Components'.DIRECTORY_SEPARATOR.'ui')) {
            continue;
        }
        preg_match_all('/<(?:Alert)?DialogContent\b[^>]*?className="([^"]*)"/s', dialogSource(substr($file->getPathname(), strlen(resource_path('js/')))), $all);
        foreach ($all[1] as $classes) {
            foreach (preg_split('/\s+/', $classes) as $class) {
                if (in_array($class, ['w-full', 'w-screen', 'w-[100vw]', 'rounded-none', 'max-w-none'], true)) {
                    $offenders[] = $file->getFilename().': '.$class;
                }
            }
        }
    }

    expect($offenders)->toBe([]);
});

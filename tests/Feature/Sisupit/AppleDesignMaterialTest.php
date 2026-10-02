<?php

/**
 * TASK_69 bagian 2 (apple-design), KHUSUS branch feat/mobile-native-polish atas permintaan user
 * 2026-10-01 - PENGECUALIAN_ATURAN #5. Menjaga material tembus pandang, pegas, asal gerak dari
 * pemicu, reduced motion = cross-fade, dan tracking per ukuran. Bentuk kegagalan yang dijaga
 * semuanya senyap: utilitas `bg-*` di elemen yang sama diam-diam membuat material padat, dan
 * menolkan geser pada dialog yang dipusatkan lewat translate membuatnya melompat. Komentar
 * dibuang lebih dulu (pelajaran #108).
 */
function appleSource(string $path): string
{
    $src = file_get_contents(base_path($path));

    return preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m', '#\{/\*.*?\*/\}#s', '#\{\{--.*?--\}\}#s'], '', $src);
}

function appleClassesAround(string $path, string $needle): array
{
    $src = appleSource($path);
    $pos = strpos($src, $needle);
    expect($pos)->not->toBeFalse();
    expect(preg_match('/[\'"]([^\'"]*'.preg_quote($needle, '/').'[^\'"]*)[\'"]/', $src, $m))->toBe(1);

    return preg_split('/\s+/', trim($m[1]));
}

it('defines both materials with a blur and a solid fallback for reduced transparency and high contrast', function () {
    $css = appleSource('resources/css/app.css');

    // Opasitas minimum (koreksi user 2026-10-01): menu di bawah ini membuat data di belakangnya tembus.
    expect(preg_match('/\.material-thick\s*\{[^}]*hsl\(var\(--popover\) \/ (0\.\d+)\)/', $css, $thick))->toBe(1)
        ->and((float) $thick[1])->toBeGreaterThanOrEqual(0.95);
    expect(preg_match('/\.material-chrome\s*\{[^}]*hsl\(var\(--background\) \/ (0\.\d+)\)/', $css, $chrome))->toBe(1)
        ->and((float) $chrome[1])->toBeGreaterThanOrEqual(0.85);
    expect($css)->toMatch('/\.material-chrome\s*\{[^}]*backdrop-filter:\s*blur\(/')
        ->and($css)->toMatch('/\.material-thick\s*\{[^}]*backdrop-filter:\s*blur\(/')
        ->and($css)->toMatch('/@media \(prefers-reduced-transparency: reduce\), \(prefers-contrast: more\)\s*\{[^@]*backdrop-filter:\s*none/')
        ->and($css)->toMatch('/@supports not \(\(backdrop-filter/');
});

it('builds the header and the bottom bar from the chrome material, never a solid background', function (string $path, string $needle) {
    $classes = appleClassesAround($path, $needle);

    expect($classes)->toContain('material-chrome')
        ->and(preg_grep('/^bg-/', $classes))->toBe([]);
})->with([
    ['resources/js/Layouts/AppLayout.jsx', 'sticky top-0 z-40'],
    ['resources/js/Layouts/Partials/MobileBottomNav.jsx', 'fixed bottom-0 left-0 z-50'],
]);

it('grows every floating surface from its trigger out of the thick material', function (string $path, string $needle, string $origin) {
    $classes = appleClassesAround($path, $needle);

    expect($classes)->toContain('material-thick')
        ->and($classes)->toContain($origin)
        ->and(preg_grep('/^bg-/', $classes))->toBe([]);
})->with([
    ['resources/js/Components/ui/popover.jsx', 'w-72 origin-', 'origin-[--radix-popover-content-transform-origin]'],
    ['resources/js/Components/ui/dropdown-menu.jsx', 'min-w-[8rem] origin-', 'origin-[--radix-dropdown-menu-content-transform-origin]'],
    ['resources/js/Components/ui/select.jsx', 'max-h-96 min-w-[8rem]', 'origin-[--radix-select-content-transform-origin]'],
    ['resources/js/Layouts/Partials/MobileBottomNav.jsx', 'absolute bottom-[72px]', 'origin-bottom'],
]);

it('keeps the solid command surface out of the material popovers that host it', function () {
    expect(appleClassesAround('resources/js/Components/ui/command.jsx', 'flex h-full w-full flex-col'))
        ->toContain('bg-transparent')->not->toContain('bg-popover');
});

it('turns reduced motion into a cross-fade without un-centering translated dialogs', function () {
    $css = appleSource('resources/css/app.css');

    expect(preg_match('/@media \(prefers-reduced-motion: reduce\)\s*\{(.*)\n\}/s', $css, $m))->toBe(1);
    expect($m[1])->toMatch('/--tw-enter-scale:\s*1/')
        ->and($m[1])->toMatch('/\.animate-in:not\(\.translate-x-\\\\\[-50\\\\%\\\\\], \.-translate-x-1\\\\\/2\)[^{]*\{[^}]*--tw-enter-translate-x:\s*0/');

    foreach (['DialogContent' => 'resources/js/Components/ui/dialog.jsx', 'AlertDialogContent' => 'resources/js/Components/ui/alert-dialog.jsx'] as $const => $path) {
        $classes = appleClassesAround($path, 'translate-x-[-50%]');
        expect($classes)->toContain('data-[state=open]:slide-in-from-left-1/2')
            ->and($classes)->toContain('data-[state=open]:slide-in-from-top-1/2')
            ->and($classes)->toContain('ease-spring')
            ->and($classes)->not->toContain('data-[state=open]:slide-in-from-top-[48%]');
    }
});

it('gives the bottom bar slots press feedback and defines the spring curve', function () {
    $slot = appleClassesAround('resources/js/Layouts/Partials/MobileBottomNav.jsx', 'group relative flex h-full w-full');
    expect($slot)->toContain('active:scale-[0.92]')->and($slot)->toContain('motion-reduce:active:scale-100');

    expect(appleSource('tailwind.config.js'))->toMatch("/transitionTimingFunction:\s*\{\s*spring:\s*'cubic-bezier\(0\.32, 0\.72, 0, 1\)'/");
});

it('matches the browser status bar to the header in each colour scheme', function () {
    $blade = appleSource('resources/views/app.blade.php');

    expect(preg_match_all('/<meta name="theme-color" media="\(prefers-color-scheme: (light|dark)\)"/', $blade))->toBe(2)
        ->and($blade)->not->toMatch('/<meta name="theme-color" content=/');
});

it('tightens large headings and leaves body text untracked', function () {
    $css = appleSource('resources/css/app.css');

    expect($css)->toMatch('/\bh1\s*\{\s*letter-spacing:\s*-0\.0\d+em/')
        ->and($css)->not->toMatch('/\bbody\s*\{[^}]*letter-spacing/');
});

it('keeps user management on the grouped form and off the old gradient button variants', function () {
    $pages = ['Index', 'Create', 'Edit'];

    foreach ($pages as $page) {
        $src = appleSource("resources/js/Pages/Admin/Users/{$page}.jsx");
        expect($src)->not->toMatch('/variant="(green|blue|red|orange|purple)"/')
            ->and($src)->not->toMatch('/>\s*(Save|Reset|Cancel|Continue)\s*</');
    }

    foreach (['Create', 'Edit'] as $page) {
        expect(appleSource("resources/js/Pages/Admin/Users/{$page}.jsx"))
            ->toContain("from '@/Components/GroupedForm'")
            ->toContain('<FormSection')
            ->toContain('<SegmentedControl');
    }

    expect(appleSource('resources/js/Pages/Admin/Users/Index.jsx'))->toContain('roleLabel([role])');
});

it('keeps every admin page free of the old English and misspelled template text', function () {
    $offenders = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js/Pages/Admin')));
    foreach ($files as $file) {
        if ($file->getExtension() !== 'jsx') {
            continue;
        }
        $src = appleSource(substr($file->getPathname(), strlen(base_path()) + 1));
        if (preg_match('/Menamplikan|placeholder="Search"|benar benar yakin|>\s*(Cancel|Continue|Save|Reset)\s*<|placeholder="Masukan |data anda/', $src, $m)) {
            $offenders[] = $file->getFilename().': '.trim($m[0]);
        }
    }

    expect($offenders)->toBe([]);
});

it('paints the coloured button variants as tinted fills, while emergency calls stay solid red', function () {
    $button = appleSource('resources/js/Components/ui/button.jsx');
    expect($button)->not->toContain('bg-gradient')
        ->and($button)->toMatch("/red: 'bg-destructive\/10 text-destructive/")
        ->and($button)->toMatch("/blue: 'bg-info\/10 text-info/")
        ->and($button)->toMatch("/green: 'bg-success\/10 text-success/")
        ->and($button)->toMatch("/destructive: 'bg-destructive text-destructive-foreground/");

    $forum = appleSource('resources/js/Pages/Forum/Partials/ForumParts.jsx');
    expect(preg_match_all('/<Button variant="destructive"[^>]*>\s*<Link href=\{route\(\'front\.reports\.create\'\)\}>/', $forum))->toBe(2)
        ->and($forum)->not->toContain('variant="red"');
});

it('reworks the hydrant, SKKL and fire-station screens like user management', function () {
    foreach (['Hydrants', 'Pumps', 'FireStations'] as $module) {
        $index = appleSource("resources/js/Pages/Admin/{$module}/Index.jsx");
        expect($index)->toContain('<AlertDialog open=')
            ->and($index)->not->toContain('z-[9999]')
            ->and($index)->toContain('divide-y divide-border/70 overflow-hidden rounded-2xl')
            ->and($index)->toContain('type="search"');

        foreach (['Create', 'Edit'] as $page) {
            $form = appleSource("resources/js/Pages/Admin/{$module}/{$page}.jsx");
            expect($form)->toContain('Detail fasilitas')
                ->and($form)->not->toContain('<CardContent className="p-6">')
                ->and($form)->not->toMatch('/bg-teal-600|ring-teal-500/')
                ->and($form)->toContain('className="h-11 rounded-xl px-6"');
        }
    }
});

it('keeps every page on the larger apple radii instead of the old rounded-md', function () {
    $offenders = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js/Pages')));
    foreach ($files as $file) {
        $path = str_replace(DIRECTORY_SEPARATOR, '/', $file->getPathname());
        if ($file->getExtension() !== 'jsx' || str_contains($path, 'Pages/Front/Settings') || str_ends_with($path, 'Pages/Guideline.jsx')) {
            continue;
        }
        if (preg_match('/\brounded-md\b/', appleSource(substr($file->getPathname(), strlen(base_path()) + 1)))) {
            $offenders[] = basename($path);
        }
    }

    expect($offenders)->toBe([]);
});

it('lays out the report form as grouped sections and the incident page with an iOS navigation bar', function () {
    $create = appleSource('resources/js/Pages/Front/Reports/Create.jsx');
    foreach (['Lokasi kejadian', 'Wilayah kejadian', 'Jenis kejadian', 'Keterangan', 'Foto'] as $section) {
        expect($create)->toMatch('/<h2 className="px-4 text-\[13px\][^"]*">\s*'.$section.'\s*<\/h2>/');
    }
    expect($create)->not->toMatch('/<Card\b/')
        ->and($create)->toContain('bottom-[calc(4rem+env(safe-area-inset-bottom))]');

    $show = appleSource('resources/js/Pages/Front/Reports/Show.jsx');
    expect($show)->toMatch('/<IconChevronLeft className="h-5 w-5" \/>\s*Kembali/')
        ->and($show)->not->toMatch('/<h1 className="[^"]*\buppercase\b/')
        ->and($show)->not->toContain('<DialogContent className="max-w-sm rounded-xl border');
});

it('shares one standby control between dashboards and floats the monitoring map controls on the standard materials', function () {
    foreach (['resources/js/Pages/Dashboard.jsx', 'resources/js/Pages/Admin/Dashboard.jsx'] as $path) {
        $src = appleSource($path);
        expect($src)->toContain('<StandbyCard')
            ->and($src)->not->toContain('Mode Kesiapan');
    }
    expect(appleSource('resources/js/Components/StandbyCard.jsx'))->toContain('<Switch');

    $map = appleSource('resources/js/Pages/Monitoring/Map.jsx');
    expect($map)->not->toMatch('/bg-card\/9\d/')
        ->and($map)->not->toContain('backdrop-blur-sm')
        ->and($map)->toContain('material-thick m-3 mt-16');
});

it('keeps the mobile dashboards to the essentials and leaves the detail for larger screens', function () {
    expect(appleSource('resources/js/Pages/Dashboard.jsx'))->toContain('max-md:[&>a:nth-of-type(n+4)]:hidden')
        ->toContain('timeAgo(report.created_at)')
        ->toContain('active:scale-[0.98]');
    expect(appleSource('resources/js/Pages/Admin/Dashboard.jsx'))->toContain('max-md:[&>a:nth-of-type(n+6)]:hidden')
        ->toContain('order-1 hidden shrink-0');
    expect(appleSource('resources/js/Pages/Petugas/Dashboard.jsx'))->toContain('hidden font-mono font-semibold md:inline')
        ->not->toContain('Wilayah Yurisdiksi')
        ->not->toContain('PETUGAS DAMKAR');
    expect(appleSource('resources/js/Components/ReportCard.jsx'))->toContain('line-clamp-3 hidden text-[13px]');
});

it('reworks the remaining front pages into grouped lists and iOS-style screens', function () {
    $group = 'divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm';
    foreach (['Mail/Index', 'Front/Reports/Index', 'Forum/Index', 'Regu/Index', 'Admin/Reports/Index', 'Admin/Agencies/Index'] as $page) {
        expect(appleSource("resources/js/Pages/{$page}.jsx"))->toContain($group);
    }
    expect(appleSource('resources/js/Pages/Front/Reports/Thanks.jsx'))->toContain('rounded-full bg-success/10');
    expect(appleSource('resources/js/Pages/Volunteers/Index.jsx'))->toContain('after:absolute after:inset-0');
    expect(appleSource('resources/js/Pages/ErrorHandling.jsx'))->not->toMatch('/<Card\b/');
    expect(appleSource('resources/js/Pages/Spotlight.jsx'))->not->toMatch('/\b(bg-white|border-white|border-neutral-200)\b/');
    // Pola baris pindah ke satu konstanta (bagian 16) - halaman memakainya, polanya dijaga di sumbernya.
    expect(appleSource('resources/js/Pages/Admin/Roles/Create.jsx'))->toContain('className={groupedRowsClass}');
    expect(appleSource('resources/js/Components/GroupedForm.jsx'))->toContain('divide-y divide-border/70 [&>*:first-child]:pt-0');
});

it('groups every sign-in field in one iOS-style card and keeps the marketing pages on theme tokens', function () {
    foreach (['Login', 'Register', 'ForgotPassword', 'ResetPassword', 'ConfirmPassword'] as $page) {
        $src = appleSource("resources/js/Pages/Auth/{$page}.jsx");
        expect($src)->toContain('focus-within:border-primary/40')
            ->and($src)->toContain('rounded-none border-0 bg-transparent p-0')
            ->and($src)->not->toContain('h-11 w-full rounded-xl border-border bg-background');
    }
    foreach (['Landing', 'Home', 'Spotlight'] as $page) {
        expect(appleSource("resources/js/Pages/{$page}.jsx"))->not->toMatch('/\b(bg-white|text-white|border-neutral-200)\b(?!\/)/');
    }
    expect(appleSource('resources/js/Pages/Home.jsx'))->not->toContain('<hr');
});

it('gives the superadmin tables a grouped phone list that shares one delete dialog with the desktop table', function () {
    foreach (['Announcements' => 'DeleteAnnouncementDialog', 'Tenants' => 'DeleteTenantDialog'] as $mod => $dialog) {
        $src = appleSource("resources/js/Pages/Admin/{$mod}/Index.jsx");
        expect($src)->toContain('divide-y divide-border/70 md:hidden')
            ->and($src)->toContain('<div className="hidden md:block">')
            ->and(substr_count($src, "<{$dialog} "))->toBe(2)
            ->and(substr_count($src, '<AlertDialog>'))->toBe(1);
    }
});

it('lets dashboard rows wrap in full and moves status and action pills off the crowded right edge', function () {
    $row = appleSource('resources/js/Components/AppSection.jsx');
    $rowFn = substr($row, strpos($row, 'export function AppListRow'));
    expect($rowFn)->not->toContain('truncate')
        ->and($rowFn)->toContain('{badges && <div className="mt-2.5 flex flex-wrap');
    foreach (['Pages/Dashboard.jsx', 'Pages/Admin/Dashboard.jsx', 'Pages/Petugas/Dashboard.jsx'] as $page) {
        $src = appleSource("resources/js/{$page}");
        expect($src)->toContain('badges={')
            ->and($src)->toContain('aside={')
            ->and($src)->not->toMatch('/<span className="truncate">\{(report|mission|item)\.(location|address)/');
    }
    $card = appleSource('resources/js/Components/ReportCard.jsx');
    expect($card)->not->toContain('line-clamp-2 flex min-w-0 flex-1 items-start gap-2 text-[17px]')
        ->and($card)->not->toContain('text-[11px] font-bold uppercase tracking-wide');
});

// TASK_69 bagian 15 (user 2026-10-02): di ponsel ketujuh halaman fasilitas & laporan TANPA peta.
// Kolom peta disembunyikan di bawah lg, daftar mengalir bersama halaman (tanpa kotak gulir 500px),
// dan tak ada lagi petunjuk "Lihat di peta" / gulir otomatis ke peta yang kini tak terlihat.
it('hides the map on phones for the facility and report list pages', function () {
    $public = ['Hydrants/Index', 'Pumps/Index', 'FireStations/Index'];
    $admin = ['Admin/Reports/Index', 'Admin/Hydrants/Index', 'Admin/Pumps/Index', 'Admin/FireStations/Index'];
    foreach ($public as $page) {
        expect(appleSource("resources/js/Pages/{$page}.jsx"))
            ->toContain('className="hidden w-full flex-col gap-3 lg:sticky lg:top-[90px] lg:flex lg:flex-1"');
    }
    foreach ($admin as $page) {
        $src = appleSource("resources/js/Pages/{$page}.jsx");
        expect($src)->toContain('className="hidden w-full flex-col lg:flex lg:h-[calc(100vh-140px)] lg:flex-1"')
            ->and($src)->toContain('invalidateSize()')
            ->and($src)->not->toContain('Lihat di peta')
            ->and($src)->not->toContain('scrollIntoView')
            ->and($src)->not->toContain('h-[500px]');
    }
    // Ponsel: baris laporan membuka detail (tak ada peta untuk dipusatkan).
    $reports = appleSource('resources/js/Pages/Admin/Reports/Index.jsx');
    expect($reports)->toContain("router.visit(route('reports.show', report.id))")
        ->and($reports)->toContain('<AppEmpty')
        ->and($reports)->not->toContain('rounded-lg px-2 py-0.5 font-bold');
});

// TASK_69 bagian 16 (audit visual ulang 2026-10-02): halaman berlabel "dirombak penuh" ternyata hanya
// berganti pembungkus. Penjaga ini mengunci rombakan isi yang sesungguhnya.
it('keeps stray control bytes out of the frontend sources', function () {
    $offenders = [];
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js'))) as $file) {
        if (! in_array($file->getExtension(), ['jsx', 'js'], true)) {
            continue;
        }
        // utils.js SENGAJA memuat byte NUL (lihat CLAUDE.md); yang dijaga byte 0x01-0x08 - jejak `\1`
        // yang tercetak harfiah oleh skrip pengganti dan tampil sebagai kotak di layar.
        if (preg_match('/[\x01-\x08]/', file_get_contents($file->getPathname()))) {
            $offenders[] = $file->getFilename();
        }
    }
    expect($offenders)->toBe([]);
});

it('fills grouped form fields and reworks the remaining old screens for real', function () {
    $grouped = appleSource('resources/js/Components/GroupedForm.jsx');
    expect($grouped)->toContain('export const filledFieldsClass')
        ->and($grouped)->toContain('[&_[role=combobox]]:bg-muted/60')
        ->and($grouped)->toMatch('/export const groupedRowsClass = `[^`]*\$\{filledFieldsClass\}`/');
    foreach (['Admin/Agencies/Create', 'Admin/Tenants/Form', 'Forum/Create', 'Front/Reports/Resolution/Create'] as $page) {
        expect(appleSource("resources/js/Pages/{$page}.jsx"))->toContain('className={groupedRowsClass}');
    }
    foreach (['Hydrants', 'Pumps', 'FireStations'] as $module) {
        foreach (['Create', 'Edit'] as $page) {
            expect(appleSource("resources/js/Pages/Admin/{$module}/{$page}.jsx"))->toContain('${filledFieldsClass}');
        }
    }

    $show = appleSource('resources/js/Pages/Front/Reports/Show.jsx');
    expect($show)->not->toContain('Judul Insiden:')
        ->and($show)->not->toContain('PETA DISPATCHER KOMANDO')
        ->and($show)->not->toContain('CardHeader')
        ->and($show)->toContain('Informasi insiden');

    $volunteers = appleSource('resources/js/Pages/Volunteers/Index.jsx');
    expect($volunteers)->not->toMatch('/<Card\b/')
        ->and($volunteers)->toContain('aria-expanded={showFilters}');

    foreach (['Roles', 'Permissions', 'RouteAccesses', 'AssignPermissions'] as $module) {
        $src = appleSource("resources/js/Pages/Admin/{$module}/Index.jsx");
        expect($src)->not->toMatch('/<Card\b/')
            ->and($src)->toContain('<div className="divide-y divide-border/70 md:hidden">')
            ->and($src)->not->toMatch('/variant="(blue|red)"/');
    }

    foreach (['Hydrants', 'Pumps', 'FireStations', 'Admin/Hydrants', 'Admin/Pumps', 'Admin/FireStations'] as $page) {
        expect(appleSource("resources/js/Pages/{$page}/Index.jsx"))->not->toContain('truncate text-sm font-semibold');
    }

    expect(appleSource('resources/js/Pages/Admin/Users/Index.jsx'))->not->toContain('function MobileInfo');
    expect(appleSource('resources/js/Components/UseCurrentLocationDialog.jsx'))->not->toMatch('/\bbg-info\b|rounded-md/');
});

// Skrip rombakan bagian 16 menyisipkan ikon baru ke JSX tanpa impornya (Sinkronisasi Izin, Izin) -
// halaman putih "IconChevronRight is not defined" yang tak tertangkap test mana pun karena semua
// penjaga hanya membaca teks sumber. Penjaga ini: setiap Icon* yang dipakai halaman wajib diimpor.
it('imports every tabler icon a page renders', function () {
    $offenders = [];
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js/Pages'))) as $file) {
        if ($file->getExtension() !== 'jsx') {
            continue;
        }
        $src = appleSource(substr($file->getPathname(), strlen(base_path()) + 1));
        preg_match_all('/\b(Icon[A-Z]\w*)\b/', $src, $used);
        preg_match_all('/import\s*\{([^}]*)\}\s*from/', $src, $imports);
        $known = [];
        foreach ($imports[1] as $list) {
            foreach (explode(',', $list) as $name) {
                $parts = preg_split('/\s+as\s+/', trim($name));
                $known[] = trim(end($parts));
            }
        }
        preg_match_all('/(?:function|const|let)\s+(Icon[A-Z]\w*)|:\s*(Icon[A-Z]\w*)\s*[,}]/', $src, $defs);
        $known = array_merge($known, $defs[1], $defs[2]);
        foreach (array_diff(array_unique($used[1]), $known) as $missing) {
            $offenders[] = $file->getFilename().': '.$missing;
        }
    }
    expect($offenders)->toBe([]);
});

// Keputusan user 2026-10-02: tanpa batas lebar global. Dulu `max-w-7xl` di <main> memusatkan isi di
// 1280px - layar lebar kosong di kiri-kanan sementara tabel Pengguna terpotong & tombol Ubah harus
// dicari dengan menggulir ke kanan. Kolom Aksi tiap tabel admin lengket di kanan.
it('lets desktop pages use the full width and keeps table actions in view', function () {
    expect(appleSource('resources/js/Layouts/AppLayout.jsx'))->not->toMatch('/<main className="[^"]*\bmax-w-/');
    expect(appleSource('resources/js/Components/ui/table.jsx'))->toContain('[&_td:last-child]:sticky [&_td:last-child]:right-0');
    foreach (['Users', 'Announcements', 'Roles', 'Permissions', 'RouteAccesses', 'AssignPermissions', 'Tenants'] as $module) {
        expect(appleSource("resources/js/Pages/Admin/{$module}/Index.jsx"))->toContain('${stickyActionsClass}');
    }
    // Form tetap sempit tapi sejajar judul halaman (bukan melayang di tengah layar lebar).
    expect(appleSource('resources/js/Pages/Admin/Roles/Create.jsx'))->toContain('<Card className="w-full max-w-2xl">');
});

// TASK_69 bagian 24 (user 2026-10-02: cek /admin/agencies, /admin/hydrants, /admin/banjars, /admin/forum, /forum).
it('finishes the forum moderation, OPD, banjar, forum and hydrant tab screens', function () {
    $moderation = appleSource('resources/js/Pages/Admin/Forum/Index.jsx');
    expect($moderation)->not->toMatch('/<Card\b/')
        ->and($moderation)->not->toContain('text-[11px]')
        ->and($moderation)->toContain('<AppEmpty');

    $agencies = appleSource('resources/js/Pages/Admin/Agencies/Index.jsx');
    expect($agencies)->toContain(".join(' · ')")
        ->and($agencies)->not->toContain('rounded border border-info/20');

    $banjars = appleSource('resources/js/Pages/Admin/Banjars/Index.jsx');
    expect($banjars)->toContain('rounded-xl bg-muted p-1')
        ->and($banjars)->not->toContain("variant={require_banjar ? 'default' : 'outline'}");

    expect(appleSource('resources/js/Pages/Forum/Partials/ForumParts.jsx'))->not->toContain('border border-destructive/30 bg-destructive/5');
    // Bentuk tab v4 (keputusan user 2026-08-20) tetap; hanya warna teal padatnya yang diganti primer brand.
    $tabs = appleSource('resources/js/Pages/Admin/Hydrants/variants.jsx');
    expect($tabs)->toContain("variant={isActive ? 'default' : 'secondary'}")
        ->and($tabs)->not->toContain('bg-teal-600');
});

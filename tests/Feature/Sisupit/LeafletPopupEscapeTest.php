<?php

/**
 * #131 - popup Leaflet adalah HTML MENTAH (`bindPopup(string)` memasangnya lewat innerHTML).
 * Judul laporan & alamat diketik warga, nama relawan diketik pemilik akun, hydrant warga didata
 * warga - tanpa escape, teks seperti `<img src=x onerror=...>` berjalan di browser staf yang
 * membuka peta. Di JSX React meng-escape sendiri; popup Leaflet satu-satunya tempat repo ini
 * menulis HTML sebagai string, jadi aturannya hidup di sini.
 *
 * ATURAN: di SETIAP berkas yang memanggil `bindPopup(`, tiap `${...}` di dalam template string
 * yang memuat tag HTML WAJIB berupa `escapeHtml(...)`, KECUALI ekspresi yang terdaftar di
 * POPUP_SAFE_EXPRESSIONS - konstanta milik kode sendiri (warna, ikon, kamus status) atau potongan
 * HTML yang isinya sudah di-escape. Menambah popup baru dengan data mentah = test ini merah.
 */
const POPUP_SAFE_EXPRESSIONS = [
    // Warna/ikon marker - kelas & SVG yang ditulis kode, bukan data.
    'arrowColor', 'bgColor', 'borderColor', 'fgColor', 'svgIcon', 'titleColorClass', 'iconColor',
    'iconEmoji', 'bgClass', 'glyph', 'statusClass',
    "reportStatus !== 'resolved' ? 'animate-pulse' : ''",
    // Kamus status tetap REPORT_META di Monitoring/Map.jsx.
    'meta.badge', 'meta.label',
    // Potongan HTML yang tiap nilai datanya SUDAH di-escape di tempat ia dirangkai.
    'inner', 'extra', 'skillsLine', 'labelText', 'reguLine(r.regus)', "regus.map(escapeHtml).join(', ')",
    // Marker regu di peta detail insiden (§13 TASK_60): lingkaran ikon milik kode, baris danru &
    // daftar anggota yang namanya di-escape per baris.
    'circle', 'leaderLine', 'memberItems',
];

/** Berkas JSX yang memanggil bindPopup, komentar dibuang (penjelasan larangan tak ikut dipindai). */
function popupSources(): array
{
    $files = collect(\Illuminate\Support\Facades\File::allFiles(resource_path('js')))
        ->filter(fn ($f) => $f->getExtension() === 'jsx' && str_contains($f->getContents(), 'bindPopup('));

    return $files->mapWithKeys(fn ($f) => [
        $f->getRelativePathname() => preg_replace(['~/\*.*?\*/~s', '~^\s*//.*$~m'], '', $f->getContents()),
    ])->all();
}

/** Ekspresi `${...}` teratas di sebuah template, kurung kurawal bersarang ikut dihitung. */
function templateExpressions(string $template): array
{
    $found = [];
    $length = strlen($template);
    for ($i = 0; $i < $length - 1; $i++) {
        if ($template[$i] !== '$' || $template[$i + 1] !== '{') {
            continue;
        }
        $depth = 1;
        $j = $i + 2;
        while ($j < $length && $depth > 0) {
            $depth += $template[$j] === '{' ? 1 : ($template[$j] === '}' ? -1 : 0);
            $j++;
        }
        $found[] = trim(substr($template, $i + 2, $j - $i - 3));
        $i = $j - 1;
    }

    return $found;
}

it('escapes every data value placed into leaflet popup html', function () {
    $sources = popupSources();
    // Delapan pemanggil saat #131 diperbaiki - kalau angkanya turun, pemindainya rusak (atau
    // popup sungguh dihapus: turunkan angkanya dengan sadar, jangan hapus baris ini).
    expect(count($sources))->toBeGreaterThanOrEqual(8);

    $raw = [];
    foreach ($sources as $file => $source) {
        preg_match_all('/`([^`]*)`/s', $source, $templates);
        foreach ($templates[1] as $template) {
            if (! preg_match('/<[a-z]/i', $template)) {
                continue;
            }
            foreach (templateExpressions($template) as $expression) {
                if (! str_starts_with($expression, 'escapeHtml(') && ! in_array($expression, POPUP_SAFE_EXPRESSIONS, true)) {
                    $raw[] = "{$file}: \${{$expression}}";
                }
            }
        }
    }

    expect($raw)->toBe([]);
});

it('escapes all five html-significant characters in the shared helper', function () {
    $helper = file_get_contents(resource_path('js/lib/escape-html.js'));

    foreach (["'&': '&amp;'", "'<': '&lt;'", "'>': '&gt;'", "'\"': '&quot;'", "\"'\": '&#39;'"] as $pair) {
        expect($helper)->toContain($pair);
    }
    expect($helper)->toContain('/[&<>"\']/g');
});

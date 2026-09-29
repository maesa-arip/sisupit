<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// FINDINGS #132 — upload foto dijawab "413 Request Entity Too Large". Tiga lapis batas tidak
// sejalan: Nginx produksi masih bawaan 1 MB (situs prod dibuat tangan lewat Certbot, template
// 25M di deploy/ tak pernah sampai ke sana), PHP-FPM bawaan Ubuntu post_max_size 8M /
// upload_max_filesize 2M, sementara aplikasi menerima 6 foto x 4 MB di laporan dan 8 foto x
// 5 MB + KTP korban di berita acara. Foto kamera ponsel 3-8 MB dikirim apa adanya.
//
// Batas server dibetulkan di VPS (bukan di repo, lihat deploy/environments.md). Yang dijaga
// di sini adalah sisi repo: foto dikompres di browser sebelum dikirim, jumlah foto berita
// acara dibatasi di server, dan 413 yang tetap lolos tampil sebagai pesan, bukan modal mentah.
// Sebagian diuji dari BERKAS SUMBER karena di situlah sifatnya hidup - Pest tidak merender React.

$stripComments = fn (string $source) => preg_replace(['#/\*.*?\*/#s', '#//[^\n]*#'], '', $source);

$jsxMaxPhotos = function (string $relative): int {
    preg_match('/const MAX_PHOTOS = (\d+);/', file_get_contents(resource_path('js/'.$relative)), $m);

    return (int) ($m[1] ?? 0);
};

// Batas jumlah foto berita acara DITARIK dari form-nya, bukan ditulis ulang di sini (pelajaran
// #79: test yang mengadu angka dengan salinan angka yang sama tidak menjaga apa pun). Tanpa
// batas di server, satu kiriman bisa melewati post_max_size dan ditolak sebelum validasi.
it('caps berita acara photos on the server at the same count the form allows', function () use ($jsxMaxPhotos) {
    Storage::fake('local');
    Storage::fake('public');

    $max = $jsxMaxPhotos('Pages/Front/Reports/Resolution/Create.jsx');
    expect($max)->toBeGreaterThan(0);

    $reporter = User::factory()->create();
    $reporter->assignRole('warga');
    $report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran gudang',
        'address' => 'Jl. Trengguli No. 50',
        'lat' => '-8.6300',
        'lng' => '115.2600',
        'status' => 'resolved',
        'village_code' => '5171012006',
    ]);
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $photos = fn (int $n) => array_map(fn ($i) => UploadedFile::fake()->image("tkp{$i}.jpg"), range(1, $n));

    $this->actingAs($petugas)
        ->post("/reports/{$report->id}/resolution", ['status' => 'sementara', 'photos' => $photos($max + 1)])
        ->assertSessionHasErrors('photos');

    $this->actingAs($petugas)
        ->post("/reports/{$report->id}/resolution", ['status' => 'sementara', 'photos' => $photos($max)])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('reports.show', $report->id));
});

// Setiap input yang menerima GAMBAR wajib lewat kompresi. Input baru yang lupa memakainya
// mengulang #132 persis: berkas kamera dikirim utuh dan server menjawab 413 - gejalanya
// cuma muncul di ponsel, tak pernah saat diuji dengan gambar kecil di desktop.
it('routes every image file input through the browser-side compressor', function () use ($stripComments) {
    $offenders = [];
    $dir = new RecursiveDirectoryIterator(resource_path('js/Pages'), FilesystemIterator::SKIP_DOTS);

    foreach (new RecursiveIteratorIterator($dir) as $file) {
        $path = $file->getPathname();
        // Front/Settings = dead code (lihat skill sisupit-ui), tak terpasang ke route mana pun.
        if ($file->getExtension() !== 'jsx' || str_contains(str_replace('\\', '/', $path), 'Front/Settings/')) {
            continue;
        }

        $source = $stripComments(file_get_contents($path));
        if (! preg_match('/type="file"[^>]*accept="image\//s', $source)) {
            continue;
        }

        $imports = str_contains($source, "from '@/lib/compress-image'");
        $calls = (bool) preg_match('/\bcompressImages?\(/', $source);
        if (! $imports || ! $calls) {
            $offenders[] = str_replace(resource_path('js'), '', $path);
        }
    }

    expect($offenders)->toBe([]);
});

// 413 datang sebagai HALAMAN HTML (dari Nginx maupun dari PostTooLargeException Laravel),
// bukan respons Inertia, jadi tanpa penanganan ini pengguna melihat modal galat mentah.
it('turns a 413 into a readable toast instead of the raw error modal', function () use ($stripComments) {
    $source = $stripComments(file_get_contents(resource_path('js/app.jsx')));

    expect($source)->toMatch("/router\.on\(\s*'invalid'/");
    expect($source)->toMatch('/status\s*!==\s*413/');
    expect($source)->toContain('event.preventDefault()');
    expect($source)->toContain('toast.error(');
});

// Template Nginx di repo adalah sumber env BARU. Batasnya wajib muat kiriman laporan terbesar
// yang diizinkan ReportRequest (jumlah foto x ukuran per foto) - angka keduanya DITARIK dari
// berkasnya masing-masing, bukan disalin ke sini.
it('keeps the nginx templates large enough for the biggest allowed report', function () {
    $rules = file_get_contents(app_path('Http/Requests/ReportRequest.php'));
    preg_match("/'photos' => \[[^\]]*'max:(\d+)'/s", $rules, $count);
    preg_match("/'photos\.\*' => \[[^\]]*'max:(\d+)'/s", $rules, $perFileKb);
    expect($count[1] ?? null)->not->toBeNull();
    expect($perFileKb[1] ?? null)->not->toBeNull();

    $neededMb = (int) ceil(((int) $count[1] * (int) $perFileKb[1]) / 1024);

    foreach (['deploy/nginx-env.conf.template', 'deploy/nginx-sisupit.conf.example'] as $template) {
        preg_match('/client_max_body_size (\d+)M;/', file_get_contents(base_path($template)), $m);
        expect((int) ($m[1] ?? 0))->toBeGreaterThan($neededMb);
    }
});

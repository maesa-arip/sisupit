<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Tombol "Unduh" penampil foto (permintaan user 2026-11-06). Lewat server dengan
 * Content-Disposition: attachment supaya APK WebView ikut mengunduh (DownloadListener hanya
 * menangkap respons yang tak bisa ditampilkan). Hanya folder foto kejadian - KTP akun (users/)
 * di disk yang sama tidak boleh ikut terbuka lewat jalan ini.
 */
beforeEach(function () {
    Storage::fake('public');

    $this->user = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->user->assignRole('petugas');
});

it('downloads incident photos as an attachment', function () {
    $path = UploadedFile::fake()->image('tkp.jpg')->store('reports', 'public');

    $response = $this->actingAs($this->user)->get(route('photos.download', ['path' => $path]))->assertOk();

    expect($response->headers->get('content-disposition'))
        ->toContain('attachment')
        ->toContain('sisupit-foto-'.basename($path));

    $resolution = UploadedFile::fake()->image('ba.jpg')->store('resolutions', 'public');
    $this->actingAs($this->user)->get(route('photos.download', ['path' => $resolution]))->assertOk();
});

it('refuses other folders, traversal, missing files and guests', function () {
    $ktp = UploadedFile::fake()->image('ktp.jpg')->store('users', 'public');
    $path = UploadedFile::fake()->image('tkp.jpg')->store('reports', 'public');

    foreach ([$ktp, 'reports/../'.$ktp, 'reports/tidak-ada.jpg', 'reports/sub/x.jpg', ''] as $bad) {
        $this->actingAs($this->user)->get(route('photos.download', ['path' => $bad]))->assertNotFound();
    }

    auth()->logout();
    $this->get(route('photos.download', ['path' => $path]))->assertRedirect(route('login'));
});

it('offers download and zoom in the viewer, and the reporter photos in the Laporan Kejadian form', function () {
    $viewer = file_get_contents(resource_path('js/Components/PhotoViewer.jsx'));
    $form = file_get_contents(resource_path('js/Pages/Front/Reports/Resolution/Create.jsx'));

    expect($viewer)->toContain("route('photos.download', { path })")
        // Zoom: cubit + ketuk dua kali, carousel berhenti menyeret selama diperbesar.
        ->and($viewer)->toContain('watchDrag: () => !zoomedRef.current')
        ->and($viewer)->toContain('DOUBLE_TAP_SCALE')
        // Pembukaan ringan: tanpa blur & tanpa zoom/geser dari DialogContent bawaan.
        ->and($viewer)->not->toContain('backdrop-blur')
        ->and($viewer)->not->toContain("from '@/Components/ui/dialog'")
        ->and($viewer)->toContain('<DismissOnBack />');

    expect($form)->toContain('reporterPhotos')
        ->and($form)->toContain('<PhotoViewer viewer={photoViewer}');
});

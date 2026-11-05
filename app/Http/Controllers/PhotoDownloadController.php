<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Tombol "Unduh" di penampil foto (2026-11-06). Sengaja lewat server, bukan `<a download>`
 * ke /storage: APK WebView hanya menangkap unduhan dari RESPONS yang tak bisa ditampilkan
 * (DownloadListener, mobile/PERILAKU_WEBVIEW.md butir 5) - gambar biasa justru dibuka di
 * WebView. `Content-Disposition: attachment` membuat browser, APK, dan iOS sama-sama mengunduh.
 *
 * Yang boleh diunduh HANYA folder foto kejadian di disk public (lampiran laporan warga &
 * foto Laporan Kejadian) - berkas yang memang sudah terbuka lewat /storage. Folder lain di
 * disk yang sama (mis. users/ berisi KTP akun) TIDAK ikut dibuka lewat jalan ini.
 */
class PhotoDownloadController extends Controller
{
    private const FOLDERS = ['reports', 'resolutions'];

    public function __invoke(Request $request): StreamedResponse
    {
        $path = (string) $request->query('path', '');

        // Satu tingkat folder + nama berkas aman: tanpa "..", tanpa garis miring tambahan.
        $folders = implode('|', self::FOLDERS);
        abort_unless(preg_match('#^('.$folders.')/[A-Za-z0-9._-]+$#', $path) === 1, 404);
        abort_if(str_contains($path, '..'), 404);

        $disk = Storage::disk('public');
        abort_unless($disk->exists($path), 404);
        abort_unless(str_starts_with((string) $disk->mimeType($path), 'image/'), 404);

        return $disk->download($path, 'sisupit-foto-'.basename($path));
    }
}

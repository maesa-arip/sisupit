<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Lonceng notifikasi web — menampilkan & menandai-baca notifikasi dari tabel `notifications`
 * (channel database). Sebelumnya channel database menulis tapi tak ada consumer di web
 * (FINDINGS #25). Daftar notifikasi di-share lewat HandleInertiaRequests.
 */
class NotificationController extends Controller
{
    // Tandai satu notifikasi terbaca lalu arahkan ke laporannya (bila ada).
    public function read(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        // Notifikasi yang tujuannya BUKAN detail laporan penuh (TASK_89: warga sekitar kejadian
        // tak berhak membuka reports.show) membawa `url` sendiri. Hanya path relatif yang dipakai
        // supaya data notifikasi tak pernah bisa jadi open redirect.
        $url = $notification->data['url'] ?? null;
        // "/\host" dibaca sebagian browser sebagai "//host", jadi garis miring kedua ditolak juga.
        if (is_string($url) && ($path = parse_url($url, PHP_URL_PATH)) && preg_match('#^/(?![/\\\\])#', $path)) {
            return redirect($path);
        }

        $reportId = $notification->data['report_id'] ?? null;
        if ($reportId) {
            return redirect()->route('reports.show', $reportId);
        }

        return back();
    }

    // Tandai semua notifikasi yang belum dibaca jadi terbaca.
    public function readAll(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }
}

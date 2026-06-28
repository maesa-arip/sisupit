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

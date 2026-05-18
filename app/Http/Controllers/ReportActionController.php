<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\TrackingLog;
use App\Models\User; // <-- Wajib ditambahkan
use Illuminate\Http\Request;
use App\Events\ResponderLocationUpdated;
use App\Notifications\WebPushNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class ReportActionController extends Controller
{
    // 1. Saat Pusat Komando memvalidasi laporan
    public function approve($id)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $report->update(['status' => 'pending']);

        // Ambil seluruh akun petugas dan relawan di lapangan untuk dikirimi Notifikasi Push
        $responders = User::role(['petugas', 'relawan'])->whereNot('id', auth()->id())->get();

        if ($responders->isNotEmpty()) {
            Notification::send($responders, new WebPushNotification($report));
        }

        return back()->with('success', 'Laporan berhasil divalidasi dan disiarkan ke lapangan!');
    }

    // 2. Saat Relawan / Petugas merespons panggilan (Tombol "Meluncur")
    public function takeAction($id)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $user = auth()->user();
        $isPetugas = $user->hasRole('petugas');
        
        $table = $isPetugas ? 'report_officers' : 'report_helpers';
        $timeColumn = $isPetugas ? 'dispatched_at' : 'started_at';
        
        // Mencegah Double Insert
        $exists = DB::table($table)->where('report_id', $report->id)->where('user_id', $user->id)->exists();
        
        if (!$exists) {
            DB::table($table)->insert([
                'report_id' => $report->id,
                'user_id' => $user->id,
                'status' => 'en_route',
                $timeColumn => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Jika status masih pending, ubah jadi handling (sedang ditangani)
            if ($report->status === 'pending') {
                $report->update(['status' => 'handling']);
            }
        }
        return back()->with('success', 'Berhasil merespons! Harap segera menuju lokasi.');
    }

    // 3. Saat Relawan/Petugas Tiba di Lokasi
    public function arrive($id)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $user = auth()->user();
        $table = $user->hasRole('petugas') ? 'report_officers' : 'report_helpers';

        DB::table($table)
            ->where('report_id', $report->id)
            ->where('user_id', $user->id)
            ->update([
                'status' => 'arrived',
                'arrived_at' => now(),
                'updated_at' => now()
            ]);

        return back()->with('success', 'Status Anda berhasil diupdate menjadi Tiba.');
    }

    // 4. Saat Petugas Menyatakan Insiden Selesai
    public function resolve($id)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);

        // Pastikan hanya petugas/admin yang bisa selesaikan
        if (!auth()->user()->hasAnyRole(['petugas', 'admin', 'superadmin'])) {
            abort(403, 'Akses Ditolak.');
        }

        DB::transaction(function () use ($report) {
            $report->update(['status' => 'resolved']);

            // Tandai semua relawan & petugas yang berpartisipasi menjadi selesai
            DB::table('report_officers')->where('report_id', $report->id)->update(['status' => 'finished', 'finished_at' => now()]);
            DB::table('report_helpers')->where('report_id', $report->id)->update(['status' => 'finished', 'finished_at' => now()]);
        });

        return back()->with('success', 'Insiden Selesai Ditangani.');
    }

    // 5. Menerima Titik GPS dari Perangkat Relawan (Dikirim dari React Background)
    public function updateLocation(Request $request, $id)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric'
        ]);

        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $user = auth()->user();
        $roleType = $user->hasRole('petugas') ? 'petugas' : 'relawan';
        $table = $roleType === 'petugas' ? 'report_officers' : 'report_helpers';

        // Gunakan DB Transaction agar Update & Insert dijamin aman dan bersamaan
        DB::transaction(function () use ($request, $report, $user, $roleType, $table) {

            // 1. UPDATE POSISI TERKINI (Timpa koordinat lama)
            DB::table($table)
                ->where('report_id', $report->id)
                ->where('user_id', $user->id)
                ->update([
                    'location_lat' => $request->lat,
                    'location_lng' => $request->lng,
                    'updated_at'   => now()
                ]);

            // 2. SIMPAN JEJAK SEJARAH (Append-Only)
            TrackingLog::create([
                'report_id'   => $report->id,
                'user_id'     => $user->id,
                'user_type'   => $roleType,
                'lat'         => $request->lat,
                'lng'         => $request->lng,
                'recorded_at' => now(),
            ]);
        });

        // 3. PANIC BUTTON / SIARAN WEBSOCKET KE MAPS COMMAND CENTER
        broadcast(new ResponderLocationUpdated(
            $report->id,
            $user->id,
            $roleType,
            $user->name,
            $request->lat,
            $request->lng
        ));

        return response()->json(['status' => 'ok']);
    }
}
<?php

namespace App\Http\Controllers;

use App\Enums\TenantLevel;
use App\Models\Report;
use App\Models\Setting;
use App\Models\TrackingLog;
use App\Models\User; // <-- Wajib ditambahkan
use Illuminate\Http\Request;
use App\Events\ResponderLocationUpdated;
use App\Events\IncidentLocationCorrected;
use App\Notifications\EmergencyAlertNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

// Catatan arsitektur (disengaja, dikonfirmasi 2026-06-25): controller ini mengakses
// tabel report_officers/report_helpers lewat DB::table() mentah, BUKAN model Eloquent
// ReportOfficer/ReportHelper (yang dipakai ReportHelperController). Ini sengaja, bukan
// inkonsistensi yang belum disadari - dipilih demi lockForUpdate() di takeAction() untuk
// mencegah double-insert saat banyak relawan/petugas merespons satu insiden bersamaan.
// Jangan konsolidasi ke Eloquent tanpa mempertahankan locking ini (lihat FINDINGS_LOG #6).
class ReportActionController extends Controller
{
    // 1. Saat Pusat Komando memvalidasi laporan
    public function approve($id)
    {
        if (!auth()->user()->hasAnyRole(['petugas', 'admin', 'superadmin'])) {
            abort(403, 'Akses Ditolak.');
        }

        $report = Report::withoutGlobalScopes()->findOrFail($id);

        DB::transaction(function () use ($report) {
            $report->update(['status' => 'pending']);

            // Siaran ke petugas & relawan disiarkan terpisah, masing-masing pakai tingkat
            // wilayah sendiri (Setting::KEY_NOTIFY_LEVEL_PETUGAS / _RELAWAN), cascade naik dari desa laporan.
            $petugasCeiling = TenantLevel::from(
                Setting::getValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::KABUPATEN->value)
            );
            $relawanCeiling = TenantLevel::from(
                Setting::getValue(Setting::KEY_NOTIFY_LEVEL_RELAWAN, TenantLevel::DESA->value)
            );

            $petugasResponders = User::role('petugas')->notifiableForReport($report, $petugasCeiling)->whereNot('id', auth()->id())->get();
            // Relawan yang menonaktifkan siaga tidak ikut disiarkan notifikasi insiden.
            $relawanResponders = User::role('relawan')->where('is_standby', true)->notifiableForReport($report, $relawanCeiling)->whereNot('id', auth()->id())->get();

            if ($petugasResponders->isNotEmpty()) {
                Notification::send($petugasResponders, new EmergencyAlertNotification($report, 'petugas'));
            }
            if ($relawanResponders->isNotEmpty()) {
                Notification::send($relawanResponders, new EmergencyAlertNotification($report, 'relawan'));
            }
        });

        return back()->with('success', 'Laporan berhasil divalidasi dan disiarkan ke lapangan!');
    }

    // 2. Saat Relawan / Petugas merespons panggilan (Tombol "Meluncur")
    public function takeAction($id)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['petugas', 'relawan'])) {
            abort(403, 'Akses Ditolak.');
        }

        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $isPetugas = $user->hasRole('petugas');

        $table = $isPetugas ? 'report_officers' : 'report_helpers';
        $timeColumn = $isPetugas ? 'dispatched_at' : 'started_at';

        DB::transaction(function () use ($report, $user, $table, $timeColumn) {
            // Mencegah Double Insert
            $exists = DB::table($table)->where('report_id', $report->id)->where('user_id', $user->id)->lockForUpdate()->exists();

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
        });

        return back()->with('success', 'Berhasil merespons! Harap segera menuju lokasi.');
    }

    // 3. Saat Relawan/Petugas Tiba di Lokasi
    public function arrive($id)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['petugas', 'relawan'])) {
            abort(403, 'Akses Ditolak.');
        }

        $report = Report::withoutGlobalScopes()->findOrFail($id);
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
        $user = auth()->user();
        if (!$user->hasAnyRole(['petugas', 'relawan'])) {
            abort(403, 'Akses Ditolak.');
        }

        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric'
        ]);

        $report = Report::withoutGlobalScopes()->findOrFail($id);
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

    // 6. Koreksi Titik Insiden oleh Responder yang Sudah Tiba (mis. lokasi pelapor meleset)
    public function correctLocation(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['petugas', 'relawan'])) {
            abort(403, 'Akses Ditolak.');
        }

        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
        ]);

        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $table = $user->hasRole('petugas') ? 'report_officers' : 'report_helpers';

        $hasArrived = DB::table($table)
            ->where('report_id', $report->id)
            ->where('user_id', $user->id)
            ->where('status', 'arrived')
            ->exists();

        if (!$hasArrived) {
            abort(403, 'Hanya responder yang sudah tiba di lokasi yang bisa mengoreksi titik insiden.');
        }

        DB::transaction(function () use ($request, $report, $user) {
            $report->update([
                'lat' => $request->lat,
                'lng' => $request->lng,
                'address' => $request->address ?? $report->address,
            ]);

            TrackingLog::create([
                'report_id' => $report->id,
                'user_id' => $user->id,
                'user_type' => 'koreksi_lokasi',
                'lat' => $request->lat,
                'lng' => $request->lng,
                'recorded_at' => now(),
            ]);
        });

        broadcast(new IncidentLocationCorrected($report->id, $request->lat, $request->lng, $report->address));

        return back()->with('success', 'Titik lokasi insiden berhasil dikoreksi.');
    }
}
<?php

namespace App\Http\Controllers;

use App\Enums\TenantLevel;
use App\Events\IncidentLocationCorrected;
use App\Events\ReportStatusChanged;
use App\Events\ResponderLocationUpdated;
use App\Events\ResponderRosterChanged;
use App\Models\Report;
use App\Models\ReportUnit;
use App\Models\Setting; // <-- Wajib ditambahkan
use App\Models\TrackingLog;
use App\Models\Unit;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use App\Notifications\ReportStatusUpdatedNotification;
use Illuminate\Http\Request;
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
        if (! auth()->user()->hasAnyRole(['petugas', 'admin', 'superadmin'])) {
            abort(403, 'Akses Ditolak.');
        }

        $report = Report::withoutGlobalScopes()->findOrFail($id);

        // Hanya laporan mentah (TERLAPOR) yang divalidasi; cegah approve ganda / atas
        // laporan yang sudah diproses atau ditolak.
        if ($report->status !== 'TERLAPOR') {
            abort(403, 'Laporan ini sudah diproses.');
        }

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

        // Loop-balik ke pelapor: laporannya sudah divalidasi.
        $this->notifyReporter($report, 'approved');
        broadcast(new ReportStatusChanged($report->id, 'pending'));

        return back()->with('success', 'Laporan berhasil divalidasi dan disiarkan ke lapangan!');
    }

    // 1b. Saat Pusat Komando menolak laporan (hoax / tidak valid)
    // Tolak = set status 'ditolak' + simpan alasan (arsip), BUKAN hapus. Laporan tetap
    // bisa ditelusuri staff & terlihat di riwayat pemilik. Endpoint hapus-milik-sendiri
    // (ReportController::destroy) sengaja dipisah dari sini.
    public function reject(Request $request, $id)
    {
        if (! auth()->user()->hasAnyRole(['petugas', 'admin', 'superadmin'])) {
            abort(403, 'Akses Ditolak.');
        }

        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $report = Report::withoutGlobalScopes()->findOrFail($id);

        // Insiden yang sudah selesai tidak bisa ditolak.
        if ($report->status === 'resolved') {
            abort(403, 'Insiden yang sudah selesai tidak dapat ditolak.');
        }

        $report->update([
            'status' => 'ditolak',
            'rejected_reason' => $request->reason,
            'rejected_at' => now(),
        ]);

        broadcast(new ReportStatusChanged($report->id, 'ditolak', $request->reason));

        return back()->with('success', 'Laporan ditandai ditolak dan diarsipkan.');
    }

    // 2. Saat Relawan / Petugas merespons panggilan (Tombol "Meluncur")
    public function takeAction($id)
    {
        $user = auth()->user();
        if (! $user->hasAnyRole(['petugas', 'relawan'])) {
            abort(403, 'Akses Ditolak.');
        }

        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->ensureWithinJurisdiction($report, $user);

        // Tak bisa merespons insiden yang sudah ditutup/ditolak.
        if (in_array($report->status, ['resolved', 'ditolak'], true)) {
            abort(403, 'Insiden ini sudah ditutup.');
        }

        $isPetugas = $user->hasRole('petugas');

        $table = $isPetugas ? 'report_officers' : 'report_helpers';
        $timeColumn = $isPetugas ? 'dispatched_at' : 'started_at';

        // Apakah transisi pending -> handling benar terjadi pada panggilan ini (responder
        // pertama). Dipakai agar notifikasi ke pelapor TIDAK spam tiap responder bergabung.
        $becameHandling = false;
        // Apakah baris responder baru benar-benar masuk (bukan klik ganda) — penanda agar
        // viewer lain memuat ulang manifes + marker peta secara real-time.
        $rosterChanged = false;

        DB::transaction(function () use ($report, $user, $table, $timeColumn, &$becameHandling, &$rosterChanged) {
            // Mencegah Double Insert
            $exists = DB::table($table)->where('report_id', $report->id)->where('user_id', $user->id)->lockForUpdate()->exists();

            if (! $exists) {
                DB::table($table)->insert([
                    'report_id' => $report->id,
                    'user_id' => $user->id,
                    'status' => 'en_route',
                    $timeColumn => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $rosterChanged = true;

                // Jika status masih pending, ubah jadi handling (sedang ditangani)
                if ($report->status === 'pending') {
                    $report->update(['status' => 'handling']);
                    $becameHandling = true;
                }
            }
        });

        // Loop-balik ke pelapor hanya saat responder PERTAMA meluncur (pending -> handling).
        if ($becameHandling) {
            $this->notifyReporter($report, 'en_route');
            broadcast(new ReportStatusChanged($report->id, 'handling'));
        }

        // Beri tahu viewer lain bahwa ada responder baru di insiden ini.
        if ($rosterChanged) {
            broadcast(new ResponderRosterChanged($report->id));
        }

        return back()->with('success', 'Berhasil merespons! Harap segera menuju lokasi.');
    }

    // 2b. Saat Relawan/Petugas membatalkan keberangkatan (Tombol "Batal Meluncur")
    // Hanya boleh saat masih 'en_route' (belum tiba). Menghapus baris responder agar
    // GPS-nya berhenti & ia hilang dari manifes. Bila responder aktif terakhir mundur,
    // status laporan dikembalikan handling -> pending (FINDINGS #27).
    public function cancelResponse($id)
    {
        $user = auth()->user();
        if (! $user->hasAnyRole(['petugas', 'relawan'])) {
            abort(403, 'Akses Ditolak.');
        }

        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $table = $user->hasRole('petugas') ? 'report_officers' : 'report_helpers';

        $record = DB::table($table)->where('report_id', $report->id)->where('user_id', $user->id)->first();
        if (! $record || $record->status !== 'en_route') {
            abort(403, 'Hanya penugasan yang masih "Meluncur" yang bisa dibatalkan.');
        }

        $reverted = false;

        DB::transaction(function () use ($report, $user, $table, &$reverted) {
            DB::table($table)->where('report_id', $report->id)->where('user_id', $user->id)->delete();

            // Bila tak ada lagi responder aktif (en_route/arrived) di insiden ini, kembalikan
            // status handling -> pending agar dashboard menandainya butuh respons lagi.
            $stillActive = DB::table('report_officers')->where('report_id', $report->id)->whereIn('status', ['en_route', 'arrived'])->exists()
                || DB::table('report_helpers')->where('report_id', $report->id)->whereIn('status', ['en_route', 'arrived'])->exists();

            if (! $stillActive && $report->status === 'handling') {
                $report->update(['status' => 'pending']);
                $reverted = true;
            }
        });

        if ($reverted) {
            broadcast(new ReportStatusChanged($report->id, 'pending'));
        }

        // Responder hilang dari manifes → viewer lain perlu menghapus marker/barisnya.
        broadcast(new ResponderRosterChanged($report->id));

        return back()->with('success', 'Keberangkatan dibatalkan.');
    }

    // 2c. Pusat Komando mengerahkan UNIT/armada ke insiden (TASK_09).
    public function dispatchUnit(Request $request, $id)
    {
        if (! auth()->user()->hasAnyRole(['petugas', 'admin', 'superadmin'])) {
            abort(403, 'Akses Ditolak.');
        }

        $request->validate(['unit_id' => 'required|integer']);

        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->ensureWithinJurisdiction($report, auth()->user());
        if (in_array($report->status, ['resolved', 'ditolak'], true)) {
            abort(403, 'Insiden ini sudah ditutup.');
        }

        // Unit di-scope Tenantable → hanya unit di wilayah admin yang bisa dikerahkan.
        $unit = Unit::findOrFail($request->unit_id);
        if ($unit->status !== 'available') {
            abort(403, 'Unit ini sedang tidak tersedia.');
        }

        DB::transaction(function () use ($report, $unit) {
            ReportUnit::create([
                'report_id' => $report->id,
                'unit_id' => $unit->id,
                'status' => 'dispatched',
                'dispatched_at' => now(),
            ]);
            $unit->update(['status' => 'dispatched']);
        });

        return back()->with('success', 'Unit dikerahkan ke insiden.');
    }

    // 2d. Menarik kembali unit dari insiden (status unit -> available).
    public function releaseUnit(Request $request, $id)
    {
        if (! auth()->user()->hasAnyRole(['petugas', 'admin', 'superadmin'])) {
            abort(403, 'Akses Ditolak.');
        }

        $request->validate(['unit_id' => 'required|integer']);

        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->ensureWithinJurisdiction($report, auth()->user());

        DB::transaction(function () use ($report, $request) {
            $pivot = ReportUnit::where('report_id', $report->id)
                ->where('unit_id', $request->unit_id)
                ->where('status', 'dispatched')
                ->first();

            if ($pivot) {
                $pivot->update(['status' => 'released', 'released_at' => now()]);
                // Unit ter-scope Tenantable (BUKAN withoutGlobalScopes): staf wilayah hanya
                // membebaskan unit di wilayahnya; admin nasional/superadmin bypass. Re-scope
                // ini + cek yurisdiksi laporan di atas memenuhi ATURAN EMAS #7 (FINDINGS #32).
                Unit::whereKey($request->unit_id)->update(['status' => 'available']);
            }
        });

        return back()->with('success', 'Unit ditarik dari insiden.');
    }

    // 3. Saat Relawan/Petugas Tiba di Lokasi
    public function arrive($id)
    {
        $user = auth()->user();
        if (! $user->hasAnyRole(['petugas', 'relawan'])) {
            abort(403, 'Akses Ditolak.');
        }

        $report = Report::withoutGlobalScopes()->findOrFail($id);

        if (in_array($report->status, ['resolved', 'ditolak'], true)) {
            abort(403, 'Insiden ini sudah ditutup.');
        }

        $table = $user->hasRole('petugas') ? 'report_officers' : 'report_helpers';

        // Gerbang berbasis KEANGGOTAAN, bukan yurisdiksi: hanya responder yang MEMANG
        // terdaftar & masih 'en_route' di insiden ini yang boleh menandai Tiba. Yurisdiksi
        // sudah dijaga sekali saat GABUNG (takeAction); aksi lanjutan misi mengikuti
        // keanggotaan — selaras cancelResponse, updateLocation, & correctLocation. Ini juga
        // menutup UPDATE 0-baris diam-diam bila pemanggil bukan responder insiden ini, dan
        // membuat responder yang sudah meluncur tetap bisa menuntaskan misinya walau kode
        // wilayahnya berubah/berbeda dari kelurahan insiden.
        $isEnRoute = DB::table($table)
            ->where('report_id', $report->id)
            ->where('user_id', $user->id)
            ->where('status', 'en_route')
            ->exists();

        if (! $isEnRoute) {
            abort(403, 'Hanya responder yang masih "Meluncur" di insiden ini yang bisa menandai Tiba.');
        }

        // Apakah ini kedatangan PERTAMA di insiden ini (di kedua tabel responder)? Dicek
        // sebelum update agar notifikasi "responder tiba" ke pelapor hanya sekali.
        $isFirstArrival = ! DB::table('report_officers')->where('report_id', $report->id)->where('status', 'arrived')->exists()
            && ! DB::table('report_helpers')->where('report_id', $report->id)->where('status', 'arrived')->exists();

        DB::table($table)
            ->where('report_id', $report->id)
            ->where('user_id', $user->id)
            ->update([
                'status' => 'arrived',
                'arrived_at' => now(),
                'updated_at' => now(),
            ]);

        if ($isFirstArrival) {
            $this->notifyReporter($report, 'arrived');
        }

        // Status responder berubah (Meluncur → Tiba) → perbarui manifes di viewer lain.
        broadcast(new ResponderRosterChanged($report->id));

        return back()->with('success', 'Status Anda berhasil diupdate menjadi Tiba.');
    }

    // 4. Saat Petugas Menyatakan Insiden Selesai
    public function resolve($id)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);

        // Pastikan hanya petugas/admin yang bisa selesaikan
        if (! auth()->user()->hasAnyRole(['petugas', 'admin', 'superadmin'])) {
            abort(403, 'Akses Ditolak.');
        }

        DB::transaction(function () use ($report) {
            $report->update(['status' => 'resolved']);

            // Tandai semua relawan & petugas yang berpartisipasi menjadi selesai
            DB::table('report_officers')->where('report_id', $report->id)->update(['status' => 'finished', 'finished_at' => now()]);
            DB::table('report_helpers')->where('report_id', $report->id)->update(['status' => 'finished', 'finished_at' => now()]);

            // Release semua unit yang masih dikerahkan → kembali available (TASK_09).
            $dispatchedUnitIds = DB::table('report_units')->where('report_id', $report->id)->where('status', 'dispatched')->pluck('unit_id');
            if ($dispatchedUnitIds->isNotEmpty()) {
                DB::table('report_units')->where('report_id', $report->id)->where('status', 'dispatched')
                    ->update(['status' => 'released', 'released_at' => now(), 'updated_at' => now()]);
                DB::table('units')->whereIn('id', $dispatchedUnitIds)->update(['status' => 'available', 'updated_at' => now()]);
            }
        });

        // Loop-balik ke pelapor: insiden ditutup.
        $this->notifyReporter($report, 'resolved');
        broadcast(new ReportStatusChanged($report->id, 'resolved'));
        // Semua responder kini 'finished' → segarkan manifes di viewer lain.
        broadcast(new ResponderRosterChanged($report->id));

        return back()->with('success', 'Insiden Selesai Ditangani.');
    }

    // 5. Menerima Titik GPS dari Perangkat Relawan (Dikirim dari React Background)
    public function updateLocation(Request $request, $id)
    {
        $user = auth()->user();
        if (! $user->hasAnyRole(['petugas', 'relawan'])) {
            abort(403, 'Akses Ditolak.');
        }

        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
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
                    'updated_at' => now(),
                ]);

            // 2. SIMPAN JEJAK SEJARAH (Append-Only)
            TrackingLog::create([
                'report_id' => $report->id,
                'user_id' => $user->id,
                'user_type' => $roleType,
                'lat' => $request->lat,
                'lng' => $request->lng,
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
        if (! $user->hasAnyRole(['petugas', 'relawan'])) {
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

        if (! $hasArrived) {
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

    /**
     * Pastikan responder/staf hanya bisa beraksi atas insiden DI WILAYAH penugasannya.
     * Report di-fetch withoutGlobalScopes (bisa dicari lewat ID lintas tenant), jadi batas
     * wilayah harus dicek manual di sini (ATURAN EMAS #7) — selaras dengan siapa yang
     * disiarkan saat approve & scope feed dashboard (FINDINGS #26). Logika yurisdiksi kini
     * berpusat di User::withinReportJurisdiction() (dipakai juga di ReportController::show
     * & channels.php, FINDINGS #31). Superadmin & admin nasional tidak dibatasi.
     */
    private function ensureWithinJurisdiction(Report $report, $user): void
    {
        abort_unless(
            $user->withinReportJurisdiction($report),
            403,
            'Insiden ini di luar wilayah penugasan Anda.'
        );
    }

    /**
     * Kirim notifikasi balik ke PELAPOR (FCM + lonceng web) saat status laporannya berubah.
     * Lewati jika laporan tak punya pelapor (data lama) atau bila aktornya adalah pelapor
     * itu sendiri (mis. petugas yang melapor lalu memproses sendiri — hindari notif ke diri).
     */
    private function notifyReporter(Report $report, string $event): void
    {
        if ($report->user && $report->user_id !== auth()->id()) {
            $report->user->notify(new ReportStatusUpdatedNotification($report, $event));
        }
    }
}

<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Tenant;
use Inertia\Response;

/**
 * Detail TERBATAS "kejadian di sekitar Anda" untuk warga (TASK_89) - tujuan ketuk
 * NearbyIncidentNotification. Sengaja halaman sendiri, bukan cabang baru di
 * ReportController::show: halaman itu memuat nama & HP pelapor/responder, foto, jejak GPS,
 * dan aksi taktis. Di sini hanya kolom yang dipilih eksplisit di bawah - tanpa identitas
 * siapa pun, tanpa foto (keputusan user 2026-11-11), tanpa deskripsi ketikan pelapor.
 */
class NearbyIncidentController extends Controller
{
    public function show($id): Response
    {
        // Bypass Tenantable (aturan emas #7) - gerbangnya canViewNearbyIncident() di bawah.
        $report = Report::withoutGlobalScopes()->findOrFail($id);

        abort_unless(auth()->user()->canViewNearbyIncident($report), 403, 'Kejadian ini tidak berada di sekitar wilayah Anda.');

        $tenant = Tenant::forCity($report->city_code);

        return inertia('Front/Incidents/Show', [
            'incident' => [
                'id' => $report->id,
                'title' => $report->title,
                'incident_type' => $report->incident_type,
                'status' => $report->status,
                'address' => $report->alamatTampil(),
                'lat' => (float) $report->lat,
                'lng' => (float) $report->lng,
                'created_at' => $report->created_at,
                'approved_at' => $report->approved_at,
            ],
            'teleponDarurat' => $tenant?->telepon_darurat ?: '113',
            'namaInstansi' => $tenant?->nama_instansi ?: 'Pemadam Kebakaran & Penyelamatan',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Exports\ReportsExport;
use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    /**
     * Tidak ada withoutGlobalScopes() di sini - daftar laporan tetap lewat
     * scope Tenantable milik Report, jadi setiap admin hanya melihat (dan
     * mengekspor) laporan di wilayah tenant-nya sendiri.
     */
    public function index(Request $request): Response
    {
        $reports = Report::query()
            ->with('user:id,name')
            ->filter($request->only(['search']))
            ->when($request->filled('status') && $request->status !== 'Semua', function ($query) use ($request) {
                $query->where('status', $request->status);
            })
            ->latest('created_at')
            ->paginate($request->load ?? 10)
            ->withQueryString();

        return inertia('Admin/Reports/Index', [
            'reports' => $reports,
            'tenant_location' => $this->getTenantDefaultLocation(),
            'page_settings' => [
                'title' => 'Verifikasi Laporan',
                'subtitle' => 'Pantau dan verifikasi laporan kejadian di wilayah tenant Anda.',
            ],
            'state' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'Semua',
                'load' => $request->load ?? 10,
            ],
        ]);
    }

    /**
     * Pusat peta default = lokasi admin yang login (fallback ke Bali).
     * Selaras dengan Admin\HydrantController::getTenantDefaultLocation().
     */
    private function getTenantDefaultLocation(): array
    {
        $user = auth()->user();

        return [
            'lat' => $user->lat ?? -8.650000,
            'lng' => $user->lng ?? 115.220000,
        ];
    }

    public function export(Request $request): BinaryFileResponse
    {
        return Excel::download(
            new ReportsExport($request->only(['search', 'status'])),
            'laporan-kejadian-'.now()->format('Y-m-d-His').'.xlsx'
        );
    }
}

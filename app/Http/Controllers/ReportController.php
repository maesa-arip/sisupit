<?php

namespace App\Http\Controllers;

use App\Traits\HasFile;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use App\Enums\MessageType;
use App\Enums\TenantLevel;
use App\Http\Requests\ReportRequest;
use App\Models\Report;
use App\Models\Setting;
use App\Models\TrackingLog;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Laravolt\Indonesia\Models\Province;
use Throwable;

class ReportController extends Controller
{
    use HasFile;

    // =========================================================================
    // 1. READ & BROWSE DATA
    // =========================================================================
    public function index()
    {
        $user = auth()->user();

        $query = Report::query()
            ->with(['helpers.user'])
            ->filter(request()->only(['search']))
            ->sorting(request()->only(['field', 'direction']))
            ->latest('created_at');

        if (request('filter') === 'mine') {
            // JALUR 1: Tab "Riwayat Saya" (Bypass Tenantable & Bisa lihat status TERLAPOR miliknya)
            $query->withoutGlobalScopes()->where('user_id', $user->id);
        } else {
            // JALUR 2: Tab "Semua Laporan" (Sembunyikan TERLAPOR & ditolak dari Publik/Relawan;
            // laporan ditolak hanya terlihat staff di arsip + pemilik di Riwayat Saya)
            if (!$user->hasAnyRole(['admin', 'superadmin', 'petugas'])) {
                $query->whereNotIn('status', ['TERLAPOR', 'ditolak']);
            }
        }

        $reports = $query->paginate(request()->load ?? 10)->withQueryString();

        return inertia('Front/Reports/Index', [
            'reports' => $reports,
            'page_settings' => [
                'title' => 'Arsip Laporan',
                'subtitle' => 'Menampilkan semua data laporan operasional.',
            ],
            'state' => [
                'page' => request()->page ?? 1,
                'search' => request()->search ?? '',
                'load' => 10,
            ],
        ]);
    }

    public function show($id)
    {
        // Bypass Tenantable agar bisa dicari via ID
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $user = auth()->user();

        // Hak Akses (Hanya pelapor, petugas, dan relawan yang ikut membantu yang bisa lihat)
        $isReporter = $user->id === $report->user_id;
        $isStaff = $user->hasAnyRole(['admin', 'superadmin', 'petugas']);
        $isHelper = DB::table('report_helpers')->where('report_id', $report->id)->where('user_id', $user->id)->exists();

        if (!$isReporter && !$isStaff && !$isHelper) {
            abort(403, 'Anda tidak memiliki wewenang untuk memantau insiden ini.');
        }

        $report->load([
            'user:id,name,phone',
            'officers.user:id,name,phone',
            'helpers.user:id,name,phone',
            'photos:id,report_id,path',
            'province',
            'city',
            'district',
            'village'
        ]);

        // Jejak yang sudah ditempuh tiap responder yang masih aktif (belum selesai),
        // diurutkan kronologis agar bisa digambar sebagai garis rute berurutan di peta
        // (sesuai desain tracking_logs). Titik 'koreksi_lokasi' bukan jejak responder,
        // jadi tidak ikut.
        $activeResponderIds = $report->officers->where('status', '!=', 'finished')->pluck('user_id')
            ->merge($report->helpers->where('status', '!=', 'finished')->pluck('user_id'))
            ->unique()
            ->values();

        $trails = TrackingLog::query()
            ->where('report_id', $report->id)
            ->whereIn('user_type', ['petugas', 'relawan'])
            ->whereIn('user_id', $activeResponderIds)
            ->orderBy('recorded_at')
            ->get(['user_id', 'lat', 'lng'])
            ->groupBy('user_id')
            ->map(fn ($points) => $points->map(fn ($p) => ['lat' => (float) $p->lat, 'lng' => (float) $p->lng])->values());

        return inertia('Front/Reports/Show', [
            'report' => $report,
            'trails' => $trails,
        ]);
    }

    // =========================================================================
    // 2. CREATE & STORE (SOP: INBOUND)
    // =========================================================================
    public function create(): Response
    {
        $provinces = Province::select('code', 'name')->get();
        return inertia('Front/Reports/Create', [
            'page_settings' => [
                'title' => 'Buat Laporan',
                'subtitle' => 'Buat laporan baru disini. Klik simpan setelah selesai',
                'method' => 'POST',
                'action' => route('front.reports.store'),
            ],
            'provinces' => $provinces
        ]);
    }

    public function store(ReportRequest $request): RedirectResponse
    {
        try {
            // Galeri foto (FINDINGS #17): simpan semua foto; foto pertama jadi sampul
            // (kolom `photo` lama) agar feed/dashboard yang membaca report.photo tetap jalan.
            $photoPaths = [];
            foreach ((array) $request->file('photos', []) as $file) {
                $photoPaths[] = $file->store('reports', 'public');
            }

            $report = Report::create([
                'user_id' => auth()->id(),
                'name' => $request->name,
                'phone' => $request->phone,
                'title' => $request->title,
                'description' => $request->description,
                'lat' => $request->lat,
                'lng' => $request->lng,
                'province_code' => $request->province_code,
                'city_code' => $request->city_code,
                'district_code' => $request->district_code,
                'village_code' => $request->village_code,
                'address' => $request->address,
                'status' => 'TERLAPOR', // Masih Mentah
                'photo' => $photoPaths[0] ?? null,
            ]);

            foreach ($photoPaths as $path) {
                $report->photos()->create(['path' => $path]);
            }

            flashMessage(MessageType::CREATED->message('Laporan'));

            // SOP ANTI HOAX: Notifikasi AWAL HANYA ke PUSAT KOMANDO (Petugas/Admin),
            // disiarkan sesuai tingkat wilayah yang dikonfigurasi admin (cascade naik dari desa laporan).
            $petugasCeiling = TenantLevel::from(
                Setting::getValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::KABUPATEN->value)
            );
            $commandCenterUsers = User::role(['petugas', 'admin', 'superadmin'])
                ->notifiableForReport($report, $petugasCeiling)
                ->whereNot('id', auth()->id())
                ->get();
            if ($commandCenterUsers->isNotEmpty()) {
                Notification::send($commandCenterUsers, new EmergencyAlertNotification($report, 'petugas'));
            }

            return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');
            return to_route('front.reports.create');
        }
    }

    // =========================================================================
    // 3. EDIT, UPDATE, DESTROY (CRUD Standar)
    // =========================================================================
    public function edit($id): Response
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeReportAccess($report);

        return inertia('Front/Reports/Edit', [
            'page_settings' => [
                'title' => 'Edit Laporan',
                'subtitle' => 'Edit laporan disini. Klik simpan setelah selesai',
                'method' => 'PUT',
                'action' => route('front.reports.update', $report->id),
            ],
            'report' => $report,
        ]);
    }

    public function update($id, ReportRequest $request): RedirectResponse
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeReportAccess($report);

        try {
            $report->update([
                'name' => $request->name,
                'phone' => $request->phone,
                'title' => $request->title,
                'description' => $request->description,
                'lat' => $request->lat,
                'lng' => $request->lng,
                'address' => $request->address,
                'photo' => $this->update_file($request, $report, 'photo', 'reports'),
            ]);
            flashMessage(MessageType::UPDATED->message('Laporan'));
            return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');
            return to_route('front.reports.edit', $report->id);
        }
    }

    public function destroy($id): RedirectResponse
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeReportAccess($report);

        try {
            $this->delete_file($report, 'photo');
            $report->delete();
            flashMessage(MessageType::DELETED->message('Laporan ditolak/dihapus'));
            return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');
            return back();
        }
    }

    /**
     * edit/update/destroy bypass Report's Tenantable global scope (so a report can be
     * looked up by ID regardless of tenant), so ownership/staff must be re-checked here -
     * otherwise any authenticated user could edit or delete someone else's report.
     */
    private function authorizeReportAccess(Report $report): void
    {
        $user = auth()->user();
        $isReporter = $user->id === $report->user_id;
        $isStaff = $user->hasAnyRole(['admin', 'superadmin', 'petugas']);

        if (!$isReporter && !$isStaff) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengubah laporan ini.');
        }
    }
}

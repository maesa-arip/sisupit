<?php

namespace App\Http\Controllers;

use App\Traits\HasFile;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use App\Enums\MessageType;
use App\Http\Requests\ReportRequest;
use App\Models\Report;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use App\Notifications\WebPushNotification;
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
            // JALUR 2: Tab "Semua Laporan" (Sembunyikan TERLAPOR dari Publik/Relawan)
            if (!$user->hasAnyRole(['admin', 'superadmin', 'petugas'])) {
                $query->where('status', '!=', 'TERLAPOR');
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
            'province',
            'city',
            'district',
            'village'
        ]);

        return inertia('Front/Reports/Show', [
            'report' => $report
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
                'photo' => $this->upload_file($request, 'photo', 'reports'),
            ]);

            flashMessage(MessageType::CREATED->message('Laporan'));

            // SOP ANTI HOAX: Notifikasi AWAL HANYA ke PUSAT KOMANDO (Petugas/Admin)
            $commandCenterUsers = User::role(['petugas', 'admin', 'superadmin'])->whereNot('id', auth()->id())->get();
            if ($commandCenterUsers->isNotEmpty()) {
                Notification::send($commandCenterUsers, new EmergencyAlertNotification($report));
                // Notification::send($commandCenterUsers, new WebPushNotification($report));
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
}

<?php

namespace App\Http\Controllers;

use App\Enums\MessageType;
use App\Enums\TenantLevel;
use App\Http\Requests\ReportRequest;
use App\Models\Report;
use App\Models\Setting;
use App\Models\TrackingLog;
use App\Models\Unit;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use App\Traits\HasFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Response;
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
            if (! $user->hasAnyRole(['admin', 'superadmin', 'petugas'])) {
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

        // Hak Akses (Hanya pelapor, petugas, dan relawan yang ikut membantu yang bisa lihat).
        // Staf dibatasi ke wilayah laporannya (FINDINGS #31) agar tidak memantau insiden +
        // PII/GPS lintas wilayah; pelapor & helper tetap boleh lewat relasi meski lintas tenant.
        $isReporter = $user->id === $report->user_id;
        $isStaff = $user->hasAnyRole(['admin', 'superadmin', 'petugas']) && $user->withinReportJurisdiction($report);
        $isHelper = DB::table('report_helpers')->where('report_id', $report->id)->where('user_id', $user->id)->exists();
        // Relawan boleh memantau insiden di wilayahnya secara read-only untuk menilai
        // sebelum memutuskan meluncur (alur respons disatukan di halaman detail). Ter-scope
        // yurisdiksi sama dgn radar dashboard; insiden yang sudah ditolak tidak ditampilkan.
        $isRelawanInArea = $user->hasRole('relawan')
            && $report->status !== 'ditolak'
            && $user->withinReportJurisdiction($report);

        if (! $isReporter && ! $isStaff && ! $isHelper && ! $isRelawanInArea) {
            abort(403, 'Anda tidak memiliki wewenang untuk memantau insiden ini.');
        }

        $report->load([
            'user:id,name,phone',
            'officers.user:id,name,phone',
            'helpers.user:id,name,phone',
            'photos:id,report_id,path',
            'reportUnits.unit:id,name,type,status',
            'province',
            'city',
            'district',
            'village',
        ]);

        // Daftar unit yang tersedia untuk dikerahkan — hanya untuk staf, ter-scope wilayah
        // (Tenantable) milik staf yang melihat (sama dengan validasi dispatchUnit).
        // unitsTotal = seluruh unit di wilayah staf (apa pun statusnya), dipakai frontend
        // untuk membedakan "belum ada unit terdaftar" vs "semua unit sedang bertugas".
        $availableUnits = [];
        $unitsTotal = 0;
        $canManageUnits = false;
        if ($isStaff) {
            $availableUnits = Unit::where('status', 'available')->get(['id', 'name', 'type']);
            $unitsTotal = Unit::count();
            $canManageUnits = $user->hasAnyRole(['admin', 'superadmin']);
        }

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
            'availableUnits' => $availableUnits,
            'unitsTotal' => $unitsTotal,
            'canManageUnits' => $canManageUnits,
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
            'provinces' => $provinces,
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
        $this->authorizeReportEdit($report);

        // Backfill foto legacy (pra-TASK_07) ke report_photos agar bisa dikelola di galeri.
        if ($report->photo && $report->photos()->count() === 0) {
            $report->photos()->create(['path' => $report->photo]);
        }
        $report->load('photos:id,report_id,path');

        return inertia('Front/Reports/Edit', [
            'page_settings' => [
                'title' => 'Edit Laporan',
                'subtitle' => 'Perbarui judul, deskripsi, patokan, dan foto. Klik simpan setelah selesai.',
                'method' => 'PUT',
                'action' => route('front.reports.update', $report->id),
            ],
            'report' => $report,
        ]);
    }

    // Edit = konten (judul/deskripsi/patokan) + kelola foto galeri. Lokasi & wilayah TIDAK
    // diubah (keputusan #30). Hanya pelapor & hanya saat status TERLAPOR.
    public function update($id, ReportRequest $request): RedirectResponse
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeReportEdit($report);

        // Pastikan laporan tetap punya minimal satu foto setelah edit.
        $removedIds = $request->input('removed_photos', []);
        $remaining = $report->photos()->whereNotIn('id', $removedIds)->count()
            + count($request->file('photos', []));
        if ($remaining < 1) {
            flashMessage('Laporan harus memiliki minimal satu foto.', 'error');

            return to_route('front.reports.edit', $report->id);
        }

        try {
            DB::transaction(function () use ($report, $request, $removedIds) {
                $report->update([
                    'title' => $request->title,
                    'description' => $request->description,
                    'address' => $request->address,
                ]);

                // Hapus foto galeri terpilih (beserta file di disk).
                if (! empty($removedIds)) {
                    foreach ($report->photos()->whereIn('id', $removedIds)->get() as $photo) {
                        Storage::disk('public')->delete($photo->path);
                        $photo->delete();
                    }
                }

                // Tambah foto baru.
                foreach ((array) $request->file('photos', []) as $file) {
                    $report->photos()->create(['path' => $file->store('reports', 'public')]);
                }

                // Hitung ulang foto sampul (kolom `photo` lama) dari foto tersisa.
                $cover = $report->photos()->orderBy('id')->first();
                $report->update(['photo' => $cover?->path]);
            });

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

        if (! $isReporter && ! $isStaff) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengubah laporan ini.');
        }
    }

    /**
     * Otorisasi edit laporan (#30): HANYA pelapor sendiri & HANYA selama laporan belum
     * divalidasi (status TERLAPOR). Setelah divalidasi/ditolak, laporan terkunci agar data
     * tidak berubah saat penanganan berjalan.
     */
    private function authorizeReportEdit(Report $report): void
    {
        abort_unless($report->user_id === auth()->id(), 403, 'Anda tidak memiliki wewenang untuk mengubah laporan ini.');
        abort_unless($report->status === 'TERLAPOR', 403, 'Laporan yang sudah divalidasi tidak dapat diubah.');
    }
}

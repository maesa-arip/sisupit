<?php

namespace App\Http\Controllers;

use App\Traits\HasFile;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use App\Enums\MessageType;
use App\Http\Requests\ReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Models\User;
use App\Notifications\NewReportNotification;
use App\Notifications\WebPushNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class ReportController extends Controller
{
    use HasFile;

    public function index(): Response
    {
        $reports = Report::query()
            ->select(['id', 'user_id', 'name', 'phone', 'title', 'address', 'status', 'created_at'])
            ->filter(request()->only(['search']))
            ->sorting(request()->only(['field', 'direction']))
            ->latest('created_at')
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Front/Reports/Index', [
            'reports' => ReportResource::collection($reports)->additional([
                'meta' => [
                    'has_pages' => $reports->hasPages(),
                ],
            ]),
            'page_settings' => [
                'title' => 'Laporan',
                'subtitle' => 'Menampilkan semua data laporan yang tersedia pada platform ini',
            ],
            'state' => [
                'page' => request()->page ?? 1,
                'search' => request()->search ?? '',
                'load' => 10,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Front/Reports/Create', [
            'page_settings' => [
                'title' => 'Buat Laporan',
                'subtitle' => 'Buat laporan baru disini. Klik simpan setelah selesai',
                'method' => 'POST',
                'action' => route('front.reports.store'),
            ],
        ]);
    }

    public function store(ReportRequest $request): RedirectResponse
    {
        // $user = User::role(['petugas','relawan'])->get();
        // dd($user);
        try {
            $report = Report::create([
                'user_id' => auth()->user()->id,
                'name' => $request->name,
                'phone' => $request->phone,
                'title' => $request->title,
                'description' => $request->description,
                'location_lat' => $request->location_lat,
                'location_lng' => $request->location_lng,
                'address' => $request->address,
                'status' => 'TERLAPOR',
                'photo' => $this->upload_file($request, 'photo', 'reports'),
            ]);
            flashMessage(MessageType::CREATED->message('Laporan'));

            // Ambil user untuk dinotifikasi
            $user = User::role(['petugas','relawan'])->whereNot('id', auth()->user()->id)->get();

            // Kirim notifikasi jika ada user yang akan dikirimi (Best practice: gunakan queue)
            if ($user->isNotEmpty()) {
                Notification::send($user, new WebPushNotification($report));
            }
            return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('front.reports.create');
        }
    }

    public function edit(Report $report): Response
    {
        return inertia('Front/Reports/Edit', [
            'page_settings' => [
                'title' => 'Edit Laporan',
                'subtitle' => 'Edit laporan disini. Klik simpan setelah selesai',
                'method' => 'PUT',
                'action' => route('front.reports.update', $report),
            ],
            'report' => $report,
        ]);
    }

    public function update(Report $report, ReportRequest $request): RedirectResponse
    {
        try {
            $report->update([
                'name' => $request->name,
                'phone' => $request->phone,
                'title' => $request->title,
                'description' => $request->description,
                'location_lat' => $request->location_lat,
                'location_lng' => $request->location_lng,
                'address' => $request->address,
                'photo' => $this->update_file($request, $report, 'photo', 'reports'),
            ]);
            flashMessage(MessageType::UPDATED->message('Laporan'));

            return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');
            return to_route('front.reports.edit', $report);
        }
    }

    public function destroy(Report $report): RedirectResponse
    {
        try {
            $this->delete_file($report, 'photo');
            $report->delete();
            flashMessage(MessageType::DELETED->message('Laporan'));
            return to_route('dashboard');
        } catch (\Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');
            return to_route('dashboard');
        }
    }
}

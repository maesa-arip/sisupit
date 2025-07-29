<?php

namespace App\Http\Controllers;

use App\Traits\HasFile;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use App\Enums\MessageType;
use App\Http\Requests\ReportRequest;
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
            ->select(['id', 'name', 'slug', 'address', 'email', 'phone', 'created_at'])
            ->filter(request()->only(['search']))
            ->sorting(request()->only(['field', 'direction']))
            ->latest('created_at')
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Front/Reports/Index', [
            'reports' => PublisherResource::collection($reports)->additional([
                'meta' => [
                    'has_pages' => $reports->hasPages(),
                ],
            ]),
            'page_settings' => [
                'title' => 'Penerbit',
                'subtitle' => 'Menampilkan semua data penerbit yang tersedia pada platform ini',
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
            $user = User::role(['petugas','relawan'])->get();
            // $user->notify(new WebPushNotification());
            Notification::send($user, new WebPushNotification($report));
            // Notification::send($user, new NewReportNotification($report));
            return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('front.reports.create');
        }
    }

    public function edit(Publisher $publisher): Response
    {
        return inertia('Admin/Publishers/Edit', [
            'page_settings' => [
                'title' => 'Edit Penerbit',
                'subtitle' => 'Edit penerbit baru disini. Klik simpan setelah selesai',
                'method' => 'PUT',
                'action' => route('admin.publishers.update', $publisher),
            ],
            'publisher' => $publisher,
        ]);
    }

    public function update(Publisher $publisher, PublisherRequest $request): RedirectResponse
    {
        try {
            $publisher->update([
                'name' => $name = $request->name,
                'slug' => $name !== $publisher->name ? str()->lower(str()->slug($name) . str()->random(4)) : $publisher->slug,
                'address' => $request->address,
                'email' => $request->email,
                'phone' => $request->phone,
                'logo' => $this->update_file($request, $publisher, 'logo', 'publishers'),
            ]);
            flashMessage(MessageType::UPDATED->message('Penerbit'));

            return to_route('admin.publishers.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessae()), 'error');

            return to_route('admin.publishers.index');
        }
    }

    public function destroy(Publisher $publisher): RedirectResponse
    {
        try {
            $this->delete_file($publisher, 'logo');
            $publisher->delete();
            flashMessage(MessageType::DELETED->message('Penerbit'));

            return to_route('admin.publishers.index');
        } catch (\Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessae()), 'error');

            return to_route('admin.publishers.index');
        }
    }
}

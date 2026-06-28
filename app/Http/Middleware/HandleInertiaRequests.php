<?php

namespace App\Http\Middleware;

use App\Http\Resources\UserSingleResource;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? new UserSingleResource($request->user()) : null,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash_message' => fn () => [
                'type' => $request->session()->get('type'),
                'message' => $request->session()->get('message'),
            ],
            'announcemet' => fn () => Announcement::query()->where('is_active', true)->first(),
            // Lonceng notifikasi web (FINDINGS #25): daftar terbaru + jumlah belum dibaca.
            'notifications' => fn () => $request->user()
                ? $request->user()->notifications()->latest()->take(8)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'title' => $n->data['title'] ?? 'Notifikasi',
                    'message' => $n->data['message'] ?? $n->data['address'] ?? null,
                    'report_id' => $n->data['report_id'] ?? null,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at,
                ])->all()
                : [],
            'unread_notifications_count' => fn () => $request->user()
                ? $request->user()->unreadNotifications()->count()
                : 0,
        ];
    }
}

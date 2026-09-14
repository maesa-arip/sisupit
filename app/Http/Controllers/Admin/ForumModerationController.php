<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ForumFlag;
use App\Models\ForumPost;
use App\Models\ForumThread;
use App\Notifications\ForumNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Response;

/**
 * Moderasi Forum Tanya Jawab Warga (TASK_54). Route bergerbang role:admin|superadmin.
 *
 * Wilayah dipegang Tenantable pada ForumThread: admin hanya melihat & menindak thread di
 * kabupatennya. Balasan (ForumPost) dan laporan (ForumFlag) tidak ber-Tenantable, jadi keduanya
 * SELALU dicapai lewat thread yang tersaring - `whereHas`/`whereHasMorph` ikut membawa global
 * scope model tujuannya, dan tiap aksi atas post memeriksa thread induknya lebih dulu.
 * Moderator tidak menghapus; ia menyembunyikan dengan alasan, dan itu bisa dipulihkan.
 */
class ForumModerationController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureEnabled($request);
        $tab = in_array($request->query('tab'), ['dilaporkan', 'disembunyikan'], true) ? $request->query('tab') : 'menunggu';

        $threadRow = fn (ForumThread $t) => [
            'id' => $t->id,
            'title' => $t->title,
            'excerpt' => Str::limit($t->body, 220),
            'status' => $t->status,
            'author' => $t->user?->name ?? 'Pengguna',
            'moderation_reason' => $t->moderation_reason,
            'moderator' => $t->moderator?->name,
            'created_at' => $t->created_at,
        ];

        $items = match ($tab) {
            'dilaporkan' => $this->openFlagsQuery()
                ->with(['flaggable' => fn ($morph) => $morph->morphWith([ForumPost::class => ['thread']]), 'user:id,name'])
                ->latest()
                ->get()
                ->groupBy(fn (ForumFlag $f) => $f->flaggable_type.':'.$f->flaggable_id)
                ->map(function ($flags) {
                    $content = $flags->first()->flaggable;
                    $isPost = $content instanceof ForumPost;

                    return [
                        'key' => $flags->first()->flaggable_type.':'.$content->id,
                        'type' => $isPost ? 'post' : 'thread',
                        'id' => $content->id,
                        'thread_id' => $isPost ? $content->forum_thread_id : $content->id,
                        'thread_title' => $isPost ? $content->thread?->title : $content->title,
                        'excerpt' => Str::limit($content->body, 220),
                        'status' => $content->status,
                        'reports' => $flags->map(fn (ForumFlag $f) => [
                            'reason' => ForumFlag::REASONS[$f->reason] ?? $f->reason,
                            'note' => $f->note,
                            'by' => $f->user?->name,
                        ])->values(),
                    ];
                })
                ->values(),
            'disembunyikan' => ForumThread::query()
                ->where('status', ForumThread::STATUS_DISEMBUNYIKAN)
                ->with(['user:id,name', 'moderator:id,name'])
                ->latest('moderated_at')
                ->limit(50)
                ->get()
                ->map($threadRow),
            default => ForumThread::query()
                ->where('status', ForumThread::STATUS_MENUNGGU)
                ->with('user:id,name')
                ->oldest()
                ->limit(50)
                ->get()
                ->map($threadRow),
        };

        return inertia('Admin/Forum/Index', [
            'tab' => $tab,
            'items' => $items,
            'counts' => [
                'menunggu' => ForumThread::query()->where('status', ForumThread::STATUS_MENUNGGU)->count(),
                'dilaporkan' => $this->openFlagsQuery()->get(['flaggable_type', 'flaggable_id'])
                    ->unique(fn ($f) => $f->flaggable_type.':'.$f->flaggable_id)->count(),
            ],
        ]);
    }

    public function approve(Request $request, ForumThread $thread): RedirectResponse
    {
        $this->ensureEnabled($request);
        abort_unless($thread->status === ForumThread::STATUS_MENUNGGU, 422, 'Pertanyaan ini tidak sedang menunggu tinjauan.');

        $thread->update([
            'status' => ForumThread::STATUS_TAMPIL,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'moderation_reason' => null,
            'last_activity_at' => now(),
        ]);

        $thread->user?->notify(new ForumNotification($thread, 'Pertanyaan Anda sudah tayang', Str::limit($thread->title, 80)));
        flashMessage('Pertanyaan disetujui dan kini tayang.');

        return back();
    }

    public function hideThread(Request $request, ForumThread $thread): RedirectResponse
    {
        $this->ensureEnabled($request);
        $this->hide($request, $thread);

        return back();
    }

    public function restoreThread(Request $request, ForumThread $thread): RedirectResponse
    {
        $this->ensureEnabled($request);
        $this->restore($request, $thread, ForumThread::STATUS_TAMPIL);

        return back();
    }

    public function hidePost(Request $request, ForumPost $post): RedirectResponse
    {
        $this->ensureEnabled($request);
        $this->ensurePostInScope($post);
        $this->hide($request, $post);

        return back();
    }

    public function restorePost(Request $request, ForumPost $post): RedirectResponse
    {
        $this->ensureEnabled($request);
        $this->ensurePostInScope($post);
        $this->restore($request, $post, ForumPost::STATUS_TAMPIL);

        return back();
    }

    public function pin(Request $request, ForumThread $thread): RedirectResponse
    {
        $this->ensureEnabled($request);
        abort_unless($thread->status === ForumThread::STATUS_TAMPIL, 422);

        $thread->update(['is_pinned' => ! $thread->is_pinned]);
        flashMessage($thread->is_pinned ? 'Pertanyaan disematkan di atas.' : 'Sematan dilepas.');

        return back();
    }

    /** Menutup laporan tanpa menindak kontennya - laporan yang keliru/tak berdasar. */
    public function dismissFlags(Request $request, string $type, int $id): RedirectResponse
    {
        $this->ensureEnabled($request);
        $content = $this->resolveContent($type, $id);

        $this->resolveFlagsOf($content, $request->user()->id);
        flashMessage('Laporan ditutup tanpa tindakan.');

        return back();
    }

    private function hide(Request $request, ForumThread|ForumPost $content): void
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:300']]);

        $content->update([
            'status' => $content instanceof ForumThread ? ForumThread::STATUS_DISEMBUNYIKAN : ForumPost::STATUS_DISEMBUNYIKAN,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'moderation_reason' => $data['reason'],
        ]);

        if ($content instanceof ForumPost) {
            $thread = $content->thread;
            if ($thread && $thread->accepted_post_id === $content->id) {
                $thread->update(['accepted_post_id' => null]);
            }
        }

        $this->resolveFlagsOf($content, $request->user()->id);
        flashMessage('Konten disembunyikan. Penulis tetap bisa melihat alasannya.');
    }

    private function restore(Request $request, ForumThread|ForumPost $content, string $status): void
    {
        abort_unless($content->status === 'disembunyikan', 422);

        $content->update([
            'status' => $status,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'moderation_reason' => null,
        ]);

        flashMessage('Konten dipulihkan.');
    }

    private function resolveFlagsOf(Model $content, int $moderatorId): void
    {
        ForumFlag::query()
            ->where('flaggable_type', $content::class)
            ->where('flaggable_id', $content->id)
            ->whereNull('resolved_at')
            ->update(['resolved_by' => $moderatorId, 'resolved_at' => now()]);
    }

    /** Laporan terbuka atas konten yang thread-nya terlihat oleh admin ini (Tenantable). */
    private function openFlagsQuery(): Builder
    {
        return ForumFlag::query()
            ->whereNull('resolved_at')
            ->whereHasMorph('flaggable', [ForumThread::class, ForumPost::class], function (Builder $q, string $type) {
                if ($type === ForumPost::class) {
                    $q->whereHas('thread');
                }
            });
    }

    private function resolveContent(string $type, int $id): ForumThread|ForumPost
    {
        if ($type === 'thread') {
            return ForumThread::query()->findOrFail($id);
        }

        abort_unless($type === 'post', 404);
        $post = ForumPost::query()->findOrFail($id);
        $this->ensurePostInScope($post);

        return $post;
    }

    /**
     * ForumPost tak ber-Tenantable, jadi binding-nya menerima id balasan dari kabupaten mana pun.
     * Pengganti proteksinya: thread induk harus terlihat lewat query yang tersaring Tenantable.
     */
    private function ensurePostInScope(ForumPost $post): void
    {
        abort_unless(ForumThread::query()->whereKey($post->forum_thread_id)->exists(), 404);
    }

    private function ensureEnabled(Request $request): void
    {
        abort_unless(ForumThread::enabledFor($request->user()), 404);
    }
}

<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForumPostRequest;
use App\Http\Requests\ForumThreadRequest;
use App\Models\ForumFlag;
use App\Models\ForumPost;
use App\Models\ForumThread;
use App\Models\User;
use App\Notifications\ForumNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Response;

/**
 * Forum Tanya Jawab Warga per kabupaten (TASK_54).
 *
 * Isolasi wilayah seluruhnya dipegang Tenantable pada ForumThread - controller ini TIDAK
 * memakai withoutGlobalScopes() di mana pun. Route binding `{thread}` ikut tersaring,
 * sehingga thread kabupaten lain memulangkan 404, bukan 403 (tak membocorkan keberadaannya).
 * `{post}` TIDAK tersaring (ForumPost tanpa Tenantable) dan selalu diikat ke thread-nya.
 */
class ForumController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $this->ensureEnabled($request);
        $tab = in_array($request->query('tab'), ['belum_dijawab', 'saya'], true) ? $request->query('tab') : 'semua';
        $search = trim((string) $request->query('search', ''));

        $threads = ForumThread::query()
            ->visibleTo($user)
            ->with('user:id,name')
            ->withCount(['posts as replies_count' => fn (Builder $q) => $q->where('status', ForumPost::STATUS_TAMPIL)])
            ->withExists(['posts as has_official_answer' => fn (Builder $q) => $q
                ->where('status', ForumPost::STATUS_TAMPIL)
                ->where('is_official', true)])
            ->when($tab === 'belum_dijawab', fn (Builder $q) => $q
                ->where('status', ForumThread::STATUS_TAMPIL)
                ->whereDoesntHave('posts', fn (Builder $p) => $p->where('status', ForumPost::STATUS_TAMPIL)))
            ->when($tab === 'saya', fn (Builder $q) => $q->where('user_id', $user->id))
            ->when($search !== '', fn (Builder $q) => $q->where('title', 'like', '%'.$search.'%'))
            ->orderByDesc('is_pinned')
            ->orderByDesc('last_activity_at')
            ->paginate(15)
            ->withQueryString();

        return inertia('Forum/Index', [
            'threads' => $threads->through(fn (ForumThread $thread) => [
                'id' => $thread->id,
                'title' => $thread->title,
                'excerpt' => Str::limit($thread->body, 160),
                'status' => $thread->status,
                'is_pinned' => $thread->is_pinned,
                'is_mine' => $thread->user_id === $user->id,
                'author' => $thread->user?->name ?? 'Pengguna',
                'replies_count' => $thread->replies_count,
                'has_official_answer' => (bool) $thread->has_official_answer,
                'has_accepted_answer' => $thread->accepted_post_id !== null,
                'created_at' => $thread->created_at,
                'last_activity_at' => $thread->last_activity_at,
            ]),
            'filters' => ['tab' => $tab, 'search' => $search],
            'wilayah' => $this->namaWilayah($user),
            'canModerate' => ForumThread::canModerate($user),
            'pendingCount' => ForumThread::canModerate($user)
                ? ForumThread::query()->where('status', ForumThread::STATUS_MENUNGGU)->count()
                : 0,
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $this->ensureEnabled($request);

        return inertia('Forum/Create', [
            'wilayah' => $this->namaWilayah($user),
            'needsApproval' => ! ForumThread::canModerate($user),
        ]);
    }

    public function store(ForumThreadRequest $request): RedirectResponse
    {
        $user = $this->ensureEnabled($request);

        // Thread tanpa kabupaten tak terlihat siapa pun (Tenantable), dan superadmin tak punya
        // kabupaten untuk ditanyai. Ditolak terang-terangan alih-alih tersimpan jadi yatim.
        abort_unless($user->city_code, 403, 'Akun Anda belum terikat ke kabupaten/kota mana pun.');

        $isModerator = ForumThread::canModerate($user);

        $thread = ForumThread::create([
            ...$request->validated(),
            'user_id' => $user->id,
            // Pertanyaan warga ditinjau admin lebih dulu (keputusan user 2026-09-14). Admin sendiri
            // tak perlu menyetujui tulisannya sendiri.
            'status' => $isModerator ? ForumThread::STATUS_TAMPIL : ForumThread::STATUS_MENUNGGU,
            'last_activity_at' => now(),
            // Dari AKUN, bukan request. district/village sengaja NULL - lihat migrasinya.
            'province_code' => $user->province_code,
            'city_code' => $user->city_code,
            'district_code' => null,
            'village_code' => null,
        ]);

        if (! $isModerator) {
            $this->notifyModerators($thread);
        }

        flashMessage($isModerator
            ? 'Pertanyaan diterbitkan.'
            : 'Pertanyaan terkirim dan akan tayang setelah ditinjau admin.');

        return to_route('forum.show', $thread);
    }

    public function show(Request $request, ForumThread $thread): Response
    {
        $user = $this->ensureEnabled($request);
        abort_unless($thread->isVisibleTo($user), 404);

        $isModerator = ForumThread::canModerate($user);

        $posts = $thread->posts()
            ->with('user:id,name')
            ->when(! $isModerator, fn ($q) => $q->where(fn ($p) => $p
                ->where('status', ForumPost::STATUS_TAMPIL)
                ->orWhere('user_id', $user->id)))
            ->oldest()
            ->get();

        $thread->load('user:id,name');
        $flaggedIds = ForumFlag::query()
            ->where('user_id', $user->id)
            ->where(fn ($q) => $q
                ->where(fn ($t) => $t->where('flaggable_type', ForumThread::class)->where('flaggable_id', $thread->id))
                ->orWhere(fn ($p) => $p->where('flaggable_type', ForumPost::class)->whereIn('flaggable_id', $posts->pluck('id'))))
            ->get(['flaggable_type', 'flaggable_id']);

        $isFlagged = fn (string $type, int $id) => $flaggedIds->contains(fn ($f) => $f->flaggable_type === $type && $f->flaggable_id === $id);

        return inertia('Forum/Show', [
            'thread' => [
                'id' => $thread->id,
                'title' => $thread->title,
                'body' => $thread->body,
                'status' => $thread->status,
                'is_pinned' => $thread->is_pinned,
                'accepted_post_id' => $thread->accepted_post_id,
                'moderation_reason' => $thread->moderation_reason,
                'author' => $thread->user?->name ?? 'Pengguna',
                'author_roles' => $this->roleNames($thread->user),
                'is_mine' => $thread->user_id === $user->id,
                'flagged_by_me' => $isFlagged(ForumThread::class, $thread->id),
                'created_at' => $thread->created_at,
            ],
            'posts' => $posts->map(fn (ForumPost $post) => [
                'id' => $post->id,
                'body' => $post->body,
                'status' => $post->status,
                'is_official' => $post->is_official,
                'moderation_reason' => $post->moderation_reason,
                'author' => $post->user?->name ?? 'Pengguna',
                'author_roles' => $this->roleNames($post->user),
                'is_mine' => $post->user_id === $user->id,
                'flagged_by_me' => $isFlagged(ForumPost::class, $post->id),
                'created_at' => $post->created_at,
            ]),
            'can' => [
                'reply' => $thread->status === ForumThread::STATUS_TAMPIL,
                'accept' => $thread->user_id === $user->id && $thread->status === ForumThread::STATUS_TAMPIL,
                'moderate' => $isModerator,
                'answerOfficially' => $isModerator,
            ],
            'flagReasons' => ForumFlag::reasonOptions(),
        ]);
    }

    public function reply(ForumPostRequest $request, ForumThread $thread): RedirectResponse
    {
        $user = $this->ensureEnabled($request);
        abort_unless($thread->isVisibleTo($user), 404);
        abort_unless($thread->status === ForumThread::STATUS_TAMPIL, 403, 'Pertanyaan ini belum/tidak bisa dibalas.');

        DB::transaction(function () use ($request, $thread, $user) {
            $thread->posts()->create([
                'user_id' => $user->id,
                'body' => $request->validated('body'),
                // Lencana "Jawaban Resmi Damkar" ditentukan SERVER dari peran - admin saja
                // (keputusan user 2026-09-14). Nilai dari request diabaikan.
                'is_official' => ForumThread::canModerate($user),
                'status' => ForumPost::STATUS_TAMPIL,
            ]);

            $thread->update(['last_activity_at' => now()]);
        });

        if ($thread->user_id !== $user->id && $thread->user) {
            $thread->user->notify(new ForumNotification(
                $thread,
                'Pertanyaan Anda dibalas',
                Str::limit($thread->title, 80),
            ));
        }

        flashMessage('Balasan terkirim.');

        return to_route('forum.show', $thread);
    }

    public function accept(Request $request, ForumThread $thread, ForumPost $post): RedirectResponse
    {
        $user = $this->ensureEnabled($request);
        abort_unless($thread->isVisibleTo($user), 404);
        abort_unless($post->forum_thread_id === $thread->id, 404);
        abort_unless($thread->user_id === $user->id, 403);
        abort_unless($post->status === ForumPost::STATUS_TAMPIL, 422);

        // Tombol yang sama membatalkan pilihan - penanya boleh berubah pikiran.
        $thread->update([
            'accepted_post_id' => $thread->accepted_post_id === $post->id ? null : $post->id,
        ]);

        flashMessage($thread->accepted_post_id ? 'Jawaban ditandai sebagai yang paling membantu.' : 'Tanda jawaban dibatalkan.');

        return to_route('forum.show', $thread);
    }

    public function flagThread(Request $request, ForumThread $thread): RedirectResponse
    {
        $user = $this->ensureEnabled($request);
        abort_unless($thread->isVisibleTo($user), 404);
        abort_if($thread->user_id === $user->id, 403, 'Tidak bisa melaporkan tulisan sendiri.');

        $this->storeFlag($request, $thread, $user);

        return to_route('forum.show', $thread);
    }

    public function flagPost(Request $request, ForumThread $thread, ForumPost $post): RedirectResponse
    {
        $user = $this->ensureEnabled($request);
        abort_unless($thread->isVisibleTo($user), 404);
        abort_unless($post->forum_thread_id === $thread->id, 404);
        abort_if($post->user_id === $user->id, 403, 'Tidak bisa melaporkan tulisan sendiri.');

        $this->storeFlag($request, $post, $user);

        return to_route('forum.show', $thread);
    }

    public function destroyThread(Request $request, ForumThread $thread): RedirectResponse
    {
        $user = $this->ensureEnabled($request);
        abort_unless($thread->isVisibleTo($user), 404);
        // Hanya penulis. Moderator MENYEMBUNYIKAN (berjejak, bisa dipulihkan), tidak menghapus.
        abort_unless($thread->user_id === $user->id, 403);

        $thread->delete();
        flashMessage('Pertanyaan dihapus.');

        return to_route('forum.index');
    }

    public function destroyPost(Request $request, ForumThread $thread, ForumPost $post): RedirectResponse
    {
        $user = $this->ensureEnabled($request);
        abort_unless($thread->isVisibleTo($user), 404);
        abort_unless($post->forum_thread_id === $thread->id, 404);
        abort_unless($post->user_id === $user->id, 403);

        DB::transaction(function () use ($thread, $post) {
            $post->delete();

            if ($thread->accepted_post_id === $post->id) {
                $thread->update(['accepted_post_id' => null]);
            }
        });

        flashMessage('Balasan dihapus.');

        return to_route('forum.show', $thread);
    }

    /**
     * Forum yang belum dinyalakan untuk kabupaten akun ini memulangkan 404 - bukan 403 - supaya
     * tak terbaca sebagai "Anda tak berhak" pada fitur yang memang belum ada di sana.
     */
    private function ensureEnabled(Request $request): User
    {
        $user = $request->user();
        abort_unless(ForumThread::enabledFor($user), 404);

        return $user;
    }

    private function storeFlag(Request $request, ForumThread|ForumPost $content, User $user): void
    {
        $data = $request->validate([
            'reason' => ['required', Rule::in(array_keys(ForumFlag::REASONS))],
            'note' => ['nullable', 'string', 'max:300'],
        ]);

        ForumFlag::firstOrCreate(
            ['flaggable_type' => $content::class, 'flaggable_id' => $content->id, 'user_id' => $user->id],
            ['reason' => $data['reason'], 'note' => $data['note'] ?? null],
        );

        flashMessage('Terima kasih, laporan Anda diteruskan ke admin.');
    }

    /** Admin sekabupaten saja. Superadmin sengaja tidak - ia melayani seluruh kabupaten. */
    private function notifyModerators(ForumThread $thread): void
    {
        $admins = User::role('admin')->where('city_code', $thread->city_code)->get();

        Notification::send($admins, new ForumNotification(
            $thread,
            'Pertanyaan forum menunggu tinjauan',
            Str::limit($thread->title, 80),
        ));
    }

    private function namaWilayah(User $user): ?string
    {
        return $user->city_code
            ? DB::table('indonesia_cities')->where('code', $user->city_code)->value('name')
            : null;
    }

    private function roleNames(?User $user): array
    {
        return $user ? $user->getRoleNames()->all() : [];
    }
}

<?php

use App\Models\ForumFlag;
use App\Models\ForumPost;
use App\Models\ForumThread;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\ForumNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

// Forum Tanya Jawab Warga per kabupaten (TASK_54). Keputusan user 2026-09-14: komunitas warga,
// satu ruang per kabupaten, pertanyaan menunggu admin, Jawaban Resmi dari admin saja, tanpa
// foto, wajib login.
beforeEach(function () {
    DB::table('indonesia_provinces')->insert([['code' => '51', 'name' => 'Bali']]);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5103', 'province_code' => '51', 'name' => 'Kabupaten Badung'],
    ]);

    Tenant::create([
        'subdomain' => 'denpasar', 'city_code' => '5171', 'province_code' => '51',
        'nama_instansi' => 'Damkar Denpasar', 'is_active' => true, 'features' => [Tenant::FEATURE_FORUM],
    ]);
    Tenant::create([
        'subdomain' => 'badung', 'city_code' => '5103', 'province_code' => '51',
        'nama_instansi' => 'Damkar Badung', 'is_active' => true, 'features' => [Tenant::FEATURE_FORUM],
    ]);

    $this->wargaA = forumUser('warga', '5171', '517101', '5171012008');
    $this->wargaB = forumUser('warga', '5171', '517102', '5171022001');
    $this->wargaBadung = forumUser('warga', '5103', '510301', '5103012001');
    $this->admin = forumUser('admin', '5171');
    $this->adminBadung = forumUser('admin', '5103');
    $this->petugas = forumUser('petugas', '5171');
});

function forumUser(string $role, string $city, ?string $district = null, ?string $village = null): User
{
    $user = User::factory()->create([
        'phone' => '081234567890',
        'province_code' => '51',
        'city_code' => $city,
        'district_code' => $district,
        'village_code' => $village,
    ]);
    $user->assignRole($role);

    return $user;
}

function forumThread(User $author, array $overrides = []): ForumThread
{
    return ForumThread::withoutGlobalScope('tenant')->create(array_merge([
        'user_id' => $author->id,
        'title' => 'Bagaimana cara merawat APAR di rumah?',
        'body' => 'APAR saya sudah dua tahun, perlu diisi ulang tidak?',
        'status' => ForumThread::STATUS_TAMPIL,
        'province_code' => $author->province_code,
        'city_code' => $author->city_code,
        'last_activity_at' => now(),
    ], $overrides));
}

it('stores a new citizen question as pending with the region taken from the account, not the request', function () {
    Notification::fake();

    $this->actingAs($this->wargaA)->post(route('forum.store'), [
        'title' => 'Apakah hydrant di banjar kami boleh dipakai warga?',
        'body' => 'Kalau ada kebakaran kecil, bolehkah warga membuka hydrant sendiri?',
        // Upaya memalsukan wilayah & status - wajib diabaikan.
        'city_code' => '5103',
        'village_code' => '5103012001',
        'status' => 'tampil',
    ])->assertRedirect();

    $thread = ForumThread::withoutGlobalScope('tenant')->sole();

    expect($thread->status)->toBe(ForumThread::STATUS_MENUNGGU);
    expect($thread->city_code)->toBe('5171');
    // District & village SENGAJA kosong: Tenantable membacanya "berlaku sekabupaten".
    expect($thread->district_code)->toBeNull();
    expect($thread->village_code)->toBeNull();

    Notification::assertSentTo($this->admin, ForumNotification::class);
    Notification::assertNotSentTo($this->adminBadung, ForumNotification::class);
});

it('shows a thread to citizens of other villages in the same regency but hides it from another regency', function () {
    $thread = forumThread($this->wargaA);

    // Desa berbeda, kabupaten sama: TERLIHAT. Menyimpan village_code penulis akan membuat
    // pertanyaan ini tak pernah terlihat di sini, tanpa galat apa pun.
    $this->actingAs($this->wargaB)->get(route('forum.show', $thread))->assertOk();
    $this->actingAs($this->wargaB)->get(route('forum.index'))
        ->assertInertia(fn ($page) => $page->where('threads.data.0.id', $thread->id));

    // Kabupaten lain: 404 di baca, balas, dan lapor.
    $this->actingAs($this->wargaBadung)->get(route('forum.show', $thread))->assertNotFound();
    $this->actingAs($this->wargaBadung)->post(route('forum.reply', $thread), ['body' => 'Coba ikut jawab'])->assertNotFound();
    $this->actingAs($this->wargaBadung)->post(route('forum.flag', $thread), ['reason' => 'spam'])->assertNotFound();
    $this->actingAs($this->wargaBadung)->get(route('forum.index'))
        ->assertInertia(fn ($page) => $page->has('threads.data', 0));

    expect(ForumPost::count())->toBe(0);
    expect(ForumFlag::count())->toBe(0);
});

it('keeps pending and hidden questions away from other readers but visible to their author', function () {
    $pending = forumThread($this->wargaA, ['status' => ForumThread::STATUS_MENUNGGU]);
    $hidden = forumThread($this->wargaA, ['status' => ForumThread::STATUS_DISEMBUNYIKAN, 'moderation_reason' => 'Menyebar nomor pribadi']);

    $this->actingAs($this->wargaB)->get(route('forum.show', $pending))->assertNotFound();
    $this->actingAs($this->wargaB)->get(route('forum.show', $hidden))->assertNotFound();
    $this->actingAs($this->wargaB)->get(route('forum.index'))
        ->assertInertia(fn ($page) => $page->has('threads.data', 0));

    $this->actingAs($this->wargaA)->get(route('forum.show', $hidden))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('thread.moderation_reason', 'Menyebar nomor pribadi'));

    // Pertanyaan yang belum tayang tak bisa dibalas, termasuk oleh penulisnya.
    $this->actingAs($this->wargaA)->post(route('forum.reply', $pending), ['body' => 'Tambahan info'])->assertForbidden();
});

it('marks only admin replies as official, whatever the request claims', function () {
    Notification::fake();
    $thread = forumThread($this->wargaA);

    $this->actingAs($this->petugas)->post(route('forum.reply', $thread), ['body' => 'Isi ulang tiap tahun.', 'is_official' => true]);
    $this->actingAs($this->admin)->post(route('forum.reply', $thread), ['body' => 'Resmi: periksa tekanan tiap 6 bulan.']);

    expect(ForumPost::where('user_id', $this->petugas->id)->value('is_official'))->toBeFalsy();
    expect(ForumPost::where('user_id', $this->admin->id)->value('is_official'))->toBeTruthy();

    Notification::assertSentTo($this->wargaA, ForumNotification::class);
});

it('lets only admins of the same regency moderate', function () {
    $pending = forumThread($this->wargaA, ['status' => ForumThread::STATUS_MENUNGGU]);

    $this->actingAs($this->wargaB)->post(route('admin.forum.threads.approve', $pending))->assertForbidden();
    $this->actingAs($this->petugas)->post(route('admin.forum.threads.approve', $pending))->assertForbidden();
    $this->actingAs($this->adminBadung)->post(route('admin.forum.threads.approve', $pending))->assertNotFound();
    expect($pending->fresh()->status)->toBe(ForumThread::STATUS_MENUNGGU);

    $this->actingAs($this->admin)->post(route('admin.forum.threads.approve', $pending))->assertRedirect();
    expect($pending->fresh()->status)->toBe(ForumThread::STATUS_TAMPIL);
    expect($pending->fresh()->moderated_by)->toBe($this->admin->id);
});

it('refuses cross-regency moderation of a reply, which has no region of its own', function () {
    $thread = forumThread($this->wargaA);
    $post = $thread->posts()->create(['user_id' => $this->wargaB->id, 'body' => 'Balasan', 'status' => ForumPost::STATUS_TAMPIL]);

    $this->actingAs($this->adminBadung)
        ->post(route('admin.forum.posts.hide', $post), ['reason' => 'Coba sembunyikan dari luar'])
        ->assertNotFound();
    expect($post->fresh()->status)->toBe(ForumPost::STATUS_TAMPIL);

    $this->actingAs($this->admin)
        ->post(route('admin.forum.posts.hide', $post), ['reason' => 'Mengandung hoaks'])
        ->assertRedirect();
    expect($post->fresh()->status)->toBe(ForumPost::STATUS_DISEMBUNYIKAN);
    expect($post->fresh()->moderation_reason)->toBe('Mengandung hoaks');
});

it('requires a reason to hide content and closes the open reports on it', function () {
    $thread = forumThread($this->wargaA);
    $this->actingAs($this->wargaB)->post(route('forum.flag', $thread), ['reason' => 'hoaks'])->assertRedirect();

    $this->actingAs($this->admin)->post(route('admin.forum.threads.hide', $thread), ['reason' => ''])
        ->assertSessionHasErrors('reason');

    $this->actingAs($this->admin)->post(route('admin.forum.threads.hide', $thread), ['reason' => 'Informasi keliru soal nomor darurat']);

    expect($thread->fresh()->status)->toBe(ForumThread::STATUS_DISEMBUNYIKAN);
    expect(ForumFlag::sole()->resolved_by)->toBe($this->admin->id);
});

it('does not let users report their own content or report the same content twice', function () {
    $thread = forumThread($this->wargaA);

    $this->actingAs($this->wargaA)->post(route('forum.flag', $thread), ['reason' => 'spam'])->assertForbidden();

    $this->actingAs($this->wargaB)->post(route('forum.flag', $thread), ['reason' => 'spam']);
    $this->actingAs($this->wargaB)->post(route('forum.flag', $thread), ['reason' => 'kasar']);

    expect(ForumFlag::count())->toBe(1);
});

it('hides the forum entirely where the regency has not switched it on', function () {
    Tenant::where('city_code', '5103')->update(['features' => json_encode([])]);
    cache()->flush();

    $this->actingAs($this->wargaBadung)->get(route('forum.index'))->assertNotFound();
    $this->actingAs($this->wargaBadung)->post(route('forum.store'), ['title' => 'Judul pertanyaan panjang', 'body' => 'Isi pertanyaan panjang'])->assertNotFound();

    $this->actingAs($this->wargaBadung)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('auth.user.forum_enabled', false));
    $this->actingAs($this->wargaA)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('auth.user.forum_enabled', true));
});

it('requires login to read the forum', function () {
    $thread = forumThread($this->wargaA);

    $this->get(route('forum.index'))->assertRedirect(route('login'));
    $this->get(route('forum.show', $thread))->assertRedirect(route('login'));
});

it('lets the asker mark one reply as the most helpful and only the asker', function () {
    $thread = forumThread($this->wargaA);
    $post = $thread->posts()->create(['user_id' => $this->wargaB->id, 'body' => 'Isi ulang tiap tahun', 'status' => ForumPost::STATUS_TAMPIL]);

    $this->actingAs($this->wargaB)->post(route('forum.posts.accept', [$thread, $post]))->assertForbidden();
    $this->actingAs($this->wargaA)->post(route('forum.posts.accept', [$thread, $post]))->assertRedirect();

    expect($thread->fresh()->accepted_post_id)->toBe($post->id);
});

it('rate limits new questions', function () {
    Notification::fake();

    foreach (range(1, 5) as $i) {
        $this->actingAs($this->wargaA)->post(route('forum.store'), [
            'title' => "Pertanyaan kesiapsiagaan nomor {$i}",
            'body' => 'Isi pertanyaan yang cukup panjang.',
        ])->assertRedirect();
    }

    $this->actingAs($this->wargaA)->post(route('forum.store'), [
        'title' => 'Pertanyaan kesiapsiagaan keenam',
        'body' => 'Isi pertanyaan yang cukup panjang.',
    ])->assertStatus(429);
});

// Wrapper Android memilih channel suara dari payload dan payload tak dikenal jatuh ke SIRINE
// (TASK_50); .exe Pusat Komando mendengar Reverb dengan aturan yang sama. Notifikasi forum yang
// ikut lewat FCM/broadcast = balasan forum membunyikan sirine.
it('never sends forum notifications over push or websocket channels', function () {
    $channels = (new ForumNotification(forumThread($this->wargaA), 'Judul', 'Pesan'))->via($this->wargaA);

    expect($channels)->toBe(['database']);
});

it('only accepts known feature keys for a tenant and can switch the last one off', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');
    $tenant = Tenant::where('city_code', '5171')->first();

    $payload = [
        'subdomain' => 'denpasar', 'city_code' => '5171', 'province_code' => '51',
        'nama_instansi' => 'Damkar Denpasar', 'edition' => 'sewa', 'is_active' => true,
        '_method' => 'PUT',
    ];

    $this->actingAs($superadmin)->post(route('admin.tenants.update', $tenant), [...$payload, 'features_sent' => '1', 'features' => ['forum-typo']])
        ->assertSessionHasErrors('features.0');

    // FormData tidak memuat array kosong - tanpa penanda features_sent, mematikan fitur terakhir
    // tak pernah tersimpan.
    $this->actingAs($superadmin)->post(route('admin.tenants.update', $tenant), [...$payload, 'features_sent' => '1']);

    expect($tenant->fresh()->features)->toBe([]);
});

// Komentar dibuang lebih dulu (pelajaran #108): berkas yang menjelaskan larangan ini menyebut
// nama atribut terlarangnya di komentarnya sendiri.
function forumSource(string $relative): string
{
    $source = file_get_contents(base_path($relative));

    return preg_replace(['#/\*.*?\*/#s', '#(^|[^:])//.*$#m', '#\{/\*.*?\*/\}#s'], ['', '$1', ''], $source);
}

it('renders user-written forum text as plain text, never as HTML', function () {
    foreach (['resources/js/Pages/Forum/Show.jsx', 'resources/js/Pages/Forum/Partials/ForumParts.jsx', 'resources/js/Pages/Admin/Forum/Index.jsx'] as $file) {
        expect(forumSource($file))->not->toMatch('/dangerouslySetInnerHTML/');
    }
});

// Risiko terbesar forum di aplikasi pemadam: kejadian yang sedang berlangsung ditulis di tempat
// yang tak memicu verifikasi, siaran, maupun sirine.
it('keeps the emergency guard on the forum list and on every place a citizen can write', function () {
    foreach (['resources/js/Pages/Forum/Index.jsx', 'resources/js/Pages/Forum/Create.jsx'] as $file) {
        expect(forumSource($file))->toMatch('/<EmergencyNotice\b/');
    }

    foreach (['resources/js/Pages/Forum/Create.jsx', 'resources/js/Pages/Forum/Show.jsx'] as $file) {
        expect(forumSource($file))->toMatch('/\bcontainsEmergencyWords\(/')->toMatch('/<EmergencyConfirmDialog\b/');
    }
});

// #122 (2026-09-14, dilaporkan user: "tidak berhasil disimpan, tidak ada error apa2 hanya diam saja").
// Judul < 10 karakter DITOLAK server dengan benar, tapi pesannya hanya dirender tepat di bawah isian
// judul, form dikirim dengan preserveScroll, dan onError lama sengaja tak memunculkan toast selama
// ada galat per isian. Di ponsel pesan itu jatuh TEPAT DI BAWAH HEADER STICKY - dibuktikan lewat
// elementFromPoint di Chrome 390x844 - jadi tombol diketuk dan layar tidak berubah sama sekali.
// Semuanya hidup di berkas JSX, maka penjaganya membaca sumbernya (komentar dibuang lebih dulu:
// berkas-berkas itu MENJELASKAN pola lama yang dilarang di sini, pelajaran #108).
it('announces forum validation errors where the user is looking, on every forum form', function () {
    $forms = ['resources/js/Pages/Forum/Create.jsx', 'resources/js/Pages/Forum/Show.jsx'];

    foreach ($forms as $file) {
        $source = forumSource($file);

        // Galat per isian wajib lewat pengumum bersama, dan tidak boleh lagi DIBUNGKAM oleh bentuk
        // lama "toast hanya bila tak ada galat per isian".
        expect($source)->toMatch('/onError:\s*\(errs\)\s*=>\s*\{\s*if\s*\(announceFormErrors\(errs,/')
            ->and($source)->not->toMatch('/!errs\.(title|body)\b/');

        // Pengumum menggulir ke isian lewat id-nya; id yang tak ada di berkas membuat guliran itu
        // diam-diam tak terjadi. Jadi setiap id yang disebut wajib benar-benar dirender.
        preg_match('/announceFormErrors\(errs,\s*\{([^}]*)\}\)/', $source, $call);
        preg_match_all("/(\w+):\s*'([^']+)'/", $call[1] ?? '', $pairs, PREG_SET_ORDER);
        expect($pairs)->not->toBeEmpty();
        foreach ($pairs as [, , $id]) {
            expect($source)->toMatch('/\bid="'.preg_quote($id, '/').'"/');
        }
    }

    // Pengumumnya sendiri: toast (sonner berada di atas header) DAN guliran ke TENGAH layar -
    // `start` akan menaruh isiannya kembali di bawah header sticky.
    preg_match('/export function announceFormErrors\([^)]*\)\s*\{([\s\S]*?)\n\}/', forumSource('resources/js/lib/forum.js'), $fn);
    expect($fn[1] ?? '')->toMatch('/\btoast\.error\(/')
        ->and($fn[1] ?? '')->toMatch("/scrollIntoView\(\{[^}]*block:\s*'center'/");
});

// Batas minimal wajib terlihat SEBELUM mengirim, dan angkanya wajib sama dengan yang ditegakkan
// server. Kedua angka DITARIK dari kedua berkas lalu diadu - bukan ditulis ulang di test ini
// (pelajaran #79: test yang mengulang angka yang sama di dua tempat tidak menjaga apa pun).
it('discloses the same forum length limits the server enforces', function () {
    $request = file_get_contents(app_path('Http/Requests/ForumThreadRequest.php'));
    $lib = forumSource('resources/js/lib/forum.js');
    $create = forumSource('resources/js/Pages/Forum/Create.jsx');

    foreach (['title' => 'threadTitle', 'body' => 'threadBody'] as $field => $limitKey) {
        preg_match("/'{$field}'\s*=>\s*\[[^\]]*'min:(\d+)'[^\]]*'max:(\d+)'/", $request, $server);
        preg_match("/{$limitKey}:\s*\{\s*min:\s*(\d+),\s*max:\s*(\d+)\s*\}/", $lib, $client);

        expect($server)->toHaveCount(3)
            ->and($client)->toHaveCount(3)
            ->and([$client[1], $client[2]])->toBe([$server[1], $server[2]]);

        expect($create)->toMatch('/lengthHint\(data\.'.$field.',\s*FORUM_LIMITS\.'.$limitKey.'\)/')
            ->and($create)->toMatch('/maxLength=\{FORUM_LIMITS\.'.$limitKey.'\.max\}/');
    }

    // Penghitungnya menyebut batas MINIMAL, bukan cuma "n/maks".
    expect($lib)->toMatch('/export const lengthHint = [^\n]*min\. \$\{min\}/');
});

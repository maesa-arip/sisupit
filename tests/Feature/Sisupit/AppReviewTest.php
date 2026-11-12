<?php

use App\Exports\AppReviewsExport;
use App\Models\AppReview;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Ulasan aplikasi (TASK_86, keputusan user 2026-11-01): ulasan masuk ke database Sisupit (bukan
 * Play Store/App Store), muncul di semua platform, semua peran boleh, tamu tidak, dan ulasan yang
 * diizinkan pemilik + disetujui admin tampil sebagai testimoni di halaman depan.
 */
function ulasanUser(string $role, string $city = '5171', array $overrides = []): User
{
    $user = User::factory()->create(array_merge([
        'phone' => '081234567890',
        'province_code' => '51',
        'city_code' => $city,
        'district_code' => '517101',
        'village_code' => '5171012008',
        'created_at' => now()->subDays(30),
    ], $overrides));
    $user->assignRole($role);

    return $user;
}

/** Superadmin tanpa wilayah (lintas kabupaten) - satu-satunya pemegang /admin/app-reviews. */
function ulasanSuperadmin(): User
{
    return ulasanUser('superadmin', '5171', ['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null]);
}

/** Laporan milik $userId (pelapor) dengan status tertentu, di wilayah ulasanUser(). */
function laporanUlasan(?int $userId, string $status = 'resolved'): Report
{
    return Report::withoutGlobalScopes()->create([
        'user_id' => $userId, 'name' => 'Pelapor', 'phone' => '0812', 'title' => 'Kebakaran',
        'incident_type' => 'rumah', 'description' => 'Api', 'address' => 'Jl. Uji',
        'lat' => '-8.7', 'lng' => '115.2', 'status' => $status,
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012008',
    ]);
}

function kirimUlasan($test, User $user, array $data = [], string $agent = 'Mozilla/5.0 (Windows NT 10.0) Chrome/130')
{
    return $test->actingAs($user)
        ->withHeader('User-Agent', $agent)
        ->post(route('app-review.store'), array_merge(['rating' => 5, 'comment' => 'Sangat membantu.'], $data));
}

it('stores one review per user with platform and role snapshots', function () {
    $warga = ulasanUser('warga');

    kirimUlasan($this, $warga, ['tags' => ['mudah_dipakai'], 'allow_public' => true])
        ->assertSessionHasNoErrors()->assertRedirect();

    $review = AppReview::ownedBy($warga);
    expect($review->rating)->toBe(5)
        ->and($review->tags)->toBe(['mudah_dipakai'])
        ->and($review->platform)->toBe('web')
        ->and($review->role)->toBe('warga')
        ->and($review->city_code)->toBe('5171')
        ->and($review->allow_public)->toBeTrue();

    // Mengulas lagi = menimpa baris yang sama, bukan baris kedua.
    kirimUlasan($this, $warga, ['rating' => 3], 'Mozilla/5.0 (Linux; Android 14) SisupitApp');
    expect(AppReview::withoutGlobalScopes()->where('user_id', $warga->id)->count())->toBe(1)
        ->and(AppReview::ownedBy($warga)->rating)->toBe(3)
        ->and(AppReview::ownedBy($warga)->platform)->toBe('android');
});

it('recognises every platform from the user agent token', function (string $agent, string $platform) {
    $user = ulasanUser('relawan');

    kirimUlasan($this, $user, [], $agent)->assertSessionHasNoErrors();

    expect(AppReview::ownedBy($user)->platform)->toBe($platform);
})->with([
    'android' => ['Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 SisupitApp', 'android'],
    'iphone' => ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 SisupitApp', 'ios'],
    'ipad' => ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 SisupitApp', 'ios'],
    'desktop' => ['Mozilla/5.0 (Windows NT 10.0) Chrome/130 SisupitDesktop/1.0.3', 'desktop'],
    'browser' => ['Mozilla/5.0 (Windows NT 10.0) Chrome/130 Safari/537.36', 'web'],
]);

it('lets every role review but never a guest', function () {
    foreach (array_keys(AppReview::ROLES) as $role) {
        kirimUlasan($this, ulasanUser($role))->assertSessionHasNoErrors();
    }
    expect(AppReview::withoutGlobalScopes()->count())->toBe(count(AppReview::ROLES));

    auth()->logout();
    $this->post(route('app-review.store'), ['rating' => 5])->assertRedirect(route('login'));
    expect(AppReview::withoutGlobalScopes()->count())->toBe(count(AppReview::ROLES));
});

it('rejects a missing rating and unknown tags', function () {
    $warga = ulasanUser('warga');

    kirimUlasan($this, $warga, ['rating' => 0])->assertSessionHasErrors('rating');
    kirimUlasan($this, $warga, ['tags' => ['bukan_tag']])->assertSessionHasErrors('tags.0');
    kirimUlasan($this, $warga, ['comment' => str_repeat('a', AppReview::COMMENT_MAX + 1)])->assertSessionHasErrors('comment');

    expect(AppReview::ownedBy($warga))->toBeNull();
});

it('asks only after an incident the user reported is resolved, and respects later and never', function () {
    // #239 (keputusan user 2026-11-09): umur akun tak lagi cukup - harus ada kejadian Selesai.
    $lama = ulasanUser('warga');
    expect(AppReview::shouldAsk($lama))->toBeFalse();

    $berjalan = laporanUlasan($lama->id, 'handling');
    expect(AppReview::shouldAsk($lama))->toBeFalse();

    $berjalan->update(['status' => 'resolved']);
    expect(AppReview::shouldAsk($lama))->toBeTrue();

    $this->actingAs($lama)->post(route('app-review.dismiss'), ['never' => false])->assertRedirect();
    expect(AppReview::shouldAsk($lama))->toBeFalse();

    DB::table('app_review_prompts')->where('user_id', $lama->id)->update(['dismissed_at' => now()->subDays(AppReview::SNOOZE_DAYS + 1)]);
    expect(AppReview::shouldAsk($lama))->toBeTrue();

    $this->actingAs($lama)->post(route('app-review.dismiss'), ['never' => true]);
    DB::table('app_review_prompts')->where('user_id', $lama->id)->update(['dismissed_at' => now()->subYear()]);
    expect(AppReview::shouldAsk($lama))->toBeFalse();

    // Sesudah mengulas, tak pernah ditanya lagi.
    $sudah = ulasanUser('warga');
    laporanUlasan($sudah->id);
    kirimUlasan($this, $sudah);
    expect(AppReview::shouldAsk($sudah))->toBeFalse();

    $demo = ulasanUser('warga', '5171', ['is_demo' => true]);
    laporanUlasan($demo->id);
    expect(AppReview::shouldAsk($demo))->toBeFalse();
});

it('asks a responder only after the incident they handled is resolved, never mid-mission', function (string $table, string $role) {
    $responder = ulasanUser($role);
    $report = laporanUlasan(ulasanUser('warga')->id, 'handling');
    DB::table($table)->insert([
        'report_id' => $report->id, 'user_id' => $responder->id, 'status' => 'en_route',
        'created_at' => now(), 'updated_at' => now(),
    ]);

    expect(AppReview::shouldAsk($responder))->toBeFalse();

    // Tiba di TKP, insiden belum Selesai: tetap tidak.
    DB::table($table)->where('user_id', $responder->id)->update(['status' => 'arrived']);
    expect(AppReview::shouldAsk($responder))->toBeFalse();

    // Insiden ditutup (resolve() menandai semua baris penanganan `finished`).
    $report->update(['status' => 'resolved']);
    DB::table($table)->where('user_id', $responder->id)->update(['status' => 'finished']);
    expect(AppReview::shouldAsk($responder))->toBeTrue()
        ->and(AppReview::shouldAsk($responder, $report))->toBeTrue();

    // Petugas lain yang tidak ikut menangani: tidak diajak.
    expect(AppReview::shouldAsk(ulasanUser($role)))->toBeFalse();
})->with([['report_officers', 'petugas'], ['report_helpers', 'relawan']]);

it('sends the prompt prop on the dashboard and on the detail of a resolved incident only', function () {
    $warga = ulasanUser('warga');

    $this->actingAs($warga)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('appReviewPrompt', null));

    $selesai = laporanUlasan($warga->id);
    $berjalan = laporanUlasan($warga->id, 'handling');

    $this->actingAs($warga)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->whereNot('appReviewPrompt', null)->has('appReviewPrompt.tags'));

    $this->actingAs($warga)->get(route('reports.show', $selesai->id))
        ->assertInertia(fn (Assert $page) => $page->whereNot('appReviewPrompt', null));

    // Insiden yang masih berjalan: tidak ada ajakan, walau kejadian lain sudah Selesai.
    $this->actingAs($warga)->get(route('reports.show', $berjalan->id))
        ->assertInertia(fn (Assert $page) => $page->where('appReviewPrompt', null));

    // Admin yang membuka detail kejadian orang lain tidak diajak di sana.
    $this->actingAs(ulasanUser('admin'))->get(route('reports.show', $selesai->id))
        ->assertInertia(fn (Assert $page) => $page->where('appReviewPrompt', null));

    $this->actingAs($warga)->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('appReviewPrompt', null)->where('appReview.mine', null));
});

it('limits the review page to superadmin and blocks admin and other roles', function () {
    kirimUlasan($this, ulasanUser('warga', '5171'), ['comment' => 'Denpasar']);
    kirimUlasan($this, ulasanUser('warga', '5103', ['district_code' => '510301', 'village_code' => '5103012001']), ['comment' => 'Badung']);
    $review = AppReview::withoutGlobalScopes()->where('city_code', '5171')->first();

    // Sejak 2026-11-13 admin kabupaten tak lagi memegang ulasan (superadmin saja).
    $admin = ulasanUser('admin', '5171', ['district_code' => null, 'village_code' => null]);
    $this->actingAs($admin)->get(route('admin.app-reviews.index'))->assertForbidden();
    $this->actingAs($admin)->get(route('admin.app-reviews.export'))->assertForbidden();
    $this->actingAs($admin)->post(route('admin.app-reviews.publish', $review))->assertForbidden();

    $superadmin = ulasanSuperadmin();
    $this->actingAs($superadmin)->get(route('admin.app-reviews.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/AppReviews/Index')
            ->has('reviews.data', 2)
            ->where('summary.total', 2));

    $this->actingAs(ulasanUser('petugas'))->get(route('admin.app-reviews.index'))->assertForbidden();
});

it('publishes a testimonial only with consent and admin approval', function () {
    $warga = ulasanUser('warga', '5171', ['name' => 'I Wayan Sudarta']);
    $admin = ulasanSuperadmin();

    kirimUlasan($this, $warga, ['comment' => 'Petugas cepat datang.', 'allow_public' => false]);
    $review = AppReview::ownedBy($warga);

    // Tanpa izin pemilik, admin tak bisa menayangkannya.
    $this->actingAs($admin)->post(route('admin.app-reviews.publish', $review))->assertStatus(422);

    kirimUlasan($this, $warga, ['comment' => 'Petugas cepat datang.', 'allow_public' => true]);
    $this->actingAs($admin)->post(route('admin.app-reviews.publish', $review))->assertRedirect();
    expect($review->fresh()->approved_at)->not->toBeNull();

    auth()->logout();
    $this->get(route('home.landing.page'))
        ->assertInertia(fn (Assert $page) => $page->has('testimonials', 1)
            ->where('testimonials.0.name', 'Wayan S.')
            ->where('testimonials.0.comment', 'Petugas cepat datang.')
            ->where('testimonials.0.role', 'warga'));
    $this->get(route('home.spotlight'))
        ->assertInertia(fn (Assert $page) => $page->has('testimonials', 1));

    // Komentar diubah sesudah disetujui = kembali menunggu tinjauan.
    kirimUlasan($this, $warga, ['comment' => 'Teks lain.', 'allow_public' => true]);
    expect($review->fresh()->approved_at)->toBeNull();
    $this->actingAs($admin)->post(route('admin.app-reviews.publish', $review));

    // Rating saja yang berubah = tetap tayang.
    kirimUlasan($this, $warga, ['rating' => 4, 'comment' => 'Teks lain.', 'allow_public' => true]);
    expect($review->fresh()->approved_at)->not->toBeNull();

    // Izin dicabut = turun.
    kirimUlasan($this, $warga, ['comment' => 'Teks lain.', 'allow_public' => false]);
    expect($review->fresh()->approved_at)->toBeNull();
});

it('never publishes a demo account review', function () {
    $demo = ulasanUser('warga', '5171', ['is_demo' => true]);
    $admin = ulasanSuperadmin();
    kirimUlasan($this, $demo, ['allow_public' => true]);

    $this->actingAs($admin)->post(route('admin.app-reviews.publish', AppReview::ownedBy($demo)))->assertStatus(422);
    $this->actingAs($admin)->get(route('admin.app-reviews.index'))
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 0)->has('reviews.data', 1));
});

it('strips the comment and testimonial when the account is deleted', function () {
    $warga = ulasanUser('warga');
    kirimUlasan($this, $warga, ['comment' => 'Saya Wayan dari Banjar Uji.', 'allow_public' => true]);
    AppReview::ownedBy($warga)->update(['approved_at' => now()]);

    $this->actingAs($warga)->delete('/profile', ['password' => 'password'])->assertSessionHasNoErrors();

    $review = AppReview::withoutGlobalScopes()->where('user_id', $warga->id)->first();
    expect($review->rating)->toBe(5)
        ->and($review->comment)->toBeNull()
        ->and($review->allow_public)->toBeFalse()
        ->and($review->approved_at)->toBeNull()
        ->and(AppReview::testimonials(null))->toBe([]);
});

it('exports the filtered reviews of the admin region', function () {
    Excel::fake();
    kirimUlasan($this, ulasanUser('warga'), ['rating' => 2]);
    $admin = ulasanSuperadmin();

    $this->actingAs($admin)->get(route('admin.app-reviews.export', ['rating' => '2']))->assertOk();

    Excel::assertDownloaded('ulasan-aplikasi-'.now(config('app.local_timezone'))->format('Ymd-Hi').'.xlsx',
        fn (AppReviewsExport $export) => $export->query()->count() === 1);
});

it('keeps the export role labels identical to ROLE_LABELS in lib/utils.js', function () {
    preg_match('/export const ROLE_LABELS = \[(.*?)\n\];/s', file_get_contents(resource_path('js/lib/utils.js')), $block);
    preg_match_all("/role: '([^']+)', label: '([^']+)'/", $block[1], $pairs);

    expect(AppReview::ROLES)->toBe(array_combine($pairs[1], $pairs[2]));
});

it('renders the prompt in the layout content flow and the testimonials on the front pages', function () {
    $layout = file_get_contents(resource_path('js/Layouts/AppLayout.jsx'));
    $prompt = file_get_contents(resource_path('js/Components/AppReview/AppReviewPrompt.jsx'));

    expect($layout)->toContain('<AppReviewPrompt review={appReviewPrompt} />')
        // Kartu di alur halaman, bukan lapisan yang menghadang (aplikasi darurat).
        ->and($prompt)->not->toMatch('/className="[^"]*\b(fixed|sticky)\b/')
        ->and(file_get_contents(resource_path('js/Pages/Spotlight.jsx')))->toContain('<Testimonials items={props.testimonials}')
        ->and(file_get_contents(resource_path('js/Pages/Landing.jsx')))->toContain('<Testimonials items={testimonials}');
});

// #236 sempat menyembunyikan form ulasan (2026-11-06); #239 (2026-11-09) menyalakannya lagi.
// Flag tetap satu-satunya saklar tampilan untuk kartu ajakan & kartu Profil.
it('shows the review form surfaces behind one flag while the server stays intact', function () {
    $flags = file_get_contents(resource_path('js/Components/AppReview/flags.js'));
    $layout = file_get_contents(resource_path('js/Layouts/AppLayout.jsx'));
    $profile = file_get_contents(resource_path('js/Pages/Profile/Edit.jsx'));

    expect($flags)->toContain('export const SHOW_APP_REVIEW_FORM = true;')
        ->and($layout)->toContain('{SHOW_APP_REVIEW_FORM && appReviewPrompt')
        ->and($profile)->toContain('{SHOW_APP_REVIEW_FORM && (')
        ->and(app('router')->has('admin.app-reviews.index'))->toBeTrue();
});

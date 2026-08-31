<?php

use App\Events\ReportFeedChanged;
use App\Models\Agency;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * Dashboard yang memperbarui diri sendiri saat ada kejadian.
 *
 * Dua sisi yang dijaga berkas ini, dan keduanya harus tetap SEJALAN:
 * 1. `User::reportFeedChannel()` menentukan channel mana yang didengar sebuah akun, dan
 *    `routes/channels.php` mengotorisasi dengan membandingkan ke fungsi yang sama.
 * 2. `ReportFeedChanged::for()` menentukan channel mana yang dibangunkan sebuah laporan.
 *
 * Kalau keduanya menyimpang, dashboard cuma DIAM saat ada kejadian yang sebenarnya masuk
 * daftarnya — tanpa galat, tanpa gejala apa pun. Itu bentuk yang sama dengan #60/#78, dan
 * satu-satunya cara menangkapnya adalah mengadu kedua sisi seperti di bawah.
 */
beforeEach(function () {
    Notification::fake();

    // Driver 'log' (dipakai .env.testing) punya auth() kosong sehingga callback channel tak
    // pernah dievaluasi — pola & alasannya sama dengan BroadcastingAuthTest.
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'test-secret',
        'broadcasting.connections.reverb.app_id' => 'test-app',
    ]);
    require base_path('routes/channels.php');

    $this->reporter = User::factory()->create(['village_code' => '5171012006']);
    $this->reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ]);
});

function joinFeed(User $user, string $channel)
{
    return test()->actingAs($user)->post('/broadcasting/auth', [
        'socket_id' => '1234.5678',
        'channel_name' => 'private-'.$channel,
    ]);
}

// ---------------------------------------------------------------------------
// Sisi 1 — channel mana yang boleh didengar sebuah akun
// ---------------------------------------------------------------------------

it('puts every account on the channel of its own narrowest jurisdiction', function () {
    $stafDesa = User::factory()->create(['village_code' => '5171012006']);
    $stafDesa->assignRole('petugas');

    $adminKota = User::factory()->create([
        'village_code' => null,
        'district_code' => null,
        'city_code' => '5171',
    ]);
    $adminKota->assignRole('admin');

    expect($stafDesa->reportFeedChannel())->toBe('reports.village.5171012006');
    expect($adminKota->reportFeedChannel())->toBe('reports.city.5171');
});

it('authorizes an account only on the channel that is actually its own', function () {
    $stafDesa = User::factory()->create(['village_code' => '5171012006']);
    $stafDesa->assignRole('petugas');

    joinFeed($stafDesa, 'reports.village.5171012006')->assertOk();
    joinFeed($stafDesa, 'reports.village.5171012009')->assertForbidden();
    // Bukan sekadar "beda wilayah": tingkat yang LEBIH LUAS pun bukan jatahnya, karena
    // dashboardnya memang hanya menyaring pada tingkat desa.
    joinFeed($stafDesa, 'reports.city.5171')->assertForbidden();
    joinFeed($stafDesa, 'reports.all')->assertForbidden();
});

it('gives superadmin the national channel even when its own region columns are filled', function () {
    $superadmin = User::factory()->create(['village_code' => '5171012006']);
    $superadmin->assignRole('superadmin');

    // Dashboard superadmin TIDAK disaring wilayah sama sekali (DashboardController), jadi
    // channelnya harus nasional — kalau ia diberi channel desanya, ia justru berhenti
    // dibangunkan oleh sebagian besar laporan yang tetap tampil di layarnya.
    expect($superadmin->reportFeedChannel())->toBe('reports.all');
    joinFeed($superadmin, 'reports.all')->assertOk();
});

// Kolom wilayah kosong punya DUA makna (#56/TASK_23): bagi staf = wewenang NASIONAL, bagi
// non-staf = profil belum lengkap, yang tidak berwenang atas apa pun (#44). Channel feed
// harus menghormati pembedaan itu, bukan memperlakukan "kosong" sebagai satu hal.
it('keeps a citizen without region codes off the national channel', function () {
    $wargaKosong = User::factory()->create([
        'province_code' => null,
        'city_code' => null,
        'district_code' => null,
        'village_code' => null,
    ]);
    $wargaKosong->assignRole('masyarakat');

    // Tak ada channel yang jadi jatahnya → frontend tak pernah berlangganan apa pun.
    expect($wargaKosong->reportFeedChannel())->toBeNull();

    // Dan seandainya tetap dicoba, permintaannya bahkan tak sampai ke callback channel:
    // EnsureProfileComplete memantulkannya lebih dulu (peran non-staf tidak dikecualikan).
    joinFeed($wargaKosong, 'reports.all')->assertRedirect(route('profile.complete'));
});

it('gives national reach to STAFF without region codes', function () {
    $stafNasional = User::factory()->create([
        'province_code' => null,
        'city_code' => null,
        'district_code' => null,
        'village_code' => null,
    ]);
    $stafNasional->assignRole('petugas');

    // Sisi lain dari test di atas: kolom kosong yang SAMA, kesimpulan yang berbeda — dan
    // memang begitulah DashboardController menyaringnya (tanpa levelCode = tanpa batas).
    expect($stafNasional->reportFeedChannel())->toBe('reports.all');
    joinFeed($stafNasional, 'reports.all')->assertOk();
});

it('routes an OPD account to its agency channel instead of a region channel', function () {
    $agency = Agency::create(['name' => 'PLN UP3 Bali Selatan', 'code' => 'PLN', 'is_active' => true]);
    $lain = Agency::create(['name' => 'BPBD Denpasar', 'code' => 'BPBD', 'is_active' => true]);

    $opd = User::factory()->create([
        'province_code' => null,
        'city_code' => null,
        'district_code' => null,
        'village_code' => null,
        'agency_id' => $agency->id,
    ]);
    $opd->assignRole('opd');

    expect($opd->reportFeedChannel())->toBe('reports.agency.'.$agency->id);
    joinFeed($opd, 'reports.agency.'.$agency->id)->assertOk();
    joinFeed($opd, 'reports.agency.'.$lain->id)->assertForbidden();
});

// ---------------------------------------------------------------------------
// Sisi 2 — channel mana yang dibangunkan sebuah laporan
// ---------------------------------------------------------------------------

it('wakes every jurisdiction level of the report at once', function () {
    $channels = ReportFeedChanged::for($this->report)->channelNames;

    expect($channels)->toContain('reports.all')
        ->toContain('reports.province.51')
        ->toContain('reports.city.5171')
        ->toContain('reports.district.517101')
        ->toContain('reports.village.5171012006');
});

it('wakes the agencies asked to help, not just the region', function () {
    $agency = Agency::create(['name' => 'PLN UP3 Bali Selatan', 'code' => 'PLN', 'is_active' => true]);
    DB::table('report_agencies')->insert([
        'report_id' => $this->report->id,
        'agency_id' => $agency->id,
        'agency_name' => 'PLN UP3 Bali Selatan',
    ]);

    expect(ReportFeedChanged::for($this->report)->channelNames)->toContain('reports.agency.'.$agency->id);
});

it('broadcasts an alert, not a payload of data', function () {
    $payload = ReportFeedChanged::for($this->report)->broadcastWith();

    // Penerimanya SATU WILAYAH PENUH, jauh lebih luas daripada channel per-laporan. Isinya
    // cukup untuk menjadi aba-aba dan tidak cukup untuk membocorkan apa pun; yang menampilkan
    // datanya tetap server lewat router.reload(). `channelNames` (peta wilayah insiden) tak
    // boleh ikut — ia public property, jadi tanpa broadcastWith() ia akan terkirim.
    expect(array_keys($payload))->toEqualCanonicalizing(['reportId', 'status']);
});

// ---------------------------------------------------------------------------
// Pemicunya
// ---------------------------------------------------------------------------

it('wakes the dashboards when a brand new report comes in', function () {
    // Event::fake() hanya memalsukan ReportFeedChanged; ReportStatusChanged & kawan-kawan tetap
    // disiarkan sungguhan, dan driver 'reverb' berkredensial dummy dari beforeEach tak punya
    // host sehingga koneksinya melempar. Uji ini soal PEMICU, bukan otorisasi channel.
    config(['broadcasting.default' => 'log']);
    Event::fake([ReportFeedChanged::class]);

    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $this->actingAs($this->reporter)->post('/reports/create', [
        'title' => 'Kebakaran lahan',
        'description' => 'Asap tebal terlihat',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Jl. Pemogan No. 2',
        'photos' => [UploadedFile::fake()->image('kejadian.jpg')],
    ])->assertRedirect();

    // Sebelum ini TIDAK ADA satu pun siaran saat laporan dibuat — ReportStatusChanged baru
    // lahir pada transisi BERIKUTNYA, sehingga laporan masuk hanya terlihat oleh yang
    // kebetulan me-reload halamannya.
    Event::assertDispatched(ReportFeedChanged::class, fn ($e) => $e->status === 'TERLAPOR');
});

it('wakes the dashboards on every status transition too', function () {
    // Event::fake() hanya memalsukan ReportFeedChanged; ReportStatusChanged & kawan-kawan tetap
    // disiarkan sungguhan, dan driver 'reverb' berkredensial dummy dari beforeEach tak punya
    // host sehingga koneksinya melempar. Uji ini soal PEMICU, bukan otorisasi channel.
    config(['broadcasting.default' => 'log']);
    Event::fake([ReportFeedChanged::class]);

    // Verifikasi = admin sejak TASK_51.
    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->post("/reports/{$this->report->id}/approve")->assertRedirect();
    Event::assertDispatched(ReportFeedChanged::class, fn ($e) => $e->status === 'pending');

    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');
    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();
    Event::assertDispatched(ReportFeedChanged::class, fn ($e) => $e->status === 'handling');
});

// ---------------------------------------------------------------------------
// Sambungan ke halaman
// ---------------------------------------------------------------------------

it('tells each dashboard which channel to listen on', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Petugas/Dashboard')
            ->where('feed_channel', 'reports.village.5171012006'));
});

it('sends the current status to the thanks screen so its stepper can move', function () {
    $this->report->update(['status' => 'handling']);

    $this->actingAs($this->reporter)->get(route('front.reports.thanks', $this->report->id))
        ->assertOk()
        // Dulu prop ini tak ada dan tahap aktifnya dipaku di langkah pertama, sehingga laporan
        // yang sudah ditangani pun tetap berbunyi "Laporan Masuk" selamanya.
        ->assertInertia(fn ($page) => $page->where('report.status', 'handling'));
});

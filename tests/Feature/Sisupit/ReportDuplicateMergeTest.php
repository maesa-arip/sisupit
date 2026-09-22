<?php

use App\Models\Report;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use App\Notifications\ReportStatusUpdatedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

// TASK_55. Satu kebakaran dilihat banyak orang, dan tiap pelapor melahirkan satu baris
// `reports` - Pusat Komando mendengar nada triase sekali per pelapor, antrean verifikasi berisi
// belasan baris untuk satu kejadian, dan satu-satunya cara menyingkirkan yang ganda adalah
// MENOLAKnya (pelapor jujur menerima "Ditolak").
//
// Yang dijaga berkas ini: (1) server hanya MENGUSULKAN, tak pernah menggabungkan sendiri;
// (2) usulan tidak membunyikan nada triase ulang, laporan yang bukan usulan tetap berbunyi;
// (3) penggabungan = keputusan admin, dicek wilayahnya di KEDUA laporan; (4) laporan yang
// digabung keluar dari hitungan aktif tapi pelapornya tetap dikabari perkembangan kejadiannya.

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);
});

function pelaporGanda(): User
{
    $citizen = User::factory()->create([
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ]);
    $citizen->assignRole('warga');

    return $citizen;
}

function adminGanda(string $cityCode = '5171'): User
{
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => $cityCode]);
    $admin->assignRole('admin');

    return $admin;
}

/** Laporan kebakaran di Pemogan yang disimpan langsung (tanpa melewati deteksi). */
function kejadianGanda(array $extra = []): Report
{
    return Report::withoutGlobalScopes()->create(array_merge([
        'user_id' => pelaporGanda()->id,
        'title' => 'Kebakaran rumah warga',
        'incident_type' => 'rumah',
        'lat' => '-8.650000',
        'lng' => '115.220000',
        'status' => 'TERLAPOR',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ], $extra));
}

/** Isian form lapor yang sah untuk endpoint sungguhan. */
function isianLaporGanda(array $extra = []): array
{
    return array_merge([
        'title' => 'Kebakaran rumah warga',
        'incident_type' => 'rumah',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.650000',
        'lng' => '115.220000',
    ], $extra);
}

// ---------------------------------------------------------------------------------------
// LAPIS 1 - server mengusulkan
// ---------------------------------------------------------------------------------------

it('suggests the earlier nearby fire report as the likely same incident', function () {
    Notification::fake();

    $pertama = kejadianGanda();

    // ~110 m dari laporan pertama.
    $this->actingAs(pelaporGanda())->post('/reports/create', isianLaporGanda(['lat' => '-8.651000']));

    $kedua = Report::withoutGlobalScopes()->latest('id')->first();

    expect($kedua->id)->not->toBe($pertama->id)
        ->and($kedua->duplicate_candidate_of_id)->toBe($pertama->id)
        // Mesin hanya MENGUSULKAN: statusnya tetap laporan masuk biasa.
        ->and($kedua->status)->toBe('TERLAPOR')
        ->and($kedua->merged_into_id)->toBeNull();
});

it('ignores a report that is farther than the radius', function () {
    kejadianGanda(['lat' => '-8.660000']); // ~1,1 km

    expect(Report::cariKandidatDuplikat(kejadianGanda()))->toBeNull();
});

it('ignores a report older than the time window', function () {
    $lama = kejadianGanda();
    DB::table('reports')->where('id', $lama->id)->update(['created_at' => now()->subMinutes(121)]);

    expect(Report::cariKandidatDuplikat(kejadianGanda()))->toBeNull();
});

it('ignores a report in another regency even at the same point', function () {
    kejadianGanda(['city_code' => '5103', 'district_code' => null, 'village_code' => null]);

    expect(Report::cariKandidatDuplikat(kejadianGanda()))->toBeNull();
});

it('ignores incidents that are already closed, rejected, or merged', function (string $status) {
    kejadianGanda(['status' => $status]);

    expect(Report::cariKandidatDuplikat(kejadianGanda()))->toBeNull();
})->with(['resolved', 'ditolak', 'digabung']);

it('keeps verified and ongoing incidents as candidates', function (string $status) {
    $induk = kejadianGanda(['status' => $status]);

    expect(Report::cariKandidatDuplikat(kejadianGanda())?->id)->toBe($induk->id);
})->with(['pending', 'handling']);

it('does not look for duplicates of non-fire emergencies', function () {
    kejadianGanda(['incident_type' => 'lainnya']);

    expect(Report::cariKandidatDuplikat(kejadianGanda(['incident_type' => 'lainnya'])))->toBeNull();
});

it('points every later report at the parent, never at another duplicate', function () {
    $induk = kejadianGanda();
    $anak = kejadianGanda(['lat' => '-8.650500', 'merged_into_id' => $induk->id, 'status' => 'digabung']);

    // Laporan ketiga paling dekat ke si anak, tapi anak bukan kejadian yang berdiri sendiri.
    expect(Report::cariKandidatDuplikat(kejadianGanda(['lat' => '-8.650500']))?->id)->toBe($induk->id)
        ->and($anak->id)->not->toBe($induk->id);
});

it('turns detection off when the radius setting is zero', function () {
    Setting::setValue(Setting::KEY_DUPLIKAT_RADIUS_M, '0');
    kejadianGanda();

    expect(Report::cariKandidatDuplikat(kejadianGanda()))->toBeNull();
});

it('saves the detection radius and window, and old callers do not wipe them', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $level = ['notify_level_petugas' => 'kabupaten', 'notify_level_relawan' => 'desa', 'notify_level_pejabat' => 'kabupaten'];

    $this->actingAs($superadmin)
        ->put(route('admin.settings.update'), $level + ['duplikat_radius_m' => 800, 'duplikat_jendela_menit' => 60])
        ->assertRedirect();

    expect(Setting::getValue(Setting::KEY_DUPLIKAT_RADIUS_M))->toBe('800')
        ->and(Setting::getValue(Setting::KEY_DUPLIKAT_JENDELA_MENIT))->toBe('60');

    // Pemanggil lama tanpa kedua isian: setelan deteksi TIDAK boleh ikut terhapus diam-diam.
    $this->actingAs($superadmin)->put(route('admin.settings.update'), $level)->assertRedirect();

    expect(Setting::getValue(Setting::KEY_DUPLIKAT_RADIUS_M))->toBe('800');
});

it('stays silent for a suggested duplicate but still sounds for an unrelated report', function () {
    Notification::fake();
    $admin = adminGanda();

    $this->actingAs(pelaporGanda())->post('/reports/create', isianLaporGanda());
    $this->actingAs(pelaporGanda())->post('/reports/create', isianLaporGanda(['lat' => '-8.651000']));

    // Dua pelapor untuk satu kejadian = SATU nada triase.
    Notification::assertSentToTimes($admin, EmergencyAlertNotification::class, 1);

    // Kebakaran lain 2 km jauhnya BUKAN usulan, jadi ia tetap membangunkan Pusat Komando.
    $this->actingAs(pelaporGanda())->post('/reports/create', isianLaporGanda(['lat' => '-8.668000']));

    Notification::assertSentToTimes($admin, EmergencyAlertNotification::class, 2);
});

// ---------------------------------------------------------------------------------------
// LAPIS 2 - admin memutuskan
// ---------------------------------------------------------------------------------------

it('lets an admin merge a raw report into the incident it duplicates', function () {
    Notification::fake();
    $admin = adminGanda();
    $induk = kejadianGanda();
    $anak = kejadianGanda(['lat' => '-8.651000', 'duplicate_candidate_of_id' => $induk->id]);

    $this->actingAs($admin)->post("/reports/{$anak->id}/merge", ['into_id' => $induk->id])
        ->assertRedirect();

    $anak->refresh();

    expect($anak->status)->toBe('digabung')
        ->and($anak->merged_into_id)->toBe($induk->id)
        ->and($anak->merged_by)->toBe($admin->id)
        ->and($anak->merged_at)->not->toBeNull()
        ->and($anak->duplicate_candidate_of_id)->toBeNull()
        ->and($induk->refresh()->status)->toBe('TERLAPOR');
});

it('refuses merging to anyone but an admin', function (string $role) {
    $induk = kejadianGanda();
    $anak = kejadianGanda(['lat' => '-8.651000']);

    // Wilayah lengkap sampai desa: tanpa itu warga & relawan dipantulkan ke Lengkapi Profil
    // (302) dan test ini hijau karena alasan yang keliru.
    $user = User::factory()->create([
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ]);
    $user->assignRole($role);

    $this->actingAs($user)->post("/reports/{$anak->id}/merge", ['into_id' => $induk->id])
        ->assertForbidden();

    expect($anak->refresh()->status)->toBe('TERLAPOR');
})->with(['petugas', 'relawan', 'pejabat', 'warga']);

it('refuses merging when either report is outside the admin jurisdiction', function () {
    // Tanpa fake, penggabungan yang KELIRU lolos akan mencoba FCM sungguhan dan berakhir 500 -
    // test tetap merah, tapi karena alasan yang salah (dibuktikan lewat sabotase).
    Notification::fake();
    $admin = adminGanda('5171');
    $induk = kejadianGanda(['city_code' => '5103', 'district_code' => null, 'village_code' => null]);
    $anak = kejadianGanda();

    $this->actingAs($admin)->post("/reports/{$anak->id}/merge", ['into_id' => $induk->id])
        ->assertForbidden();

    expect($anak->refresh()->status)->toBe('TERLAPOR');
});

it('refuses merges that would lose or tangle an incident', function (Closure $siapkan) {
    $admin = adminGanda();
    [$anak, $induk] = $siapkan();

    $this->actingAs($admin)->post("/reports/{$anak->id}/merge", ['into_id' => $induk->id])
        ->assertForbidden();
})->with([
    'the duplicate is already verified' => fn () => [kejadianGanda(['status' => 'pending']), kejadianGanda()],
    'the parent was rejected' => fn () => [kejadianGanda(), kejadianGanda(['status' => 'ditolak'])],
    'the parent is already resolved' => fn () => [kejadianGanda(), kejadianGanda(['status' => 'resolved'])],
    'merging a report into itself' => function () {
        $r = kejadianGanda();

        return [$r, $r];
    },
    'the duplicate already has duplicates of its own' => function () {
        $anak = kejadianGanda();
        kejadianGanda(['status' => 'digabung', 'merged_into_id' => $anak->id]);

        return [$anak, kejadianGanda()];
    },
]);

it('lets an admin split a merged report back into the raw queue', function () {
    Notification::fake();
    $admin = adminGanda();
    $induk = kejadianGanda();
    $anak = kejadianGanda(['status' => 'digabung', 'merged_into_id' => $induk->id, 'merged_by' => $admin->id, 'merged_at' => now()]);

    $this->actingAs($admin)->post("/reports/{$anak->id}/unmerge")->assertRedirect();

    $anak->refresh();

    expect($anak->status)->toBe('TERLAPOR')
        ->and($anak->merged_into_id)->toBeNull()
        ->and($anak->merged_by)->toBeNull()
        ->and($anak->merged_at)->toBeNull();
});

it('lets an admin dismiss a wrong suggestion without touching the report', function () {
    $admin = adminGanda();
    $induk = kejadianGanda();
    $anak = kejadianGanda(['lat' => '-8.651000', 'duplicate_candidate_of_id' => $induk->id]);

    $this->actingAs($admin)->post("/reports/{$anak->id}/dismiss-duplicate")->assertRedirect();

    $anak->refresh();

    expect($anak->duplicate_candidate_of_id)->toBeNull()
        ->and($anak->status)->toBe('TERLAPOR');
});

it('moves suggestions that pointed at the merged report over to its parent', function () {
    Notification::fake();
    $admin = adminGanda();
    $induk = kejadianGanda();
    $anak = kejadianGanda(['lat' => '-8.651000']);
    $cucu = kejadianGanda(['lat' => '-8.651500', 'duplicate_candidate_of_id' => $anak->id]);

    $this->actingAs($admin)->post("/reports/{$anak->id}/merge", ['into_id' => $induk->id]);

    // Tanpa ini usulannya menunjuk laporan yang sudah tak berdiri sendiri - admin
    // diminta menggabung ke laporan yang justru sudah digabung, dan aksi itu selalu 403.
    expect($cucu->refresh()->duplicate_candidate_of_id)->toBe($induk->id);
});

it('closes every incident action on a merged report', function (string $aksi) {
    $admin = adminGanda();
    $induk = kejadianGanda();
    $anak = kejadianGanda(['status' => 'digabung', 'merged_into_id' => $induk->id]);

    $this->actingAs($admin)->post("/reports/{$anak->id}/{$aksi}")->assertForbidden();

    expect($anak->refresh()->status)->toBe('digabung');
})->with(['approve', 'reject', 'resolve']);

it('closes the field actions on a merged report', function () {
    $induk = kejadianGanda();
    $anak = kejadianGanda(['status' => 'digabung', 'merged_into_id' => $induk->id]);

    $petugas = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$anak->id}/take-action")->assertForbidden();
});

it('keeps the reporter of a merged report informed as the incident moves on', function () {
    Notification::fake();
    $admin = adminGanda();
    $induk = kejadianGanda();
    $anak = kejadianGanda(['lat' => '-8.651000']);
    $pelaporAnak = $anak->user;

    $this->actingAs($admin)->post("/reports/{$anak->id}/merge", ['into_id' => $induk->id]);

    Notification::assertSentTo(
        $pelaporAnak,
        ReportStatusUpdatedNotification::class,
        // Notifikasinya tentang laporan MILIKNYA sendiri: tautannya membuka halaman yang
        // memang boleh ia buka, bukan halaman induk milik pelapor lain (403).
        fn ($n) => $n->event === 'merged' && $n->report->id === $anak->id
    );

    $this->actingAs($admin)->post("/reports/{$induk->id}/approve");

    Notification::assertSentTo(
        $pelaporAnak,
        ReportStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'approved' && $n->report->id === $anak->id
    );
});

it('does not notify the same person twice when they reported both', function () {
    $admin = adminGanda();
    $warga = pelaporGanda();
    $induk = kejadianGanda(['user_id' => $warga->id]);
    kejadianGanda(['user_id' => $warga->id, 'status' => 'digabung', 'merged_into_id' => $induk->id]);

    Notification::fake();

    $this->actingAs($admin)->post("/reports/{$induk->id}/approve");

    Notification::assertSentToTimes($warga, ReportStatusUpdatedNotification::class, 1);
});

it('takes merged reports out of the active counts', function () {
    $admin = adminGanda();
    $induk = kejadianGanda();
    kejadianGanda(['status' => 'digabung', 'merged_into_id' => $induk->id]);

    $this->actingAs($admin)->get(route('admin.reports.index'))
        ->assertInertia(fn ($page) => $page
            ->where('menunggu_verifikasi', 1)
            ->has('reports.data', 1)
            ->where('reports.data.0.id', $induk->id)
            ->where('reports.data.0.merged_children_count', 1));

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('stats.active_reports', 1));
});

it('keeps merged reports out of the monitors list and the public feed', function () {
    $induk = kejadianGanda(['status' => 'pending']);
    $anak = kejadianGanda(['status' => 'digabung', 'merged_into_id' => $induk->id]);

    $pejabat = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $pejabat->assignRole('pejabat');

    $this->actingAs($pejabat)->get(route('front.reports.index', ['status' => 'Semua']))
        ->assertInertia(fn ($page) => $page->has('reports.data', 1)->where('reports.data.0.id', $induk->id));

    $this->actingAs(pelaporGanda())->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('page_data.reports.data', fn ($rows) => collect($rows)->pluck('id')->doesntContain($anak->id)));
});

it('offers the merge panel only to the verifier, decided by the server', function () {
    $induk = kejadianGanda();
    $anak = kejadianGanda(['lat' => '-8.651000', 'duplicate_candidate_of_id' => $induk->id]);

    $this->actingAs(adminGanda())->get(route('reports.show', $anak->id))
        ->assertInertia(fn ($page) => $page
            ->where('canMerge', true)
            ->where('duplicateCandidate.id', $induk->id)
            ->where('duplicateCandidate.distance_m', fn ($m) => $m > 50 && $m < 200));

    $petugas = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->get(route('reports.show', $anak->id))
        ->assertInertia(fn ($page) => $page->where('canMerge', false));

    // Gerbangnya prop server, bukan daftar peran di JSX (pelajaran TASK_51): daftar yang ditulis
    // dua kali menyimpang, dan yang menyimpang di layar melahirkan tombol yang selalu 403.
    $jsx = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));
    expect($jsx)->toMatch('/const canMerge = props\.canMerge/')
        ->and($jsx)->toMatch('/canMerge\s*&&/');
});

it('shows the reporter of a merged report the parent status without opening the parent to them', function () {
    $induk = kejadianGanda(['status' => 'handling']);
    $anak = kejadianGanda(['status' => 'digabung', 'merged_into_id' => $induk->id]);

    $this->actingAs($anak->user)->get(route('reports.show', $anak->id))
        ->assertInertia(fn ($page) => $page
            ->where('mergedIncident.status', 'handling')
            // Pelapor anak tak berwenang atas halaman induk: identitas & telepon pelapor induk
            // ada di sana. Ia hanya diberi keadaannya, tanpa id untuk ditautkan.
            ->where('mergedIncident.id', null));

    $this->actingAs($anak->user)->get(route('reports.show', $induk->id))->assertForbidden();

    $this->actingAs(adminGanda())->get(route('reports.show', $anak->id))
        ->assertInertia(fn ($page) => $page->where('mergedIncident.id', $induk->id));
});

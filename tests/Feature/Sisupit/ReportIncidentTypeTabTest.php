<?php

use App\Exports\ReportsExport;
use App\Models\Agency;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

/**
 * Form Lapor Darurat dipecah DUA TAB (permintaan user 2026-08-27): Kebakaran & Non Kebakaran.
 *
 * Yang dijaga di sini adalah tiga hal yang kalau jebol TIDAK menimbulkan galat apa pun —
 * bentuk kegagalan paling mahal di repo ini:
 *   - jenis baru `kebakaran_lainnya` harus DITERIMA server (kalau tidak, tombolnya menolak
 *     laporan dengan pesan di field yang tersembunyi dari warga);
 *   - ia KEBAKARAN, jadi aturan darurat-first berlaku (foto/detail opsional) — kalau ia
 *     ikut terbaca sebagai 'lainnya', warga tiba-tiba diwajibkan memotret api;
 *   - daftar jenis di form dan di server harus sama persis, dan tiap jenis harus punya
 *     label di rekap Excel & layar OPD (jenis tanpa label tercetak mentah — pelajaran #39).
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $this->payload = [
        'title' => 'Kebakaran gudang di gang sempit',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
    ];
});

it('accepts kebakaran_lainnya and keeps the fire rules (photo, detail & patokan optional)', function () {
    Notification::fake();
    Storage::fake('public');

    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    // Tanpa foto, tanpa deskripsi, tanpa patokan — persis seperti kebakaran lain.
    $response = $this->actingAs($citizen)->post('/reports/create', [
        ...$this->payload,
        'incident_type' => 'kebakaran_lainnya',
    ]);

    $report = Report::withoutGlobalScopes()->first();
    $response->assertRedirect(route('front.reports.thanks', $report->id));
    expect($report->incident_type)->toBe('kebakaran_lainnya');
    expect($report->photos()->count())->toBe(0);
});

it('treats kebakaran_lainnya as a fire type when recommending agencies', function () {
    Notification::fake();

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $bpbd = Agency::create([
        'name' => 'BPBD Kota Denpasar',
        'code' => 'BPBD',
        'is_active' => true,
        // Persis yang ditulis AgencySeeder: seluruh jenis kebakaran, dibaca dari model.
        'default_incident_types' => Report::FIRE_INCIDENT_TYPES,
        'requires_confirmation' => false,
        'village_code' => '5171012006',
    ]);

    $this->actingAs($petugas);

    expect(Agency::recommendedIdsFor('kebakaran_lainnya')->all())->toBe([$bpbd->id]);
    // 'lainnya' tetap darurat NON-kebakaran: tidak ikut terbawa daftar kebakaran.
    expect(Report::FIRE_INCIDENT_TYPES)->not->toContain('lainnya');
    expect(Report::FIRE_INCIDENT_TYPES)->each->toBeIn(Report::INCIDENT_TYPES);
});

it('offers exactly the incident types the server accepts', function () {
    // Daftar di form (dua tab) vs Rule::in di server. Jenis yang cuma ada di salah satunya
    // gagal senyap: tombolnya tampil tapi laporannya ditolak, atau sebaliknya jenis yang
    // tak pernah bisa dipilih warga.
    $form = file_get_contents(resource_path('js/Pages/Front/Reports/Create.jsx'));

    preg_match('/const FIRE_INCIDENT_TYPES = \[(.*?)\];/s', $form, $fireBlock);
    expect($fireBlock)->not->toBeEmpty('FIRE_INCIDENT_TYPES tidak ditemukan di Create.jsx');
    preg_match_all("/value: '([^']+)'/", $fireBlock[1], $fireValues);

    preg_match("/const NON_FIRE_INCIDENT_TYPE = \{ value: '([^']+)'/", $form, $nonFire);
    expect($nonFire)->not->toBeEmpty('NON_FIRE_INCIDENT_TYPE tidak ditemukan di Create.jsx');

    expect([...$fireValues[1], $nonFire[1]])->toEqualCanonicalizing(Report::INCIDENT_TYPES);
    expect($fireValues[1])->toEqualCanonicalizing(Report::FIRE_INCIDENT_TYPES);
});

it('gives every incident type a label in the excel export and the agency screen', function () {
    $exportLabels = (new ReflectionClass(ReportsExport::class))->getConstant('INCIDENT_TYPE_LABELS');
    expect(array_keys($exportLabels))->toEqualCanonicalizing(Report::INCIDENT_TYPES);

    $screenLabels = file_get_contents(resource_path('js/Pages/Admin/Agencies/incidentLabels.js'));
    foreach (Report::INCIDENT_TYPES as $type) {
        expect($screenLabels)->toContain("\t{$type}: '");
    }
});

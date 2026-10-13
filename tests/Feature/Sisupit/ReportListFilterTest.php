<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

// TASK_78. Laporan terus bertambah: /admin/reports (+ versi pemantau) mendapat saringan periode,
// jenis, kecamatan, dan baris per halaman yang DIBATASI; Peta Pemantauan tak lagi memuat seluruh
// laporan sepanjang masa - kejadian aktif selalu tampil, riwayat dibatasi periode (bawaan 7 hari),
// dan jumlah marker dibatasi. Semua lewat satu rumus: Report::scopeListFilter.

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan'],
        ['code' => '517102', 'city_code' => '5171', 'name' => 'Denpasar Timur'],
    ]);

    // 10.00 WITA, 11 Oktober 2026.
    $this->travelTo(Carbon::parse('2026-10-11 02:00:00', 'UTC'));
});

function adminSaring(): User
{
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    return $admin;
}

/** Laporan di Denpasar dengan waktu masuk (UTC) yang ditentukan. */
function laporanSaring(string $createdAtUtc, array $extra = []): Report
{
    $report = Report::withoutGlobalScopes()->create(array_merge([
        'title' => 'Kebakaran',
        'incident_type' => 'rumah',
        'lat' => '-8.650000',
        'lng' => '115.220000',
        'status' => 'resolved',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
    ], $extra));
    $report->forceFill(['created_at' => Carbon::parse($createdAtUtc, 'UTC')])->saveQuietly();

    return $report;
}

function idDaftar($response): array
{
    return collect($response->viewData('page')['props']['reports']['data'])->pluck('id')->sort()->values()->all();
}

it('filters the report list by a preset period counted in local (WITA) days', function () {
    // 07.30 WITA hari ini (masih 10 Okt di UTC) - termasuk "Hari ini".
    $pagiIni = laporanSaring('2026-10-10 23:30:00');
    // 23.30 WITA kemarin - di luar "Hari ini", di dalam "7 hari".
    $kemarin = laporanSaring('2026-10-10 15:30:00');
    $lama = laporanSaring('2026-09-01 02:00:00');

    $admin = adminSaring();
    $get = fn (array $q) => $this->actingAs($admin)->get(route('admin.reports.index', ['status' => 'Semua', ...$q]));

    expect(idDaftar($get(['periode' => 'hari_ini'])))->toBe([$pagiIni->id])
        ->and(idDaftar($get(['periode' => '7_hari'])))->toBe(collect([$pagiIni->id, $kemarin->id])->sort()->values()->all())
        ->and(idDaftar($get([])))->toHaveCount(3);
});

it('filters by an inclusive custom date range and swaps a reversed one', function () {
    $awalSept = laporanSaring('2026-09-01 02:00:00');
    laporanSaring('2026-09-20 02:00:00');

    $admin = adminSaring();

    $ok = $this->actingAs($admin)->get(route('admin.reports.index', [
        'status' => 'Semua', 'periode' => 'rentang', 'from' => '2026-09-01', 'to' => '2026-09-01',
    ]));
    $terbalik = $this->actingAs($admin)->get(route('admin.reports.index', [
        'status' => 'Semua', 'periode' => 'rentang', 'from' => '2026-09-05', 'to' => '2026-08-30',
    ]));

    expect(idDaftar($ok))->toBe([$awalSept->id])
        ->and(idDaftar($terbalik))->toBe([$awalSept->id]);
});

it('filters by incident kind, counting legacy reports without a kind as fire', function () {
    $rumah = laporanSaring('2026-10-11 01:00:00', ['incident_type' => 'rumah']);
    $lama = laporanSaring('2026-10-11 01:00:00', ['incident_type' => null]);
    $lainnya = laporanSaring('2026-10-11 01:00:00', ['incident_type' => 'lainnya']);

    $admin = adminSaring();
    $get = fn (string $jenis) => $this->actingAs($admin)->get(route('admin.reports.index', ['status' => 'Semua', 'jenis' => $jenis]));

    expect(idDaftar($get('kebakaran')))->toBe(collect([$rumah->id, $lama->id])->sort()->values()->all())
        ->and(idDaftar($get('non_kebakaran')))->toBe([$lainnya->id]);
});

it('filters by district and offers the districts of the admin city', function () {
    $selatan = laporanSaring('2026-10-11 01:00:00', ['district_code' => '517101']);
    laporanSaring('2026-10-11 01:00:00', ['district_code' => '517102']);

    $response = $this->actingAs(adminSaring())
        ->get(route('admin.reports.index', ['status' => 'Semua', 'kecamatan' => '517101']));

    expect(idDaftar($response))->toBe([$selatan->id]);
    $response->assertInertia(fn ($page) => $page
        ->has('district_options', 2)
        ->where('district_options.0.code', '517101'));
});

it('caps rows per page and drops unknown filter values instead of failing', function () {
    foreach (range(1, 30) as $i) {
        laporanSaring('2026-10-11 01:00:00');
    }
    $admin = adminSaring();

    $this->actingAs($admin)->get(route('admin.reports.index', ['status' => 'Semua', 'load' => 100000]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('reports.per_page', 10)->where('state.load', 10));

    $this->actingAs($admin)->get(route('admin.reports.index', ['status' => 'Semua', 'load' => 25]))
        ->assertInertia(fn ($page) => $page->where('reports.per_page', 25));

    $this->actingAs($admin)->get(route('admin.reports.index', [
        'status' => 'Semua', 'periode' => 'sepanjang', 'from' => '2026-13-45', 'jenis' => 'x', 'kecamatan' => "1' OR 1=1",
    ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('reports.total', 30)
            ->where('state.periode', null)
            ->where('state.from', null)
            ->where('state.jenis', null)
            ->where('state.kecamatan', null));
});

it('finds a report by the number shown on screen', function () {
    laporanSaring('2026-10-11 01:00:00', ['title' => 'Lain']);
    $target = laporanSaring('2026-10-11 01:00:00', ['title' => 'Dicari']);

    $response = $this->actingAs(adminSaring())->get(route('admin.reports.index', [
        'status' => 'Semua', 'search' => Report::nomorLaporan($target),
    ]));

    expect(idDaftar($response))->toBe([$target->id]);
});

it('applies the same filters to the monitoring list while still hiding raw reports', function () {
    $lama = laporanSaring('2026-09-01 02:00:00', ['status' => 'resolved']);
    $baru = laporanSaring('2026-10-11 01:00:00', ['status' => 'resolved']);
    laporanSaring('2026-10-11 01:00:00', ['status' => 'TERLAPOR']);

    $pejabat = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $pejabat->assignRole('pejabat');

    $response = $this->actingAs($pejabat)->get(route('front.reports.index', ['status' => 'Semua', 'periode' => '7_hari']));

    expect(idDaftar($response))->toBe([$baru->id]);
    $response->assertInertia(fn ($page) => $page->component('Admin/Reports/Index')->has('district_options', 2));
});

it('keeps old active incidents on the monitoring map but limits history to 7 days by default', function () {
    $aktifLama = laporanSaring('2026-08-01 02:00:00', ['status' => 'handling']);
    $selesaiBaru = laporanSaring('2026-10-09 02:00:00', ['status' => 'resolved']);
    $selesaiLama = laporanSaring('2026-09-01 02:00:00', ['status' => 'resolved']);

    $admin = adminSaring();

    $bawaan = $this->actingAs($admin)->get(route('front.monitoring.map'));
    expect(idDaftar($bawaan))->toBe(collect([$aktifLama->id, $selesaiBaru->id])->sort()->values()->all());
    $bawaan->assertInertia(fn ($page) => $page
        ->where('report_filters.periode', Report::MAP_DEFAULT_PERIODE)
        ->where('reports.truncated', false));

    $semua = $this->actingAs($admin)->get(route('front.monitoring.map', ['periode' => 'semua']));
    expect(idDaftar($semua))->toContain($selesaiLama->id);
});

it('applies kind and district filters to every incident on the monitoring map', function () {
    $selatan = laporanSaring('2026-10-11 01:00:00', ['status' => 'handling', 'district_code' => '517101']);
    laporanSaring('2026-10-11 01:00:00', ['status' => 'handling', 'district_code' => '517102']);
    laporanSaring('2026-10-11 01:00:00', ['status' => 'handling', 'district_code' => '517101', 'incident_type' => 'lainnya']);

    $response = $this->actingAs(adminSaring())->get(route('front.monitoring.map', [
        'jenis' => 'kebakaran', 'kecamatan' => '517101',
    ]));

    expect(idDaftar($response))->toBe([$selatan->id]);
});

it('caps the markers on the monitoring map and cuts old history before active incidents', function () {
    $aktifLama = laporanSaring('2026-01-01 02:00:00', ['status' => 'pending']);
    $now = now();
    DB::table('reports')->insert(array_fill(0, Report::MAP_MARKER_LIMIT, [
        'title' => 'Riwayat', 'status' => 'resolved', 'lat' => '-8.65', 'lng' => '115.22',
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101',
        'created_at' => $now, 'updated_at' => $now,
    ]));

    $response = $this->actingAs(adminSaring())->get(route('front.monitoring.map'));

    $response->assertInertia(fn ($page) => $page
        ->has('reports.data', Report::MAP_MARKER_LIMIT)
        ->where('reports.truncated', true));
    expect(idDaftar($response))->toContain($aktifLama->id);
});

it('reloads only the incidents when the map filter changes', function () {
    laporanSaring('2026-10-11 01:00:00', ['status' => 'handling']);
    $admin = adminSaring();

    $version = $this->actingAs($admin)->get(route('front.monitoring.map'))->viewData('page')['version'];

    $this->actingAs($admin)->get(route('front.monitoring.map', ['periode' => '30_hari']), [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $version,
        'X-Inertia-Partial-Component' => 'Monitoring/Map',
        'X-Inertia-Partial-Data' => 'reports,report_filters',
    ])
        ->assertOk()
        ->assertJsonPath('props.report_filters.periode', '30_hari')
        ->assertJsonCount(1, 'props.reports.data')
        ->assertJsonMissingPath('props.layers');
});

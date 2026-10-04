<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * TASK_72 fase 5 - dashboard pejabat (pemantau) dirancang ulang dari nol: ringkasan layanan strategis.
 * Yang dijaga: angka per periode yang jujur (tanpa hoaks/laporan ganda, di wilayah sendiri), median dari
 * cap waktu sungguhan, korban hanya dari entri FINAL (tanpa hitung ganda), tren berember kalender WITA,
 * titik rawan per kecamatan, dan halaman tanpa tombol aksi.
 */
beforeEach(function () {
    $this->travelTo(Carbon::parse('2026-10-04 04:00:00', 'UTC')); // Minggu 12.00 WITA

    $this->pejabat = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->pejabat->assignRole('pejabat');

    DB::table('indonesia_provinces')->insert([['code' => '51', 'name' => 'BALI']]);
    DB::table('indonesia_cities')->insert([['code' => '5171', 'province_code' => '51', 'name' => 'KOTA DENPASAR']]);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'DENPASAR SELATAN'],
        ['code' => '517102', 'city_code' => '5171', 'name' => 'DENPASAR TIMUR'],
    ]);

    $this->incident = function (array $attrs = [], ?string $createdAt = null): Report {
        $report = Report::withoutGlobalScopes()->create(array_merge([
            'user_id' => User::factory()->create()->id,
            'title' => 'Kebakaran',
            'description' => 'Api',
            'lat' => '-8.65',
            'lng' => '115.22',
            'status' => 'resolved',
            'province_code' => '51',
            'city_code' => '5171',
            'district_code' => '517101',
        ], $attrs));
        if ($createdAt) {
            $report->forceFill(['created_at' => $createdAt])->save();
        }

        return $report;
    };
});

function pejabatProps($test, array $query = []): array
{
    return $test->actingAs($test->pejabat)->get(route('dashboard', $query))->viewData('page')['props'];
}

it('counts incidents in the chosen period and region, without hoaxes or merged duplicates', function () {
    ($this->incident)([], '2026-10-01 02:00:00');
    ($this->incident)(['status' => 'handling'], '2026-09-20 02:00:00');
    ($this->incident)(['status' => 'ditolak'], '2026-10-01 02:00:00');
    ($this->incident)(['status' => 'digabung'], '2026-10-01 02:00:00');
    ($this->incident)(['city_code' => '5103', 'district_code' => '510301'], '2026-10-01 02:00:00');
    ($this->incident)([], '2026-07-01 02:00:00'); // di luar 30 hari

    $perf = pejabatProps($this)['performance'];
    expect($perf['total'])->toBe(2)->and($perf['resolved'])->toBe(1)->and($perf['resolved_pct'])->toBe(50);

    expect(pejabatProps($this, ['periode' => '7'])['performance']['total'])->toBe(1)
        ->and(pejabatProps($this, ['periode' => 'tahun'])['performance']['total'])->toBe(3)
        // Nilai periode asing jatuh ke bawaan 30 hari, bukan galat.
        ->and(pejabatProps($this, ['periode' => 'semua'])['period'])->toBe('30');
});

it('derives response and arrival medians from the first officer timestamps', function () {
    $officer = User::factory()->create();
    foreach ([[4, 10], [6, 20]] as [$dispatch, $arrive]) {
        $r = ($this->incident)([], '2026-10-03 02:00:00');
        DB::table('report_officers')->insert([
            'report_id' => $r->id, 'user_id' => $officer->id, 'status' => 'finished',
            'dispatched_at' => Carbon::parse('2026-10-03 02:00:00')->addMinutes($dispatch),
            'arrived_at' => Carbon::parse('2026-10-03 02:00:00')->addMinutes($arrive),
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    $perf = pejabatProps($this)['performance'];

    expect($perf['median_response'])->toBe(['minutes' => 5, 'sample' => 2])
        ->and($perf['median_arrival'])->toBe(['minutes' => 15, 'sample' => 2]);
});

it('counts victims from final incident reports only, so a victim copied into the draft is not counted twice', function () {
    $r = ($this->incident)([], '2026-10-02 02:00:00');
    foreach (['sementara', 'final'] as $status) {
        $resolution = DB::table('report_resolutions')->insertGetId(['report_id' => $r->id, 'status' => $status, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('report_victims')->insert(['report_resolution_id' => $resolution, 'created_at' => now(), 'updated_at' => now()]);
    }

    $props = pejabatProps($this);

    expect($props['performance']['victims'])->toBe(1)
        ->and($props['finalReports'])->toHaveCount(1)
        ->and($props['finalReports'][0]['report_id'])->toBe($r->id)
        ->and($props['finalReports'][0]['victims'])->toBe(1);
});

it('buckets the trend by WITA calendar days for the 7 day period', function () {
    ($this->incident)([], '2026-10-03 17:00:00'); // Minggu 01.00 WITA - masuk hari ini, bukan kemarin

    $props = pejabatProps($this, ['periode' => '7']);
    $byKey = collect($props['trend'])->pluck('count', 'key');

    expect($props['trendUnit'])->toBe('day')
        ->and($props['trend'])->toHaveCount(7)
        ->and($byKey['2026-10-04'])->toBe(1)
        ->and($byKey['2026-10-03'])->toBe(0);
});

it('ranks hotspots by kecamatan with readable names', function () {
    ($this->incident)([], '2026-10-01 02:00:00');
    ($this->incident)([], '2026-10-01 02:00:00');
    ($this->incident)(['district_code' => '517102'], '2026-10-01 02:00:00');

    expect(pejabatProps($this)['districts'])->toBe([
        ['code' => '517101', 'name' => 'Denpasar Selatan', 'total' => 2],
        ['code' => '517102', 'name' => 'Denpasar Timur', 'total' => 1],
    ]);
});

it('describes the live situation and offers no action buttons', function () {
    ($this->incident)(['status' => 'TERLAPOR']);
    ($this->incident)(['status' => 'handling']);

    expect(pejabatProps($this)['situation'])->toBe(['waiting' => 1, 'verified' => 0, 'handling' => 1]);

    $src = file_get_contents(resource_path('js/Pages/Pejabat/Dashboard.jsx'));
    foreach (['reports.approve', 'reports.reject', 'reports.take-action', 'reports.resolve', 'reports.create'] as $action) {
        expect($src)->not->toContain($action);
    }
});

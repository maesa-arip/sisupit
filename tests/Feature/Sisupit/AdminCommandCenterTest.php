<?php

use App\Models\Hydrant;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * TASK_72 fase 1 - dashboard Pusat Komando (admin & superadmin) dirancang ulang dari nol.
 * Yang dijaga: isi antrian triase & papan kejadian aktif, angka yang SAMA dengan daftar yang
 * dibukanya (#133), jejak verifikasi baru (approved_at/approved_by), dan pemisahan pejabat.
 */
function ccReport(array $attrs = [], ?string $createdAt = null): Report
{
    $reporter = User::factory()->create(['city_code' => $attrs['city_code'] ?? '5171']);

    $report = Report::withoutGlobalScopes()->create(array_merge([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah',
        'description' => 'Asap tebal',
        'address' => 'Jl. Test',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'province_code' => '51',
        'city_code' => '5171',
    ], $attrs));

    if ($createdAt) {
        $report->forceFill(['created_at' => $createdAt])->save();
    }

    return $report;
}

function ccAdmin(): User
{
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    return $admin;
}

function ccProps($response): array
{
    return $response->viewData('page')['props'];
}

it('records who verified a report and when', function () {
    Notification::fake();
    $admin = ccAdmin();
    $report = ccReport();

    $this->actingAs($admin)->post(route('reports.approve', $report->id))->assertRedirect();

    $report->refresh();
    expect($report->status)->toBe('pending')
        ->and($report->approved_by)->toBe($admin->id)
        ->and($report->approved_at)->not->toBeNull();
});

it('puts the oldest waiting report first and keeps other regions and other statuses out of triage', function () {
    $admin = ccAdmin();
    $newer = ccReport(['title' => 'Baru'], now()->subMinutes(1)->toDateTimeString());
    $older = ccReport(['title' => 'Lama'], now()->subMinutes(9)->toDateTimeString());
    ccReport(['title' => 'Kabupaten lain', 'city_code' => '5103']);
    ccReport(['title' => 'Sudah diverifikasi', 'status' => 'pending']);

    $props = ccProps($this->actingAs($admin)->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard')));

    expect(array_column($props['triage'], 'id'))->toBe([$older->id, $newer->id])
        ->and($props['triageTotal'])->toBe(2);

    // Angka antrian = jumlah di daftar verifikasi yang dibuka tautannya.
    $listed = ccProps($this->actingAs($admin)->get(route('admin.reports.index', ['status' => 'TERLAPOR'])))['reports']['total'];
    expect($listed)->toBe($props['triageTotal']);
});

it('flags a likely duplicate and reports photo and coordinate gaps in triage', function () {
    $admin = ccAdmin();
    $parent = ccReport(['title' => 'Induk', 'status' => 'pending']);
    $child = ccReport(['title' => 'Anak', 'duplicate_candidate_of_id' => $parent->id, 'lat' => null, 'lng' => null]);

    $row = collect(ccProps($this->actingAs($admin)->get('/dashboard'))['triage'])->firstWhere('id', $child->id);

    expect($row['duplicate_of'])->toBe(['id' => $parent->id, 'title' => 'Induk'])
        ->and($row['has_coords'])->toBeFalse()
        ->and($row['photos_count'])->toBe(0);
});

it('lists incidents nobody has responded to before the ones already being handled', function () {
    $admin = ccAdmin();
    $manned = ccReport(['title' => 'Ditangani', 'status' => 'handling'], now()->subMinutes(2)->toDateTimeString());
    $unmanned = ccReport(['title' => 'Belum ada yang meluncur', 'status' => 'pending'], now()->subMinutes(20)->toDateTimeString());
    $officer = User::factory()->create(['city_code' => '5171']);
    $officer->assignRole('petugas');
    DB::table('report_officers')->insert([
        'report_id' => $manned->id, 'user_id' => $officer->id, 'status' => 'arrived',
        'dispatched_at' => now()->subMinute(), 'arrived_at' => now(), 'created_at' => now(), 'updated_at' => now(),
    ]);

    $active = ccProps($this->actingAs($admin)->get('/dashboard'))['activeIncidents'];

    expect(array_column($active, 'id'))->toBe([$unmanned->id, $manned->id])
        ->and($active[0]['officers_count'] + $active[0]['helpers_count'])->toBe(0)
        ->and($active[1]['officers_count'])->toBe(1)
        ->and($active[1]['officers_arrived_count'])->toBe(1);
});

it('counts active reports exactly like the list the card opens', function () {
    $admin = ccAdmin();
    foreach (['TERLAPOR', 'pending', 'handling', 'resolved', 'ditolak'] as $status) {
        ccReport(['status' => $status]);
    }

    $kpi = ccProps($this->actingAs($admin)->get('/dashboard'))['kpis']['active_now'];
    $listed = ccProps($this->actingAs($admin)->get(route('admin.reports.index', ['status' => 'aktif'])))['reports']['total'];

    expect($kpi)->toBe(3)->and($listed)->toBe($kpi);
});

it('starts "masuk hari ini" at midnight WITA, not midnight UTC', function () {
    $this->travelTo(\Illuminate\Support\Carbon::parse('2026-10-04 02:00:00', 'UTC')); // 10.00 WITA
    $admin = ccAdmin();
    ccReport([], '2026-10-03 17:00:00'); // 01.00 WITA hari ini -> ikut
    ccReport([], '2026-10-03 15:30:00'); // 23.30 WITA kemarin -> tidak

    expect(ccProps($this->actingAs($admin)->get('/dashboard'))['kpis']['incoming_today'])->toBe(1);
});

it('reports median verification and response times from real timestamps only', function () {
    $admin = ccAdmin();
    $base = now()->subHour();
    foreach ([2, 4, 30] as $minutes) {
        $r = ccReport(['status' => 'pending'], $base->toDateTimeString());
        $r->forceFill(['approved_at' => $base->copy()->addMinutes($minutes)])->save();
    }
    // Laporan lama tanpa approved_at tidak boleh diam-diam dihitung nol menit.
    ccReport(['status' => 'pending'], $base->toDateTimeString());

    $kpis = ccProps($this->actingAs($admin)->get('/dashboard'))['kpis'];

    expect($kpis['median_approval'])->toBe(['minutes' => 4, 'sample' => 3])
        ->and($kpis['median_response'])->toBeNull();
});

it('counts hydrants under repair like the filtered hydrant list', function () {
    $admin = ccAdmin();
    foreach (['Aktif', 'Perbaikan', 'Perbaikan'] as $status) {
        Hydrant::withoutGlobalScopes()->create([
            'name' => 'H '.$status, 'address' => 'Jl. Test', 'type' => 'Stick', 'status' => $status, 'lat' => -8.65, 'lng' => 115.22,
            'province_code' => '51', 'city_code' => '5171',
        ]);
    }

    $props = ccProps($this->actingAs($admin)->get('/dashboard'));
    $listed = ccProps($this->actingAs($admin)->get(route('admin.hydrants.index', ['status' => 'Perbaikan'])))['hydrants']['total'];

    expect($props['pendingWork']['hydrant_repair'])->toBe(2)
        ->and($listed)->toBe(2)
        ->and($props['resources']['hydrants_active'])->toBe(1);
});

it('gives pejabat a dashboard of its own, separate from the command center', function () {
    $pejabat = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $pejabat->assignRole('pejabat');

    $this->actingAs($pejabat)->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page->component('Pejabat/Dashboard')->has('performance')->missing('triage'));
});

it('sends verification to the detail page instead of approving blind from the dashboard', function () {
    $src = file_get_contents(resource_path('js/Pages/Admin/Dashboard.jsx'));

    expect($src)->not->toContain("route('reports.approve'")
        ->and($src)->toContain("route('reports.show', report.id)")
        ->and($src)->toContain('router.reload({ only: LIVE_PROPS })')
        ->and($src)->toContain('useRealtimeStatus()');
});

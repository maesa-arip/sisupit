<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

/**
 * Status laporan untuk pelapor di luar halaman Thanks (#165). Thanks hanya dicapai sekali
 * (redirect sesudah kirim), sedangkan Riwayat, Beranda, push notif, dan "Pantau Bantuan" semuanya
 * menuju detail laporan - jadi stepper & ringkasan responder wajib ikut hadir di detail (khusus
 * pelapor) dan laporan yang masih berjalan wajib tampil di Beranda warga.
 */
beforeEach(function () {
    Notification::fake();

    $region = [
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ];
    $this->region = $region;

    // Wilayah lengkap supaya pelapor tak dipantulkan EnsureProfileComplete.
    $this->reporter = User::factory()->create($region);
    $this->reporter->assignRole('warga');

    $this->admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->admin->assignRole('admin');

    $this->petugas = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->petugas->assignRole('petugas');

    $this->makeReport = fn (array $attrs = []) => Report::create(array_merge([
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran gudang',
        'description' => 'Api di gudang',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
    ], $region, $attrs));
});

it('shows the reporter who is on the way on the report detail page', function () {
    $report = ($this->makeReport)();

    $this->actingAs($this->petugas)->post(route('reports.take-action', $report));

    $this->actingAs($this->reporter)->get(route('reports.show', $report))
        ->assertInertia(fn ($page) => $page
            ->component('Front/Reports/Show')
            ->where('responders.en_route.petugas', 1)
            ->where('responders.arrived.petugas', 0));
});

it('sends the reporter progress summary to the reporter only, not to staff', function () {
    $report = ($this->makeReport)();

    $this->actingAs($this->admin)->get(route('reports.show', $report))
        ->assertInertia(fn ($page) => $page->where('responders', null));
});

it('lists only the citizen own reports that are still running on the dashboard', function () {
    $running = collect(['TERLAPOR', 'pending', 'handling'])
        ->map(fn ($status) => ($this->makeReport)(['status' => $status])->id);
    foreach (['resolved', 'ditolak', Report::STATUS_DIGABUNG] as $status) {
        ($this->makeReport)(['status' => $status]);
    }

    $stranger = User::factory()->create($this->region);
    $stranger->assignRole('warga');
    ($this->makeReport)(['user_id' => $stranger->id, 'status' => 'handling']);

    $this->actingAs($this->reporter)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('activeReports', fn ($list) => collect($list)->pluck('id')->sort()->values()->all()
                === $running->sort()->values()->all()));
});

it('keeps the reporter progress live on the detail page and the dashboard', function () {
    $show = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));
    $start = strpos($show, 'const reloadIncident = () => {');
    $reload = substr($show, $start, strpos($show, '};', $start) - $start);

    $dashboard = file_get_contents(resource_path('js/Pages/Dashboard.jsx'));

    // Satu daftar prop reload untuk semua sinyal (#113) - `responders` wajib ikut di dalamnya.
    expect($reload)->toContain("'responders'")
        ->and($show)->toContain("from '@/Components/ReportProgress'")
        ->and($dashboard)->toContain("from '@/Components/ReportProgress'")
        ->and($dashboard)->toContain("router.reload({ only: ['activeReports', 'myReports'] })")
        ->and(file_get_contents(resource_path('js/Pages/Front/Reports/Thanks.jsx')))
        ->toContain("from '@/Components/ReportProgress'");
});

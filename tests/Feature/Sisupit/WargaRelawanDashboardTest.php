<?php

use App\Models\Hydrant;
use App\Models\PosPemadam;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * TASK_72 fase 3 - Beranda warga & relawan dirancang ulang dari nol. Yang dijaga: daftar "Butuh
 * Bantuan Sekarang" relawan dari SERVER (bukan saringan halaman feed yang termuat), tugas berjalan
 * lintas wilayah, hitungan kontribusi, fasilitas terdekat dari data publik kabupaten sendiri, dan baris
 * kejadian warga yang bukan tautan ke detail yang tertutup baginya.
 */
beforeEach(function () {
    Notification::fake();

    $this->relawan = User::factory()->create([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
        'phone' => '081200000001', 'is_standby' => true,
    ]);
    $this->relawan->assignRole('relawan');

    $this->report = fn (array $attrs = []) => Report::withoutGlobalScopes()->create(array_merge([
        'user_id' => User::factory()->create()->id,
        'title' => 'Kebakaran',
        'description' => 'Api',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ], $attrs));
});

function berandaProps($test, User $user): array
{
    return $test->actingAs($user)->get('/dashboard')->viewData('page')['props'];
}

it('lists verified incidents needing help from the server, minus the ones I already joined', function () {
    $pending = ($this->report)(['title' => 'Belum ada yang bantu']);
    $handling = ($this->report)(['title' => 'Sudah ditangani', 'status' => 'handling']);
    $joined = ($this->report)(['title' => 'Sudah saya ikuti']);
    ($this->report)(['title' => 'Belum diverifikasi', 'status' => 'TERLAPOR']);
    ($this->report)(['title' => 'Desa lain', 'village_code' => '5171012001']);
    $this->actingAs($this->relawan)->post(route('reports.take-action', $joined->id))->assertRedirect();

    $props = berandaProps($this, $this->relawan);

    expect(collect($props['needHelp'])->pluck('id')->sort()->values()->all())->toBe(collect([$pending->id, $handling->id])->sort()->values()->all())
        ->and(collect($props['needHelp'])->firstWhere('id', $pending->id)['helpers_count'])->toBe(0);
});

it('shows my running task with my status and counts the tasks I finished', function () {
    $running = ($this->report)(['title' => 'Tugas berjalan', 'city_code' => '5103', 'district_code' => '510301', 'village_code' => '5103012001']);
    DB::table('report_helpers')->insert([
        'report_id' => $running->id, 'user_id' => $this->relawan->id, 'status' => 'en_route',
        'started_at' => now()->subMinutes(5), 'created_at' => now(), 'updated_at' => now(),
    ]);
    foreach ([1, 2] as $_) {
        $done = ($this->report)(['status' => 'resolved']);
        DB::table('report_helpers')->insert([
            'report_id' => $done->id, 'user_id' => $this->relawan->id, 'status' => 'finished',
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    $props = berandaProps($this, $this->relawan);

    // Lintas wilayah tetap terlihat: gerbangnya baris report_helpers milik relawan sendiri.
    expect(array_column($props['activeTasks'], 'id'))->toBe([$running->id])
        ->and($props['activeTasks'][0]['my_status'])->toBe('en_route')
        ->and($props['tasksDone'])->toBe(2);
});

it('offers stations and working hydrants of my own city as nearest facilities', function () {
    PosPemadam::withoutGlobalScopes()->create(['name' => 'Pos Kota Sendiri', 'address' => 'Jl. A', 'phone' => '0361123', 'type' => 'Pos', 'status' => 'Aktif', 'vehicle_count' => 2, 'lat' => -8.66, 'lng' => 115.21, 'province_code' => '51', 'city_code' => '5171']);
    PosPemadam::withoutGlobalScopes()->create(['name' => 'Pos Kota Lain', 'address' => 'Jl. B', 'phone' => '0361999', 'type' => 'Pos', 'status' => 'Aktif', 'vehicle_count' => 1, 'lat' => -8.66, 'lng' => 115.21, 'province_code' => '51', 'city_code' => '5103']);
    foreach (['Aktif', 'Perbaikan'] as $status) {
        Hydrant::withoutGlobalScopes()->create(['name' => "H {$status}", 'address' => 'Jl. C', 'type' => 'Stick', 'status' => $status, 'lat' => -8.65, 'lng' => 115.22, 'province_code' => '51', 'city_code' => '5171']);
    }

    $facilities = berandaProps($this, $this->relawan)['facilities'];

    expect(array_column($facilities['stations'], 'name'))->toBe(['Pos Kota Sendiri'])
        ->and($facilities['stations'][0]['phone'])->toBe('0361123')
        ->and(array_column($facilities['hydrants'], 'name'))->toBe(['H Aktif'])
        ->and($facilities['center'])->toHaveKeys(['lat', 'lng']);
});

it('keeps volunteer-only data away from plain citizens', function () {
    $warga = User::factory()->create(['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006', 'phone' => '081200000002']);
    $warga->assignRole('warga');
    ($this->report)();

    $props = berandaProps($this, $warga);

    expect($props['needHelp'])->toBe([])
        ->and($props['activeTasks'])->toBe([])
        ->and($props['areaLevel'])->toBe('kecamatan')
        ->and($props['areaIncidents'])->toHaveCount(1);
});

it('does not link citizens to incident pages they are not allowed to open', function () {
    $src = file_get_contents(resource_path('js/Pages/Dashboard.jsx'));
    $area = substr($src, strpos($src, 'areaIncidents.map('), 1500);

    // Detail laporan orang lain tertutup bagi warga (ReportController::show -> 403).
    expect($area)->not->toContain("route('reports.show'")
        ->and($src)->toContain("router.visit(route('reports.show', report.id));")
        ->and($src)->toContain('NOMOR_DARURAT_NASIONAL');
});

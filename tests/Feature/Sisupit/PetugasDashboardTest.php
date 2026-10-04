<?php

use App\Models\Hydrant;
use App\Models\Pompa;
use App\Models\Regu;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

/**
 * TASK_72 fase 2 - dashboard petugas dirancang ulang dari nol. Yang dijaga: "Misi Saya" (termasuk
 * misi lintas wilayah yang sudah diambil, tapi BUKAN misi orang lain), sumber air terdekat ke TKP,
 * papan regu danru, penanda per misi untuk Butuh Unit / Sedang Ditangani, dan Meluncur dari dashboard
 * yang membuka halaman detail (tempat pelacakan GPS hidup).
 */
beforeEach(function () {
    Notification::fake();

    $this->makePetugas = function (array $attrs = []) {
        $user = User::factory()->create(array_merge(['province_code' => '51', 'city_code' => '5171'], $attrs));
        $user->assignRole('petugas');

        return $user;
    };
    $this->makeReport = function (array $attrs = []) {
        return Report::withoutGlobalScopes()->create(array_merge([
            'user_id' => User::factory()->create()->id,
            'title' => 'Kebakaran gudang',
            'description' => 'Api',
            'lat' => '-8.6500',
            'lng' => '115.2200',
            'status' => 'pending',
            'province_code' => '51',
            'city_code' => '5171',
        ], $attrs));
    };

    $this->admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->admin->assignRole('admin');
    $this->danru = ($this->makePetugas)(['name' => 'Made Danru']);
    $this->anggota1 = ($this->makePetugas)(['name' => 'Ketut Anggota']);
    $this->anggota2 = ($this->makePetugas)(['name' => 'Wayan Anggota']);

    $this->actingAs($this->admin)->post(route('regu.store'), ['name' => 'Regu A', 'leader_id' => $this->danru->id]);
    $this->regu = Regu::withoutGlobalScopes()->where('name', 'Regu A')->firstOrFail();
    $this->actingAs($this->danru)->put(route('regu.members', $this->regu), ['member_ids' => [$this->anggota1->id, $this->anggota2->id]]);
});

function petugasProps($test, User $user): array
{
    return $test->actingAs($user)->get('/dashboard')->viewData('page')['props'];
}

it('shows my own active mission with my status, and not a mission someone else took', function () {
    $mine = ($this->makeReport)(['title' => 'Misi saya']);
    $others = ($this->makeReport)(['title' => 'Misi orang lain']);
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $mine->id))->assertRedirect();
    $this->actingAs($this->anggota2)->post(route('reports.take-action', $others->id))->assertRedirect();

    $props = petugasProps($this, $this->anggota1);

    expect(array_column($props['myMissions'], 'id'))->toBe([$mine->id])
        ->and($props['myMissions'][0]['my_status'])->toBe('en_route')
        ->and($props['myMissions'][0]['dispatched_at'])->not->toBeNull();

    $flags = collect($props['activeMissions'])->keyBy('id');
    expect($flags[$mine->id]['i_responded'])->toBeTrue()
        ->and($flags[$others->id]['i_responded'])->toBeFalse()
        ->and($flags[$others->id]['officers_count'])->toBe(1);
});

it('keeps a mission I already took visible even when it lies outside my region', function () {
    $outside = ($this->makeReport)(['title' => 'Luar wilayah', 'city_code' => '5103']);
    \Illuminate\Support\Facades\DB::table('report_officers')->insert([
        'report_id' => $outside->id, 'user_id' => $this->anggota1->id, 'status' => 'arrived',
        'dispatched_at' => now()->subMinutes(10), 'arrived_at' => now(), 'created_at' => now(), 'updated_at' => now(),
    ]);

    $props = petugasProps($this, $this->anggota1);

    expect(array_column($props['myMissions'], 'id'))->toBe([$outside->id])
        ->and($props['myMissions'][0]['my_status'])->toBe('arrived')
        // Feed wilayah tetap ter-scope: misi luar wilayah tidak bocor ke daftar umum.
        ->and(array_column($props['activeMissions'], 'id'))->not->toContain($outside->id);
});

it('lists the three nearest working water sources to the scene, closest first', function () {
    $report = ($this->makeReport)();
    $hydrant = fn (string $name, float $dLat, string $status = 'Aktif') => Hydrant::withoutGlobalScopes()->create([
        'name' => $name, 'address' => 'Jl. Test', 'type' => 'Stick', 'status' => $status,
        'lat' => -8.65 + $dLat, 'lng' => 115.22, 'water_pressure' => 'Keras',
        'province_code' => '51', 'city_code' => '5171',
    ]);
    $hydrant('H 300m', 0.0027);
    $hydrant('H 100m rusak', 0.0009, 'Perbaikan');
    $hydrant('H 600m', 0.0054);
    $hydrant('H 5km', 0.045);
    $hydrant('H 900m', 0.0081);
    Pompa::withoutGlobalScopes()->create([
        'name' => 'SKKL 200m', 'address' => 'Jl. Test', 'type' => 'SKKL', 'status' => 'Aktif', 'capacity_lpm' => 800,
        'lat' => -8.65 + 0.0018, 'lng' => 115.22, 'province_code' => '51', 'city_code' => '5171',
    ]);
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $report->id));

    $water = petugasProps($this, $this->anggota1)['myMissions'][0]['water'];

    expect(array_column($water, 'name'))->toBe(['SKKL 200m', 'H 300m', 'H 600m'])
        ->and($water[0]['kind'])->toBe('skkl')
        ->and($water[0]['detail'])->toBe('800 L/menit')
        ->and($water[1]['detail'])->toBe('Tekanan keras')
        ->and($water[1]['distance_m'])->toBeGreaterThan(250)->toBeLessThan(350);
});

it('gives the danru a board of who is en route, staying, or has not chosen yet', function () {
    $report = ($this->makeReport)();
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $report->id));
    $this->actingAs($this->anggota2)->post(route('reports.stay-at-base', $report->id));

    $board = petugasProps($this, $this->danru)['reguBoard'];
    $states = collect($board[0]['members'])->pluck('state', 'name');

    expect($board[0]['id'])->toBe($report->id)
        ->and($states->all())->toBe(['Ketut Anggota' => 'meluncur', 'Wayan Anggota' => 'jaga', 'Made Danru' => 'belum']);

    // Anggota biasa tak mendapat papan, dan insiden yang belum menyentuh regu tak ikut.
    expect(petugasProps($this, $this->anggota1)['reguBoard'])->toBe([]);
    ($this->makeReport)(['title' => 'Belum disentuh regu']);
    expect(petugasProps($this, $this->danru)['reguBoard'])->toHaveCount(1);
});

it('marks the member who chose to stay at base on the mission list', function () {
    $report = ($this->makeReport)();
    $this->actingAs($this->anggota2)->post(route('reports.stay-at-base', $report->id));

    $row = collect(petugasProps($this, $this->anggota2)['activeMissions'])->firstWhere('id', $report->id);

    expect($row['i_stay'])->toBeTrue()->and($row['i_responded'])->toBeFalse();
});

it('drops a mission from "Misi Saya" once it is resolved', function () {
    $report = ($this->makeReport)();
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $report->id));
    $this->actingAs($this->anggota1)->post(route('reports.resolve', $report->id));

    expect(petugasProps($this, $this->anggota1)['myMissions'])->toBe([]);
});

it('opens the incident page after dispatching from the dashboard, where live GPS tracking runs', function () {
    $src = file_get_contents(resource_path('js/Pages/Petugas/Dashboard.jsx'));

    expect($src)->toContain("from '@/lib/click-location'")
        ->and($src)->toContain("router.post(route('reports.take-action', mission.id), location")
        ->and($src)->toContain("router.visit(route('reports.show', mission.id));")
        ->and($src)->toContain("router.post(route('reports.stay-at-base', mission.id), location");

    // Satu sumber posisi klik untuk detail & dashboard - bukan dua salinan yang kelak menyimpang.
    expect(file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx')))
        ->toContain("import { getClickLocation } from '@/lib/click-location';")
        ->not->toContain('const getClickLocation = () =>');
});

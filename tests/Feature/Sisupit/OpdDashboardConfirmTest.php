<?php

use App\Models\Agency;
use App\Models\Report;
use App\Models\ReportAgency;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

/**
 * TASK_72 fase 4 - dashboard OPD dirancang ulang dari nol. Konfirmasi tindakan berkondisi (mis.
 * "listrik dipadamkan") kini bisa dikerjakan LANGSUNG dari dashboard memakai endpoint & gerbang yang
 * sama dengan halaman detail. Dijaga ujung ke ujung: prop dashboard membawa agency_id, endpoint
 * menerimanya, dan dashboard berikutnya membaca baris itu sudah terkonfirmasi.
 */
beforeEach(function () {
    Notification::fake();

    $this->agency = Agency::create(['name' => 'PLN ULP Denpasar', 'code' => 'PLN', 'is_active' => true, 'city_code' => '5171']);
    $this->opd = User::factory()->create(['province_code' => null, 'city_code' => null, 'district_code' => null, 'village_code' => null, 'agency_id' => $this->agency->id]);
    $this->opd->assignRole('opd');

    $this->report = Report::withoutGlobalScopes()->create([
        'user_id' => User::factory()->create()->id,
        'title' => 'Kebakaran rumah',
        'description' => 'Api',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'handling',
        'province_code' => '51',
        'city_code' => '5171',
    ]);
    ReportAgency::create([
        'report_id' => $this->report->id, 'agency_id' => $this->agency->id, 'agency_name' => 'PLN ULP Denpasar',
        'requires_confirmation' => true, 'confirmation_label' => 'Listrik di lokasi dipadamkan', 'notified_at' => now(),
    ]);
});

function opdRequest($test, User $user, int $reportId): array
{
    return collect($test->actingAs($user)->get('/dashboard')->viewData('page')['props']['requests'])->firstWhere('id', $reportId);
}

it('confirms from the dashboard with the agency id the dashboard itself provides', function () {
    $row = opdRequest($this, $this->opd, $this->report->id);

    expect($row['agency_id'])->toBe($this->agency->id)
        ->and($row['confirmed_at'])->toBeNull()
        ->and($row['lat'])->not->toBeNull()
        ->and($row['created_at'])->not->toBeNull();

    $this->actingAs($this->opd)
        ->post(route('reports.agencies.confirm', $this->report->id), ['agency_id' => $row['agency_id'], 'note' => 'Gardu dimatikan'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $after = opdRequest($this, $this->opd, $this->report->id);
    expect($after['confirmed_at'])->not->toBeNull();
    expect(ReportAgency::first()->confirmation_note)->toBe('Gardu dimatikan');
});

it('does not let another agency confirm on behalf of this one', function () {
    $other = Agency::create(['name' => 'BPBD', 'code' => 'BPBD', 'is_active' => true, 'city_code' => '5171']);
    $outsider = User::factory()->create(['agency_id' => $other->id]);
    $outsider->assignRole('opd');

    $this->actingAs($outsider)
        ->post(route('reports.agencies.confirm', $this->report->id), ['agency_id' => $this->agency->id])
        ->assertForbidden();
});

it('splits the OPD dashboard into awaiting, active and history and confirms through the shared endpoint', function () {
    $src = file_get_contents(resource_path('js/Pages/Opd/Dashboard.jsx'));

    expect($src)->toContain("route('reports.agencies.confirm', toConfirm.id)")
        ->and($src)->toContain('{ agency_id: toConfirm.agency_id, note }')
        ->and($src)->toContain('const awaiting = requests.filter((r) => isActive(r) && r.requires_confirmation && !r.confirmed_at);')
        ->and($src)->toContain('const history = requests.filter((r) => !isActive(r)).slice(0, 10);')
        ->and($src)->toContain('tenant?.telepon_darurat');
});

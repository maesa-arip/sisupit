<?php

use App\Models\Regu;
use App\Models\Report;
use App\Models\ReportAlpha;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * TASK_66 (permintaan user 2026-09-29), tiga hal di atas regu TASK_60:
 *   - Meluncur & Jaga di Kantor mencatat KOORDINAT saat ditekan - dan GPS yang gagal/rusak
 *     tak pernah menggagalkan tombolnya;
 *   - satu anggota menekan Tiba = anggota regu yang SUDAH Meluncur ikut tiba (bukan yang jaga
 *     kantor / belum memilih, keputusan user);
 *   - yang tak memilih keduanya sampai kejadian ditutup tercatat ALPHA, data internal ADMIN SAJA.
 */
beforeEach(function () {
    Notification::fake();

    $this->petugas = function (string $name) {
        $user = User::factory()->create(['name' => $name, 'province_code' => '51', 'city_code' => '5171']);
        $user->assignRole('petugas');

        return $user;
    };

    $this->admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->admin->assignRole('admin');

    $this->danru = ($this->petugas)('Danru Made');
    $this->anggota1 = ($this->petugas)('Ketut Anggota');
    $this->anggota2 = ($this->petugas)('Wayan Anggota');
    $this->anggota3 = ($this->petugas)('Nyoman Anggota');

    $this->actingAs($this->admin)->post(route('regu.store'), ['name' => 'Regu A', 'leader_id' => $this->danru->id]);
    $this->regu = Regu::withoutGlobalScopes()->where('name', 'Regu A')->firstOrFail();
    $this->actingAs($this->danru)->put(route('regu.members', $this->regu), [
        'member_ids' => [$this->anggota1->id, $this->anggota2->id, $this->anggota3->id],
    ]);

    // Regu kedua yang TAK SATU PUN anggotanya menanggapi - tak boleh dituduh alpha.
    $this->danruB = ($this->petugas)('Danru Putu');
    $this->actingAs($this->admin)->post(route('regu.store'), ['name' => 'Regu B', 'leader_id' => $this->danruB->id]);

    $reporter = User::factory()->create([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
    ]);
    $reporter->assignRole('warga');

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran gudang',
        'description' => 'Api di gudang',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ]);
});

it('records where a responder was when pressing meluncur, apart from the live position', function () {
    $this->actingAs($this->anggota1)
        ->post(route('reports.take-action', $this->report), ['lat' => -8.6612, 'lng' => 115.2143, 'accuracy' => 12.6])
        ->assertRedirect();

    $row = DB::table('report_officers')->where('user_id', $this->anggota1->id)->first();
    expect((float) $row->start_lat)->toBe(-8.6612)
        ->and((float) $row->start_lng)->toBe(115.2143)
        ->and((int) $row->start_accuracy_m)->toBe(13)
        ->and($row->location_lat)->toBeNull();
});

it('records where the member was when choosing jaga di kantor', function () {
    $this->actingAs($this->anggota2)
        ->post(route('reports.stay-at-base', $this->report), ['lat' => -8.65, 'lng' => 115.21, 'accuracy' => 30])
        ->assertSessionHasNoErrors();

    $row = DB::table('report_jaga_kantor')->where('user_id', $this->anggota2->id)->first();
    expect((float) $row->lat)->toBe(-8.65)->and((float) $row->lng)->toBe(115.21)->and((int) $row->accuracy_m)->toBe(30);
});

it('never lets a missing or broken location stop the meluncur button', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report))->assertSessionHasNoErrors();
    $this->actingAs($this->anggota2)
        ->post(route('reports.take-action', $this->report), ['lat' => 'abc', 'lng' => 999, 'accuracy' => -5])
        ->assertSessionHasNoErrors();

    $rows = DB::table('report_officers')->where('report_id', $this->report->id)->get();
    expect($rows)->toHaveCount(2);
    foreach ($rows as $row) {
        expect($row->start_lat)->toBeNull()->and($row->start_lng)->toBeNull()->and($row->start_accuracy_m)->toBeNull();
    }
});

it('marks every regu member already on the way as arrived when one of them arrives', function () {
    $this->actingAs($this->danru)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota2)->post(route('reports.stay-at-base', $this->report));
    // Petugas tanpa regu yang juga meluncur - tak boleh ikut tertandai.
    $lepas = ($this->petugas)('Gede Lepas');
    $this->actingAs($lepas)->post(route('reports.take-action', $this->report));

    $this->actingAs($this->anggota1)->post(route('reports.arrive', $this->report))->assertSessionHasNoErrors();

    $status = DB::table('report_officers')->where('report_id', $this->report->id)->pluck('status', 'user_id');
    expect($status[$this->anggota1->id])->toBe('arrived')
        ->and($status[$this->danru->id])->toBe('arrived')
        ->and($status[$lepas->id])->toBe('en_route')
        // Yang jaga kantor & yang belum memilih tidak tiba-tiba "ada di TKP".
        ->and($status->has($this->anggota2->id))->toBeFalse()
        ->and($status->has($this->anggota3->id))->toBeFalse();
});

it('records regu members who chose nothing as alpha when the incident is closed', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota2)->post(route('reports.stay-at-base', $this->report));

    $this->actingAs($this->admin)->post(route('reports.resolve', $this->report))->assertSessionHasNoErrors();
    // Menutup ulang tak menggandakan catatan.
    $this->actingAs($this->admin)->post(route('reports.resolve', $this->report));

    $alpha = ReportAlpha::where('report_id', $this->report->id)->orderBy('user_name')->get();
    expect($alpha->pluck('user_name')->all())->toBe(['Danru Made', 'Nyoman Anggota'])
        ->and($alpha->pluck('regu_name')->unique()->values()->all())->toBe(['Regu A'])
        // Regu B tak satu pun menanggapi: bisa jadi memang lepas jaga, jadi tidak dituduh.
        ->and(ReportAlpha::where('user_name', 'Danru Putu')->exists())->toBeFalse();
});

it('shows the alpha list to admins only, never to petugas or pejabat', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->admin)->post(route('reports.resolve', $this->report));

    $this->actingAs($this->admin)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page
            ->where('alphaMembers.0.regu', 'Regu A')
            ->where('alphaMembers.0.names', ['Danru Made', 'Nyoman Anggota', 'Wayan Anggota']));

    $this->actingAs($this->anggota1)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page->where('alphaMembers', []));

    $pejabat = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $pejabat->assignRole('pejabat');
    $this->actingAs($pejabat)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page->where('alphaMembers', []));
});

it('writes the alpha members into the admin excel export', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->admin)->post(route('reports.resolve', $this->report));

    $response = $this->actingAs($this->admin)->get('/admin/reports/export');
    $sheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet();
    $cells = collect($sheet->toArray())->flatten()->filter()->values();

    expect($cells)->toContain('Alpha (Tidak Memilih)');
    expect($cells->contains(fn ($c) => str_contains((string) $c, 'Nyoman Anggota (Regu A)')))->toBeTrue();
});

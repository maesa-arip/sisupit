<?php

use App\Events\ResponderLocationUpdated;
use App\Models\Regu;
use App\Models\Report;
use App\Models\ReportAlpha;
use App\Models\TrackingLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
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

// FINDINGS #154: satu ketukan Tiba menandai rekan seregu, jadi SIAPA yang menandainya dicatat
// di tiap baris dan disebut di manifes bila bukan dirinya sendiri.
it('records who pressed tiba on every row it marked, and shows it on the detail page', function () {
    $this->actingAs($this->danru)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));

    $this->actingAs($this->anggota1)->post(route('reports.arrive', $this->report))->assertSessionHasNoErrors();

    $by = DB::table('report_officers')->where('report_id', $this->report->id)->pluck('arrived_by', 'user_id');
    expect((int) $by[$this->danru->id])->toBe($this->anggota1->id)
        ->and((int) $by[$this->anggota1->id])->toBe($this->anggota1->id);

    $this->actingAs($this->admin)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page->has('report.officers', 2, fn ($o) => $o->etc())
            ->where('report.officers', fn ($officers) => collect($officers)
                ->firstWhere('user_id', $this->danru->id)['arriver']['name'] === 'Ketut Anggota'));

    $jsx = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));
    expect($jsx)->toMatch('~officer\.arrived_by !== officer\.user_id~')->toContain('Ditandai tiba oleh');
});

// FINDINGS #210: ping GPS live berhenti selama layar HP petugas terkunci, jadi posisi saat Tiba
// ditekan menjadi posisi terkini PENEKANNYA (bukan rekan seregu) + jejak + siaran ke peta.
it('moves the presser to where they pressed tiba, and never lets a broken location stop the button', function () {
    Event::fake([ResponderLocationUpdated::class]);
    $this->actingAs($this->danru)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));

    $this->actingAs($this->anggota1)
        ->post(route('reports.arrive', $this->report), ['lat' => -8.6501, 'lng' => 115.2203, 'accuracy' => 9])
        ->assertSessionHasNoErrors();

    $rows = DB::table('report_officers')->where('report_id', $this->report->id)->get()->keyBy('user_id');
    expect((float) $rows[$this->anggota1->id]->location_lat)->toBe(-8.6501)
        ->and((float) $rows[$this->anggota1->id]->location_lng)->toBe(115.2203)
        ->and($rows[$this->danru->id]->status)->toBe('arrived')
        ->and($rows[$this->danru->id]->location_lat)->toBeNull();
    expect(TrackingLog::where('report_id', $this->report->id)->where('user_id', $this->anggota1->id)->count())->toBe(1);
    Event::assertDispatched(ResponderLocationUpdated::class, fn ($e) => $e->responderId === $this->anggota1->id);

    // Tanpa lokasi / lokasi rusak: tetap tiba, posisi tak disentuh, tak ada jejak palsu.
    $lepas = ($this->petugas)('Gede Lepas');
    $this->actingAs($lepas)->post(route('reports.take-action', $this->report));
    $this->actingAs($lepas)
        ->post(route('reports.arrive', $this->report), ['lat' => 'abc', 'lng' => 999])
        ->assertSessionHasNoErrors();

    $row = DB::table('report_officers')->where('user_id', $lepas->id)->first();
    expect($row->status)->toBe('arrived')->and($row->location_lat)->toBeNull();
    expect(TrackingLog::where('user_id', $lepas->id)->count())->toBe(0);

    $jsx = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));
    expect($jsx)->toMatch("~await getClickLocation\(\);\s*router\.post\(\s*route\('reports\.arrive'~");
});

// FINDINGS #211 + #210 (APK 1.1.9): ping posisi hanya dari responder yang masih Meluncur/Tiba di
// insiden itu. Selain itu balasan {"status":"stopped"} tanpa menulis apa pun - sinyal berhenti bagi
// layanan lokasi APK yang terus mengirim selama layar terkunci.
it('accepts location pings only from responders still on the mission, and tells the rest to stop', function () {
    $ping = ['lat' => -8.651, 'lng' => 115.221];

    // Bukan responder insiden ini.
    $this->actingAs($this->anggota3)
        ->postJson("/reports/{$this->report->id}/update-location", $ping)
        ->assertOk()->assertJson(['status' => 'stopped']);
    expect(TrackingLog::where('user_id', $this->anggota3->id)->count())->toBe(0);

    // Sedang meluncur: diterima.
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota1)
        ->postJson("/reports/{$this->report->id}/update-location", $ping)
        ->assertOk()->assertJson(['status' => 'ok']);
    expect(TrackingLog::where('user_id', $this->anggota1->id)->count())->toBe(1);

    // Insiden ditutup: berhenti, jejak tak bertambah.
    $this->actingAs($this->admin)->post(route('reports.resolve', $this->report));
    $this->actingAs($this->anggota1)
        ->postJson("/reports/{$this->report->id}/update-location", $ping)
        ->assertOk()->assertJson(['status' => 'stopped']);
    expect(TrackingLog::where('user_id', $this->anggota1->id)->count())->toBe(1);
});

it('hands the mission to the native location service and stops it only for this incident', function () {
    $jsx = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));
    expect($jsx)
        ->toContain("typeof bridge?.startResponderTracking === 'function'")
        ->toContain('bridge.startResponderTracking(String(report.id), window.location.origin)')
        ->toMatch('~respondingReportRef\.current === report\.id && typeof bridge\?\.stopResponderTracking~');
});

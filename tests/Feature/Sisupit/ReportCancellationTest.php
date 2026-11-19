<?php

use App\Exports\ReportsExport;
use App\Models\Report;
use App\Models\ReportCancellation;
use App\Models\User;
use App\Notifications\ReportCancellationNotification;
use App\Notifications\ReportStatusUpdatedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * TASK_91. Tim sudah Meluncur, lalu pelapor mengabari kejadiannya batal. Dulu satu-satunya jalan
 * menutupnya "Tolak" (tercatat hoaks, pelapornya jujur) atau "Selesai" (tercatat ditangani +
 * alpha regu). Kini petugas MENGAJUKAN pembatalan beralasan dan admin MEMUTUSKAN (TASK_51).
 *
 * Yang dijaga: alasan wajib; peran & wilayah kedua gerbang; disetujui = status `dibatalkan`,
 * penugasan & unit dilepas, tanpa alpha; laporan dibatalkan tak bisa diaksi lagi; status baru
 * dikenal semua kamus layar & ekspor; prop tombol = gerbang endpoint.
 */
beforeEach(function () {
    Notification::fake();

    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $wilayah = ['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006'];

    $this->reporter = User::factory()->create($wilayah);
    $this->reporter->assignRole('warga');

    $this->petugas = User::factory()->create($wilayah + ['name' => 'Petugas Satu']);
    $this->petugas->assignRole('petugas');

    $this->rekan = User::factory()->create($wilayah + ['name' => 'Petugas Dua']);
    $this->rekan->assignRole('petugas');

    $this->admin = User::factory()->create($wilayah + ['name' => 'Admin Pusat']);
    $this->admin->assignRole('admin');

    $this->report = Report::create($wilayah + [
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran dapur warga',
        'description' => 'Asap dari dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'handling',
    ]);

    foreach ([$this->petugas, $this->rekan] as $u) {
        DB::table('report_officers')->insert([
            'report_id' => $this->report->id,
            'user_id' => $u->id,
            'status' => 'en_route',
            'dispatched_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    $this->ajukan = fn (string $reason = 'Dibatalkan oleh pelapor') => $this->actingAs($this->petugas)
        ->post(route('reports.cancellation.request', $this->report->id), ['reason' => $reason]);
});

it('requires a reason before a cancellation can be requested', function () {
    ($this->ajukan)('')->assertSessionHasErrors('reason');
    ($this->ajukan)('oke')->assertSessionHasErrors('reason');

    expect(ReportCancellation::count())->toBe(0);
});

it('records the request, keeps the mission running, and tells the admin', function () {
    ($this->ajukan)('Pelapor menelepon, api sudah padam')->assertRedirect()->assertSessionHasNoErrors();

    $batal = ReportCancellation::sole();
    expect($batal->status)->toBe(ReportCancellation::STATUS_MENUNGGU)
        ->and($batal->requester_name)->toBe('Petugas Satu')
        ->and($batal->reason)->toBe('Pelapor menelepon, api sudah padam')
        ->and($this->report->refresh()->status)->toBe('handling');

    Notification::assertSentTo($this->admin, ReportCancellationNotification::class,
        fn ($n) => $n->event === ReportCancellationNotification::REQUESTED && $n->report->id === $this->report->id);
    Notification::assertNotSentTo($this->petugas, ReportCancellationNotification::class);

    // Pengajuan kedua selagi yang pertama menunggu = admin memutuskan hal yang sama dua kali.
    $this->actingAs($this->rekan)
        ->post(route('reports.cancellation.request', $this->report->id), ['reason' => 'Dibatalkan oleh pelapor'])
        ->assertForbidden();
});

it('lets only a petugas in the report area request, and only an admin decide', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');
    $petugasLuar = User::factory()->create(['province_code' => '51', 'city_code' => '5103']);
    $petugasLuar->assignRole('petugas');

    foreach ([$relawan, $petugasLuar, $this->admin, $this->reporter] as $u) {
        $this->actingAs($u)
            ->post(route('reports.cancellation.request', $this->report->id), ['reason' => 'Dibatalkan oleh pelapor'])
            ->assertForbidden();
    }

    ($this->ajukan)()->assertRedirect();

    // Petugas (termasuk pengajunya sendiri) tak boleh memutuskan - TASK_51.
    $this->actingAs($this->petugas)->post(route('reports.cancellation.approve', $this->report->id))->assertForbidden();
    $this->actingAs($this->rekan)->post(route('reports.cancellation.decline', $this->report->id))->assertForbidden();

    $adminLuar = User::factory()->create(['province_code' => '51', 'city_code' => '5103']);
    $adminLuar->assignRole('admin');
    $this->actingAs($adminLuar)->post(route('reports.cancellation.approve', $this->report->id))->assertForbidden();

    expect($this->report->refresh()->status)->toBe('handling');
});

it('refuses requests on raw, closed, or merged reports', function () {
    foreach (['TERLAPOR', 'resolved', 'ditolak', Report::STATUS_DIGABUNG] as $status) {
        $this->report->update(['status' => $status]);
        ($this->ajukan)()->assertForbidden();
    }

    expect(ReportCancellation::count())->toBe(0);
});

it('cancels the report on approval: responders stood down, units released, no alpha, reporter told', function () {
    $unit = \App\Models\Unit::create(['name' => 'Damkar 01', 'type' => 'truk', 'status' => 'dispatched', 'province_code' => '51']);
    \App\Models\ReportUnit::create(['report_id' => $this->report->id, 'unit_id' => $unit->id, 'status' => 'dispatched', 'dispatched_at' => now()]);

    ($this->ajukan)()->assertRedirect();
    $this->actingAs($this->admin)->post(route('reports.cancellation.approve', $this->report->id))->assertRedirect();

    expect($this->report->refresh()->status)->toBe(Report::STATUS_DIBATALKAN)
        ->and(ReportCancellation::sole()->status)->toBe(ReportCancellation::STATUS_DISETUJUI)
        ->and(ReportCancellation::sole()->decider_name)->toBe('Admin Pusat')
        ->and(DB::table('report_officers')->where('report_id', $this->report->id)->pluck('status')->unique()->all())->toBe(['finished'])
        ->and($unit->refresh()->status)->toBe('available')
        ->and(DB::table('report_alpha')->where('report_id', $this->report->id)->count())->toBe(0);

    Notification::assertSentTo($this->reporter, ReportStatusUpdatedNotification::class, fn ($n) => $n->event === 'cancelled');
    // Rekan yang masih di jalan WAJIB tahu misinya berhenti - bukan hanya pengajunya.
    foreach ([$this->petugas, $this->rekan] as $u) {
        Notification::assertSentTo($u, ReportCancellationNotification::class,
            fn ($n) => $n->event === ReportCancellationNotification::APPROVED);
    }
});

it('keeps the mission running when the admin declines, and tells the requester why', function () {
    ($this->ajukan)()->assertRedirect();
    $this->actingAs($this->admin)
        ->post(route('reports.cancellation.decline', $this->report->id), ['note' => 'Pelapor tak bisa dihubungi, cek ke lokasi'])
        ->assertRedirect();

    $batal = ReportCancellation::sole();
    expect($this->report->refresh()->status)->toBe('handling')
        ->and($batal->status)->toBe(ReportCancellation::STATUS_DITOLAK)
        ->and($batal->decision_note)->toBe('Pelapor tak bisa dihubungi, cek ke lokasi');

    Notification::assertSentTo($this->petugas, ReportCancellationNotification::class,
        fn ($n) => $n->event === ReportCancellationNotification::DECLINED && $n->reason === 'Pelapor tak bisa dihubungi, cek ke lokasi');

    // Sesudah ditolak, keadaan bisa berubah - boleh diajukan lagi.
    ($this->ajukan)('Pelapor menelepon lagi, api padam')->assertRedirect();
    expect(ReportCancellation::where('status', ReportCancellation::STATUS_MENUNGGU)->count())->toBe(1);
});

it('treats a cancelled report as closed for every field action', function () {
    ($this->ajukan)()->assertRedirect();
    $this->actingAs($this->admin)->post(route('reports.cancellation.approve', $this->report->id))->assertRedirect();

    $petugasBaru = User::factory()->create(['village_code' => '5171012006']);
    $petugasBaru->assignRole('petugas');

    $this->actingAs($petugasBaru)->post(route('reports.take-action', $this->report->id))->assertForbidden();
    $this->actingAs($this->admin)->post(route('reports.resolve', $this->report->id))->assertForbidden();
    $this->actingAs($this->admin)->post(route('reports.reject', $this->report->id))->assertForbidden();

    // Layanan lokasi APK berhenti saat server menjawab "stopped" (#210/#211).
    $this->actingAs($this->petugas)
        ->postJson("/reports/{$this->report->id}/update-location", ['lat' => -8.65, 'lng' => 115.22])
        ->assertJson(['status' => 'stopped']);

    expect($this->report->refresh()->status)->toBe(Report::STATUS_DIBATALKAN);
});

it('sends the cancel buttons from the same rule as the endpoints', function () {
    $this->actingAs($this->petugas)->get(route('reports.show', $this->report->id))
        ->assertInertia(fn ($page) => $page->where('canRequestCancellation', true)
            ->where('canDecideCancellation', false)->where('cancellation', null));

    ($this->ajukan)()->assertRedirect();

    $this->actingAs($this->petugas)->get(route('reports.show', $this->report->id))
        ->assertInertia(fn ($page) => $page->where('canRequestCancellation', false)
            ->where('cancellation.status', ReportCancellation::STATUS_MENUNGGU)
            ->where('cancellation.requester_name', 'Petugas Satu'));

    $this->actingAs($this->admin)->get(route('reports.show', $this->report->id))
        ->assertInertia(fn ($page) => $page->where('canDecideCancellation', true)->where('canRequestCancellation', false));

    // Pelapor melihat alasannya, bukan nama pengaju/pemutus (audiens jejak penutupan #88).
    $this->actingAs($this->admin)->post(route('reports.cancellation.approve', $this->report->id));
    $this->actingAs($this->reporter)->get(route('reports.show', $this->report->id))
        ->assertInertia(fn ($page) => $page->where('cancellation.reason', 'Dibatalkan oleh pelapor')
            ->where('cancellation.requester_name', null)->where('cancellation.decider_name', null));
});

it('names the status a cancellation really writes, in every status dictionary and the export', function () {
    ($this->ajukan)('Api sudah padam sebelum tim tiba')->assertRedirect();
    $this->actingAs($this->admin)->post(route('reports.cancellation.approve', $this->report->id));

    $ditulis = $this->report->refresh()->status;
    $labels = (new ReflectionClass(ReportsExport::class))->getConstant('STATUS_LABELS');

    preg_match('/const STATUS_META = \{(.*?)\n\};/s', file_get_contents(resource_path('js/Pages/Admin/Reports/Index.jsx')), $meta);
    preg_match('/const REPORT_STATUS = \[(.*?)\n\];/s', file_get_contents(resource_path('js/Pages/Monitoring/Map.jsx')), $map);

    expect($ditulis)->toBe(Report::STATUS_DIBATALKAN)
        ->and($labels)->toHaveKey($ditulis)
        ->and($meta[1])->toMatch('/^\t'.$ditulis.': \{/m')
        ->and($map[1])->toContain("key: '".$ditulis."'")
        ->and(file_get_contents(resource_path('js/Components/StatusBadge.jsx')))->toMatch('/^\t'.$ditulis.': \{ label:/m')
        ->and(file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx')))->toMatch("/case '".$ditulis."':/")
        ->and(file_get_contents(resource_path('js/Components/ReportProgress.jsx')))->toContain("STATUS_DIBATALKAN = '".$ditulis."'");

    $response = $this->actingAs($this->admin)->get('/admin/reports/export?status=Semua');
    $sheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet();
    $cells = collect($sheet->toArray())->flatten()->filter()->values();

    expect($cells)->toContain('Dibatalkan')
        ->and($cells->contains(fn ($c) => str_starts_with((string) $c, 'Dibatalkan: Api sudah padam sebelum tim tiba')))->toBeTrue();
});

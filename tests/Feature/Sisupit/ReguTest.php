<?php

use App\Models\Regu;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Regu & Danru (TASK_60). Keputusan user yang dikunci di sini:
 *   - danru = atribut regu (leader_id), mengatur anggota regunya sendiri;
 *   - anggota regu = PETUGAS SAJA, satu petugas di satu regu;
 *   - tiap anggota WAJIB menekan tombolnya sendiri - "Meluncur" (nama regu di-snapshot ke
 *     barisnya) atau "Jaga di Kantor";
 *   - Jaga di Kantor TEPAT SATU per regu per kejadian;
 *   - anggota mana pun boleh memulai, tidak harus danru.
 */
beforeEach(function () {
    Notification::fake();

    $this->petugas = function (array $attrs = []) {
        $user = User::factory()->create(array_merge([
            'province_code' => '51',
            'city_code' => '5171',
        ], $attrs));
        $user->assignRole('petugas');

        return $user;
    };

    $this->admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->admin->assignRole('admin');

    $this->danru = ($this->petugas)(['name' => 'Danru Made']);
    $this->anggota1 = ($this->petugas)(['name' => 'Ketut Anggota']);
    $this->anggota2 = ($this->petugas)(['name' => 'Wayan Anggota']);

    $this->actingAs($this->admin)
        ->post(route('regu.store'), ['name' => 'Regu A', 'leader_id' => $this->danru->id])
        ->assertSessionHasNoErrors();
    $this->regu = Regu::withoutGlobalScopes()->where('name', 'Regu A')->firstOrFail();

    $this->actingAs($this->danru)
        ->put(route('regu.members', $this->regu), ['member_ids' => [$this->anggota1->id, $this->anggota2->id]])
        ->assertSessionHasNoErrors();

    // Wilayah lengkap supaya pelapor tak dipantulkan EnsureProfileComplete saat membuka detail.
    $reporter = User::factory()->create([
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
    ]);
    $reporter->assignRole('warga');
    $this->reporter = $reporter;

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

it('lets an admin create a regu whose danru is its first member and whose area is the danru kabupaten', function () {
    expect($this->regu->leader_id)->toBe($this->danru->id)
        ->and($this->regu->city_code)->toBe('5171')
        ->and($this->regu->district_code)->toBeNull()
        ->and($this->regu->members()->pluck('users.id')->sort()->values()->all())
        ->toBe(collect([$this->danru->id, $this->anggota1->id, $this->anggota2->id])->sort()->values()->all());
});

it('lets only the danru or an admin set the members, and keeps the danru in the regu', function () {
    // Anggota biasa bukan danru.
    $this->actingAs($this->anggota1)
        ->put(route('regu.members', $this->regu), ['member_ids' => [$this->anggota1->id]])
        ->assertForbidden();

    // Petugas biasa tak boleh membuat regu - itu wewenang admin.
    $this->actingAs($this->danru)
        ->post(route('regu.store'), ['name' => 'Regu Liar', 'leader_id' => $this->danru->id])
        ->assertForbidden();

    // Danru mengosongkan daftar: dirinya tetap tinggal.
    $this->actingAs($this->danru)
        ->put(route('regu.members', $this->regu), ['member_ids' => []])
        ->assertSessionHasNoErrors();

    expect($this->regu->members()->pluck('users.id')->all())->toBe([$this->danru->id]);
});

it('refuses members who are not petugas of the same kabupaten or already in another regu', function () {
    $relawan = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $relawan->assignRole('relawan');
    $tetangga = ($this->petugas)(['city_code' => '5103']);

    foreach ([$relawan, $tetangga] as $orang) {
        $this->actingAs($this->danru)
            ->put(route('regu.members', $this->regu), ['member_ids' => [$orang->id]])
            ->assertSessionHasErrors('member_ids');
    }

    // Petugas yang sudah di Regu B tidak bisa ditarik diam-diam ke Regu A.
    $danruB = ($this->petugas)();
    $this->actingAs($this->admin)->post(route('regu.store'), ['name' => 'Regu B', 'leader_id' => $danruB->id]);

    $this->actingAs($this->danru)
        ->put(route('regu.members', $this->regu), ['member_ids' => [$danruB->id]])
        ->assertSessionHasErrors('member_ids');

    expect(DB::table('regu_members')->where('user_id', $danruB->id)->value('regu_id'))
        ->not->toBe($this->regu->id);
});

it('hides a regu from an admin of another kabupaten', function () {
    $adminLain = User::factory()->create(['province_code' => '51', 'city_code' => '5103']);
    $adminLain->assignRole('admin');

    $this->actingAs($adminLain)
        ->put(route('regu.update', $this->regu), ['name' => 'Diambil', 'leader_id' => $this->danru->id])
        ->assertNotFound();
    $this->actingAs($adminLain)->delete(route('regu.destroy', $this->regu))->assertNotFound();
});

it('stamps the regu on each member who takes action, and keeps that stamp after the regu is renamed', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report))->assertRedirect();

    $row = DB::table('report_officers')->where('report_id', $this->report->id)->where('user_id', $this->anggota1->id)->first();
    expect($row->regu_id)->toBe($this->regu->id)->and($row->regu_name)->toBe('Regu A');

    // Klik anggota pertama TIDAK mengklaim anggota lain berangkat - tiap orang menekan sendiri.
    expect(DB::table('report_officers')->where('report_id', $this->report->id)->count())->toBe(1);

    $this->actingAs($this->admin)
        ->put(route('regu.update', $this->regu), ['name' => 'Regu Alfa', 'leader_id' => $this->danru->id]);

    expect(DB::table('report_officers')->where('user_id', $this->anggota1->id)->value('regu_name'))->toBe('Regu A');
});

it('lets exactly one member per regu stay at the office for an incident', function () {
    $this->actingAs($this->anggota1)->post(route('reports.stay-at-base', $this->report))->assertSessionHasNoErrors();

    // Anggota kedua ditolak - kursi jaga kantor regu ini sudah terisi.
    $this->actingAs($this->anggota2)
        ->post(route('reports.stay-at-base', $this->report))
        ->assertSessionHasErrors('jaga_kantor');

    expect(DB::table('report_jaga_kantor')->where('report_id', $this->report->id)->pluck('user_id')->all())
        ->toBe([$this->anggota1->id]);

    // Yang jaga kantor BUKAN responder: tak ada di report_officers, jadi tak tergambar di peta
    // dan tak dihitung sebagai responder aktif.
    expect(DB::table('report_officers')->where('user_id', $this->anggota1->id)->exists())->toBeFalse();
});

it('keeps meluncur and jaga kantor mutually exclusive until one is cancelled', function () {
    $this->actingAs($this->anggota1)->post(route('reports.stay-at-base', $this->report));
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report))->assertForbidden();

    $this->actingAs($this->anggota1)->delete(route('reports.cancel-stay', $this->report))->assertRedirect();
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report))->assertRedirect();

    // Sudah meluncur: tak bisa sekaligus jaga kantor.
    $this->actingAs($this->anggota1)->post(route('reports.stay-at-base', $this->report))->assertForbidden();
});

it('refuses jaga kantor to petugas without a regu, outside the area, or on a closed incident', function () {
    $tanpaRegu = ($this->petugas)();
    $this->actingAs($tanpaRegu)->post(route('reports.stay-at-base', $this->report))->assertForbidden();

    // Petugas tanpa regu tetap meluncur perorangan, tanpa nama regu.
    $this->actingAs($tanpaRegu)->post(route('reports.take-action', $this->report))->assertRedirect();
    expect(DB::table('report_officers')->where('user_id', $tanpaRegu->id)->value('regu_name'))->toBeNull();

    $this->report->update(['status' => 'resolved']);
    $this->actingAs($this->anggota2)->post(route('reports.stay-at-base', $this->report))->assertForbidden();
});

it('shows the regu, who stays, and who has not chosen to staff, but not to the reporter', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota2)->post(route('reports.stay-at-base', $this->report));

    $this->actingAs($this->admin)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page
            ->where('reguRoster.0.key', 'id:'.$this->regu->id)
            ->where('reguRoster.0.name', 'Regu A')
            ->where('reguRoster.0.leader', 'Danru Made')
            ->where('reguRoster.0.stay', 'Wayan Anggota')
            ->where('reguRoster.0.pending', ['Danru Made']));

    // Pelapor melihat nama regu yang meluncur, tapi bukan siapa yang tidak berangkat.
    $this->actingAs($this->reporter)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page
            ->where('reguRoster.0.name', 'Regu A')
            ->where('reguRoster.0.stay', null)
            ->where('reguRoster.0.pending', []));
});

it('offers the jaga kantor button only while the regu seat is free and the viewer has not left', function () {
    $this->actingAs($this->danru)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page->where('canStayAtBase', true)->where('myRegu.is_leader', true));

    $this->actingAs($this->anggota1)->post(route('reports.stay-at-base', $this->report));

    $this->actingAs($this->anggota2)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page
            ->where('canStayAtBase', false)
            ->where('myRegu.stay_taken_by', 'Ketut Anggota'));

    $this->actingAs($this->anggota1)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page->where('myRegu.i_stay', true));
});

it('reads the jaga kantor button from the server prop, not from roles in the page', function () {
    $source = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));

    expect($source)->toContain('props.canStayAtBase')
        ->and($source)->toContain("route('reports.stay-at-base'")
        ->and($source)->toContain("route('reports.cancel-stay'");
});

it('names the regu that took action on each mission of the petugas dashboard', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota2)->post(route('reports.take-action', $this->report));

    // Dua anggota regu yang sama = satu nama regu, bukan dua.
    $this->actingAs($this->danru)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('Petugas/Dashboard')
            ->where('activeMissions.0.id', $this->report->id)
            ->where('activeMissions.0.regus', ['Regu A'])
            ->where('myRegu.name', 'Regu A')
            ->where('myRegu.is_leader', true));
});

it('writes the regu that took action, with its headcount, into the excel export', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota2)->post(route('reports.take-action', $this->report));
    $perorangan = ($this->petugas)();
    $this->actingAs($perorangan)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->danru)->post(route('reports.stay-at-base', $this->report));

    // Snapshot: rename sesudahnya tak boleh mengubah rekap.
    $this->actingAs($this->admin)
        ->put(route('regu.update', $this->regu), ['name' => 'Regu Alfa', 'leader_id' => $this->danru->id]);

    $path = $this->actingAs($this->admin)->get('/admin/reports/export')->baseResponse->getFile()->getPathname();
    $cells = collect(\PhpOffice\PhpSpreadsheet\IOFactory::load($path)->getActiveSheet()->toArray())
        ->flatten()->filter()->values()->all();

    // Petugas tanpa regu tidak menambah hitungan regu mana pun.
    expect($cells)->toContain('Regu Meluncur')
        ->and($cells)->toContain('Regu A (2 orang)')
        ->and($cells)->not->toContain('Regu Alfa (2 orang)')
        // Yang jaga kantor: nama petugas + regunya saat itu, di kolom sendiri.
        ->and($cells)->toContain('Jaga di Kantor')
        ->and($cells)->toContain('Danru Made (Regu A)');
});

it('groups the regu members under the regu name in the berita acara team prefill', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota2)->post(route('reports.take-action', $this->report));
    $perorangan = ($this->petugas)(['name' => 'Nyoman Perorangan']);
    $this->actingAs($perorangan)->post(route('reports.take-action', $this->report));

    // Snapshot: rename sesudahnya tak boleh mengubah isi dokumen resmi.
    $this->actingAs($this->admin)
        ->put(route('regu.update', $this->regu), ['name' => 'Regu Alfa', 'leader_id' => $this->danru->id]);

    $this->actingAs($this->danru)->get(route('reports.resolution.create', $this->report))
        ->assertInertia(fn ($page) => $page
            ->where('prefill.tim_atensi', 'Nyoman Perorangan, Regu A (Ketut Anggota, Wayan Anggota)'));
});

it('sends the regu that took action to the monitoring map', function () {
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota2)->post(route('reports.take-action', $this->report));

    $this->actingAs($this->admin)->get(route('front.monitoring.map'))
        ->assertInertia(fn ($page) => $page
            ->where('layers.reports.0.id', $this->report->id)
            ->where('layers.reports.0.regus', ['Regu A']));
});

// Popup Leaflet adalah HTML mentah (innerHTML). Nama regu diketik admin, jadi tanpa escape ia
// bisa menyisipkan markup ke layar semua staf yang membuka peta.
it('escapes the regu names before they enter the leaflet popup html', function () {
    $source = file_get_contents(resource_path('js/Pages/Monitoring/Map.jsx'));

    // Helper-nya bersama sejak #131 (lib/escape-html.js, dijaga LeafletPopupEscapeTest).
    expect($source)->toContain('regus.map(escapeHtml)')
        ->and($source)->toContain("import { escapeHtml } from '@/lib/escape-html';");
});

it('shows no regu on the petugas dashboard for a petugas without one', function () {
    $tanpaRegu = ($this->petugas)();

    $this->actingAs($tanpaRegu)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('myRegu', null)
            ->where('activeMissions.0.regus', []));
});

// Peta detail insiden (§13 TASK_60, permintaan user): satu regu bisa 8 petugas dan 3-4 regu bisa
// meluncur - satu marker per orang menumpuk puluhan marker & rute di satu titik. Marker regu
// diletakkan di GPS danru, jadi server wajib mengirim id-nya (nama petugas tidak unik).
it('sends the danru id of each regu so the detail map can anchor the regu marker on him', function () {
    $this->actingAs($this->danru)->post(route('reports.take-action', $this->report));
    $this->actingAs($this->anggota1)->post(route('reports.take-action', $this->report));

    $this->actingAs($this->reporter)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page
            ->where('reguRoster.0.key', 'id:'.$this->regu->id)
            ->where('reguRoster.0.leader_id', $this->danru->id)
            ->where('report.officers.0.regu_id', $this->regu->id));
});

it('draws one marker per regu on the detail map instead of one per member', function () {
    // Komentar dibuang dulu - berkasnya sendiri menjelaskan bentuk lama (pelajaran #108).
    $source = preg_replace(['~/\*.*?\*/~s', '~^\s*//.*$~m'], '', file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx')));

    $start = strpos($source, 'officerList.forEach((o) => {');
    $block = substr($source, $start, strpos($source, 'helperList.forEach', $start) - $start);

    // Petugas beregu tidak digambar per orang: kuncinya dibaca dulu, lalu dikumpulkan ke regunya.
    expect($block)->toMatch('/const key = reguKeyOf\(o\);\s*if \(!key\) \{/')
        ->and($block)->toContain('reguGroups.get(key).members.push(o)')
        // Satu marker & satu rute per regu, berlabel & diletakkan di danru.
        ->and($block)->toContain('const markerKey = `regu:${key}`;')
        ->and($block)->toMatch('/renderMarker\(markerKey, [^;]*, regu\)/')
        ->and($block)->toMatch('/drawResponderRoute\(markerKey,/')
        ->and($block)->toContain('info?.leader_id');
});

<?php

use App\Events\ReportRecordChanged;
use App\Events\ReporterCallChanged;
use App\Models\Report;
use App\Models\ReporterCall;
use App\Models\User;
use App\Notifications\ReporterCallNotification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

/**
 * TASK_90 tahap 1 - panggilan suara Pusat Komando -> pelapor lewat Sisupit (WebRTC, sinyal lewat
 * server), lahir dari kejadian nyata: laporan benar, nomor pelapor tak bisa ditelepon.
 *
 * Yang dijaga: (1) pemanggil = Pusat Komando di wilayah laporan, satu rumus untuk tombol & gerbang;
 * (2) pihak lain = peserta panggilan saja (akun pelapor, atau tamu lewat URL bertanda tangan);
 * (3) siaran hanya aba-aba (SDP tak lewat channel) dan push pelapor ber-type report_status tanpa
 * broadcast (APK lama & exe desktop: jenis tak dikenal = sirine); (4) satu panggilan per laporan,
 * dering yang tak diangkat ditutup sendiri; (5) form lapor meminta konfirmasi nomor.
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5103', 'province_code' => '51', 'name' => 'Kabupaten Badung'],
    ]);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $this->wilayah = ['province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006'];
    $this->buat = function (string $role, array $wilayah, array $extra = []) {
        $u = User::factory()->create($wilayah + $extra);
        $u->assignRole($role);

        return $u;
    };

    $this->reporter = ($this->buat)('warga', $this->wilayah, ['phone' => '081234567890']);
    $this->admin = ($this->buat)('admin', ['province_code' => '51', 'city_code' => '5171', 'district_code' => null, 'village_code' => null]);
    $this->petugas = ($this->buat)('petugas', ['province_code' => '51', 'city_code' => '5171', 'district_code' => null, 'village_code' => null]);

    $this->report = Report::create($this->wilayah + [
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah',
        'phone' => '081234567890',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
    ]);

    Notification::fake();
    Event::fake([ReporterCallChanged::class, ReportRecordChanged::class]);
});

function startCall($test, User $caller, ?Report $report = null)
{
    return $test->actingAs($caller)->postJson(route('reports.calls.start', ($report ?? $test->report)->id), ['offer_sdp' => "v=0\r\no=offer"]);
}

it('lets the command center in the report area call the reporter, and rings the reporter', function () {
    startCall($this, $this->admin)
        ->assertCreated()
        ->assertJsonPath('call.status', 'ringing')
        ->assertJsonPath('call.side', 'caller');

    $call = ReporterCall::sole();
    expect($call->callee_user_id)->toBe($this->reporter->id)
        ->and($call->caller_name)->toBe($this->admin->name);

    Event::assertDispatched(ReporterCallChanged::class, function (ReporterCallChanged $e) use ($call) {
        $names = array_map(fn ($c) => $c->name, $e->broadcastOn());

        return $e->callId === $call->id
            && in_array('private-App.Models.User.'.$this->admin->id, $names, true)
            && in_array('private-App.Models.User.'.$this->reporter->id, $names, true);
    });
    // Riwayat panggilan di detail laporan ikut berubah (#113).
    Event::assertDispatched(ReportRecordChanged::class, fn ($e) => $e->reportId === $this->report->id);
    Notification::assertSentTo($this->reporter, ReporterCallNotification::class);

    // Petugas sewilayah juga Pusat Komando - boleh menelepon (sesudah panggilan pertama selesai).
    $call->end('cancelled', 'caller');
    startCall($this, $this->petugas)->assertCreated();
});

it('refuses callers outside the command center or outside the report area', function () {
    $relawan = ($this->buat)('relawan', $this->wilayah);
    $pejabat = ($this->buat)('pejabat', $this->wilayah);
    $wargaLain = ($this->buat)('warga', $this->wilayah);
    $adminBadung = ($this->buat)('admin', ['province_code' => '51', 'city_code' => '5103', 'district_code' => null, 'village_code' => null]);

    foreach ([$this->reporter, $relawan, $pejabat, $wargaLain, $adminBadung] as $user) {
        startCall($this, $user)->assertForbidden();
    }
    $this->actingAs($this->reporter)->getJson(route('calls.ice'))->assertForbidden();

    expect(ReporterCall::count())->toBe(0);
});

it('does not call reports typed by an operator, whose reporter is the operator', function () {
    $laporanTelepon = Report::create($this->wilayah + [
        'user_id' => $this->petugas->id,
        'title' => 'Laporan telepon',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
    ]);

    startCall($this, $this->admin, $laporanTelepon)->assertForbidden();
    $this->actingAs($this->admin)->get(route('reports.show', $laporanTelepon->id))
        ->assertInertia(fn ($page) => $page->where('canCallReporter', false));
});

it('keeps one active call per report', function () {
    startCall($this, $this->admin)->assertCreated();

    startCall($this, $this->petugas)->assertStatus(409)->assertJsonPath('message', 'Pelapor sedang ditelepon oleh '.$this->admin->name.'.');
    expect(ReporterCall::count())->toBe(1);
});

it('hands the offer to the reporter and the answer back to the caller, participants only', function () {
    startCall($this, $this->admin);
    $call = ReporterCall::sole();

    $this->actingAs($this->reporter)->getJson(route('calls.state', $call))
        ->assertOk()
        ->assertJsonPath('call.side', 'callee')
        ->assertJsonPath('call.offer_sdp', "v=0\r\no=offer")
        ->assertJsonPath('call.callback_phone', '113')
        ->assertJsonMissingPath('call.caller_name');

    // Bukan peserta: warga lain, bahkan admin lain sewilayah, tak bisa membaca/menjawab.
    $adminLain = ($this->buat)('admin', ['province_code' => '51', 'city_code' => '5171', 'district_code' => null, 'village_code' => null]);
    foreach ([($this->buat)('warga', $this->wilayah), $adminLain] as $orangLain) {
        $this->actingAs($orangLain)->getJson(route('calls.state', $call))->assertForbidden();
        $this->actingAs($orangLain)->postJson(route('calls.answer', $call), ['answer_sdp' => 'x'])->assertForbidden();
    }
    // Pemanggil tak bisa menjawab panggilannya sendiri.
    $this->actingAs($this->admin)->postJson(route('calls.answer', $call), ['answer_sdp' => 'x'])->assertForbidden();

    $this->actingAs($this->reporter)->postJson(route('calls.answer', $call), ['answer_sdp' => "v=0\r\no=answer"])
        ->assertOk()->assertJsonPath('call.status', 'answered');

    $this->actingAs($this->admin)->getJson(route('calls.state', $call))
        ->assertJsonPath('call.answer_sdp', "v=0\r\no=answer");
    $this->actingAs($this->admin)->postJson(route('calls.connected', $call))->assertOk();
    expect($call->fresh()->connected_at)->not->toBeNull();

    // Ditutup pelapor sesudah tersambung = Selesai, apa pun alasan yang dikirim.
    $this->travel(42)->seconds();
    $this->actingAs($this->reporter)->postJson(route('calls.end', $call), ['reason' => 'declined'])->assertOk();
    $call->refresh();
    expect($call->status)->toBe('ended')
        ->and($call->end_reason)->toBe('completed')
        ->and($call->ended_by)->toBe('callee')
        ->and($call->durationSeconds())->toBeGreaterThanOrEqual(42);
});

it('closes a call nobody answers and shows the ringing call to the reporter until then', function () {
    startCall($this, $this->admin);
    $call = ReporterCall::sole();

    $this->actingAs($this->reporter)->get(route('reports.show', $this->report->id))
        ->assertInertia(fn ($page) => $page->where('incomingCall.id', $call->id));

    $this->travel(ReporterCall::RING_TIMEOUT_SECONDS + 1)->seconds();

    $this->actingAs($this->reporter)->get(route('reports.show', $this->report->id))
        ->assertInertia(fn ($page) => $page->where('incomingCall', null));
    $call->refresh();
    expect($call->status)->toBe('ended')->and($call->end_reason)->toBe('no_answer')->and($call->ended_by)->toBe('system');

    // Jawaban yang terlambat ditolak, bukan menghidupkan panggilan yang sudah ditutup.
    $this->actingAs($this->reporter)->postJson(route('calls.answer', $call), ['answer_sdp' => 'x'])->assertStatus(409);
});

it('records why a call ended, including a reporter without a microphone', function () {
    startCall($this, $this->admin);
    $call = ReporterCall::sole();

    $this->actingAs($this->reporter)->postJson(route('calls.end', $call), ['reason' => 'no_mic'])->assertOk();
    $this->actingAs($this->reporter)->postJson(route('calls.end', $call), ['reason' => 'tidak-dikenal'])->assertStatus(422);

    $this->actingAs($this->admin)->getJson(route('calls.state', $call))
        ->assertJsonPath('call.status', 'ended')
        ->assertJsonPath('call.end_label', 'Mikrofon pelapor tidak tersedia');

    $this->actingAs($this->admin)->get(route('reports.show', $this->report->id))
        ->assertInertia(fn ($page) => $page
            ->where('canCallReporter', true)
            ->where('reporterCalls.0.end_reason', 'no_mic')
            ->where('reporterCalls.0.caller_name', $this->admin->name));

    // Pelapor tak melihat tombol maupun riwayat panggilan.
    $this->actingAs($this->reporter)->get(route('reports.show', $this->report->id))
        ->assertInertia(fn ($page) => $page->where('canCallReporter', false)->where('reporterCalls', []));
});

it('reaches a guest reporter through the signed status link only', function () {
    $tamu = Report::create($this->wilayah + [
        'user_id' => null,
        'guest_check' => 'nonaktif',
        'title' => 'Kebakaran tamu',
        'phone' => '081298765432',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
    ]);

    startCall($this, $this->admin, $tamu)->assertCreated();
    $call = ReporterCall::sole();
    expect($call->callee_user_id)->toBeNull();
    Notification::assertNothingSent();

    // Aba-aba ke channel PUBLIK bernama rahasia, bukan channel bernama id laporan.
    Event::assertDispatched(ReporterCallChanged::class, function (ReporterCallChanged $e) use ($tamu) {
        $public = collect($e->broadcastOn())->first(fn ($c) => ! $c instanceof PrivateChannel && $c instanceof Channel);

        return $public && $public->name === ReporterCall::guestChannel($tamu->id)
            && $public->name !== 'reporter-call.'.$tamu->id
            && strlen($public->name) === strlen('reporter-call.') + 40
            && $e->broadcastWith() === ['callId' => $e->callId, 'status' => 'ringing'];
    });

    // Halaman status tamu membawa channel & URL bertanda tangan.
    $status = URL::temporarySignedRoute('front.reports.guest.status', now()->addHour(), ['report' => $tamu->id], false);
    $this->get($status)->assertInertia(fn ($page) => $page
        ->where('guestView.call.channel', ReporterCall::guestChannel($tamu->id))
        ->has('guestView.call.stateUrl'));

    $sign = fn ($name) => URL::temporarySignedRoute($name, now()->addHour(), ['report' => $tamu->id], false);

    $this->getJson(route('front.reports.guest.call', $tamu->id))->assertForbidden();
    $this->getJson($sign('front.reports.guest.call'))
        ->assertOk()
        ->assertJsonPath('call.id', $call->id)
        ->assertJsonPath('call.offer_sdp', "v=0\r\no=offer");

    // Tautan laporan A tak bisa menjawab panggilan laporan lain.
    $this->postJson($sign('front.reports.guest.call.answer'), ['call_id' => $call->id + 99, 'answer_sdp' => 'x'])->assertNotFound();
    $this->postJson($sign('front.reports.guest.call.answer'), ['call_id' => $call->id, 'answer_sdp' => 'jawab'])
        ->assertOk()->assertJsonPath('call.status', 'answered');
    $this->postJson($sign('front.reports.guest.call.end'), ['call_id' => $call->id, 'reason' => 'completed'])->assertOk();
    expect($call->fresh()->status)->toBe('ended');

    // Sesudah diklaim ke akun, tautan tamu tak lagi menerima panggilan.
    $tamu->update(['user_id' => $this->reporter->id]);
    startCall($this, $this->admin, $tamu)->assertCreated();
    $this->getJson($sign('front.reports.guest.call'))->assertOk()->assertJsonPath('call', null);
});

it('gives short-lived TURN credentials without ever sending the shared secret', function () {
    config([
        'services.webrtc.stun_urls' => 'stun:turn.example.test:3478',
        'services.webrtc.turn_urls' => 'turn:turn.example.test:3478?transport=udp',
        'services.webrtc.turn_secret' => 'rahasia-coturn',
    ]);

    $response = $this->actingAs($this->admin)->getJson(route('calls.ice'))->assertOk();
    $turn = $response->json('ice_servers.1');

    expect($turn['urls'])->toBe(['turn:turn.example.test:3478?transport=udp'])
        ->and($turn['credential'])->toBe(base64_encode(hash_hmac('sha1', $turn['username'], 'rahasia-coturn', true)))
        ->and((int) explode(':', $turn['username'])[0])->toBeGreaterThan(now()->timestamp)
        ->and($response->getContent())->not->toContain('rahasia-coturn');
});

it('pushes the reporter a plain report_status notification, never a broadcast', function () {
    $n = new ReporterCallNotification($this->report);

    expect($n->via($this->reporter))->not->toContain('broadcast');
    $data = $n->toFcm($this->reporter)->data;
    expect($data['type'])->toBe('report_status')
        ->and($data['event'])->toBe('reporter_call')
        ->and($data['action_url'])->toBe(route('reports.show', $this->report->id));
});

it('asks reporters other than the command center to confirm the number before sending', function () {
    $this->actingAs($this->reporter)->get(route('front.reports.create'))
        ->assertInertia(fn ($page) => $page->where('confirm_phone', true));
    $this->actingAs($this->petugas)->get(route('front.reports.create'))
        ->assertInertia(fn ($page) => $page->where('confirm_phone', false));
    auth()->logout();
    $this->get(route('front.reports.create'))
        ->assertInertia(fn ($page) => $page->where('confirm_phone', true));

    $form = file_get_contents(resource_path('js/Pages/Front/Reports/Create.jsx'));
    expect($form)->toContain('<PhoneConfirmDialog')
        ->and($form)->toContain('confirmedPhoneRef.current !== normalizePhone(data.phone)');
});

it('wires the call screen once in AppLayout and listens for nudges on the personal channel', function () {
    $layout = file_get_contents(resource_path('js/Layouts/AppLayout.jsx'));
    expect($layout)->toContain('<CallOverlay />')
        ->and($layout)->toContain(".listen('.reporter-call.changed', handleCallNudge)");

    // Siaran = aba-aba: tak ada SDP di event.
    $event = new ReporterCallChanged(new ReporterCall(['id' => 1, 'report_id' => $this->report->id, 'status' => 'ringing', 'caller_id' => $this->admin->id]));
    expect(array_keys($event->broadcastWith()))->toBe(['callId', 'status'])
        ->and($event->broadcastAs())->toBe('reporter-call.changed');
});

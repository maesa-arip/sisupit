<?php

use App\Models\Report;
use App\Models\User;
use App\Notifications\ReportStatusUpdatedNotification;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->reporter = User::factory()->create(['village_code' => '5171012006']);
    $this->reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
    ]);
});

it('notifies the reporter at each status transition (approve, first en_route, first arrive, resolve)', function () {
    Notification::fake();

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/approve")->assertRedirect();
    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();
    $this->actingAs($relawan)->post("/reports/{$this->report->id}/arrive")->assertRedirect();
    $this->actingAs($petugas)->post("/reports/{$this->report->id}/resolve")->assertRedirect();

    // Pelapor menerima tepat 4 notifikasi status (satu per transisi).
    Notification::assertSentToTimes($this->reporter, ReportStatusUpdatedNotification::class, 4);
    Notification::assertSentTo($this->reporter, ReportStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'approved');
    Notification::assertSentTo($this->reporter, ReportStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'en_route');
    Notification::assertSentTo($this->reporter, ReportStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'arrived');
    Notification::assertSentTo($this->reporter, ReportStatusUpdatedNotification::class,
        fn ($n) => $n->event === 'resolved');

    // Responder TIDAK menerima notifikasi status pelapor (tak ada cross-talk).
    Notification::assertNotSentTo($relawan, ReportStatusUpdatedNotification::class);
    Notification::assertNotSentTo($petugas, ReportStatusUpdatedNotification::class);
});

it('does not re-notify the reporter when later responders join or arrive', function () {
    Notification::fake();

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');
    $relawanA = User::factory()->create(['village_code' => '5171012006']);
    $relawanA->assignRole('relawan');
    $relawanB = User::factory()->create(['village_code' => '5171012006']);
    $relawanB->assignRole('relawan');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/approve")->assertRedirect();
    $this->actingAs($relawanA)->post("/reports/{$this->report->id}/take-action")->assertRedirect(); // en_route #1
    $this->actingAs($relawanB)->post("/reports/{$this->report->id}/take-action")->assertRedirect(); // sudah handling → tak ada notif
    $this->actingAs($relawanA)->post("/reports/{$this->report->id}/arrive")->assertRedirect();      // arrived #1
    $this->actingAs($relawanB)->post("/reports/{$this->report->id}/arrive")->assertRedirect();      // bukan yang pertama → tak ada notif

    // approved(1) + en_route(1) + arrived(1) = 3, tanpa duplikat.
    Notification::assertSentToTimes($this->reporter, ReportStatusUpdatedNotification::class, 3);
});

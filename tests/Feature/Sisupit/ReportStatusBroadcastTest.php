<?php

use App\Events\ReportStatusChanged;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();

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

it('broadcasts ReportStatusChanged on approve, first handling, and resolve', function () {
    Event::fake([ReportStatusChanged::class]);

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/approve")->assertRedirect();
    Event::assertDispatched(ReportStatusChanged::class,
        fn ($e) => $e->reportId === $this->report->id && $e->status === 'pending');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();
    Event::assertDispatched(ReportStatusChanged::class, fn ($e) => $e->status === 'handling');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/resolve")->assertRedirect();
    Event::assertDispatched(ReportStatusChanged::class, fn ($e) => $e->status === 'resolved');
});

it('broadcasts ReportStatusChanged with the reason on reject', function () {
    Event::fake([ReportStatusChanged::class]);

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/reject", ['reason' => 'Laporan hoax'])
        ->assertRedirect();

    Event::assertDispatched(ReportStatusChanged::class,
        fn ($e) => $e->status === 'ditolak' && $e->rejectedReason === 'Laporan hoax');
});

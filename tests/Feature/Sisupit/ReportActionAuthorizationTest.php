<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $reporter = User::factory()->create();
    $reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
    ]);
});

it('blocks masyarakat from approving, taking action on, or updating location of a report', function () {
    $masyarakat = User::factory()->create(['village_code' => '5171012006']);
    $masyarakat->assignRole('masyarakat');

    $this->actingAs($masyarakat)->post("/reports/{$this->report->id}/approve")->assertForbidden();
    $this->actingAs($masyarakat)->post("/reports/{$this->report->id}/take-action")->assertForbidden();
    $this->actingAs($masyarakat)->post("/reports/{$this->report->id}/arrive")->assertForbidden();
    $this->actingAs($masyarakat)->post("/reports/{$this->report->id}/update-location", [
        'lat' => '-8.65',
        'lng' => '115.22',
    ])->assertForbidden();
});

it('lets petugas approve a report', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    expect($this->report->refresh()->status)->toBe('pending');
});

it('lets relawan take action on a report', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();

    expect(DB::table('report_helpers')->where('report_id', $this->report->id)->where('user_id', $relawan->id)->exists())->toBeTrue();
});

it('blocks a responder from correcting the incident location before they have arrived', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/correct-location", [
        'lat' => '-8.6600',
        'lng' => '115.2300',
    ])->assertForbidden();

    expect($this->report->refresh()->lat)->toBe('-8.6500');
});

it('lets a responder who has arrived correct the incident location', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();
    $this->actingAs($relawan)->post("/reports/{$this->report->id}/arrive")->assertRedirect();

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/correct-location", [
        'lat' => '-8.6600',
        'lng' => '115.2300',
        'address' => 'Seberang sawah, lokasi sebenarnya',
    ])->assertRedirect();

    $this->report->refresh();
    expect($this->report->lat)->toBe('-8.6600');
    expect($this->report->lng)->toBe('115.2300');
    expect(DB::table('tracking_logs')->where('report_id', $this->report->id)->where('user_type', 'koreksi_lokasi')->exists())->toBeTrue();
});

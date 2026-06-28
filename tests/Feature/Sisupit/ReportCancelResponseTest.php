<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();

    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
        'village_code' => '5171012006',
    ]);
});

it('lets a responder cancel while en_route and reverts status to pending when the last one leaves', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();
    expect($this->report->refresh()->status)->toBe('handling');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/cancel-response")->assertRedirect();

    expect($this->report->refresh()->status)->toBe('pending');
    expect(DB::table('report_helpers')->where('report_id', $this->report->id)->where('user_id', $relawan->id)->exists())->toBeFalse();
});

it('keeps status handling when another responder is still active', function () {
    $relawanA = User::factory()->create(['village_code' => '5171012006']);
    $relawanA->assignRole('relawan');
    $relawanB = User::factory()->create(['village_code' => '5171012006']);
    $relawanB->assignRole('relawan');

    $this->actingAs($relawanA)->post("/reports/{$this->report->id}/take-action")->assertRedirect();
    $this->actingAs($relawanB)->post("/reports/{$this->report->id}/take-action")->assertRedirect();

    $this->actingAs($relawanA)->post("/reports/{$this->report->id}/cancel-response")->assertRedirect();

    expect($this->report->refresh()->status)->toBe('handling');
    expect(DB::table('report_helpers')->where('report_id', $this->report->id)->where('user_id', $relawanA->id)->exists())->toBeFalse();
    expect(DB::table('report_helpers')->where('report_id', $this->report->id)->where('user_id', $relawanB->id)->exists())->toBeTrue();
});

it('blocks cancelling once the responder has already arrived', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();
    $this->actingAs($relawan)->post("/reports/{$this->report->id}/arrive")->assertRedirect();

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/cancel-response")->assertForbidden();

    expect(DB::table('report_helpers')->where('report_id', $this->report->id)->where('user_id', $relawan->id)->exists())->toBeTrue();
});

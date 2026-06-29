<?php

use App\Models\Report;
use App\Models\Unit;
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

    $this->petugas = User::factory()->create(['village_code' => '5171012006']);
    $this->petugas->assignRole('petugas');

    $this->unit = Unit::create([
        'name' => 'Truk Pemadam 01',
        'type' => 'Truk Pemadam',
        'status' => 'available',
        'village_code' => '5171012006',
    ]);
});

it('lets staff dispatch an available unit and marks it dispatched', function () {
    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/dispatch-unit", ['unit_id' => $this->unit->id])
        ->assertRedirect();

    expect($this->unit->refresh()->status)->toBe('dispatched');
    expect(DB::table('report_units')
        ->where('report_id', $this->report->id)
        ->where('unit_id', $this->unit->id)
        ->where('status', 'dispatched')
        ->exists())->toBeTrue();
});

it('refuses to dispatch a unit that is not available', function () {
    $this->unit->update(['status' => 'maintenance']);

    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/dispatch-unit", ['unit_id' => $this->unit->id])
        ->assertForbidden();
});

it('blocks non-staff from dispatching a unit', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)
        ->post("/reports/{$this->report->id}/dispatch-unit", ['unit_id' => $this->unit->id])
        ->assertForbidden();

    expect($this->unit->refresh()->status)->toBe('available');
});

it('releases a dispatched unit back to available', function () {
    $this->actingAs($this->petugas)->post("/reports/{$this->report->id}/dispatch-unit", ['unit_id' => $this->unit->id]);
    expect($this->unit->refresh()->status)->toBe('dispatched');

    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/release-unit", ['unit_id' => $this->unit->id])
        ->assertRedirect();

    expect($this->unit->refresh()->status)->toBe('available');
    expect(DB::table('report_units')->where('report_id', $this->report->id)->where('unit_id', $this->unit->id)->where('status', 'released')->exists())->toBeTrue();
});

it('auto-releases dispatched units when the incident is resolved', function () {
    $this->actingAs($this->petugas)->post("/reports/{$this->report->id}/dispatch-unit", ['unit_id' => $this->unit->id]);
    expect($this->unit->refresh()->status)->toBe('dispatched');

    $this->actingAs($this->petugas)->post("/reports/{$this->report->id}/resolve")->assertRedirect();

    expect($this->unit->refresh()->status)->toBe('available');
    expect($this->report->refresh()->status)->toBe('resolved');
});

<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    // Workflow respons mengirim notifikasi balik ke pelapor — fake agar terisolasi dari FCM.
    Notification::fake();

    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('masyarakat');

    // Laporan berada di Desa A (5171012006), Kec. 5171010, Kota 5171, Prov. 51.
    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
        'village_code' => '5171012006',
        'district_code' => '5171010',
        'city_code' => '5171',
        'province_code' => '51',
    ]);
});

it('lets a volunteer in the report village respond', function () {
    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertRedirect();

    expect(DB::table('report_helpers')->where('report_id', $this->report->id)->where('user_id', $relawan->id)->exists())->toBeTrue();
});

it('blocks a volunteer from another village from responding', function () {
    $relawanLuar = User::factory()->create(['village_code' => '3171012001']); // Desa B
    $relawanLuar->assignRole('relawan');

    $this->actingAs($relawanLuar)->post("/reports/{$this->report->id}/take-action")->assertForbidden();
    $this->actingAs($relawanLuar)->post("/reports/{$this->report->id}/arrive")->assertForbidden();

    expect(DB::table('report_helpers')->where('report_id', $this->report->id)->where('user_id', $relawanLuar->id)->exists())->toBeFalse();
});

it('lets an officer whose jurisdiction (kabupaten level) covers the report respond', function () {
    // Petugas tingkat kabupaten (city_code 5171, kode di bawahnya null) — laporan di kota
    // yang sama harus boleh direspons meski beda desa.
    $petugas = User::factory()->create([
        'village_code' => null,
        'district_code' => null,
        'city_code' => '5171',
        'province_code' => '51',
    ]);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/take-action")->assertRedirect();

    expect(DB::table('report_officers')->where('report_id', $this->report->id)->where('user_id', $petugas->id)->exists())->toBeTrue();
});

<?php

use App\Models\Report;
use App\Models\ReportResolution;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// Berita Acara / Laporan Kegiatan Penyelamatan (FINDINGS #39). Append-only: tiap simpan
// = entri baru (sementara/final). KTP korban di disk PRIVAT, hanya lewat route bergerbang.

beforeEach(function () {
    $reporter = User::factory()->create();
    $reporter->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah bedeng',
        'address' => 'Jl. Trengguli No. 50',
        'lat' => '-8.6300',
        'lng' => '115.2600',
        'status' => 'resolved',
        'village_code' => '5171012006',
    ]);
});

it('blocks non-staff from creating a resolution', function () {
    $masyarakat = User::factory()->create(['village_code' => '5171012006']);
    $masyarakat->assignRole('masyarakat');

    $this->actingAs($masyarakat)
        ->get("/reports/{$this->report->id}/resolution/create")
        ->assertForbidden();

    $this->actingAs($masyarakat)
        ->post("/reports/{$this->report->id}/resolution", ['status' => 'sementara'])
        ->assertForbidden();
});

it('lets petugas create a resolution with a victim and photo, KTP kept on the private disk', function () {
    Storage::fake('local');
    Storage::fake('public');

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/resolution", [
            'status' => 'sementara',
            'jenis_kejadian' => 'kebakaran rumah bedeng tukang',
            'sumber_informasi' => 'warga menelepon pos induk',
            'kerugian' => '±1jt',
            'victims' => [
                ['nama' => 'A.A Ngurah', 'alamat' => 'Penatih', 'ktp' => UploadedFile::fake()->image('ktp.jpg')],
            ],
            'photos' => [UploadedFile::fake()->image('tkp.jpg')],
        ])
        ->assertRedirect(route('reports.show', $this->report->id));

    $resolution = ReportResolution::where('report_id', $this->report->id)->first();
    expect($resolution)->not->toBeNull();
    expect($resolution->status)->toBe('sementara');
    expect($resolution->created_by)->toBe($petugas->id);

    $victim = $resolution->victims()->first();
    expect($victim->nama)->toBe('A.A Ngurah');
    expect($victim->ktp_path)->not->toBeNull();
    // KTP di disk privat (local), TIDAK di disk public.
    Storage::disk('local')->assertExists($victim->ktp_path);
    Storage::disk('public')->assertMissing($victim->ktp_path);

    $photo = $resolution->photos()->first();
    Storage::disk('public')->assertExists($photo->path);
});

it('is append-only: a final entry is added alongside the sementara one', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/resolution", [
        'status' => 'sementara', 'jenis_kejadian' => 'data awal',
    ])->assertRedirect();

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/resolution", [
        'status' => 'final', 'jenis_kejadian' => 'data valid',
    ])->assertRedirect();

    $rows = ReportResolution::where('report_id', $this->report->id)->orderBy('id')->get();
    expect($rows)->toHaveCount(2);
    expect($rows[0]->status)->toBe('sementara');
    expect($rows[1]->status)->toBe('final');
});

it('serves the private KTP to staff but forbids non-staff', function () {
    Storage::fake('local');

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/resolution", [
        'status' => 'sementara',
        'victims' => [['nama' => 'Korban', 'ktp' => UploadedFile::fake()->image('ktp.jpg')]],
    ])->assertRedirect();

    $victim = ReportResolution::where('report_id', $this->report->id)->first()->victims()->first();
    $ktpUrl = "/reports/{$this->report->id}/victims/{$victim->id}/ktp";

    $this->actingAs($petugas)->get($ktpUrl)->assertOk();

    $masyarakat = User::factory()->create(['village_code' => '5171012006']);
    $masyarakat->assignRole('masyarakat');
    $this->actingAs($masyarakat)->get($ktpUrl)->assertForbidden();
});

it('blocks staff outside the report jurisdiction', function () {
    $outsider = User::factory()->create(['village_code' => '5171011001']);
    $outsider->assignRole('petugas');

    $this->actingAs($outsider)
        ->post("/reports/{$this->report->id}/resolution", ['status' => 'sementara'])
        ->assertForbidden();

    $this->actingAs($outsider)
        ->get("/reports/{$this->report->id}/resolution/create")
        ->assertForbidden();
});

it('lets staff delete a resolution entry and its private KTP file', function () {
    Storage::fake('local');

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/resolution", [
        'status' => 'sementara',
        'victims' => [['nama' => 'Korban', 'ktp' => UploadedFile::fake()->image('ktp.jpg')]],
    ])->assertRedirect();

    $resolution = ReportResolution::where('report_id', $this->report->id)->first();
    $victim = $resolution->victims()->first();
    $ktpPath = $victim->ktp_path;

    $this->actingAs($petugas)
        ->delete("/reports/{$this->report->id}/resolution/{$resolution->id}")
        ->assertRedirect();

    expect(ReportResolution::find($resolution->id))->toBeNull();
    Storage::disk('local')->assertMissing($ktpPath);
});

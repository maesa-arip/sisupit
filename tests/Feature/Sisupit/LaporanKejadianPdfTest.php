<?php

use App\Models\Report;
use App\Models\ReportResolution;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * TASK_68 (permintaan user 2026-09-29): "Buatkan format laporan pdf pada Laporan Kejadian".
 * Keputusan user: dibuat di SERVER (dompdf), bukan dialog cetak browser - dialog cetak tak
 * tersedia di APK WebView. Yang dijaga: gerbang baca sama dengan halaman detail (staf +
 * pejabat sewilayah), entri dicari DI DALAM laporannya, dan KTP korban tak pernah ikut.
 */
beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');

    // Wilayah lengkap supaya pelapor tak dipantulkan EnsureProfileComplete (302) sebelum gerbangnya diuji.
    $reporter = User::factory()->create([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012006',
    ]);
    $reporter->assignRole('warga');
    $this->reporter = $reporter;

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah bedeng',
        'lat' => '-8.6300',
        'lng' => '115.2600',
        'status' => 'resolved',
        'village_code' => '5171012006',
    ]);

    $this->petugas = User::factory()->create(['name' => 'Made Petugas', 'village_code' => '5171012006']);
    $this->petugas->assignRole('petugas');

    $this->actingAs($this->petugas)->post("/reports/{$this->report->id}/resolution", [
        'status' => 'sementara',
        'jenis_kejadian' => 'kebakaran dapur <b>tebal</b>',
        'kerugian' => '±1jt',
        'victims' => [['nama' => 'A.A Ngurah', 'kondisi' => 'luka ringan', 'ktp' => UploadedFile::fake()->image('ktp.jpg')]],
        'photos' => [UploadedFile::fake()->image('tkp.jpg')],
    ])->assertSessionHasNoErrors();

    $this->resolution = ReportResolution::where('report_id', $this->report->id)->firstOrFail();
    $this->url = route('reports.resolution.pdf', [$this->report->id, $this->resolution->id]);
});

it('downloads a real pdf of the entry for staff and pejabat in the area', function () {
    $response = $this->actingAs($this->petugas)->get($this->url)->assertOk();

    expect($response->headers->get('content-type'))->toBe('application/pdf')
        ->and($response->headers->get('content-disposition'))->toContain('laporan-kejadian-'.Report::nomorLaporan($this->report).'-sementara.pdf')
        ->and(substr($response->getContent(), 0, 5))->toBe('%PDF-');

    $pejabat = User::factory()->create(['village_code' => '5171012006']);
    $pejabat->assignRole('pejabat');
    $this->actingAs($pejabat)->get($this->url)->assertOk();
});

it('refuses the pdf to citizens, staff of another area, and entries of another report', function () {
    $this->actingAs($this->reporter)->get($this->url)->assertForbidden();

    $jauh = User::factory()->create(['village_code' => '5103010001']);
    $jauh->assignRole('petugas');
    $this->actingAs($jauh)->get($this->url)->assertForbidden();

    $lain = Report::create([
        'user_id' => $this->reporter->id, 'title' => 'Lain', 'lat' => '-8.6', 'lng' => '115.2',
        'status' => 'resolved', 'village_code' => '5171012006',
    ]);
    $this->actingAs($this->petugas)
        ->get(route('reports.resolution.pdf', [$lain->id, $this->resolution->id]))
        ->assertNotFound();
});

it('lays out the entry, escapes typed text, and never carries the victim KTP', function () {
    $this->resolution->load(['victims', 'photos', 'creator', 'logs']);
    $tenant = Tenant::default();

    $html = view('pdf.laporan-kejadian', [
        'report' => $this->report,
        'resolution' => $this->resolution,
        'nomor' => Report::nomorLaporan($this->report),
        'isActive' => true,
        'tenant' => $tenant,
        'photos' => collect(),
        'photosSkipped' => 0,
        'occurredAt' => null,
        'createdAt' => $this->resolution->created_at,
        'lastEdit' => null,
        'lastEditAt' => null,
        'printedAt' => now(),
        'printedBy' => 'Admin',
    ])->render();

    expect($html)->toContain('LAPORAN KEJADIAN')
        ->toContain(Report::nomorLaporan($this->report))
        ->toContain('SEMENTARA')
        ->toContain('±1jt')
        ->toContain('A.A Ngurah')
        ->toContain('luka ringan')
        ->toContain(e($tenant->nama_instansi))
        // Isian petugas ter-escape - tak ada tag yang ikut dirender.
        ->toContain('kebakaran dapur &lt;b&gt;tebal&lt;/b&gt;')
        ->not->toContain('<b>tebal</b>');

    $ktp = $this->resolution->victims[0]->ktp_path;
    expect($ktp)->not->toBeNull();
    expect($html)->not->toContain($ktp)->not->toContain('/ktp');
});

it('offers the pdf link on each entry of the detail page', function () {
    $this->actingAs($this->petugas)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page->where('resolutions.0.pdf_url', $this->url));

    $jsx = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));
    expect($jsx)->toMatch('~href=\{r\.pdf_url\}~');
});

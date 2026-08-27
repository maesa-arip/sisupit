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

    // Entri final ditutup ADMIN sejak TASK_49 — yang dijaga test ini tetap sifat
    // append-only-nya (entri lama tidak ditimpa), bukan siapa yang menekan tombolnya.
    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->post("/reports/{$this->report->id}/resolution", [
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

// Sumber informasi & tim atensi berita acara (permintaan user 2026-08-27).
// Sumber informasi terisi sendiri HANYA untuk laporan yang masuk lewat aplikasi; yang
// membedakannya adalah PERAN pemilik laporan, karena `ReportController::store()` selalu
// menulis `auth()->id()` sehingga laporan yang diketik operator ber-user_id operator itu.
it('prefills the information source for a report filed by a citizen through the app', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $props = $this->actingAs($petugas)
        ->get("/reports/{$this->report->id}/resolution/create")
        ->original->getData()['page']['props'];

    expect($props['prefill']['sumber_informasi'])->toBe(ReportResolution::SUMBER_APLIKASI);
});

// Laporan yang DIKETIK operator (alur telepon TASK_28) sengaja tidak punya nilai otomatis:
// sumber sebenarnya cuma operator yang tahu, dan kalimat umum yang terisi sendiri cenderung
// dibiarkan apa adanya sehingga sumber aslinya tak pernah tercatat.
it('leaves the information source empty when an operator filed the report manually', function () {
    $operator = User::factory()->create(['village_code' => '5171012006']);
    $operator->assignRole('petugas');

    $manual = Report::create([
        'user_id' => $operator->id,
        'title' => 'Kebakaran lapak, laporan lewat telepon',
        'address' => 'Jl. Gatot Subroto No. 1',
        'status' => 'resolved',
        'village_code' => '5171012006',
    ]);

    $props = $this->actingAs($operator)
        ->get("/reports/{$manual->id}/resolution/create")
        ->original->getData()['page']['props'];

    expect($props['prefill']['sumber_informasi'])->toBeNull();
});

// OPD yang diminta membantu ikut tercatat sebagai "tim yang atensi di TKP", bertanda (OPD)
// supaya mitra luar bisa dibedakan dari armada & personel Damkar sendiri. Namanya dibaca dari
// kolom SNAPSHOT `agency_name` di pivot — berita acara dokumen historis, isinya tak boleh ikut
// berubah saat master OPD di-rename.
it('lists the involved agencies in the attending-team suggestion, marked as OPD', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $agency = \App\Models\Agency::create([
        'name' => 'PLN ULP Denpasar',
        'code' => 'pln',
        'village_code' => '5171012006',
    ]);
    \App\Models\ReportAgency::create([
        'report_id' => $this->report->id,
        'agency_id' => $agency->id,
        'agency_name' => 'PLN ULP Denpasar',
        'notified_at' => now(),
    ]);

    // Master OPD berganti nama SESUDAH pelibatan: berita acara harus tetap menyebut nama lama.
    $agency->update(['name' => 'PLN UP3 Bali Selatan']);

    $props = $this->actingAs($petugas)
        ->get("/reports/{$this->report->id}/resolution/create")
        ->original->getData()['page']['props'];

    expect($props['timAtensiSuggestion'])->toContain('PLN ULP Denpasar (OPD)');
    expect($props['timAtensiSuggestion'])->not->toContain('PLN UP3 Bali Selatan');
    expect($props['prefill']['tim_atensi'])->toContain('PLN ULP Denpasar (OPD)');
});

it('stores the water volume used and the condition of each victim', function () {
    // TASK_49 (D), permintaan user. `volume_air` sengaja TEKS BEBAS, mengikuti preseden
    // `kerugian` ("±1jt"): yang ditulis petugas di lapangan biasanya "±3 tangki", bukan
    // bilangan bersatuan tetap — memaksanya jadi angka membuat isian itu dikosongkan.
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/resolution", [
            'status' => 'sementara',
            'volume_air' => '±3 tangki (12.000 liter)',
            'victims' => [
                ['nama' => 'Wayan Sari', 'kondisi' => 'Luka bakar ringan, dirujuk ke RSUD'],
            ],
        ])->assertRedirect(route('reports.show', $this->report->id));

    $resolution = ReportResolution::where('report_id', $this->report->id)->first();

    expect($resolution->volume_air)->toBe('±3 tangki (12.000 liter)');
    expect($resolution->victims->first()->kondisi)->toBe('Luka bakar ringan, dirujuk ke RSUD');
});

it('keeps a victim row that carries only a condition', function () {
    // Baris korban yang benar-benar kosong dilewati (aturan lama). "Kondisi Korban" harus
    // ikut dihitung sebagai isi — kalau tidak, korban yang hanya diketahui kondisinya
    // (belum teridentifikasi namanya) hilang tanpa galat saat disimpan.
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/resolution", [
            'status' => 'sementara',
            'victims' => [
                ['kondisi' => 'Belum teridentifikasi, luka bakar berat'],
                ['nama' => '', 'alamat' => ''],
            ],
        ])->assertRedirect();

    $resolution = ReportResolution::where('report_id', $this->report->id)->first();

    expect($resolution->victims)->toHaveCount(1);
    expect($resolution->victims->first()->kondisi)->toBe('Belum teridentifikasi, luka bakar berat');
});

it('lets petugas save a sementara entry but reserves the final one for admins', function () {
    // TASK_49 (E), permintaan user: "laporan sementara boleh diisi petugas dan admin,
    // laporan final wajib admin". Gerbangnya di SERVER, bukan sekadar tombol yang
    // disembunyikan — tombol yang hilang tidak menghentikan request buatan tangan.
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/resolution", ['status' => 'sementara'])
        ->assertRedirect();

    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/resolution", ['status' => 'final'])
        ->assertForbidden();

    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post("/reports/{$this->report->id}/resolution", ['status' => 'final'])
        ->assertRedirect();

    expect(ReportResolution::where('report_id', $this->report->id)->where('status', 'final')->count())->toBe(1);
});

it('tells the form who is allowed to finalise', function () {
    // Tanpa prop ini form tak punya cara tahu, dan satu-satunya petunjuk bahwa petugas tak
    // boleh memfinalkan adalah 403 SETELAH ia mengisi seluruh berita acara.
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)
        ->get("/reports/{$this->report->id}/resolution/create")
        ->assertInertia(fn ($page) => $page->where('canFinalize', false));

    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get("/reports/{$this->report->id}/resolution/create")
        ->assertInertia(fn ($page) => $page->where('canFinalize', true));
});

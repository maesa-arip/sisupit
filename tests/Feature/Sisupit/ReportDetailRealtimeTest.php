<?php

use App\Events\ReportRecordChanged;
use App\Models\Agency;
use App\Models\Report;
use App\Models\ReportAgency;
use App\Models\ReportResolution;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

// FINDINGS #113 — halaman detail insiden (`Front/Reports/Show.jsx`) mendengar EMPAT event,
// tetapi TIGA kelompok mutasi yang mengubah isinya tak pernah menyiarkan apa pun: pelibatan
// & konfirmasi OPD, entri berita acara, dan penyuntingan laporan oleh pelapornya. Gejalanya
// senyap total — panel OPD di layar petugas yang sedang berdiri di TKP tetap berbunyi
// "menunggu konfirmasi" sesudah PLN benar-benar memadamkan listrik.
//
// Yang dijaga di sini BUKAN "ada broadcast" sebagai kerapian, melainkan bahwa setiap tulisan
// ke catatan insiden punya aba-abanya. Channelnya ikut dikunci: siaran yang benar isinya tapi
// mendarat di channel yang tidak didengar halaman itu sama saja dengan tidak disiarkan.

beforeEach(function () {
    Notification::fake();

    $this->reporter = User::factory()->create(['village_code' => '5171012006']);
    $this->reporter->assignRole('warga');

    $this->report = Report::create([
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'incident_type' => 'rumah',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
    ]);

    $this->petugas = User::factory()->create(['village_code' => '5171012006']);
    $this->petugas->assignRole('petugas');

    $this->admin = User::factory()->create(['village_code' => '5171012006']);
    $this->admin->assignRole('admin');

    $this->pln = Agency::create([
        'name' => 'PLN UP3 Bali Selatan',
        'code' => 'PLN',
        'is_active' => true,
        'default_incident_types' => ['rumah'],
        'requires_confirmation' => true,
        'confirmation_label' => 'Listrik sudah dipadamkan di lokasi kejadian',
        'village_code' => '5171012006',
    ]);
});

// Meminta bantuan OPD & mencabutnya adalah dua tindakan yang dilakukan dari layar yang SAMA
// oleh dua peran berbeda (TASK_51: petugas boleh meminta, admin yang boleh mencabut) —
// masing-masing hanya terlihat oleh yang lain kalau layarnya diberi tahu.
it('broadcasts ReportRecordChanged when an OPD is asked to help and when it is released', function () {
    Event::fake([ReportRecordChanged::class]);

    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/agencies", ['agency_ids' => [$this->pln->id]])
        ->assertRedirect();

    Event::assertDispatched(ReportRecordChanged::class, fn ($e) => $e->reportId === $this->report->id);

    Event::fake([ReportRecordChanged::class]);

    $this->actingAs($this->admin)
        ->delete("/reports/{$this->report->id}/agencies", ['agency_id' => $this->pln->id])
        ->assertRedirect();

    Event::assertDispatched(ReportRecordChanged::class, fn ($e) => $e->reportId === $this->report->id);
});

// Pelibatan yang lahir di detik VERIFIKASI lewat jalur yang sama (attachAgencies), dan itulah
// sebabnya siarannya dipasang di helper itu, bukan di masing-masing pemanggil: approve() yang
// mencentang OPD dulu hanya menyiarkan perubahan STATUS, sehingga lencana berkedip jadi
// "Laporan Terverifikasi" sementara panel OPD tetap kosong di layar semua orang lain.
it('broadcasts ReportRecordChanged when agencies are attached during verification', function () {
    Event::fake([ReportRecordChanged::class]);

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]])
        ->assertRedirect();

    Event::assertDispatched(ReportRecordChanged::class, fn ($e) => $e->reportId === $this->report->id);
});

// Ini kasus yang paling mahal kalau salah dibaca: yang menunggu kabar "listrik sudah padam"
// adalah orang yang sedang memegang selang. Notifikasinya membangunkan ORANGNYA (TASK_30/#63);
// siaran ini yang membetulkan LAYARNYA.
it('broadcasts ReportRecordChanged when an OPD confirms its conditional action', function () {
    $opd = User::factory()->create(['agency_id' => $this->pln->id, 'village_code' => null]);
    $opd->assignRole('opd');

    ReportAgency::create([
        'report_id' => $this->report->id,
        'agency_id' => $this->pln->id,
        'agency_name' => $this->pln->name,
        'requires_confirmation' => true,
        'confirmation_label' => $this->pln->confirmation_label,
        'status' => ReportAgency::STATUS_NOTIFIED,
        'notified_by' => $this->admin->id,
        'notified_at' => now(),
    ]);

    Event::fake([ReportRecordChanged::class]);

    $this->actingAs($opd)
        ->post("/reports/{$this->report->id}/agencies/confirm", ['agency_id' => $this->pln->id])
        ->assertRedirect();

    Event::assertDispatched(ReportRecordChanged::class, fn ($e) => $e->reportId === $this->report->id);
});

// Berita acara: petugas mengisi entri `sementara`, lalu admin — satu-satunya yang boleh
// mem-final-kannya sejak TASK_49 — menatap layar yang tak pernah menampilkan entri itu.
it('broadcasts ReportRecordChanged when a berita acara entry is created and when it is deleted', function () {
    $this->report->update(['status' => 'resolved']);

    Event::fake([ReportRecordChanged::class]);

    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/resolution", [
            'status' => 'sementara',
            'jenis_kejadian' => 'kebakaran rumah warga',
        ])
        ->assertRedirect(route('reports.show', $this->report->id));

    Event::assertDispatched(ReportRecordChanged::class, fn ($e) => $e->reportId === $this->report->id);

    $resolution = ReportResolution::where('report_id', $this->report->id)->firstOrFail();

    Event::fake([ReportRecordChanged::class]);

    $this->actingAs($this->petugas)
        ->delete("/reports/{$this->report->id}/resolution/{$resolution->id}")
        ->assertRedirect();

    Event::assertDispatched(ReportRecordChanged::class, fn ($e) => $e->reportId === $this->report->id);
});

// Pelapor menyunting laporannya saat masih TERLAPOR — yaitu justru saat Pusat Komando sedang
// meninjaunya. Tanpa siaran, yang meninjau memutuskan di atas teks & foto yang sudah berubah.
it('broadcasts ReportRecordChanged when the reporter edits the report', function () {
    // Laporan wajib menyisakan minimal satu foto sesudah disunting, jadi galerinya harus
    // benar-benar ada — tanpa ini update-nya berbalik ke form dan tak pernah sampai ke
    // siarannya, dan test-nya akan hijau karena alasan yang keliru.
    $this->report->photos()->create(['path' => 'reports/p1.jpg']);

    Event::fake([ReportRecordChanged::class]);

    $this->actingAs($this->reporter)
        ->put(route('front.reports.update', $this->report->id), [
            'title' => 'Judul baru',
            'description' => 'Deskripsi baru',
            'address' => 'Patokan baru',
        ])
        ->assertRedirect(route('dashboard'));

    Event::assertDispatched(ReportRecordChanged::class, fn ($e) => $e->reportId === $this->report->id);
});

// Channel-nya dikunci: halaman detail hanya berlangganan `report-tracking.{id}`, jadi siaran
// yang mendarat di channel lain sama saja dengan tidak disiarkan — dan itu tak akan menyalakan
// satu pun galat.
it('sends the record signal to the incident channel and carries no data in it', function () {
    $event = new ReportRecordChanged($this->report->id);

    expect($event->broadcastOn()->name)->toBe('private-report-tracking.'.$this->report->id);
    // Aba-aba, bukan data: channel ini juga didengar pelapor & relawan yang mengambil tugas,
    // sementara yang berubah bisa berupa catatan konfirmasi OPD atau isi berita acara.
    // (`socket` milik InteractsWithSockets, bukan muatan kita — Laravel memakainya untuk
    // toOthers() dan tidak ikut dikirim ke pendengar.)
    $payload = array_diff(array_keys(get_object_vars($event)), ['socket']);
    expect(array_values($payload))->toBe(['reportId']);
});

// Sisi LAYAR. Aba-aba yang tak ada yang mendengarkan sama tak bergunanya dengan tidak ada
// aba-aba — dan bentuk lama `only: ['report']` adalah setengah perbaikan yang paling mudah
// lahir kembali: `reportAgencies` & `resolutions` adalah prop TERPISAH.
it('reloads the separate incident props together, not just report', function () {
    $source = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));

    foreach (['ResponderRosterChanged', 'ReportRecordChanged', 'ReportStatusChanged'] as $event) {
        expect($source)->toContain("channel.listen('{$event}'");
    }

    expect($source)->toContain("router.reload({ only: ['report', 'reportAgencies', 'resolutions'] })");
    // Daftar yang lebih sempit membuat sinyal yang datang belakangan membatalkan permintaan
    // yang lebih lengkap (Inertia hanya menerbangkan satu kunjungan pada satu waktu).
    expect($source)->not->toContain("only: ['report'] }");
});

// FINDINGS #46 — lonceng notifikasi. Payloadnya sudah lama disiarkan (`via()` memuat
// 'broadcast'), yang tak pernah ada adalah pendengarnya; sampai #55 diperbaiki, listener apa
// pun memang akan gagal di tahap otorisasi tanpa gejala.
it('listens to the personal notification channel so the bell updates itself', function () {
    $source = file_get_contents(resource_path('js/Layouts/AppLayout.jsx'));

    expect($source)->toContain('App.Models.User.${auth.id}');
    expect($source)->toContain('.notification(');
    expect($source)->toContain("router.reload({ only: ['notifications', 'unread_notifications_count'] })");
});

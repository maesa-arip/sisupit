<?php

use App\Models\Agency;
use App\Models\Report;
use App\Models\ReportAgency;
use App\Models\User;
use App\Notifications\AgencyConfirmationNotification;
use App\Notifications\AgencyDispatchNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * OPD/instansi terkait (TASK_27): pelibatan saat verifikasi, rekomendasi otomatis per jenis
 * kejadian, dan konfirmasi berkondisi (mis. PLN memadamkan listrik). Yang dijaga di sini
 * terutama DUA hal yang gampang jebol saat fitur ini nanti dikembangkan:
 *   - rekomendasi adalah SARAN, bukan paksaan — apa yang di-uncentang operator tidak boleh ikut;
 *   - id instansi kabupaten lain yang disuntik lewat request buatan harus gugur (pelajaran #32).
 */
beforeEach(function () {
    Notification::fake();

    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('warga');

    $this->report = Report::create([
        'user_id' => $reporter->id,
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

    // TASK_51: verifikasi (approve) & PENCABUTAN OPD kini admin. Petugas tetap dipakai di
    // berkas ini untuk yang memang masih miliknya — MEMINTA bantuan OPD & mencatatkan
    // konfirmasi atas nama instansi.
    $this->admin = User::factory()->create(['village_code' => '5171012006']);
    $this->admin->assignRole('admin');

    $this->bpbd = Agency::create([
        'name' => 'BPBD Kota Denpasar',
        'code' => 'BPBD',
        'is_active' => true,
        'default_incident_types' => ['rumah', 'toko', 'kendaraan', 'lahan'],
        'requires_confirmation' => false,
        'village_code' => '5171012006',
    ]);

    $this->pln = Agency::create([
        'name' => 'PLN UP3 Bali Selatan',
        'code' => 'PLN',
        'is_active' => true,
        'default_incident_types' => ['rumah', 'toko', 'kendaraan', 'lahan'],
        'requires_confirmation' => true,
        'confirmation_label' => 'Listrik sudah dipadamkan di lokasi kejadian',
        'village_code' => '5171012006',
    ]);
});

it('recommends the agencies configured for that incident type, and nothing for an unknown type', function () {
    $this->actingAs($this->petugas);

    $recommended = Agency::recommendedIdsFor('rumah');
    expect($recommended->all())->toEqualCanonicalizing([$this->bpbd->id, $this->pln->id]);

    // 'lainnya' tidak terdaftar di default_incident_types mana pun; laporan lama tanpa
    // incident_type juga tidak boleh menghasilkan tebakan.
    expect(Agency::recommendedIdsFor('lainnya')->all())->toBe([]);
    expect(Agency::recommendedIdsFor(null)->all())->toBe([]);
});

it('only involves the agencies the operator actually submitted (unchecking works)', function () {
    // Rekomendasi berisi BPBD + PLN, tapi operator meng-uncentang BPBD.
    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]])
        ->assertRedirect();

    expect(ReportAgency::where('report_id', $this->report->id)->pluck('agency_id')->all())
        ->toBe([$this->pln->id]);

    expect($this->report->refresh()->status)->toBe('pending');
});

it('still approves a report when no agency is selected at all', function () {
    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve")
        ->assertRedirect();

    expect($this->report->refresh()->status)->toBe('pending');
    expect(ReportAgency::where('report_id', $this->report->id)->count())->toBe(0);
});

it('notifies the agency account and snapshots the confirmation rule at involvement time', function () {
    $plnAccount = User::factory()->create(['village_code' => '5171012006', 'agency_id' => $this->pln->id]);
    $plnAccount->assignRole('opd');

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]])
        ->assertRedirect();

    Notification::assertSentTo($plnAccount, AgencyDispatchNotification::class);

    $pivot = ReportAgency::where('report_id', $this->report->id)->where('agency_id', $this->pln->id)->first();
    expect($pivot->requires_confirmation)->toBeTrue();
    expect($pivot->confirmation_label)->toBe('Listrik sudah dipadamkan di lokasi kejadian');

    // Master boleh berubah kapan saja; catatan insiden yang sudah lewat tidak boleh ikut
    // berubah karena ia jadi bahan Berita Acara.
    $this->pln->update(['name' => 'PLN UID Bali', 'confirmation_label' => 'Kalimat baru']);
    expect($pivot->refresh()->agency_name)->toBe('PLN UP3 Bali Selatan');
    expect($pivot->confirmation_label)->toBe('Listrik sudah dipadamkan di lokasi kejadian');
});

it('drops agency ids from another jurisdiction that were injected into the request', function () {
    $luar = Agency::create([
        'name' => 'PLN Kabupaten Lain',
        'is_active' => true,
        'village_code' => '5103010001',
    ]);

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->bpbd->id, $luar->id]])
        ->assertRedirect();

    expect(ReportAgency::where('report_id', $this->report->id)->pluck('agency_id')->all())
        ->toBe([$this->bpbd->id]);
});

it('records who confirmed and through which route (agency itself vs command center)', function () {
    $plnAccount = User::factory()->create(['village_code' => '5171012006', 'agency_id' => $this->pln->id]);
    $plnAccount->assignRole('opd');

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->bpbd->id, $this->pln->id]]);

    // (a) instansi mengonfirmasi sendiri
    $this->actingAs($plnAccount)
        ->post("/reports/{$this->report->id}/agencies/confirm", [
            'agency_id' => $this->pln->id,
            'note' => 'Jaringan dipadamkan pukul 14.10',
        ])->assertRedirect();

    $pivot = ReportAgency::where('report_id', $this->report->id)->where('agency_id', $this->pln->id)->first();
    expect($pivot->confirmed_source)->toBe(ReportAgency::SOURCE_OPD);
    expect($pivot->confirmed_by)->toBe($plnAccount->id);
    expect($pivot->confirmed_at)->not->toBeNull();

    // (b) pelibatan yang memang tak menuntut konfirmasi tidak boleh dikonfirmasi
    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/agencies/confirm", ['agency_id' => $this->bpbd->id])
        ->assertForbidden();
});

it('lets the command center record a confirmation on behalf of the agency, marked as such', function () {
    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]]);

    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/agencies/confirm", [
            'agency_id' => $this->pln->id,
            'note' => 'Dikonfirmasi lewat telepon',
        ])->assertRedirect();

    $pivot = ReportAgency::where('report_id', $this->report->id)->where('agency_id', $this->pln->id)->first();
    expect($pivot->confirmed_source)->toBe(ReportAgency::SOURCE_OPERATOR);
});

/**
 * TASK_30. Konfirmasi OPD dulu berhenti sebagai flash message di layar orang yang menekannya —
 * jadi saat PLN sendiri yang mengonfirmasi, Pusat Komando & petugas di lokasi tidak pernah tahu
 * listrik sudah padam. Yang dijaga di sini: kabar itu sampai ke yang menunggunya, tanpa melebar
 * ke petugas wilayah lain yang tak ada urusannya dengan insiden ini.
 */
it('tells the command center and the officers on scene when an agency confirms', function () {
    $plnAccount = User::factory()->create(['village_code' => '5171012006', 'agency_id' => $this->pln->id]);
    $plnAccount->assignRole('opd');

    // Petugas desa lain: TIDAK sedang menangani insiden ini & di luar wilayah laporan.
    $petugasLuar = User::factory()->create(['village_code' => '5103010001']);
    $petugasLuar->assignRole('petugas');

    // Petugas desa lain yang JUSTRU sedang di lokasi (keanggotaan mengalahkan wilayah, #42).
    $petugasDiLokasi = User::factory()->create(['village_code' => '5103010002']);
    $petugasDiLokasi->assignRole('petugas');

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]]);

    DB::table('report_officers')->insert([
        'report_id' => $this->report->id,
        'user_id' => $petugasDiLokasi->id,
        'status' => 'en_route',
        'dispatched_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($plnAccount)
        ->post("/reports/{$this->report->id}/agencies/confirm", [
            'agency_id' => $this->pln->id,
            'note' => 'Jaringan dipadamkan pukul 14.10',
        ])->assertRedirect();

    Notification::assertSentTo($this->petugas, AgencyConfirmationNotification::class);
    Notification::assertSentTo($petugasDiLokasi, AgencyConfirmationNotification::class);

    // Yang menekan tombolnya sendiri tak perlu dikabari tindakannya sendiri, dan petugas
    // wilayah lain yang tak terlibat tidak ikut kebanjiran.
    Notification::assertNotSentTo($plnAccount, AgencyConfirmationNotification::class);
    Notification::assertNotSentTo($petugasLuar, AgencyConfirmationNotification::class);
});

it('also tells the volunteers on standby and the reporter when an agency confirms', function () {
    // TASK_49 (C), permintaan user: "pln mematikan listrik notif ke admin, petugas, relawan
    // semua dan pelapor". Sebelumnya kabar ini berhenti di admin+petugas — relawan tak pernah
    // disebut sama sekali (termasuk yang SEDANG di lokasi), dan pelapor yang menunggu di TKP
    // juga tidak, padahal "listrik sudah padam" menentukan aman/tidaknya tindakan mereka.
    $plnAccount = User::factory()->create(['village_code' => '5171012006', 'agency_id' => $this->pln->id]);
    $plnAccount->assignRole('opd');

    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $relawanSiaga = User::factory()->create(['village_code' => '5171012006']);
    $relawanSiaga->assignRole('relawan');

    // Saklar siaga (TASK_34) tetap berlaku: relawan yang mematikannya sengaja tidak dibanjiri.
    $relawanNonSiaga = User::factory()->create(['village_code' => '5171012006', 'is_standby' => false]);
    $relawanNonSiaga->assignRole('relawan');

    // Relawan dari desa lain yang JUSTRU sedang meluncur — keanggotaan mengalahkan wilayah
    // (pola yang sama dengan petugas di lokasi, FINDINGS #42). Dulu tabel report_helpers
    // tidak pernah dibaca di sini sama sekali.
    $relawanDiLokasi = User::factory()->create(['village_code' => '5103010002', 'is_standby' => false]);
    $relawanDiLokasi->assignRole('relawan');

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]]);

    DB::table('report_helpers')->insert([
        'report_id' => $this->report->id,
        'user_id' => $relawanDiLokasi->id,
        'status' => 'en_route',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($plnAccount)
        ->post("/reports/{$this->report->id}/agencies/confirm", [
            'agency_id' => $this->pln->id,
            'note' => 'Jaringan dipadamkan pukul 14.10',
        ])->assertRedirect();

    Notification::assertSentTo($admin, AgencyConfirmationNotification::class);
    Notification::assertSentTo($relawanSiaga, AgencyConfirmationNotification::class);
    Notification::assertSentTo($relawanDiLokasi, AgencyConfirmationNotification::class);
    Notification::assertSentTo($this->report->user, AgencyConfirmationNotification::class);

    Notification::assertNotSentTo($relawanNonSiaga, AgencyConfirmationNotification::class);
});

it('does not tell the reporter twice when the reporter is the one recording the confirmation', function () {
    // Operator boleh mencatatkan konfirmasi atas nama OPD. Kalau kebetulan dialah pelapornya
    // (operator yang menerima telepon lalu memproses sendiri — alur TASK_28), ia tidak perlu
    // dikabari tindakannya sendiri lewat jalur "pelapor" yang baru. Aktornya ADMIN sejak
    // TASK_51: sesudah verifikasi dicabut dari petugas, satu-satunya orang yang bisa
    // melapor DAN memverifikasi laporannya sendiri adalah admin.
    $adminPelapor = User::factory()->create(['village_code' => '5171012006']);
    $adminPelapor->assignRole('admin');

    $report = Report::create([
        'user_id' => $adminPelapor->id,
        'title' => 'Kebakaran lapak dilaporkan lewat telepon',
        'incident_type' => 'rumah',
        'address' => 'Jl. Pemogan No. 9',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
    ]);

    $this->actingAs($adminPelapor)->post("/reports/{$report->id}/approve", ['agency_ids' => [$this->pln->id]]);

    $this->actingAs($adminPelapor)
        ->post("/reports/{$report->id}/agencies/confirm", ['agency_id' => $this->pln->id])
        ->assertRedirect();

    Notification::assertNotSentTo($adminPelapor, AgencyConfirmationNotification::class);
});

it('blocks an agency account from confirming on behalf of a different agency', function () {
    $bpbdAccount = User::factory()->create(['village_code' => '5171012006', 'agency_id' => $this->bpbd->id]);
    $bpbdAccount->assignRole('opd');

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]]);

    $this->actingAs($bpbdAccount)
        ->post("/reports/{$this->report->id}/agencies/confirm", ['agency_id' => $this->pln->id])
        ->assertForbidden();
});

it('opens the incident detail to an involved agency account and keeps it shut to others', function () {
    $plnAccount = User::factory()->create(['village_code' => '5171012006', 'agency_id' => $this->pln->id]);
    $plnAccount->assignRole('opd');

    $outsider = User::factory()->create(['village_code' => '5171012006', 'agency_id' => $this->bpbd->id]);
    $outsider->assignRole('opd');

    // Sebelum dilibatkan: tertutup untuk keduanya.
    $this->actingAs($plnAccount)->get("/reports/show/{$this->report->id}")->assertForbidden();

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]]);

    $this->actingAs($plnAccount)->get("/reports/show/{$this->report->id}")->assertOk();
    $this->actingAs($outsider)->get("/reports/show/{$this->report->id}")->assertForbidden();
});

it('lets an admin release an agency from the incident', function () {
    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->bpbd->id]]);

    $this->actingAs($this->admin)
        ->delete("/reports/{$this->report->id}/agencies", ['agency_id' => $this->bpbd->id])
        ->assertRedirect();

    expect(ReportAgency::where('report_id', $this->report->id)->count())->toBe(0);
});

/**
 * TASK_51, permintaan user: "petugas tidak bisa cabut opd". SENGAJA tidak simetris —
 * MEMINTA bantuan tetap boleh (eskalasi lahir di lapangan: "ada kabel jatuh, panggil PLN"),
 * MENCABUTNYA tidak. Kedua sisi diuji dalam satu test supaya asimetri ini tak bisa
 * "dirapikan" jadi seragam tanpa ada yang merah.
 */
it('lets petugas ask for an agency but never release one', function () {
    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->bpbd->id]]);

    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/agencies", ['agency_ids' => [$this->pln->id]])
        ->assertRedirect();
    expect(ReportAgency::where('report_id', $this->report->id)->count())->toBe(2);

    $this->actingAs($this->petugas)
        ->delete("/reports/{$this->report->id}/agencies", ['agency_id' => $this->bpbd->id])
        ->assertForbidden();
    expect(ReportAgency::where('report_id', $this->report->id)->count())->toBe(2);
});

it('does not send a second request when the same agency is involved twice', function () {
    $plnAccount = User::factory()->create(['village_code' => '5171012006', 'agency_id' => $this->pln->id]);
    $plnAccount->assignRole('opd');

    $this->actingAs($this->admin)
        ->post("/reports/{$this->report->id}/approve", ['agency_ids' => [$this->pln->id]]);

    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/agencies", ['agency_ids' => [$this->pln->id]])
        ->assertRedirect();

    expect(ReportAgency::where('report_id', $this->report->id)->count())->toBe(1);
    Notification::assertSentToTimes($plnAccount, AgencyDispatchNotification::class, 1);
});

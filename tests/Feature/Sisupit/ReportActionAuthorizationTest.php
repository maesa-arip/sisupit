<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    // Workflow approve/arrive/resolve kini mengirim notifikasi balik ke pelapor (FCM +
    // database). Fake-kan agar uji otorisasi ini terisolasi dari side-effect FCM
    // (test env tak punya kredensial Firebase) — sama seperti ReportNotificationLevelTest.
    Notification::fake();

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
        // Wilayah laporan = wilayah responder di test ini, agar lolos cek yurisdiksi
        // take-action/arrive (FINDINGS #26). Blokir lintas-wilayah diuji terpisah
        // di ReportResponderJurisdictionTest.
        'village_code' => '5171012006',
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

it('lets an admin approve a report', function () {
    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    expect($this->report->refresh()->status)->toBe('pending');
});

/**
 * TASK_51 (keputusan user 2026-08-31). Petugas DULU boleh memverifikasi — repo ini lama
 * menyebut "Pusat Komando (petugas/admin)" — dan test ini dulu berbunyi
 * "it lets petugas approve a report". Ia dibalik, bukan dihapus: verifikasi menentukan
 * apakah sirine berbunyi ke seluruh wilayah, dan itu keputusan admin. Petugas tetap
 * menerima notifikasi laporan masuk; peranannya mulai di take-action.
 */
it('blocks petugas from approving or rejecting a report', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/approve")->assertForbidden();
    $this->actingAs($petugas)
        ->post("/reports/{$this->report->id}/reject", ['reason' => 'Hoaks'])
        ->assertForbidden();

    // Statusnya tak boleh bergeser sedikit pun oleh percobaan itu.
    expect($this->report->refresh()->status)->toBe('TERLAPOR');
});

/**
 * Penjaga bahwa petugas kehilangan verifikasi TAPI TIDAK kehilangan pekerjaannya: meluncur,
 * menandai tiba, dan menutup insiden tetap miliknya. Tanpa test ini, "cabut petugas dari
 * approve" gampang melebar jadi "cabut petugas dari ReportActionController".
 */
it('keeps the field actions open to petugas after verification was taken away', function () {
    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');
    $this->actingAs($admin)->post("/reports/{$this->report->id}/approve")->assertRedirect();

    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->post("/reports/{$this->report->id}/take-action")->assertRedirect();
    $this->actingAs($petugas)->post("/reports/{$this->report->id}/arrive")->assertRedirect();
    $this->actingAs($petugas)->post("/reports/{$this->report->id}/resolve")->assertRedirect();

    expect($this->report->refresh()->status)->toBe('resolved');
    expect($this->report->resolved_by)->toBe($petugas->id);
});

/**
 * Tombol dan gerbang harus menjawab pertanyaan yang SAMA (pelajaran #94). Panel verifikasi
 * di Front/Reports/Show.jsx dulu dirender dari daftar peran yang disusun di berkas JSX itu
 * sendiri; sejak TASK_51 ia membaca prop `canVerify` dari server. Kalau daftar peran di
 * ReportActionController diubah tanpa ikut mengubah $isVerifier di ReportController::show,
 * petugas akan melihat tombol yang selalu berakhir 403 — atau admin kehilangan tombolnya
 * tanpa satu pun galat. Yang diadu di sini prop layar vs gerbang endpoint yang sungguhan,
 * bukan kamus lawan kamus.
 */
it('ships verification affordances to admin only, matching the endpoint gate', function () {
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $propsPetugas = $this->actingAs($petugas)
        ->get("/reports/show/{$this->report->id}")
        ->original->getData()['page']['props'];

    expect($propsPetugas['canVerify'])->toBeFalse();
    expect($propsPetugas['canRemoveAgencies'])->toBeFalse();
    // Yang TIDAK ikut dicabut: petugas tetap boleh meminta OPD & mengisi berita acara.
    expect($propsPetugas['canManageAgencies'])->toBeTrue();
    expect($propsPetugas['canManageResolution'])->toBeTrue();

    $propsAdmin = $this->actingAs($admin)
        ->get("/reports/show/{$this->report->id}")
        ->original->getData()['page']['props'];

    expect($propsAdmin['canVerify'])->toBeTrue();
    expect($propsAdmin['canRemoveAgencies'])->toBeTrue();

    // Prop itu harus sejalan dengan endpointnya, bukan sekadar bernilai benar sendiri.
    $this->actingAs($petugas)->post("/reports/{$this->report->id}/approve")->assertForbidden();
    $this->actingAs($admin)->post("/reports/{$this->report->id}/approve")->assertRedirect();
});

it('blocks approving a report that is no longer TERLAPOR', function () {
    $this->report->update(['status' => 'pending']);

    // Aktornya ADMIN, bukan petugas: sejak TASK_51 petugas sudah tertolak di gerbang PERAN,
    // jadi memakainya di sini akan menghijaukan test ini karena alasan yang keliru.
    $admin = User::factory()->create(['village_code' => '5171012006']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->post("/reports/{$this->report->id}/approve")->assertForbidden();
});

it('blocks responding to a closed (resolved) incident', function () {
    $this->report->update(['status' => 'resolved']);

    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->post("/reports/{$this->report->id}/take-action")->assertForbidden();
    $this->actingAs($relawan)->post("/reports/{$this->report->id}/arrive")->assertForbidden();
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

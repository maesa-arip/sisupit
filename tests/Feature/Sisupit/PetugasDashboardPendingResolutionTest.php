<?php

use App\Models\Report;
use App\Models\ReportResolution;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// FINDINGS #40 — antrian "Menunggu Berita Acara" di dashboard petugas. Setelah insiden
// ditandai Selesai (status `resolved`) laporan hilang dari daftar misi aktif; queue ini
// memastikan laporan yang berita acaranya belum FINAL tetap mudah ditemukan petugas
// untuk dilengkapi. Ter-scope wilayah penugasan, sama seperti daftar misi.

const VILLAGE = '5171012006';

beforeEach(function () {
    $this->petugas = User::factory()->create(['village_code' => VILLAGE]);
    $this->petugas->assignRole('petugas');
});

function makeResolvedReport(array $overrides = []): Report
{
    $reporter = User::factory()->create();
    $reporter->assignRole('masyarakat');

    return Report::create(array_merge([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah bedeng',
        'address' => 'Jl. Trengguli No. 50',
        'lat' => '-8.6300',
        'lng' => '115.2600',
        'status' => 'resolved',
        'village_code' => VILLAGE,
    ], $overrides));
}

/**
 * TASK_51. Sejak verifikasi dicabut dari petugas, laporan mentah (TERLAPOR) di dashboardnya
 * berubah makna: dari "Tanggapi" jadi "Menunggu Admin". Yang dikunci di sini adalah
 * PRASYARAT keadaan itu — laporan mentah HARUS tetap sampai ke dashboard petugas berikut
 * kolom statusnya. Kalau ia diam-diam disaring keluar, keadaan menunggu itu tak akan pernah
 * punya apa pun untuk digambar, dan petugas kembali buta terhadap laporan yang notifikasinya
 * baru saja ia terima.
 */
it('keeps unverified reports on the petugas dashboard so the waiting state has something to show', function () {
    makeResolvedReport(['status' => 'TERLAPOR', 'title' => 'Kebakaran belum diverifikasi']);

    $this->actingAs($this->petugas)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Petugas/Dashboard')
            ->has('activeMissions', 1)
            ->where('activeMissions.0.status', 'TERLAPOR'));
});

it('surfaces resolved reports without any berita acara in the petugas queue', function () {
    makeResolvedReport();

    $this->actingAs($this->petugas)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Petugas/Dashboard')
            ->has('pendingResolutions', 1));
});

it('clears the item from the petugas queue once a sementara entry exists', function () {
    // TASK_49: entri FINAL kini ditutup admin, jadi antrian ini menuntut dari petugas hanya
    // entri sementaranya. Bentuk lama ("belum ada entri final") akan membuat insiden yang
    // sudah ia isi menggantung selamanya di kartunya menunggu orang lain — antrian yang tak
    // bisa dibereskan sendiri terbaca sebagai bug.
    $report = makeResolvedReport();
    ReportResolution::create([
        'report_id' => $report->id,
        'created_by' => $this->petugas->id,
        'status' => 'sementara',
    ]);

    $this->actingAs($this->petugas)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->has('pendingResolutions', 0));
});

it('excludes reports that already have a final berita acara', function () {
    $report = makeResolvedReport();
    ReportResolution::create([
        'report_id' => $report->id,
        'created_by' => $this->petugas->id,
        'status' => 'final',
    ]);

    $this->actingAs($this->petugas)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->has('pendingResolutions', 0));
});

it('scopes the queue to the officer jurisdiction', function () {
    makeResolvedReport(['village_code' => '9999999999']);

    $this->actingAs($this->petugas)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->has('pendingResolutions', 0));
});

it('keeps active (unresolved) reports out of the berita acara queue', function () {
    makeResolvedReport(['status' => 'handling']);

    $this->actingAs($this->petugas)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('pendingResolutions', 0)
            ->has('activeMissions', 1));
});

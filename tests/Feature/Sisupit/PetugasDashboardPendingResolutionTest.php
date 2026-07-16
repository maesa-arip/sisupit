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

it('surfaces resolved reports without a final berita acara in the petugas queue', function () {
    makeResolvedReport();

    $this->actingAs($this->petugas)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Petugas/Dashboard')
            ->has('pendingResolutions', 1)
            ->where('pendingResolutions.0.has_draft', false));
});

it('marks a queue item as draft when only a sementara resolution exists', function () {
    $report = makeResolvedReport();
    ReportResolution::create([
        'report_id' => $report->id,
        'created_by' => $this->petugas->id,
        'status' => 'sementara',
    ]);

    $this->actingAs($this->petugas)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('pendingResolutions', 1)
            ->where('pendingResolutions.0.has_draft', true));
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

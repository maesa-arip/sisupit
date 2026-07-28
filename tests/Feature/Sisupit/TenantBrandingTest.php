<?php

use App\Models\Report;
use App\Models\Tenant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('shares the resolved subdomain tenant branding on the spotlight', function () {
    config(['services.tenant.base_domain' => 'sisupit.com']);
    Tenant::create([
        'subdomain' => 'badung', 'city_code' => '5103', 'province_code' => '51',
        'nama_instansi' => 'Damkar Kabupaten Badung', 'telepon_darurat' => '0361-9999999',
        'is_active' => true,
    ]);

    $this->get('http://badung.sisupit.com/spotlight')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tenant.nama_instansi', 'Damkar Kabupaten Badung')
            ->where('tenant.telepon_darurat', '0361-9999999'));
});

it('brands the thanks page from the report city tenant, not the subdomain', function () {
    Tenant::create([
        'subdomain' => 'badung', 'city_code' => '5103', 'province_code' => '51',
        'nama_instansi' => 'Damkar Kabupaten Badung', 'pejabat_nama' => 'I Ketut Contoh',
        'pejabat_jabatan' => 'Kepala Dinas', 'telepon_darurat' => '0361-111222', 'is_active' => true,
    ]);

    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('masyarakat');
    $report = Report::create([
        'user_id' => $reporter->id, 'title' => 'Kebakaran', 'status' => 'TERLAPOR',
        'lat' => '-8.6', 'lng' => '115.2', 'province_code' => '51', 'city_code' => '5103',
    ]);

    $this->actingAs($reporter)->get(route('front.reports.thanks', $report->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Front/Reports/Thanks')
            ->where('isPartner', true)
            ->where('teleponDarurat', '0361-111222')
            ->where('pejabat.nama', 'I Ketut Contoh'));
});

it('falls back to 112 and no pejabat for a non-partner city on the thanks page', function () {
    $reporter = User::factory()->create(['village_code' => '5171012006']);
    $reporter->assignRole('masyarakat');
    $report = Report::create([
        'user_id' => $reporter->id, 'title' => 'Kebakaran', 'status' => 'TERLAPOR',
        'lat' => '-8.5', 'lng' => '110.4', 'province_code' => '34', 'city_code' => '3471',
    ]);

    $this->actingAs($reporter)->get(route('front.reports.thanks', $report->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('isPartner', false)
            ->where('teleponDarurat', '112')
            ->where('pejabat', null));
});

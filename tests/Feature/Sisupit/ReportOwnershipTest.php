<?php

use App\Models\Report;
use App\Models\User;

beforeEach(function () {
    $owner = User::factory()->create(['village_code' => '5171012006']);
    $owner->assignRole('masyarakat');

    $this->owner = $owner;
    $this->report = Report::create([
        'user_id' => $owner->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
    ]);
});

it('blocks an unrelated citizen from editing or deleting someone else report', function () {
    $stranger = User::factory()->create(['village_code' => '5171012006']);
    $stranger->assignRole('masyarakat');

    $this->actingAs($stranger)->get("/reports/edit/{$this->report->id}")->assertForbidden();
    $this->actingAs($stranger)->delete("/reports/destroy/{$this->report->id}")->assertForbidden();
});

it('lets the report owner edit their own report', function () {
    $this->actingAs($this->owner)->get("/reports/edit/{$this->report->id}")->assertOk();
});

it('blocks even staff from the owner-only report edit form (#30: pelapor saja)', function () {
    // Edit laporan kini HANYA untuk pelapor & saat TERLAPOR (keputusan #30). Staff
    // mengelola laporan lewat workflow aksi (approve/reject/dst.), bukan form edit.
    $petugas = User::factory()->create(['village_code' => '5171012006']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->get("/reports/edit/{$this->report->id}")->assertForbidden();
});

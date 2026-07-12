<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $this->payload = [
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Jl. Pemogan No. 1',
    ];
});

it('stores multiple photos and uses the first as the cover', function () {
    Notification::fake();
    Storage::fake('public');

    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $response = $this->actingAs($citizen)->post('/reports/create', [
        ...$this->payload,
        'photos' => [
            UploadedFile::fake()->image('a.jpg'),
            UploadedFile::fake()->image('b.jpg'),
            UploadedFile::fake()->image('c.jpg'),
        ],
    ]);

    $report = Report::withoutGlobalScopes()->first();
    $response->assertRedirect(route('front.reports.thanks', $report->id));
    expect($report)->not->toBeNull();
    expect($report->photos()->count())->toBe(3);
    // Foto sampul (kolom lama) = foto pertama
    expect($report->photo)->toBe($report->photos()->orderBy('id')->first()->path);

    foreach ($report->photos as $photo) {
        Storage::disk('public')->assertExists($photo->path);
    }
});

it('allows creating a fire report without any photo (photo optional for kebakaran)', function () {
    // Darurat-first (Kluster A): untuk kebakaran (rumah/toko/kendaraan/lahan) foto opsional
    // agar warga tak perlu mendekati api. Laporan tetap terbuat tanpa foto.
    Notification::fake();
    Storage::fake('public');

    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $response = $this->actingAs($citizen)->post('/reports/create', [
        ...$this->payload,
        'incident_type' => 'rumah',
    ]);

    $report = Report::withoutGlobalScopes()->first();
    $response->assertRedirect(route('front.reports.thanks', $report->id));
    expect($report)->not->toBeNull();
    expect($report->photos()->count())->toBe(0);
    expect($report->photo)->toBeNull();
});

it('requires a photo for a non-fire emergency (incident_type = lainnya)', function () {
    // Untuk darurat non-kebakaran ('lainnya') petugas butuh konteks lebih → foto wajib.
    Notification::fake();
    Storage::fake('public');

    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('masyarakat');

    $this->actingAs($citizen)->post('/reports/create', [
        ...$this->payload,
        'incident_type' => 'lainnya',
    ])->assertSessionHasErrors('photos');

    expect(Report::withoutGlobalScopes()->count())->toBe(0);
});

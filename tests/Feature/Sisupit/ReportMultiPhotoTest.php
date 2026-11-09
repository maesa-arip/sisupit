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
    $citizen->assignRole('warga');

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
    $citizen->assignRole('warga');

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

it('requires a photo, description and patokan from a citizen for a non-fire emergency (incident_type = lainnya)', function () {
    // #238 (keputusan user 2026-11-09): foto darurat non-kebakaran WAJIB lagi bagi warga
    // (pelonggaran #149 dicabut untuk pelapor non-staf). Deskripsi & patokan tetap wajib.
    Notification::fake();
    Storage::fake('public');

    $citizen = User::factory()->create(['village_code' => '5171012006']);
    $citizen->assignRole('warga');

    $this->actingAs($citizen)->post('/reports/create', [
        ...$this->payload,
        'incident_type' => 'lainnya',
        'description' => '',
        'address' => '',
    ])->assertSessionHasErrors(['description', 'address', 'photos' => 'Lampirkan minimal satu foto kejadian.']);
    expect(Report::withoutGlobalScopes()->count())->toBe(0);

    $this->actingAs($citizen)->post('/reports/create', [
        ...$this->payload,
        'incident_type' => 'lainnya',
        'photos' => [UploadedFile::fake()->image('pohon.jpg')],
    ])->assertSessionHasNoErrors();

    $report = Report::withoutGlobalScopes()->first();
    expect($report)->not->toBeNull();
    expect($report->photos()->count())->toBe(1);
});

it('keeps the non-fire photo optional for the command center typing a phone report (#238)', function (string $role) {
    Notification::fake();
    Storage::fake('public');

    $operator = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $operator->assignRole($role);

    $this->actingAs($operator)->post('/reports/create', [
        ...$this->payload,
        'incident_type' => 'lainnya',
    ])->assertSessionHasNoErrors();

    expect(Report::withoutGlobalScopes()->sole()->photos()->count())->toBe(0);
})->with(['admin', 'superadmin', 'petugas']);

it('requires the non-fire photo from a relawan too - only the command center is exempt (#238)', function () {
    Notification::fake();

    $relawan = User::factory()->create(['village_code' => '5171012006']);
    $relawan->assignRole('relawan');

    $this->actingAs($relawan)->post('/reports/create', [
        ...$this->payload,
        'incident_type' => 'lainnya',
    ])->assertSessionHasErrors('photos');
    expect(Report::withoutGlobalScopes()->count())->toBe(0);
});

it('tells the form whether the non-fire photo is required, from the same rule (#238)', function () {
    $warga = User::factory()->create(['village_code' => '5171012006']);
    $warga->assignRole('warga');
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $this->actingAs($warga)->get(route('front.reports.create'))
        ->assertInertia(fn ($page) => $page->where('non_fire_photo_required', true));
    $this->actingAs($admin)->get(route('front.reports.create'))
        ->assertInertia(fn ($page) => $page->where('non_fire_photo_required', false));
});

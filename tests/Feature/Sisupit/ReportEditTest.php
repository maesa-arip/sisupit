<?php

use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->owner = User::factory()->create(['village_code' => '5171012006']);
    $this->owner->assignRole('masyarakat');

    $this->report = Report::create([
        'user_id' => $this->owner->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
        'photo' => 'reports/p1.jpg',
    ]);
    $this->p1 = $this->report->photos()->create(['path' => 'reports/p1.jpg']);
    $this->p2 = $this->report->photos()->create(['path' => 'reports/p2.jpg']);
});

it('lets the owner edit content of a TERLAPOR report (location untouched)', function () {
    $this->actingAs($this->owner)
        ->put(route('front.reports.update', $this->report->id), [
            'title' => 'Judul baru',
            'description' => 'Deskripsi baru',
            'address' => 'Alamat patokan baru',
        ])->assertRedirect(route('dashboard'));

    $this->report->refresh();
    expect($this->report->title)->toBe('Judul baru');
    expect($this->report->description)->toBe('Deskripsi baru');
    expect($this->report->address)->toBe('Alamat patokan baru');
    // Lokasi tidak berubah
    expect($this->report->lat)->toBe('-8.6500');
    expect($this->report->village_code)->toBe('5171012006');
});

it('blocks editing once the report has been validated', function () {
    $this->report->update(['status' => 'pending']);

    $this->actingAs($this->owner)
        ->put(route('front.reports.update', $this->report->id), [
            'title' => 'Judul edit', 'description' => 'Deskripsi edit', 'address' => 'Alamat edit',
        ])->assertForbidden();
});

it('blocks a non-owner from editing', function () {
    $other = User::factory()->create(['village_code' => '5171012006']);
    $other->assignRole('masyarakat');

    $this->actingAs($other)
        ->put(route('front.reports.update', $this->report->id), [
            'title' => 'Judul edit', 'description' => 'Deskripsi edit', 'address' => 'Alamat edit',
        ])->assertForbidden();
});

it('adds and removes gallery photos and recomputes the cover', function () {
    Storage::fake('public');

    $this->actingAs($this->owner)
        ->put(route('front.reports.update', $this->report->id), [
            'title' => 'Judul',
            'description' => 'Deskripsi',
            'address' => 'Alamat',
            'removed_photos' => [$this->p1->id],
            'photos' => [UploadedFile::fake()->image('baru.jpg')],
        ])->assertRedirect(route('dashboard'));

    $this->report->refresh();
    // p1 dihapus, p2 + foto baru = 2
    expect($this->report->photos()->count())->toBe(2);
    expect(ReportPhoto::find($this->p1->id))->toBeNull();
    // sampul = foto tersisa pertama
    expect($this->report->photo)->toBe($this->report->photos()->orderBy('id')->first()->path);
});

it('rejects removing every photo without adding a new one', function () {
    $this->actingAs($this->owner)
        ->put(route('front.reports.update', $this->report->id), [
            'title' => 'Judul',
            'description' => 'Deskripsi',
            'address' => 'Alamat',
            'removed_photos' => [$this->p1->id, $this->p2->id],
        ]);

    // Min 1 foto dipaksakan → tidak ada foto yang terhapus
    expect($this->report->photos()->count())->toBe(2);
});

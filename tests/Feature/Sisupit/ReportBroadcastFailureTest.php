<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Broadcasting\Broadcasters\Broadcaster;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

/**
 * Siaran yang gagal TIDAK BOLEH membuat laporan yang sudah tersimpan berbunyi gagal (#130).
 *
 * Event laporan memakai ShouldBroadcastNow, jadi Reverb ditembak di dalam request itu sendiri.
 * Saat Reverb mati atau salah port (di lokal: port 8080 dipegang container Nominatim), ia
 * melempar "Pusher error" SESUDAH laporan tersimpan dan Pusat Komando dikabari. Warga melihat
 * "Terjadi kesalahan", mengirim ulang, dan satu kebakaran jadi beberapa laporan - dibuktikan
 * di DB lokal: tiga laporan kembar dalam dua menit dari tiga percobaan yang "gagal".
 *
 * Driver di bawah SELALU melempar BroadcastException - kelas yang sama dengan "Pusher error"
 * sungguhan - supaya kegagalannya pasti, bukan bergantung pada koneksi yang kebetulan tertolak.
 */
beforeEach(function () {
    Notification::fake();
    Storage::fake('public');

    Broadcast::extend('meledak', fn () => new class extends Broadcaster
    {
        public function auth($request) {}

        public function validAuthenticationResponse($request, $result) {}

        public function broadcast(array $channels, $event, array $payload = [])
        {
            throw new BroadcastException('Pusher error: 404 Not Found');
        }
    });
    config([
        'broadcasting.connections.meledak' => ['driver' => 'meledak'],
        'broadcasting.default' => 'meledak',
    ]);

    $this->reporter = User::factory()->create(['village_code' => '5171012006']);
    $this->reporter->assignRole('warga');
});

it('still lands on the thanks screen, with exactly one report, when broadcasting fails after save', function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan']);

    $response = $this->actingAs($this->reporter)->post('/reports/create', [
        'title' => 'Kebakaran lahan',
        'description' => 'Asap tebal terlihat',
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
        'village_code' => '5171012006',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'address' => 'Jl. Pemogan No. 2',
        'photos' => [UploadedFile::fake()->image('kejadian.jpg')],
    ]);

    $report = Report::withoutGlobalScopes()->sole();
    $response->assertRedirect(route('front.reports.thanks', $report->id));
});

it('still reports the edit as saved when broadcasting fails after save', function () {
    $report = Report::create([
        'user_id' => $this->reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'village_code' => '5171012006',
        'photo' => 'reports/p1.jpg',
    ]);
    $report->photos()->create(['path' => 'reports/p1.jpg']);

    $this->actingAs($this->reporter)
        ->put(route('front.reports.update', $report->id), [
            'title' => 'Judul baru',
            'description' => 'Deskripsi baru',
            'address' => 'Patokan baru',
        ])->assertRedirect(route('dashboard'));

    expect($report->refresh()->title)->toBe('Judul baru');
});

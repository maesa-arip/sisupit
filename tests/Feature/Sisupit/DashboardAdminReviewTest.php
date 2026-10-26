<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Review UX dashboard admin 2026-10-26 (branch feat/review-dashboard-admin-ux): alamat mesin
 * dipotong sampai kecamatan, satu CTA lapor di ponsel, sapaan tanpa nama peran ganda, ikon
 * tipis di petak statistik ponsel, subjudul logo satu baris, pudar di atas bilah bawah.
 * Yang DIPUTUSKAN TETAP (jangan "perbaiki"): logo petir, Selesai = biru, kartu Darurat Aktif.
 */
function reviewSource(string $path): string
{
    $src = file_get_contents(base_path($path));

    return preg_replace(['#\{/\*.*?\*/\}#s', '#/\*.*?\*/#s', '#^\s*//.*$#m'], '', $src);
}

beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert(['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar']);
    DB::table('indonesia_districts')->insert(['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan']);
    DB::table('indonesia_villages')->insert(['code' => '5171011001', 'district_code' => '517101', 'name' => 'Renon']);
});

function laporanRingkas(array $attrs): Report
{
    $citizen = User::factory()->create();

    return Report::create(array_merge([
        'user_id' => $citizen->id, 'title' => 'Biawak masuk rumah', 'status' => 'pending',
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011001',
    ], $attrs));
}

it('cuts the machine address right after the district', function () {
    $report = laporanRingkas([
        'geo_address' => 'Jalan Kenari, Renon, Denpasar Selatan, Denpasar, Bali, Nusa Tenggara, 80226, Indonesia',
    ]);

    expect($report->alamatRingkas())->toBe('Jalan Kenari, Renon, Denpasar Selatan');
});

it('falls back to dropping the administrative tail when the district is not in the address', function () {
    $report = laporanRingkas([
        'district_code' => null,
        'geo_address' => 'Jalan Kenari, Renon, Denpasar, Bali, Nusa Tenggara, 80226, Indonesia',
    ]);

    expect($report->alamatRingkas())->toBe('Jalan Kenari, Renon');
});

it('never shortens the landmark a citizen typed', function () {
    $report = laporanRingkas(['address' => 'Depan pura, Denpasar, Bali, Indonesia']);

    expect($report->alamatRingkas())->toBe('Depan pura, Denpasar, Bali, Indonesia');
});

it('sends the short address to the admin dashboard list', function () {
    laporanRingkas([
        'geo_address' => 'Jalan Kenari, Renon, Denpasar Selatan, Denpasar, Bali, Nusa Tenggara, 80226, Indonesia',
    ]);
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/dashboard')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard')
            ->where('recentReports.0.location', 'Jalan Kenari, Renon, Denpasar Selatan'));
});

it('keeps one red call to action on the admin dashboard phone screen', function () {
    $src = reviewSource('resources/js/Pages/Admin/Dashboard.jsx');

    expect($src)->toContain('<div className="hidden items-center gap-3 md:flex">')
        ->and($src)->toContain('<Button variant="outline" className="h-10 rounded-xl" asChild>')
        ->and($src)->not->toContain('bg-primary text-primary-foreground hover:bg-primary/90');
});

it('does not greet an account named after its role with the role twice', function () {
    $src = reviewSource('resources/js/Pages/Admin/Dashboard.jsx');

    expect($src)->toContain("['admin', 'administrator', 'superadmin', 'pejabat'].includes(greetName.toLowerCase())")
        ->and($src)->toContain('title={greetTitle}');
});

it('gives phone stat tiles a faint corner icon that takes no width', function () {
    expect(reviewSource('resources/js/Pages/Admin/Dashboard.jsx'))
        ->toContain('pointer-events-none absolute right-3 top-3 h-5 w-5 opacity-40 md:hidden')
        ->toContain('order-1 hidden shrink-0');
});

it('keeps the logo subtitle on one line and off narrow headers', function () {
    expect(reviewSource('resources/js/Components/ApplicationLogo.jsx'))
        ->toContain('hidden whitespace-nowrap text-[10px]')
        ->toContain('sm:block');
});

it('fades content scrolling under the raised Lapor circle', function () {
    expect(reviewSource('resources/js/Layouts/Partials/MobileBottomNav.jsx'))
        ->toContain('pointer-events-none absolute inset-x-0 bottom-full h-6 bg-gradient-to-t from-background/80 to-transparent');
});

<?php

use App\Models\Report;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * TASK_72 fase 6 - superadmin = Pusat Komando lintas wilayah + papan per wilayah + kesehatan sistem.
 * Yang dijaga: wilayah yang laporannya paling lama menunggu ada di atas, wilayah tenant tanpa kejadian
 * tetap tampil (tenang = informasi), admin wilayah TIDAK menerima papan ini, dan kesehatan sistem hanya
 * angka yang bisa dibuktikan dari tabel queue.
 */
beforeEach(function () {
    $this->superadmin = User::factory()->create();
    $this->superadmin->assignRole('superadmin');

    DB::table('indonesia_provinces')->insert([['code' => '51', 'name' => 'BALI']]);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'KOTA DENPASAR'],
        ['code' => '5103', 'province_code' => '51', 'name' => 'KABUPATEN BADUNG'],
        ['code' => '5104', 'province_code' => '51', 'name' => 'KABUPATEN GIANYAR'],
    ]);

    $this->report = fn (string $city, string $status, string $ago) => tap(Report::withoutGlobalScopes()->create([
        'user_id' => User::factory()->create()->id, 'title' => 'Kebakaran', 'description' => 'Api',
        'lat' => '-8.65', 'lng' => '115.22', 'status' => $status, 'province_code' => '51', 'city_code' => $city,
    ]), fn ($r) => $r->forceFill(['created_at' => now()->sub($ago)])->save());
});

it('puts the region whose report has waited longest at the top and keeps quiet tenant regions visible', function () {
    Tenant::create(['subdomain' => 'gianyar', 'city_code' => '5104', 'province_code' => '51', 'nama_instansi' => 'Damkar Gianyar', 'is_active' => true]);
    ($this->report)('5171', 'TERLAPOR', '2 minutes');
    ($this->report)('5171', 'handling', '1 hour');
    ($this->report)('5103', 'TERLAPOR', '15 minutes');
    ($this->report)('5103', 'resolved', '1 day');

    $regions = $this->actingAs($this->superadmin)->get('/dashboard')->viewData('page')['props']['regions'];

    expect(array_column($regions, 'city_code'))->toBe(['5103', '5171', '5104'])
        ->and($regions[0])->toMatchArray(['name' => 'Kabupaten Badung', 'waiting' => 1, 'active' => 0, 'has_tenant' => false])
        ->and($regions[1])->toMatchArray(['waiting' => 1, 'active' => 1])
        ->and($regions[2])->toMatchArray(['name' => 'Damkar Gianyar', 'waiting' => 0, 'active' => 0, 'oldest_waiting_at' => null]);
});

it('reports queue health from the queue tables only', function () {
    DB::table('jobs')->insert(['queue' => 'default', 'payload' => '{}', 'attempts' => 0, 'available_at' => now()->timestamp, 'created_at' => now()->subMinutes(7)->timestamp]);
    DB::table('failed_jobs')->insert(['uuid' => 'a', 'connection' => 'database', 'queue' => 'default', 'payload' => '{}', 'exception' => 'x', 'failed_at' => now()->subHours(2)]);
    DB::table('failed_jobs')->insert(['uuid' => 'b', 'connection' => 'database', 'queue' => 'default', 'payload' => '{}', 'exception' => 'x', 'failed_at' => now()->subDays(3)]);

    $health = $this->actingAs($this->superadmin)->get('/dashboard')->viewData('page')['props']['systemHealth'];

    expect($health['queue_pending'])->toBe(1)
        ->and($health['queue_oldest_at'])->not->toBeNull()
        ->and($health['failed_24h'])->toBe(1)
        ->and($health['failed_total'])->toBe(2);
});

it('keeps the cross-region board and system health away from regional admins', function () {
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $props = $this->actingAs($admin)->get('/dashboard')->viewData('page')['props'];

    expect($props)->not->toHaveKey('regions')->and($props)->not->toHaveKey('systemHealth');
});

it('renders the region board and system health only when the server sends them', function () {
    $src = file_get_contents(resource_path('js/Pages/Admin/Dashboard.jsx'));

    expect($src)->toContain('{regions && (')
        ->and($src)->toContain('{systemHealth && (');
});

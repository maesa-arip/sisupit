<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Sisipkan provinsi + kota agar aturan exists:indonesia_cities lolos (tabel ada tapi kosong di
 *  test, dan cities.province_code punya FK ke provinces.code). */
function seedCity(string $code, string $province, string $name): void
{
    DB::table('indonesia_provinces')->updateOrInsert(
        ['code' => $province],
        ['name' => 'PROVINSI '.$province]
    );
    DB::table('indonesia_cities')->updateOrInsert(
        ['code' => $code],
        ['province_code' => $province, 'name' => $name]
    );
}

it('blocks a non-superadmin from managing tenants', function () {
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin/tenants')->assertForbidden();
});

it('lets a superadmin create a tenant via the form', function () {
    seedCity('5103', '51', 'KABUPATEN BADUNG');

    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $this->actingAs($superadmin)->post(route('admin.tenants.store'), [
        'subdomain' => 'Badung',           // sengaja kapital → harus dinormalisasi lowercase
        'province_code' => '51',
        'city_code' => '5103',
        'nama_instansi' => 'Damkar Kabupaten Badung',
        'pejabat_nama' => 'Pejabat Badung',
        'pejabat_jabatan' => 'Kepala Dinas',
        'telepon_darurat' => '113',
        'is_active' => true,
    ])->assertRedirect(route('admin.tenants.index'));

    $tenant = Tenant::first();
    expect($tenant->subdomain)->toBe('badung');
    expect($tenant->city_code)->toBe('5103');
    expect($tenant->nama_instansi)->toBe('Damkar Kabupaten Badung');
});

it('rejects a duplicate city_code or subdomain', function () {
    seedCity('5103', '51', 'KABUPATEN BADUNG');
    Tenant::create([
        'subdomain' => 'badung', 'city_code' => '5103', 'province_code' => '51',
        'nama_instansi' => 'Damkar Badung', 'is_active' => true,
    ]);

    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $this->actingAs($superadmin)->post(route('admin.tenants.store'), [
        'subdomain' => 'badung', 'province_code' => '51', 'city_code' => '5103',
        'nama_instansi' => 'Dobel', 'is_active' => true,
    ])->assertSessionHasErrors(['subdomain', 'city_code']);

    expect(Tenant::count())->toBe(1);
});

it('resolves a tenant from host subdomain and from a report city_code', function () {
    config(['services.tenant.base_domain' => 'sisupit.com']);
    Tenant::create([
        'subdomain' => 'badung', 'city_code' => '5103', 'province_code' => '51',
        'nama_instansi' => 'Damkar Badung', 'is_active' => true,
    ]);

    expect(Tenant::resolveFromHost('badung.sisupit.com')?->city_code)->toBe('5103');
    expect(Tenant::forCity('5103')?->subdomain)->toBe('badung');
    // Host apex / tak dikenal tidak me-resolve subdomain apa pun.
    expect(Tenant::resolveFromHost('sisupit.com'))->toBeNull();
    expect(Tenant::resolveFromHost('klungkung.sisupit.com'))->toBeNull();
});

it('parses subdomain from host correctly', function () {
    config(['services.tenant.base_domain' => 'sisupit.com']);

    expect(Tenant::subdomainFromHost('badung.sisupit.com'))->toBe('badung');
    expect(Tenant::subdomainFromHost('badung.sisupit.com:8000'))->toBe('badung');
    expect(Tenant::subdomainFromHost('sisupit.com'))->toBeNull();
    expect(Tenant::subdomainFromHost('www.sisupit.com'))->toBeNull();
    expect(Tenant::subdomainFromHost('127.0.0.1'))->toBeNull();
    expect(Tenant::subdomainFromHost(null))->toBeNull();
});

it('falls back to config when the tenants table is empty', function () {
    $default = Tenant::default();

    expect($default->city_code)->toBe('5171');
    expect($default->pejabat_nama)->toBe(config('pejabat.nama'));
    expect($default->telepon_darurat)->toBe(config('pejabat.telepon_darurat'));
});

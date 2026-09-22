<?php

use App\Models\Hydrant;
use App\Models\HydrantLog;
use App\Models\HydrantWarga;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Petugas boleh menambah & menyunting hydrant resmi, dan setiap tambah/sunting - oleh petugas
 * MAUPUN admin - meninggalkan jejak di hydrant_logs: siapa, kapan, kolom mana dari apa ke apa
 * (permintaan user 2026-09-22). Hapus & hydrant warga tetap milik admin.
 */
beforeEach(function () {
    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
    ]);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan'],
    ]);
    DB::table('indonesia_villages')->insert([
        ['code' => '5171012008', 'district_code' => '517101', 'name' => 'Pemogan'],
        ['code' => '5171012006', 'district_code' => '517101', 'name' => 'Sesetan'],
    ]);

    $this->petugas = User::factory()->create(['name' => 'Budi Petugas', 'province_code' => '51', 'city_code' => '5171']);
    $this->petugas->assignRole('petugas');
    $this->admin = User::factory()->create(['name' => 'Sari Admin', 'province_code' => '51', 'city_code' => '5171']);
    $this->admin->assignRole('admin');

    $this->payload = [
        'name' => 'Hydrant Jl. Uji',
        'address' => 'Jl. Uji No. 1',
        'status' => 'Aktif',
        'type' => 'Stick',
        'water_pressure' => null,
        'debit_lpm' => 500,
        'description' => null,
        'lat' => '-8.6900',
        'lng' => '115.2600',
        'village_code' => '5171012008',
    ];

    $this->hydrant = Hydrant::create([
        ...$this->payload,
        'province_code' => '51',
        'city_code' => '5171',
        'district_code' => '517101',
    ]);
});

it('lets petugas add a hydrant and records who added it', function () {
    $this->actingAs($this->petugas)->get('/admin/hydrants/create')->assertOk();

    $this->actingAs($this->petugas)
        ->post('/admin/hydrants', [...$this->payload, 'name' => 'Hydrant Baru'])
        ->assertRedirect(route('admin.hydrants.index'));

    $hydrant = Hydrant::where('name', 'Hydrant Baru')->firstOrFail();
    $log = HydrantLog::where('hydrant_id', $hydrant->id)->sole();

    expect($log->action)->toBe(HydrantLog::ACTION_CREATED)
        ->and($log->user_id)->toBe($this->petugas->id)
        ->and($log->user_name)->toBe('Budi Petugas')
        ->and($log->user_role)->toBe('petugas')
        ->and($log->changes)->toBeNull();
});

it('records only the fields petugas actually changed, with readable labels and names', function () {
    $this->actingAs($this->petugas)
        ->put("/admin/hydrants/{$this->hydrant->id}", [
            ...$this->payload,
            // Nilai sama dalam bentuk lain tidak boleh tercatat sebagai perubahan.
            'lat' => '-8.69',
            'debit_lpm' => '500',
            'status' => 'Perbaikan',
            'water_pressure' => 'Kecil',
            'village_code' => '5171012006',
        ])
        ->assertRedirect(route('admin.hydrants.index'));

    $log = HydrantLog::where('hydrant_id', $this->hydrant->id)->sole();
    $changes = collect($log->changes)->keyBy('field');

    expect($log->action)->toBe(HydrantLog::ACTION_UPDATED)
        ->and($log->user_role)->toBe('petugas')
        ->and($changes->keys()->sort()->values()->all())->toBe(['status', 'village_code', 'water_pressure'])
        ->and($changes['status'])->toMatchArray(['label' => 'Status', 'old' => 'Aktif', 'new' => 'Perbaikan'])
        ->and($changes['water_pressure'])->toMatchArray(['label' => 'Kondisi Air', 'old' => null, 'new' => 'Kecil'])
        // Kode wilayah bukan identitas tempat (#78): riwayat menyimpan NAMA desa.
        ->and($changes['village_code'])->toMatchArray(['label' => 'Desa/Kelurahan', 'old' => 'Pemogan', 'new' => 'Sesetan']);
});

it('merges a moved pin into one location entry', function () {
    $this->actingAs($this->admin)
        ->put("/admin/hydrants/{$this->hydrant->id}", [...$this->payload, 'lng' => '115.2700'])
        ->assertRedirect();

    $changes = HydrantLog::where('hydrant_id', $this->hydrant->id)->sole()->changes;

    expect($changes)->toHaveCount(1)
        ->and($changes[0])->toMatchArray(['field' => 'location', 'label' => 'Titik Lokasi'])
        // Format angka ikut mesin database (SQLite -8.69, MySQL -8.6900000), jadi yang dijaga
        // hanya bahwa bujur baru yang tercatat.
        ->and($changes[0]['new'])->toEndWith('115.2700');
});

it('writes no log when a save changes nothing', function () {
    $this->actingAs($this->petugas)
        ->put("/admin/hydrants/{$this->hydrant->id}", $this->payload)
        ->assertRedirect();

    expect(HydrantLog::count())->toBe(0);
});

it('logs admin edits the same way', function () {
    $this->actingAs($this->admin)
        ->put("/admin/hydrants/{$this->hydrant->id}", [...$this->payload, 'name' => 'Nama Baru'])
        ->assertRedirect();

    $log = HydrantLog::where('hydrant_id', $this->hydrant->id)->sole();

    expect($log->user_name)->toBe('Sari Admin')
        ->and($log->user_role)->toBe('admin')
        ->and($log->changes[0])->toMatchArray(['label' => 'Nama Hydrant', 'old' => 'Hydrant Jl. Uji', 'new' => 'Nama Baru']);
});

it('keeps the editor name after the account is deleted', function () {
    $this->actingAs($this->petugas)
        ->put("/admin/hydrants/{$this->hydrant->id}", [...$this->payload, 'name' => 'Nama Baru']);

    $this->petugas->delete();
    $log = HydrantLog::where('hydrant_id', $this->hydrant->id)->sole();

    expect($log->user_id)->toBeNull()
        ->and($log->user_name)->toBe('Budi Petugas');
});

it('does not let petugas delete hydrants or open hydrant warga', function () {
    $this->actingAs($this->petugas)
        ->delete("/admin/hydrants/{$this->hydrant->id}")
        ->assertForbidden();

    expect(Hydrant::whereKey($this->hydrant->id)->exists())->toBeTrue();

    $this->actingAs($this->petugas)->get('/admin/hydrant-warga')->assertForbidden();
    $this->actingAs($this->petugas)->get('/admin/hydrant-warga/create')->assertForbidden();

    $this->actingAs($this->admin)
        ->delete("/admin/hydrants/{$this->hydrant->id}")
        ->assertRedirect();

    expect(Hydrant::whereKey($this->hydrant->id)->exists())->toBeFalse();
});

it('keeps petugas out of hydrants in another city', function () {
    $badung = Hydrant::create([...$this->payload, 'province_code' => '51', 'city_code' => '5103', 'village_code' => null]);

    $this->actingAs($this->petugas)->get("/admin/hydrants/{$badung->id}/edit")->assertNotFound();
    $this->actingAs($this->petugas)
        ->put("/admin/hydrants/{$badung->id}", [...$this->payload, 'village_code' => null, 'name' => 'Diubah'])
        ->assertNotFound();

    expect($badung->fresh()->name)->toBe('Hydrant Jl. Uji')
        ->and(HydrantLog::count())->toBe(0);
});

it('does not let other roles reach the hydrant admin pages', function (string $role) {
    // Profil lengkap, supaya yang menolak benar-benar gerbang peran - bukan pengalihan ke
    // Lengkapi Profil (302) yang akan meloloskan test ini karena alasan yang keliru.
    $user = User::factory()->create([
        'province_code' => '51', 'city_code' => '5171', 'district_code' => '517101',
        'village_code' => '5171012008', 'phone' => '081234567890',
    ]);
    $user->assignRole($role);

    $this->actingAs($user)->get('/admin/hydrants')->assertForbidden();
    $this->actingAs($user)->post('/admin/hydrants', $this->payload)->assertForbidden();
})->with(['relawan', 'pejabat', 'warga']);

it('sends petugas the abilities and the last editor to the list page', function () {
    HydrantWarga::create([
        'name' => 'Tandon Uji', 'address' => 'Jl. Uji', 'status' => 'Belum Modifikasi', 'type' => 'Tandon',
        'capacity_liter' => 5000, 'lat' => '-8.69', 'lng' => '115.26', 'province_code' => '51', 'city_code' => '5171',
    ]);
    $this->actingAs($this->petugas)
        ->put("/admin/hydrants/{$this->hydrant->id}", [...$this->payload, 'name' => 'Nama Baru']);

    $this->actingAs($this->petugas)->get('/admin/hydrants')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can', ['delete' => false, 'warga' => false])
            ->missing('counts.warga')
            ->where('hydrants.data.0.latest_log.user_name', 'Budi Petugas')
            ->where('hydrants.data.0.latest_log.user_role', 'petugas')
        );

    $this->actingAs($this->admin)->get('/admin/hydrants')
        ->assertInertia(fn (Assert $page) => $page
            ->where('can', ['delete' => true, 'warga' => true])
            ->where('counts.warga', 1)
        );

    $this->actingAs($this->petugas)->get("/admin/hydrants/{$this->hydrant->id}/edit")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('logs', 1)
            ->where('logs.0.changes.0.label', 'Nama Hydrant')
        );
});

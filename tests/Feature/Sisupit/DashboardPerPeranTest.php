<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * TASK_71 / FINDINGS #168-#173, #175-#176 - perbaikan dashboard per peran.
 * Semua kegagalan yang dijaga di sini senyap di test PHP biasa (rupa & logika JSX), jadi
 * sumbernya dipindai seperti NavigasiInstanTest. Komentar dibuang lebih dulu (pelajaran #108).
 */
function dashSource(string $path): string
{
    $src = file_get_contents(base_path($path));

    return preg_replace(['#\{/\*.*?\*/\}#s', '#/\*.*?\*/#s', '#^\s*//.*$#m'], '', $src);
}

it('greets every dashboard with the shared first-name rule, not split()[0] (#168)', function () {
    $helper = dashSource('resources/js/lib/first-name.js');
    expect($helper)->toContain('word.length >= 3');

    foreach (['resources/js/Pages/Petugas/Dashboard.jsx', 'resources/js/Pages/Dashboard.jsx'] as $page) {
        $src = dashSource($page);
        expect($src)->toContain("from '@/lib/first-name'")
            ->and($src)->not->toMatch("/split\\(' '\\)\\[0\\]/");
    }
});

it('ties the relawan badge to is_standby (#169)', function () {
    $src = dashSource('resources/js/Pages/Dashboard.jsx');

    expect($src)->toContain("isStandby ? 'Relawan Siaga' : 'Relawan - Tidak Siaga'");
});

it('shows location and status to OPD on phones (#170)', function () {
    $src = dashSource('resources/js/Pages/Opd/Dashboard.jsx');

    expect($src)->toContain('<StatusBadge status={item.status} />')
        ->and($src)->toContain('{item.location}')
        // Lokasi tak lagi disembunyikan di bawah `md`.
        ->and($src)->not->toMatch('/hidden[^"]*md:flex[^>]*>\s*<IconMapPin/');
});

it('keeps TERLAPOR out of the red petugas banner (#171)', function () {
    $src = dashSource('resources/js/Pages/Petugas/Dashboard.jsx');

    // TASK_72: banner "Ada N Insiden Aktif!" diganti seksi Butuh Unit / Sedang Ditangani - aturannya tetap:
    // TERLAPOR hanya dihitung di baris "menunggu verifikasi admin", tak pernah jadi misi yang bisa ditindak.
    expect($src)->toContain("const awaitingCount = missions.filter((m) => m.status === 'TERLAPOR').length;")
        ->and($src)->toContain("missions.filter((m) => m.status !== 'TERLAPOR' && !myIds.has(m.id))")
        ->and($src)->not->toContain('Ada {activeMissions.length} Insiden Aktif!');
});

it('does not declare components inside the citizen dashboard render (#172)', function () {
    $src = dashSource('resources/js/Pages/Dashboard.jsx');

    expect($src)->not->toMatch('/const Render[A-Z]\w* = \(\) =>/')
        ->and($src)->not->toMatch('/<Render[A-Z]\w* \/>/');
});

it('reads the real Reverb state instead of a hardcoded "Sistem Online" (#173)', function () {
    $hook = dashSource('resources/js/hooks/use-realtime-status.js');
    $admin = dashSource('resources/js/Pages/Admin/Dashboard.jsx');

    expect($hook)->toContain('window.Echo?.connector?.pusher?.connection')
        ->and($hook)->toContain("connection.bind('state_change', onChange)")
        ->and($hook)->toContain("connection.unbind('state_change', onChange)")
        ->and($admin)->toContain('useRealtimeStatus()')
        ->and($admin)->not->toMatch('/Sistem\s+Online/');
});

// ---------------------------------------------------------------------------
// Lanjutan TASK_71: peta petugas (butir 6) & kosmetik admin/warga (butir 8-14)
// ---------------------------------------------------------------------------

it('centers the petugas tactical map on the narrowest region from laravolt meta (#175)', function () {
    DB::table('indonesia_provinces')->insert([['code' => '52', 'name' => 'NTB']]);
    DB::table('indonesia_cities')->insert([[
        'code' => '5202', 'province_code' => '52', 'name' => 'Lombok Tengah',
        'meta' => json_encode(['lat' => -8.70, 'long' => 116.27]),
    ]]);
    DB::table('indonesia_districts')->insert([[
        'code' => '520201', 'city_code' => '5202', 'name' => 'Praya',
        'meta' => json_encode(['lat' => -8.71, 'long' => 116.29]),
    ]]);

    $kecamatan = User::factory()->create(['city_code' => '5202', 'district_code' => '520201']);
    $kecamatan->assignRole('petugas');
    $this->actingAs($kecamatan)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->component('Petugas/Dashboard')
            ->where('tenant_location', ['lat' => -8.71, 'lng' => 116.29]));

    $kabupaten = User::factory()->create(['city_code' => '5202']);
    $kabupaten->assignRole('petugas');
    $this->actingAs($kabupaten)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('tenant_location', ['lat' => -8.7, 'lng' => 116.27]));

    // Tanpa kode wilayah -> cadangan Denpasar, bukan galat.
    $tanpa = User::factory()->create();
    $tanpa->assignRole('petugas');
    $this->actingAs($tanpa)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('tenant_location', ['lat' => -8.65, 'lng' => 115.22]));
});

it('lets petugas pan the tactical map on phones and shows status colors and own position (#175)', function () {
    $src = dashSource('resources/js/Pages/Petugas/Dashboard.jsx');

    expect($src)->not->toContain('dragging: !window.L.Browser.mobile')
        ->and($src)->not->toContain('.setView([-8.65, 115.216667]')
        ->and($src)->toContain('tenant_location?.lat')
        ->and($src)->toContain('MISSION_PIN_COLOR[mission.status]')
        ->and($src)->toContain('Posisi Anda')
        ->and($src)->toContain('km garis lurus')
        ->and($src)->not->toContain('⚠️');
});

// Kartu statistik lama pindah bersama dashboard pejabat (TASK_72); admin punya Pusat Komando baru.
// #176 menuntut angka yang jujur. Sejak TASK_72 fase 5 kartu lama ("Total Selesai") diganti kinerja per
// periode; kejujurannya tetap dijaga: tiap angka berlabel periode/sumbernya, tak ada "bulan ini" yang
// sebenarnya sepanjang waktu, dan kerugian (teks bebas) tak pernah dijumlahkan.
it('keeps the official dashboard numbers honest and readable (#176)', function () {
    $src = dashSource('resources/js/Pages/Pejabat/Dashboard.jsx');

    expect($src)->not->toContain('Selesai Bulan Ini')
        ->and($src)->toContain('title={`Kinerja - ${periodLabel}`}')
        ->and($src)->toContain('note="Dari Laporan Kejadian final"')
        ->and($src)->not->toMatch('/kerugian/i')
        ->and($src)->not->toContain('Distribusi Kendaraan')
        ->and($src)->toContain('<AppLayout children={page} title="Dashboard Eksekutif" />');
});

it('shows each citizen report once and speaks plainly when empty (#176)', function () {
    $src = dashSource('resources/js/Pages/Dashboard.jsx');

    expect($src)->toContain('myReports.filter((r) => !activeReportIds.has(r.id))')
        ->and($src)->toContain('historyReports.map(')
        ->and($src)->not->toContain('Lokasi Terdeteksi')
        ->and($src)->not->toContain('Data Kosong');
});

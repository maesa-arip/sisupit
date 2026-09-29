<?php

use App\Models\Report;
use App\Models\ReportResolution;
use App\Models\ReportResolutionLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * TASK_67 (permintaan user 2026-09-29): "Laporan Kejadian sementara cuma ada 1 dan bisa di
 * edit petugas lain, cuma catat apa apa yang berubah". Keputusan user: SATU entri sementara
 * (petugas) + SATU entri final (admin), terpisah. Dulu append-only: tiap simpan = entri baru.
 */
beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');

    $reporter = User::factory()->create();
    $reporter->assignRole('warga');

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah bedeng',
        'address' => 'Jl. Trengguli No. 50',
        'lat' => '-8.6300',
        'lng' => '115.2600',
        'status' => 'resolved',
        'village_code' => '5171012006',
    ]);

    $this->staff = function (string $role, string $name) {
        $user = User::factory()->create(['name' => $name, 'village_code' => '5171012006']);
        $user->assignRole($role);

        return $user;
    };
    $this->save = fn (User $user, array $data) => $this->actingAs($user)
        ->post("/reports/{$this->report->id}/resolution", $data);
    $this->entries = fn (string $status) => ReportResolution::where('report_id', $this->report->id)->where('status', $status)->get();
});

it('lets another petugas edit the one sementara entry instead of adding a second one', function () {
    $made = ($this->staff)('petugas', 'Made Petugas');
    $ketut = ($this->staff)('petugas', 'Ketut Petugas');

    ($this->save)($made, ['status' => 'sementara', 'jenis_kejadian' => 'kebakaran dapur', 'kerugian' => '±1jt'])->assertRedirect();
    ($this->save)($ketut, ['status' => 'sementara', 'jenis_kejadian' => 'kebakaran dapur', 'kerugian' => '±3jt'])->assertRedirect();

    $rows = ($this->entries)('sementara');
    expect($rows)->toHaveCount(1)
        ->and($rows[0]->kerugian)->toBe('±3jt')
        // Pembuatnya tetap orang pertama; penyuntingnya ada di riwayat.
        ->and($rows[0]->created_by)->toBe($made->id);

    $logs = ReportResolutionLog::where('report_resolution_id', $rows[0]->id)->orderBy('id')->get();
    expect($logs->pluck('action')->all())->toBe(['dibuat', 'diubah'])
        ->and($logs[1]->user_name)->toBe('Ketut Petugas')
        ->and($logs[1]->user_role)->toBe('petugas')
        ->and($logs[1]->changes)->toBe([
            ['field' => 'kerugian', 'label' => 'Estimasi Kerugian', 'old' => '±1jt', 'new' => '±3jt'],
        ]);
});

it('writes no history row when a save changes nothing', function () {
    $made = ($this->staff)('petugas', 'Made Petugas');
    $data = ['status' => 'sementara', 'jenis_kejadian' => 'kebakaran dapur', 'occurred_at' => '2026-09-10T07:15'];

    ($this->save)($made, $data);
    ($this->save)($made, $data);

    expect(ReportResolutionLog::where('action', 'diubah')->count())->toBe(0);
});

it('keeps the final entry for admins only - fill, edit and delete', function () {
    $petugas = ($this->staff)('petugas', 'Made Petugas');
    $admin = ($this->staff)('admin', 'Admin Kota');

    $this->actingAs($petugas)->get("/reports/{$this->report->id}/resolution/create?status=final")->assertForbidden();
    ($this->save)($petugas, ['status' => 'final', 'jenis_kejadian' => 'x'])->assertForbidden();

    ($this->save)($admin, ['status' => 'final', 'jenis_kejadian' => 'data valid'])->assertRedirect();
    ($this->save)($admin, ['status' => 'final', 'jenis_kejadian' => 'data valid, dikoreksi'])->assertRedirect();
    $final = ($this->entries)('final');
    expect($final)->toHaveCount(1)->and($final[0]->jenis_kejadian)->toBe('data valid, dikoreksi');

    // Petugas tak bisa menghapus entri final beserta riwayatnya.
    $this->actingAs($petugas)->delete("/reports/{$this->report->id}/resolution/{$final[0]->id}")->assertForbidden();
    expect(($this->entries)('final'))->toHaveCount(1);

    // Entri sementara tetap boleh dihapus petugas (salah input).
    ($this->save)($petugas, ['status' => 'sementara', 'jenis_kejadian' => 'awal']);
    $sementara = ($this->entries)('sementara')->first();
    $this->actingAs($petugas)->delete("/reports/{$this->report->id}/resolution/{$sementara->id}")->assertRedirect();
    expect(($this->entries)('sementara'))->toHaveCount(0);
});

it('edits victims in place, keeps their KTP, and records KTP and victim changes', function () {
    $made = ($this->staff)('petugas', 'Made Petugas');
    ($this->save)($made, ['status' => 'sementara', 'victims' => [
        ['nama' => 'A.A Ngurah', 'kondisi' => 'luka ringan', 'ktp' => UploadedFile::fake()->image('ktp.jpg')],
        ['nama' => 'Wayan', 'ktp' => UploadedFile::fake()->image('ktp2.jpg')],
    ]]);
    $entry = ($this->entries)('sementara')->first()->load('victims');
    [$ngurah, $wayan] = [$entry->victims[0], $entry->victims[1]];

    // Ngurah diubah kondisinya (KTP tak dikirim ulang = tetap), Wayan dibuang dari daftar.
    ($this->save)($made, ['status' => 'sementara', 'victims' => [
        ['id' => $ngurah->id, 'nama' => 'A.A Ngurah', 'kondisi' => 'dirujuk ke RSUD'],
    ]])->assertSessionHasNoErrors();

    $entry->refresh()->load('victims');
    expect($entry->victims)->toHaveCount(1)
        ->and($entry->victims[0]->id)->toBe($ngurah->id)
        ->and($entry->victims[0]->ktp_path)->toBe($ngurah->ktp_path);
    Storage::disk('local')->assertExists($ngurah->ktp_path);
    Storage::disk('local')->assertMissing($wayan->ktp_path);

    // Ganti KTP Ngurah - dicatat walau jumlah korban tak berubah.
    ($this->save)($made, ['status' => 'sementara', 'victims' => [
        ['id' => $ngurah->id, 'nama' => 'A.A Ngurah', 'kondisi' => 'dirujuk ke RSUD', 'ktp' => UploadedFile::fake()->image('baru.jpg')],
    ]]);
    Storage::disk('local')->assertMissing($ngurah->ktp_path);

    $changes = ReportResolutionLog::where('action', 'diubah')->orderBy('id')->get()->pluck('changes');
    expect(collect($changes[0])->firstWhere('field', 'korban')['new'])->toBe('A.A Ngurah (dirujuk ke RSUD) [KTP]')
        ->and(collect($changes[1])->firstWhere('field', 'ktp')['new'])->toBe('A.A Ngurah (diganti)');
});

it('copies victims, KTP and photos into a new final entry without sharing files', function () {
    $petugas = ($this->staff)('petugas', 'Made Petugas');
    $admin = ($this->staff)('admin', 'Admin Kota');

    ($this->save)($petugas, ['status' => 'sementara',
        'victims' => [['nama' => 'A.A Ngurah', 'ktp' => UploadedFile::fake()->image('ktp.jpg')]],
        'photos' => [UploadedFile::fake()->image('tkp.jpg')],
    ]);
    $sementara = ($this->entries)('sementara')->first()->load(['victims', 'photos']);

    // Form final di-prefill dari entri sementara.
    $this->actingAs($admin)->get("/reports/{$this->report->id}/resolution/create?status=final")
        ->assertInertia(fn ($page) => $page
            ->where('target', 'final')
            ->where('isEdit', false)
            ->where('prefill.victims.0.id', $sementara->victims[0]->id)
            ->where('prefill.photos.0.id', $sementara->photos[0]->id));

    ($this->save)($admin, ['status' => 'final',
        'victims' => [['id' => $sementara->victims[0]->id, 'nama' => 'A.A Ngurah']],
        'keep_photo_ids' => [$sementara->photos[0]->id],
    ])->assertSessionHasNoErrors();

    $final = ($this->entries)('final')->first()->load(['victims', 'photos']);
    expect($final->victims[0]->ktp_path)->not->toBeNull()->not->toBe($sementara->victims[0]->ktp_path)
        ->and($final->photos[0]->path)->not->toBe($sementara->photos[0]->path);

    // Menghapus entri sementara tak boleh menghapus berkas milik entri final.
    $this->actingAs($petugas)->delete("/reports/{$this->report->id}/resolution/{$sementara->id}");
    Storage::disk('local')->assertExists($final->victims[0]->ktp_path);
    Storage::disk('public')->assertExists($final->photos[0]->path);
    // Entri sementara di sisi lain utuh sebelum dihapus: foto sumbernya tidak ikut pindah.
    Storage::disk('public')->assertMissing($sementara->photos[0]->path);
});

it('drops photos no longer kept and counts saved plus new photos against the limit of 8', function () {
    $made = ($this->staff)('petugas', 'Made Petugas');
    ($this->save)($made, ['status' => 'sementara', 'photos' => [
        UploadedFile::fake()->image('a.jpg'), UploadedFile::fake()->image('b.jpg'),
    ]]);
    $entry = ($this->entries)('sementara')->first()->load('photos');
    [$keep, $drop] = [$entry->photos[0], $entry->photos[1]];

    ($this->save)($made, ['status' => 'sementara', 'keep_photo_ids' => [$keep->id]])->assertSessionHasNoErrors();
    Storage::disk('public')->assertExists($keep->path);
    Storage::disk('public')->assertMissing($drop->path);
    expect(collect(ReportResolutionLog::where('action', 'diubah')->latest('id')->first()->changes)->firstWhere('field', 'foto')['new'])
        ->toBe('1 dihapus');

    $eight = array_map(fn ($i) => UploadedFile::fake()->image("n{$i}.jpg"), range(1, 8));
    ($this->save)($made, ['status' => 'sementara', 'keep_photo_ids' => [$keep->id], 'photos' => $eight])
        ->assertSessionHasErrors('photos');
    expect($entry->photos()->count())->toBe(1);
});

it('treats the newest of old duplicate entries as the active one and the rest as archive', function () {
    $made = ($this->staff)('petugas', 'Made Petugas');
    $admin = ($this->staff)('admin', 'Admin Kota');
    // Entri ganda sisa masa append-only.
    $old = ReportResolution::create(['report_id' => $this->report->id, 'created_by' => $made->id, 'status' => 'sementara', 'jenis_kejadian' => 'lama']);
    $newest = ReportResolution::create(['report_id' => $this->report->id, 'created_by' => $made->id, 'status' => 'sementara', 'jenis_kejadian' => 'terbaru']);

    ($this->save)($made, ['status' => 'sementara', 'jenis_kejadian' => 'terbaru, dilengkapi']);

    expect($newest->fresh()->jenis_kejadian)->toBe('terbaru, dilengkapi')
        ->and($old->fresh()->jenis_kejadian)->toBe('lama');

    $this->actingAs($admin)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page
            ->where('canFinalizeResolution', true)
            ->where('resolutions.0.id', $newest->id)
            ->where('resolutions.0.is_active', true)
            ->where('resolutions.0.logs.0.action', 'diubah')
            ->where('resolutions.1.id', $old->id)
            ->where('resolutions.1.is_active', false));

    $this->actingAs($made)->get(route('reports.show', $this->report))
        ->assertInertia(fn ($page) => $page->where('canFinalizeResolution', false));
});

it('reads the final-entry permission from the server prop, not from roles in the page', function () {
    $show = preg_replace(['~\{/\*.*?\*/\}~s', '~/\*.*?\*/~s', '~^\s*//.*$~m'], '', file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx')));
    $form = file_get_contents(resource_path('js/Pages/Front/Reports/Resolution/Create.jsx'));

    expect($show)->toContain('props.canFinalizeResolution')
        ->and($show)->toMatch("~route\('reports\.resolution\.create', \{\s*report: report\.id,\s*status,?\s*\}\)~");
    // Satu tombol simpan per form - bukan lagi "Sementara" & "Final" berdampingan.
    expect(substr_count($form, 'onClick={submit}'))->toBe(1)
        ->and($form)->not->toContain('submitWith(')
        ->and($form)->toContain('keep_photo_ids');
});

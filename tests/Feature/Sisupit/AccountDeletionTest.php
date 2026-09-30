<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Hapus akun oleh pemiliknya - syarat Google Play (#157).
 *
 * Yang dijaga: (a) warga yang pernah melapor BISA menghapus akun (DELETE baris ditolak FK
 * reports.user_id, jadi dulu berakhir galat); (b) arsip insiden tetap utuh, termasuk jejak
 * petugas di report_officers yang cascade; (c) akun Google tanpa password tetap punya jalan
 * (ketik HAPUS); (d) identitas benar-benar hilang & akunnya tak bisa dipakai masuk lagi;
 * (e) formnya benar-benar dipasang di halaman Profil - dulu komponennya ada tapi yatim.
 */
function laporanMilik(User $user): Report
{
    return Report::withoutGlobalScopes()->create([
        'user_id' => $user->id,
        'name' => 'Pelapor Uji',
        'phone' => '08123456789',
        'title' => 'Kebakaran rumah warga',
        'incident_type' => 'rumah',
        'description' => 'Api dari dapur.',
        'address' => 'Jl. Uji Coba',
        'lat' => '-8.7137',
        'lng' => '115.1968',
        'status' => 'resolved',
    ]);
}

it('anonymizes a reporter while keeping their incident report', function () {
    $user = User::factory()->create(['phone' => '0811111111', 'address' => 'Jl. Rumah']);
    $user->assignRole('warga');
    $report = laporanMilik($user);
    $email = $user->email;

    $this->actingAs($user)
        ->delete('/profile', ['password' => 'password'])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();

    $fresh = $user->fresh();
    expect($fresh)->not->toBeNull()
        ->and($fresh->name)->toBe('Akun Dihapus')
        ->and($fresh->email)->toBeNull()
        ->and($fresh->phone)->toBeNull()
        ->and($fresh->address)->toBeNull()
        ->and($fresh->password)->toBeNull()
        ->and($fresh->getRoleNames()->all())->toBe([]);

    expect(Report::withoutGlobalScopes()->find($report->id)?->user_id)->toBe($user->id);

    // Tak bisa dipakai masuk lagi lewat email lamanya.
    $this->post('/login', ['email' => $email, 'password' => 'password']);
    $this->assertGuest();
});

it('keeps the officer trail of an incident when a petugas deletes their account', function () {
    $pelapor = User::factory()->create();
    $report = laporanMilik($pelapor);

    $petugas = User::factory()->create();
    $petugas->assignRole('petugas');
    DB::table('report_officers')->insert([
        'report_id' => $report->id,
        'user_id' => $petugas->id,
        'status' => 'finished',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('fcm_tokens')->insert([
        'user_id' => $petugas->id,
        'token' => 'token-uji',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($petugas)
        ->delete('/profile', ['password' => 'password'])
        ->assertSessionHasNoErrors();

    expect(DB::table('report_officers')->where('user_id', $petugas->id)->count())->toBe(1)
        ->and(DB::table('fcm_tokens')->where('user_id', $petugas->id)->count())->toBe(0);
});

it('lets a password-less Google account confirm by typing HAPUS', function () {
    $user = User::factory()->create(['password' => null]);
    DB::table('social_accounts')->insert([
        'user_id' => $user->id,
        'provider_id' => 'google-123',
        'provider_name' => 'google',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($user)->from('/profile')
        ->delete('/profile', ['confirmation' => 'hapus'])
        ->assertSessionHasErrors('confirmation');
    expect($user->fresh()->name)->not->toBe('Akun Dihapus');

    $this->actingAs($user)
        ->delete('/profile', ['confirmation' => 'HAPUS'])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect($user->fresh()->name)->toBe('Akun Dihapus')
        ->and(DB::table('social_accounts')->where('user_id', $user->id)->count())->toBe(0);
});

it('tells the profile screen which confirmation to ask for', function () {
    $user = User::factory()->create(['password' => Hash::make('rahasia')]);
    $google = User::factory()->create(['password' => null]);

    $this->actingAs($user)->get('/profile')
        ->assertInertia(fn ($page) => $page->where('hasPassword', true));
    $this->actingAs($google)->get('/profile')
        ->assertInertia(fn ($page) => $page->where('hasPassword', false));
});

it('mounts the delete-account card on the profile page under a stable anchor', function () {
    $jsx = file_get_contents(resource_path('js/Pages/Profile/Edit.jsx'));
    $code = preg_replace('#/\*.*?\*/|//[^\n]*#s', '', $jsx);

    expect($code)->toMatch('/<DeleteUserForm\b/')
        ->and($code)->toMatch('/id="hapus-akun"/');
});

<?php

use App\Models\User;
use App\Models\UserInvitation;
use App\Notifications\PetugasInvitationNotification;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Undang Petugas lewat email (permintaan user 2026-11-06). Petugas yang mendaftar sendiri
 * terisi wilayah tempat ia mendaftar (Bangli/Badung) lalu wilayah tugasnya ikut itu. Undangan
 * membawa wilayah TUGAS dari admin.
 *
 * ATURAN yang dijaga:
 *  - admin mengirim undangan ber-wilayah di dalam wilayahnya, token disimpan sebagai hash;
 *  - tamu membuat akun dari tautan -> langsung petugas, terverifikasi, wilayah dari undangan;
 *  - akun warga beremail sama yang sedang masuk diangkat jadi petugas, wilayahnya DIGANTI;
 *  - akun lain / peran terpusat lain / tautan bekas & kedaluwarsa ditolak;
 *  - admin wilayah lain tak bisa melihat atau membatalkan undangan itu.
 */
beforeEach(function () {
    Notification::fake();

    DB::table('indonesia_provinces')->insert(['code' => '51', 'name' => 'Bali']);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5106', 'province_code' => '51', 'name' => 'Kabupaten Bangli'],
    ]);
    DB::table('indonesia_districts')->insert([
        ['code' => '517101', 'city_code' => '5171', 'name' => 'Denpasar Selatan'],
        ['code' => '510601', 'city_code' => '5106', 'name' => 'Susut'],
    ]);
    DB::table('indonesia_villages')->insert([
        ['code' => '5171012006', 'district_code' => '517101', 'name' => 'Pemogan'],
        ['code' => '5106012001', 'district_code' => '510601', 'name' => 'Abuan'],
    ]);

    $this->admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $this->admin->assignRole('admin');
});

function sendInvite($test, array $payload = []): string
{
    $test->actingAs($test->admin)
        ->post(route('admin.users.invitations.store'), array_merge([
            'email' => 'calon@contoh.com',
            'level' => 'kabupaten',
        ], $payload))
        ->assertSessionHasNoErrors();

    $url = null;
    Notification::assertSentTo(
        new AnonymousNotifiable,
        PetugasInvitationNotification::class,
        function ($notification, $channels, $notifiable) use (&$url) {
            $url = $notification->url;

            return $notifiable->routes['mail'] === 'calon@contoh.com';
        },
    );

    return basename(parse_url($url, PHP_URL_PATH));
}

it('emails an invitation for the admin region and stores only the token hash', function () {
    $token = sendInvite($this);

    $row = UserInvitation::sole();
    expect($row->email)->toBe('calon@contoh.com')
        ->and($row->city_code)->toBe('5171')
        ->and($row->district_code)->toBeNull()
        ->and($row->token_hash)->toBe(hash('sha256', $token))
        ->and($row->token_hash)->not->toBe($token);

    $this->actingAs($this->admin)->get(route('admin.users.invitations'))
        ->assertInertia(fn ($page) => $page->component('Admin/Users/Invite')
            ->where('invitations.0.email', 'calon@contoh.com')
            ->where('invitations.0.status', 'menunggu'));
});

it('lets a guest create a petugas account from the link, with the invited work area', function () {
    $token = sendInvite($this);
    auth()->logout();

    $this->get(route('invitations.show', $token))
        ->assertInertia(fn ($page) => $page->component('Auth/Invitation')->where('valid', true)->where('mode', 'guest'));

    $this->post(route('invitations.accept', $token), [
        'name' => 'Komang Calon',
        'password' => 'password-kuat-123',
        'password_confirmation' => 'password-kuat-123',
        'terms' => true,
    ])->assertSessionHasNoErrors()->assertRedirect(route('dashboard'));

    $user = User::where('email', 'calon@contoh.com')->sole();
    expect($user->hasRole('petugas'))->toBeTrue()
        ->and($user->city_code)->toBe('5171')
        ->and($user->village_code)->toBeNull()
        ->and($user->email_verified_at)->not->toBeNull();
    $this->assertAuthenticatedAs($user);

    // Petugas langsung lolos ke dashboard - tanpa layar Lengkapi Profil (& deteksi GPS-nya).
    $this->get('/dashboard')->assertOk();

    // Tautan sekali pakai.
    expect(UserInvitation::sole()->accepted_user_id)->toBe($user->id);
    auth()->logout();
    $this->get(route('invitations.show', $token))->assertInertia(fn ($page) => $page->where('valid', false));
});

it('promotes a logged-in warga with the same email and replaces the domicile area with the work area', function () {
    $warga = User::factory()->create([
        'email' => 'calon@contoh.com',
        'province_code' => '51', 'city_code' => '5106', 'district_code' => '510601', 'village_code' => '5106012001',
    ]);
    $warga->assignRole('warga');
    $token = sendInvite($this);

    $this->actingAs($warga)->get(route('invitations.show', $token))
        ->assertInertia(fn ($page) => $page->where('mode', 'same'));
    $this->actingAs($warga)->post(route('invitations.accept', $token))->assertRedirect(route('dashboard'));

    $warga->refresh();
    expect($warga->hasRole('petugas'))->toBeTrue()
        ->and($warga->hasRole('warga'))->toBeFalse()
        ->and($warga->city_code)->toBe('5171')
        ->and($warga->district_code)->toBeNull()
        ->and($warga->village_code)->toBeNull();
});

it('refuses another account, a used link, and an expired link', function () {
    $token = sendInvite($this);

    $other = User::factory()->create(['email' => 'lain@contoh.com', 'village_code' => '5171012006', 'city_code' => '5171', 'province_code' => '51']);
    $other->assignRole('warga');
    $this->actingAs($other)->post(route('invitations.accept', $token))->assertSessionHasErrors('email');
    expect($other->fresh()->hasRole('petugas'))->toBeFalse();

    UserInvitation::query()->update(['expires_at' => now()->subMinute()]);
    auth()->logout();
    $this->post(route('invitations.accept', $token), [
        'name' => 'X', 'password' => 'password-kuat-123', 'password_confirmation' => 'password-kuat-123', 'terms' => true,
    ])->assertRedirect(route('invitations.show', $token));
    expect(User::where('email', 'calon@contoh.com')->exists())->toBeFalse();
});

it('never downgrades a centrally managed account and never re-invites a petugas', function () {
    $pejabat = User::factory()->create(['email' => 'pejabat@contoh.com', 'city_code' => '5171', 'province_code' => '51']);
    $pejabat->assignRole('pejabat');
    $petugas = User::factory()->create(['email' => 'petugas@contoh.com', 'city_code' => '5171', 'province_code' => '51']);
    $petugas->assignRole('petugas');

    foreach (['pejabat@contoh.com', 'petugas@contoh.com'] as $email) {
        $this->actingAs($this->admin)
            ->post(route('admin.users.invitations.store'), ['email' => $email, 'level' => 'kabupaten'])
            ->assertSessionHasErrors('email');
    }
    expect(UserInvitation::count())->toBe(0);
});

it('keeps the work area inside the admin region and its own invitations', function () {
    // Kode kabupaten lain dikirim TANGAN - kunci wilayah admin yang berlaku.
    sendInvite($this, ['city_code' => '5106']);
    expect(UserInvitation::sole()->city_code)->toBe('5171');

    $bangli = User::factory()->create(['province_code' => '51', 'city_code' => '5106']);
    $bangli->assignRole('admin');
    $id = UserInvitation::sole()->id;

    $this->actingAs($bangli)->get(route('admin.users.invitations'))
        ->assertInertia(fn ($page) => $page->where('invitations', []));
    $this->actingAs($bangli)->delete(route('admin.users.invitations.destroy', $id))->assertNotFound();
    expect(UserInvitation::whereKey($id)->exists())->toBeTrue();

    $this->actingAs($this->admin)->delete(route('admin.users.invitations.destroy', $id))->assertRedirect();
    expect(UserInvitation::whereKey($id)->exists())->toBeFalse();
});

it('is closed to non-admins', function () {
    $petugas = User::factory()->create(['city_code' => '5171', 'province_code' => '51']);
    $petugas->assignRole('petugas');

    $this->actingAs($petugas)->get(route('admin.users.invitations'))->assertForbidden();
    $this->actingAs($petugas)
        ->post(route('admin.users.invitations.store'), ['email' => 'x@contoh.com', 'level' => 'kabupaten'])
        ->assertForbidden();
});

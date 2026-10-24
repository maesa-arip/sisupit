<?php

use App\Http\Controllers\Auth\PasswordController;
use App\Models\User;
use App\Notifications\PasswordCreatedNotification;
use App\Notifications\PasswordSetupCodeNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

// TASK_82: akun Google/Apple (password NULL) membuat kata sandi pertama lewat kode 6 angka di
// email. Kode di cache sebagai hash, 10 menit, 5 tebakan, kirim 1x/menit & 5x/jam.

function socialUser(array $attributes = []): User
{
    return User::factory()->create(array_merge(['password' => null], $attributes));
}

function requestSetupCode(User $user): ?string
{
    Notification::fake();

    test()->actingAs($user)->from('/profile')->post('/password/setup-code')
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $code = null;
    Notification::assertSentTo($user, PasswordSetupCodeNotification::class, function ($n) use (&$code) {
        $code = $n->code;

        return true;
    });

    return $code;
}

function setupPassword(User $user, string $code, string $password = 'kata-sandi-baru-1')
{
    return test()->actingAs($user)->from('/profile')->post('/password/setup', [
        'code' => $code,
        'password' => $password,
        'password_confirmation' => $password,
    ]);
}

test('akun tanpa sandi menerima kode 6 angka yang disimpan sebagai hash', function () {
    $user = socialUser();

    $code = requestSetupCode($user);

    expect($code)->toMatch('/^\d{6}$/');
    $stored = Cache::get(PasswordController::codeCacheKey($user));
    expect($stored)->not->toBe($code)
        ->and(Hash::check($code, $stored))->toBeTrue();

    $mail = (new PasswordSetupCodeNotification($code))->toMail($user);
    expect($mail->subject)->toContain($code)
        ->and((string) $mail->render())->toContain($code)->toContain('10 menit');
});

test('kode benar memasang kata sandi, memutus perangkat lain, dan mengirim pemberitahuan', function () {
    $user = socialUser();
    $rememberBefore = $user->remember_token;
    $code = requestSetupCode($user);

    setupPassword($user, $code)->assertSessionHasNoErrors()->assertRedirect('/profile');

    $user->refresh();
    expect(Hash::check('kata-sandi-baru-1', $user->password))->toBeTrue()
        ->and($user->remember_token)->not->toBe($rememberBefore)
        ->and(Cache::has(PasswordController::codeCacheKey($user)))->toBeFalse();
    Notification::assertSentTo($user, PasswordCreatedNotification::class);

    // Kode sekali pakai, dan akun yang kini bersandi tak bisa lewat jalur kode lagi.
    setupPassword($user, $code, 'lain-lagi-123')->assertSessionHasErrors('code');
    expect(Hash::check('kata-sandi-baru-1', $user->refresh()->password))->toBeTrue();
});

test('kode salah lima kali membuat kode hangus', function () {
    $user = socialUser();
    $code = requestSetupCode($user);
    $wrong = $code === '000000' ? '111111' : '000000';

    foreach (range(1, PasswordController::SETUP_CODE_MAX_ATTEMPTS) as $i) {
        setupPassword($user, $wrong)->assertSessionHasErrors('code');
    }

    setupPassword($user, $code)->assertSessionHasErrors('code');
    expect($user->refresh()->password)->toBeNull();
});

test('kode kedaluwarsa setelah 10 menit', function () {
    $user = socialUser();
    $code = requestSetupCode($user);

    $this->travel(PasswordController::SETUP_CODE_TTL + 1)->seconds();

    setupPassword($user, $code)->assertSessionHasErrors('code');
    expect($user->refresh()->password)->toBeNull();
});

test('minta kode dibatasi sekali per menit dan lima kali per jam', function () {
    $user = socialUser();
    requestSetupCode($user);

    $this->actingAs($user)->from('/profile')->post('/password/setup-code')->assertSessionHasErrors('code');

    foreach (range(2, PasswordController::SETUP_CODE_SENDS_PER_HOUR) as $i) {
        $this->travel(61)->seconds();
        requestSetupCode($user);
    }

    $this->travel(61)->seconds();
    $this->actingAs($user)->from('/profile')->post('/password/setup-code')->assertSessionHasErrors('code');
});

test('kode baru menggantikan kode lama', function () {
    $user = socialUser();
    $old = requestSetupCode($user);
    $this->travel(61)->seconds();
    $new = requestSetupCode($user);

    if ($old !== $new) {
        setupPassword($user, $old)->assertSessionHasErrors('code');
    }
    setupPassword($user, $new)->assertSessionHasNoErrors();
});

test('akun yang sudah punya sandi tidak bisa memakai jalur kode', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->actingAs($user)->from('/profile')->post('/password/setup-code')->assertSessionHasErrors('code');
    Notification::assertNothingSent();

    setupPassword($user, '123456')->assertSessionHasErrors('code');
    expect(Hash::check('password', $user->refresh()->password))->toBeTrue();
});

test('akun tanpa email diminta mengisi email dulu', function () {
    Notification::fake();
    $user = socialUser(['email' => null]);

    $this->actingAs($user)->from('/profile')->post('/password/setup-code')->assertSessionHasErrors('code');
    Notification::assertNothingSent();
});

test('tamu tidak bisa meminta kode', function () {
    $this->post('/password/setup-code')->assertRedirect('/login');
});

test('profil menampilkan kartu Buat Kata Sandi hanya untuk akun tanpa sandi', function () {
    $edit = file_get_contents(resource_path('js/Pages/Profile/Edit.jsx'));
    expect($edit)->toContain('props.hasPassword ? <UpdatePasswordForm /> : <CreatePasswordForm');

    $form = file_get_contents(resource_path('js/Pages/Profile/Partials/CreatePasswordForm.jsx'));
    expect($form)->toContain('autoComplete="one-time-code"')
        ->toContain('inputMode="numeric"')
        ->toContain("route('password.setup-code')")
        ->toContain("route('password.setup')");
});

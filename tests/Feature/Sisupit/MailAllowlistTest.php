<?php

use App\Mail\DinasMail;
use App\Models\MailContact;
use App\Models\MailMessage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

// Email Dinas (TASK_56). Keputusan user 2026-09-22: penerima = pejabat (daftar putih tersendiri),
// pengirim = petugas|admin|superadmin, satu kotak surat PER KABUPATEN, dan kredensialnya diisi
// ADMIN kabupaten sendiri.
beforeEach(function () {
    DB::table('indonesia_provinces')->insert([['code' => '51', 'name' => 'Bali']]);
    DB::table('indonesia_cities')->insert([
        ['code' => '5171', 'province_code' => '51', 'name' => 'Kota Denpasar'],
        ['code' => '5103', 'province_code' => '51', 'name' => 'Kabupaten Badung'],
    ]);

    $this->denpasar = Tenant::create([
        'subdomain' => 'denpasar', 'city_code' => '5171', 'province_code' => '51',
        'nama_instansi' => 'Damkar Denpasar', 'is_active' => true,
        'features' => [Tenant::FEATURE_MAIL],
        'mail_from_address' => 'damkar@denpasarkota.go.id',
        'mail_from_name' => 'Damkar Kota Denpasar',
        'mail_host' => 'smtp.example.test',
        'mail_port' => 587,
        'mail_encryption' => 'tls',
        'mail_username' => 'damkar@denpasarkota.go.id',
        'mail_password' => 'rahasia-kotak-surat',
    ]);

    // Fiturnya menyala tapi kotak suratnya BELUM diisi — sengaja, untuk menguji bahwa keadaan
    // itu diperlakukan sama dengan fitur mati (404), bukan layar kirim yang selalu gagal.
    $this->badung = Tenant::create([
        'subdomain' => 'badung', 'city_code' => '5103', 'province_code' => '51',
        'nama_instansi' => 'Damkar Badung', 'is_active' => true,
        'features' => [Tenant::FEATURE_MAIL],
    ]);

    $this->admin = mailUser('admin', '5171');
    $this->petugas = mailUser('petugas', '5171');
    // Warga WAJIB berprofil lengkap sampai desa: EnsureProfileComplete memantulkan non-staf
    // yang profilnya belum lengkap, dan pantulan itu (302) akan menutupi gerbang peran yang
    // justru sedang diuji.
    $this->warga = mailUser('warga', '5171', '517101', '5171012008');
    $this->adminBadung = mailUser('admin', '5103');
});

function mailUser(string $role, string $city, ?string $district = null, ?string $village = null): User
{
    $user = User::factory()->create([
        'phone' => '081234567890',
        'province_code' => '51',
        'city_code' => $city,
        'district_code' => $district,
        'village_code' => $village,
    ]);
    $user->assignRole($role);

    return $user;
}

function mailContact(string $city, array $overrides = []): MailContact
{
    return MailContact::withoutGlobalScope('tenant')->create(array_merge([
        'name' => 'Camat Denpasar Barat',
        'jabatan' => 'Camat',
        'instansi' => 'Kecamatan Denpasar Barat',
        'email' => 'camat@denpasarkota.go.id',
        'is_active' => true,
        'province_code' => '51',
        'city_code' => $city,
    ], $overrides));
}

function suratSah(array $overrides = []): array
{
    return array_merge([
        'subject' => 'Laporan Kejadian Kebakaran',
        'body' => 'Bersama ini kami sampaikan laporan kejadian kebakaran pada hari ini.',
        'to' => ['camat@denpasarkota.go.id'],
    ], $overrides);
}

it('refuses a recipient that is not on the whitelist, and sends nothing at all', function () {
    Mail::fake();
    mailContact('5171');

    $this->actingAs($this->petugas)
        ->post(route('mail.store'), suratSah(['to' => ['orang.asing@gmail.com']]))
        ->assertSessionHasErrors('to');

    Mail::assertNothingSent();
    expect(MailMessage::withoutGlobalScope('tenant')->count())->toBe(0);
});

it('sends through the kabupaten mailbox and leaves an audit trail', function () {
    Mail::fake();
    mailContact('5171');

    $this->actingAs($this->petugas)
        ->post(route('mail.store'), suratSah())
        ->assertRedirect(route('mail.index'));

    Mail::assertSent(DinasMail::class, function (DinasMail $mail) {
        return $mail->hasTo('camat@denpasarkota.go.id')
            && $mail->fromAddress === 'damkar@denpasarkota.go.id';
    });

    $log = MailMessage::withoutGlobalScope('tenant')->first();

    expect($log)->not->toBeNull()
        ->and($log->sender_name)->toBe($this->petugas->name)
        ->and($log->user_id)->toBe($this->petugas->id)
        ->and($log->from_email)->toBe('damkar@denpasarkota.go.id')
        ->and($log->status)->toBe(MailMessage::STATUS_TERKIRIM)
        ->and($log->city_code)->toBe('5171')
        // Penerima di-SNAPSHOT, bukan ditautkan: kontak bisa dinonaktifkan/berganti jabatan,
        // surat yang sudah terkirim tidak boleh ikut berubah isinya.
        ->and($log->to[0]['email'])->toBe('camat@denpasarkota.go.id')
        ->and($log->to[0]['name'])->toBe('Camat Denpasar Barat');
});

it('keeps the recipient whitelist scoped to the sender kabupaten', function () {
    Mail::fake();
    // Alamat ini SAH — tapi milik kabupaten lain.
    mailContact('5103', ['email' => 'camat@badungkab.go.id', 'name' => 'Camat Kuta']);

    $this->actingAs($this->petugas)
        ->post(route('mail.store'), suratSah(['to' => ['camat@badungkab.go.id']]))
        ->assertSessionHasErrors('to');

    Mail::assertNothingSent();
});

it('refuses a recipient whose entry has been deactivated', function () {
    Mail::fake();
    mailContact('5171', ['is_active' => false]);

    $this->actingAs($this->petugas)
        ->post(route('mail.store'), suratSah())
        ->assertSessionHasErrors('to');

    Mail::assertNothingSent();
});

// K5 dan gerbangnya diuji BERSAMAAN dalam satu test supaya asimetrinya tak bisa
// "dirapikan" jadi seragam tanpa ada yang merah: petugas memegang aksi lapangan
// (mengirim), admin memegang siapa yang boleh dikirimi.
it('lets petugas send a letter but never manage who may receive one', function () {
    Mail::fake();
    mailContact('5171');

    $this->actingAs($this->petugas)
        ->post(route('mail.store'), suratSah())
        ->assertRedirect(route('mail.index'));

    $this->actingAs($this->petugas)
        ->get(route('admin.mail-contacts.index'))
        ->assertForbidden();

    $this->actingAs($this->petugas)
        ->post(route('admin.mail-contacts.store'), [
            'name' => 'Orang Baru', 'email' => 'orang.baru@example.test', 'is_active' => true,
        ])
        ->assertForbidden();

    expect(MailContact::withoutGlobalScope('tenant')->count())->toBe(1);
});

it('closes Email Dinas to roles outside the sender list', function () {
    $this->actingAs($this->warga)->get(route('mail.index'))->assertForbidden();
    $this->actingAs($this->warga)->get(route('mail.create'))->assertForbidden();
});

it('hides Email Dinas entirely when the feature is off or the mailbox is still empty', function () {
    // Kotak surat belum diisi (Badung) — diperlakukan sama dengan fitur mati.
    $this->actingAs($this->adminBadung)->get(route('mail.index'))->assertNotFound();

    // Fitur dimatikan superadmin lewat tenants.features.
    $this->denpasar->update(['features' => []]);

    $this->actingAs($this->petugas)->get(route('mail.index'))->assertNotFound();
    $this->actingAs($this->petugas)->post(route('mail.store'), suratSah())->assertNotFound();
});

it('never exposes the mailbox password to the screen', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.mail-settings.edit'));

    $response->assertOk();
    $response->assertDontSee('rahasia-kotak-surat');
    // Nama kolomnya pun tak boleh muncul sebagai prop: yang dikirim ke layar hanya KEADAANNYA.
    $response->assertDontSee('mail_password');
    $response->assertSee('has_password');
});

it('lets an admin edit only the mailbox of their own kabupaten', function () {
    // Kabupaten lain dikirim TANGAN lewat request — harus diabaikan sepenuhnya.
    $this->actingAs($this->adminBadung)
        ->put(route('admin.mail-settings.update'), [
            'tenant_id' => $this->denpasar->id,
            'city_code' => '5171',
            'mail_from_address' => 'damkar@badungkab.go.id',
            'mail_from_name' => 'Damkar Badung',
            'mail_host' => 'smtp.example.test',
            'mail_port' => 587,
        ])
        ->assertRedirect(route('admin.mail-settings.edit'));

    expect($this->badung->fresh()->mail_from_address)->toBe('damkar@badungkab.go.id')
        ->and($this->denpasar->fresh()->mail_from_address)->toBe('damkar@denpasarkota.go.id')
        ->and($this->denpasar->fresh()->mail_from_name)->toBe('Damkar Kota Denpasar');
});

it('treats an empty password field as "leave it alone", not as "erase it"', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.mail-settings.update'), [
            'mail_from_address' => 'damkar@denpasarkota.go.id',
            'mail_from_name' => 'Damkar Kota Denpasar (Piket)',
            'mail_host' => 'smtp.example.test',
            'mail_port' => 587,
            'mail_password' => '',
        ])
        ->assertRedirect(route('admin.mail-settings.edit'));

    $denpasar = $this->denpasar->fresh();

    expect($denpasar->mail_from_name)->toBe('Damkar Kota Denpasar (Piket)')
        ->and($denpasar->mail_password)->toBe('rahasia-kotak-surat');
});

it('locks the sender address to the mailbox account', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.mail-settings.update'), [
            'mail_from_address' => 'humas@denpasarkota.go.id',
            'mail_from_name' => 'Humas Damkar',
            'mail_host' => 'smtp.example.test',
            'mail_port' => 587,
            // Percobaan memalsukan akun: tak ada field-nya, dan kalaupun dikirim harus diabaikan.
            'mail_username' => 'orang.lain@example.test',
        ])
        ->assertRedirect(route('admin.mail-settings.edit'));

    $denpasar = $this->denpasar->fresh();

    expect($denpasar->mail_username)->toBe('humas@denpasarkota.go.id')
        // Kredensial berubah = hasil uji lama tidak lagi berlaku.
        ->and($denpasar->mail_verified_at)->toBeNull();
});

// Dua arah sekaligus (TASK_56 §1.2): surat dinas tak pernah lewat mailer bawaan, DAN mailer
// bawaan (email sistem: verifikasi pendaftaran, reset password) tak pernah tercemar kredensial
// kabupaten. Satu arah saja tidak cukup — yang bocor bisa yang mana pun, dan keduanya senyap.
it('keeps the dinas mailbox and the system mailer strictly apart', function () {
    Mail::fake();
    mailContact('5171');

    $smtpSebelum = config('mail.mailers.smtp');
    $defaultSebelum = config('mail.default');

    $this->actingAs($this->petugas)->post(route('mail.store'), suratSah());

    expect(config('mail.mailers.smtp'))->toBe($smtpSebelum)
        ->and(config('mail.default'))->toBe($defaultSebelum);

    // Arah kedua: tak ada satu pun tempat di app/ yang mengirim lewat mailer bawaan.
    // Komentar dibuang lebih dulu — berkas yang MENJELASKAN larangan ini menyebut bentuk yang
    // dilarang di dalam komentarnya sendiri, dan penjaga yang tersandung penjelasannya sendiri
    // akan dimatikan orang berikutnya (pelajaran #108).
    $pelanggar = [];

    foreach (kumpulkanBerkasPhp(app_path()) as $berkas) {
        if (preg_match('/Mail::(to|send|raw|html|plain)\s*\(/', tanpaKomentarPhp(file_get_contents($berkas)))) {
            $pelanggar[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $berkas);
        }
    }

    expect($pelanggar)->toBe([]);
});

it('records the attempt even when the mailbox refuses the connection', function () {
    mailContact('5171');
    // Port tertutup di loopback: koneksi ditolak seketika, tanpa jaringan luar.
    $this->denpasar->update(['mail_host' => '127.0.0.1', 'mail_port' => 1]);

    $this->actingAs($this->petugas)
        ->post(route('mail.store'), suratSah())
        // Pola flash repo ini: helper flashMessage() menulis session `message` + `type`, lalu
        // dibaca prop `flash_message`. `->with('error', ...)` TIDAK pernah sampai ke layar -
        // kunci `flash` tak di-share sama sekali (lihat catatan temuan di laporan task).
        ->assertSessionHas('type', 'error');

    $log = MailMessage::withoutGlobalScope('tenant')->first();

    expect($log)->not->toBeNull()
        ->and($log->status)->toBe(MailMessage::STATUS_GAGAL)
        ->and($log->sent_at)->toBeNull()
        ->and($log->error)->not->toBeNull();
});

/** @return array<int, string> */
function kumpulkanBerkasPhp(string $direktori): array
{
    $berkas = [];

    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($direktori)) as $item) {
        if ($item->isFile() && $item->getExtension() === 'php') {
            $berkas[] = $item->getPathname();
        }
    }

    return $berkas;
}

function tanpaKomentarPhp(string $kode): string
{
    $bersih = '';

    foreach (token_get_all($kode) as $token) {
        if (is_array($token) && in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true)) {
            continue;
        }

        $bersih .= is_array($token) ? $token[1] : $token;
    }

    return $bersih;
}

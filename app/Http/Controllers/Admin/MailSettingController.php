<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Mail\MailManager;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Throwable;

/**
 * Pengaturan kotak surat Email Dinas per kabupaten (TASK_56, K8).
 *
 * DIISI ADMIN KABUPATEN SENDIRI — bukan superadmin, bukan `.env`, bukan developer. Pembagiannya
 * dua tingkat: superadmin membuka/menutup fitur per kabupaten lewat `tenants.features`
 * (/admin/tenants), admin kabupaten mengisi kredensial & nama pengirim di sini.
 *
 * EMPAT ATURAN YANG MENGIKAT:
 *
 * 1. Tenant yang disunting ditentukan `city_code` AKUN, TIDAK PERNAH dari request. Repo ini
 *    punya riwayat nyata endpoint yang menerima model dari route-binding tanpa authorize
 *    (FINDINGS #1, P0); di sini taruhannya kredensial kotak surat kabupaten lain.
 * 2. Password TIDAK PERNAH dikirim balik ke layar — yang dikirim hanya keadaannya
 *    ("tersimpan"/"belum diisi"). Mengirimnya sebagai prop Inertia berarti password ada di
 *    sumber halaman (bentuk FINDINGS #2, taruhan jauh lebih tinggi).
 * 3. Kolom password KOSONG berarti "jangan ubah", bukan "kosongkan". Kalau ini terbalik,
 *    menyimpan perubahan nama pengirim akan menghapus passwordnya — dan fiturnya baru mati
 *    pada kiriman berikutnya, jauh dari perbuatannya.
 * 4. Alamat pengirim DIKUNCI ke akun kotak suratnya (`mail_username` = `mail_from_address`);
 *    yang bisa diatur hanya NAMA-nya. Gmail menulis ulang header From yang tak cocok dengan
 *    akun, jadi alamat bebas menghasilkan surat yang tampil berbeda dari yang tertulis di
 *    layar — kekeliruan yang hanya terlihat oleh penerimanya.
 */
class MailSettingController extends Controller
{
    private const ENCRYPTIONS = ['tls', 'ssl'];

    public function edit()
    {
        $tenant = $this->tenantAkun();

        return Inertia::render('Admin/Mail/Settings', [
            'settings' => [
                'mail_from_address' => $tenant->mail_from_address,
                'mail_from_name' => $tenant->mail_from_name,
                'mail_reply_to' => $tenant->mail_reply_to,
                'mail_host' => $tenant->mail_host,
                'mail_port' => $tenant->mail_port,
                'mail_encryption' => $tenant->mail_encryption,
                'mail_signature' => $tenant->mail_signature,
                // Aturan 2: keadaan saja, tak pernah nilainya.
                'has_password' => filled($tenant->getAttributes()['mail_password'] ?? null),
                'mail_verified_at' => $tenant->mail_verified_at,
            ],
            'encryption_options' => self::ENCRYPTIONS,
            'feature_enabled' => $tenant->hasFeature(Tenant::FEATURE_MAIL),
            'nama_instansi' => $tenant->nama_instansi,
        ]);
    }

    public function update(Request $request)
    {
        $tenant = $this->tenantAkun();

        $tenant->update($this->siapkanData($request, $tenant) + ['mail_updated_by' => auth()->id()]);

        $this->buangCacheTenant($tenant);

        flashMessage('Pengaturan Email Dinas disimpan.');

        return redirect()->route('admin.mail-settings.edit');
    }

    /**
     * Uji koneksi SMTP dengan kredensial yang tersimpan.
     *
     * Yang dibuktikan: host, port, enkripsi, dan OTENTIKASI akun. Yang TIDAK dibuktikan:
     * apakah surat benar-benar sampai ke penerima (itu urusan reputasi domain & SPF/DKIM).
     * Katakan batas itu di layar — uji yang mengaku membuktikan lebih daripada yang
     * sesungguhnya lebih buruk daripada tidak ada uji.
     *
     * Ia sengaja hanya MEMBUKA koneksi, tidak mengirim apa pun: mengirim surat uji ke alamat
     * mana pun berarti satu jalur kirim yang tidak lewat daftar putih, dan jalur seperti itu
     * akan jadi lubang pertama yang dipakai orang berikutnya.
     */
    public function test()
    {
        $tenant = $this->tenantAkun();

        if (! $tenant->hasMailbox()) {
            flashMessage('Lengkapi dulu alamat, host, port, dan password kotak surat.', 'error');

            return back();
        }

        try {
            $transport = app(MailManager::class)->createSymfonyTransport($tenant->mailerConfig());

            if (method_exists($transport, 'start')) {
                $transport->start();
            }

            if (method_exists($transport, 'stop')) {
                $transport->stop();
            }
        } catch (Throwable $e) {
            // Pesan server SMTP boleh ditampilkan di sini — ini layar admin yang sedang
            // men-setel, dan "535 Username and Password not accepted" justru kalimat yang
            // membuatnya tahu harus berbuat apa. Yang tidak boleh bocor ke layar PENGIRIM
            // surat adalah galat yang sama (lihat Front\MailController::store).
            flashMessage('Koneksi gagal: '.$e->getMessage(), 'error');

            return back();
        }

        $tenant->update(['mail_verified_at' => now()]);
        $this->buangCacheTenant($tenant);

        flashMessage('Koneksi & login ke kotak surat berhasil.');

        return back();
    }

    /**
     * Susun data yang akan disimpan. Di sinilah aturan 3 & 4 hidup.
     */
    private function siapkanData(Request $request, Tenant $tenant): array
    {
        $validated = $request->validate([
            'mail_from_address' => 'required|email|max:255',
            'mail_from_name' => 'required|string|max:255',
            'mail_reply_to' => 'nullable|email|max:255',
            'mail_host' => 'required|string|max:255',
            'mail_port' => 'required|integer|min:1|max:65535',
            'mail_encryption' => 'nullable|in:'.implode(',', self::ENCRYPTIONS),
            'mail_password' => 'nullable|string|max:255',
            'mail_signature' => 'nullable|string|max:2000',
        ]);

        // Aturan 4: username mengikuti alamat, tidak pernah diisi terpisah.
        $validated['mail_username'] = $validated['mail_from_address'];

        // Aturan 3: kosong = jangan ubah.
        if (blank($validated['mail_password'] ?? null)) {
            unset($validated['mail_password']);
        }

        // Kredensial berubah = hasil uji lama tidak lagi berlaku. Membiarkan lencana "sudah
        // diuji" menempel pada kredensial yang baru saja diganti adalah jaminan palsu.
        if ($this->kredensialBerubah($validated, $tenant)) {
            $validated['mail_verified_at'] = null;
        }

        return $validated;
    }

    private function kredensialBerubah(array $validated, Tenant $tenant): bool
    {
        if (array_key_exists('mail_password', $validated)) {
            return true;
        }

        foreach (['mail_from_address', 'mail_host', 'mail_port', 'mail_encryption'] as $kolom) {
            if ((string) ($validated[$kolom] ?? '') !== (string) $tenant->{$kolom}) {
                return true;
            }
        }

        return false;
    }

    /**
     * Tenant milik akun ini. `city_code` AKUN, tak pernah parameter request (aturan 1).
     * Akun tanpa kabupaten — termasuk superadmin nasional — mendapat 404: kotak surat dinas
     * selalu milik sebuah kabupaten, dan tidak ada kabupaten yang "default" untuk itu.
     */
    private function tenantAkun(): Tenant
    {
        $user = auth()->user();

        abort_if(blank($user?->city_code), 404);

        $tenant = Tenant::query()
            ->where('city_code', $user->city_code)
            ->where('is_active', true)
            ->first();

        abort_if($tenant === null, 404);

        return $tenant;
    }

    /** Branding tenant di-cache selamanya (Tenant::forCity/resolveFromHost). */
    private function buangCacheTenant(Tenant $tenant): void
    {
        Cache::forget("tenant:city:{$tenant->city_code}");
        Cache::forget("tenant:subdomain:{$tenant->subdomain}");
        Tenant::flushResolutionCache();
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Peran `masyarakat` berganti nama jadi `warga` (permintaan user 2026-09-02).
 *
 * MENGGANTI NAMA, BUKAN MEMBUAT PERAN BARU: `model_has_roles` menunjuk lewat `role_id`, jadi
 * selama barisnya yang sama yang disunting, seluruh penugasan akun & permission ikut utuh tanpa
 * satu baris pun dipindahkan. Membuat peran baru lalu memindahkan akunnya akan menempuh jalan
 * yang jauh lebih panjang untuk hasil yang sama, dan setiap akun yang terlewat jadi akun tanpa
 * peran (bentuk #110).
 *
 * YANG MEMBUAT MIGRASI INI TIDAK SEKADAR SATU UPDATE: `roles` ber-UNIQUE(name, guard_name), dan
 * di prod/staging/dev VPS kemungkinan besar MASIH ADA peran hantu bernama `warga` — sisa daftar
 * peran kedua di `UserTenantSeeder` yang dicabut hari yang sama (FINDINGS #110; barisnya sudah
 * dihapus di DB dev lokal, tapi ketiga environment VPS belum tersentuh). Tanpa penanganan, UPDATE
 * ini akan menabrak unique key dan migrasi GAGAL di tengah deploy.
 *
 * Peran hantu itu dihapus lebih dulu, TAPI hanya bila benar-benar kosong. Kalau ternyata ada akun
 * atau permission yang menempel padanya, migrasi BERHENTI dengan pesan yang menyebut jumlahnya —
 * menggabungkan dua peran diam-diam adalah keputusan data, bukan langkah teknis, dan environment
 * yang isinya di luar dugaan harus dilihat manusia lebih dulu.
 */
return new class extends Migration
{
    private const LAMA = 'masyarakat';

    private const BARU = 'warga';

    private const GUARD = 'web';

    public function up(): void
    {
        $this->buangPeranHantu(self::BARU);
        $this->gantiNama(self::LAMA, self::BARU);
        $this->lupakanCache();
    }

    /**
     * Kebalikannya SENGAJA tidak menghidupkan lagi peran hantu `warga` yang dibuang di up() —
     * peran itu memang tak pernah dipakai siapa pun, dan memulihkannya cuma mengembalikan
     * pilihan menyesatkan di dropdown Manajemen Pengguna.
     */
    public function down(): void
    {
        $this->buangPeranHantu(self::LAMA);
        $this->gantiNama(self::BARU, self::LAMA);
        $this->lupakanCache();
    }

    private function buangPeranHantu(string $nama): void
    {
        $id = DB::table('roles')->where('name', $nama)->where('guard_name', self::GUARD)->value('id');

        if (! $id) {
            return;
        }

        $akun = DB::table('model_has_roles')->where('role_id', $id)->count();
        $izin = DB::table('role_has_permissions')->where('role_id', $id)->count();

        if ($akun > 0 || $izin > 0) {
            throw new RuntimeException(
                "Peran '{$nama}' sudah ada DAN terpakai ({$akun} akun, {$izin} permission). ".
                'Migrasi dihentikan: menggabungkannya dengan peran lain adalah keputusan data, '.
                'bukan langkah migrasi. Periksa environment ini secara manual lebih dulu.'
            );
        }

        DB::table('roles')->where('id', $id)->delete();
    }

    private function gantiNama(string $dari, string $ke): void
    {
        DB::table('roles')
            ->where('name', $dari)
            ->where('guard_name', self::GUARD)
            ->update(['name' => $ke, 'updated_at' => now()]);
    }

    /**
     * Spatie menyimpan peran & permission di cache permanen; tanpa ini nama lama masih dilayani
     * sampai cache kedaluwarsa dengan sendirinya, dan `assignRole('warga')` di kode yang baru
     * naik akan melempar RoleDoesNotExist meski barisnya sudah benar di tabel.
     */
    private function lupakanCache(): void
    {
        if (app()->bound(\Spatie\Permission\PermissionRegistrar::class)) {
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        }
    }
};

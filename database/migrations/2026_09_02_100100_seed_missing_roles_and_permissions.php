<?php

use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Menyelaraskan tabel `roles`/`permissions` dengan `RolePermissionSeeder` (permintaan user
 * 2026-09-02: "tambahkan peran opd"; FINDINGS #111).
 *
 * MASALAHNYA BUKAN KODE — `opd` sudah ada di seeder itu sejak TASK_27 (2026-08-12). Yang tidak
 * ada adalah barisnya di database, sebab **deploy di repo ini menjalankan `php artisan migrate`,
 * TIDAK PERNAH `db:seed`** (lihat runbook multi-env). Database yang lahir sebelum sebuah peran
 * ditambahkan karena itu tak pernah menerimanya, dan `Admin\UserController::allRoleNames()`
 * membaca daftar peran dari TABEL — jadi peran yang tak ada di sana tidak muncul di dropdown
 * Manajemen Pengguna sama sekali. Gejalanya nol: daftarnya cuma lebih pendek, tak ada galat,
 * dan seluruh fitur OPD (TASK_27, #89) diam-diam tak bisa dipakai.
 *
 * MIGRASI INI MEMANGGIL SEEDER-NYA, BUKAN MENYALIN DAFTARNYA. Menuliskan ulang nama peran &
 * permission di sini akan membuat DAFTAR KEDUA — persis sebab #110, yang melahirkan peran hantu
 * `warga` dan baru ketahuan bertahun-tahun kemudian. Seluruh isi seeder itu `firstOrCreate` +
 * `givePermissionTo`, jadi memanggilnya aman berulang kali: pada environment yang sudah lengkap
 * ia tidak mengubah apa pun.
 *
 * Kalau kelak ada peran baru lagi, cukup tambahkan ke `RolePermissionSeeder` LALU buat migrasi
 * penyelaras seperti ini — tanpa itu peran barunya hanya hidup di mesin yang di-seed dari nol.
 */
return new class extends Migration
{
    public function up(): void
    {
        (new RolePermissionSeeder)->run();
    }

    /**
     * TIDAK ADA kebalikannya. Migrasi ini hanya menambahkan baris referensi yang memang
     * seharusnya ada; membuangnya saat rollback justru akan mencabut peran dari akun yang
     * sudah memakainya — kerusakan yang jauh lebih besar daripada yang diperbaiki.
     */
    public function down(): void
    {
        // sengaja kosong
    }
};

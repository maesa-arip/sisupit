<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kotak surat dinas PER KABUPATEN (TASK_56, K2/K6/K8).
     *
     * KENAPA DI SINI DAN BUKAN DI `.env`: `MAIL_*` bersifat global untuk seluruh aplikasi —
     * satu proses Laravel melayani semua kabupaten lewat subdomain. Begitu kabupaten kedua
     * bergabung, seluruh suratnya akan terkirim dari kotak surat Denpasar TANPA satu pun galat;
     * penerima hanya melihat pengirim yang keliru. `.env` tetap milik EMAIL SISTEM (verifikasi
     * pendaftaran & reset password), dan kedua jalur itu tidak boleh tercampur — TASK_56 §1.2.
     *
     * DIISI ADMIN KABUPATEN SENDIRI lewat /admin/email (K8), bukan superadmin dan bukan
     * developer. Karena itu ia data yang disunting pengguna: butuh validasi, uji koneksi, dan
     * penjaga lingkup (tenant yang disunting ditentukan city_code AKUN, tak pernah dari
     * request).
     *
     * `mail_password` bertipe TEXT, bukan string(255): isinya ciphertext cast `encrypted`
     * Laravel yang JAUH lebih panjang daripada password aslinya. Kolom string akan memotongnya
     * di MySQL non-strict — dan password yang terpotong gagal saat dipakai, bukan saat
     * disimpan.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Alamat pengirim DIKUNCI ke akun kotak suratnya; yang boleh diatur admin hanya
            // NAMA-nya. Gmail menulis ulang header From yang tak cocok dengan akun, sehingga
            // alamat bebas menghasilkan surat yang tampil beda dari yang tertulis di layar.
            $table->string('mail_from_address')->nullable();
            $table->string('mail_from_name')->nullable();
            $table->string('mail_reply_to')->nullable();

            $table->string('mail_host')->nullable();
            $table->unsignedSmallInteger('mail_port')->nullable();
            $table->string('mail_encryption', 10)->nullable();
            $table->string('mail_username')->nullable();
            $table->text('mail_password')->nullable();

            $table->text('mail_signature')->nullable();

            // Kapan Uji Koneksi terakhir BERHASIL. Informatif di layar — bukan gerbang kirim,
            // sebab kotak surat bisa saja sehat tanpa pernah diuji, dan menolak kiriman karena
            // "belum diuji" akan menahan surat yang sebenarnya bisa terkirim.
            $table->timestamp('mail_verified_at')->nullable();
            $table->foreignId('mail_updated_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mail_updated_by');
            $table->dropColumn([
                'mail_from_address',
                'mail_from_name',
                'mail_reply_to',
                'mail_host',
                'mail_port',
                'mail_encryption',
                'mail_username',
                'mail_password',
                'mail_signature',
                'mail_verified_at',
            ]);
        });
    }
};

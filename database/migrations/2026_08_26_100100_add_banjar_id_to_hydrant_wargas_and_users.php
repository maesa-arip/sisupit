<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Banjar menempel di DUA tempat (permintaan user 2026-08-26):
 *  - `hydrant_wargas.banjar_id` : banjar yang wilayahnya menaungi tandon/groundtank itu.
 *  - `users.banjar_id`          : banjar tempat warga tinggal.
 *
 * KEDUANYA NULLABLE, meski poin "wajib isi banjar saat daftar" memang diminta. Alasannya
 * bukan kemalasan:
 *  1. 71 akun produksi & SELURUH akun staf/OPD tidak punya banjar. Kolom NOT NULL memaksa
 *     migrasi ini mengarang nilai untuk mereka — persis kesalahan yang baru diperbaiki di #78.
 *  2. Staf kabupaten/kecamatan memang TIDAK berbanjar. Di repo ini kolom wilayah kosong pada
 *     staf sudah punya arti resmi ("sengaja luas", #56/#23) — banjar mengikuti aturan yang sama.
 *  3. Master banjar belum terisi saat migrasi ini jalan. Kewajiban dinyalakan lewat
 *     `Setting::KEY_REQUIRE_BANJAR` SETELAH masternya ada; kalau dibalik, pendaftaran warga
 *     mati total karena dropdown-nya kosong (gema #61).
 *
 * nullOnDelete: menghapus satu banjar dari master TIDAK boleh menghapus warga atau tandonnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hydrant_wargas', function (Blueprint $table) {
            $table->foreignId('banjar_id')->nullable()->after('village_code')
                ->constrained('banjars')->nullOnDelete();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('banjar_id')->nullable()->after('village_code')
                ->constrained('banjars')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hydrant_wargas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('banjar_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('banjar_id');
        });
    }
};

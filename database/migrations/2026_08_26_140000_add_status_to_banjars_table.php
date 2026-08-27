<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Banjar usulan warga (permintaan user 2026-08-26).
 *
 * Master banjar tak akan pernah lengkap lewat data resmi saja: daftar bernama se-Bali tidak
 * dipublikasikan (DPMA hanya menerbitkan JUMLAH), dan panen dari situs desa cuma menutupi 32
 * dari 43 desa Denpasar. Sebelas desa sisanya berarti warga di sana berhadapan dengan dropdown
 * kosong. Karena itu warga boleh mengusulkan banjarnya sendiri — merekalah yang paling tahu.
 *
 * KENAPA KOLOM, BUKAN TABEL USULAN TERPISAH (ditanyakan & diputuskan user 2026-08-26):
 * banjar usulan dan banjar terverifikasi adalah KONSEP YANG SAMA pada tingkat keyakinan yang
 * berbeda, bukan dua hal berbeda seperti hydrant resmi vs hydrant warga (PENGECUALIAN #1).
 * Tabel terpisah akan menuntut FK kedua di `users` DAN `hydrant_wargas` — dan satu pembaca yang
 * lupa bertanya dua kali membuat banjar seseorang lenyap tanpa gejala (bentuk #60/#71).
 * Lebih penting lagi: menyetujui usulan cukup MEMBALIK KOLOM, sehingga id-nya tetap dan semua
 * yang menunjuk ke sana utuh. Dengan tabel terpisah, promosi = pindah baris = id baru = penunjuk
 * lama jadi yatim — biaya yang persis sudah tercatat di PENGECUALIAN #1 poin 4.
 *
 * Default 'terverifikasi' supaya 123 baris yang sudah ada (impor berkas Pemkot) tidak mendadak
 * berubah arti, dan supaya perilaku dropdown hari ini tidak berubah sama sekali.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banjars', function (Blueprint $table) {
            $table->string('status')->default('terverifikasi')->after('jenis')->index();
            // Jejak pengusul: satu akun yang mengisi asal-asalan bisa ditelusuri dan barisnya
            // dicabut bersama-sama, tanpa harus menebak dari waktu pembuatan.
            $table->foreignId('created_by')->nullable()->after('status')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('banjars', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
    }
};

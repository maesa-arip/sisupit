<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Master banjar — satuan komunitas Bali di BAWAH desa/kelurahan (permintaan user 2026-08-26).
 *
 * KENAPA TABEL, BUKAN KOLOM TEKS: banjar akan diisi oleh setiap warga yang mendaftar. Teks
 * bebas + wajib = "Br. Tegal", "Banjar Tegal", "tegal" untuk banjar yang sama, dan tak satu pun
 * rekap per banjar bisa dipercaya sesudahnya. Repo ini baru saja membayar kelas masalah yang
 * sama di FINDINGS #78 (seeder mengarang kode desa; rekap desa menampilkan angka sebagai judul
 * baris tanpa satu pun galat).
 *
 * `jenis` (dinas/adat) SENGAJA ada sejak awal meski belum tentu langsung dipakai: banjar dinas
 * (administratif, ikut alamat) dan banjar adat (adat, pemilik & perawat tandon swadaya) adalah
 * DUA daftar berbeda dengan jumlah berbeda — dokumen resmi pun memisahkannya. Menambahkan
 * pembeda ini setelah ribuan baris masuk berarti menebak ulang satu per satu.
 *
 * `code` disiapkan untuk kode resmi bila daftarnya kelak datang dari BPS (banjar = SLS, punya
 * kode di master SLS). Nullable karena daftar dari Pemkot/MDA umumnya hanya berisi nama.
 *
 * Empat kolom wilayah + Tenantable mengikuti pola `agencies`/`units`: tiap kabupaten mengelola
 * daftarnya sendiri. Banjar TIDAK menjadi tingkat kelima Tenantable — trait itu alat kontrol
 * akses di empat kolom BPS, sedangkan banjar bersifat deskriptif.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banjars', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            // 'dinas' | 'adat' | null (belum dipilah). Sengaja string, bukan enum: enum di
            // MySQL menuntut migrasi tiap kali nilainya bertambah, dan repo ini menyimpan
            // status fasilitas pun sebagai string.
            $table->string('jenis')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);

            $table->string('province_code')->nullable();
            $table->string('city_code')->nullable();
            $table->string('district_code')->nullable();
            // Desa induk. Nullable agar baris hasil impor yang desanya belum terpetakan tidak
            // hilang begitu saja, tapi form admin mewajibkannya.
            $table->string('village_code')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index('village_code');
            $table->index('city_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banjars');
    }
};

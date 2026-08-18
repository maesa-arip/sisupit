<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hydrant warga — hydrant swadaya masyarakat (banjar/desa), TERPISAH dari `hydrants` yang
 * berisi hydrant milik instansi/PDAM.
 *
 * PENGECUALIAN ATURAN yang disetujui user 2026-08-19 — lihat `prompt/docs/PENGECUALIAN_ATURAN.md`
 * entri #1. Tabel ini SENGAJA mengembarkan skema `hydrants` (nama, alamat, status, konstruksi,
 * kondisi air, debit, koordinat, kode wilayah), yang berarti menekuk prinsip "satu konsep =
 * satu sumber data" milik repo ini (lahir dari FINDINGS #53/#54, terdokumentasi di
 * `navItems.js`). Konsekuensi yang diterima user: kolom baru untuk hydrant harus ditambahkan
 * DUA KALI (di sini dan di `hydrants`). Kalau kamu menambah kolom di salah satunya, cek yang
 * satunya lagi.
 *
 * Yang dibeli dengan harga itu: dua menu & route yang benar-benar terpisah (dikelola dua pihak
 * berbeda — PDAM vs swadaya warga), tanpa risiko satu scope kelupaan membuat hydrant warga
 * bocor ke daftar hydrant resmi.
 *
 * `debit_lpm` nullable di level DB tapi WAJIB di validasi form (`HydrantWargaController`):
 * seluruh gunanya kolom ini adalah rekap "berapa total debit air di desa ini". Dibuat nullable
 * agar impor data lama yang belum lengkap tidak dipaksa mengarang angka 0 — nol berarti "tidak
 * mengalir", bukan "belum didata".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hydrant_wargas', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('address');
            $table->string('status')->default('Aktif');   // Aktif | Perbaikan (label UI: Berfungsi / Tidak Berfungsi)
            $table->string('type')->default('Stick');     // Stick | Jongkok
            $table->string('water_pressure', 20)->nullable(); // Keras | Sedang | Kecil
            $table->unsignedInteger('debit_lpm')->nullable()
                ->comment('Debit air liter per menit — satuan sama dengan hydrants.debit_lpm & pompas.capacity_lpm');
            $table->text('description')->nullable();
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();

            // Kolom wilayah mengikuti bentuk yang sama persis dengan tabel Sisupit lain
            // (2026_05_15_132259) agar trait Tenantable bekerja tanpa penyesuaian.
            $table->char('province_code', 2)->nullable()->index();
            $table->char('city_code', 4)->nullable()->index();
            $table->char('district_code', 7)->nullable()->index();
            $table->char('village_code', 10)->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hydrant_wargas');
    }
};

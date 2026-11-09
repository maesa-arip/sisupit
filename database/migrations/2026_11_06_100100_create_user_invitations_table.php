<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Undang Petugas lewat email (permintaan user 2026-11-06). Admin memasukkan email + wilayah
 * TUGAS; penerima membuat akun (atau memakai akun yang sudah ada dengan email itu) dan langsung
 * menjadi petugas berwilayah tugas dari undangan - tanpa melewati deteksi GPS Lengkapi Profil,
 * sumber petugas "terdaftar di Bangli/Badung".
 *
 * Tabel (bukan sekadar tautan bertanda tangan) - keputusan user: undangan yang belum dipakai
 * bisa dilihat & dibatalkan. Token disimpan sebagai HASH sha256; yang asli hanya ada di email.
 * Kode wilayah = yurisdiksi yang sudah dipangkas ke tingkat pilihan admin (pola trimRegionToLevel).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('role')->default('petugas');
            $table->string('token_hash', 64)->unique();
            $table->char('province_code', 2)->nullable()->index();
            $table->char('city_code', 4)->nullable()->index();
            $table->char('district_code', 7)->nullable()->index();
            $table->char('village_code', 10)->nullable()->index();
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('accepted_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_invitations');
    }
};

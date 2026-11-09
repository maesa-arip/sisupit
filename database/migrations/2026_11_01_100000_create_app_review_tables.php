<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ulasan aplikasi (TASK_86, 2026-11-01): penilaian pengguna terhadap Sisupit, disimpan di
 * database sendiri - BUKAN ulasan Play Store/App Store (keputusan user). Satu web melayani
 * browser, APK, iOS, dan exe desktop, jadi satu tabel ini berlaku di semua platform.
 *
 * - `app_reviews`: SATU baris per pengguna (UNIQUE user_id), menyunting = menimpa. Wilayah hanya
 *   province_code + city_code dari akun penulis (pola forum_threads): admin kabupaten melihat
 *   ulasan kabupatennya lewat Tenantable. `platform` & `role` = SNAPSHOT saat ditulis.
 *   Testimoni publik butuh DUA persetujuan: `allow_public` (pengguna) + `approved_at` (admin).
 * - `app_review_prompts`: jejak ajakan "Nanti saja" / "Jangan tanya lagi" per pengguna, supaya
 *   ajakan di dashboard tidak muncul tiap kali dibuka.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->json('tags')->nullable();
            $table->text('comment')->nullable();
            $table->string('platform', 16);
            $table->string('role', 32)->nullable();
            $table->string('province_code')->nullable();
            $table->string('city_code')->nullable()->index();
            $table->boolean('allow_public')->default(false);
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
        });

        Schema::create('app_review_prompts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->timestamp('dismissed_at')->nullable();
            $table->boolean('never_ask')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_review_prompts');
        Schema::dropIfExists('app_reviews');
    }
};

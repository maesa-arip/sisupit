<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Forum Tanya Jawab Warga per kabupaten (TASK_54). Aditif: tiga tabel baru, tak ada tabel
 * lama yang disentuh.
 *
 * `forum_threads` SENGAJA hanya menyimpan province_code + city_code. Tenantable hierarkis
 * (#60) membaca kolom NULL sebagai "berlaku ke bawah", jadi thread tanpa district/village
 * terlihat oleh seluruh warga sekabupaten. Menyimpan desa penulis akan menyembunyikan
 * pertanyaannya dari warga desa lain di kabupaten yang sama, tanpa galat apa pun.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('body');
            $table->string('status', 20)->default('menunggu')->index();
            $table->boolean('is_pinned')->default(false);
            // Tanpa FK: kolom ini menunjuk ke tabel yang dibuat SESUDAH tabel ini.
            $table->unsignedBigInteger('accepted_post_id')->nullable();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->string('province_code', 20)->nullable();
            $table->string('city_code', 20)->nullable()->index();
            $table->string('district_code', 20)->nullable();
            $table->string('village_code', 20)->nullable();
            // Jejak pelaku moderasi (pelajaran #88: jejak yang tak disimpan sejak awal tak
            // bisa dipulihkan).
            $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->string('moderation_reason', 300)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('forum_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('forum_thread_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->boolean('is_official')->default(false);
            $table->string('status', 20)->default('tampil')->index();
            $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->string('moderation_reason', 300)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('forum_flags', function (Blueprint $table) {
            $table->id();
            $table->morphs('flaggable');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 30);
            $table->string('note', 300)->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            // Satu orang satu laporan per konten - menekan satu tombol berkali-kali tak boleh
            // terbaca sebagai banyak warga yang keberatan.
            $table->unique(['flaggable_type', 'flaggable_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_flags');
        Schema::dropIfExists('forum_posts');
        Schema::dropIfExists('forum_threads');
    }
};

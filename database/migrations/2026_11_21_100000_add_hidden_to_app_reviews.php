<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ulasan aplikasi tampil OTOMATIS sebagai testimoni (keputusan user 2026-11-21): tanpa izin
 * pemilik (saklar dihapus) dan tanpa persetujuan admin, termasuk ulasan bintang saja. Admin
 * tetap bisa MENYEMBUNYIKAN satu ulasan - itu `hidden_at`/`hidden_by`. Disembunyikan bertahan
 * walau pemilik menyunting ulasannya. `allow_public`/`approved_at` lama tak lagi menentukan tampil.
 *
 * Ulasan akun yang sudah dihapus (anonimisasi #157: username "dihapus-{id}") disembunyikan
 * di sini, karena dulu cukup ditahan `allow_public = false`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_reviews', function (Blueprint $table) {
            $table->timestamp('hidden_at')->nullable()->after('approved_by');
            $table->foreignId('hidden_by')->nullable()->after('hidden_at')->constrained('users')->nullOnDelete();
        });

        DB::table('app_reviews')
            ->whereIn('user_id', DB::table('users')->where('username', 'like', 'dihapus-%')->select('id'))
            ->update(['hidden_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('app_reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hidden_by');
            $table->dropColumn('hidden_at');
        });
    }
};

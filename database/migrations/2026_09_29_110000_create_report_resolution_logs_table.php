<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Riwayat perubahan Laporan Kejadian (TASK_67, permintaan user 2026-09-29): tiap kejadian
     * kini punya SATU entri sementara & SATU entri final yang bisa disunting petugas lain, jadi
     * "siapa mengubah apa" harus tercatat. Pola hydrant_logs (TASK_59): append-only, penyunting
     * di-snapshot (nama + peran) di samping user_id nullOnDelete, `changes` = hanya kolom yang
     * benar-benar berubah. Tanpa backfill - entri lama tidak punya riwayat, dan itu benar.
     */
    public function up(): void
    {
        Schema::create('report_resolution_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_resolution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name');
            $table->string('user_role')->nullable();
            $table->string('action', 20);
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['report_resolution_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_resolution_logs');
    }
};

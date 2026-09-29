<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FINDINGS #154 (2026-09-30): sejak TASK_66 satu anggota menekan "Tiba" = seluruh anggota regu
 * yang sama & masih meluncur ikut tiba. Tanpa kolom ini tak ada jejak SIAPA yang menandainya, jadi
 * anggota yang sebenarnya tertinggal tercatat tiba tanpa bisa ditelusuri. Aditif & nullable, tanpa
 * backfill: baris lama berarti "tidak tercatat", bukan "menandai sendiri".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_officers', function (Blueprint $table) {
            $table->foreignId('arrived_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('report_officers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('arrived_by');
        });
    }
};

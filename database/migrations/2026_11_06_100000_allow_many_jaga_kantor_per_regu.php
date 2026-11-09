<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Jaga di Kantor TANPA BATAS per regu (keputusan user 2026-11-06). Dulu UNIQUE(report_id,
 * regu_id) = "tepat satu orang jaga kantor per regu per kejadian" (TASK_60): begitu satu
 * anggota menekannya, tombol hilang bagi seluruh regu - petugas melaporkan tombolnya "banyak
 * tidak muncul". UNIQUE(report_id, user_id) TETAP: satu orang tak tercatat dua kali, dan
 * indeks itu yang menopang FK report_id di MySQL setelah indeks ini dilepas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_jaga_kantor', function (Blueprint $table) {
            $table->dropUnique(['report_id', 'regu_id']);
        });
    }

    /** Gagal bila sudah ada dua orang jaga kantor dari satu regu - hapus dulu baris ganda. */
    public function down(): void
    {
        Schema::table('report_jaga_kantor', function (Blueprint $table) {
            $table->unique(['report_id', 'regu_id']);
        });
    }
};

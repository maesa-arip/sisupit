<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TASK_72 (2026-10-04): verifikasi laporan tak meninggalkan jejak KAPAN & SIAPA - approve() hanya
 * menulis status 'pending'. Tanpa itu dashboard admin tak bisa mengukur "waktu verifikasi" (lapor ->
 * diverifikasi), padahal itu satu-satunya angka kinerja milik Pusat Komando sendiri. Pola sama dengan
 * `resolved_by`/`resolved_at` (2026_08_27): nullable tanpa backfill - laporan lama memang tidak
 * diketahui kapan diverifikasi, dan mengarang nilainya membuat median berbohong.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('approved_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropColumn('approved_at');
        });
    }
};

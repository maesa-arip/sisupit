<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Penutupan insiden sebelumnya tidak meninggalkan jejak pelaku sama sekali:
     * `resolve()` hanya menulis status 'resolved', dan `reject()` sudah menyimpan
     * KAPAN & ALASAN tapi tidak SIAPA. Padahal keduanya adalah keputusan yang
     * dipertanggungjawabkan ke pimpinan (lihat FINDINGS #88).
     *
     * Kolom nullable tanpa backfill: laporan yang sudah terlanjur ditutup/ditolak
     * sebelum migrasi ini memang tidak diketahui pelakunya — mengarang nilainya
     * justru membuat catatan audit berbohong. Frontend membaca kosong sebagai
     * "tidak tercatat".
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('resolved_by')->nullable()->after('rejected_at')->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable()->after('resolved_by');
            $table->foreignId('rejected_by')->nullable()->after('rejected_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('resolved_by');
            $table->dropConstrainedForeignId('rejected_by');
            $table->dropColumn('resolved_at');
        });
    }
};

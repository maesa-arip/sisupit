<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Taksiran kerugian jadi RENTANG ANGKA rupiah (permintaan user 2026-11-15): kolom AH/AI di
     * Excel dipakai rumus, dan teks bebas "±1jt" tak bisa dijumlahkan.
     *
     * ADITIF & nullable, tanpa backfill: kolom teks lama `kerugian` tetap ada dan tetap tampil
     * untuk berita acara lama (ReportResolution::kerugianLabel). Teks itu tak ditebak jadi
     * angka - "±1jt" atau "kurang lebih 50 juta" terlalu beragam untuk diubah tanpa mengarang.
     */
    public function up(): void
    {
        Schema::table('report_resolutions', function (Blueprint $table) {
            $table->unsignedBigInteger('kerugian_min')->nullable()->after('kerugian');
            $table->unsignedBigInteger('kerugian_maks')->nullable()->after('kerugian_min');
        });
    }

    public function down(): void
    {
        Schema::table('report_resolutions', function (Blueprint $table) {
            $table->dropColumn(['kerugian_min', 'kerugian_maks']);
        });
    }
};

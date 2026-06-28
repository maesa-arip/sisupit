<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Galeri foto per laporan (FINDINGS #17). Kolom `reports.photo` lama tetap dipakai
     * sebagai foto sampul (kompatibilitas feed/dashboard yang membaca report.photo).
     */
    public function up(): void
    {
        Schema::create('report_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_photos');
    }
};

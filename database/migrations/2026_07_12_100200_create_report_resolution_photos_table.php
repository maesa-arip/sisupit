<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Foto kejadian per berita acara (galeri, disk public — pola sama report_photos).
     */
    public function up(): void
    {
        Schema::create('report_resolution_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_resolution_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_resolution_photos');
    }
};

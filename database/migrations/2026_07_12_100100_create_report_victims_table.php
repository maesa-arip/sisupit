<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Identitas korban per berita acara (bisa banyak korban). Foto KTP disimpan di disk
     * PRIVAT (bukan public) karena PII — hanya diakses staf lewat route bergerbang.
     */
    public function up(): void
    {
        Schema::create('report_victims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_resolution_id')->constrained()->cascadeOnDelete();
            $table->string('nama')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('alamat')->nullable();
            $table->string('ktp_path')->nullable(); // disk 'local' (privat)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_victims');
    }
};

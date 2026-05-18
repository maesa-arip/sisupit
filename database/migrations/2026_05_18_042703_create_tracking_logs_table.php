<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracking_logs', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke Laporan dan Siapa yang bergerak
            $table->foreignId('report_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Membedakan apakah titik ini milik Relawan atau Petugas
            $table->string('user_type')->index()->comment('relawan atau petugas'); 
            
            // Titik Koordinat
            $table->decimal('lat', 10, 8);
            $table->decimal('lng', 11, 8);
            
            // Waktu titik GPS ini ditangkap (Di-index agar cepat saat menggambar garis rute berurutan di Peta)
            $table->timestamp('recorded_at')->index(); 
            
            // Bawaan Laravel (Bisa dipakai untuk mencatat kapan data ini masuk server)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_logs');
    }
};
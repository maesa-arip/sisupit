<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_officers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Petugas

            // Perbaikan 1 & 4: String + Index
            $table->string('status')->default('dispatched')->index();

            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();

            // Pencatatan Waktu
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('arrived_at')->nullable();
            // Perbaikan 3: Selesai bertugas
            $table->timestamp('finished_at')->nullable();

            $table->timestamps();

            // Perbaikan 2: Petugas yang sama tidak ditugaskan ganda di laporan yg sama
            $table->unique(['report_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_officers');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_helpers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Relawan

            // Perbaikan 1 & 4: Gunakan string dan index (Jangan Enum)
            $table->string('status')->default('waiting')->index();

            // Lokasi (Current Location - diupdate terus saat jalan)
            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();

            // Pencatatan Waktu (Audit Trail)
            $table->timestamp('started_at')->nullable();
            $table->timestamp('arrived_at')->nullable();
            // Perbaikan 3: Kapan tugas dinyatakan selesai/api padam
            $table->timestamp('finished_at')->nullable();

            $table->timestamps();

            // Perbaikan 2: Relawan yang sama tidak bisa mengambil tugas yang sama 2x
            $table->unique(['report_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_helpers');
    }
};

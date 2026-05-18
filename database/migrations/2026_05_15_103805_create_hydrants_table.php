<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hydrants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('address');
            $table->enum('status', ['Aktif', 'Perbaikan']);
            $table->enum('type', ['Stick', 'Jongkok']); // Jenis hydrant
            $table->text('description')->nullable(); // Untuk menyimpan info "Penyadapan Pipa" dll
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hydrants');
    }
};

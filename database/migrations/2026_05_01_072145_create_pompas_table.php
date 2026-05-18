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
        Schema::create('pompas', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Contoh: Hydrant Pasar Badung
            $table->text('address')->nullable();
            
            // Pengkategorian
            $table->string('type')->default('Statis (Hydrant)'); // Statis, Portable, Diesel, dll
            $table->string('status')->default('Aktif'); // Aktif, Dalam Perbaikan, Rusak
            
            // Kapasitas atau Spesifikasi Teknis (Opsional tapi direkomendasikan untuk alat)
            $table->integer('capacity_lpm')->nullable()->comment('Kapasitas Liter Per Menit');
            
            // Titik Koordinat (Best practice: Decimal presisi tinggi untuk GPS)
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            
            // Keterangan Tambahan
            $table->text('description')->nullable();

            $table->timestamps();
            $table->softDeletes(); // Menjaga riwayat aset jika dihapus (Trash)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pompas');
    }
};

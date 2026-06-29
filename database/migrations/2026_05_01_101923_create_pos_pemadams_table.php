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
        Schema::create('pos_pemadams', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Contoh: Pos Induk BPBD Denpasar
            $table->text('address')->nullable();

            // Info Darurat & Kapasitas
            $table->string('phone')->nullable(); // Nomor telepon darurat pos
            $table->integer('vehicle_count')->default(1)->comment('Jumlah armada mobil pemadam');

            $table->string('type')->default('Pos Induk'); // Pos Induk, Pos Sektor, Pos Relawan
            $table->string('status')->default('Aktif'); // Aktif, Siaga

            // Titik Koordinat (Decimal presisi tinggi)
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_pemadams');
    }
};

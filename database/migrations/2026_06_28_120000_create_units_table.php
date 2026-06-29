<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Katalog armada/unit (TASK_09, FINDINGS #19). Unit = kendaraan (truk/tangki/rescue), bukan
 * orang. Lokasi lapangan dipegang tracking petugas yang mengemudikannya (lihat keputusan
 * user 2026-06-28: status saja, tanpa GPS unit). Ter-scope wilayah via Tenantable + homebase
 * ke PosPemadam.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // truk/tangki/rescue/ambulans (bebas)
            $table->string('status')->default('available'); // available/dispatched/maintenance
            $table->foreignId('pos_pemadam_id')->nullable()->constrained('pos_pemadams')->nullOnDelete();

            // Kolom wilayah untuk Tenantable (selaras Hydrant/Pompa/PosPemadam)
            $table->string('province_code')->nullable();
            $table->string('city_code')->nullable();
            $table->string('district_code')->nullable();
            $table->string('village_code')->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};

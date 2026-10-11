<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Saringan periode daftar laporan & Peta Pemantauan (TASK_78) membaca rentang `created_at`
     * dan semua daftar diurutkan `latest('created_at')`. Indeks `(city_code, status, created_at)`
     * sudah melayani admin satu kota; indeks ini untuk superadmin/tingkat provinsi yang tidak
     * tersaring `city_code`, supaya urutan + rentang tanggal tidak memindai seluruh tabel.
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });
    }
};

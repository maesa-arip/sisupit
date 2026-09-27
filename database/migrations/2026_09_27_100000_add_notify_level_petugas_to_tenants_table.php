<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tingkat siaran notifikasi PETUGAS per kabupaten (TASK_62), diatur admin kabupaten sendiri.
     *
     * NULL = ikut setelan global superadmin (Setting::KEY_NOTIFY_LEVEL_PETUGAS). Karena itu
     * migrasi ini tidak mengubah perilaku kabupaten mana pun sampai admin-nya menyimpan pilihan.
     * Tanpa backfill: menyalin nilai global ke tiap baris akan memutus kabupaten dari setelan
     * global diam-diam.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('notify_level_petugas', 20)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('notify_level_petugas');
        });
    }
};

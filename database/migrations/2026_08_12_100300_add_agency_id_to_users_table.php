<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tautan akun ke instansi (TASK_27). Akun berperan `opd` mewakili satu OPD — dari sinilah
 * ditentukan permintaan bantuan mana yang ia terima & boleh ia konfirmasi.
 *
 * Satu OPD boleh punya banyak akun (piket bergantian); satu akun hanya mewakili satu OPD.
 * nullOnDelete: menghapus master OPD tidak boleh ikut menghapus akun orangnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('agency_id')->nullable()->after('village_code')
                ->constrained('agencies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropColumn('agency_id');
        });
    }
};

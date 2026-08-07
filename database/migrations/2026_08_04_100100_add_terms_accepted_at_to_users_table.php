<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bukti persetujuan Syarat & Ketentuan + Kebijakan Privasi saat mendaftar (TASK_19).
     * Centang di form tanpa jejak tidak bisa dibuktikan belakangan, jadi waktunya dicatat.
     * Nullable: akun lama (dibuat sebelum kolom ini ada) sengaja dibiarkan kosong — tidak
     * ada backfill, karena mereka memang belum pernah menyetujui dokumen ini.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('terms_accepted_at')->nullable()->after('email_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('terms_accepted_at');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Akun demo (TASK_81, 2026-10-18): akun untuk peragaan/peninjau (mis. penguji Google Play) yang
 * aksinya TIDAK memicu notifikasi ke pengguna asli. `users.is_demo` ditandai superadmin per akun;
 * `reports.is_demo` dicap saat laporan dibuat akun demo supaya tindakan LANJUTAN oleh akun asli
 * (mis. admin menyetujui laporan demo) juga tidak membunyikan sirine. Default false tanpa
 * backfill - semua akun & laporan yang sudah ada adalah data asli.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_demo')->default(false)->after('is_standby');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->boolean('is_demo')->default(false)->after('guest_check');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_demo');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('is_demo');
        });
    }
};

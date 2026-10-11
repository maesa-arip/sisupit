<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TASK_77 (2026-10-11): lapor TANPA LOGIN. Laporan tamu = `user_id` NULL - tanpa akun bayangan
 * "Tamu", sebab akun bersama akan membuat setiap tamu menjadi "pelapor" laporan tamu lain
 * (ReportController::show/thanks memakai `user_id` sebagai gerbang kepemilikan).
 *
 * `guest_check` = hasil lapis pelindung kedua saat laporan tamu masuk (ReportController::GUEST_CHECKS):
 * `turnstile` lolos captcha Cloudflare, `tanpa_captcha` Cloudflare tak terjangkau sehingga laporan
 * tetap diterima (laporan darurat tak boleh terblokir layanan pihak ketiga), `nonaktif` kunci
 * Turnstile belum diisi di server. NULL = laporan dari akun (bukan tamu).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->string('guest_check', 20)->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        // Gagal bila sudah ada laporan tamu (user_id NULL) - sengaja: membalik migrasi ini
        // berarti memutuskan dulu nasib laporan-laporan itu, bukan membuangnya diam-diam.
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('guest_check');
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};

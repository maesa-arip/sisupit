<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Statistik kunjungan web per hari (TASK_79), superadmin saja. Disimpan sebagai AGREGAT harian,
 * bukan log per kunjungan: tak ada IP mentah, URL berisi ID, atau user_id di sini.
 *
 * - site_visitors_daily  : satu baris per pengunjung unik per hari per kombinasi rincian.
 *   `visitor` = hash IP + browser dengan garam HARIAN (tak bisa dirangkai antarhari).
 * - site_page_views_daily: penghitung tampilan halaman per nama rute per hari.
 *
 * `date` = tanggal WITA (config app.local_timezone), `tenant` = subdomain yang dibuka.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_visitors_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->char('visitor', 64);
            $table->string('tenant', 50);
            $table->string('channel', 10);   // web | apk
            $table->boolean('is_auth');
            $table->unique(['date', 'visitor', 'tenant', 'channel', 'is_auth'], 'site_visitors_daily_unique');
        });

        Schema::create('site_page_views_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('tenant', 50);
            $table->string('channel', 10);
            $table->boolean('is_auth');
            $table->string('page', 100);      // nama rute, mis. front.reports.create
            $table->unsignedInteger('views')->default(0);
            $table->unique(['date', 'tenant', 'channel', 'is_auth', 'page'], 'site_page_views_daily_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_page_views_daily');
        Schema::dropIfExists('site_visitors_daily');
    }
};

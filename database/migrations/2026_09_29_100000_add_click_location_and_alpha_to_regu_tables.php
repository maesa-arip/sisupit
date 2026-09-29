<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TASK_66 (permintaan user 2026-09-29). Seluruhnya ADITIF & nullable, tanpa backfill.
 *
 * - `start_lat/lng/accuracy_m` di report_officers & report_helpers: posisi responder SAAT
 *   menekan "Meluncur". Terpisah dari `location_lat/lng` (posisi TERKINI yang terus ditimpa
 *   ping GPS) - titik berangkat tak boleh hilang tertimpa perjalanan.
 * - `lat/lng/accuracy_m` di report_jaga_kantor: posisi saat menekan "Jaga di Kantor".
 *   Kosong = GPS tidak tersedia/ditolak; tombolnya sengaja tetap berjalan tanpa lokasi.
 * - `report_alpha`: anggota regu yang ikut dipanggil tapi tidak memilih Meluncur maupun Jaga
 *   di Kantor sampai kejadian DITUTUP. Data internal (admin saja). Regu & nama di-SNAPSHOT
 *   seperti report_officers.regu_name, supaya catatan tak berubah saat regu/akun berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['report_officers', 'report_helpers'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->decimal('start_lat', 10, 8)->nullable();
                $table->decimal('start_lng', 11, 8)->nullable();
                $table->unsignedInteger('start_accuracy_m')->nullable();
            });
        }

        Schema::table('report_jaga_kantor', function (Blueprint $table) {
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->unsignedInteger('accuracy_m')->nullable();
        });

        Schema::create('report_alpha', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('regu_id')->nullable()->constrained('regus')->nullOnDelete();
            $table->string('regu_name');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name');
            $table->timestamps();

            $table->unique(['report_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_alpha');

        Schema::table('report_jaga_kantor', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng', 'accuracy_m']);
        });

        foreach (['report_officers', 'report_helpers'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropColumn(['start_lat', 'start_lng', 'start_accuracy_m']);
            });
        }
    }
};

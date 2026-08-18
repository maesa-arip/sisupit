<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kondisi air hydrant (TASK_30).
 *
 * `water_pressure` = penilaian cepat petugas di lapangan (Keras/Sedang/Kecil). Kualitatif,
 * bisa dinilai mata telanjang saat survei.
 *
 * `debit_lpm` = angka untuk perhitungan kesiapsiagaan wilayah, satuannya liter per menit —
 * SAMA dengan `pompas.capacity_lpm` dan `hydrant_wargas.debit_lpm` supaya rekap "berapa total
 * debit air di desa ini" bisa menjumlahkan ketiganya tanpa konversi. Satuan campur membuat
 * rekapnya tak bermakna, jadi kolom ini sengaja angka bersatuan tetap, bukan teks bebas.
 *
 * Keduanya nullable: hydrant lama belum disurvei, dan NULL berarti "belum didata" — bukan nol.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hydrants', function (Blueprint $table) {
            $table->string('water_pressure', 20)->nullable()->after('type');
            $table->unsignedInteger('debit_lpm')->nullable()->after('water_pressure')
                ->comment('Debit air liter per menit — satuan sama dengan pompas.capacity_lpm agar bisa direkap bersama');
        });
    }

    public function down(): void
    {
        Schema::table('hydrants', function (Blueprint $table) {
            $table->dropColumn(['water_pressure', 'debit_lpm']);
        });
    }
};

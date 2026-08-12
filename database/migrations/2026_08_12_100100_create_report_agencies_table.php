<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot pelibatan OPD pada satu insiden (TASK_27) — pola `report_units`.
 *
 * Kolom snapshot (`agency_name`, `requires_confirmation`, `confirmation_label`) SENGAJA
 * menduplikasi master. Alasannya: master boleh diedit kapan saja (ganti nama instansi, ubah
 * kalimat konfirmasi, matikan OPD), sedangkan catatan insiden yang sudah lewat harus tetap
 * berbunyi seperti saat kejadian — data ini ikut jadi bahan Berita Acara. Tanpa snapshot,
 * mengedit master akan menulis ulang sejarah secara diam-diam.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_agencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->cascadeOnDelete();
            $table->foreignId('agency_id')->constrained('agencies')->cascadeOnDelete();

            // Siapa (operator Pusat Komando) yang melibatkan OPD ini, dan kapan.
            $table->foreignId('notified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('notified_at')->nullable();

            // notified  = permintaan terkirim, belum ada respons
            // responded = OPD menyatakan menerima/merespons
            // declined  = OPD menyatakan tidak bisa menangani
            $table->string('status')->default('notified');

            // Snapshot master saat pelibatan (lihat catatan di atas).
            $table->string('agency_name');
            $table->boolean('requires_confirmation')->default(false);
            $table->string('confirmation_label')->nullable();

            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            // 'opd'      = dikonfirmasi akun instansi itu sendiri
            // 'operator' = dicatatkan Pusat Komando atas laporan lisan/telepon
            // Dua-duanya sah (keputusan user), tapi bobot buktinya beda — karena itu dicatat.
            $table->string('confirmed_source')->nullable();
            $table->text('confirmation_note')->nullable();

            $table->timestamps();

            // Satu OPD hanya sekali per insiden; melepas = menghapus baris, bukan menandai.
            $table->unique(['report_id', 'agency_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_agencies');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pengajuan pembatalan laporan (TASK_91). Petugas yang sudah Meluncur mendapati laporannya
 * dibatalkan pelapor: ia MENGAJUKAN pembatalan beralasan, admin yang memutuskan (TASK_51 -
 * keputusan status laporan = admin). Disetujui = status laporan `dibatalkan`.
 *
 * Tabel sendiri, bukan kolom di `reports`: satu laporan bisa diajukan lebih dari sekali (yang
 * pertama ditolak admin, keadaan berubah, diajukan lagi), dan riwayat itu yang menjawab "siapa
 * mengusulkan, siapa memutuskan". Pengaju & pemutus di-SNAPSHOT (pola mail_messages).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_cancellations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('requester_name')->nullable();
            $table->text('reason');
            // menunggu -> disetujui | ditolak (ReportCancellation::STATUS_*).
            $table->string('status', 20)->default('menunggu');
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('decider_name')->nullable();
            $table->string('decision_note', 500)->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index(['report_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_cancellations');
    }
};

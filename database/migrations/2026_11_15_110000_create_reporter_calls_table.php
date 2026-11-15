<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Panggilan suara Pusat Komando -> pelapor lewat Sisupit (TASK_90, WebRTC). Satu baris = satu
 * panggilan. SDP (offer/answer) disimpan di sini dan diambil lewat HTTP bergerbang - siaran
 * Reverb hanya aba-aba (pola ReportRecordChanged), jadi data jaringan peserta tak pernah lewat
 * channel. Pemanggil di-SNAPSHOT (`caller_name`) seperti jejak lain (pola mail_messages).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reporter_calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->cascadeOnDelete();
            $table->foreignId('caller_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('caller_name')->nullable();
            // NULL = pelapor TAMU (TASK_77), dicapai lewat channel publik bernama rahasia.
            $table->foreignId('callee_user_id')->nullable()->constrained('users')->nullOnDelete();
            // ringing -> answered -> ended (connected_at diisi pemanggil saat suara tersambung).
            $table->string('status', 20)->default('ringing');
            $table->string('end_reason', 20)->nullable();
            $table->string('ended_by', 10)->nullable();
            $table->text('offer_sdp');
            $table->text('answer_sdp')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['report_id', 'status']);
            $table->index(['callee_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reporter_calls');
    }
};

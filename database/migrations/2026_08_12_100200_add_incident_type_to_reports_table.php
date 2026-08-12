<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Simpan jenis kejadian yang selama ini hanya jadi sinyal validasi (TASK_27).
 *
 * Sebelum ini `incident_type` dikirim form lalu DIBUANG: ReportRequest hanya memakainya untuk
 * memutuskan foto/deskripsi wajib atau tidak, dan jenisnya cuma menempel di `title` sebagai
 * teks bebas. Auto-centang OPD ("kalau kebakaran, centang BPBD & PLN") butuh jenis kejadian
 * yang bisa dibaca ulang server saat verifikasi, dan mencocokkan kata di `title` adalah
 * tebakan yang akan salah diam-diam.
 *
 * Nullable & tanpa backfill: laporan lama tidak punya jenis yang bisa dipercaya, jadi mereka
 * tidak memicu rekomendasi otomatis — operator tetap bisa memilih OPD secara manual.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('incident_type')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('incident_type');
        });
    }
};

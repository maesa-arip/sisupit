<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Laporan ganda untuk satu kejadian (TASK_55).
     *
     * DUA kolom penunjuk, dua penulis - pola yang sama dengan `address`/`geo_address`
     * (TASK_49): `duplicate_candidate_of_id` ditulis MESIN saat laporan dibuat ("kemungkinan
     * sama dengan #X"), `merged_into_id` ditulis MANUSIA saat admin memutuskan. Usulan mesin
     * tidak boleh terbaca sebagai keputusan, dan keputusan tidak boleh hilang saat usulannya
     * dihapus.
     *
     * Nullable tanpa backfill: laporan lama tak pernah dinilai ganda atau tidak, dan
     * mengarang nilainya membuat antrean tiba-tiba berisi usulan untuk kejadian yang sudah
     * lama selesai.
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('duplicate_candidate_of_id')->nullable()->after('status')->constrained('reports')->nullOnDelete();
            $table->foreignId('merged_into_id')->nullable()->after('duplicate_candidate_of_id')->constrained('reports')->nullOnDelete();
            $table->foreignId('merged_by')->nullable()->after('merged_into_id')->constrained('users')->nullOnDelete();
            $table->timestamp('merged_at')->nullable()->after('merged_by');
            // Kueri kandidat: satu kabupaten, status aktif, dalam jendela waktu.
            $table->index(['city_code', 'status', 'created_at']);
        });
    }

    /**
     * Laporan berstatus `digabung` dikembalikan ke antrean LEBIH DULU. Tanpa itu kode lama
     * menemukan status yang tak dikenalnya - kamus layar menampilkannya sebagai "tidak
     * dikenal" dan laporannya lenyap dari antrean verifikasi (bentuk #94).
     */
    public function down(): void
    {
        DB::table('reports')->where('status', 'digabung')->update(['status' => 'TERLAPOR']);

        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['city_code', 'status', 'created_at']);
            $table->dropConstrainedForeignId('duplicate_candidate_of_id');
            $table->dropConstrainedForeignId('merged_into_id');
            $table->dropConstrainedForeignId('merged_by');
            $table->dropColumn('merged_at');
        });
    }
};

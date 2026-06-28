<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Status laporan kini bisa bernilai 'ditolak' (lihat ReportActionController::reject).
     * Kolom ini menyimpan jejak penolakan agar laporan hoax/tak valid tetap terarsip &
     * bisa ditelusuri staff, bukan dihapus tanpa jejak.
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('rejected_reason', 500)->nullable()->after('status');
            $table->timestamp('rejected_at')->nullable()->after('rejected_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['rejected_reason', 'rejected_at']);
        });
    }
};

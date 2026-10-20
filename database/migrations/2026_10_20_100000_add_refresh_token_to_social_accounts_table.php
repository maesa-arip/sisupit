<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Refresh token Masuk dengan Apple. Disimpan (terenkripsi lewat cast model) HANYA agar
     * token bisa dicabut ke Apple saat pengguna menghapus akun - kewajiban App Store untuk
     * app yang menawarkan Masuk dengan Apple. Google tidak memakainya (null).
     */
    public function up(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->text('refresh_token')->nullable()->after('provider_name');
        });
    }

    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropColumn('refresh_token');
        });
    }
};

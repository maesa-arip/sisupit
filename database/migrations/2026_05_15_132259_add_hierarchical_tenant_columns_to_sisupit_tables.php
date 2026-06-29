<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Daftar tabel yang akan disuntikkan hierarki wilayah
        $tables = ['users', 'reports', 'pos_pemadams', 'pompas', 'hydrants'];
        // Pastikan tabelnya ada agar tidak error
        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) {
                    // Tambahkan ketiga kolom wilayah (nullable agar data lama tidak error)
                    $table->char('province_code', 2)->nullable()->index()->before('created_at');
                    $table->char('city_code', 4)->nullable()->index()->after('province_code');
                    $table->char('district_code', 7)->nullable()->index()->after('city_code');
                    $table->char('village_code', 10)->nullable()->index()->after('district_code');

                    // Set Foreign Key ke tabel bawaan laravolt/indonesia
                    // $table->foreign('city_code')->references('code')->on('indonesia_cities')->onDelete('cascade');
                    // $table->foreign('district_code')->references('code')->on('indonesia_districts')->onDelete('cascade');
                    // $table->foreign('village_code')->references('code')->on('indonesia_villages')->onDelete('cascade');
                });
            }
        }
    }

    public function down()
    {
        $tables = ['users', 'reports', 'pos_pemadams', 'pompas', 'hydrants'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) {
                    // Drop foreign key dulu, baru drop kolomnya
                    $table->dropForeign(['province_code']);
                    $table->dropForeign(['city_code']);
                    $table->dropForeign(['district_code']);
                    $table->dropForeign(['village_code']);

                    $table->dropColumn(['province_code', 'city_code', 'district_code', 'village_code']);
                });
            }
        }
    }
};

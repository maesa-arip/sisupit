<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Alamat hasil reverse-geocode dari TITIK laporan (TASK_49). Dipisah dari `address`
     * karena kolom itu memikul dua makna sekaligus: patokan yang DIKETIK warga saat lapor,
     * lalu ditimpa alamat MESIN oleh correctLocation() saat responder menggeser pin —
     * sehingga panel "Alamat Presisi" di halaman detail tak dijamin siapa pun dan patokan
     * warga bisa hilang tanpa jejak.
     *
     * Sejak sekarang: mesin menulis ke `geo_address`, manusia tetap memegang `address`.
     *
     * ADITIF & nullable, TANPA backfill — laporan lama berkolom kosong dan halaman detail
     * me-reverse-geocode titiknya sekali saat dibuka sebagai cadangan tampilan (bukan
     * ditulis balik ke DB). 500 karakter mengikuti batas yang sudah dipakai
     * `correctLocation()` untuk `display_name` Nominatim.
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('geo_address', 500)->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('geo_address');
        });
    }
};

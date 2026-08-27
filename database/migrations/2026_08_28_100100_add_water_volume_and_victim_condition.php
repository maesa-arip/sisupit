<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Dua isian baru di Laporan Kegiatan Penyelamatan (TASK_49, permintaan user):
     *
     *  - `report_resolutions.volume_air` — volume air yang dipakai memadamkan. TEKS BEBAS,
     *    bukan angka, mengikuti preseden kolom `kerugian` ("±1jt") di tabel yang sama: yang
     *    ditulis petugas di lapangan biasanya "±3 tangki" atau "2 tangki + 1 suplai PDAM".
     *    Memaksanya jadi bilangan bersatuan tetap hanya membuat isian itu dikosongkan.
     *  - `report_victims.kondisi` — Kondisi Korban (luka bakar ringan / sesak napas / dst.).
     *
     * Keduanya ADITIF & nullable, tanpa backfill: berita acara lama tidak mengarang isi.
     */
    public function up(): void
    {
        Schema::table('report_resolutions', function (Blueprint $table) {
            $table->string('volume_air')->nullable()->after('kerugian');
        });

        Schema::table('report_victims', function (Blueprint $table) {
            $table->string('kondisi')->nullable()->after('alamat');
        });
    }

    public function down(): void
    {
        Schema::table('report_resolutions', function (Blueprint $table) {
            $table->dropColumn('volume_air');
        });

        Schema::table('report_victims', function (Blueprint $table) {
            $table->dropColumn('kondisi');
        });
    }
};

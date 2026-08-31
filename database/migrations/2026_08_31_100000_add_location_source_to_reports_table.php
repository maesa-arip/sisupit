<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Asal-usul TITIK laporan (TASK_52, FINDINGS #104). Sebelum ini `reports` menyimpan
     * lat/lng tanpa satu pun keterangan dari mana titik itu datang, sehingga di halaman
     * detail pin hasil fix GPS presisi ±10 m dan pin yang digeser 8 km oleh pelapor yang
     * sedang di rumah TERLIHAT PERSIS SAMA — keduanya menawarkan tombol "Navigasi ke
     * Lokasi" yang sama tegasnya, dan petugas berangkat ke tempat yang salah tanpa satu pun
     * gejala. Layar mengklaim presisi yang tak dijamin siapa pun (bentuk #95).
     *
     * `reporter_distance_m` = jarak pelapor ↔ pin saat laporan dikirim. Yang disimpan HANYA
     * jaraknya: koordinat pelapor sengaja TIDAK ikut (keputusan user 2026-08-31) — ia PII
     * baru, dan pelapor bisa sedang berada di rumahnya sendiri. Sinyal kepercayaannya utuh
     * tanpa perlu merekam di mana warganya berdiri.
     *
     * `location_accuracy_m` = akurasi fix GPS yang dilaporkan browser. Ia dipisah dari
     * jarak karena menjawab pertanyaan lain: jarak 200 m tidak membuktikan apa pun bila
     * akurasinya sendiri ±1.400 m.
     *
     * ADITIF & nullable, TANPA backfill. Laporan lama dan klien lama (APK WebView/.exe yang
     * belum diperbarui) berkolom kosong, dan layar membacanya sebagai "asal titik tidak
     * tercatat" — BUKAN dijatuhkan ke nilai lain. Cadangan sebuah kamus adalah KLAIM,
     * bukan "tidak dikenal" (pelajaran #94/#90).
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('location_source', 32)->nullable()->index()->after('lng');
            $table->unsignedInteger('location_accuracy_m')->nullable()->after('location_source');
            $table->unsignedInteger('reporter_distance_m')->nullable()->after('location_accuracy_m');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['location_source', 'location_accuracy_m', 'reporter_distance_m']);
        });
    }
};

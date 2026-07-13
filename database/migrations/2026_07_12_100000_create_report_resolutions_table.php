<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Berita Acara / Laporan Kegiatan Penyelamatan yang diisi petugas setelah insiden
     * ditutup. APPEND-ONLY: satu laporan bisa punya BANYAK berita acara — entri
     * `sementara` (data awal) & `final` (setelah investigasi) disimpan terpisah agar
     * bisa dibandingkan. Bukan one-to-one, jadi report_id TIDAK unik (sengaja).
     */
    public function up(): void
    {
        Schema::create('report_resolutions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('sementara'); // sementara | final
            $table->string('jenis_kejadian')->nullable();
            $table->string('sumber_informasi')->nullable();
            $table->dateTime('occurred_at')->nullable(); // Info kejadian: hari/tanggal/pukul
            $table->string('lokasi_alamat')->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('pemilik_nama')->nullable();
            $table->unsignedInteger('pemilik_umur')->nullable();
            $table->string('kerugian')->nullable(); // teks bebas, mis. "±1jt"
            $table->text('tim_atensi')->nullable(); // Tim yg atensi di TKP
            $table->text('kronologi')->nullable();
            $table->timestamps();

            $table->index('report_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_resolutions');
    }
};

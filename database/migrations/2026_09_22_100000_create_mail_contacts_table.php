<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Daftar putih penerima Email Dinas (TASK_56, K4).
     *
     * TABEL SENDIRI, BUKAN kolom di `agencies` — dan ini BUKAN "daftar kedua" yang dilarang
     * #110/#71, sebab yang didata memang konsep lain: `agencies` mendata ORGANISASI dan
     * menjawab "instansi mana yang dilibatkan menangani insiden ini"; tabel ini mendata ORANG
     * (pejabat) dan menjawab "siapa yang boleh dikirimi surat dinas". Memaksa pejabat masuk
     * `agencies` membuat namanya muncul sebagai instansi yang bisa dimintai bantuan saat
     * kebakaran, lewat Agency::recommendedIdsFor(). Uraian lengkap: TASK_56 §3.1.
     *
     * GERBANG KIRIM MEMBACA TEPAT SATU TABEL: yang ini. `agencies.email` tetap sekadar detail
     * kontak instansi, BUKAN izin kirim — dua sumber untuk satu gerbang berarti dua cara
     * mencabut izin dan dua tempat yang bisa menyimpang.
     *
     * `email` sengaja TIDAK unique: SoftDeletes membuat baris terhapus tetap memegang slotnya,
     * dan satu orang bisa sah punya entri di dua kabupaten. Pencegahan ganda dikerjakan saat
     * menyalin dari master OPD (MailContact::tarikDariAgency), bukan oleh constraint.
     */
    public function up(): void
    {
        Schema::create('mail_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('jabatan')->nullable();
            // Instansi asal ditulis sebagai TEKS, bukan foreignId ke `agencies`: penerima surat
            // dinas kebanyakan bukan OPD penanganan insiden, dan menautkannya akan menyeret
            // kembali percampuran dua konsep yang justru dihindari tabel ini.
            $table->string('instansi')->nullable();
            $table->string('email')->index();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();

            $table->char('province_code', 2)->nullable()->index();
            $table->char('city_code', 4)->nullable()->index();
            $table->char('district_code', 7)->nullable()->index();
            $table->char('village_code', 10)->nullable()->index();

            $table->softDeletes();
            $table->timestamps();

            // Kueri gerbang kirim: kontak aktif milik kabupaten pengirim.
            $table->index(['city_code', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_contacts');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jejak Email Dinas yang keluar (TASK_56). APPEND-ONLY, pola TrackingLog: tidak pernah
     * di-update, tidak pernah dihapus. Pertanyaan yang harus bisa dijawab kapan saja adalah
     * "siapa mengirim apa ke siapa" — dan itu hanya bisa dijawab kalau barisnya tak bisa
     * disunting belakangan.
     *
     * PENGIRIM DISIMPAN DUA KALI, dan itu disengaja:
     *  - `user_id` nullOnDelete (penunjuk hidup, untuk menautkan ke akun), dan
     *  - `sender_name` snapshot yang TIDAK ikut berubah/hilang.
     * Kalau hanya `user_id` yang disimpan, menghapus akun membuat jejak audit berbunyi
     * "tidak tercatat" untuk surat yang jelas-jelas pernah terkirim. Pola snapshot yang sama
     * sudah dipakai `report_agencies.agency_name` justru supaya catatan historis tak berubah
     * saat masternya disunting. (TASK_56 §4.1 menulis `user_id` wajib; bentuk dua kolom ini
     * memenuhi maksud itu dengan lebih baik.)
     *
     * Penerima juga SNAPSHOT (`to`/`cc` memuat alamat + nama saat dikirim), bukan foreignId ke
     * `mail_contacts` — kontak bisa dinonaktifkan atau berganti jabatan, dan surat yang sudah
     * terkirim tidak boleh ikut berubah isinya.
     */
    public function up(): void
    {
        Schema::create('mail_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sender_name');
            $table->foreignId('report_id')->nullable()->constrained()->nullOnDelete();

            // Kotak surat pengirim saat itu — tenant bisa berganti alamat, riwayat tidak.
            $table->string('from_email');
            $table->string('from_name')->nullable();

            $table->json('to');
            $table->json('cc')->nullable();
            $table->string('subject');
            $table->longText('body');
            // [{nama, ukuran, mime, hash}] — slice 3. Nullable sejak awal supaya slice 1 tak
            // perlu migrasi kedua untuk kolom yang bentuknya sudah diketahui.
            $table->json('attachment_meta')->nullable();

            $table->string('status')->default('terkirim');
            $table->text('error')->nullable();
            $table->timestamp('sent_at')->nullable();

            $table->char('province_code', 2)->nullable()->index();
            $table->char('city_code', 4)->nullable()->index();
            $table->char('district_code', 7)->nullable()->index();
            $table->char('village_code', 10)->nullable()->index();

            $table->timestamps();

            $table->index(['city_code', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_messages');
    }
};

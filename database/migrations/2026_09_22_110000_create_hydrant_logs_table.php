<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jejak suntingan hydrant resmi (2026-09-22, permintaan user: "tambahkan log edit, siapa
     * yang edit, kapan terakhir di edit, dan bagian mana yang diedit"). Lahir bersamaan dengan
     * dibukanya tambah & edit hydrant untuk PETUGAS - begitu lebih dari satu peran bisa
     * mengubah data aset, pertanyaan "siapa yang mengubah titik ini?" harus bisa dijawab.
     *
     * APPEND-ONLY, pola mail_messages/TrackingLog: tidak pernah di-update.
     *
     * PENYUNTING DISIMPAN DUA KALI, sengaja: `user_id` nullOnDelete (penunjuk hidup) + `user_name`
     * & `user_role` SNAPSHOT. Menghapus akun tak boleh membuat riwayat berbunyi "tidak tercatat",
     * dan peran yang berubah belakangan tak boleh menulis ulang dengan wewenang apa suntingan
     * lama dilakukan.
     *
     * `changes` = [{field, label, old, new}] berisi HANYA kolom yang benar-benar berubah, nilai
     * wilayah sudah berupa NAMA (kode wilayah bukan identitas tempat, #78). Null untuk `dibuat`.
     *
     * hydrant_id cascadeOnDelete: hapus hydrant tetap wewenang admin saja dan tidak termasuk yang
     * diminta dicatat; riwayat tanpa asetnya tak punya halaman untuk ditampilkan.
     */
    public function up(): void
    {
        Schema::create('hydrant_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hydrant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name');
            $table->string('user_role')->nullable();
            $table->string('action', 20);
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['hydrant_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hydrant_logs');
    }
};

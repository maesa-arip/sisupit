<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Dua tambahan pada katalog tenant (TASK_19):
     *
     * 1. `edition` + `features` — paket layanan tiap kabupaten (sewa/beli). Dipakai halaman
     *    Syarat & Ketentuan / Paket & Lisensi untuk menulis klausul yang benar per pelanggan
     *    (sewa = hak pakai berlangganan; beli = lisensi perpetual + hak eksit). Default
     *    'sewa' supaya tenant lama NOL perubahan perilaku. Ini kolom yang direncanakan
     *    TASK_18 slice 1 — dibuat di sini karena halaman legal tak boleh hardcode lisensi;
     *    guard #45 (EnsureTenantHostMatchesStaff) tetap milik TASK_18.
     *
     * 2. Kontak resmi pengendali data (`email_kontak`, `alamat_instansi`,
     *    `penanggung_jawab_data`) — dokumen Kebijakan Privasi wajib menyebut ke mana warga
     *    mengajukan pertanyaan/keberatan atas datanya, dan itu instansi tiap kabupaten,
     *    bukan pengembang.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('edition')->default('sewa')->index()->after('is_active');
            $table->json('features')->nullable()->after('edition');
            $table->string('email_kontak')->nullable()->after('telepon_darurat');
            $table->string('alamat_instansi')->nullable()->after('email_kontak');
            $table->string('penanggung_jawab_data')->nullable()->after('alamat_instansi');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['edition']);
            $table->dropColumn([
                'edition',
                'features',
                'email_kontak',
                'alamat_instansi',
                'penanggung_jawab_data',
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Master OPD/instansi terkait (TASK_27). BPBD, PLN, PMI, Dinkes, Polsek, ... — pihak di luar
 * Damkar yang ikut dikerahkan saat insiden. Ter-scope wilayah via Tenantable (pola `units`),
 * jadi tiap kabupaten mengelola daftar OPD-nya sendiri.
 *
 * Dua kolom di bawah ini yang membuat fitur ini DINAMIS (permintaan user 2026-08-12) — tanpa
 * keduanya, "kebakaran otomatis centang BPBD & PLN" dan "PLN butuh konfirmasi listrik padam"
 * hanya bisa ditulis sebagai `if` bernama instansi di kode, yang berarti tiap OPD baru menuntut
 * deploy ulang:
 *   - default_incident_types : jenis kejadian yang membuat OPD ini TERCENTANG OTOMATIS
 *                              (tetap bisa di-uncentang operator — ini saran, bukan paksaan).
 *   - requires_confirmation  : OPD ini menuntut konfirmasi tindakan di lokasi; kalimatnya
 *     + confirmation_label     diketik admin (PLN: "Listrik sudah dipadamkan di lokasi kejadian").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agencies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Kode pendek opsional (PLN, BPBD) — untuk tampilan ringkas & pencarian saja.
            // SENGAJA tidak dipakai sebagai cabang logika di kode (lihat catatan di atas).
            $table->string('code')->nullable();
            $table->string('category')->nullable();

            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('notes')->nullable();

            // OPD nonaktif tetap tersimpan (riwayat insiden lama menunjuk ke sini), tapi tak
            // lagi muncul sebagai pilihan saat verifikasi.
            $table->boolean('is_active')->default(true);

            // Jenis kejadian (Report::INCIDENT_TYPES) yang memicu auto-centang.
            $table->json('default_incident_types')->nullable();

            $table->boolean('requires_confirmation')->default(false);
            $table->string('confirmation_label')->nullable();

            // Kolom wilayah untuk Tenantable (selaras Unit/Hydrant/Pompa/PosPemadam)
            $table->string('province_code')->nullable();
            $table->string('city_code')->nullable();
            $table->string('district_code')->nullable();
            $table->string('village_code')->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agencies');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Regu & Danru (TASK_60, permintaan user 2026-09-25). Petugas dikelompokkan ke regu yang
     * dipimpin seorang danru (komandan regu); saat insiden, tiap anggota memilih sendiri
     * "Meluncur" atau "Jaga di Kantor", dan halaman detail menampilkan NAMA REGU yang meluncur.
     *
     * Empat bagian, semuanya ADITIF:
     *
     * - `regus`: danru = `leader_id` di baris regu, BUKAN peran Spatie baru. Peran baru menuntut
     *   seeder + migrasi penyelaras + label + setiap gerbang yang membaca peran (#110/#111),
     *   padahal yang dibutuhkan cuma "siapa pemimpin regu ini". Wilayahnya disalin dari akun
     *   danru pada tingkat KABUPATEN (district/village NULL = berlaku sekabupaten menurut
     *   Tenantable hierarkis #60), supaya admin & petugas sekabupaten melihat regu yang sama.
     *
     * - `regu_members`: `user_id` UNIQUE - satu petugas hanya di satu regu. Tanpa itu satu klik
     *   Meluncur tak bisa menjawab "atas nama regu yang mana".
     *
     * - `report_officers.regu_id` + `regu_name`: SNAPSHOT saat tombol ditekan. Riwayat insiden
     *   tak boleh berubah saat regu diganti namanya, anggotanya pindah, atau regunya dihapus
     *   (pola snapshot report_agencies.agency_name). regu_id nullOnDelete, nama tetap tinggal.
     *
     * - `report_jaga_kantor`: siapa yang memilih TINGGAL. SENGAJA bukan status baru di
     *   report_officers: tabel itu dibaca peta, pelacakan GPS, hitungan "masih ada responder
     *   aktif", dan resolve() - status baru di sana wajib disebut di setiap penyaring daftar
     *   hitam (pelajaran TASK_55), dan satu yang tertinggal membuat orang yang jaga kantor
     *   tergambar sebagai marker di peta atau tertimpa jadi "finished". UNIQUE(report_id,
     *   regu_id) = keputusan user "tepat satu orang jaga kantor per regu per kejadian",
     *   ditegakkan database sehingga dua klik bersamaan pun tak bisa menghasilkan dua.
     */
    public function up(): void
    {
        Schema::create('regus', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('leader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->char('province_code', 2)->nullable()->index();
            $table->char('city_code', 4)->nullable()->index();
            $table->char('district_code', 7)->nullable()->index();
            $table->char('village_code', 10)->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('regu_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('regu_id')->constrained('regus')->cascadeOnDelete();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::table('report_officers', function (Blueprint $table) {
            $table->foreignId('regu_id')->nullable()->after('user_id')->constrained('regus')->nullOnDelete();
            $table->string('regu_name')->nullable()->after('regu_id');
        });

        Schema::create('report_jaga_kantor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('regu_id')->nullable()->constrained('regus')->nullOnDelete();
            $table->string('regu_name');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['report_id', 'regu_id']);
            $table->unique(['report_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_jaga_kantor');

        Schema::table('report_officers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('regu_id');
            $table->dropColumn('regu_name');
        });

        Schema::dropIfExists('regu_members');
        Schema::dropIfExists('regus');
    }
};

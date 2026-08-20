<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Hydrant warga berhenti menjadi kembaran skema `hydrants` (permintaan user 2026-08-21).
 *
 * Yang berubah dan KENAPA — semuanya hanya di `hydrant_wargas`, tabel `hydrants` TIDAK
 * disentuh (dua tabel terpisah justru dibeli untuk kebebasan ini, lihat
 * `prompt/docs/PENGECUALIAN_ATURAN.md` #1):
 *
 *   `type`            Dulu konstruksi hydrant (Stick/Jongkok) — kosakata milik hydrant PDAM.
 *                     Hydrant warga bukan hydrant jalanan: ia sumber air swadaya, jadi
 *                     kosakatanya jadi Tandon/Groundtank dan labelnya "Sumber Air".
 *   `status`          Aktif/Perbaikan tidak punya arti di sini: tandon warga tidak "rusak",
 *                     yang ditanya Damkar adalah apakah sudah dimodifikasi supaya bisa
 *                     dihisap mobil pemadam. Nilai baru: Belum Modifikasi / Sudah Modifikasi.
 *   `water_pressure`  DIBUANG. Tekanan air adalah sifat jaringan pipa bertekanan; tandon
 *                     berisi air diam, tak ada yang bisa dinilai.
 *   `debit_lpm`       DIBUANG, diganti `capacity_liter`. Ini BUKAN ganti nama: satuannya
 *                     berubah arti dari aliran (liter/menit) jadi simpanan (liter), dan dua
 *                     satuan itu tidak boleh dijumlahkan. Karena itu angka lama tidak dibawa
 *                     — memindahkannya berarti mengubah 500 lpm jadi 500 liter diam-diam.
 *                     Rekap desa di /admin/pumps ikut dipecah jadi dua angka.
 *
 * Baris lama (fitur ini baru berumur dua hari saat migrasi ditulis) DIKOSONGKAN, bukan
 * ditebak: `type` jadi NULL supaya petugas memilih ulang saat mengedit, `status` diturunkan
 * ke "Belum Modifikasi" yang memang keadaan dasar sebuah tandon terdaftar. Keputusan user
 * 2026-08-21 setelah disodori pilihan "pertahankan angka lama".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hydrant_wargas', function (Blueprint $table) {
            $table->dropColumn(['water_pressure', 'debit_lpm']);
        });

        Schema::table('hydrant_wargas', function (Blueprint $table) {
            $table->unsignedInteger('capacity_liter')->nullable()->after('type')
                ->comment('Kapasitas volume tampungan dalam LITER — simpanan, bukan aliran. Jangan dijumlahkan dengan pompas.capacity_lpm / hydrants.debit_lpm.');

            // Tak ada lagi default: sumber air wajib dipilih petugas (divalidasi di
            // HydrantWargaController), dan default 'Stick' peninggalan hydrant PDAM justru
            // akan menyelundupkan nilai yang sudah tak ada di daftar pilihan.
            $table->string('type')->nullable()->default(null)->change();
            $table->string('status')->default('Belum Modifikasi')->change();
        });

        DB::table('hydrant_wargas')->whereIn('type', ['Stick', 'Jongkok'])->update(['type' => null]);
        DB::table('hydrant_wargas')->whereIn('status', ['Aktif', 'Perbaikan'])->update(['status' => 'Belum Modifikasi']);
    }

    public function down(): void
    {
        Schema::table('hydrant_wargas', function (Blueprint $table) {
            $table->dropColumn('capacity_liter');
        });

        Schema::table('hydrant_wargas', function (Blueprint $table) {
            $table->string('water_pressure', 20)->nullable()->after('type');
            $table->unsignedInteger('debit_lpm')->nullable()->after('water_pressure')
                ->comment('Debit air liter per menit — satuan sama dengan hydrants.debit_lpm & pompas.capacity_lpm');

            $table->string('type')->default('Stick')->change();
            $table->string('status')->default('Aktif')->change();
        });

        DB::table('hydrant_wargas')->whereNull('type')->update(['type' => 'Stick']);
        DB::table('hydrant_wargas')->whereIn('status', ['Belum Modifikasi', 'Sudah Modifikasi'])->update(['status' => 'Aktif']);
    }
};

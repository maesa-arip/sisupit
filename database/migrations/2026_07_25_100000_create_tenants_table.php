<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tenant per kabupaten/kota untuk multi-tenant via subdomain (TASK_17). Ini KATALOG
     * GLOBAL lintas-wilayah (BUKAN model Tenantable): satu baris = satu Damkar kabupaten,
     * di-key `city_code` (kode indonesia_cities, mis. 5171 Denpasar / 5103 Badung) dan
     * `subdomain` (badung.sisupit.com → "badung"). Menyimpan "wajah publik" tiap kabupaten:
     * nama instansi, pejabat, nomor darurat — yang dulu hardcode di config/pejabat.php.
     * Dikelola superadmin lewat form (Admin/Tenants). Routing laporan TIDAK memakai tabel
     * ini — laporan tetap ter-scope city_code dari pin lokasi kejadian.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('subdomain')->unique();            // "denpasar", "badung"
            $table->string('city_code')->unique();            // indonesia_cities.code
            $table->string('province_code')->nullable();
            $table->string('nama_instansi');
            $table->string('pejabat_nama')->nullable();
            $table->string('pejabat_jabatan')->nullable();
            $table->string('pejabat_foto')->nullable();
            $table->string('telepon_darurat')->nullable();    // SAFETY-CRITICAL
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('city_code');
            $table->index('subdomain');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};

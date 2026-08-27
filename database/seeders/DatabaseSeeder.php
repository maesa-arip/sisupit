<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            TenantSeeder::class,
            SkillSeeder::class,
            AgencySeeder::class,
            HydrantSeeder::class,
            PompaSeeder::class,
            PosPemadamSeeder::class,
            // Tandon/groundtank swadaya warga. Dijalankan SESUDAH master banjar terisi bila ada:
            // banjarnya dirujuk lewat NAMA, dan yang tak ketemu menghasilkan banjar_id NULL
            // (dengan peringatan) — bukan tebakan. Master banjar diisi lewat
            // `php artisan sisupit:import-banjar`, bukan lewat seeder, karena daftarnya harus
            // diminta ke BPS/Pemkot dan berbeda per kabupaten.
            HydrantWargaSeeder::class,
            UserTenantSeeder::class,
            ReportSeeder::class,
            ResolvedReportSeeder::class,
            // ReportHelperSeeder::class,
            // ReportOfficerSeeder::class,
            // TrackingLogSeeder::class
        ]);

    }
}

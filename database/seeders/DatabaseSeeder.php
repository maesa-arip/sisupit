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
            SkillSeeder::class,
            HydrantSeeder::class,
            PompaSeeder::class,
            PosPemadamSeeder::class,
            UserTenantSeeder::class,
            ReportSeeder::class,
            ResolvedReportSeeder::class,
            // ReportHelperSeeder::class,
            // ReportOfficerSeeder::class,
            // TrackingLogSeeder::class
        ]);

    }
}

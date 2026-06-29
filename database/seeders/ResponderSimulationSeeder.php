<?php

namespace Database\Seeders;

use App\Models\Report;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

// Seeder snapshot: menulis sekali posisi + jejak responder di tengah rute jalan asli
// menuju TKP untuk laporan aktif terbaru. SENGAJA tidak dipanggil dari DatabaseSeeder
// (memanggil OSRM via jaringan) — jalankan manual saat butuh data demo:
//   php artisan db:seed --class=ResponderSimulationSeeder
// Untuk simulasi yang bergerak live, pakai: php artisan sisupit:simulate-responders
class ResponderSimulationSeeder extends Seeder
{
    public function run(): void
    {
        $report = Report::withoutGlobalScopes()
            ->whereNotIn('status', ['resolved'])
            ->whereNotNull('lat')->whereNotNull('lng')
            ->latest('id')->first();

        if (! $report) {
            $this->command->error('Tidak ada laporan aktif dengan koordinat. Jalankan ReportSeeder dulu.');

            return;
        }

        $this->command->info("Menyimulasikan responden di rute jalan menuju laporan #{$report->id}...");

        Artisan::call('sisupit:simulate-responders', [
            'report' => $report->id,
            '--snapshot' => true,
            '--officers' => 1,
            '--volunteers' => 2,
        ], $this->command->getOutput());
    }
}

<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

class SkillSeeder extends Seeder
{
    /**
     * Master keahlian relawan. Urutan kurasi (bukan alfabet) dipertahankan agar
     * tampil konsisten di editor keahlian dashboard & filter Daftar Relawan.
     */
    public function run(): void
    {
        $skills = [
            'Pemadaman',
            'P3K / Medis',
            'Evakuasi',
            'SAR',
            'Distribusi Air',
            'Logistik',
            'Komunikasi',
            'Pengaturan Lalu Lintas',
        ];

        foreach ($skills as $name) {
            Skill::firstOrCreate(['name' => $name]);
        }
    }
}

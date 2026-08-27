<?php

namespace Database\Seeders;

use App\Models\Banjar;
use App\Models\HydrantWarga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Data contoh tandon/groundtank swadaya warga (permintaan user 2026-08-26).
 *
 * Tabel `hydrant_wargas` kosong sejak dibuat (TASK_30), sehingga kartu "Ringkasan Air Desa",
 * filter status, dan layer SKKL di Peta Pemantauan tak pernah punya isi untuk dilihat —
 * fiturnya ada, buktinya tidak.
 *
 * TIGA ATURAN yang dipatuhi seeder ini, semuanya buah dari FINDINGS #78 (seeder fasilitas
 * pernah MENGARANG kode desa: 33 dari 51 hydrant berkode desa yang tak pernah ada, dan yang
 * sah pun banyak menunjuk desa keliru — tak ada yang menolak apa pun, yang meleset senyap
 * adalah rekap per desa dan visibilitas bagi staf ber-kecamatan):
 *
 *  1. TITIK yang menentukan desa, bukan sebaliknya. Koordinat diambil dari CENTROID desa yang
 *     bersangkutan (`indonesia_villages.meta`) lalu digeser sedikit secara TETAP, jadi pin dan
 *     `village_code` mustahil berselisih. Tak ada koordinat yang dikarang dari nama jalan.
 *  2. Banjar dirujuk lewat NAMA, bukan id. Id `banjars` berbeda di tiap environment (dev diisi
 *     lewat impor, produksi belum tentu), jadi id yang dipaku akan menempel ke banjar yang
 *     SALAH — atau ke desa lain sama sekali. Nama yang tak ditemukan menghasilkan `banjar_id`
 *     NULL, bukan tebakan; kolomnya memang nullable.
 *  3. Rantai kode wilayah diturunkan dari kode desa memakai awalan BPS, bukan diketik ulang.
 *
 * IDEMPOTEN: kunci (name + village_code). Menjalankan ulang memperbarui, tidak menggandakan.
 */
class HydrantWargaSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->tandons() as $row) {
            $desa = DB::table('indonesia_villages')->where('code', $row['village_code'])->first();

            if (! $desa) {
                $this->command?->warn("Desa {$row['village_code']} tidak ada di indonesia_villages - dilewati.");

                continue;
            }

            $meta = json_decode($desa->meta ?? '{}', true);
            $lat = (float) ($meta['lat'] ?? 0);
            $lng = (float) ($meta['long'] ?? 0);

            if ($lat === 0.0 || $lng === 0.0) {
                $this->command?->warn("Desa {$desa->name} tidak punya centroid - dilewati.");

                continue;
            }

            // Geseran TETAP (bukan acak) supaya menjalankan ulang tidak memindahkan pin.
            $lat += $row['geser'][0];
            $lng += $row['geser'][1];

            $banjar = Banjar::withoutGlobalScope('tenant')
                ->where('village_code', $row['village_code'])
                ->where('name', $row['banjar'])
                ->first();

            if (! $banjar) {
                $this->command?->warn("Banjar {$row['banjar']} tak ada di desa {$desa->name} - tandon dibuat tanpa banjar.");
            }

            HydrantWarga::withoutGlobalScope('tenant')->updateOrCreate(
                ['name' => $row['name'], 'village_code' => $row['village_code']],
                [
                    'address' => $row['address'],
                    'type' => $row['type'],
                    'status' => $row['status'],
                    'capacity_liter' => $row['capacity_liter'],
                    'banjar_id' => $banjar?->id,
                    'description' => $row['description'] ?? null,
                    'lat' => round($lat, 6),
                    'lng' => round($lng, 6),
                    'province_code' => substr($row['village_code'], 0, 2),
                    'city_code' => substr($row['village_code'], 0, 4),
                    'district_code' => substr($row['village_code'], 0, 6),
                ]
            );
        }

        $this->command?->info('Hydrant warga contoh: '.HydrantWarga::withoutGlobalScope('tenant')->count().' baris.');
    }

    /**
     * Dua belas tandon tersebar di EMPAT kecamatan Denpasar, semuanya di desa yang master
     * banjarnya sudah terisi. Nama banjar diambil apa adanya dari master hasil impor.
     *
     * Sengaja BERAGAM supaya layar yang membacanya benar-benar teruji: dua jenis sumber air,
     * kedua status modifikasi, kapasitas dari 2.000 sampai 25.000 liter, dan SATU baris
     * berkapasitas NULL agar kolom `unknown_capacity` pada rekap desa ikut terbukti bekerja.
     */
    private function tandons(): array
    {
        return [
            // -- DENPASAR SELATAN --
            ['name' => 'Tandon Banjar Dalem', 'village_code' => '5171012008', 'banjar' => 'Banjar Dalem',
                'address' => 'Jl. Raya Pemogan, Denpasar Selatan', 'type' => 'Tandon',
                'status' => 'Sudah Modifikasi', 'capacity_liter' => 12000, 'geser' => [0.0012, -0.0009],
                'description' => 'Tandon komunal, mulut hisap sudah disesuaikan mobil pemadam.'],
            ['name' => 'Groundtank Ambengan', 'village_code' => '5171011002', 'banjar' => 'Banjar Ambengan',
                'address' => 'Jl. Pulau Moyo, Pedungan', 'type' => 'Groundtank',
                'status' => 'Belum Modifikasi', 'capacity_liter' => 8000, 'geser' => [-0.0008, 0.0014]],
            ['name' => 'Tandon Alas Arum', 'village_code' => '5171011003', 'banjar' => 'Banjar Alas Arum',
                'address' => 'Jl. Sesetan Gang Nusa Indah', 'type' => 'Tandon',
                'status' => 'Belum Modifikasi', 'capacity_liter' => 5000, 'geser' => [0.0015, 0.0011]],
            ['name' => 'Groundtank Dukuh Mertajati', 'village_code' => '5171012007', 'banjar' => 'Banjar Dukuh Mertajati',
                'address' => 'Jl. Tukad Barito, Sidakarya', 'type' => 'Groundtank',
                'status' => 'Sudah Modifikasi', 'capacity_liter' => 25000, 'geser' => [-0.0011, -0.0013],
                'description' => 'Kapasitas terbesar di wilayah, dipakai juga untuk suplai upacara.'],
            ['name' => 'Tandon Abiantimbul', 'village_code' => '5171012010', 'banjar' => 'Banjar Abiantimbul',
                'address' => 'Jl. Danau Poso, Sanur Kauh', 'type' => 'Tandon',
                // Satu-satunya baris tanpa angka: menguji kolom `unknown_capacity` di rekap desa.
                'status' => 'Belum Modifikasi', 'capacity_liter' => null, 'geser' => [0.0009, 0.0016]],

            // -- DENPASAR BARAT --
            ['name' => 'Tandon Alangkajeng Gede', 'village_code' => '5171031007', 'banjar' => 'Banjar Alangkajeng Gede',
                'address' => 'Jl. Gunung Agung, Pemecutan', 'type' => 'Tandon',
                'status' => 'Sudah Modifikasi', 'capacity_liter' => 15000, 'geser' => [0.0013, -0.0010]],
            ['name' => 'Groundtank Banjar Anyar', 'village_code' => '5171031010', 'banjar' => 'Banjar Anyar',
                'address' => 'Jl. Gunung Soputan, Padangsambian', 'type' => 'Groundtank',
                'status' => 'Belum Modifikasi', 'capacity_liter' => 6000, 'geser' => [-0.0014, 0.0008]],
            ['name' => 'Tandon Abian Timbul', 'village_code' => '5171032002', 'banjar' => 'Banjar Abian Timbul',
                'address' => 'Jl. Imam Bonjol, Pemecutan Kelod', 'type' => 'Tandon',
                'status' => 'Belum Modifikasi', 'capacity_liter' => 4000, 'geser' => [0.0010, 0.0012]],
            ['name' => 'Groundtank Batu Bintang', 'village_code' => '5171032004', 'banjar' => 'Banjar Batu Bintang',
                'address' => 'Jl. Batu Bintang, Dauh Puri Kelod', 'type' => 'Groundtank',
                'status' => 'Sudah Modifikasi', 'capacity_liter' => 10000, 'geser' => [-0.0009, -0.0015]],

            // -- DENPASAR TIMUR --
            ['name' => 'Tandon Abian Tubuh', 'village_code' => '5171021003', 'banjar' => 'Banjar Abian Tubuh',
                'address' => 'Jl. WR Supratman, Kesiman', 'type' => 'Tandon',
                'status' => 'Belum Modifikasi', 'capacity_liter' => 7500, 'geser' => [0.0016, 0.0009]],

            // -- DENPASAR UTARA --
            ['name' => 'Groundtank Balun', 'village_code' => '5171042005', 'banjar' => 'Banjar Balun',
                'address' => 'Jl. Gatot Subroto Barat, Pemecutan Kaja', 'type' => 'Groundtank',
                'status' => 'Sudah Modifikasi', 'capacity_liter' => 18000, 'geser' => [-0.0012, 0.0010]],
            ['name' => 'Tandon Benaya', 'village_code' => '5171041009', 'banjar' => 'Banjar Benaya',
                'address' => 'Jl. Ahmad Yani Utara, Peguyangan', 'type' => 'Tandon',
                'status' => 'Belum Modifikasi', 'capacity_liter' => 2000, 'geser' => [0.0011, -0.0014]],
        ];
    }
}

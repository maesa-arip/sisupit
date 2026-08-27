<?php

namespace App\Console\Commands;

use App\Models\Banjar;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Muat master banjar dari berkas CSV (permintaan user 2026-08-26).
 *
 * KENAPA PERINTAH, BUKAN FORM: Denpasar saja punya ±400 banjar dan Bali ±3.900. Mengetiknya
 * satu per satu lewat /admin/banjars bukan jalur yang masuk akal; halaman itu untuk koreksi &
 * tambahan susulan.
 *
 * DARI MANA BERKASNYA: tidak ada unduhan resmi berisi NAMA seluruh banjar — yang dipublikasikan
 * pemerintah (DPMA Bali, Satu Data Bali, Pusat Data Denpasar) hanya rekapitulasi JUMLAH per
 * kecamatan. Nama-namanya diminta ke BPS Kota (banjar = SLS, punya kode) atau Bagian
 * Pemerintahan/Dinas PMD; untuk banjar adat, ke MDA/DPMA. Rekap publik itu tetap berguna:
 * pakai sebagai penguji kelengkapan — jumlah hasil impor per kecamatan harus sama dengan
 * angka resminya.
 *
 * Bentuk CSV (header wajib, urutan kolom bebas):
 *   village_code,name,jenis,code
 *   5171012008,Banjar Tegal Agung,dinas,
 *
 * Dua sifat yang disengaja:
 *   - TANPA --apply tidak ada satu baris pun yang ditulis. Impor master adalah operasi yang
 *     gampang salah berkas; tinjau dulu.
 *   - Baris yang sudah ada (nama sama di desa sama) DIPERBARUI, bukan digandakan. Impor ulang
 *     berkas yang sama karena itu aman dan tidak melipatgandakan daftarnya.
 */
class ImportBanjar extends Command
{
    protected $signature = 'sisupit:import-banjar
                            {file : Berkas CSV/XLSX berkolom nama banjar + desa (kode atau nama)}
                            {--city= : Kode kabupaten/kota untuk mencocokkan NAMA desa (mis. 5171)}
                            {--fuzzy : Terima beda ejaan VOKAL pada nama desa (Klod=Kelod) bila calonnya tunggal}
                            {--apply : Tulis ke database (tanpa ini hanya ditinjau)}';

    protected $description = 'Muat master banjar per desa dari berkas CSV/XLSX';

    public function handle(): int
    {
        $path = $this->argument('file');

        if (! is_file($path)) {
            $this->error("Berkas tidak ditemukan: {$path}");

            return self::FAILURE;
        }

        $rows = $this->readRows($path);

        if ($rows === null) {
            return self::FAILURE;
        }

        $villagesByCode = $this->villageLookup();
        $villagesByName = $this->villageNameLookup();
        $villagesBySkeleton = $this->villageSkeletonLookup();

        $baru = 0;
        $diperbarui = 0;
        $ditolak = [];
        $desaTakDikenal = [];
        $diterimaMirip = [];

        foreach ($rows as $index => $row) {
            $baris = $index + 2; // +1 header, +1 karena manusia menghitung dari 1
            $code = $row['village_code'];

            // Nama desa dipetakan ke kode; berkas dari instansi umumnya menyebut nama, bukan
            // kode. Kode yang "berbentuk sah" tapi tak ada di indonesia_villages tetap ditolak —
            // itu persis yang membuat rekap desa menampilkan angka sebagai judul (FINDINGS #78).
            if ($code === null && $row['village'] !== null) {
                $key = $this->normalize($row['village']);
                $candidates = $villagesByName[$key] ?? [];

                if (count($candidates) === 1) {
                    $code = $candidates[0];
                } elseif (count($candidates) > 1) {
                    $ditolak[] = "baris {$baris}: nama desa '{$row['village']}' ada di lebih dari satu wilayah — pakai --city atau kolom kode desa";

                    continue;
                } else {
                    // Beda ejaan diterima HANYA bila (a) diminta lewat --fuzzy dan (b) rangka
                    // konsonannya sama persis serta calonnya tunggal. Kriteria itu bukan
                    // "mirip-miripan": varian ejaan Bali yang nyata adalah vokal yang hilang
                    // atau muncul (Klod/Kelod, Kaja/Kajaa), sedangkan jarak huruf biasa akan
                    // menyulap "Catur" (desa Badung) jadi "Sanur" — persis cara data salah
                    // masuk tanpa ada yang tahu.
                    $skeleton = $this->skeleton($key);
                    $seEjaan = $villagesBySkeleton[$skeleton] ?? [];

                    if ($this->option('fuzzy') && count($seEjaan) === 1) {
                        $code = $seEjaan[0]['code'];
                        $diterimaMirip[$row['village'].' → '.$seEjaan[0]['name']] = true;
                    } else {
                        $desaTakDikenal[$row['village']] = [
                            'jumlah' => ($desaTakDikenal[$row['village']]['jumlah'] ?? 0) + 1,
                            'usul' => count($seEjaan) === 1 ? $seEjaan[0]['name'] : null,
                        ];

                        continue;
                    }
                }
            }

            if ($code === null) {
                $ditolak[] = "baris {$baris}: tidak ada kode maupun nama desa";

                continue;
            }

            if (! isset($villagesByCode[$code])) {
                $ditolak[] = "baris {$baris}: kode desa {$code} tidak ada di indonesia_villages";

                continue;
            }

            if ($row['jenis'] !== null && ! in_array($row['jenis'], Banjar::JENIS, true)) {
                $ditolak[] = "baris {$baris}: jenis '{$row['jenis']}' bukan ".implode('/', Banjar::JENIS);

                continue;
            }

            $sudahAda = Banjar::withoutGlobalScope('tenant')
                ->where('village_code', $code)
                ->where('name', $row['name'])
                ->exists();

            $sudahAda ? $diperbarui++ : $baru++;

            if (! $this->option('apply')) {
                continue;
            }

            Banjar::withoutGlobalScope('tenant')->updateOrCreate(
                ['village_code' => $code, 'name' => $row['name']],
                [
                    'jenis' => $row['jenis'],
                    'code' => $row['code'],
                    'description' => $row['description'],
                    'is_active' => true,
                    // Rantai wilayah diturunkan dari kode desa memakai aturan awalan BPS yang
                    // sama dengan ResolvesFacilityJurisdiction — tanpa ini Tenantable tak bisa
                    // menyaring banjar per kabupaten.
                    'district_code' => substr($code, 0, 6),
                    'city_code' => substr($code, 0, 4),
                    'province_code' => substr($code, 0, 2),
                ]
            );
        }

        $this->newLine();
        $this->line('Berkas    : '.$path);
        $this->line('Terbaca   : '.count($rows).' baris');
        $this->line('Baru      : '.$baru);
        $this->line('Diperbarui: '.$diperbarui);
        $this->line('Ditolak   : '.(count($ditolak) + array_sum(array_column($desaTakDikenal, 'jumlah'))));

        foreach (array_slice($ditolak, 0, 15) as $pesan) {
            $this->warn('  - '.$pesan);
        }

        // Nama desa yang tak cocok dilaporkan SEKALI beserta jumlah barisnya, bukan per baris:
        // satu kelurahan yang salah eja biasanya menyeret puluhan banjar sekaligus, dan daftar
        // 40 baris identik menyembunyikan bahwa akarnya cuma satu nama.
        if ($desaTakDikenal !== []) {
            $this->newLine();
            $this->warn('Nama desa/kelurahan yang tidak cocok dengan indonesia_villages:');

            foreach ($desaTakDikenal as $nama => $info) {
                $usul = $info['usul']
                    ? "  → beda ejaan vokal dari \"{$info['usul']}\"; ulangi dengan --fuzzy bila benar"
                    : '  → tidak ada desa dengan ejaan serupa di wilayah ini';
                $this->warn("  - {$nama} ({$info['jumlah']} banjar){$usul}");
            }
        }

        if ($diterimaMirip !== []) {
            $this->newLine();
            $this->warn('Beda ejaan yang DITERIMA karena --fuzzy (periksa sekilas):');

            foreach (array_keys($diterimaMirip) as $pasangan) {
                $this->warn('  - '.$pasangan);
            }
        }

        $this->newLine();

        if (! $this->option('apply')) {
            $this->info('Tinjauan saja — belum ada yang ditulis. Ulangi dengan --apply bila sudah benar.');
        } else {
            $this->info('Selesai. Master banjar diperbarui.');
        }

        return self::SUCCESS;
    }

    /**
     * Rangka konsonan sebuah nama: huruf saja, tanpa vokal. "Dauh Puri Klod" dan "Dauh Puri
     * Kelod" menghasilkan rangka yang sama, sedangkan "Catur" dan "Sanur" tidak — itulah yang
     * membuat kriteria ini bisa dipercaya untuk varian ejaan Bali.
     */
    private function skeleton(string $value): string
    {
        return preg_replace('/[^bcdfghjklmnpqrstvwxyz]/', '', strtolower($value));
    }

    /**
     * Rangka konsonan => daftar desa. Dipakai untuk mengusulkan (dan, hanya dengan --fuzzy,
     * menerima) nama yang ejaannya berbeda.
     *
     * @return array<string, array<int, array{code:string,name:string}>>
     */
    private function villageSkeletonLookup(): array
    {
        $map = [];

        foreach ($this->villageLookup() as $code => $name) {
            $map[$this->skeleton((string) $name)][] = ['code' => (string) $code, 'name' => (string) $name];
        }

        return $map;
    }

    /** @return array<string, string> kode desa => nama */
    private function villageLookup(): array
    {
        return DB::table('indonesia_villages')
            ->when($this->option('city'), fn ($q, $city) => $q->where('code', 'like', $city.'%'))
            ->pluck('name', 'code')
            ->all();
    }

    /**
     * Nama desa (dinormalkan) => daftar kode. Sengaja daftar, bukan satu nilai: nama desa TIDAK
     * unik se-Indonesia ("Kuta" ada di Badung & Lombok), jadi kecocokan ganda harus ditolak
     * dengan terang alih-alih diam-diam mengambil yang pertama. `--city` mempersempitnya.
     *
     * @return array<string, array<int, string>>
     */
    private function villageNameLookup(): array
    {
        $map = [];

        foreach ($this->villageLookup() as $code => $name) {
            $map[$this->normalize((string) $name)][] = (string) $code;
        }

        return $map;
    }

    /**
     * Nama kolom yang diterima untuk tiap bidang. Berkas nyata datang dari Pemkot/BPS/MDA
     * dengan judul berbahasa Indonesia dan tak seragam; menolak berkas hanya karena judulnya
     * "Nama Banjar" alih-alih "name" akan membuat perintah ini tak terpakai.
     */
    private const ALIAS = [
        'name' => ['name', 'nama', 'nama banjar', 'banjar'],
        'village_code' => ['village_code', 'kode desa', 'kode kelurahan'],
        'village' => ['village', 'desa', 'kelurahan', 'desa/kelurahan', 'kelurahan/desa'],
        'jenis' => ['jenis', 'jenis banjar'],
        'code' => ['code', 'kode', 'kode sls'],
        'description' => ['description', 'alamat', 'keterangan'],
    ];

    /**
     * @return array<int, array<string, ?string>>|null
     */
    private function readRows(string $path): ?array
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        // XLSX dibaca lewat Laravel Excel yang MEMANG sudah jadi dependensi repo ini (dipakai
        // ekspor laporan), supaya berkas dari Pemkot bisa dimuat apa adanya tanpa langkah
        // konversi manual yang gampang terlewat.
        $raw = $ext === 'csv' ? $this->readCsvRaw($path) : $this->readSpreadsheet($path);

        if ($raw === []) {
            $this->error('Berkas kosong.');

            return null;
        }

        $header = array_map(fn ($col) => $this->normalize((string) $col), array_shift($raw));
        $map = [];

        foreach (self::ALIAS as $field => $aliases) {
            foreach ($header as $i => $col) {
                if (in_array($col, $aliases, true)) {
                    $map[$field] = $i;
                    break;
                }
            }
        }

        if (! isset($map['name'])) {
            $this->error('Kolom nama banjar tidak ditemukan. Header terbaca: '.implode(', ', $header));

            return null;
        }

        if (! isset($map['village_code']) && ! isset($map['village'])) {
            $this->error('Butuh kolom kode desa ATAU nama desa/kelurahan. Header terbaca: '.implode(', ', $header));

            return null;
        }

        $rows = [];

        foreach ($raw as $line) {
            $get = function (string $field) use ($line, $map) {
                if (! isset($map[$field])) {
                    return null;
                }

                $value = trim((string) ($line[$map[$field]] ?? ''));

                return $value === '' ? null : $value;
            };

            if ($get('name') === null) {
                continue;
            }

            $rows[] = [
                'name' => $this->titleCase($get('name')),
                'village_code' => $get('village_code'),
                'village' => $get('village'),
                'jenis' => $get('jenis') ? strtolower($get('jenis')) : null,
                'code' => $get('code'),
                'description' => $get('description'),
            ];
        }

        return $rows;
    }

    /** @return array<int, array<int, mixed>> */
    private function readSpreadsheet(string $path): array
    {
        $collector = new class implements ToArray
        {
            public array $rows = [];

            public function array(array $array)
            {
                $this->rows = $array;
            }
        };

        Excel::import($collector, $path);

        return $collector->rows;
    }

    /** @return array<int, array<int, string>> */
    private function readCsvRaw(string $path): array
    {
        $handle = fopen($path, 'r');
        $rows = [];

        while (($line = fgetcsv($handle)) !== false) {
            if ($line === [null]) {
                continue;
            }

            $rows[] = $line;
        }

        fclose($handle);

        return $rows;
    }

    /** Samakan judul kolom: huruf kecil, spasi tunggal, tanpa BOM Excel. */
    private function normalize(string $value): string
    {
        return preg_replace('/\s+/', ' ', strtolower(trim($value, " \t\n\r\0\x0B\u{FEFF}")));
    }

    /**
     * "BANJAR TENGAH" -> "Banjar Tengah". Berkas dari instansi sering seluruhnya kapital;
     * dibiarkan begitu, nama banjar akan berteriak di setiap dropdown & kartu.
     */
    private function titleCase(string $value): string
    {
        return preg_replace_callback(
            '/\p{L}[\p{L}\p{M}]*/u',
            fn ($m) => mb_convert_case($m[0], MB_CASE_TITLE, 'UTF-8'),
            trim($value)
        );
    }
}

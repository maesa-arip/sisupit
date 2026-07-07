<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HydrantSeeder extends Seeder
{
    public function run()
    {
        $hydrants = [
            // ==========================================
            // 40 HYDRANT KONDISI BAIK (AKTIF)
            // ==========================================
            ['name' => 'Hydrant Stick Maruti', 'address' => 'Jl. A Yani Pertigaan Maruti', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Pura', 'address' => 'Jl. Diponogoro Selatan Pura', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 6" GI | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Suci', 'address' => 'Perempatan Jl. Suci - Jl. Diponogoro Sudut', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 6" GI | Kondisi Bagus'],
            ['name' => 'Hydrant Jongkok Gatsu', 'address' => 'Jl. Gatot Subroto Perempatan Jl. Nangka Sitn', 'status' => 'Aktif', 'type' => 'Jongkok', 'description' => 'Penyadapan Pipa: 6" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Kaliasem', 'address' => 'Jl. Surapati - Kaliasem', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Sulatri', 'address' => 'Jl. Sulatri Titik Ada Lampu Merah', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 4" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Kenyeri', 'address' => 'Perempatan Jl. Kenyeri Lampu Merah', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Nusa Indah', 'address' => 'Perempatan Jl. Nusa Indah-Jl. Wr Supratman Br. Abian Kapas Kaja', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 9" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Hayam Wuruk 1', 'address' => 'Jl. Hayam Wuruk Sebelah Barat Br. Bengkel', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 4" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Gn Agung', 'address' => 'Perempatan Jl. Gn Agung - Jl. Mahendradata Utara Kantor Camat', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Waringin', 'address' => 'Jl. Trenggana Depan Pasar Waringin (Anggabaya)', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 6" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick By Pass KFC', 'address' => 'Jl. By Pass Ngr Rai Depan KFC', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Pemogan 1', 'address' => 'Jl. Pemogan Depan UPTD Perlindungan Perempuan', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Pemogan 2', 'address' => 'Jl. Raya Pemogan Depan Pura Ulun Swi Kepaon', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Sanglah', 'address' => 'Jl. Diponogoro- Jl. Pulau Nias Depan Optik Sanglah', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 6" GI | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Patimura', 'address' => 'Jl. Patimura Barat Jl. Banteng', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Waturenggong', 'address' => 'Jl. Waturenggong Ujung Timur', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Nyangglan', 'address' => 'Jl. Tk Pakerisan Depan Kantor Pasar Nyangglan', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Pesanggaran', 'address' => 'Jl. P Moyo- Jl. Pesanggaran Depan Bank Desa Pedungan', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Poh Gading', 'address' => 'Jl. Tunggul Ametung Depan Pasar Poh Gading', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 8" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Gajah Mada', 'address' => 'Jl. Gajah Mada Perempatan Jl. Sulawesi Kartini', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 4" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Sesetan', 'address' => 'Jl. Raya Sesetan depan Ramayana', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Hasanudin', 'address' => 'Jl. Hasanudin', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Kebo Iwa', 'address' => 'Jl. Kebo Iwa Selatan perempatan Jl Gn Sanghyang', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Peninjoan', 'address' => 'Jl. Padma Pasar Peninjoan', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Badak Agung', 'address' => 'Jl Badak Agung depan Badak Agung VIII', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 6" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Penet', 'address' => 'Penet Ujung Utara', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Arjuna', 'address' => 'Jl. Arjuna Depan Gg. I', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 6" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Hayam Wuruk 2', 'address' => 'Jl. Hayam Wuruk Depan Hotel Suranadi Jl. Kecubung', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 4" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Saelus', 'address' => 'Jl. Pulau Saelus Pertigaan Pulau Singkep', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Antasura', 'address' => 'Jl. Antasura Utara Wr. Mina depan LPD', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 8" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Cok Agung Tresna', 'address' => 'Jl. Cok Agung Tresna dpn Miracle', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Satria', 'address' => 'Jl. Abimanyu Depan Pasar Satria', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Polda Bali', 'address' => 'Jl. Wr Supratman Depan Polda Bali', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Imam Bonjol', 'address' => 'Jl. Imam Bonjol Utara Gg. I', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 6" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Pemogan 3', 'address' => 'Jl. Raya Pemogan Depan Jl. P Bungin', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" PVC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Wangaya', 'address' => 'Jl. Kartini Depan RS Wangaya', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 12" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Sumatra', 'address' => 'Perempatan Jl. Sumatra-Jl. Gajah Mada Sebelah Barat Bank BRI', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 6" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Maruti 2', 'address' => 'Jl. Maruti Barat Depan Pompa Bensin', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 10" AC | Kondisi Bagus'],
            ['name' => 'Hydrant Stick Pemogan 4', 'address' => 'Jl. Raya Pemogan Ujung Selatan dekat By Pass', 'status' => 'Aktif', 'type' => 'Stick', 'description' => 'Penyadapan Pipa: 9" AC | Kondisi Bagus'],

            // ==========================================
            // 11 HYDRANT PERLU PERBAIKAN
            // ==========================================
            ['name' => 'Hydrant Jongkok Jayakarta', 'address' => 'Jl. Jayakarta Depan Koperasi PDAM Badung', 'status' => 'Perbaikan', 'type' => 'Jongkok', 'description' => 'Penyadapan: 4" PVC | Perlu diperbaiki/ diganti'],
            ['name' => 'Hydrant Jongkok Durian', 'address' => 'Jl. Durian Ujung Barat Depan Kopi Veteran', 'status' => 'Perbaikan', 'type' => 'Jongkok', 'description' => 'Penyadapan: 4" AC | Perlu diperbaiki/ diganti'],
            ['name' => 'Hydrant Stick Teuku Umar', 'address' => 'Jl. Teuku Umar Depan RS Kasih Ibu', 'status' => 'Perbaikan', 'type' => 'Stick', 'description' => 'Penyadapan: 12" PVC | Perlu diperbaiki/ diganti'],
            ['name' => 'Hydrant Stick Surapati', 'address' => 'Jl. Surapati Ujung Barat (patung Catur Muka)', 'status' => 'Perbaikan', 'type' => 'Stick', 'description' => 'Penyadapan: 12" AC | Masih Kopling Lama'],
            ['name' => 'Hydrant Stick Udayana', 'address' => 'Jl. Udayana Depan Kodam Udayana', 'status' => 'Perbaikan', 'type' => 'Stick', 'description' => 'Penyadapan: 15" AC | Kepala Hydrant Bocor Bila di Buka'],
            ['name' => 'Hydrant Stick Melati', 'address' => 'Jl. Melati Depan DPRD Kota Denpasar', 'status' => 'Perbaikan', 'type' => 'Stick', 'description' => 'Penyadapan: 4" AC | Tidak Bisa Dibuka'],
            ['name' => 'Hydrant Stick Serangan', 'address' => 'Jl. By Pass Ngr Rai Pertigaan Serangan', 'status' => 'Perbaikan', 'type' => 'Stick', 'description' => 'Penyadapan: 10" PVC | Kepala Hydrant Bocor Bila di Buka'],
            ['name' => 'Hydrant Jongkok Kepundung', 'address' => 'Jl. Kepundung depan Bali Post', 'status' => 'Perbaikan', 'type' => 'Jongkok', 'description' => 'Penyadapan: 6" AC | Perlu diperbaiki/ diganti'],
            ['name' => 'Hydrant Jongkok Kalimantan', 'address' => 'Jl. Kalimantan', 'status' => 'Perbaikan', 'type' => 'Jongkok', 'description' => 'Penyadapan: 4" AC | Perlu diperbaiki/ diganti'],
            ['name' => 'Hydrant Stick Kamboja', 'address' => 'Jl. Kamboja depan SMA Dwi Jendra', 'status' => 'Perbaikan', 'type' => 'Stick', 'description' => 'Penyadapan: 6" AC | Perlu diperbaiki/ diganti'],
            ['name' => 'Hydrant Jongkok Gatsu Tengah', 'address' => 'Jl. Gatsu Tengah Perempatan Nangka', 'status' => 'Perbaikan', 'type' => 'Jongkok', 'description' => 'Penyadapan: 6" PVC | Perlu diperbaiki/ diganti'],
        ];

        // Koordinat asli per hydrant (di-geocode dari alamat via Nominatim lokal, lalu
        // di-hardcode di sini). Sebelumnya lat/lng di-random di sekitar satu titik tetap
        // (-8.65, 115.22) tanpa peduli alamat, sehingga marker tidak pernah cocok lokasi.
        $coords = $this->hydrantCoordinates();

        foreach ($hydrants as $hydrant) {

            // 1. Ekstrak kode wilayah yang akurat dan SAH berdasarkan alamat
            $wilayah = $this->getWilayahCodes($hydrant['address'], $hydrant['name']);

            // 2. Ambil titik asli sesuai nama; fallback ke pusat Denpasar bila tak terpetakan.
            [$lat, $lng] = $coords[$hydrant['name']] ?? [-8.650000, 115.220000];

            DB::table('hydrants')->insert([
                'name' => $hydrant['name'],
                'status' => $hydrant['status'],
                'address' => $hydrant['address'],
                'type' => $hydrant['type'],
                'description' => $hydrant['description'],
                'lat' => $lat,
                'lng' => $lng,

                // 3. Suntikkan kode asli Laravolt Indonesia
                'province_code' => '51', // Bali
                'city_code' => $wilayah['city_code'],
                'district_code' => $wilayah['district_code'],
                'village_code' => $wilayah['village_code'],

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * FUNGSI AUTO-MAPPER KODE WILAYAH KEMENDAGRI (LARAVOLT)
     * Mengubah teks alamat menjadi kode 10 digit yang valid di database.
     */
    private function getWilayahCodes($address, $name)
    {
        $text = strtolower($address.' '.$name);

        // ==========================================
        // KOTA DENPASAR (5171)
        // ==========================================

        // DENPASAR SELATAN (517101)
        if (str_contains($text, 'pemogan') || str_contains($text, 'kepaon')) {
            return ['city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171012003'];
        } // Desa Pemogan
        if (str_contains($text, 'sesetan') || str_contains($text, 'saelus') || str_contains($text, 'singkep')) {
            return ['city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011004'];
        } // Kelurahan Sesetan
        if (str_contains($text, 'pedungan') || str_contains($text, 'pesanggaran') || str_contains($text, 'moyo')) {
            return ['city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011005'];
        } // Kelurahan Pedungan
        if (str_contains($text, 'panjer') || str_contains($text, 'waturenggong') || str_contains($text, 'pakerisan') || str_contains($text, 'nyangglan') || str_contains($text, 'penet')) {
            return ['city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011006'];
        } // Kelurahan Panjer
        if (str_contains($text, 'renon') || str_contains($text, 'cok agung tresna') || str_contains($text, 'niti mandala')) {
            return ['city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011007'];
        } // Kelurahan Renon
        if (str_contains($text, 'serangan')) {
            return ['city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011010'];
        } // Kelurahan Serangan
        if (str_contains($text, 'sanur') || str_contains($text, 'by pass kfc')) {
            return ['city_code' => '5171', 'district_code' => '517101', 'village_code' => '5171011008'];
        } // Kelurahan Sanur

        // DENPASAR TIMUR (517102)
        if (str_contains($text, 'kesiman') || str_contains($text, 'sulatri') || str_contains($text, 'kenyeri') || str_contains($text, 'wr supratman') || str_contains($text, 'polda')) {
            return ['city_code' => '5171', 'district_code' => '517102', 'village_code' => '5171021003'];
        } // Kelurahan Kesiman
        if (str_contains($text, 'sumerta') || str_contains($text, 'nusa indah') || str_contains($text, 'hayam wuruk') || str_contains($text, 'kecubung') || str_contains($text, 'badak agung')) {
            return ['city_code' => '5171', 'district_code' => '517102', 'village_code' => '5171021006'];
        } // Kelurahan Sumerta
        if (str_contains($text, 'dangin puri') || str_contains($text, 'surapati') || str_contains($text, 'kaliasem') || str_contains($text, 'patimura') || str_contains($text, 'banteng') || str_contains($text, 'satria') || str_contains($text, 'abimanyu') || str_contains($text, 'melati') || str_contains($text, 'kepundung') || str_contains($text, 'kamboja')) {
            return ['city_code' => '5171', 'district_code' => '517102', 'village_code' => '5171021008'];
        } // Kelurahan Dangin Puri
        if (str_contains($text, 'penatih') || str_contains($text, 'trenggana') || str_contains($text, 'waringin')) {
            return ['city_code' => '5171', 'district_code' => '517102', 'village_code' => '5171021010'];
        } // Kelurahan Penatih

        // DENPASAR BARAT (517103)
        if (str_contains($text, 'pemecutan') || str_contains($text, 'gajah mada') || str_contains($text, 'sulawesi') || str_contains($text, 'hasanudin') || str_contains($text, 'imam bonjol') || str_contains($text, 'kartini') || str_contains($text, 'wangaya')) {
            return ['city_code' => '5171', 'district_code' => '517103', 'village_code' => '5171031003'];
        } // Kelurahan Pemecutan
        if (str_contains($text, 'dauh puri') || str_contains($text, 'pura') || str_contains($text, 'suci') || str_contains($text, 'diponogoro') || str_contains($text, 'sanglah') || str_contains($text, 'pulau nias') || str_contains($text, 'teuku umar') || str_contains($text, 'arjuna') || str_contains($text, 'sumatra') || str_contains($text, 'kalimantan') || str_contains($text, 'udayana')) {
            return ['city_code' => '5171', 'district_code' => '517103', 'village_code' => '5171031006'];
        } // Kelurahan Dauh Puri
        if (str_contains($text, 'padangsambian') || str_contains($text, 'gn agung') || str_contains($text, 'mahendradata') || str_contains($text, 'kebo iwa') || str_contains($text, 'gn sanghyang')) {
            return ['city_code' => '5171', 'district_code' => '517103', 'village_code' => '5171031009'];
        } // Kelurahan Padangsambian

        // DENPASAR UTARA (517104)
        if (str_contains($text, 'peguyangan') || str_contains($text, 'antasura') || str_contains($text, 'peninjoan') || str_contains($text, 'padma')) {
            return ['city_code' => '5171', 'district_code' => '517104', 'village_code' => '5171041003'];
        } // Kelurahan Peguyangan
        if (str_contains($text, 'ubung') || str_contains($text, 'poh gading') || str_contains($text, 'maruti') || str_contains($text, 'a yani')) {
            return ['city_code' => '5171', 'district_code' => '517104', 'village_code' => '5171041006'];
        } // Kelurahan Ubung
        if (str_contains($text, 'tonja') || str_contains($text, 'gatsu') || str_contains($text, 'gatot subroto') || str_contains($text, 'nangka') || str_contains($text, 'jayakarta') || str_contains($text, 'durian')) {
            return ['city_code' => '5171', 'district_code' => '517104', 'village_code' => '5171041009'];
        } // Kelurahan Tonja

        // DEFAULT FALLBACK JIKA ALAMAT TIDAK DIKENALI
        // Dipusatkan di Kelurahan Dauh Puri (Pusat Kota Denpasar)
        return ['city_code' => '5171', 'district_code' => '517103', 'village_code' => '5171031006'];
    }

    /**
     * Titik asli tiap hydrant, dipetakan dari nama.
     * Di-geocode sekali dari alamat lewat Nominatim lokal (viewbox Kota Denpasar,
     * bounded) lalu di-hardcode agar seeder tidak bergantung layanan geocoding saat
     * dijalankan. Sebagian kecil yang gagal geocode memakai centroid kecamatan yang
     * benar; duplikat di jalan yang sama diberi nudge kecil agar marker tak menumpuk.
     */
    private function hydrantCoordinates(): array
    {
        return [
            'Hydrant Stick Maruti' => [-8.644720, 115.212098],
            'Hydrant Stick Pura' => [-8.667178, 115.224833],
            'Hydrant Stick Suci' => [-8.711644, 115.222850],
            'Hydrant Jongkok Gatsu' => [-8.629475, 115.218557],
            'Hydrant Stick Kaliasem' => [-8.655125, 115.218692],
            'Hydrant Stick Sulatri' => [-8.637084, 115.241682],
            'Hydrant Stick Kenyeri' => [-8.642272, 115.230563],
            'Hydrant Stick Nusa Indah' => [-8.648798, 115.233582],
            'Hydrant Stick Hayam Wuruk 1' => [-8.673218, 115.244679],
            'Hydrant Stick Gn Agung' => [-8.665131, 115.193189],
            'Hydrant Stick Waringin' => [-8.645677, 115.243636],
            'Hydrant Stick By Pass KFC' => [-8.705398, 115.225218],
            'Hydrant Stick Pemogan 1' => [-8.692009, 115.194051],
            'Hydrant Stick Pemogan 2' => [-8.693186, 115.197901],
            'Hydrant Stick Sanglah' => [-8.675688, 115.215257],
            'Hydrant Stick Patimura' => [-8.649174, 115.220029],
            'Hydrant Stick Waturenggong' => [-8.676936, 115.225108],
            'Hydrant Stick Nyangglan' => [-8.704938, 115.226418],
            'Hydrant Stick Pesanggaran' => [-8.717918, 115.211204],
            'Hydrant Stick Poh Gading' => [-8.624536, 115.212679],
            'Hydrant Stick Gajah Mada' => [-8.655867, 115.216878],
            'Hydrant Stick Sesetan' => [-8.677935, 115.215322],
            'Hydrant Stick Hasanudin' => [-8.658914, 115.215808],
            'Hydrant Stick Kebo Iwa' => [-8.630754, 115.185260],
            'Hydrant Stick Peninjoan' => [-8.622666, 115.229954],
            'Hydrant Stick Badak Agung' => [-8.663454, 115.230738],
            'Hydrant Stick Penet' => [-8.673628, 115.244782],
            'Hydrant Stick Arjuna' => [-8.641337, 115.190409],
            'Hydrant Stick Hayam Wuruk 2' => [-8.672718, 115.245279],
            'Hydrant Stick Saelus' => [-8.684869, 115.206654],
            'Hydrant Stick Antasura' => [-8.612063, 115.221612],
            'Hydrant Stick Cok Agung Tresna' => [-8.666995, 115.227810],
            'Hydrant Stick Satria' => [-8.651742, 115.217056],
            'Hydrant Stick Polda Bali' => [-8.647730, 115.235653],
            'Hydrant Stick Imam Bonjol' => [-8.699961, 115.187165],
            'Hydrant Stick Pemogan 3' => [-8.692686, 115.198501],
            'Hydrant Stick Wangaya' => [-8.648476, 115.212834],
            'Hydrant Stick Sumatra' => [-8.665701, 115.193029],
            'Hydrant Stick Maruti 2' => [-8.644220, 115.212698],
            'Hydrant Stick Pemogan 4' => [-8.692186, 115.199101],
            'Hydrant Jongkok Jayakarta' => [-8.635061, 115.213914],
            'Hydrant Jongkok Durian' => [-8.625549, 115.199965],
            'Hydrant Stick Teuku Umar' => [-8.680254, 115.203031],
            'Hydrant Stick Surapati' => [-8.656223, 115.219012],
            'Hydrant Stick Udayana' => [-8.670520, 115.219376],
            'Hydrant Stick Melati' => [-8.654594, 115.222610],
            'Hydrant Stick Serangan' => [-8.725402, 115.231058],
            'Hydrant Jongkok Kepundung' => [-8.652658, 115.220595],
            'Hydrant Jongkok Kalimantan' => [-8.658130, 115.214052],
            'Hydrant Stick Kamboja' => [-8.652559, 115.224505],
            'Hydrant Jongkok Gatsu Tengah' => [-8.635874, 115.220607],
        ];
    }
}

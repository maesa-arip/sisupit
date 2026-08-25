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

        // Kode wilayah per hydrant, dipasangkan ke titik di atas (lihat hydrantRegions()).
        $regions = $this->hydrantRegions();

        foreach ($hydrants as $hydrant) {

            // 1. Ambil titik asli sesuai nama; fallback ke pusat Denpasar bila tak terpetakan.
            [$lat, $lng] = $coords[$hydrant['name']] ?? [-8.650000, 115.220000];

            // 2. Kode wilayah mengikuti TITIK itu, bukan tebakan dari kata di alamat.
            [$districtCode, $villageCode] = $regions[$hydrant['name']] ?? [null, null];

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
                'city_code' => '5171', // Kota Denpasar
                'district_code' => $districtCode,
                'village_code' => $villageCode,

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Kode kecamatan & desa tiap hydrant, dipetakan dari nama — pasangan tetap dari titik di
     * hydrantCoordinates(). Ditentukan sekali lewat reverse-geocode Nominatim lokal atas titik
     * itu, lalu di-hardcode di sini persis seperti koordinatnya, supaya seeder tidak bergantung
     * layanan geocoding saat dijalankan.
     *
     * Sampai 2026-08-25 kode ini ditebak dari KATA di alamat (`getWilayahCodes()`): satu
     * kelurahan untuk tiap kelompok kata kunci, kodenya ditulis tangan. Dua-duanya salah — 33
     * dari 51 kode itu tidak pernah ada di `indonesia_villages`, sehingga rekap air per desa
     * memberi judul berupa angka (FINDINGS #78) — dan pengelompokannya pun terlalu kasar:
     * hydrant di Jl. Surapati, Kaliasem, dan Melati bertetangga di teks tapi berada di tiga desa
     * berbeda. Titik fasilitas jauh lebih tahu tempatnya daripada nama jalan.
     *
     * Menambah hydrant baru = tambahkan barisnya di SINI dan di hydrantCoordinates(); nama yang
     * tidak terdaftar tersimpan tanpa kode wilayah, bukan dipaksa ke desa asal-asalan.
     */
    private function hydrantRegions(): array
    {
        return [
            'Hydrant Stick Maruti' => ['517104', '5171042005'], // Pemecutan Kaja, Denpasar Utara
            'Hydrant Stick Pura' => ['517102', '5171022001'], // Dangin Puri Kelod, Denpasar Timur
            'Hydrant Stick Suci' => ['517101', '5171011003'], // Sesetan, Denpasar Selatan
            'Hydrant Jongkok Gatsu' => ['517104', '5171041004'], // Tonja, Denpasar Utara
            'Hydrant Stick Kaliasem' => ['517102', '5171021010'], // Dangin Puri, Denpasar Timur
            'Hydrant Stick Sulatri' => ['517102', '5171021014'], // Penatih, Denpasar Timur
            'Hydrant Stick Kenyeri' => ['517102', '5171022007'], // Sumerta Kaja, Denpasar Timur
            'Hydrant Stick Nusa Indah' => ['517102', '5171021006'], // Sumerta, Denpasar Timur
            'Hydrant Stick Hayam Wuruk 1' => ['517102', '5171022002'], // Sumerta Kelod, Denpasar Timur
            'Hydrant Stick Gn Agung' => ['517103', '5171032008'], // Tegal Harum, Denpasar Barat
            'Hydrant Stick Waringin' => ['517102', '5171022004'], // Kesiman Petilan, Denpasar Timur
            'Hydrant Stick By Pass KFC' => ['517101', '5171011003'], // Sesetan, Denpasar Selatan
            'Hydrant Stick Pemogan 1' => ['517101', '5171012008'], // Pemogan, Denpasar Selatan
            'Hydrant Stick Pemogan 2' => ['517101', '5171012008'], // Pemogan, Denpasar Selatan
            'Hydrant Stick Sanglah' => ['517103', '5171032004'], // Dauh Puri Kelod, Denpasar Barat
            'Hydrant Stick Patimura' => ['517104', '5171042003'], // Dangin Puri Kaja, Denpasar Utara
            'Hydrant Stick Waturenggong' => ['517101', '5171011004'], // Panjer, Denpasar Selatan
            'Hydrant Stick Nyangglan' => ['517101', '5171011003'], // Sesetan, Denpasar Selatan
            'Hydrant Stick Pesanggaran' => ['517101', '5171011002'], // Pedungan, Denpasar Selatan
            'Hydrant Stick Poh Gading' => ['517104', '5171041009'], // Peguyangan, Denpasar Utara
            'Hydrant Stick Gajah Mada' => ['517104', '5171042006'], // Dauh Puri Kaja, Denpasar Utara
            'Hydrant Stick Sesetan' => ['517103', '5171032004'], // Dauh Puri Kelod, Denpasar Barat
            'Hydrant Stick Hasanudin' => ['517103', '5171032006'], // Dauh Puri Kangin, Denpasar Barat
            'Hydrant Stick Kebo Iwa' => ['517103', '5171032011'], // Padang Sambian Kaja, Denpasar Barat
            'Hydrant Stick Peninjoan' => ['517104', '5171042011'], // Peguyangan Kangin, Denpasar Utara
            'Hydrant Stick Badak Agung' => ['517102', '5171022002'], // Sumerta Kelod, Denpasar Timur
            'Hydrant Stick Penet' => ['517101', '5171011005'], // Renon, Denpasar Selatan
            'Hydrant Stick Arjuna' => ['517103', '5171031010'], // Padangsambian, Denpasar Barat
            'Hydrant Stick Hayam Wuruk 2' => ['517102', '5171022002'], // Sumerta Kelod, Denpasar Timur
            'Hydrant Stick Saelus' => ['517101', '5171011002'], // Pedungan, Denpasar Selatan
            'Hydrant Stick Antasura' => ['517104', '5171042011'], // Peguyangan Kangin, Denpasar Utara
            'Hydrant Stick Cok Agung Tresna' => ['517102', '5171022001'], // Dangin Puri Kelod, Denpasar Timur
            'Hydrant Stick Satria' => ['517104', '5171042002'], // Dangin Puri Kauh, Denpasar Utara
            'Hydrant Stick Polda Bali' => ['517102', '5171021006'], // Sumerta, Denpasar Timur
            'Hydrant Stick Imam Bonjol' => ['517103', '5171032002'], // Pemecutan Kelod, Denpasar Barat
            'Hydrant Stick Pemogan 3' => ['517101', '5171012008'], // Pemogan, Denpasar Selatan
            'Hydrant Stick Wangaya' => ['517104', '5171042006'], // Dauh Puri Kaja, Denpasar Utara
            'Hydrant Stick Sumatra' => ['517103', '5171032008'], // Tegal Harum, Denpasar Barat
            'Hydrant Stick Maruti 2' => ['517104', '5171042006'], // Dauh Puri Kaja, Denpasar Utara
            'Hydrant Stick Pemogan 4' => ['517101', '5171012008'], // Pemogan, Denpasar Selatan
            'Hydrant Jongkok Jayakarta' => ['517104', '5171042006'], // Dauh Puri Kaja, Denpasar Utara
            'Hydrant Jongkok Durian' => ['517104', '5171042008'], // Ubung Kaja, Denpasar Utara
            'Hydrant Stick Teuku Umar' => ['517103', '5171032003'], // Dauh Puri Kauh, Denpasar Barat
            'Hydrant Stick Surapati' => ['517102', '5171021010'], // Dangin Puri, Denpasar Timur
            'Hydrant Stick Udayana' => ['517102', '5171022001'], // Dangin Puri Kelod, Denpasar Timur
            'Hydrant Stick Melati' => ['517104', '5171042001'], // Dangin Puri Kangin, Denpasar Utara
            'Hydrant Stick Serangan' => ['517101', '5171011001'], // Serangan, Denpasar Selatan
            'Hydrant Jongkok Kepundung' => ['517102', '5171021010'], // Dangin Puri, Denpasar Timur
            'Hydrant Jongkok Kalimantan' => ['517103', '5171032006'], // Dauh Puri Kangin, Denpasar Barat
            'Hydrant Stick Kamboja' => ['517104', '5171042001'], // Dangin Puri Kangin, Denpasar Utara
            'Hydrant Jongkok Gatsu Tengah' => ['517104', '5171042003'], // Dangin Puri Kaja, Denpasar Utara
        ];
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

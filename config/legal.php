<?php

/*
|--------------------------------------------------------------------------
| Dokumen Legal & Identitas Penyedia Sistem
|--------------------------------------------------------------------------
|
| Dipakai halaman publik Syarat & Ketentuan, Kebijakan Privasi, Pusat Bantuan,
| Tentang Aplikasi, dan Paket & Lisensi (TASK_19). Pola sama dengan
| config/pejabat.php: nilai bisa di-override lewat .env tanpa mengubah kode,
| supaya pergantian kontak/versi dokumen tidak menuntut rilis baru.
|
| CATATAN PENTING — dua pihak yang berbeda, jangan tertukar:
|   - PENYEDIA SISTEM  = badan hukum pemilik & pengelola SISUPIT (pemilik kode,
|     pemroses data). Sejak 2026-08-07 diisi PT Tawarin Dimana Aja.
|   - INSTANSI (tenant) = Damkar kabupaten/kota, PENGENDALI data warga. Datanya
|     tidak di sini melainkan di tabel `tenants` (nama_instansi, alamat_instansi,
|     email_kontak, penanggung_jawab_data), karena berbeda tiap kabupaten.
|
*/

return [
    'penyedia' => [
        // Badan hukum pemilik/pengelola aplikasi. Sesuaikan dengan yang tertulis di PKS.
        'nama' => env('LEGAL_PENYEDIA_NAMA', 'PT Tawarin Dimana Aja'),

        // Kontak dukungan teknis (bukan kanal darurat — darurat selalu ke nomor instansi).
        'email' => env('LEGAL_PENYEDIA_EMAIL', 'support@sisupit.com'),
        'whatsapp' => env('LEGAL_PENYEDIA_WHATSAPP', null),

        // Kanal legal/kontraktual: pelaporan pelanggaran & verifikasi Pengguna Berkontrak.
        // Terpisah dari `email` supaya keluhan teknis tidak masuk ke antrean hukum.
        'email_legal' => env('LEGAL_PENYEDIA_EMAIL_LEGAL', 'legal@tawarindimanaja.com'),

        // Alamat kantor pusat — ikut menentukan yurisdiksi Pengadilan Negeri di klausul
        // penyelesaian sengketa. WAJIB diisi sebelum dokumen dipakai untuk tanda tangan.
        'alamat' => env('LEGAL_PENYEDIA_ALAMAT', null),
        'telepon' => env('LEGAL_PENYEDIA_TELEPON', null),

        // Jam layanan dukungan sesuai SLA kontrak (bukan jam operasional Damkar).
        'jam_dukungan' => env('LEGAL_JAM_DUKUNGAN', 'Senin–Jumat, 09.00–17.00 WITA'),
    ],

    /*
    | Versi & tanggal berlaku dokumen. Naikkan versi setiap kali isi dokumen berubah
    | secara material — tanggal ini yang tampil sebagai "berlaku sejak" di halaman.
    */
    'dokumen' => [
        // 2.0 = penggabungan draf legal PT Tawarin Dimana Aja (ToS umum + ToS Pengguna
        // Berkontrak) ke halaman Syarat & Ketentuan.
        'syarat_versi' => env('LEGAL_SYARAT_VERSI', '2.0'),
        'syarat_berlaku' => env('LEGAL_SYARAT_BERLAKU', '2026-08-07'),
        'privasi_versi' => env('LEGAL_PRIVASI_VERSI', '1.0'),
        'privasi_berlaku' => env('LEGAL_PRIVASI_BERLAKU', '2026-08-04'),
    ],

    /*
    | Versi aplikasi yang tampil di halaman "Tentang". Diisi manual saat rilis —
    | repo ini tidak memakai tag versi otomatis.
    */
    'aplikasi_versi' => env('APP_VERSION', '1.0.0'),

    // Retensi data operasional (bulan) yang dijanjikan di Kebijakan Privasi.
    'retensi_bulan' => (int) env('LEGAL_RETENSI_BULAN', 24),
];

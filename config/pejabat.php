<?php

/*
|--------------------------------------------------------------------------
| Ucapan Pejabat — Halaman "Laporan Diterima"
|--------------------------------------------------------------------------
|
| Konten yang tampil di layar terima kasih setelah warga selesai melapor
| (Front/Reports/Thanks). Nilai di bawah adalah PLACEHOLDER — silakan ganti
| dengan data pejabat sebenarnya. Bisa juga di-override lewat .env tanpa
| mengubah file ini (mudah saat pejabat berganti / rotasi jabatan).
|
| Foto pejabat: taruh di public/images/ lalu sesuaikan 'foto' (versi ringan
| sudah dikompres di /images/pejabat.jpg).
|
*/

return [
    'nama' => env('PEJABAT_NAMA', 'I Made Tirana, S.H., M.H.'),

    'jabatan' => env(
        'PEJABAT_JABATAN',
        'Kepala Dinas Pemadam Kebakaran dan Penyelamatan Kota Denpasar'
    ),

    'foto' => env('PEJABAT_FOTO', '/images/pejabat.jpg'),

    /*
    | Nomor pos Damkar Denpasar — dipakai tombol "Telepon Damkar" di layar
    | "Laporan Diterima". SAFETY-CRITICAL: pastikan nomor ini aktif. Sumber:
    | pos BPBD/Damkar Kota Denpasar, Jl. Imam Bonjol. Override via .env bila
    | nomor berubah, tanpa rebuild.
    */
    'telepon_darurat' => env('DAMKAR_TELEPON', '0361-223333'),
];

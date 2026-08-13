# Video Panduan Alur Sisupit DAMKAR

Dua versi, isi alur & narasinya sama, keduanya **1920×1080 (Full HD, 16:9)**, tanpa audio,
caption teks di layar:

| Berkas | Tampilan | Durasi | Klip per adegan |
|--------|----------|--------|-----------------|
| `sisupit-alur-lengkap.mp4` | **Desktop** — layar penuh browser | ±2 menit 52 detik | `klip/` |
| `sisupit-alur-lengkap-mobile.mp4` | **Mobile** — aplikasi di dalam bingkai ponsel Galaxy S26 Ultra, seperti diakses dari APK Sisupit | ±2 menit 48 detik | `klip-mobile/` |

Keduanya merekam alur nyata end-to-end: **warga melapor → Pusat Komando menerima →
verifikasi & Broadcast Misi → petugas meluncur → relawan disiagakan & meluncur → tiba di
lokasi → insiden ditutup → Laporan Kegiatan Penyelamatan**.

## Tentang versi mobile

Mockup **Samsung Galaxy S26 Ultra**: layar 471×989 px pada kanvas (rasio ±9:18,9 — memanjang
seperti ponsel masa kini), sudut agak persegi khas seri Ultra, rangka titanium, kamera
punch-hole di tengah. Aplikasi dimuat pada lebar CSS realistis 440 px lalu diskalakan 1,07
agar mengisi tinggi kanvas; Chrome me-raster ulang pada skala itu sehingga teks tetap tajam.
Sisi kanan kanvas 16:9 dipakai untuk caption langkah.

Kesetiaan terhadap APK — bukan sekadar browser yang disempitkan:

- **User-Agent persis seperti APK**: UA WebView Android dengan `"; wv"` dihapus dan
  `" SisupitApp"` ditambahkan, sesuai `MainActivity.java:154-160` di proyek
  `SisupitWebView`. Karena itu aplikasi berperilaku seperti di dalam app — misalnya
  `HomeController::landing` me-redirect dari `/` (halaman promosi publik dilewati) dan
  tombol unduh APK disembunyikan.
- **URL awal `/`**, sama seperti `webUrl` di `MainActivity.java:83`.
- **Splash merah + petir putih** ditampilkan sesaat, meniru `SplashActivity`.
- Yang tampil adalah tata letak mobile aplikasi yang sebenarnya: bilah navigasi bawah,
  tombol "Kirim Laporan Darurat" yang menempel di bawah layar, kartu-kartu versi ponsel.

Yang **bukan** rekaman perangkat sungguhan: bingkai ponsel, bilah status (jam/sinyal/baterai),
dan kartu notifikasi adalah gambar pendukung yang digambar oleh kerangka video. Notifikasi
yang ditampilkan mewakili fitur yang memang ada (sirine darurat dikirim ke ponsel lewat
Firebase), hanya saja notifikasi sistem berada di luar area halaman sehingga tidak bisa ikut
terekam otomasi browser. Mesin ini punya Android SDK tetapi **tidak ada AVD/emulator yang
terpasang** dan tidak ada perangkat tersambung, sehingga merekam APK sungguhan memerlukan
penyiapan emulator + otomasi UI terpisah.

Catatan bahasa: seluruh teks yang tampil di video ditulis untuk **masyarakat dan petugas** —
tanpa istilah teknis (WebView, FCM, broadcast, dsb.) dan tanpa keterangan pembuatan di kartu
pembuka/penutup.

## Isi video

| Bagian | Adegan | Peran |
|--------|--------|-------|
| 00 | Kartu pembuka | — |
| 01 | Form Lapor Darurat: GPS otomatis, pilih jenis kejadian, foto, kirim, halaman terima kasih | Warga Sipil 3 |
| 02 | Notifikasi masuk + buka detail laporan | Petugas Damkar 1 |
| 03 | Panel verifikasi → **Broadcast Misi** → status jadi Terverifikasi | Admin Damkar Denpasar |
| 04 | **Meluncur ke Lokasi** → status Penanganan | Petugas Damkar 1 |
| 05 | Relawan disiagakan → meluncur → **Tiba di Lokasi** | Relawan Bali 2 |
| 06 | Tiba → **Tandai Insiden Selesai** → berita acara terbuka terisi otomatis | Petugas Damkar 1 |
| 07 | Kartu penutup | — |

Klip per adegan tersedia di `klip/` (desktop) dan `klip-mobile/` (mobile), format WebM,
bila ingin dipotong ulang atau disusun berbeda.

## Yang perlu diketahui sebelum dipakai presentasi

1. **Semua pemeran & data adalah akun demo fiktif** (Warga Sipil 3, Petugas Damkar 1,
   Relawan Bali 2, Admin Damkar Denpasar) dari `database/seeders/UserTenantSeeder.php`.
   Tidak ada nama, nomor telepon, atau foto warga sungguhan yang terekam. Foto lampiran
   adalah gambar sintetis bertanda "FOTO DEMO — SIMULASI PELATIHAN".
2. **Kartu notifikasi ponsel digambar oleh kerangka video, bukan tangkapan notifikasi asli.**
   Fiturnya sendiri nyata (sirine darurat dikirim ke ponsel lewat Firebase), tetapi notifikasi
   sistem berada di luar area halaman sehingga tidak bisa ikut terekam otomasi browser. Label
   "ILUSTRASI" yang sempat ada dihapus atas permintaan — kartunya kini tampil seperti
   notifikasi ponsel biasa.
3. **Badge lonceng tidak menyala sendiri secara real-time.** `AppLayout.jsx` membaca
   `unread_notifications_count` dari shared props Inertia tanpa listener Echo maupun
   polling, jadi angkanya baru berubah saat halaman berpindah/dimuat ulang. Yang benar-benar
   real-time hanya halaman detail (`Show.jsx`, channel `report-tracking.{id}`).
4. Rekaman dibuat di lingkungan **lokal** dengan host disamarkan menjadi
   `denpasar.sisupit.com` (dipetakan ke 127.0.0.1 lewat `--host-resolver-rules`), sehingga
   tidak ada satu pun permintaan ke server produksi/staging. Bilah alamat browser sendiri
   tidak pernah ikut terekam — Playwright hanya merekam isi halaman.

## Merekam ulang (mis. setelah UI berubah)

Perkakasnya ada di `perekam/` dan **berjalan di luar repo** (butuh `playwright` +
`ffmpeg-static` via npm; keduanya sengaja tidak ditambahkan ke `package.json` proyek).

```bash
npm i playwright ffmpeg-static && npx playwright install chromium
node perekam/record.mjs                 # versi DESKTOP (target lokal)
node perekam/record-mobile.mjs          # versi MOBILE (bingkai ponsel + UA APK)
SCENES=1 node perekam/record.mjs        # rekam satu adegan saja
```

Perekam mobile menulis `public/__demo_mobile_shell.html` (kerangka 16:9) selama merekam lalu
menghapusnya. Berkas itu harus disajikan server sungguhan — dokumen hasil intersepsi Playwright
dianggap "public address space" sehingga Chrome memblokir muatan iframe ke 127.0.0.1
(`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`).

Prasyarat lingkungan lokal:

- `php artisan serve --port=8000`, `php artisan queue:work` (notifikasi `ShouldQueue`),
  dan `php artisan reverb:start` pada port yang **tidak** bentrok (lihat catatan di bawah).
- Geocoding aktif (`NOMINATIM_BASE_URL`) — wilayah wajib terisi saat membuat laporan.
- Skrip menonaktifkan `public/hot` sementara agar memakai aset build produksi, lalu
  mengembalikannya. Server Vite dev Anda tidak disentuh.

### Catatan penting soal pemilihan pemeran

Petugas & relawan yang dipakai **harus sedesa dengan titik kejadian**: siaran ke relawan
memakai ceiling DESA, dan `User::withinReportJurisdiction()` membandingkan kode wilayah
terspesifik milik user. Preset `staging` di `record.mjs` memakai titik Sanur Kauh karena di
sanalah petugas & relawan demo staging berada — berbeda dari preset lokal (Pemogan).

### Pembatas laju saat mencoba berulang kali

`front.reports.store` dijaga `throttle:report-create` (5 laporan / 10 menit). Saat menguji
adegan 1 berkali-kali, tombol kirim jadi seolah tak berfungsi (permintaan ditolak 429 tanpa
pesan di layar). Jalankan `php artisan cache:clear` untuk menyetel ulang penghitungnya.
Perekam sudah mendeteksi 429/422/5xx dan menggagalkan rekaman agar cacat tak lolos.

### Bentrok port Reverb vs Nominatim

`.env` mengarahkan Reverb dan kontainer `sisupit-nominatim` ke port **8080** yang sama.
Saat Docker menyala, siaran Laravel nyasar ke Apache milik Nominatim dan memunculkan layar
`Internal Server Error` (`BroadcastException`). Lihat `prompt/docs/FINDINGS_LOG.md`.

# TASK_68 — PDF Laporan Kejadian

| Field | Isi |
|-------|-----|
| ID | TASK_68 |
| Severity | P3 |
| Tipe | fitur kecil + DEPENDENSI BARU |
| Sumber | permintaan user 2026-09-29 (dipecah TASK_64-68) |
| Status | DONE (kode) |

---

## 1. Tujuan & keputusan user
"Buatkan format laporan pdf pada Laporan Kejadian". Ditanyakan lebih dulu; user memilih
**dompdf di server** (bukan dialog cetak browser - dialog cetak tak tersedia di APK WebView dan
hasilnya berbeda antar browser), menerima harga dependensi baru.

## 2. Perubahan
- DEPENDENSI: `barryvdh/laravel-dompdf` ^3.1 (+ dompdf/dompdf, php-font-lib, php-svg-lib,
  masterminds/html5, sabberworm/php-css-parser). Dipasang lewat PHP **8.2** (bukan composer
  bawaan mesin ini yang ber-PHP 8.3) supaya lock cocok dengan produksi; diperiksa: 6 paket
  DITAMBAH, NOL paket lama berubah versi. `--ignore-platform-req=ext-redis` hanya karena
  ext-redis lokal (Herd) lebih tua dari yang diminta symfony/cache yang SUDAH terkunci.
- Route `GET /reports/{report}/resolution/{resolution}/pdf` (`reports.resolution.pdf`) ->
  `ReportResolutionController::pdf()`, gerbang BACA `authorizeView()` (staf + pejabat
  sewilayah, sama dengan layar), entri dicari DI DALAM laporannya (404 bila bukan miliknya).
- Template `resources/views/pdf/laporan-kejadian.blade.php`: kop dari tenant wilayah laporan
  (`Tenant::forCity` -> `default()`), nomor LP, lencana SEMENTARA/FINAL (+ "ARSIP - VERSI LAMA"
  untuk entri non-aktif TASK_67), isian, tim atensi, kronologi, tabel korban (TANPA KTP), foto
  (data URI, 3 per baris; dilewati bila server tanpa GD - dokumennya tetap jadi), jejak
  dibuat/terakhir diubah, blok tanda tangan (pembuat + pejabat tenant), kaki "Dicetak ... oleh".
- `Report::nomorLaporan()` - rumus LP dipindah dari `ReportsExport` (kini memanggilnya) supaya
  tidak ada salinan ketiga; kembarannya tetap `reportNumber()` di `lib/utils.js`.
- `Show.jsx`: tombol "PDF" di tiap entri, URL dari prop server `pdf_url`.

## 3. Yang SENGAJA tidak ada
- **KTP korban** - PII bergerbang sendiri; PDF gampang berpindah tangan (alasan yang sama
  dengan Export Excel yang hanya membawa JUMLAH korban). Dijaga test.
- Riwayat perubahan lengkap - hanya "terakhir diubah oleh"; riwayat ada di layar.

## 4. Verifikasi
- [x] `LaporanKejadianPdfTest` BARU (4): unduhan `%PDF-` untuk staf & pejabat; 403 warga &
  staf luar wilayah; 404 entri laporan lain; isi ter-escape & tanpa path KTP. Sabotase cabut
  gerbang MERAH, pulih `cmp`.
- [x] Contoh PDF dirender & diperiksa visual (2 halaman A4 dengan 3 foto; kemudian foto
  diperkecil 3 per baris & blok tanda tangan `page-break-inside: avoid`).
- [x] Suite 610 passed (2918), build lulus.
- [ ] Manual: unduh di browser & APK; periksa GD aktif di server (`php -m | grep gd`) - tanpa GD
  foto tidak ikut (ada keterangan di dokumen).

## 5. Deploy
`git pull` + **`composer install --no-dev`** (composer.lock berubah) - tanpa itu kelas
`Barryvdh\DomPDF\Facade\Pdf` tak ada dan tombol PDF 500. Periksa ekstensi `gd`, `dom`,
`mbstring` di PHP-FPM produksi.

## 6. Rollback
Revert commit; `composer install` ulang dari lock lama.

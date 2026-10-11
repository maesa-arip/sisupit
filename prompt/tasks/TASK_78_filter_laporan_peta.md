# TASK_78 — Filter laporan di /admin/reports & Peta Pemantauan (FINDINGS #202)

| Field | Isi |
|-------|-----|
| ID | TASK_78 |
| Severity | P2 |
| Tipe | fitur + performa |
| Sumber | permintaan user 2026-10-11 ("buatkan filter pada menu admin/reports dan di peta pemantauan, karena semakin lama data akan semakin banyak, buatkan best practicenya") |
| Branch | `feat/report-filters` (dari `feat/bottomnav-apple-design` @312e1802) |
| Status | DONE - lokal, belum dideploy (ADA MIGRASI indeks) |

## 1. Keputusan user (2026-10-11)

- Peta: kejadian AKTIF selalu tampil; riwayat (Selesai/Ditolak/Digabung) dibatasi periode, **bawaan 7 hari**.
- Filter **Kecamatan** ikut (admin/reports + peta).
- **Migrasi indeks** `reports.created_at` disertakan.
- Dikerjakan di **branch baru**.

## 2. Kondisi awal

- `MonitoringMapController::index` memuat SEMUA laporan sepanjang masa (`->get()` tanpa batas, semua kolom);
  chip status di peta hanya menyembunyikan marker di browser. Ukuran respons & jumlah marker tumbuh tanpa batas.
- `/admin/reports` (+ `monitoringIndex` pemantau): hanya cari + status. `?load=` diterima apa adanya
  (`?load=100000` = seluruh tabel). Pencarian tak mengenal nomor laporan (LP-2026-00042) maupun `geo_address`
  (alamat yang tampil di layar).
- Rentang tanggal Export Excel (TASK_65) punya rumus sendiri di `ReportsExport`.

## 3. Rancangan (best practice yang diterapkan)

1. **Saring di server, bukan di browser** - satu rumus `Report::scopeListFilter` (cari + periode + jenis +
   kecamatan) dipakai admin, pemantau, peta, dan Export. Status sengaja tidak di dalamnya (aturannya beda per pemakai).
2. **Masukan dinormalkan, bukan divalidasi 422** - `Report::normalizeListFilters()`: nilai asing dibuang,
   tanggal salah format dibuang, rentang terbalik ditukar, `load` hanya 10/25/50. Halaman daftar yang memantulkan
   galat terbaca "filter tidak jalan".
3. **Periode dalam tanggal WITA** (#134), preset RELATIF (`hari_ini`, `7_hari`, `30_hari`, `90_hari`) atau
   `rentang` (from/to inklusif). Tautan yang dibagikan tetap bermakna.
4. **URL = sumber state** (query string lewat `UseFilter`): bisa dibagikan, Back berfungsi, ganti filter = halaman 1.
5. **Peta: default sempit + batas keras** - aktif selalu ikut, riwayat 7 hari, maks 1.000 marker
   (`MAP_MARKER_LIMIT`), urutan aktif dulu sehingga yang terpotong selalu riwayat terlama; pemberitahuan
   "Menampilkan 1000 kejadian terbaru - persempit periode atau pilih kecamatan" bila terpotong.
6. **Reload parsial** - kejadian jadi prop sendiri (`reports`), semua prop berupa closure: ganti filter peta
   hanya memuat `reports,report_filters`, lapisan fasilitas/relawan tak dihitung ulang.
7. **Kolom seperlunya** di query peta (`select` id, title, address, geo_address, status, lat, lng, created_at).
8. **Indeks** `reports.created_at` untuk superadmin/tingkat provinsi (admin kota sudah dilayani
   `(city_code, status, created_at)`).

## 4. Perubahan

- `app/Models/Report.php` - konstanta `PERIODE_OPTIONS`, `JENIS_FILTER`, `PER_PAGE_OPTIONS`, `MAP_DEFAULT_PERIODE`,
  `MAP_MARKER_LIMIT`, `STATUS_AKTIF`; `scopeFilter` + `geo_address` + nomor LP; `scopeListFilter`, `scopeOfJenis`,
  `periodeRange()`, `normalizeListFilters()`, `districtOptionsFor()` (pilihan kecamatan menurut wilayah efektif:
  akun kecamatan = kosong/disembunyikan, akun kota = kecamatan kotanya, superadmin/provinsi = kecamatan yang punya
  laporan + nama kota).
- `Admin\ReportController::index`, `ReportController::monitoringIndex` - `listFilter`, `load` dibatasi,
  prop `district_options`, `state` memuat semua saringan.
- `Front\MonitoringMapController` - prop `reports` {data, truncated, limit}, `report_filters`, `district_options`,
  `layers` (tanpa `reports`), semua closure. **Kontrak berubah:** `layers.reports` -> `reports.data`.
- `ReportsExport` - rentang tanggal lewat `listFilter` (rumus sama), `rangeStart/rangeEnd` dihapus.
- Migrasi `2026_10_11_120000_add_created_at_index_to_reports_table.php`.
- Frontend: `Components/ReportFilterFields.jsx` (baru, dipakai kedua halaman: pill periode + DatePicker rentang,
  pill jenis, Combobox kecamatan, pill baris per halaman, `activeReportFilters()` untuk chip ringkasan);
  `Admin/Reports/Index.jsx` (tombol Filter + jumlah aktif, chip yang bisa dihapus, Reset, panel inline, kosong =
  "Hapus semua filter"); `Monitoring/Map.jsx` (saringan di blok Kejadian, jumlah per chip status, pemberitahuan
  terpotong, periode 'semua' = "Semua waktu"); `DatePicker` & `ui/combobox` mendapat prop OPSIONAL
  `contentClassName` (peta layar penuh `z-[200]` menutupi popover `z-50`).

## 5. Verifikasi

- Test baru `tests/Feature/Sisupit/ReportListFilterTest.php` (11): periode WITA, rentang inklusif + terbalik,
  jenis (null = kebakaran), kecamatan + pilihan, batas `load` & nilai asing, cari nomor LP, pemantau tetap tanpa
  TERLAPOR, peta aktif lama tetap + riwayat 7 hari, jenis/kecamatan di peta, batas marker memotong riwayat dulu,
  reload parsial tanpa `layers`. Sabotase "aktif selalu tampil" -> test merah, berkas dipulihkan (`cmp`).
- `ReguTest` jalur prop disesuaikan (`reports.data.0`).
- Build `npm run build` lulus. Pint lulus untuk berkas PHP yang disentuh.
- Visual Playwright headless (Chrome, sisupit.test, admin@denpasar.go.id) 1440px & 390px: /admin/reports panel
  Filter + chip, URL `?periode=30_hari&jenis=kebakaran`; Peta Pemantauan saringan di panel Lapisan, URL
  `?periode=30_hari`, tanpa galat konsol. Belum diuji di HP/APK.

## 6. Deploy

ADA MIGRASI (indeks saja, tanpa ubah data): cadangan DB -> kode + `php artisan migrate` bersamaan.

## 7. Di luar scope (dicatat, tidak dikerjakan)

- Pengelompokan marker (Leaflet.markercluster) - butuh library baru; batas 1.000 + filter dirasa cukup dulu.
- Pop-up Export Excel belum menawarkan jenis/kecamatan (sengaja independen dari layar, #141).

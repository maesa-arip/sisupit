# TASK 48 — Laporan ditolak berbunyi "Laporan Terverifikasi" + filter Ditolak
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_48 |
| Severity | P2 |
| Tipe | bugfix |
| Sumber | permintaan user 2026-08-27 → FINDINGS_LOG #94 |
| Status | DONE (kode) — sisa verifikasi visual §6 |

---

## 1. Deskripsi masalah / tujuan

Permintaan user (satu kalimat, dua hal):

1. Di **Verifikasi Laporan** (`/admin/reports`), laporan yang sudah **ditolak** muncul dengan
   nama status yang salah — terbaca sebagai laporan terverifikasi, bukan ditolak.
2. **Tambahkan chip filter "Ditolak"** di halaman itu.

Cakupan diperluas atas persetujuan user (pilihan "a", 2026-08-27): **Peta Pemantauan
diperbaiki sekalian** karena berpenyakit sama dan akarnya satu.

## 2. Reproduce (bukti masalah ada)

- Tolak sebuah laporan (detail insiden → **Tolak**, status jadi `ditolak`, #24).
- Buka `/admin/reports` → chip **Semua** (default `aktif` memang menyembunyikan yang ditolak).
- Baris laporan itu memakai lencana **kuning "Laporan Terverifikasi"**, pin peta kuning.
- Tak ada chip **Ditolak** di deretan filter.
- Buka `/peta-pemantauan` → layer Kejadian: tak ada chip "Ditolak" sama sekali, sehingga
  kejadian yang ditolak tak bisa ditampilkan walaupun servernya mengirimkannya.

Test yang membuktikan (ditulis lebih dulu, TIGA dari empat merah dengan kode lama):
`tests/Feature/Sisupit/ReportStatusDictionaryTest.php`.

## 3. Root cause

- `resources/js/Pages/Admin/Reports/Index.jsx:48` — `STATUS_META` halaman ini (kamus
  **lokal**, ada karena butuh warna pin/titik/legenda yang tak disediakan
  `Components/StatusBadge.jsx`) hanya memuat `TERLAPOR/pending/handling/resolved`.
  `markerStyle()` (baris 91) dan `StatusBadge` lokal (baris 94) sama-sama bercadangan
  `|| STATUS_META.pending`, jadi status tak dikenal **mengaku jadi status lain** alih-alih
  tampil apa adanya — bentuk yang sama dengan #90.
- `STATUS_OPTIONS` (baris 35) juga tak memuat `ditolak` → tak ada chipnya.
- `resources/js/Pages/Monitoring/Map.jsx:23` — `REPORT_STATUS` berhenti di empat status yang
  sama, padahal `MonitoringMapController:26` memang mengirim laporan `ditolak` dan
  `reportHidden` menyembunyikannya sejak awal. Chip dirender DARI daftar itu, jadi tak ada
  saklar untuk menyalakannya.

**Sisi server tidak bersalah:** `Admin\ReportController::index` sudah `where('status', $status)`
generik, dan `ReportsExport::STATUS_LABELS` sudah punya `'ditolak' => 'Ditolak'` sejak TASK_39.

## 4. Rencana fix (perubahan terkecil yang benar)

- `resources/js/Pages/Admin/Reports/Index.jsx` — entri `ditolak` di `STATUS_META` (label
  "Ditolak", abu-abu netral **sewarna `Components/StatusBadge.jsx`**, bukan warna baru);
  `'ditolak'` masuk `STATUS_OPTIONS` + `FILTER_LABEL`; legenda peta dipindah ke konstanta
  `LEGEND_STATUSES` yang ikut memuatnya; konstanta baru `MONITOR_HIDDEN_STATUSES`
  (`TERLAPOR` + `ditolak`) menggantikan saringan `s !== 'TERLAPOR'` untuk pill DAN legenda.
- `resources/js/Pages/Monitoring/Map.jsx` — entri `ditolak` di `REPORT_STATUS` (chip &
  legenda ikut otomatis; tetap **mati saat halaman dibuka**, sesuai perilaku lama).
- `tests/Feature/Sisupit/ReportStatusDictionaryTest.php` — penjaga baru (4 test).
- **Tanpa** perubahan controller/route/migrasi.

## 5. Blast radius

- `Admin/Reports/Index.jsx` melayani **dua** rute: `admin.reports.index` (verifikator) dan
  `front.reports.index` (pemantau: pejabat & relawan, #43). Pemantau **tidak** boleh
  mendapat chip `ditolak` — `ReportController::index:104` menyaring
  `whereNotIn('status', ['TERLAPOR','ditolak'])` di server, jadi chipnya akan selalu kosong
  (pelajaran TASK_45: tab yang selalu kosong terbaca sebagai bug). Itulah sebabnya
  `MONITOR_HIDDEN_STATUSES` ada dan dipakai pill maupun legenda.
- Export Excel ikut chip yang aktif (`admin.reports.export?status=…`) → sudah benar tanpa
  perubahan, dikunci test lama `ReportExportTest`.
- Warna abu-abu `ditolak` menambah satu titik di legenda peta sebaran & Peta Pemantauan;
  tak ada hukum warna yang berubah (merah/kuning/teal/biru tetap seperti sebelumnya).

## 6. Rencana verifikasi

- [x] Baseline test sebelum: **344 passed (1306 assertions)**
- [x] Regression test baru: `ReportStatusDictionaryTest.php` (4 test; 3 dibuktikan merah dulu)
- [x] Test sesudah hijau: **348 passed**
- [x] `vendor/bin/pint` PASS
- [x] `npm run build` lulus
- [ ] **Verifikasi visual manual:**
  1. `/admin/reports` → chip **Ditolak** ada, mengembalikan laporan yang ditolak saja.
  2. Lencananya berbunyi **"Ditolak"** abu-abu (bukan kuning "Laporan Terverifikasi"),
     pin peta & titik legenda abu-abu.
  3. Menu kebab → **Export Excel** saat chip Ditolak aktif → kop berkas berbunyi
     "Filter Status: Ditolak", isinya laporan yang ditolak.
  4. Login **pejabat/relawan** → "Lihat Semua Laporan": chip **Ditolak** dan **Laporan
     Masuk** TIDAK ada, legendanya pun tanpa keduanya.
  5. `/peta-pemantauan` → layer Kejadian punya chip **Ditolak** (mati saat dibuka);
     dinyalakan → marker abu-abu muncul, popupnya berlencana "Ditolak".

## 7. Rollback

Tiga berkas, tanpa migrasi & tanpa perubahan server — `git revert` commit task ini sudah
memulihkan keadaan sebelumnya sepenuhnya.

---

## Acceptance criteria
- [x] Laporan ditolak menyebut dirinya "Ditolak" di kedua layar peta
- [x] Chip filter "Ditolak" ada di Verifikasi Laporan dan berfungsi (dikunci test)
- [x] Pemantau tidak mendapat chip yang selalu kosong
- [x] Tidak ada regresi (344 → 348 passed)
- [x] Dokumen diupdate (`FINDINGS_LOG` #94, `ARCHITECTURE_MAP`, `CLAUDE.md`)

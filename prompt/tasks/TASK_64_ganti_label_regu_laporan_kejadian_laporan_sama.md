# TASK_64 — Tiga ganti label: "Manajemen Regu", "Laporan Kejadian", "Laporan Sama"

| Field | Isi |
|-------|-----|
| ID | TASK_64 |
| Severity | P3 |
| Tipe | fitur kecil (teks UI) |
| Sumber | permintaan user 2026-09-29 (satu pesan berisi 11 permintaan; dipecah TASK_64-68) |
| Status | DONE & TERDEPLOY 2026-09-30 @66b8ee52 ke dev/staging/prod |

---

## 1. Tujuan
Tiga permintaan user yang sama-sama murni TEKS:
1. "Regu dan danru diganti menjadi Manajemen Regu" - judul menu & halaman `/regu`.
2. "Laporan Kegiatan Penyelamatan diubah jadi Laporan Kejadian" - semua teks yang dilihat pengguna.
3. "teks laporan digabung pada pop up export excel diubah jadi laporan sama, di hasil export juga" -
   pilihan status `digabung` di pop-up Export Excel `/admin/reports` + label status & judul kolom di
   berkas `.xlsx`.

## 2. Kondisi awal
- `navItems.js:190`, `Regu/Index.jsx:127,131,393` berbunyi "Regu & Danru".
- `Resolution/Create.jsx:198,632`, `Show.jsx:555,2183`, `Petugas/Dashboard.jsx:338` berbunyi
  "Laporan Kegiatan Penyelamatan".
- Pop-up export membaca label `digabung` dari `FILTER_LABEL` (= `STATUS_META.digabung.label`,
  "Digabung"); `ReportsExport::STATUS_LABELS['digabung']` = "Digabung", judul kolom AJ "Digabung ke".

## 3. Keputusan cakupan
- **"Laporan Sama" HANYA di pop-up export & berkas export**, sesuai kalimat user. Chip filter,
  lencana status, legenda peta tetap "Digabung" - menimpa `STATUS_META.digabung.label` akan
  mengubah semuanya sekaligus, jadi label pop-up ditimpa di `EXPORT_LABEL` saja (kamus yang memang
  khusus pop-up itu). Kolom AJ jadi "Laporan Sama dengan" (isinya nomor laporan induk).
- Nama tabel/route/kelas (`report_resolutions`, `reports.resolution.*`, `ReguController`) TIDAK
  diubah. Komentar kode yang menyebut nama lama dibiarkan (bukan teks pengguna).
- Label "Berita Acara" (kolom export, antrean dashboard petugas) tidak diminta, tidak diubah.

## 4. Perubahan
- `resources/js/Layouts/Partials/navItems.js`, `resources/js/Pages/Regu/Index.jsx` - "Manajemen Regu".
- `resources/js/Pages/Front/Reports/{Show,Resolution/Create}.jsx`, `Pages/Petugas/Dashboard.jsx` -
  "Laporan Kejadian".
- `resources/js/Pages/Admin/Reports/Index.jsx` - `EXPORT_LABEL.digabung = 'Laporan Sama'`.
- `app/Exports/ReportsExport.php` - `STATUS_LABELS['digabung']` & judul kolom AJ.

## 5. Blast radius
Teks saja. Posisi kolom export TIDAK bergeser (hanya judulnya), jadi `ReportClosureActorTest`
(pengunci panjang tiga daftar kolom) tetap berlaku.

## 6. Verifikasi
- [x] Baseline & sesudah: lihat laporan task di STATUS CLAUDE.md
- [x] Test baru di `ReportExportTest`: label "Laporan Sama" & judul kolom "Laporan Sama dengan"
- [x] `npm run build` lulus
- [ ] Visual: menu sidebar/popover "Manajemen Regu"; pop-up export pilihan "Laporan Sama"

## 7. Rollback
Revert commit TASK_64.

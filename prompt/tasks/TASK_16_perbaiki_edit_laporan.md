# TASK 16 — Perbaiki halaman edit laporan (form Publisher salah → form laporan)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_16 |
| Severity | P2 |
| Tipe | bug fungsional + fitur |
| Sumber | ditemukan saat TASK_07 (FINDINGS_LOG #30) |
| Status | FIXED (2026-06-28) — `php artisan test` 113 passed (315 assertions); `npm run build` lulus |

---

## Masalah
`resources/js/Pages/Front/Reports/Edit.jsx` ternyata form **Publisher** (props.publisher,
data.logo, route admin.publishers.index) — sisa scaffolding lama. Field tak cocok
`ReportRequest` → edit laporan tak pernah berfungsi.

## Keputusan user (2026-06-28)
- Scope: konten + kelola foto (judul/deskripsi/patokan + tambah/hapus foto galeri). Lokasi & wilayah TIDAK diubah.
- Akses: pelapor saja & hanya saat status TERLAPOR.

## Fix
- `Reports/Edit.jsx` ditulis ulang (form laporan + galeri foto editable: hapus lama via
  `removed_photos[]`, tambah baru via `photos[]`, maks 6, min 1).
- `ReportController::edit` — `authorizeReportEdit` (owner+TERLAPOR), backfill foto legacy
  ke `report_photos`, load photos. `update` — update title/description/address saja +
  hapus/tambah foto (transaksi) + hitung ulang sampul `photo`; tolak bila foto tersisa < 1.
- `ReportRequest` — region/lat/lng wajib hanya saat POST; `removed_photos[]` divalidasi.
- Tombol **Edit** di `Reports/Show.jsx` (hanya owner & TERLAPOR).

## Verifikasi
- Test `tests/Feature/Sisupit/ReportEditTest.php` (5). `ReportOwnershipTest` disesuaikan
  (staff kini 403 di form edit — edit = pelapor saja).
- 113 passed (315 assertions). `npm run build` lulus.

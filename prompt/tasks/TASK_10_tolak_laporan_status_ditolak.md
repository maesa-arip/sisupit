# TASK 10 — "Tolak Data" berfungsi lagi sebagai status `ditolak` + arsip (bukan hapus)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_10 |
| Severity | P1 |
| Tipe | bug fungsional + perbaikan desain |
| Sumber | review alur end-to-end 2026-06-28 (FINDINGS_LOG #24) |
| Status | FIXED (2026-06-28) — `php artisan test` 94 passed (239 assertions, baseline 90 + 4 baru); `npm run build` lulus |

---

## 1. Deskripsi masalah / tujuan
Tombol "Tolak Data" di panel Verifikasi (`Reports/Show.jsx`) memanggil
`route('reports.destroy', ...)` — nama route yang **tidak ada** (yang terdaftar
`front.reports.destroy`). Ziggy melempar error → tombol Tolak **tidak berfungsi sama
sekali**. Selain itu, walau `Report` sudah pakai `SoftDeletes` (jadi `destroy` bukan
hard-delete), tidak ada status/arsip untuk laporan yang ditolak: laporan yang ditolak
hanya lenyap dari UI tanpa jejak yang bisa ditelusuri staff, dan tak ada pembeda antara
"ditolak staff (hoax)" vs "ditarik pemilik".

Keputusan user (2026-06-28): **Tolak = set status `ditolak` (+ alasan opsional)**, laporan
TETAP tersimpan & terlihat di arsip in-app, dipisah dari endpoint hapus-milik-sendiri.

## 2. Reproduce
1. Login `petugas`/`admin`, buka laporan `TERLAPOR` → klik "Tolak Data".
2. Hasil saat ini: error Ziggy "route 'reports.destroy' is not in the route list" di
   console; laporan tidak berubah. `route:list` mengonfirmasi tak ada `reports.destroy`.

## 3. Root cause
- `resources/js/Pages/Front/Reports/Show.jsx:136` — nama route salah.
- Tidak ada konsep status `ditolak` (Report status: TERLAPOR/pending/handling/resolved).

## 4. Perubahan (ringkas)
Backend:
- Migrasi: tambah `rejected_reason` (nullable) & `rejected_at` (nullable ts) ke `reports`.
- `Report.php`: fillable + cast `rejected_at`.
- `ReportActionController::reject($id)` — role petugas/admin/superadmin, tolak hanya bila
  belum `resolved`, set status `ditolak` + alasan + `rejected_at`.
- `routes/web.php`: `POST /reports/{report}/reject` name `reports.reject`.
- `ReportController::index` — sembunyikan `ditolak` dari feed "Semua Laporan" non-staff
  (sejajar perlakuan `TERLAPOR`).
- `DashboardController` — keluarkan `ditolak` dari `reportsFeed` radar publik.

Frontend:
- `Components/StatusBadge.jsx` + StatusBadge lokal di `Reports/Index.jsx`: tambah `ditolak`.
- `Reports/Show.jsx`: arahkan Tolak ke `reports.reject` + textarea alasan opsional;
  tambah status `ditolak` (label + banner alasan); sembunyikan panel aksi saat `ditolak`.

## 5. Blast radius
- Endpoint `front.reports.destroy` (soft-delete milik sendiri) dibiarkan; tidak dipakai UI
  mana pun saat ini (grep), jadi tak ada UI yang putus.
- Query aktif (dashboard admin/petugas, nearbyEmergencies) sudah `whereIn` daftar status
  yang tak memuat `ditolak` → otomatis terkecuali, tak perlu diubah.

## 6. Verifikasi
- [ ] `php artisan test` baseline 90 passed → sesudah ≥ 90 + test baru hijau
- [ ] Test `tests/Feature/Sisupit/ReportRejectTest.php`: staff tolak → status `ditolak` +
      baris tetap ada + alasan tersimpan; non-staff → 403; tolak laporan `resolved` → 403;
      `ditolak` tak muncul di feed publik tapi pemilik tetap melihatnya.
- [ ] `npm run build` lulus.

## 7. Rollback
Commit fokus; migrasi punya `down()` (drop kolom). `git revert` aman (tak mengubah status
inti, hanya menambah satu status + endpoint).

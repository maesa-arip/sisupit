# TASK 13 — Aksi "Batal Meluncur" (un-respond) bagi responder
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_13 |
| Severity | P2 |
| Tipe | fitur kecil |
| Sumber | review alur end-to-end 2026-06-28 (FINDINGS_LOG #27) |
| Status | FIXED (2026-06-28) — `php artisan test` 104 passed (286 assertions); `npm run build` lulus |

---

## Masalah
Setelah responder menekan "Meluncur" (`en_route`), tak ada cara membatalkan. Salah pencet /
batal berangkat → terkunci `en_route`, peta terus menampilkannya, GPS terus terkirim sampai
staff `resolve`.

## Fix
- `ReportActionController::cancelResponse($id)` — hanya saat baris milik sendiri `en_route`
  (selain itu 403); hapus baris responder (GPS berhenti + hilang dari manifes). Bila tak ada
  lagi responder aktif (`en_route`/`arrived`) & status `handling` → revert `pending` +
  `broadcast(ReportStatusChanged 'pending')`.
- Rute `POST /reports/{report}/cancel-response` (`reports.cancel-response`).
- `Reports/Show.jsx` — tombol "Batal Meluncur" (outline) di bawah "Tiba di Lokasi" saat `en_route`.

## Verifikasi
- Test `tests/Feature/Sisupit/ReportCancelResponseTest.php` (3): cancel en_route → hapus +
  revert pending; tetap handling bila responder lain aktif; tak bisa cancel setelah arrived (403).
- 104 passed (286 assertions). `npm run build` lulus.

## Residual (minor)
Marker responder yang membatalkan baru hilang dari peta perangkat LAIN setelah refresh (tak ada
event hapus-marker; sama dengan keterbatasan responder baru belum muncul live). Status sudah
real-time (#28/TASK_14).

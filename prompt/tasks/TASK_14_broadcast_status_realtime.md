# TASK 14 — Broadcast perubahan status laporan (real-time tanpa refresh)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_14 |
| Severity | P2 |
| Tipe | fitur real-time |
| Sumber | review alur end-to-end 2026-06-28 (FINDINGS_LOG #28) |
| Status | FIXED (2026-06-28) — `php artisan test` 98 passed (264 assertions); `npm run build` lulus |

---

## Masalah
Tracking lokasi real-time (Reverb), tapi transisi status laporan
(TERLAPOR→pending→handling→resolved/ditolak) tidak disiarkan. Halaman `Reports/Show`
yang terbuka di perangkat lain (pelapor/responder/komando) baru lihat status baru setelah
refresh; GPS responder baru berhenti setelah props segar.

## Fix
- `app/Events/ReportStatusChanged.php` (baru) — `ShouldBroadcastNow`, `PrivateChannel('report-tracking.{id}')` (channel yang sama dengan tracking), payload reportId/status/rejectedReason.
- `ReportActionController` — `broadcast(new ReportStatusChanged(...))` di approve (pending), reject (ditolak+reason), takeAction saat transisi pending→handling, resolve (resolved).
- `Reports/Show.jsx` — `report.status`/`report.rejected_reason` → state `reportStatus`/`rejectedReason` (sync dari props + update via listener `.listen('ReportStatusChanged')`).

## Verifikasi
- Test `tests/Feature/Sisupit/ReportStatusBroadcastTest.php` (2) — `Event::fake([ReportStatusChanged])` + `Notification::fake()`.
- 98 passed (264 assertions). `npm run build` lulus.

## Catatan
Real-time bergantung Reverb aktif di prod (`BROADCAST_CONNECTION=reverb`). Channel auth
`report-tracking.{id}` sudah ada (`routes/channels.php`), event baru tak mengubahnya.

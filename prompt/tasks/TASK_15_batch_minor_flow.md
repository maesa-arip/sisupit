# TASK 15 — Batch minor alur respons (P3 cleanup)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_15 |
| Severity | P3 |
| Tipe | cleanup |
| Sumber | review alur end-to-end 2026-06-28 (FINDINGS_LOG #29) |
| Status | FIXED (2026-06-28) — `php artisan test` 108 passed (300 assertions); `npm run build` lulus |

---

## Item & fix
1. **`report->category` dead reference** — `EmergencyAlertNotification` (toFcm & toWebPush)
   `strtoupper($this->report->category ?? 'KEBAKARAN')` → literal `'🚨 DARURAT KEBAKARAN!'`
   (kolom `category` tak ada di tabel reports; selalu jatuh ke fallback).
2. **Aksi tak cek status** — guard di `ReportActionController`: `approve` hanya bila `TERLAPOR`
   (cegah approve ganda); `takeAction`/`arrive` 403 bila status `resolved`/`ditolak`.
3. **Casing import** — `@/components/` → `@/Components/` di 11 file (folder asli `Components`)
   agar tak jadi jebakan build di FS case-sensitive (VPS Linux).

## Verifikasi
- Test guard +2 di `ReportActionAuthorizationTest`. 108 passed (300 assertions).
- `npm run build` lulus (casing OK di Vite).

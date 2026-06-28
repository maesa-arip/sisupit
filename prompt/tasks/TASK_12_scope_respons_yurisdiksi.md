# TASK 12 — Batasi take-action/arrive ke wilayah laporan
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_12 |
| Severity | P2 |
| Tipe | perbaikan otorisasi (multi-tenant) |
| Sumber | review alur end-to-end 2026-06-28 (FINDINGS_LOG #26) |
| Status | FIXED (2026-06-28) — `php artisan test` 101 passed (271 assertions) |

---

## Masalah
`approve` menyiarkan notifikasi hanya ke relawan siaga di wilayah, dan feed dashboard
ter-scope. Tapi `take-action`/`arrive` hanya cek `hasAnyRole` + `withoutGlobalScopes` →
relawan/petugas dari wilayah lain bisa join insiden mana pun via POST langsung.

## Keputusan user (2026-06-28)
Batasi ke wilayah laporan (TANPA wajib siaga).

## Fix
- `ReportActionController::ensureWithinJurisdiction(Report, $user)` — superadmin & admin
  nasional (tanpa kode wilayah) bypass; selain itu ambil level terdalam responder
  (village→district→city→province) dan abort(403) bila `report->{column}` ≠ kode responder.
  Dipanggil di awal `takeAction` & `arrive` (re-check setelah `withoutGlobalScopes`, ATURAN EMAS #7).
- `correct-location`/`update-location` tak perlu cek (hanya dipakai responder aktif yang sudah lolos take-action).

## Verifikasi
- Test `tests/Feature/Sisupit/ReportResponderJurisdictionTest.php` (3): sewilayah boleh;
  beda desa → 403 (take-action & arrive); petugas kabupaten yang mencakup laporan boleh.
- `ReportActionAuthorizationTest` diberi `village_code` pada laporan (positif-case lolos).
- 101 passed (271 assertions). Tanpa perubahan frontend (feed & Show sudah ter-scope wilayah).

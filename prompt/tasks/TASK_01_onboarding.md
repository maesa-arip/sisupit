# TASK 01 — ONBOARDING / PEMETAAN CODEBASE (READ-ONLY)
# Task pertama wajib sebelum perbaikan apa pun

| Field | Isi |
|-------|-----|
| ID | TASK_01 |
| Severity | — (fondasi) |
| Tipe | investigasi (read-only) |
| Status | **DONE** (2026-06-25) |

---

## Tujuan
Memahami aplikasi existing dan menuangkannya ke dokumen, agar task perbaikan
berikutnya aman. **Tidak mengubah kode aplikasi sama sekali.**

Dijalankan via `_PROMPT_KIT_EXISTING/ONBOARD_PROMPT.md`.

## Yang dihasilkan
- [x] `CLAUDE.md` (root) terisi: stack, perintah build/test/run/lint, aturan emas, STATUS
- [x] `prompt/docs/ARCHITECTURE_MAP.md`: modul & tanggung jawab, alur request, entitas+relasi,
      daftar endpoint/route (107 route), mekanisme auth/otorisasi
- [x] `prompt/docs/CONVENTIONS.md`: pola yang HARUS ditiru + anti-pola yang ada di repo
- [x] `.claude/skills/sisupit-ui/SKILL.md`: diturunkan dari komponen UI nyata (file referensi
      konkret)
- [x] `prompt/docs/FINDINGS_LOG.md`: 10 temuan baru (1× P0, 1× P1, 4× P2, 4× P3) tanpa diperbaiki

## Metode (untuk jejak audit)
- `composer.json`/`package.json` dibaca untuk stack & versi nyata (bukan asumsi)
- `php artisan route:list` dijalankan → 107 route diverifikasi
- `php artisan test` dijalankan (read-only) → baseline 65 passed, 164 assertions, 0 merah
- `routes/admin.php`, `routes/web.php`, `ReportActionController.php`, `UserController.php`,
  `DashboardController.php`, `Tenantable.php`, `HandleInertiaRequests.php`,
  `AppServiceProvider.php` dibaca penuh
- 2 sub-investigasi read-only (Explore agent) untuk sampling konvensi frontend
  (resources/js) dan backend (model/migration/policy/rate-limiter), masing-masing dengan
  citation file:line yang diverifikasi ulang sebelum dipakai

## Pertanyaan terbuka untuk user (lihat juga FINDINGS_LOG.md)
1. ~~**FINDINGS_LOG #1 (P0)**~~ — **Dijawab user (2026-06-25): self-service.** Sudah
   diperbaiki di TASK_02.
2. ~~**FINDINGS_LOG #2 (P1)**~~ — **Dijawab user (2026-06-25): per-wilayah sesuai tenant.**
   Sudah diperbaiki di TASK_03.
3. `?` di `prompt/docs/ARCHITECTURE_MAP.md`/`AUDIT_CHECKLIST.md`: beberapa item (CORS/header
   security, console.log sweep, npm/composer audit, N+1 query menyeluruh) belum diaudit
   tuntas — perlu task audit susulan kalau prioritas.

## Acceptance criteria
- [x] Semua dokumen di atas terisi & merujuk path file nyata
- [x] Top temuan per severity terangkum di FINDINGS_LOG
- [x] Daftar pertanyaan terbuka untuk hal yang ambigu disampaikan ke user (lihat atas)
- [x] **Nol perubahan pada kode aplikasi** (hanya dokumen di `prompt/`, `.claude/skills/`,
      `CLAUDE.md` yang ditulis; `php artisan route:list`/`php artisan test` adalah
      operasi baca, tidak mengubah state aplikasi/DB karena testing pakai SQLite in-memory)

# TASK 01 — ONBOARDING / PEMETAAN CODEBASE (READ-ONLY)
# Task pertama wajib sebelum perbaikan apa pun

| Field | Isi |
|-------|-----|
| ID | TASK_01 |
| Severity | — (fondasi) |
| Tipe | investigasi (read-only) |
| Status | TODO |

---

## Tujuan
Memahami aplikasi existing dan menuangkannya ke dokumen, agar task perbaikan
berikutnya aman. **Tidak mengubah kode aplikasi sama sekali.**

> Cara cepat: paste `ONBOARD_PROMPT.md` — ia mengotomasi seluruh task ini.

## Yang harus dihasilkan
- [ ] `CLAUDE.md` terisi: stack, perintah build/test/run/lint, aturan emas, STATUS
- [ ] `docs/ARCHITECTURE_MAP.md`: modul & tanggung jawab, alur request, entitas+relasi,
      daftar endpoint/route, mekanisme auth/otorisasi
- [ ] `docs/CONVENTIONS.md`: pola yang HARUS ditiru + anti-pola yang ada di repo
- [ ] `.claude/skills/{{APP_SLUG}}-ui/SKILL.md`: diturunkan dari komponen UI nyata
      (cantumkan path file referensi yang benar-benar ada)
- [ ] `docs/FINDINGS_LOG.md`: temuan awal (P0–P3) tanpa diperbaiki

## Aturan
- Tentukan fakta dari file nyata (manifest, routing, migration) — bukan asumsi.
  Tandai `?` jika tak yakin dan tanyakan ke user.
- Jalankan test hanya untuk membaca status (read-only) jika aman; jangan ubah apa pun.

## Acceptance criteria
- [ ] Semua dokumen di atas terisi & merujuk path file nyata
- [ ] Top temuan per severity terangkum di FINDINGS_LOG
- [ ] Daftar pertanyaan terbuka untuk hal yang ambigu disampaikan ke user
- [ ] **Nol perubahan pada kode aplikasi**

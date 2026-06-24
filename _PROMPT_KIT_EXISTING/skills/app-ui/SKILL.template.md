---
name: {{APP_SLUG}}-ui
description: >-
  Existing UI/UX conventions for the {{APP_NAME}} frontend, reverse-engineered from
  the code that is already in `frontend/` (or the app's UI folder). Use this skill
  WHENEVER editing, fixing, or reviewing any {{APP_NAME}} frontend screen, component,
  form, layout, or list — including when the user only says "fix this page", "match
  the existing style", "make it consistent", or names a file under the UI source.
  The point is to MATCH what is already there (tokens, status primitives, form
  pattern, error handling) so fixes blend in, not introduce a new style.
---

# {{APP_NAME}} Frontend Conventions (existing app)

This skill captures **how the {{APP_NAME}} frontend is already built**, so any edit
matches it. The rule for an existing app is **conform, don't reinvent**: copy the
dominant pattern in the same folder; only introduce something new when nothing fits,
and say so.

> Diturunkan dari kode nyata saat onboarding. Setiap pola di bawah harus menunjuk
> **file referensi yang benar-benar ada di repo ini** (isi path-nya).

## Stack terdeteksi
<!-- ISI dari onboarding: framework, styling, form lib, data fetching, icon, dll. -->
```
{{STACK_FRONTEND}}
```

## Pola yang HARUS ditiru

| Kebutuhan | Pola repo ini | File patokan |
|-----------|---------------|--------------|
| Pemanggilan API | <!-- service layer / hook / fetch langsung --> | `path` |
| Loading state | <!-- komponen/teknik yang dipakai --> | `path` |
| Empty state | <!-- --> | `path` |
| Error state | <!-- --> | `path` |
| Form & validasi | <!-- lib + cara map error server --> | `path` |
| Warna/token | <!-- token CSS / tailwind / hex --> | `path` |
| Konfirmasi destruktif | <!-- dialog komponen / confirm() --> | `path` |
| Notifikasi | <!-- toast lib / alert --> | `path` |
| Layout & navigasi | <!-- per role? responsive? --> | `path` |
| Format uang/tanggal | <!-- helper --> | `path` |

## Aturan saat mengedit UI di repo ini

1. **Tiru file patokan** di tabel atas, bukan pola dari project lain.
2. **Jangan introduksi library/komponen baru** untuk perbaikan kecil — pakai yang ada.
3. **Setiap fetch tetap punya loading/empty/error** sesuai pola repo; kalau halaman
   yang kamu perbaiki belum punya, tambahkan mengikuti file patokan.
4. **Konsisten warna/token** — kalau repo pakai token, jangan masukkan warna mentah baru.
5. **Diff minimal** — perbaiki yang diminta, jangan reformat seluruh file.
6. **Sebelum selesai:** jalankan `{{BUILD_CMD}}` & `{{TEST_CMD}}` (harus tetap lulus),
   bersihkan `console.log`/debug yang kamu tambahkan.

## Anti-pola UI yang sudah ada di repo (jangan diperluas)
<!-- ISI: mis. warna hardcode, fetch di komponen, dll. Saat menyentuh area ini, ikuti
pola yang BENAR di atas — tapi jangan refactor massal di luar scope task. -->
- ...

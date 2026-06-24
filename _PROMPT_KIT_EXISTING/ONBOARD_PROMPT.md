# ONBOARD PROMPT — Petakan Aplikasi Existing Jadi Dokumen

Paste seluruh isi file ini ke Claude Code di dalam repo aplikasi yang sudah ada.
Tujuannya: Claude **membaca codebase (read-only)** lalu menghasilkan dokumen prompt
(CLAUDE.md, peta arsitektur, konvensi, skill UI, log temuan) supaya sesi-sesi
berikutnya bisa mengedit/memperbaiki dengan aman.

**ATURAN MUTLAK UNTUK TAHAP INI: JANGAN MENGUBAH KODE APA PUN.** Hanya membaca dan
menulis file dokumen di folder `prompt/` dan `CLAUDE.md`. Tidak ada edit ke
`backend/`, `frontend/`, `src/`, dll. Tidak menjalankan migration/format/lint-fix.

---

## (OPSIONAL) KONTEKS DARI USER

```
Nama aplikasi   : {{APP_NAME — kosongkan jika ingin Claude deteksi sendiri}}
Keluhan/fokus   : {{mis. "banyak bug di checkout", "perlu hardening security",
                   "UI tidak konsisten" — atau kosongkan untuk audit menyeluruh}}
Pantangan       : {{area yang TIDAK boleh disentuh, mis. "jangan ubah skema DB"}}
```

---

## TUGAS UNTUK CLAUDE

### 1. Investigasi codebase (read-only)
Telusuri repo dan tentukan secara faktual (jangan mengarang — kalau tak yakin, tandai `?`):
- Stack & versi (bahasa, framework, package manager) — dari file manifest nyata
  (`composer.json`, `package.json`, `go.mod`, dll), bukan asumsi
- Perintah build / test / run / lint — dari script yang benar-benar ada
- Struktur folder utama & tanggung jawab tiap modul
- Cara autentikasi & otorisasi (role/permission)
- Daftar entitas/model data + relasi (dari migration/model/schema)
- Daftar endpoint/route (dari file routing)
- Pola UI: design token/warna, komponen status (loading/empty/error), form, layout
- Adakah test? Berapa cakupannya? Lulus/tidak (jalankan test READ-ONLY jika aman)

### 2. Hasilkan dokumen (isi template di `prompt/`)
| Template | Jadi file |
|----------|-----------|
| `CLAUDE.template.md` | `CLAUDE.md` (root) — stack, perintah, aturan emas, STATUS task |
| `prompt/docs/ARCHITECTURE_MAP.template.md` | peta modul, alur request, entitas, endpoint |
| `prompt/docs/CONVENTIONS.template.md` | pola yang HARUS ditiru + anti-pola yang ada |
| `prompt/docs/FINDINGS_LOG.template.md` | temuan awal (bug/security/inkonsistensi) + severity |
| `skills/app-ui/SKILL.template.md` | skill UI **diturunkan dari komponen yang ADA** (kutip path nyata) |

> Untuk SKILL UI: jangan menyalin pola dari project lain. Baca komponen status,
> token warna, dan contoh halaman yang **benar-benar ada di repo ini**, lalu tulis
> skill yang mendeskripsikan sistem yang sudah ada (dengan path file referensi nyata).

### 3. Audit ringan → FINDINGS_LOG
Selama membaca, catat temuan ke `FINDINGS_LOG.md` dengan severity:
- **P0** keamanan/kehilangan data/uang salah · **P1** bug fungsional ·
  **P2** inkonsistensi/teknis-debt · **P3** kosmetik/minor
Jangan memperbaikinya sekarang — hanya catat (judul, lokasi `file:line`, dampak, dugaan).

### 4. Laporkan
Tampilkan: daftar file dokumen yang dibuat, ringkasan stack & arsitektur (5–10 baris),
top temuan per severity, dan **pertanyaan** untuk hal yang tak bisa kamu pastikan dari
kode (jangan menebak konvensi yang ambigu — tanyakan).

**JANGAN memperbaiki bug apa pun di sesi ini.** Berhenti setelah dokumen jadi dan
tunggu user memilih task pertama untuk dikerjakan (pakai `TASK_00_TEMPLATE.md`).

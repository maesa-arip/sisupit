# PROMPT KIT (EXISTING APP) — Claude Code Audit & Fix Workflow

Kit ini untuk bekerja pada aplikasi yang **sudah ada** (brownfield): memetakan,
meng-audit, mengedit, dan memperbaiki — **bukan** membangun dari nol.

Bedanya dengan kit greenfield (`_PROMPT_KIT/`):

| | Greenfield (`_PROMPT_KIT`) | Existing (kit ini) |
|---|---|---|
| Tujuan | Bangun fitur baru dari nol | Audit & perbaiki kode yang sudah ada |
| Unit kerja | **Fase** (urut, fitur baru) | **Task / Work Order** (satu isu diskret) |
| Langkah pertama | Setup project | **Onboarding**: petakan repo jadi dokumen |
| Sikap default | Tulis kode baru lengkap | **Diff minimal**, cocokkan konvensi yang ada |
| Risiko utama | Lupa standar | **Regresi** — merusak yang sudah jalan |

Filosofi inti: **baca dulu, ubah seperlunya.** Map → reproduce → root cause →
fix terkecil yang benar → verifikasi → laporkan. Jangan refactor di luar scope.

---

## Isi Kit

```
_PROMPT_KIT_EXISTING/
├── README.md                         ← file ini
├── ONBOARD_PROMPT.md                 ← ⭐ prompt untuk reverse-engineer repo jadi dokumen
├── CLAUDE.template.md                ← jadi CLAUDE.md di root project existing
│
├── prompt/
│   ├── MASTER_PROMPT.template.md      ← disiplin perubahan, standar audit, keamanan regresi
│   ├── AUDIT_CHECKLIST.template.md    ← daftar periksa (bug, security, perf, konsistensi)
│   ├── tasks/
│   │   ├── TASK_00_TEMPLATE.md        ← cetakan satu work order
│   │   └── TASK_01_onboarding.template.md  ← task pertama: petakan codebase
│   └── docs/
│       ├── ARCHITECTURE_MAP.template.md   ← hasil onboarding (stack, alur, entitas, modul)
│       ├── CONVENTIONS.template.md        ← pola & konvensi yang HARUS ditiru
│       └── FINDINGS_LOG.template.md       ← backlog temuan audit + status fix
│
└── skills/
    └── app-ui/
        └── SKILL.template.md          ← skill UI yang DITURUNKAN dari kode existing
```

Semua `*.template.md` berisi placeholder `{{...}}` dan komentar `<!-- ISI: ... -->`.

---

## Cara Pakai

### Langkah 0 — Pasang kit
1. Salin isi `_PROMPT_KIT_EXISTING/` ke dalam folder repo existing (atau biarkan
   di sini sebagai referensi dan minta Claude membacanya).

### Langkah 1 — Onboarding (WAJIB sebelum fix apa pun)
2. Buka repo di Claude Code, **paste isi `ONBOARD_PROMPT.md`**.
3. Claude membaca codebase (read-only) lalu menghasilkan:
   - `CLAUDE.md` terisi (stack, perintah build/test, aturan)
   - `docs/ARCHITECTURE_MAP.md` (peta modul, alur, entitas, endpoint, model data)
   - `docs/CONVENTIONS.md` (pola yang harus ditiru, anti-pola yang harus dihindari)
   - `skills/<app>-ui/SKILL.md` (diturunkan dari komponen UI yang sudah ada)
   - `docs/FINDINGS_LOG.md` (temuan awal: bug/security/inkonsistensi)
   - **Tidak mengubah kode apa pun** di tahap ini.

### Langkah 2 — Audit
4. Jalankan `AUDIT_CHECKLIST.md` (atau minta Claude memakainya) → isi `FINDINGS_LOG.md`.
   Setiap temuan diberi severity (P0–P3) & status.

### Langkah 3 — Perbaiki, satu task per satu
5. Untuk tiap temuan, buat file task dari `TASK_00_TEMPLATE.md`:
   reproduce → root cause → rencana fix → blast radius → verifikasi → rollback.
6. Kerjakan **satu task per sesi**. Setelah selesai: jalankan test, update
   `FINDINGS_LOG.md` jadi `FIXED`, dan catat perubahan di `CLAUDE.md` jika perlu.

---

## Placeholder Global

| Placeholder | Arti |
|-------------|------|
| `{{APP_NAME}}` / `{{APP_SLUG}}` | Nama & slug app |
| `{{STACK}}` | Stack terdeteksi (diisi saat onboarding) |
| `{{BUILD_CMD}}` / `{{TEST_CMD}}` / `{{RUN_CMD}}` | Perintah build / test / run |
| `{{PRIMARY_HEX}}` | Warna brand (dideteksi dari token/CSS existing) |
| `{{REPO_LAYOUT}}` | Struktur folder utama |

---

## Aturan Emas (Brownfield)

1. **Baca sebelum tulis.** Tidak ada edit sebelum `ARCHITECTURE_MAP.md` & `CONVENTIONS.md` ada.
2. **Diff sekecil mungkin** untuk menyelesaikan task. Jangan reformat/rename/refactor di luar scope.
3. **Cocokkan konvensi existing** (penamaan, struktur, gaya) — jangan paksakan gaya baru.
4. **Jaga regresi:** jalankan test yang ada sebelum & sesudah; kalau tak ada test, verifikasi manual & catat caranya.
5. **Jangan hapus/timpa** kode yang tidak kamu buat tanpa menjelaskan alasannya lebih dulu.
6. **Satu task = satu tujuan.** Temuan baru di luar task → catat di `FINDINGS_LOG.md`, jangan kerjakan diam-diam.
7. **Uang & data sensitif:** perubahan apa pun pada alur finansial wajib ekstra hati-hati + verifikasi double-entry/transaction.

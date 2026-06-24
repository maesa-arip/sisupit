# {{APP_NAME}} — CLAUDE CODE INSTRUCTIONS (EXISTING APP)

<!-- Diisi saat onboarding. Ini "otak permanen" untuk bekerja di repo yang sudah ada. -->

Saat sesi dimulai, baca file berikut secara penuh sebelum melakukan apapun:
1. `prompt/MASTER_PROMPT.md` — disiplin perubahan, standar audit, keamanan regresi
2. `prompt/docs/ARCHITECTURE_MAP.md` — peta codebase
3. `prompt/docs/CONVENTIONS.md` — pola yang WAJIB ditiru
4. File task aktif yang tertera di STATUS di bawah (jika ada)

Setelah membaca, ringkas dalam 3–5 poin rencanamu untuk task ini, lalu
**tunggu konfirmasi sebelum mengedit kode apapun**.

---

## STATUS SAAT INI

```
Task aktif   : (belum ada — mulai dari ONBOARD_PROMPT.md jika dokumen belum dibuat)
Backlog      : lihat prompt/docs/FINDINGS_LOG.md
Onboarding   : [ ] belum / [x] selesai
```

---

## STACK & PERINTAH (diisi saat onboarding)

```
Stack     : {{STACK}}
Build     : {{BUILD_CMD}}
Test      : {{TEST_CMD}}
Run       : {{RUN_CMD}}
Lint      : {{LINT_CMD}}
```

> Jalankan {{TEST_CMD}} **sebelum** dan **sesudah** setiap perubahan untuk menjaga regresi.

---

## ATURAN EMAS (BROWNFIELD — JANGAN DILANGGAR)

1. **Baca sebelum tulis.** Tidak ada edit sebelum memahami modul yang akan disentuh
   (`ARCHITECTURE_MAP.md` + baca file terkait).
2. **Diff sekecil mungkin** untuk menuntaskan task. Jangan reformat, rename, atau
   refactor file/baris yang tidak terkait dengan task.
3. **Tiru konvensi existing** (penamaan, struktur folder, gaya kode, pola error) —
   lihat `CONVENTIONS.md`. Jangan paksakan gaya baru.
4. **Jaga regresi:** jalankan test sebelum & sesudah. Tak ada test? Verifikasi manual
   & tulis langkahnya di file task.
5. **Jangan hapus/timpa** kode yang tidak kamu buat tanpa menjelaskan alasan lebih dulu.
   Jika isi file bertentangan dengan deskripsi task, surface dulu — jangan main timpa.
6. **Satu task = satu tujuan.** Temuan baru di luar scope → catat ke `FINDINGS_LOG.md`,
   jangan kerjakan diam-diam.
7. **Uang & data sensitif:** perubahan pada alur finansial wajib di dalam transaction +
   verifikasi keseimbangan (debit=kredit) + tidak ada hard delete transaksi.
8. **Setiap endpoint/skema/perilaku yang berubah** → update dokumen terkait di `prompt/docs/`.

---

## ALUR KERJA PER TASK

```
1. Pilih temuan dari FINDINGS_LOG.md → buat file task dari TASK_00_TEMPLATE.md
2. Reproduce (buktikan bug ada) → root cause (di file:line mana) → rencana fix
3. Tentukan blast radius (apa lagi yang dipakai kode ini?)
4. Terapkan fix minimal → jalankan test → verifikasi manual
5. Update FINDINGS_LOG (status FIXED) + dokumen terkait + laporan task
```

---

## STRUKTUR DOKUMEN

```
{{APP_SLUG}}/
├── CLAUDE.md                         ← file ini
├── prompt/
│   ├── MASTER_PROMPT.md
│   ├── AUDIT_CHECKLIST.md
│   ├── tasks/{TASK_00_TEMPLATE.md, TASK_01_onboarding.md, ...}
│   └── docs/{ARCHITECTURE_MAP.md, CONVENTIONS.md, FINDINGS_LOG.md}
├── .claude/skills/{{APP_SLUG}}-ui/SKILL.md
└── (kode aplikasi existing — backend/, frontend/, src/, dst.)
```

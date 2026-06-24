# Sisupit DAMKAR — CLAUDE CODE INSTRUCTIONS (EXISTING APP)

Sistem Informasi Kesiapsiagaan untuk Pemadam Kebakaran Terintegrasi — platform pelaporan
dan koordinasi kebakaran/darurat real-time. Warga melapor → Pusat Komando (petugas/admin)
memvalidasi → petugas/relawan merespons dengan tracking lokasi live → insiden ditutup.

<!-- Diisi saat onboarding (TASK_01, 2026-06-25). Ini "otak permanen" untuk bekerja di repo ini. -->

Saat sesi dimulai, baca file berikut secara penuh sebelum melakukan apapun:
1. `prompt/MASTER_PROMPT.md` — disiplin perubahan, standar audit, keamanan regresi
2. `prompt/docs/ARCHITECTURE_MAP.md` — peta codebase (modul, alur request, entitas, route, auth)
3. `prompt/docs/CONVENTIONS.md` — pola yang WAJIB ditiru + anti-pola yang ada
4. `.claude/skills/sisupit-ui/SKILL.md` — konvensi frontend (otomatis aktif saat menyentuh `resources/js/`)
5. File task aktif yang tertera di STATUS di bawah (jika ada)

Setelah membaca, ringkas dalam 3–5 poin rencanamu untuk task ini, lalu
**tunggu konfirmasi sebelum mengedit kode apapun**.

---

## STATUS SAAT INI

```
Task aktif   : (belum ada — backlog FINDINGS_LOG #1-#8,#10 closed; #9 mass-reformat
                dijadwalkan terpisah, lihat prompt/tasks/TASK_05_documentation_and_deferred.md)
Backlog      : prompt/docs/FINDINGS_LOG.md — semua temuan FIXED/WONTFIX (dengan alasan)
               kecuali #9 (mass-reformat Pint/Prettier, sengaja dijadwalkan sebagai PR
               terpisah, bukan dikerjakan sekarang)
Selesai      : TASK_01 (onboarding), TASK_02 (P0 IDOR relawan/profil),
               TASK_03 (P1 PII feed dashboard), TASK_04 (batch P2/P3: route debug,
               webpush auth, helper nested, dead code, CI lint informational, naming),
               TASK_05 Bagian A (dokumentasi keputusan dual-access #6) — semua per 2026-06-25
Onboarding   : [x] selesai (TASK_01, 2026-06-25)
```

---

## STACK & PERINTAH

```
Stack     : PHP 8.2 + Laravel ^11.31, Inertia v2 + React 18, Vite 6, Tailwind v3,
            Pest v3, SQLite (lokal & testing), spatie/laravel-permission, laravolt/indonesia,
            Reverb (WebSocket), FCM + WebPush (push notification)
Build     : npm run build
Test      : php artisan test            (baseline 2026-06-25: 65 passed, 164 assertions)
Run (dev) : composer dev
Lint      : vendor/bin/pint  /  npm run format (auto-fix, BUKAN check-only — tidak ada di CI)
```

> Jalankan `php artisan test` **sebelum** dan **sesudah** setiap perubahan untuk menjaga regresi.

---

## ATURAN EMAS (BROWNFIELD — JANGAN DILANGGAR)

1. **Baca sebelum tulis.** Tidak ada edit sebelum memahami modul yang akan disentuh
   (`prompt/docs/ARCHITECTURE_MAP.md` + baca file terkait).
2. **Diff sekecil mungkin** untuk menuntaskan task. Jangan reformat, rename, atau
   refactor file/baris yang tidak terkait dengan task.
3. **Tiru konvensi existing** (penamaan, struktur folder, gaya kode, pola error) —
   lihat `prompt/docs/CONVENTIONS.md`. Jangan paksakan gaya baru.
4. **Jaga regresi:** jalankan test sebelum & sesudah. Tak ada test untuk area itu?
   Verifikasi manual & tulis langkahnya di file task.
5. **Jangan hapus/timpa** kode yang tidak kamu buat tanpa menjelaskan alasan lebih dulu.
   Jika isi file bertentangan dengan deskripsi task, surface dulu — jangan main timpa.
6. **Satu task = satu tujuan.** Temuan baru di luar scope → catat ke
   `prompt/docs/FINDINGS_LOG.md`, jangan kerjakan diam-diam.
7. **`withoutGlobalScopes()` wajib diikuti re-check otorisasi/ownership manual** — ini
   pengganti satu-satunya untuk proteksi yang biasanya dipegang `Tenantable` scope, dan
   pernah jadi sumber bug IDOR nyata di codebase ini.
8. **Setiap endpoint/skema/perilaku yang berubah** → update dokumen terkait di `prompt/docs/`.

---

## ALUR KERJA PER TASK

```
1. Pilih temuan dari prompt/docs/FINDINGS_LOG.md → buat file task dari
   prompt/tasks/TASK_00_TEMPLATE.md
2. Reproduce (buktikan bug ada) → root cause (di file:line mana) → rencana fix
3. Tentukan blast radius (apa lagi yang dipakai kode ini?)
4. Terapkan fix minimal → jalankan test → verifikasi manual
5. Update FINDINGS_LOG (status FIXED) + dokumen terkait + laporan task
```

---

## STRUKTUR DOKUMEN

```
sisupit/
├── CLAUDE.md                         ← file ini
├── prompt/
│   ├── MASTER_PROMPT.md
│   ├── AUDIT_CHECKLIST.md
│   ├── tasks/{TASK_00_TEMPLATE.md, TASK_01_onboarding.md, ...}
│   └── docs/{ARCHITECTURE_MAP.md, CONVENTIONS.md, FINDINGS_LOG.md}
├── .claude/skills/sisupit-ui/SKILL.md
├── _PROMPT_KIT_EXISTING/             ← kit asal (template kosong, referensi — bukan output)
└── (app/, resources/, routes/, database/, dst. — kode aplikasi existing)
```

---

## Hal-Hal Penting yang Tidak Berubah dari Audit Sebelumnya

Catatan operasional dari sesi kerja sebelumnya (Fase 0–7, lihat git history/working tree
uncommitted) yang masih relevan dan **sudah diverifikasi benar di kode saat ini**:

- Dead library/loan subsystem (`Book`, `Loan`, `Fine`, dst.) sudah dihapus (Fase 0).
- `routes/admin.php` & `routes/web.php` sudah punya `role:admin|superadmin` yang benar
  (bug bypass admin sebelumnya sudah diperbaiki) — **tapi lihat FINDINGS_LOG #1 untuk
  IDOR baru yang tidak terkait perbaikan ini**.
- `ReportController::authorizeReportAccess()` sudah benar mencegah IDOR pada laporan milik
  user lain.
- `ReportActionController` sudah punya role check eksplisit di setiap method aksi.
- `EmergencyAlertNotification` sudah mengonsolidasi 4 Notification class lama.
- `app/Http/Controllers/Api/GeocodeController.php` adalah satu-satunya jalur ke Nominatim
  (cache 24h + lock rate-limit). `docker/nominatim/` siap untuk migrasi self-hosted,
  belum di-deploy.
- `.env.testing` (SQLite in-memory) sudah benar terpisah dari DB dev.
- Rate limiter `report-create` (5/10menit) sudah aktif di `front.reports.store`.

Detail lengkap & temuan BARU dari audit 2026-06-25 (termasuk yang masih terbuka) ada di
`prompt/docs/FINDINGS_LOG.md` — jangan duplikasi pencatatan, rujuk file itu sebagai sumber
kebenaran tunggal untuk status temuan.

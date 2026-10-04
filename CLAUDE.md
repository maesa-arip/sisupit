# Sisupit DAMKAR — CLAUDE CODE INSTRUCTIONS (EXISTING APP)

Sistem Informasi Kesiapsiagaan untuk Pemadam Kebakaran Terintegrasi — platform pelaporan
dan koordinasi kebakaran/darurat real-time. Warga melapor → ADMIN memvalidasi & menyiarkan
→ petugas/relawan merespons dengan tracking lokasi live → insiden ditutup.
(Kalimat ini dulu berbunyi "Pusat Komando (petugas/admin) memvalidasi"; verifikasi dicabut
dari petugas 2026-08-31, TASK_51/#101. Petugas tetap menerima notifikasi laporan masuk dan
memegang seluruh aksi lapangan — ia MENUNGGU keputusan admin, bukan mengambilnya.)

<!-- Diisi saat onboarding (TASK_01, 2026-06-25). Ini "otak permanen" untuk bekerja di repo ini. -->

Saat sesi dimulai, baca file berikut secara penuh sebelum melakukan apapun:
1. `prompt/MASTER_PROMPT.md` — disiplin perubahan, standar audit, keamanan regresi
2. `prompt/docs/ARCHITECTURE_MAP.md` — peta codebase (modul, alur request, entitas, route, auth)
3. `prompt/docs/CONVENTIONS.md` — pola yang WAJIB ditiru + anti-pola yang ada
3b. `prompt/docs/PENGECUALIAN_ATURAN.md` — daftar aturan yang SENGAJA ditekuk atas persetujuan
   user (jangan "perbaiki" pengecualian ini diam-diam; kalau menemukan pelanggaran baru,
   konfirmasi ke user dulu beserta alasannya, lalu catat di sana)
4. `.claude/skills/sisupit-ui/SKILL.md` — konvensi frontend (otomatis aktif saat menyentuh `resources/js/`)
5. File task aktif yang tertera di STATUS di bawah (jika ada)
6. `prompt/docs/STATUS_LOG.md` — riwayat lengkap STATUS (JANGAN dibaca penuh tiap sesi;
   buka/grep saat butuh konteks historis suatu task atau temuan)

Setelah membaca, ringkas dalam 3–5 poin rencanamu untuk task ini, lalu
**tunggu konfirmasi sebelum mengedit kode apapun**.

---

## STATUS SAAT INI

> Ringkas saja. Riwayat lengkap tiap task (TASK_17 s/d #158, termasuk rincian deploy &
> keputusan user) ada di `prompt/docs/STATUS_LOG.md`. **Aturan:** entri di sini maks ~5
> baris; rincian ditulis di STATUS_LOG, file task, dan FINDINGS_LOG. CLAUDE.md dimuat utuh
> tiap sesi dan wajib di bawah 150k karakter (2026-10-01 sempat 233,8k).

```
Task aktif   : RILIS GOOGLE PLAY (2026-09-30). Akun Play Console PRIBADI (tanpa D-U-N-S),
                wajib uji tertutup 12 penguji x 14 hari. APK 1.1.5/vc7 (targetSdk 36, kunci
                unggah sisupit-upload.jks; AAB siap; rincian di memori WebView & folder mobile/).
                SISA: SHA-1 Play App Signing ke Firebase, uji di HP.
Terakhir     : #159/TASK_69 lapisan platform ponsel (hover sentuh, tap, active Button, 16px iOS,
                tema toast, dvh) + apple-design penuh (material kaca, pegas, cross-fade; PENGECUALIAN #5
                KHUSUS branch ini; bagian 15: peta hanya desktop di 7 halaman fasilitas/laporan +
                /admin/reports dirombak ulang; bagian 16: audit visual ulang 390px - rekap lama terlalu optimis, isi
                dirombak sungguhan, #160) di branch feat/mobile-native-polish - TERDEPLOY ke DEV @9ab56742
                (2026-10-04, termasuk #161-#165); MERGE ke main 2026-10-05 (prod belum di-deploy), butuh uji HP.
                #161 antrian BA tertinggal (ReportFeedChanged di store/destroy BA) + Riwayat pakai
                AppListRow & ikon jenis lib/report-icon.js di 4 daftar (2026-10-02, branch sama).
                #163 marker regu di peta detail = anggota terdekat ke TKP, bukan GPS danru; #164 Thanks pelapor: tombol &
                keterangan regu mengikuti status, peta tetap di detail ("Posisi Bantuan") (2026-10-03).
                #165 status pelapor di luar Thanks: kartu "Perkembangan Laporan Anda" di detail (khusus pelapor) +
                kartu "Laporan Anda" (laporan aktif) di Beranda warga, komponen ReportProgress (2026-10-04).
                TASK_70 navigasi instan: kerangka halaman tujuan global di AppLayout + menu aktif saat diketuk
                (lib/navigation.js), progress bar Inertia hanya di halaman tanpa kerangka, transisi fade tanpa potongan keras
                (usePageTransition), kerangka hanya bila tunggu > 300 ms & min. 300 ms; #167 denyut semua marker peta dimatikan; skill emilkowalski diarsipkan di .claude/skills-archive/; prefetch DILARANG selama Inertia 2.0.3 (#166 OPEN) (2026-10-04, di-push ke dev; deploy via konsol user).
                TASK_71 dashboard per peran (review "roasting"): #168-#173, #175-#176 FIXED - sapaan nama Bali, lencana
                relawan ikut siaga, OPD lokasi+status, banner petugas tanpa TERLAPOR, indikator Realtime sungguhan, peta
                taktis petugas (geser HP, pusat wilayah laravolt, posisi sendiri), kartu "Total Selesai" (2026-10-04, branch
                sama, TERDEPLOY ke DEV @61a32c7f, terverifikasi HTTPS). #174 DITUNDA (hanya Denpasar): peta fasilitas selalu Denpasar - kerjakan sebelum tenant ke-2 live.
                TASK_72 dashboard per peran DARI NOL (2026-10-04, branch sama): fase 1 Admin SELESAI - Pusat Komando baru
                (antrian triase, kejadian aktif, angka kunci, perlu ditindaklanjuti), kolom reports.approved_at/approved_by
                (MIGRASI - wajib bersama deploy), pejabat ke Pejabat/Dashboard. Fase 2 Petugas SELESAI (Misi Saya,
                Butuh Unit, sumber air terdekat, papan regu danru). Fase 3 Warga & Relawan SELESAI (feed paginasi dibuang, kejadian
                terverifikasi sekecamatan, fasilitas terdekat, Butuh Bantuan relawan dari server). Fase 4 OPD SELESAI (konfirmasi langsung dari dashboard). Fase 5 Pejabat
                (ringkasan strategis + tren) & 6 Superadmin (papan wilayah + kesehatan sistem) SELESAI - TASK_72 DONE.
                DEPLOY 2026-10-04 (permintaan user): DEV @672b6a10 = dashboard baru (+ papan regu danru maks 3 kartu) (migrasi approved_at jalan); STAGING @6d1dc8ea
                = dashboard SEBELUMNYA (tag pra-task72-dashboard, +84 commit branch ini, tanpa migrasi). Terverifikasi HTTPS. "Kembalikan ke tampilan
                sebelumnya" = SEMUA dashboard ke tag pra-task72-dashboard (TASK_72 bagian 13).
                #158 push iOS (kabar status pelapor & nada OPD) TERDEPLOY @9988587e.
                #157 hapus akun = ANONIMISASI TERDEPLOY @43479a4e.
SEMENTARA    : #149 menu "Jangkauan Petugas" disembunyikan + foto laporan non-kebakaran
                opsional; #156 menu admin "Daftar Penerima Email" & "Pengaturan Email Dinas"
                disembunyikan (flag di navItems.js). Cara mengembalikan: FINDINGS_LOG #149/#156.
Belum dicek  : visual di ponsel/APK untuk banyak perubahan UI (tombol merah brand, pop-up,
                combobox, dashboard, bilah bawah) - daftar per task di STATUS_LOG.
Temuan OPEN  : lihat FINDINGS_LOG (judul ber-"(OPEN)"), a.l. #102 #103 #114 #115 #119 #121
                #123 #124 #127 #128 #129 #130(parsial) #140 (port MySQL terbuka) #148 #166 #174.
Ditunda      : TASK_08 chat, TASK_57 WhatsApp, TASK_58 penguncian komputer, TASK_18 slice 2-4.
Test         : 734 passed, 3736 assertions (2026-10-04; main = feat/mobile-native-polish sejak merge 2026-10-05).
```

### Peringatan operasional (dari riwayat, masih berlaku)

- JANGAN `git checkout <file>` di repo ini - pernah menghapus perubahan belum ter-commit.
- Deploy = `/root/deploy-env.sh` di VPS (dev -> staging -> prod); bila ada migrasi, kode
  dan `php artisan migrate` WAJIB naik bersamaan + cadangan DB lebih dulu. Deploy tidak
  menjalankan `db:seed`: peran/data baru butuh migrasi penyelaras.
- SSH VPS memutus koneksi beruntun - gabungkan perintah ke sedikit koneksi, beri jeda.
- `php artisan tinker` lewat plink menggantung; pakai skrip PHP berdiri sendiri.
- `php` di `bash script.sh` = PHP tanpa SQLite -> test merah palsu.
- Sabotase pembuktian penjaga: verifikasi terpasang (`cmp`) dulu, pulihkan byte-exact.
- Teks UI tanpa em dash (pakai " - "); `resources/js/lib/utils.js` memuat byte NUL - sunting
  binary-safe.

---

## STACK & PERINTAH

```
Stack     : PHP 8.2 + Laravel ^11.31, Inertia v2 + React 18, Vite 6, Tailwind v3,
            Pest v3, SQLite (lokal & testing), spatie/laravel-permission, laravolt/indonesia,
            Reverb (WebSocket), FCM + WebPush (push notification)
Build     : npm run build
Test      : php artisan test            (baseline 2026-10-04: 734 passed, 3736 assertions - main sama sejak merge 2026-10-05;
            lokal: php -d memory_limit=1G -d extension=php_sqlite3.dll -d extension=pdo_sqlite vendor/bin/pest.
            Perbarui angka ini tiap kali test bertambah - baseline yang basi membuat "hijau
            seperti semula" tak bisa dibuktikan. Riwayat angkanya di STATUS_LOG.md)
Run (dev) : npm run dev:all   (scripts/dev.ps1 - Docker Nominatim/OSRM/tile + reverb + queue + vite;
            web & MySQL tetap milik Laragon, hanya diperiksa; proses yang sudah jalan dilewati.
            `composer dev` TIDAK cocok di mesin Windows ini: pail butuh pcntl, serve beda origin
            dari APP_URL, dan Reverb tak ikut)
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
│   └── docs/{ARCHITECTURE_MAP.md, CONVENTIONS.md, FINDINGS_LOG.md,
│             PENGECUALIAN_ATURAN.md, STATUS_LOG.md}
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

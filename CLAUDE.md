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
Task aktif   : TASK_29 (prompt/tasks/TASK_29_tenantable_hierarkis.md) — SELESAI & TERDEPLOY
                2026-08-13 (prod/staging/dev @787593c). `Tenantable` jadi HIERARKIS: untuk tiap
                tingkat yang dimiliki user, baris harus NULL ATAU sama — dulu ia memilih SATU
                kolom (tersempit) lalu menuntut cocok persis, sehingga master OPD/armada yang
                disimpan admin tingkat kota (district/village NULL) TIDAK TERLIHAT oleh staf
                ber-kecamatan/desa: 6 dari 18 staf Denpasar melihat daftar OPD kosong tanpa
                pesan galat. Bukan aturan baru — `User::scopeNotifiableForReport` sudah lama
                memakai makna "kolom NULL = wewenang lebih luas"; ini menyelaraskannya.
                TIDAK mengubah penerima notifikasi (User tak memakai trait ini) dan TIDAK
                melebarkan visibilitas laporan — dibuktikan di data prod: 0 dari 18 akun
                berubah, hanya 5 baris data master yang terbuka. Temuan #60 FIXED.
                Test 215 → 222 passed.
               TASK_28 (prompt/tasks/TASK_28_pilih_lokasi_manual.md) — SELESAI (kode) 2026-08-13.
                Pilih lokasi manual saat Pusat Komando input kejadian: dropdown bertingkat
                Provinsi→Kabupaten→Kecamatan→Desa, pin melompat ke centroid wilayah terpilih
                (kolom `meta` tabel indonesia_*, ikut terkirim /api/regions/*), lalu digeser
                sedikit. Provinsi/kabupaten terisi dari YURISDIKSI OPERATOR (bukan string
                'Bali' di kode) & tetap bisa diganti. Gerbangnya prop `region_picker` dari
                ReportController::create — null untuk warga, jadi alur pelaporan warga
                (GPS + geser pin) tidak berubah sama sekali. Aturan penting: di mode manual
                geser pin TIDAK menimpa kode wilayah (pilihan operator = sumber kebenaran);
                tombol "Ikuti pin peta" mengembalikan perilaku lama. Test 212 → 215 passed.
                SISA: verifikasi manual di browser (daftar periksa §6 file task).
               TASK_27 (prompt/tasks/TASK_27_opd_terkait.md) — SELESAI (kode) 2026-08-12.
                OPD terkait: saat verifikasi/broadcast, operator memilih instansi luar (BPBD/PLN/
                dst.) yang ikut diberi tahu. Kebakaran → OPD default TERCENTANG OTOMATIS tapi bisa
                di-uncentang. Daftarnya DINAMIS lewat /admin/agencies; "butuh konfirmasi" (mis. PLN
                "listrik sudah dipadamkan") juga DATA (`requires_confirmation`+`confirmation_label`),
                bukan `if` bernama instansi — jangan pernah menulis `if (code === 'pln')`.
                Auto-centang butuh kolom BARU `reports.incident_type` (dulu dibuang setelah
                validasi). Akun OPD = peran `opd` + `users.agency_id`; konfirmasi boleh dari OPD
                sendiri maupun dicatatkan operator (`confirmed_source`). Konfirmasi tertunda TIDAK
                memblokir "Selesai", hanya peringatan. Test 201 → 212 passed. SISA: verifikasi
                manual end-to-end + isi master OPD tiap kabupaten lewat /admin/agencies.
               TASK_26 (prompt/tasks/TASK_26_ios_prasyarat_server.md) — SELESAI (kode) 2026-08-12.
                Prasyarat server untuk wrapper iOS: (a) payload FCM kini punya blok `apns`
                di samping `android` — tanpa itu notifikasi darurat TIDAK PERNAH muncul di
                iPhone karena data-only dianggap background push; (b) verifikasi `aud` Google
                jadi DAFTAR PUTIH (Web + iOS Client ID) karena GIDSignIn iOS menerbitkan token
                ber-aud iOS Client ID; (c) `device_type` tak lagi dipaku 'android'.
                Test 193 → 201 passed. SISA: isi GOOGLE_IOS_CLIENT_ID di server + VERIFIKASI
                MANUAL di device Android nyata (notif + login Google) sebelum rilis, dan
                commit ulang public/build (297 berkas) agar device_type sampai ke produksi.
                Pembangunan app iOS-nya sendiri dipandu docs/ios/PROMPT_SISUPIT_IOS.md (Mac).
               TASK_24 (prompt/tasks/TASK_24_app_env_produksi.md) — SELESAI 2026-08-11.
                Produksi tadinya jalan dengan APP_ENV=local + APP_DEBUG=true → jejak galat
                & isi environment terbuka ke publik, dan halaman ErrorHandling tak pernah
                terpakai. Kini APP_ENV=production + APP_DEBUG=false (staging/dev ikut
                APP_DEBUG=false). Perubahan .env server saja, cadangan .env.bak-57-*.
                Temuan #57 FIXED.
               TASK_25 (prompt/tasks/TASK_25_reverb_config_runtime.md) — SELESAI 2026-08-11.
                Konfigurasi Reverb sisi browser dibaca RUNTIME (config/services.php →
                window.REVERB_CONFIG → echo.js), pola sama dengan MAP_TILE_URL. Sebelumnya
                dipaku saat build lewat VITE_REVERB_*, sehingga window.Echo TAK PERNAH ada
                di semua env dan host terpaku satu domain. Temuan #58 FIXED. SISA: cek di
                browser bahwa WS staging menyambung ke staging.sisupit.com.
               TASK_22 (prompt/tasks/TASK_22_broadcasting_auth.md) — SELESAI 2026-08-11.
                `bootstrap/app.php` kini memuat `channels:` sehingga POST /broadcasting/auth
                terdaftar; sebelumnya SEMUA channel privat mati diam-diam (Echo.private gagal
                otorisasi tanpa gejala). `routes/channels.php` pakai withoutGlobalScopes agar
                responder lintas desa tak ikut tertutup Tenantable. Temuan #55 FIXED.
                SISA: verifikasi end-to-end di produksi setelah deploy (curl /broadcasting/auth
                harus 419/302, bukan 404) + marker responder bergerak di halaman Show.
               TASK_23 (prompt/tasks/TASK_23_makna_wilayah_kosong.md) — SELESAI 2026-08-11.
                Kolom wilayah kosong kini punya aturan bernama: `User::STAFF_ROLES` (staf =
                sengaja luas) vs non-staf (= profil belum lengkap), tingkat diturunkan lewat
                `TenantLevel::forCodes()`. Cabang jaring pengaman "keempat kolom NULL = nasional"
                dibatasi ke staf — relawan berprofil kosong tak lagi dibanjiri siaran darurat
                se-Indonesia. Temuan #56 FIXED (dua "zona mati" yang dicatat di #56 ternyata
                by-design & dikunci test — koreksinya ada di entri #56). SISA: jalankan query
                verifikasi '0'/'' di DB produksi.
               TASK_21 (prompt/tasks/TASK_21_panel_menu_mobile.md) — SELESAI 2026-08-08,
                branch `worktree-mobile-menu-drawer`. Panel "Menu" mobile berhenti menuang
                sidebar desktop ke Sheet: daftar menu pindah ke Partials/navItems.js sebagai
                satu-satunya sumber DATA, penyajian per permukaan jadi berbeda. Mobile kini
                drawer-dari-bawah bertitik-henti + kepala identitas + petak aksi cepat +
                seksi admin terlipat + pencarian; Back perangkat menutup panel; safe-area
                dihormati. Temuan #54 FIXED. SISA: verifikasi visual/interaktif manual
                (daftar periksa di file task) — repo tak punya browser automation.
               TASK_20 (prompt/tasks/TASK_20_navigasi_mobile_tablet.md) — SELESAI 2026-08-07,
                branch `feat/mobile-nav-legal`. Menu Bantuan & Legal kini terjangkau di
                mobile lewat Sheet berisi <Sidebar/> yang sama (duplikasi daftar menu
                dihapus), rail ikon untuk tablet md, tautan legal di footer AppLayout.
                Temuan #53 FIXED. SISA: verifikasi visual responsif manual (daftar periksa
                ada di file task) — repo tak punya browser automation.
               TASK_19 (prompt/tasks/TASK_19_halaman_legal_bantuan.md) — SELESAI 2026-08-04,
                DI-COMMIT 2026-08-07 (f5793c7). Halaman legal/bantuan publik (S&K, Privasi, Pusat Bantuan,
                Tentang, Paket & Lisensi) + persetujuan S&K saat daftar. Kolom
                `tenants.edition`/`features` + enum TenantEdition DIBUAT di sini (bagian
                data TASK_18 slice 1); temuan #48 FIXED, #49/#50 dicatat OPEN.
                ADENDUM 2026-08-07 (§6 file task): dua draf legal di `docs/*.docx` digabung ke
                `/syarat-ketentuan` bertab (Pengguna Umum + Pengguna Berkontrak); penyedia
                kini `PT Tawarin Dimana Aja`, S&K naik ke versi 2.0. Temuan BARU #51 (PKS
                masih menyebut MAESA perorangan) & #52 (alamat kantor PT kosong) OPEN.
               TASK_18 (prompt/tasks/TASK_18_edition_sewa_beli.md) — SISA: guard #45
                (EnsureTenantHostMatchesStaff), slice 2 (resolver halaman), slice 3 (modul
                per-tenant), slice 4 (tenant:export). Lapisan data edition sudah ada.
                TASK_17 multi-tenant subdomain SELESAI slice 1-3 (2026-07-25, belum di-commit).
                Sebelumnya: TASK_10, 06, 11, 14, 12, 13, 07, 15, 16 SELESAI
                2026-06-28 (9 task) + TASK_09 armada/Unit SELESAI 2026-06-29.
                TASK_08 (chat) DITUNDA atas keputusan user.
                #9 mass-reformat Pint/Prettier SELESAI 2026-06-29 (PR formatting terpisah).
                Sisa: nihil (hanya TASK_08 chat yang ditunda).
Backlog (urut prioritas, sumber: prompt/docs/FINDINGS_LOG.md) :
   1. #24 P1  [SELESAI] Tolak Data rusak (route salah) → status `ditolak` + arsip  (TASK_10)
   2. #16 P2  [SELESAI] Notif balik ke pelapor tiap transisi status  (TASK_06)
      + #25 P2 [SELESAI] Lonceng/inbox notifikasi web di header AppLayout  (TASK_11)
   3. #28 P2  [SELESAI] Broadcast perubahan status → halaman Show update real-time  (TASK_14)
   4. #26 P2  [SELESAI] take-action/arrive dibatasi ke wilayah laporan  (TASK_12)
   5. #27 P2  [SELESAI] Aksi "Batal Meluncur" (un-respond) bagi responder  (TASK_13)
   6. #17 P2  [SELESAI] Laporan multi-foto (galeri report_photos)  (TASK_07)
   6. #17 P2  Laporan multi-foto (galeri)  (TASK_07)
   7. #18 P2  Kanal chat/koordinasi per insiden  (TASK_08 — DITUNDA atas keputusan user 2026-06-28)
   8. #30 P2  [SELESAI] Edit laporan diperbaiki (pelapor+TERLAPOR, konten+kelola foto)  (TASK_16)
   9. #29 P3  [SELESAI] Batch minor: category dead ref, guard status aksi, casing import  (TASK_15)
   9. #9  P3  [SELESAI] Mass-reformat Pint/Prettier (81 PHP + 122 JS/JSX, PR terpisah)  2026-06-29
  10. #19 P3  [SELESAI] Manajemen armada/Unit & dispatch  (TASK_09, 2026-06-29)
   Temuan lama #1-#8,#10-#15,#20-#23 closed (FIXED).
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
Test      : php artisan test            (baseline 2026-08-13: 222 passed, 859 assertions —
            angka lama "65 passed, 164 assertions" per 2026-06-25 sudah jauh tertinggal)
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

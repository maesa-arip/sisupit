# TASK 17 — Multi-tenant per kabupaten via subdomain (Denpasar + Badung, dst.)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_17 |
| Severity | P2 (fitur, tidak ada bug produksi — tapi men-scope PII/branding lintas wilayah) |
| Tipe | fitur (multi-tenant shell publik) |
| Sumber | permintaan user 2026-07-25 (permintaan kabupaten kedua: Badung) |
| Status | IN PROGRESS — slice 1 (data + form/DB) SELESAI 2026-07-25 |

## PROGRESS

**Slice 1 (SELESAI 2026-07-25) — tenant settable via form & database.**
- Migrasi `tenants` (subdomain/city_code unik, province_code, nama_instansi, pejabat_*,
  telepon_darurat, is_active) + `Tenant` model (`resolveFromHost`/`forCity`/`default`/
  `subdomainFromHost`, fail-safe ke config/pejabat.php, HasFile untuk foto).
- `config/services.php` → `tenant.base_domain` (env `TENANT_BASE_DOMAIN`).
- CRUD superadmin: `Admin/TenantController` + `TenantRequest` + routes `admin.tenants.*`
  (grup `role:superadmin`) + halaman `Admin/Tenants/{Index,Form}.jsx` + nav Sidebar (Sistem).
- `TenantSeeder` (Denpasar 5171 dari config, Badung 5103 PLACEHOLDER) + DatabaseSeeder.
- Test `TenantManagementTest` (6 pass): gating superadmin, create, dedup, resolve host/city,
  parse subdomain, fallback config. Migrasi+seed dijalankan di dev MySQL.

**Slice 2 (SELESAI 2026-07-25) — resolusi + branding publik + notice/redirect.**
- Middleware `ResolveTenant` (web group, sebelum Inertia) → `currentTenant()` helper; shared
  prop Inertia `tenant` (HandleInertiaRequests). Fail-safe apex→default Denpasar (kosmetik).
- `Spotlight.jsx`: judul + nomor darurat dari shared prop `tenant`.
- `Thanks.jsx` + `ReportController::thanks`: pejabat/nomor/instansi dari `Tenant::forCity(city_code
  LAPORAN)`, bukan subdomain. Non-partner → 112 + pesan jujur (tanpa nomor kota lain). Lambang
  kota spesifik hanya Denpasar (5171), lainnya mark Damkar generik.
- Statistik publik `HomeController` di-scope `Tenant::resolveFromHost(host)?->city_code` — HANYA
  saat request dari subdomain; apex/unknown → null → GLOBAL (perilaku lama tak berubah).
- `Create.jsx` + `ReportController::create`: notice "diarahkan ke Damkar X" / "belum terdaftar → 112"
  begitu pin ter-resolve (`registered_tenants` prop).
- `ReportController::store`: redirect-saat-save lintas-subdomain via `crossSubdomainThanksRedirect()`
  — AKTIF hanya bila `TENANT_BASE_DOMAIN` di-set (produksi); lokal/testing skip (aman).
- `.env.example`: panduan `SESSION_DOMAIN=.sisupit.com` + `TENANT_BASE_DOMAIN`.
- Test `TenantBrandingTest` (3 pass): spotlight subdomain branding, Thanks dari city_code laporan,
  non-partner→112. Full suite 162 passed (0 regresi), build & Pint bersih.

**Slice 3 (SELESAI 2026-07-25) — default region user = data COMPLETE-PROFILE (bukan subdomain).**
Keputusan user 2026-07-25: JANGAN pindahkan pengisian wilayah ke halaman register; tetap di
**complete-profile** karena di sana ada auto-deteksi GPS ("get location"). Cukup PAKAI data yang
sudah diisi di sana.
- TIDAK ada perubahan kode: `ProfileController::storeCompleteProfile` sudah memvalidasi + menyimpan
  `phone` + province/city/district/village_code ke user, dan `Tenantable` men-scope user dari kode
  wilayah itu → "default region" otomatis terpenuhi tanpa penambahan apa pun.
- Percobaan awal memindahkan ke `Register.jsx`/`RegisteredUserController` DI-REVERT (git checkout)
  sesuai klarifikasi user. Register tetap name/email/password saja; EnsureProfileComplete tetap
  mengarahkan user baru (masyarakat, phone/village_code null) ke complete-profile.

**Sisa (opsional, belum dikerjakan):**
- OPS produksi (di luar kode): set `TENANT_BASE_DOMAIN=sisupit.com` + `SESSION_DOMAIN=.sisupit.com`,
  DNS wildcard `*.sisupit.com`, cert wildcard. WebView per-kabupaten (keputusan terpisah).
- Isi data resmi Badung lewat form `/admin/tenants` (masih placeholder).

---

## 1. Deskripsi masalah / tujuan

Aplikasi akan melayani **lebih dari satu kabupaten/kota** (mulai: Denpasar + Badung).
Setiap kabupaten harus punya "wajah" publiknya sendiri: **Spotlight**, halaman **Terima
Kasih (Thanks)**, **pejabat** (nama/jabatan/foto), **nomor telepon darurat**, dan
**statistik publik** — semuanya khas kabupaten yang sedang dibuka.

Keputusan arsitektur (dikonfirmasi user 2026-07-25):
- **Model = B: satu instance, satu DB, tenant di-resolve dari SUBDOMAIN**
  (`denpasar.sisupit.com`, `badung.sisupit.com`).
- **Deteksi tenant menumpang pada PIN kejadian, redirect hanya saat SAVE** (bukan saat
  buka halaman, bukan menunggu GPS lebih dulu). Rinci di bawah.
- **Apex `sisupit.com` (tanpa subdomain) → shell default Denpasar (KOSMETIK saja)** —
  BUKAN sumber nomor/pejabat. Info safety-critical selalu dari `city_code` pin.

### Alur warga (final, dikonfirmasi user 2026-07-25)
1. Warga buka `sisupit.com` (atau subdomain mana pun) → **form lapor render INSTAN**,
   tema default/netral. **Tidak memblokir menunggu GPS.**
2. GPS sudah mendeteksi wilayah **saat pin dipindah / saat titik lokasi pelapor diambil**
   (reverse-geocode pin → `city_code`, sudah ada di form sekarang).
3. Begitu titik didapat, tampilkan **notice inline** ke warga berdasarkan `city_code`:
   - city_code = tenant terdaftar → "Laporan akan diarahkan ke **Damkar Badung**"
     (atau Denpasar, dst.).
   - city_code BUKAN tenant terdaftar → "**Kabupatenmu belum terdaftar** — untuk darurat
     hubungi **112**." (laporan tetap boleh dikirim & tercatat; lihat §non-partner).
4. Saat **SAVE**: laporan dibuat (`city_code` dari pin — tetap sumber kebenaran), lalu
   **redirect langsung ke subdomain tenant** menuju halaman Thanks
   (`https://badung.sisupit.com/...thanks`). Perpindahan subdomain terasa mulus karena
   terjadi tepat di batas simpan (state form tak hilang, GPS tak memblok saat buka).
   - Tenant belum terdaftar → tetap di host sekarang, Thanks bertema netral + pesan 112.

**Prasyarat "smooth" (SESSION):** `SESSION_DOMAIN=.sisupit.com` (titik di depan) WAJIB —
agar cookie sesi dibagi antar-subdomain sehingga redirect saat save tidak memutus login
dan **flash message Thanks selamat** (Thanks memakai flash — memori thanks-page). Tanpa
ini, redirect antar-subdomain = user logout + flash hilang. Setting `.env`, bukan kode.

### Pemisahan dua concern yang WAJIB dijaga
1. **Routing laporan (data)** — SUDAH benar & berbasis GPS lokasi kejadian:
   `Report.city_code` diisi dari `$request` hasil reverse-geocode pin
   (`ReportController::store` baris 284–287). Kebakaran di Badung masuk ke Damkar Badung
   walau pelapor membuka skin Denpasar. **JANGAN ikat routing ke subdomain.**
2. **Branding shell publik** — saat ini GLOBAL/hardcoded, tampil ke pengunjung anonim
   (belum punya region) → `Tenantable` tak menolong. Inilah scope task ini.

### Non-goals (JANGAN dikerjakan di task ini)
- Mengubah trait `Tenantable` (scoping user login tetap by region user — aman).
- Mengubah routing/kepemilikan laporan.
- WebView Android multi-kabupaten (dicatat sebagai keputusan terpisah — lihat §5).
- DNS wildcard & sertifikat (ops VPS, di luar kode — lihat §5).

## 2. Reproduce (kondisi awal & hasil yang diharapkan)

Kondisi awal (bukti branding masih global):
- `config/pejabat.php` = SATU pejabat Denpasar + SATU nomor Denpasar (`0361-223333`).
  Dibaca oleh halaman Thanks (`Front/Reports/Thanks`).
- `HomeController::spotlight/landing/index/chart/countRespondersByRole` memakai
  `Report::count()` / `User::whereHas(...)` **tanpa scope wilayah** → Badung akan
  menampilkan angka Denpasar.

Hasil yang diharapkan:
- Buka `badung.sisupit.com/spotlight` → nama instansi, pejabat, nomor telepon, dan
  statistik = **Badung**.
- Buka `denpasar.sisupit.com` atau `sisupit.com` (apex) → semuanya **Denpasar**.
- Warga melapor kejadian di Badung dari subdomain mana pun → laporan tetap masuk
  Damkar Badung (tak berubah dari sekarang).

## 3. Root cause

Bukan bug — keterbatasan desain: **tidak ada konsep "tenant publik" yang ter-resolve
sebelum login.** Branding & statistik publik di-hardcode ke satu kota (Denpasar) di
`config/pejabat.php` dan `HomeController`. Tidak ada mekanisme memetakan
Host/subdomain → kabupaten.

## 4. Rencana fix (perubahan terkecil yang benar)

Urutan bertahap; jalankan test di tiap langkah.

**(a) Data & model tenant**
- `database/migrations/xxxx_create_tenants_table.php` — kolom: `id`, `city_code`
  (unik, string), `subdomain` (unik, string), `nama_instansi`, `pejabat_nama`,
  `pejabat_jabatan`, `pejabat_foto` (nullable), `telepon_darurat`, timestamps.
  (Opsional menyusul: `logo`, `tagline`.)
- `app/Models/Tenant.php` — `$guarded = []` (ikut pola Unit/Pompa). Helper
  `Tenant::resolveFromHost(string $host): ?Tenant` + `Tenant::default(): Tenant`
  (Denpasar). **BUKAN** `Tenantable` (tenant adalah tabel katalog global, lintas wilayah).
- `database/seeders/TenantSeeder.php` — seed Denpasar (dari nilai `config/pejabat.php`
  sekarang) + Badung (data riil dari user — lihat §placeholder). Daftarkan di
  `DatabaseSeeder`.

**(b) Resolusi tenant per request**
- `app/Http/Middleware/ResolveTenant.php` — ambil subdomain dari `$request->getHost()`,
  cari `Tenant` by `subdomain`; jika tak ketemu (apex/unknown) → `Tenant::default()`
  (Denpasar). Simpan via `app()->instance('tenant', $tenant)` + `View::share` /
  helper `currentTenant()`.
- Daftarkan middleware di grup `web` (`bootstrap/app.php`) — hanya perlu untuk
  request web, ringan (1 query + cache).
- `HandleInertiaRequests::share()` — tambah shared prop `tenant` (hanya field publik:
  nama_instansi, pejabat_*, telepon_darurat) agar semua halaman Inertia bisa membacanya.
  Cache resolusi (`Cache::rememberForever("tenant:host:$host", …)`, invalidate saat
  Tenant di-update) demi hemat query — ikut pola `Setting::getValue`.

**(c) Branding publik jadi tenant-driven**
- Thanks page: pejabat/nomor/"layanan resmi" diambil dari **tenant milik `city_code`
  LAPORAN** (dari pin), BUKAN dari shell/subdomain — jadi selalu akurat wilayah kejadian.
  Ganti pembacaan `config('pejabat.*')` di perender `Front/Reports/Thanks` (cari
  perender-nya — `ReportController` atau `ReportResolutionController`) dengan
  `Tenant::forCity($report->city_code)`. **Pertahankan** `config/pejabat.php` sebagai
  sumber default TenantSeeder + fallback bila tenant null.
- Non-partner (city_code laporan tak punya tenant): Thanks bertema netral + tombol/pesan
  **112** (bukan nomor Denpasar). Jangan tampilkan nomor kota lain sebagai "layanan Anda".
- `resources/js/Pages/**/Thanks.jsx` + `Spotlight.jsx` — konsumsi prop `tenant`
  (fallback ke nilai lama bila prop absen, agar tak pecah).

**(c2) Notice tenant di FORM lapor + redirect saat save**
- `resources/js/Pages/Front/Reports/Create.jsx` — setelah reverse-geocode pin mengisi
  `city_code`, cocokkan dengan daftar tenant terdaftar (kirim `registered_tenants`
  [{city_code, nama, subdomain}] sebagai prop dari controller) → tampilkan notice inline:
  "Laporan akan diarahkan ke Damkar {Kota}" / "Kabupatenmu belum terdaftar — darurat: 112".
- `ReportController::store` — setelah `Report::create`, jika `city_code` laporan cocok
  tenant terdaftar DAN host sekarang bukan subdomain tenant itu → `redirect()->away(
  "https://{tenant->subdomain}.{app_domain}/...thanks")` (URL penuh lintas-subdomain).
  Bila sudah di subdomain benar / non-partner → redirect Thanks lokal seperti sekarang.
  Domain apex diambil dari `config('app.domain')`/parse `APP_URL` (jangan hardcode).

**(d) Statistik publik di-scope tenant**
- `HomeController::spotlight/landing/index/chart/countRespondersByRole` — bila tenant
  ter-resolve, tambahkan `->where('city_code', $tenant->city_code)` pada query Report,
  dan filter responder by city_code. Apex→Denpasar (karena default = Denpasar, otomatis
  ter-scope Denpasar; konfirmasi apakah apex harus scope-Denpasar atau global — per
  keputusan user "apex fallback Denpasar" ⇒ **scope Denpasar**).

**(e) Registrasi terikat subdomain → default region**
- Titik registrasi (`RegisteredUserController` / `SocialiteController` auto-assign):
  bila user baru daftar di subdomain tenant, set `city_code` (+ province_code) user ke
  `tenant->city_code` sehingga `Tenantable` langsung men-scope mereka benar.
  **Verifikasi** ini tidak menabrak alur `complete-profile` / village_code (profil
  petugas/relawan tak boleh null-village → loop; lihat memori profile-loop).

## 5. Blast radius

- **Middleware baru di grup web** menyentuh SEMUA request web → wajib ringan + cache,
  dan **fail-safe**: jika tabel `tenants` belum ter-migrate/seed (fresh install / CI),
  `ResolveTenant` harus mengembalikan default dari `config/pejabat.php` TANPA melempar
  exception (pola sama `HomeController::countRespondersByRole` yang tahan role belum seed).
- **Inertia shared prop** bertambah (`tenant`) → payload tiap halaman naik sedikit.
- **Statistik publik berubah angka** (dari global → per-kota) — pastikan bukan regresi
  yang tak diinginkan untuk Denpasar (Denpasar tetap lihat angka Denpasar; sebelumnya
  global = mayoritas Denpasar, jadi mendekati sama).
- **Registrasi**: perubahan default region user → uji tidak memecah IDOR/tenant test
  yang ada (`AdminTenantScope`, `ReportOwnership`).
- **Tenantable TIDAK disentuh** — admin Denpasar yang membuka `badung.*` tetap melihat
  data Denpasar (scope by user region), aman.
- **SESSION_DOMAIN=.sisupit.com (WAJIB)** — tanpa cookie sesi lintas-subdomain, redirect
  saat save = user logout + flash Thanks hilang. Efek samping: sesi jadi dibagi ke SEMUA
  subdomain (itu memang tujuannya = SSO antar-kota). Verifikasi CSRF/`SANCTUM_STATEFUL`
  bila ada. Di lokal (tanpa subdomain nyata) pakai host `*.sisupit.test`/`lvh.me` untuk uji.
- **Redirect lintas-subdomain hanya saat SAVE**, tak pernah saat mengisi form (ganti
  domain = reload penuh → state form hilang). Jalur kritis lapor TIDAK menunggu GPS.
- **Laporan non-partner tetap tercatat** (`city_code` wilayah non-tenant) — pastikan
  terlihat oleh superadmin/nasional, bukan hilang. Jangan beri jaminan palsu "ditangani".

### Keputusan terpisah (dicatat, DI LUAR task ini)
- **WebView Android** (memori `project_sisupit_webview_android`): satu APK menunjuk satu
  URL. Untuk Badung → butuh APK per-kabupaten menunjuk subdomainnya, atau pemilih kota
  di app. Belum diputuskan → catat, jangan diam-diam diubah.
- **Ops VPS**: DNS wildcard `*.sisupit.com` + sertifikat wildcard (certbot). Di luar kode.

## 6. Rencana verifikasi
- [ ] Baseline test sebelum: `php artisan test` → catat hasil (baseline: 65 passed)
- [ ] Regression test baru (Pest, `tests/Feature/Sisupit/TenantResolutionTest.php`):
  - Host `badung.sisupit.com` → `currentTenant()->city_code` = Badung.
  - Host apex `sisupit.com` → tenant = Denpasar (fallback).
  - Host unknown `foo.sisupit.com` → tenant = Denpasar (fallback), tak error.
  - Tabel `tenants` kosong → tak throw, pakai default config.
  - Statistik Spotlight ter-scope city_code tenant.
- [ ] Test sesudah hijau (≥ 65 passed)
- [ ] Verifikasi manual:
  - `denpasar.sisupit.com/spotlight` vs `badung.sisupit.com/spotlight` → branding & angka beda.
  - Buka `sisupit.com` (apex) → form lapor render instan, TIDAK menunggu GPS.
  - Taruh pin di Badung → notice "diarahkan ke Damkar Badung"; pin di wilayah non-tenant
    → notice "belum terdaftar / 112".
  - Save dari apex dengan pin Badung → redirect mulus ke `badung.sisupit.com/...thanks`,
    login TETAP, flash muncul, Thanks tampilkan pejabat+nomor Badung.
  - Save dengan pin wilayah non-partner → tetap di host sekarang, Thanks netral + 112,
    laporan tercatat (cek terlihat superadmin).
  - Redirect antar-subdomain saat login TIDAK memaksa login ulang (SESSION_DOMAIN benar).
- [ ] `npm run build` lulus (jangan commit `public/build` kecuali diminta)

## 7. Rollback
- Perubahan terfokus dalam beberapa commit kecil (migrasi+model+seeder / middleware /
  branding / stats / registrasi). Revert per-commit. Migrasi punya `down()` men-drop
  `tenants`. `config/pejabat.php` tetap ada sebagai jalur lama sehingga menonaktifkan
  middleware `ResolveTenant` mengembalikan perilaku single-tenant.

---

## Data tenant yang DIBUTUHKAN dari user (placeholder sampai diisi)

| Field | Denpasar (dari config/pejabat.php) | Badung (ISI) |
|-------|-----------------------------------|--------------|
| subdomain | `denpasar` | `badung` (konfirmasi) |
| city_code | `5171` (KOTA DENPASAR) ✓ | `5103` (KABUPATEN BADUNG) ✓ |
| province_code | `51` (Bali) ✓ | `51` (Bali) ✓ |
| nama_instansi | Dinas Pemadam Kebakaran dan Penyelamatan Kota Denpasar | ISI |
| pejabat_nama | I Made Tirana, S.H., M.H. | ISI |
| pejabat_jabatan | Kepala Dinas Damkar & Penyelamatan Kota Denpasar | ISI |
| pejabat_foto | /images/pejabat.jpg | ISI (taruh di public/images/) |
| telepon_darurat | 0361-223333 | ISI (nomor Damkar Badung — SAFETY-CRITICAL) |

> `city_code` di-lookup dari `indonesia_cities` (laravolt), diverifikasi 2026-07-25 cocok
> dengan `reports.city_code`/`users.city_code` existing (5171 & 5103 sudah dipakai data dev).

## Acceptance criteria
- [ ] Buka subdomain kabupaten → Spotlight/pejabat/nomor/statistik sesuai kabupaten itu
- [ ] Apex `sisupit.com` → form lapor render instan (tak menunggu GPS), shell Denpasar kosmetik
- [ ] Pin kejadian → notice tenant tujuan / "belum terdaftar + 112" muncul di form
- [ ] Save → redirect mulus ke subdomain tenant (login & flash selamat via SESSION_DOMAIN)
- [ ] Thanks: pejabat+nomor dari `city_code` LAPORAN (pin), non-partner → 112 (bukan Denpasar)
- [ ] Routing laporan tetap berbasis pin GPS (tak berubah); laporan non-partner tetap tercatat
- [ ] `Tenantable` tidak disentuh; tak ada regresi tenant/IDOR (test ≥ baseline 65 passed)
- [ ] Fresh install / tabel tenants kosong → tak error (fail-safe ke config default)
- [ ] Diff minimal & sesuai konvensi (`prompt/docs/CONVENTIONS.md`)
- [ ] Dokumen terkait diupdate (`ARCHITECTURE_MAP.md`: modul Multi-Tenant + tabel entitas
      Tenant; `FINDINGS_LOG.md` bila perlu; CLAUDE.md STATUS)

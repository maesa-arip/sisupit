# TASK 18 — Model dua tingkat: tenant SEWA vs BELI (lapisan edition) + hak eksit
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_18 |
| Severity | P1 (slice 1 & 4) / P2 (slice 2) / P3 (slice 3) |
| Tipe | fitur (arsitektur komersial) + security (guard staf lintas-tenant, FINDINGS #45) |
| Sumber | permintaan user 2026-07-28 (perubahan model bisnis: Badung BELI, Klungkung dst. SEWA) |
| Status | TODO |
| Lanjutan dari | TASK_17 (multi-tenant subdomain — SELESAI slice 1–3) |

---

## 0. Keputusan yang mengikat (dikonfirmasi user 2026-07-28)

Perubahan model bisnis dari TASK_17: **tidak semua kabupaten menyewa.**

| Kabupaten | Paket | Konsekuensi teknis |
|-----------|-------|--------------------|
| Denpasar | sewa | Tanpa perubahan — persis seperti sekarang |
| **Badung** | **beli** | Boleh punya branding, beberapa halaman, dan modul yang berbeda |
| Klungkung (dst.) | sewa | Cukup satu baris di tabel `tenants` — **nol kode baru** |

**Definisi "beli" yang disepakati (jangan ditafsir ulang saat implementasi):**
1. **Lisensi perpetual** — Badung berhak pakai selamanya, tanpa biaya sewa.
2. **Penyerahan source** — Badung menerima snapshot repo sebagai aset (tanpa `.env` produksi,
   tanpa data). Memenuhi syarat pencatatan aset daerah.
3. **Hosting tetap bersama** — satu codebase, satu deploy, **satu DB**. Badung memakai
   **SUBDOMAIN** (`badung.sisupit.com`), *bukan* domain sendiri (keputusan user: "cukup
   subdomain dulu").
4. **Hak eksit** — kapan pun Badung ingin pindah ke server sendiri, data mereka bisa
   diekstrak utuh & terpisah. Ini yang membuat poin 3 jujur, bukan penguncian. Slice 4.

**Kedalaman divergensi Badung (jawaban user):** branding + beberapa halaman berbeda +
ada modul eksklusif; selebihnya ditentukan sambil jalan. → lapisan edition harus generik
supaya tidak perlu refactor besar saat kebutuhan bertambah.

### Yang DITOLAK dan alasannya (jangan diusulkan ulang)

**Fork repo / deploy terpisah untuk Badung yang berbagi satu DB — DITOLAK.** Dua alasan
konkret, bukan preferensi gaya:

1. **Skema jadi *shared mutable state* antara dua codebase yang berevolusi bebas.** Migrasi
   di satu sisi mematahkan sisi lain, dan kepemilikan migrasi tidak pernah jelas.
2. **Inti keamanan akan tergandakan.** `Tenantable`, `ReportController::authorizeReportAccess()`,
   `ensureWithinJurisdiction()`, `User::withinReportJurisdiction()` — repo ini punya riwayat
   enam bug IDOR nyata (#14, #22, #26, #31, #32, #44). Salinan kedua berarti setiap patch
   harus dikerjakan dua kali, dan drift-nya **senyap**: tidak ada test yang gagal saat kedua
   sisi menyimpang.

> **Aturan turunan (masukkan ke CONVENTIONS.md):** *kalau kodenya berbeda, DB-nya harus
> terpisah. Selama DB-nya satu, kodenya harus satu.* Divergensi Badung ditempuh lewat titik
> ekstensi resmi di dalam satu codebase (slice 2 & 3), bukan lewat cabang repo.

---

## 1. Deskripsi masalah / tujuan

Dua kebutuhan yang belum terlayani arsitektur sekarang:

**(a) Tidak ada konsep "paket layanan".** Tabel `tenants` hasil TASK_17 murni menyimpan
identitas publik (nama instansi, pejabat, nomor darurat). Tidak ada cara membedakan
pelanggan sewa dari pelanggan beli, dan tidak ada cara menyalakan fitur untuk satu
kabupaten saja. Satu-satunya jalan "beda kode" saat ini adalah cabang `if` di controller
inti (menggerus kode bersama) atau fork repo (ditolak di §0).

**(b) Tidak ada hak eksit yang bisa dibuktikan.** Kami menjanjikan Badung bisa pindah
membawa datanya, tapi belum ada mekanisme mengekstrak data satu kabupaten saja.

Ditambah satu temuan yang muncul saat analisis ini — **FINDINGS #45**, lihat §2(c).

**Tujuan task:** lapisan `edition` + `features` pada tenant, dua titik ekstensi resmi
(halaman & modul), guard staf lintas-tenant, dan perintah ekspor per kabupaten.

---

## 2. Reproduce (kondisi awal)

**(a) Tenant = data saja.** `database/migrations/2026_07_25_100000_create_tenants_table.php`
baris 26–38: kolom hanya `subdomain`, `city_code`, `province_code`, `nama_instansi`,
`pejabat_*`, `telepon_darurat`, `is_active`. Tidak ada paket/kapabilitas.

**(b) Hak eksit belum ada.** Tidak ada perintah artisan yang bisa mengeluarkan data satu
`city_code` saja (`app/Console/Commands/` hanya berisi `SimulateResponders.php`).

**(c) FINDINGS #45 — staf lintas-tenant masuk ke subdomain kabupaten lain.**
Langkah reproduce:
1. Login sebagai admin Denpasar (`city_code = 5171`).
2. Buka `badung.sisupit.com/admin/reports`.
3. **Hasil sekarang:** halaman terbuka normal. Kop/branding menampilkan **Damkar Badung**
   (dari shared prop `tenant`, hasil `ResolveTenant`), sementara isi tabelnya adalah
   **laporan Denpasar** (hasil scope `Tenantable` yang membaca region *user*).

Ini **bukan kebocoran data** — `Tenantable` tetap bekerja benar dan tidak ada satu baris
Badung pun yang terlihat. Tetapi tampilannya persis seperti kebocoran, dan bagi pelanggan
yang **membeli** sistem ini, "admin dinas lain bisa membuka panel admin kami" tidak bisa
diterima sekalipun secara teknis aman. Harus ditutup tegas.

**Hasil yang diharapkan setelah task:**
- Superadmin dapat menetapkan paket (`sewa`/`beli`) + daftar fitur per kabupaten lewat form.
- Staf yang membuka subdomain kabupaten lain ditolak/diarahkan pulang, bukan dibiarkan masuk.
- Badung bisa punya halaman & modul sendiri tanpa menyentuh kode bersama.
- `php artisan tenant:export 5103` menghasilkan data Badung saja, nol baris kabupaten lain.

---

## 3. Root cause

- **Tenant belum punya dimensi kapabilitas.** `create_tenants_table` dirancang untuk satu
  masalah TASK_17 (branding publik), yang saat itu memang cukup.
- **Dua sumber kebenaran wilayah tidak pernah dipertemukan.**
  `app/Http/Middleware/ResolveTenant.php:22` menaruh tenant hasil *host* ke container —
  dipakai **hanya untuk branding**. `app/Traits/Tenantable.php:11–53` men-scope data dari
  *region user* — **buta terhadap host**. Keduanya benar sendiri-sendiri; tidak ada satu
  pun tempat yang membandingkan "kabupaten yang sedang dibuka" dengan "kabupaten milik
  user". Itulah #45.
- **Tidak ada titik ekstensi resmi** untuk perbedaan per-tenant, sehingga tekanan kebutuhan
  bisnis mengarah ke fork.

---

## 4. Rencana fix — 4 slice

> Urutan pengerjaan: **slice 1 & 4 lebih dulu** (keduanya menutup risiko nyata: #45 dan
> janji hak eksit). Slice 2 & 3 menyusul saat kebutuhan Badung sudah konkret — jangan
> dibangun spekulatif.

### SLICE 1 (P1) — `edition` + `features` + guard staf lintas-tenant

- `database/migrations/xxxx_add_edition_and_features_to_tenants_table.php`
  - `edition` string, default `'sewa'`, ter-index.
  - `features` json nullable (daftar kunci fitur aktif).
  - `down()` men-drop keduanya.
- `app/Enums/TenantEdition.php` — case `SEWA` / `BELI` + `label()` + `options()`,
  mengikuti pola `app/Enums/TenantLevel.php` & `UserGender.php`.
  > **Awas tabrakan nama:** `TenantLevel` SUDAH ADA dan artinya *level wilayah*
  > (desa/kecamatan/kabupaten/provinsi), sama sekali bukan paket layanan. Jangan
  > menambah case ke sana, jangan menamai enum baru `TenantLevel`/`TenantType`.
- `app/Models/Tenant.php` — tambah `'features' => 'array'` ke `$casts`; helper
  `hasFeature(string $key): bool` dan `isBeli(): bool`. Keduanya harus aman saat
  `features` null (objek transien `fromConfig()` tidak punya kolom ini).
- `app/Http/Requests/Admin/TenantRequest.php` — validasi `edition` `Rule::enum(TenantEdition::class)`,
  `features` array of string.
- `resources/js/Pages/Admin/Tenants/Form.jsx` — field "Paket Layanan" (select) + daftar
  fitur (checkbox). **Ikuti skill `sisupit-ui`** (token, pola form, pola error) — jangan
  memperkenalkan gaya baru.
- `database/seeders/TenantSeeder.php` — Denpasar `sewa`, Badung `beli`.
- `app/Http/Middleware/EnsureTenantHostMatchesStaff.php` **(inti perbaikan #45)**
  - Didaftarkan di **`routes/admin.php`** pada grup `['auth','verified','role:admin|superadmin']`
    — **bukan** di grup `web` global. Membatasi blast radius ke area admin dan menjaga
    jalur lapor warga tetap tak tersentuh.
  - Bypass: `superadmin`; user tanpa `city_code` (sudah diurus `EnsureProfileComplete`);
    guest.
  - **KRITIS — pakai `Tenant::resolveFromHost($request->getHost())`, JANGAN `currentTenant()`.**
    `currentTenant()` jatuh ke `Tenant::default()` (Denpasar) saat apex, jadi memakainya
    akan memantulkan **seluruh staf non-Denpasar** begitu mereka membuka `sisupit.com`.
    Guard hanya boleh aktif bila host benar-benar me-resolve ke tenant nyata; apex/unknown
    → no-op.
  - Bila tenant host ≠ `city_code` user → redirect ke subdomain milik user dengan path yang
    sama, **bila** `TENANT_BASE_DOMAIN` di-set; bila tidak (lokal/CI) → `abort(403)` dengan
    pesan jelas ("Panel admin ini milik Damkar {X}. Akun Anda terdaftar di {Y}.").

### SLICE 2 (P2) — resolver halaman per-tenant (override, bukan fork)

- Helper/trait `tenantPage(string $page): string` — kembalikan
  `Tenants/{Studly(subdomain)}/{$page}` bila komponennya ada, selain itu `$page` apa adanya.
- Deteksi keberadaan komponen **wajib di-cache** (jangan `File::exists()` tiap render);
  ikuti pola cache `Tenant::resolveFromHost` (`Cache::rememberForever` + flush saat deploy).
- Dipakai **selektif** di controller yang halamannya memang boleh beda (mulai:
  `Spotlight`, `Landing`, `Thanks`) — jangan dipasang global ke semua `inertia()`.
- **Fallback wajib:** komponen override tidak ada → halaman bersama. Tidak boleh 500.
- Contoh: `resources/js/Pages/Tenants/Badung/Spotlight.jsx` menang atas `Pages/Spotlight.jsx`
  hanya saat tenant aktif = Badung.

### SLICE 3 (P3) — modul eksklusif per tenant

- `app/Tenants/Badung/` (Controllers/Services khusus) + `routes/tenants/badung.php`,
  didaftarkan **hanya** bila tenant aktif = `badung` **dan** `edition = beli`.
- Gerbang fitur lewat `currentTenant()->hasFeature('nama_fitur')`.
- **INTI YANG HARAM DI-OVERRIDE** (tulis eksplisit di CONVENTIONS.md):
  1. Migrasi & skema DB.
  2. `Tenantable` + seluruh lapisan otorisasi (`authorizeReportAccess`,
     `ensureWithinJurisdiction`, `User::withinReportJurisdiction`, policy).
  3. Jalur *safety-critical*: `telepon_darurat` dan routing laporan berbasis pin GPS
     (`ReportController::store`) — nomor darurat & tujuan laporan tidak boleh pernah
     bergantung pada subdomain yang sedang dibuka.

### SLICE 4 (P1) — hak eksit: `php artisan tenant:export {city_code}`

- `app/Console/Commands/TenantExport.php` (ikuti pola `SimulateResponders.php`).
- **Peta tabel (hasil audit 2026-07-28 — semua tabel akar sudah punya `city_code`,
  tidak ada FK yang menyeberang antar kabupaten):**

| Kelompok | Tabel | Kunci ekstraksi |
|----------|-------|-----------------|
| Akar | `users`, `reports`, `pos_pemadams`, `pompas`, `hydrants`, `units` | `city_code` |
| Anak laporan | `report_photos`, `report_resolutions`, `report_units`, `report_officers`, `report_victims`, `report_helpers`, `tracking_logs` | `report_id` |
| Cucu | `report_resolution_photos` | `report_resolution_id` |
| Anak user | `fcm_tokens`, `social_accounts`, `push_subscriptions`, `notifications`, `model_has_roles` | `user_id` / `model_id` |
| **TIDAK diekspor** (katalog global — dibangun ulang dari seeder di instance tujuan) | `indonesia_*`, `roles`, `permissions`, `settings`, `announcements`, `skills`, `route_accesses`, `tenants`, `cache`, `jobs`, `sessions` | — |

- Output: berkas `.sql` berisi `INSERT` dalam urutan dependensi ke
  `storage/app/exports/tenant-{city_code}-{timestamp}.sql`, plus ringkasan jumlah baris
  per tabel ke konsol.
- Read-only terhadap DB (tidak mengubah apa pun).
- `prompt/docs/CONVENTIONS.md` — tambah dua aturan permanen:
  1. Tidak boleh ada relasi/FK yang menyeberangkan data antar `city_code`.
  2. Setiap tabel ter-scope wilayah yang baru **wajib** punya jalur ke `city_code`
     (langsung, atau via `report_id`/`user_id`) **dan** didaftarkan di peta `TenantExport`.
     Tanpa ini, hak eksit diam-diam rusak dan baru ketahuan saat dibutuhkan.

---

## 5. Blast radius

- **Middleware baru hanya di `routes/admin.php`** → jalur lapor darurat warga TIDAK
  tersentuh. Ini disengaja: jangan pernah menaruh gerbang baru di jalur safety-critical.
- **Risiko #1 (paling besar): guard salah aktif di apex** → seluruh staf non-Denpasar
  terpental dari `sisupit.com`. Mitigasi: wajib `resolveFromHost()` bukan `currentTenant()`,
  + test khusus "apex tidak memantulkan siapa pun".
- **Risiko #2: `TENANT_BASE_DOMAIN` kosong** di lokal/CI → host tidak pernah me-resolve ke
  tenant → guard harus *no-op*, bukan 403 massal. Kunci perilaku ini dengan test.
- **Shared prop Inertia `tenant`** (`HandleInertiaRequests.php:51`) — kirim `features` bila
  frontend memang perlu; **jangan** membocorkan lebih dari perlu. Pertimbangkan `edition`
  tidak dikirim ke publik (informasi komersial, bukan kebutuhan render).
- **Resolver halaman (slice 2)** menambah I/O per render bila tidak di-cache.
- **`tenant:export`** membaca banyak tabel — jalankan di luar jam sibuk.
- **`Tenantable` TIDAK disentuh** (konsisten dengan TASK_17). Guard #45 bekerja di lapisan
  *route*, bukan mengubah scope data — jadi tidak ada risiko regresi IDOR dari task ini.
- **Denpasar & Klungkung (sewa) harus nol perubahan perilaku** — `edition` default `'sewa'`
  memastikan tenant lama tidak berubah setelah migrasi.

---

## 6. Rencana verifikasi

- [x] Baseline test sebelum: `php artisan test` → **169 passed, 604 assertions** (diukur 2026-07-28, sebelum ada perubahan kode)
- [ ] Test baru `tests/Feature/Sisupit/TenantEditionTest.php`:
  - superadmin set `edition`/`features` lewat form → tersimpan
  - `hasFeature()` aman saat `features` null & saat tenant transien `fromConfig()`
  - tenant lama pasca-migrasi → `edition = 'sewa'` (tak berubah perilaku)
- [ ] Test baru `tests/Feature/Sisupit/TenantStaffHostGuardTest.php` (#45):
  - admin Denpasar → `badung.sisupit.com/admin/*` = ditolak/diarahkan
  - admin Badung → `badung.sisupit.com/admin/*` = lolos
  - superadmin → semua subdomain lolos
  - **apex/host tak dikenal → TIDAK memantulkan siapa pun**
  - warga/pelapor & rute front → tidak terpengaruh sama sekali
- [ ] Test baru `tests/Feature/Sisupit/TenantExportTest.php`:
  - seed dua kabupaten → export satu → **nol baris kabupaten lain** di berkas hasil
  - laporan beserta seluruh anak/cucunya ikut terbawa utuh
- [ ] Test sesudah hijau (≥ baseline, nol regresi)
- [ ] Verifikasi manual:
  - `/admin/tenants` → set Badung = beli + centang fitur → tersimpan & tampil benar
  - login admin Denpasar → buka subdomain Badung → tertolak dengan pesan jelas
  - login admin Denpasar → buka apex → **normal, tidak terpental**
  - warga lapor dari subdomain mana pun → alur & nomor darurat tidak berubah
  - `php artisan tenant:export 5103` → cek berkas: tidak ada `city_code` 5171
- [ ] `vendor/bin/pint` bersih
- [ ] `npm run build` lulus (jangan commit `public/build` kecuali diminta)

---

## 7. Rollback

Satu commit fokus per slice, bisa di-revert sendiri-sendiri:
- Slice 1: migrasi punya `down()`; melepas middleware dari `routes/admin.php` mengembalikan
  perilaku sekarang seketika tanpa menyentuh data.
- Slice 2: resolver punya fallback bawaan — menghapus pemanggilan `tenantPage()` cukup.
- Slice 3: modul per-tenant hidup di folder terpisah; hapus pendaftaran route-nya.
- Slice 4: perintah read-only, tidak ada yang perlu di-rollback.

---

## Acceptance criteria

- [ ] Superadmin bisa menetapkan `edition` (sewa/beli) + `features` per kabupaten lewat form
- [ ] Klungkung (sewa) bisa ditambahkan **tanpa satu baris kode pun** — cukup isi form
- [ ] Staf kabupaten lain tidak lagi bisa membuka panel admin subdomain orang (#45 FIXED)
- [ ] Apex `sisupit.com` tetap bisa dibuka semua staf (guard tidak salah aktif)
- [ ] Badung bisa punya halaman/modul berbeda **tanpa fork repo** (titik ekstensi ada & terpakai)
- [ ] `tenant:export {city_code}` menghasilkan data satu kabupaten, nol baris kabupaten lain
- [ ] Denpasar & alur lapor warga nol perubahan perilaku
- [ ] `Tenantable` tidak disentuh; tak ada regresi tenant/IDOR
- [ ] Diff minimal & sesuai konvensi (`prompt/docs/CONVENTIONS.md`, skill `sisupit-ui`)
- [ ] Dokumen diupdate: `ARCHITECTURE_MAP.md` (kolom edition/features + middleware baru +
      perintah export), `CONVENTIONS.md` (3 aturan permanen di §4), `FINDINGS_LOG.md` (#45),
      `CLAUDE.md` STATUS

---

## Catatan terbuka (di luar scope task ini — jangan dikerjakan diam-diam)

- **Data resmi Badung masih placeholder** (warisan TASK_17): `nama_instansi`, `pejabat_nama`,
  `pejabat_jabatan`, `pejabat_foto`, `telepon_darurat` (**SAFETY-CRITICAL**). Diisi user
  lewat `/admin/tenants`.
- **Ops produksi:** `TENANT_BASE_DOMAIN=sisupit.com` + `SESSION_DOMAIN=.sisupit.com`, DNS &
  sertifikat wildcard `*.sisupit.com`. Tanpa ini seluruh lapisan subdomain tidak aktif.
- **WebView Android per-kabupaten** — belum diputuskan (lihat memori `project_sisupit_webview_android`).
- **Domain sendiri untuk Badung** (mis. `damkar.badungkab.go.id`) — *ditunda* atas keputusan
  user ("cukup subdomain dulu"). Bila kelak diminta: butuh kolom `domain` di `tenants`,
  `SESSION_DOMAIN` dikosongkan (sesi per-domain, dan itu memang benar), serta pendaftaran
  redirect URI Google OAuth per domain.
- **Pemisahan DB** hanya relevan bila Badung benar-benar pindah self-host. Slice 4 adalah
  prasyaratnya; eksekusi pemisahan sendiri jadi task tersendiri saat diminta.

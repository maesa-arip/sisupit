# FINDINGS LOG — Sisupit

> Backlog temuan audit + status perbaikannya. Diisi saat onboarding (TASK_01, 2026-06-25)
> via pembacaan kode + `php artisan route:list` + `php artisan test` (read-only, tidak ada
> kode aplikasi yang diubah). **Mencatat ≠ memperbaiki** — perbaikan jadi task tersendiri
> (`tasks/TASK_0N_*.md`).
>
> Catatan: beberapa bug kritis sebelumnya (admin route tanpa role check, IDOR di
> `ReportController`, `ReportActionController` tanpa role check di awal) **sudah diperbaiki**
> di sesi sebelumnya dan terverifikasi sudah benar di kode saat ini — tidak dicatat ulang di
> sini.
>
> **Update 2026-06-25:** #1 (P0) dan #2 (P1) sudah diperbaiki (TASK_02, TASK_03) setelah
> user mengonfirmasi arah desainnya. Batch lanjutan (TASK_04) menuntaskan #3, #4, #5, #8,
> #10 penuh, dan #7/#9 sebagian (lihat detail masing-masing). **Hanya #6 yang masih
> sepenuhnya OPEN**, menunggu keputusan arsitektur dari user.

Severity: **P0** keamanan/uang/kehilangan data · **P1** bug fungsional ·
**P2** inkonsistensi/teknis-debt · **P3** kosmetik/minor.
Status: `OPEN` · `IN PROGRESS` · `FIXED` · `WONTFIX` (beri alasan).

---

| # | Sev | Judul | Lokasi (file:line) | Dampak | Status | Task |
|---|-----|-------|--------------------|--------|--------|------|
| 1 | P0 | IDOR: assign role & timpa profil user lain tanpa authorize | `app/Http/Controllers/Admin/UserController.php:213,230`, `routes/web.php:139-142` | User mana pun (termasuk `masyarakat`) bisa menjadikan SIAPA PUN relawan, atau mengubah nama/email/phone/KTP siapa pun, hanya dengan mengganti ID di URL | FIXED | TASK_02 |
| 2 | P1 | Feed "Semua Laporan" bocorkan PII nasional tanpa filter wilayah | `app/Http/Controllers/DashboardController.php:140-151` | Semua user login (masyarakat/relawan) melihat nomor HP, nama, alamat presisi SEMUA laporan se-Indonesia, bukan cuma wilayahnya | FIXED | TASK_03 |
| 3 | P3 | Route debug publik `openssl-test` tanpa auth | `routes/web.php:110-112` | Membocorkan daftar curve OpenSSL server ke publik tanpa autentikasi — info disclosure minor, kemungkinan sisa debug | FIXED | TASK_04 |
| 4 | P2 | `/webpush/subscribe` tanpa middleware `auth` tapi memanggil `$request->user()` | `routes/web.php:100-108` | Request tak terautentikasi akan memicu fatal error (null->method()) alih-alih 401 yang rapi | FIXED | TASK_04 |
| 5 | P2 | `signatureMidtrans()` nested di dalam `usernameGenerator()` | `app/Helpers/helpers.php:18-29` | Fungsi hanya terdefinisi setelah `usernameGenerator()` pernah dipanggil — fragile, berkaitan dengan Midtrans yang tidak terhubung ke alur apa pun | FIXED | TASK_04 |
| 6 | P2 | Dua jalur akses ke `report_officers`/`report_helpers` (Eloquent vs `DB::table()` mentah) | `app/Models/ReportOfficer.php`, `ReportHelper.php` vs `app/Http/Controllers/ReportActionController.php` (seluruh method) | Logika bisnis/cast di model tidak berlaku saat akses lewat `DB::table()` — risiko drift & duplikasi | FIXED (didokumentasikan, tidak direfactor) | TASK_05 |
| 7 | P3 | `formatToRupiah()`/`FINEPAYMENTSTATUS` & dependency `date-fns` terpasang tapi tidak dipakai di mana pun | `resources/js/lib/utils.js:8,18-26`; `package.json` | Dead code/dependency — jangan diasumsikan ada alur uang aktif | FIXED (helper dihapus) / WONTFIX (`date-fns` sengaja dipertahankan, keputusan user) | TASK_04 |
| 8 | P3 | `app/Models/Unit.php` stub kosong, tidak dipakai | `app/Models/Unit.php` | Dead code kandidat hapus | FIXED | TASK_04 |
| 9 | P3 | Tidak ada lint/format-check di CI meski Pint/Prettier/Duster terpasang; `npm run format` adalah auto-fix bukan check | `.github/workflows/tests.yml`; `package.json:7` | Gaya kode bisa drift tanpa terdeteksi CI | IN PROGRESS — gate informational aktif, mass-reformat dijadwalkan sebagai task terpisah | TASK_05 |
| 10 | P3 | Penamaan method tidak konsisten (`store_relawan`, `store_detail_user` snake_case vs `store`/`update` camelCase di controller yang sama) | `app/Http/Controllers/Admin/UserController.php:213,230` | Kosmetik, tapi menyulitkan deteksi pola "method ini perlu authorize seperti yang lain" | FIXED | TASK_04 |
| 11 | P2 | Sidebar pasang seksi "Administrasi" dengan gating `isStaff` (termasuk `petugas`), padahal semua route `/admin/*` digating `role:admin\|superadmin` | `resources/js/Layouts/Partials/Sidebar.jsx` (gating `isStaff`) | Petugas melihat link Verifikasi Laporan/Manajemen Fasilitas/Pengumuman yang berujung **403** saat diklik (menu menyesatkan) | FIXED | (nav cleanup) |
| 12 | P3 | Seksi "Operasional" sidebar (Lapor Darurat, Arsip & Riwayat) di-gating `auth?.user`, padahal `AppLayout` mengoper objek user langsung sebagai prop `auth` → `auth.user` selalu undefined | `resources/js/Layouts/Partials/Sidebar.jsx` (`auth?.user`), `resources/js/Layouts/AppLayout.jsx:21,113` | Dua link operasional tidak pernah tampil di sidebar desktop untuk user login | FIXED | (nav cleanup) |
| 13 | P3 | Navigasi tidak lengkap & tidak sinkron desktop↔mobile: Daftar Relawan & suite RBAC (roles/permissions/assign/route-access) tanpa entri; bottom nav `sm:hidden` membuat tablet (640–1023px) tanpa navigasi; target "Verifikasi Laporan" beda (front vs admin) | `resources/js/Layouts/Partials/Sidebar.jsx`, `MobileBottomNav.jsx` | Halaman tak terjangkau lewat menu; tablet tanpa navigasi; menu desktop/mobile inkonsisten | FIXED | (nav cleanup) |
| 14 | P1 | `AssignUserController` (Tetapkan Peran) tanpa `authorize()`/cek yurisdiksi & index tanpa `isAdmin()` scope | `app/Http/Controllers/Admin/AssignUserController.php:16-78` | Admin wilayah mana pun bisa melihat & me-`syncRoles()` SEMUA user lintas wilayah (termasuk mengangkat `admin`/`superadmin`) — eskalasi hak akses & bypass yurisdiksi. Berbeda dengan `UserController` yang sudah benar pakai `UserPolicy` + `isAdmin()` | OPEN | — |

---

## Detail temuan

### #1 — IDOR: assign role & timpa profil user lain tanpa authorize
- **Severity:** P0
- **Lokasi:** `app/Http/Controllers/Admin/UserController.php:213-247`, didaftarkan di `routes/web.php:139-142`
- **Gejala:** `PUT /users/relawan/{user}` → `store_relawan(User $user)` memanggil `$user->assignRole('relawan')` langsung. `PUT /users/detail/{user}` → `store_detail_user(UserRequest $request, User $user)` memanggil `$user->update([...])` (name/email/phone/KTP) langsung. Middleware rute hanya `['auth','verified']` — tidak ada `role:` middleware maupun pengecekan kepemilikan di dalam method.
- **Dugaan penyebab:** Kedua method menerima `User $user` dari route-model-binding, identik dengan `edit()`/`update()`/`destroy()` di controller yang sama — TAPI tiga method itu memanggil `$this->authorize('view'|'update'|'delete', $user)` (cek `UserPolicy::withinJurisdiction`), sedangkan dua method ini tidak. Tampak seperti method yang ditambahkan belakangan (untuk fitur "assign role relawan dari admin" / "lengkapi profil") tanpa mengikuti pola authorize yang sudah ada di controller yang sama.
- **Dampak:** Privilege escalation (siapa pun bisa membuat dirinya/orang lain jadi relawan) + akun takeover parsial (nama/email/no HP/KTP user lain bisa ditimpa oleh user lain yang login).
- **Rekomendasi:** Tambahkan `$this->authorize('update', $user)` di awal kedua method (pola yang sudah ada di `update()`), ATAU jika maksudnya method ini untuk self-service (mirror `VolunteerController::register` yang benar pakai `$request->user()`), ganti parameter dari route-model-binding ID jadi `$request->user()` saja. Perlu konfirmasi user: apakah dua endpoint ini memang dimaksudkan admin-only (assign relawan untuk user lain) atau self-service — desain fix-nya beda.
- **Keputusan user (2026-06-25):** self-service — warga mendaftar relawan/melengkapi profil sendiri, bukan admin assign untuk user lain.
- **Fix:** `abort_unless($user->id === auth()->id(), 403)` ditambahkan di awal kedua method (`app/Http/Controllers/Admin/UserController.php:216,236`). Detail di `prompt/tasks/TASK_02_idor_relawan_profile.md`. Regression test: `tests/Feature/Sisupit/UserSelfServiceAuthorizationTest.php`.
- **Status:** FIXED (TASK_02)

### #2 — Feed "Semua Laporan" bocorkan PII nasional tanpa filter wilayah
- **Severity:** P1 (P0 jika dianggap kebocoran data pribadi pelapor darurat)
- **Lokasi:** `app/Http/Controllers/DashboardController.php:140-151`
- **Gejala:** `$reportsFeed = Report::withoutGlobalScopes()->with(['helpers.user'])->latest('created_at')->paginate(...)` dikirim mentah (tanpa Resource transform) ke `page_data.reports` untuk SEMUA user yang login di dashboard publik (masyarakat & relawan), tanpa filter wilayah apa pun.
- **Dugaan penyebab:** Di fungsi yang sama, `$nearbyEmergencies` (untuk relawan) justru benar memfilter berdasarkan `village_code`/`district_code`/`city_code`/`province_code` user. `$reportsFeed` sepertinya dimaksudkan untuk tab "Semua Laporan" di UI tapi lupa diberi filter yang sama, atau memang sengaja dibuat nasional sebagai "papan transparansi publik" — **tidak jelas dari kode mana yang dimaksud, perlu konfirmasi user**.
- **Dampak:** Setiap warga (`masyarakat`) yang login bisa melihat nomor HP, nama, dan alamat presisi pelapor dari laporan darurat di SELURUH Indonesia, bukan cuma daerahnya — potensi pelanggaran privasi data pelapor (yang mungkin berisi info sensitif terkait insiden kebakaran/darurat pribadi).
- **Rekomendasi:** Jika "Semua Laporan" memang harus nasional (transparansi publik), strip kolom PII (`phone`, `name`, koordinat presisi) lewat Resource sebelum dikirim. Jika seharusnya per-wilayah, terapkan filter level wilayah yang sama seperti `$nearbyEmergencies`, atau hapus `withoutGlobalScopes()` agar `Tenantable` berlaku otomatis (catatan: user biasa kemungkinan tidak punya kolom wilayah admin-tier, jadi `Tenantable` defaultnya pakai kolom wilayah USER sendiri — perlu dicek ulang perilakunya untuk role `masyarakat`/`relawan`, bukan hanya admin).
- **Keputusan user (2026-06-25):** per-wilayah sesuai tenant (bukan nasional).
- **Fix:** Hapus `->withoutGlobalScopes()` dari query `$reportsFeed` (`app/Http/Controllers/DashboardController.php:140`) — scope `Tenantable` otomatis berlaku berdasarkan wilayah user yang login, konsisten dengan mekanisme yang sama dipakai di tempat lain. Detail di `prompt/tasks/TASK_03_dashboard_report_feed_scope.md`. Regression test: `tests/Feature/Sisupit/DashboardReportFeedTenantScopeTest.php`.
- **Status:** FIXED (TASK_03)

### #3 — Route debug publik `openssl-test`
- **Severity:** P3
- **Lokasi:** `routes/web.php:110-112`
- **Gejala:** `GET /openssl-test` tanpa middleware apa pun, mengembalikan `openssl_get_curve_names()` sebagai JSON ke siapa saja.
- **Dugaan penyebab:** Sisa debugging saat setup environment SSL/curl, lupa dihapus.
- **Dampak:** Minor info disclosure (daftar curve OpenSSL server) — tidak sensitif tapi tidak perlu publik.
- **Rekomendasi:** Hapus route ini jika sudah tidak diperlukan untuk debugging produksi.
- **Fix:** Route dihapus dari `routes/web.php`. Regression test:
  `tests/Feature/Sisupit/OpensslTestRouteRemovedTest.php` (assert 404).
- **Status:** FIXED (TASK_04)

### #4 — `/webpush/subscribe` tanpa middleware `auth`
- **Severity:** P2
- **Lokasi:** `routes/web.php:100-108`
- **Gejala:** Route closure memanggil `$request->user()->updatePushSubscription(...)` tapi route tidak dibungkus middleware `auth`. Jika diakses tanpa login, `$request->user()` bernilai `null` → fatal error method call on null (HTTP 500) bukan 401 yang rapi.
- **Dugaan penyebab:** Kemungkinan terlewat saat menambahkan WebPush, dibandingkan `/fcm-token` di atasnya yang sudah benar dibungkus `Route::middleware('auth')`.
- **Dampak:** Bukan kebocoran data (akan error sebelum melakukan apa pun yang berarti), tapi UX buruk & noise di error log.
- **Rekomendasi:** Tambahkan middleware `auth` ke route ini, konsisten dengan `/fcm-token`.
- **Fix:** `Route::middleware('auth')->post('/webpush/subscribe', ...)` di `routes/web.php:100`.
  Regression test: `tests/Feature/Sisupit/WebPushSubscribeAuthTest.php` (unauth → 401,
  auth → 200).
- **Status:** FIXED (TASK_04)

### #5 — `signatureMidtrans()` nested di dalam `usernameGenerator()`
- **Severity:** P2
- **Lokasi:** `app/Helpers/helpers.php:18-29`
- **Gejala:** Definisi `function signatureMidtrans(...)` berada di dalam body `if (!function_exists('usernameGenerator'))`, setelah `function usernameGenerator(...)` tapi sebelum penutup blok `if` — secara efektif nested function declaration.
- **Dugaan penyebab:** Kesalahan indentasi/copy-paste saat menambahkan helper Midtrans, harusnya jadi top-level `if (!function_exists('signatureMidtrans'))` sendiri.
- **Dampak:** `signatureMidtrans()` tidak akan terdefinisi (`Call to undefined function`) kecuali `usernameGenerator()` sudah pernah dipanggil sebelumnya dalam request yang sama — fragile. Saat ini tidak ada pemanggil `signatureMidtrans()` yang ditemukan (Midtrans tidak terhubung ke alur apa pun), jadi belum termanifestasi sebagai bug nyata.
- **Rekomendasi:** Pisahkan jadi deklarasi top-level sendiri di `helpers.php` jika/ketika Midtrans benar-benar dipakai.
- **Fix:** `signatureMidtrans()` dipindah jadi blok `if (!function_exists(...))` top-level
  tersendiri di `app/Helpers/helpers.php`, sejajar dengan `flashMessage`/`usernameGenerator`.
  Diverifikasi via `php -r "require 'vendor/autoload.php'; var_dump(function_exists('signatureMidtrans'));"`
  → `true` tanpa memanggil `usernameGenerator()` dulu. Regression test:
  `tests/Unit/Sisupit/HelpersFunctionExistenceTest.php`.
- **Status:** FIXED (TASK_04)

### #6 — Dua jalur akses ke `report_officers`/`report_helpers`
- **Severity:** P2
- **Lokasi:** Model: `app/Models/ReportOfficer.php`, `app/Models/ReportHelper.php`. Raw access: seluruh method `app/Http/Controllers/ReportActionController.php`. Eloquent access: `app/Http/Controllers/ReportHelperController.php`.
- **Gejala:** Tabel yang sama diakses lewat dua pola berbeda tergantung controller.
- **Dugaan penyebab:** `ReportActionController` ditulis untuk workflow real-time (perf-sensitive, lock manual via `lockForUpdate()`), `ReportHelperController` ditulis untuk CRUD biasa via Eloquent — kemungkinan disengaja untuk performa, tapi tidak didokumentasikan sebagai keputusan sadar.
- **Dampak:** Validasi/cast/event model (`ReportOfficer`/`ReportHelper`) tidak ikut berjalan saat lewat `DB::table()` — kalau nanti ditambah observer/cast di model, separuh kode tidak akan ikut kena efeknya.
- **Rekomendasi:** Dokumentasikan sebagai keputusan sadar (kalau memang untuk performa) di komentar, atau konsolidasi ke satu pola saat ada task yang menyentuh area ini.
- **Keputusan user (2026-06-25):** dokumentasikan saja sebagai disengaja, jangan refactor.
- **Fix:** Komentar ditambahkan di `app/Http/Controllers/ReportActionController.php`
  (atas class) dan di `app/Models/ReportOfficer.php`/`ReportHelper.php`, menjelaskan
  bahwa `DB::table()` mentah di `ReportActionController` sengaja dipilih demi
  `lockForUpdate()` (cegah double-insert saat respons konkuren), dan model Eloquent
  tetap dipakai jalur lain (`ReportHelperController`). Tidak ada perubahan perilaku.
  Detail di `prompt/tasks/TASK_05_documentation_and_deferred.md`.
- **Status:** FIXED — didokumentasikan, konsolidasi kode TIDAK dilakukan (TASK_05)

### #7 — `formatToRupiah()`/`FINEPAYMENTSTATUS` & `date-fns` tidak dipakai
- **Severity:** P3
- **Lokasi:** `resources/js/lib/utils.js:8,18-26`; `package.json`
- **Gejala:** Helper currency Rupiah, konstanta `FINEPAYMENTSTATUS` (ditemukan tambahan
  saat eksekusi — leftover yang sama dari subsistem Fine yang sudah dihapus di backend),
  dan dependency `date-fns` terpasang tapi nol pemakaian di seluruh `resources/js`.
- **Dugaan penyebab:** Sisa dari template/starter kit (sama dengan sisa subsistem
  Book/Loan/Fine backend yang sudah dihapus di sesi sebelumnya), atau disiapkan untuk
  fitur yang belum jadi.
- **Dampak:** Dead code minor, tidak berbahaya, tapi bisa menyesatkan kontributor baru mengira ada alur uang aktif.
- **Rekomendasi:** Hapus jika dikonfirmasi tidak dipakai untuk rencana fitur mendatang.
- **Fix:** `formatToRupiah()` dan `FINEPAYMENTSTATUS` dihapus dari
  `resources/js/lib/utils.js`. `npm run build` dijalankan untuk verifikasi, lalu
  `public/build` hasil build di-revert (`git checkout -- public/build && git clean -fd public/build`)
  agar tidak menambah diff aset yang tidak terkait task ini.
- **Keputusan user (2026-06-25):** `date-fns` di `package.json` **sengaja dipertahankan**
  (kemungkinan dipakai untuk format tanggal lokal id-ID yang lebih baik dari `Intl` manual
  di masa depan) — bukan dihapus.
- **Status:** FIXED (helper/konstanta dihapus) — `date-fns` WONTFIX (dipertahankan sengaja, TASK_04)

### #8 — `app/Models/Unit.php` stub kosong
- **Severity:** P3
- **Lokasi:** `app/Models/Unit.php`
- **Gejala:** Model class kosong, tidak ada migration/controller/route yang merujuknya.
- **Dampak:** Dead code.
- **Rekomendasi:** Hapus jika dikonfirmasi tidak dipakai.
- **Fix:** File dihapus, setelah diverifikasi nol referensi di `app/`, `routes/`, `database/`.
- **Status:** FIXED (TASK_04)

### #9 — Tidak ada lint/format-check di CI
- **Severity:** P3
- **Lokasi:** `.github/workflows/tests.yml` (tidak ada step lint); `package.json:7` (`"format": "prettier --write ."`, bukan `--check`)
- **Gejala:** Pint, Prettier, dan Duster semua terpasang sebagai dependency tapi tidak ada satu pun yang digerbangkan di CI atau punya mode "check" yang terpisah dari "fix".
- **Dampak:** Gaya kode bisa drift antar kontributor tanpa terdeteksi otomatis.
- **Ditemukan saat eksekusi (2026-06-25):** `vendor/bin/pint --test` saat ini gagal di
  **35+ file pre-existing** (termasuk `config/*.php` bawaan Laravel yang tidak pernah
  disentuh, migrasi, seeder, `routes/*.php`) dan `npx prettier --check .` gagal di
  **144 file**. Menjadikan keduanya blocking di CI sekarang akan membuat CI merah
  permanen karena utang gaya kode lama, bukan karena perubahan baru — melanggar prinsip
  diff minimal kalau langsung di-reformat massal sekarang.
- **Fix (parsial):** Step Pint & Prettier ditambahkan ke `.github/workflows/tests.yml`
  dengan `continue-on-error: true` (informational, tidak blocking) supaya driftnya
  terlihat di CI tanpa memblokir PR yang tidak terkait.
- **Keputusan user (2026-06-25):** mass-reformat 35+ file Pint / 144 file Prettier
  dijadwalkan sebagai **task terpisah** (PR khusus formatting, terisolasi dari
  perubahan fungsional), bukan dikerjakan sekarang. Lihat
  `prompt/tasks/TASK_05_documentation_and_deferred.md`.
- **Status:** IN PROGRESS — gate informational sudah aktif, mass-reformat dijadwalkan (belum dikerjakan)

### #10 — Penamaan method tidak konsisten
- **Severity:** P3
- **Lokasi:** `app/Http/Controllers/Admin/UserController.php:213,230`
- **Gejala:** `store_relawan`/`store_detail_user` (snake_case) vs `store`/`update`/`destroy` (camelCase) di controller yang sama.
- **Dampak:** Kosmetik, tapi pola penamaan yang berbeda membuatnya "menonjol keluar" dari konvensi CRUD standar — salah satu sinyal kecil yang seharusnya memicu pertanyaan "kenapa method ini beda" (yang ternyata berkaitan dengan temuan #1).
- **Rekomendasi:** Samakan ke camelCase saat method ini disentuh untuk fix #1 (bukan rename terpisah di luar scope).
- **Fix:** Direname jadi `storeRelawan`/`storeDetailUser` (`app/Http/Controllers/Admin/UserController.php`),
  beserta string action di `Route::controller(...)->group()` (`routes/web.php:136-137`).
  Nama route (`admin.relawan.update`/`admin.detail.update`) dan caller frontend
  (`resources/js/Pages/Profile/Edit.jsx:50`) tidak berubah karena keduanya hanya
  mereferensikan nama route, bukan nama method.
- **Status:** FIXED (TASK_04)

### #11 — Device baru tidak terdaftar di `fcm_tokens` (registrasi sekali-tembak tanpa retry)
- **Severity:** P2 (notifikasi darurat tidak sampai ke device yang gagal registrasi)
- **Lokasi:** `resources/js/Layouts/AppLayout.jsx` (poll bridge + POST), proyek WebView
  `SisupitWebView/app/.../MainActivity.java#postToken`, `.../SisupitFirebaseMessagingService.java#onNewToken`
- **Gejala:** Login dari device lain tidak menambah baris di tabel `fcm_tokens`, padahal
  wiring FCM benar (package `com.sisupit.app` cocok, service terdaftar, `default_notification_channel_id`
  ada, route `fcm.store` + Ziggy `@routes` tersedia). **Bukan** pembatasan akun — `fcmTokens`
  adalah `hasMany` tanpa cap; unique hanya di kolom `token` (per-device).
- **Akar masalah:** Registrasi token bersifat sekali-tembak tanpa retry di beberapa titik:
  (1) `MainActivity#postToken` memanggil `getToken()` sekali — di fresh install panggilan
  pertama bisa gagal/lambat (Firebase Instance ID belum siap) lalu hanya di-log & `return`;
  (2) `onNewToken` tidak meng-upload (hanya `Log`); (3) sisi JS POST sekali tanpa retry dan
  `delete window.receiveFcmTokenFromNative` di cleanup menghapus callback selagi `getToken()`
  async masih berjalan → token jatuh ke `undefined` saat user pindah halaman. Device dev
  yang sudah "warm" selalu sukses; device baru yang kena satu hambatan jadi permanen tidak terdaftar.
- **Fix:**
  - `EmergencyAlertNotification::via()` — WebPush dimatikan sementara (per permintaan user),
    hanya `[FcmChannel, 'database', 'broadcast']`. `toWebPush()` & import dibiarkan agar mudah diaktifkan lagi.
  - `AppLayout.jsx` — POST token dengan retry (4x, backoff), callback TIDAK lagi dihapus di
    cleanup, guard token kosong, timeout poll 10s→15s.
  - `FcmController::store` — `Log::info` audit (user_id, device_type, token_tail, was_new).
  - `MainActivity.java` — `getToken()` retry 4x (backoff 2/4/6s); injeksi JS di-guard
    `if (window.receiveFcmTokenFromNative)` agar tidak error di halaman login/guest.
- **Catatan:** `SisupitFirebaseMessagingService#onNewToken` sengaja TIDAK upload langsung —
  service background tidak punya sesi/cookie auth; registrasi tetap lewat WebView (poll per
  halaman ber-AppLayout sudah memanggil `getToken()` ulang tiap mount).
- **Verifikasi:** `php artisan test` 74 passed (181 assertions, tanpa regresi); `npm run build` sukses.
  Verifikasi device-side: chrome://inspect + logcat tag `FCM`/`SisupitFCM`, dan `Log::info`
  "FCM token registered" di server.
- **Status:** FIXED (2026-06-25)

### #12 — Hapus PWA web (shell saja; WebPush backend dibiarkan dorman)
- **Severity:** —, perubahan atas permintaan user (bukan bug). Notifikasi dipusatkan ke FCM native.
- **Scope keputusan user (2026-06-25):** hapus *shell* PWA saja; backend WebPush
  (`/webpush/*`, trait `HasPushSubscriptions`, `toWebPush()`, package, tabel `push_subscriptions`)
  **tetap ada tapi dorman** agar mudah diaktifkan lagi. Channel WebPush sudah dimatikan di #11.
- **Perubahan:**
  - `public/sw.js` → diganti jadi **kill-switch** (`skipWaiting` + `caches.delete` +
    `registration.unregister()` + reload klien). Sengaja TIDAK dihapus agar service worker
    yang sudah ter-install di browser/HP pengguna lama mencabut diri saat update berkala.
    Hapus permanen beberapa minggu kemudian.
  - Dihapus: `public/manifest.webmanifest`, `public/manifest.json` (yatim),
    `resources/js/Components/InstallPWAButton.jsx` (dead, tak dipakai),
    `resources/js/Components/WebPushSubscribe.jsx` (satu-satunya pendaftar `/sw.js`).
  - `resources/views/app.blade.php` — hapus `<link rel="manifest">` & meta
    `apple-mobile-web-app-capable`/`-status-bar-style`. `theme-color`, favicon,
    `apple-touch-icon` dibiarkan (web umum, bukan khusus PWA).
  - `resources/js/Layouts/AppLayout.jsx` — hapus import & render `<WebPushSubscribe/>`,
    dan blok `serviceWorker.onmessage` PLAY_SOUND (sudah mati: `sw.js` tak pernah kirim
    pesan itu).
- **Verifikasi:** `php artisan test` 74 passed (181 assertions, `WebPushSubscribeAuthTest`
  tetap hijau karena rute backend dipertahankan); `npm run build` sukses; nol referensi
  dangling ke komponen/manifest yang dihapus.
- **Status:** DONE (2026-06-25)

### #14 — `AssignUserController` (Tetapkan Peran) tanpa authorize/yurisdiksi
- **Severity:** P1 (eskalasi hak akses lintas wilayah)
- **Lokasi:** `app/Http/Controllers/Admin/AssignUserController.php:16-78`
- **Gejala:** `index()` menampilkan SEMUA user tanpa scope `isAdmin()`; `edit()`/`update()`
  tidak memanggil `$this->authorize(...)` maupun cek yurisdiksi. `update()` langsung
  `$user->syncRoles($request->roles)` dengan validasi `exists:roles,id` saja — tidak
  membatasi peran apa yang boleh diberikan.
- **Dampak:** Admin wilayah mana pun (lewat menu "Tetapkan Peran" di `routes/admin.php:58-62`)
  bisa melihat & mengubah peran user di luar wilayahnya, termasuk mengangkat siapa pun jadi
  `admin`/`superadmin`. Berbeda jauh dari `UserController` yang sudah benar memakai
  `UserPolicy::withinJurisdiction` (edit/update/destroy) + scope `isAdmin()` (index).
- **Ditemukan saat:** menambah fitur penetapan peran di halaman Manajemen Pengguna
  (2026-06-27). Fitur baru itu sengaja TIDAK reuse endpoint ini; dibuat sebagai
  `UserController::assignRole` dengan `$this->authorize('update', $user)` + whitelist peran
  (admin maksimal memberi `petugas`, hanya superadmin yang boleh `admin`/`superadmin`).
- **Rekomendasi:** Beri `AssignUserController` perlakuan yang sama (authorize via `UserPolicy`,
  scope `isAdmin()` di index, whitelist peran via `Rule::in`), atau pertimbangkan menghapus
  menu "Tetapkan Peran" lama karena kini tumpang tindih dengan fitur di Manajemen Pengguna.
- **Status:** OPEN (dicatat, tidak diperbaiki di task ini — di luar scope)

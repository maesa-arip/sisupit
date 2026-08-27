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
> #10 penuh, dan #7/#9 sebagian (lihat detail masing-masing).
>
> **Update 2026-06-28:** ditambahkan 4 temuan berbasis permintaan fitur user (#16–#19,
> gap fitur bukan bug). #16 (notif balik ke pelapor) jadi **task aktif** (TASK_06).
> #17/#18/#19 OPEN sebagai backlog; #19 (armada/Unit) BLOCKED menunggu keputusan scope.
>
> **Update 2026-06-29:** #19 (armada/Unit) FIXED (TASK_09) setelah scope dikonfirmasi user.
> Sisa backlog: #18 (chat, TASK_08) DITUNDA atas keputusan user; #9 mass-reformat (P3, terpisah).

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
| 9 | P3 | Tidak ada lint/format-check di CI meski Pint/Prettier/Duster terpasang; `npm run format` adalah auto-fix bukan check | `.github/workflows/tests.yml`; `package.json:7` | Gaya kode bisa drift tanpa terdeteksi CI | FIXED (mass-reformat 2026-06-29: 81 PHP + 122 JS/JSX) | TASK_05 |
| 10 | P3 | Penamaan method tidak konsisten (`store_relawan`, `store_detail_user` snake_case vs `store`/`update` camelCase di controller yang sama) | `app/Http/Controllers/Admin/UserController.php:213,230` | Kosmetik, tapi menyulitkan deteksi pola "method ini perlu authorize seperti yang lain" | FIXED | TASK_04 |
| 11 | P2 | Sidebar pasang seksi "Administrasi" dengan gating `isStaff` (termasuk `petugas`), padahal semua route `/admin/*` digating `role:admin\|superadmin` | `resources/js/Layouts/Partials/Sidebar.jsx` (gating `isStaff`) | Petugas melihat link Verifikasi Laporan/Manajemen Fasilitas/Pengumuman yang berujung **403** saat diklik (menu menyesatkan) | FIXED | (nav cleanup) |
| 12 | P3 | Seksi "Operasional" sidebar (Lapor Darurat, Arsip & Riwayat) di-gating `auth?.user`, padahal `AppLayout` mengoper objek user langsung sebagai prop `auth` → `auth.user` selalu undefined | `resources/js/Layouts/Partials/Sidebar.jsx` (`auth?.user`), `resources/js/Layouts/AppLayout.jsx:21,113` | Dua link operasional tidak pernah tampil di sidebar desktop untuk user login | FIXED | (nav cleanup) |
| 13 | P3 | Navigasi tidak lengkap & tidak sinkron desktop↔mobile: Daftar Relawan & suite RBAC (roles/permissions/assign/route-access) tanpa entri; bottom nav `sm:hidden` membuat tablet (640–1023px) tanpa navigasi; target "Verifikasi Laporan" beda (front vs admin) | `resources/js/Layouts/Partials/Sidebar.jsx`, `MobileBottomNav.jsx` | Halaman tak terjangkau lewat menu; tablet tanpa navigasi; menu desktop/mobile inkonsisten | FIXED | (nav cleanup) |
| 14 | P1 | `AssignUserController` (Tetapkan Peran) tanpa `authorize()`/cek yurisdiksi & index tanpa `isAdmin()` scope | `app/Http/Controllers/Admin/AssignUserController.php:16-78` | Admin wilayah mana pun bisa melihat & me-`syncRoles()` SEMUA user lintas wilayah (termasuk mengangkat `admin`/`superadmin`) — eskalasi hak akses & bypass yurisdiksi. Berbeda dengan `UserController` yang sudah benar pakai `UserPolicy` + `isAdmin()` | FIXED | — |
| 15 | P3 | Scaffolding Midtrans (dead code) menyuntik `snap.js` ke setiap halaman | `resources/views/app.blade.php:42`, `app/Helpers/helpers.php`, `config/services.php`, `composer.json`, `.env`/`.env.testing` | Midtrans tidak dipakai (tak ada `window.snap`/controller pembayaran) tapi `snap.js` dimuat global → warning `data-client-key` + telemetri gopay/faro di console produksi. Membingungkan kontributor (seolah ada flow uang) | FIXED | — |
| 16 | P2 | Tidak ada notifikasi balik ke pelapor saat status laporannya berubah | `app/Http/Controllers/ReportActionController.php` (approve l.26, takeAction l.62, arrive l.100, resolve l.123) | Pelapor tak pernah tahu laporannya divalidasi/direspons/selesai — `Notification::send` hanya menarget responder (l.51/54), tak ada loop-balik ke `report->user` | FIXED | TASK_06 |
| 17 | P2 | Laporan hanya bisa membawa satu foto | `database/migrations/2025_07_19_091844_create_reports_table.php:25`, `app/Models/Report.php:28` | `reports.photo` satu kolom string → tidak bisa banyak foto/sudut/progres; insiden nyata butuh galeri | FIXED | TASK_07 |
| 18 | P2 | Tidak ada kanal pesan/koordinasi per insiden (responder ↔ command center) | `app/Http/Controllers/ReportActionController.php`, `Reports/Show.jsx` | Koordinasi lapangan hanya lewat status + tracking; tak ada chat real-time ter-scope per laporan meski Reverb sudah ada | OPEN | TASK_08 |
| 19 | P3 | Tidak ada manajemen armada/Unit (kendaraan & dispatch) | `app/Models/Unit.php` (tidak ada — peta arsitektur basi), `app/` (nol tabel `units`) | Sistem mengoordinasi orang tapi bukan kendaraan; tak ada katalog unit, status, atau dispatch ke insiden — fondasi DAMKAR hilang | FIXED | TASK_09 |
| 20 | P1 | Petugas dengan yurisdiksi kecamatan+ terjebak loop "lengkapi profil sampai desa" | `app/Http/Middleware/EnsureProfileComplete.php:37,61` × `app/Http/Controllers/Admin/UserController.php:281` | `trimRegionToLevel()` meng-null-kan `village_code` saat level kecamatan/kabupaten/provinsi (benar untuk tenant scope), tapi middleware menganggap `village_code` null = profil belum lengkap & `petugas` tak ada di `EXEMPT_ROLES` → petugas dilempar ke complete-profile tiap login; mengisinya malah merusak yurisdiksi (terkurung 1 desa) | FIXED | — |
| 21 | P1 | Admin wilayah bisa mengelola RBAC global (role/permission/route-access) & pengumuman nasional | `routes/admin.php:12` (grup `role:admin\|superadmin` membungkus semua) | Admin wilayah (mis. `admin@denpasar.go.id`) punya CRUD penuh ke `/admin/roles`, `/admin/permissions`, `/admin/assign-permissions`, `/admin/route-accesses` (model akses GLOBAL — bisa mendefinisikan ulang kewenangan seluruh sistem) + `/admin/announcements` (broadcast nasional). Controller RBAC tak punya cek role internal, murni andalkan middleware grup | FIXED | — |
| 22 | P1 | Daftar relawan tidak ter-scope yurisdiksi (petugas wilayah mana pun lihat & buka detail relawan se-Indonesia) | `app/Http/Controllers/Front/RelawanController.php` — `index()` l.20, `regionFilterOptions()` l.102, `show()` l.52 | Rute sudah di-gate `petugas\|admin\|superadmin` (bukan publik), tapi query tidak pakai `isAdmin()` → petugas Denpasar melihat seluruh relawan nasional di daftar, dropdown filter penuh wilayah luar, dan bisa membuka detail (nama/HP/alamat/KTP-area) relawan lintas wilayah via ID. Bocor PII relawan lintas-tenant | FIXED | — |
| 23 | P2 | Manajemen Fasilitas Pompa & Pos Pemadam belum ada di panel admin (+ bug `$fillable` salah kolom) | `routes/web.php` (grup admin), `app/Http/Controllers/Admin/`, `app/Models/Pompa.php`, `PosPemadam.php` | Admin tak bisa CRUD Pompa/Pos (hanya halaman publik read-only); `$fillable` menyebut `location_lat/lng` yang tak ada → koordinat & yurisdiksi diam-diam dibuang saat create | FIXED | — |
| 24 | P1 | Tombol "Tolak Data" **rusak** (salah nama route `reports.destroy`) → tidak berfungsi; tak ada status/arsip untuk laporan ditolak | `resources/js/Pages/Front/Reports/Show.jsx:136`; `routes/web.php:129` (`front.reports.destroy`); `app/Http/Controllers/ReportActionController.php` | Klik "Tolak Data" melempar error Ziggy (route tak ada) → fitur tolak mati total. (Koreksi: `Report` ternyata **sudah** pakai `SoftDeletes`, jadi `destroy` bukan hard-delete; isu riil = tombol rusak + tak ada arsip in-app/pembeda hoax vs ditarik pemilik) | FIXED | TASK_10 |
| 25 | P2 | Tidak ada UI lonceng/inbox notifikasi web — channel `database` menulis ke tabel `notifications` yang tak pernah ditampilkan | `resources/js/Layouts/AppLayout.jsx:119-175` (header tanpa bell), `app/Notifications/EmergencyAlertNotification.php:33` (`'database'`) | Notifikasi yang disimpan di DB sia-sia di web; melemahkan rencana #16 (TASK_06) karena pelapor non-Android tetap tak melihat update. Loop-balik kepercayaan tak lengkap | FIXED | TASK_11 (terkait #16) |
| 26 | P2 | `take-action`/`arrive` tidak ter-scope yurisdiksi maupun cek `is_standby` | `app/Http/Controllers/ReportActionController.php:62,100` | `approve` menyiarkan hanya ke relawan siaga di wilayah, tapi endpoint respons hanya cek `hasAnyRole` + `withoutGlobalScopes` → relawan luar wilayah / yang sudah matikan siaga tetap bisa join insiden mana pun via POST langsung. Inkonsisten dgn model multi-tenant | FIXED | TASK_12 |
| 27 | P2 | Tidak ada aksi "Batal Meluncur" (un-respond) bagi responder | `app/Http/Controllers/ReportActionController.php` (tak ada method), `resources/js/Pages/Front/Reports/Show.jsx:480-499` | Salah pencet "Meluncur" → terkunci `en_route` selamanya + GPS terus terkirim sampai staff `resolve`. Tak ada jalan mundur untuk responder | FIXED | TASK_13 |
| 28 | P2 | Perubahan status (`approve`/`resolve`) tidak di-broadcast → halaman `Show` yang terbuka tak update real-time | `app/Http/Controllers/ReportActionController.php:26,123` (hanya `back()`, tanpa broadcast event status) | Tracking lokasi real-time, tapi transisi status tidak; pelapor/responder yang halamannya terbuka harus refresh; GPS responder baru berhenti setelah props segar | FIXED | TASK_14 |
| 29 | P3 | Batch minor flow respons: `report->category` dead reference (kolom tak ada, selalu fallback "KEBAKARAN"); aksi tak cek status report dulu (mis. `take-action` di laporan `resolved`); casing import campur `@/components/ui` vs folder `Components` | `app/Notifications/EmergencyAlertNotification.php:39,47`; `app/Http/Controllers/ReportActionController.php` (semua aksi); ~8 file React (mis. `Reports/Show.jsx:6`, `ReportCard.jsx:6`) | Dead reference kosmetik; edge-case transisi status; risiko build gagal di FS case-sensitive bila rebuild di VPS (CI Ubuntu saat ini hijau) | FIXED | TASK_15 |
| 30 | P2 | `Reports/Edit.jsx` adalah form Publisher yang salah → edit laporan non-fungsional | `resources/js/Pages/Front/Reports/Edit.jsx`, `app/Http/Controllers/ReportController.php` (`edit`/`update`) | Halaman edit laporan menampilkan form penerbit (logo/email) sisa scaffolding lama; field tak cocok `ReportRequest` → update pasti gagal. Edit laporan tak pernah berfungsi | FIXED | TASK_16 |
| 31 | P2 | Channel broadcast `report-tracking.{id}` + akses halaman `Show` laporan TIDAK ter-scope yurisdiksi → staf wilayah mana pun memantau GPS/PII insiden se-Indonesia | `routes/channels.php:22-31`, `app/Http/Controllers/ReportController.php:75,78` | `isStaff = hasAnyRole(['admin','superadmin','petugas'])` tanpa cek wilayah → tiap petugas/admin bisa subscribe channel laporan mana pun (lokasi pelapor + GPS responder live + koreksi titik) & buka `Show` lintas wilayah. Inkonsisten dgn keputusan regional #2/#22/#26 | FIXED (regional, `User::withinReportJurisdiction`) | — |
| 32 | P3 | Dispatch/release unit tak cek yurisdiksi laporan; `releaseUnit` menulis status unit lintas-tenant via `withoutGlobalScopes()` tanpa re-check (langgar ATURAN EMAS #7) | `app/Http/Controllers/ReportActionController.php:206-262` (`dispatchUnit`/`releaseUnit`); `app/Models/ReportUnit.php` (tanpa Tenantable) | Beda dgn `takeAction`/`arrive` yang panggil `ensureWithinJurisdiction`. `releaseUnit` set unit wilayah lain → `available` (report_id+unit_id enumerable) → korup state dispatch wilayah lain. `dispatchUnit`: unit ter-scope tapi report tidak → kerahkan unit sendiri ke insiden luar wilayah | FIXED | — |
| 34 | P2 | Deteksi GPS form lapor: fix jaringan/IP diterima tanpa cek akurasi (lokasi "lari ke kota lain"), cache basi 30 dtk, tak ada fallback, & 2 permintaan GPS bersamaan | `resources/js/Pages/Front/Reports/Create.jsx`, `resources/js/Components/UserLeafletMap.jsx`, `resources/js/lib/utils.js` | `coords.accuracy` tak pernah dibaca → fix WiFi/IP (akurasi puluhan km) auto-isi yurisdiksi salah; `maximumAge:30000` → fix basi; timeout tanpa fallback → "tidak terdeteksi"; Create & UserLeafletMap sama-sama panggil `getCurrentPosition` | FIXED | — |
| 35 | P2 | Ketergantungan OSM publik & fallback config diam-diam: routing OSRM belum self-hosted (server demo publik), default config Nominatim/OSRM fallback ke publik bila env hilang, & URL tile CARTO hardcoded di 14 file | `config/services.php`, `.env`/`.env.example`, `app/Http/Controllers/Api/RouteController.php`, 14 file peta `resources/js/**` | Routing selalu pukul `router.project-osrm.org` (rate-limit/ToS + bocor koordinat); default publik = leak diam-diam saat env lupa; tile URL tersebar sulit dialihkan | FIXED (lokal + VPS 3 env) | — |
| 36 | P3 | Seeder fasilitas: `district_code`/`village_code` Pompa & Pos Pemadam salah label vs kode BPS laravolt (mis. `517102` dikomentari "Denpasar Barat" padahal itu Denpasar Timur; Pompa Pasar Badung di Denpasar Barat tapi ber-`district_code` 517102) | `database/seeders/PompaSeeder.php`, `database/seeders/PosPemadamSeeder.php` | Titik (lat/lng) sudah benar & peta plot per koordinat, TAPI `Tenantable` menyaring fasilitas per `district_code`/`village_code` → admin kecamatan bisa salah lihat/sembunyi fasilitas. Ditemukan saat memperbaiki koordinat (titik tidak diubah untuk yang sudah benar). Perlu keputusan: samakan kode ke lokasi asli (ubah scoping) | OPEN | — |

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
  → `true` tanpa memanggil `usernameGenerator()` dulu. Regression test (saat itu):
  `tests/Unit/Sisupit/HelpersFunctionExistenceTest.php`.
- **Status:** FIXED (TASK_04) — kemudian **SUPERSEDED oleh #15**: `signatureMidtrans()`
  beserta seluruh scaffolding Midtrans dihapus total 2026-06-27 (test regresi ikut dihapus).

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
- **Fix (2026-06-29):** mass-reformat dijalankan sebagai PR formatting terpisah
  (dikonfirmasi user). `vendor/bin/pint` merapikan **81 file PHP**; `npm run format`
  (`prettier --write .`) merapikan **122 file JS/JSX**. Prettier juga sempat menyentuh
  file non-kode (markdown docs, `composer.lock`, `.json`, `.yml`, CSS vendor mail) —
  semua di-revert agar commit ini murni gaya kode (PHP+JS/JSX) dan tidak mengubah
  `composer.lock`/dokumen. Artefak `public/build` ikut di-commit sesuai konvensi repo
  (deploy = `git pull`, tanpa build di server). Tak ada perubahan perilaku.
- **Verifikasi:** `vendor/bin/pint --test` 207 file PASS; `php artisan test`
  121 passed (337 assertions, identik baseline — nol regresi); `npm run build` sukses.
- **Catatan:** dua file leftover `database/seeders/{ReportSeeder copy,UserTenantSeeder copy}.php`
  ikut dirapikan Pint tapi sengaja TIDAK dihapus (di luar scope; kandidat hapus terpisah).
  `npm run format` masih `prettier --write .` (bukan `--check`); menjadikan Pint/Prettier
  blocking di CI bisa menyusul sekarang karena drift lama sudah lunas.
- **Status:** FIXED (2026-06-29) — mass-reformat tuntas (PR formatting terpisah)

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
- **Keputusan user (2026-06-28):** HAPUS menu lama — penetapan peran cukup lewat
  `UserController::assignRole` (menu Manajemen Pengguna) yang sudah aman (UserPolicy +
  whitelist peran/level). Menghilangkan dua-jalur yang harus dijaga sinkron + memperkecil
  permukaan serangan.
- **Fix (2026-06-28):** Dihapus total — `AssignUserController`, `AssignUserRequest`,
  `AssignUserResource`, halaman Inertia `resources/js/Pages/Admin/AssignUsers/{Index,Edit}.jsx`,
  grup rute `admin.assign-users.*` (`routes/admin.php`) + importnya, link "Assign Pengguna" di
  `Sidebar.jsx` & `MobileBottomNav.jsx` (beserta import `IconUserShield` yang jadi yatim), dan
  assertion `/admin/assign-users` di `tests/Feature/Sisupit/RoleAccessTest.php` (rute sudah tiada).
- **Verifikasi:** `php artisan test` 84 passed (213 assertions; baseline 84/214 − 1 assertion
  assign-users yang dihapus, tanpa regresi); `npm run build` sukses; nol referensi
  `assign-users`/`AssignUser` tersisa di `app/`, `routes/`, `resources/js/` (di luar `public/build` lama).
- **Status:** FIXED (menu lama dihapus)

### #15 — Scaffolding Midtrans (dead code) menyuntik `snap.js` ke setiap halaman
- **Severity:** P3
- **Lokasi:** `resources/views/app.blade.php:42` (script global), `app/Helpers/helpers.php`
  (`signatureMidtrans()`), `config/services.php` (`midtrans`), `composer.json`/`composer.lock`
  (`midtrans/midtrans-php`), `.env`/`.env.testing` (`MIDTRANS_*`), test
  `tests/Unit/Sisupit/HelpersFunctionExistenceTest.php`.
- **Gejala:** Layout global memuat `https://app.sandbox.midtrans.com/snap/snap.js` di SETIAP
  halaman → console produksi memunculkan warning `data-client-key` + memuat
  `snap-popup-app.sandbox...` + mengirim telemetri ke `faro.katulampa.gopay.sh` (GoPay).
- **Akar masalah:** Midtrans tidak pernah dipakai di sisupit — nol pemakaian `window.snap`
  di `resources/js`, tidak ada controller/route pembayaran; `signatureMidtrans()` hanya
  dipanggil oleh test-nya sendiri. Semua peninggalan template (bersama eks subsistem
  Book/Loan/Fine & #7 `formatToRupiah`).
- **Fix (2026-06-27):** Hapus total — script tag di `app.blade.php` (commit fa142cd, sudah
  deploy + `view:clear` di VPS), lalu helper `signatureMidtrans()`, blok `config/services.midtrans`,
  key `MIDTRANS_*` di `.env`+`.env.testing`, paket via `composer remove midtrans/midtrans-php`,
  dan test khusus Midtrans dihapus. Mengganti/menutup #5 (lihat catatan di sana).
- **Verifikasi:** `vendor/bin/pest` 84 passed (214 assertions; baseline 85 − 1 test Midtrans
  yang dihapus), nol referensi `midtrans` di kode app (di luar dokumen ini), HTML live
  `https://sisupit.com/` 0 referensi midtrans.
- **Catatan:** `formatToRupiah()` di frontend (kosmetik) sengaja dibiarkan.
- **Status:** FIXED

### #16 — Tidak ada notifikasi balik ke pelapor saat status laporannya berubah
- **Severity:** P2 (gap fitur, bukan bug regresi)
- **Lokasi:** `app/Http/Controllers/ReportActionController.php` — `approve()` l.26, `takeAction()` l.62, `arrive()` l.100, `resolve()` l.123
- **Gejala:** Setelah warga membuat laporan, alurnya senyap dari sisi pelapor: tak ada notifikasi saat divalidasi/direspons/tiba/selesai. `Notification::send` hanya ada di `approve()` (l.51/54) dan keduanya menarget responder (petugas/relawan), tak pernah `report->user`.
- **Dampak:** Hilangnya loop-balik kepercayaan — pelapor darurat tak tahu apakah laporannya ditangani.
- **Rekomendasi:** Notification baru `ReportStatusUpdatedNotification` (FCM + database, tanpa broadcast) dikirim ke `report->user` di tiap transisi. Pelapor sudah `Notifiable` + `routeNotificationForFcm()` (User.php:14,123). Detail rencana di `prompt/tasks/TASK_06_notif_balik_pelapor.md`.
- **Fix (2026-06-28):**
  - `app/Notifications/ReportStatusUpdatedNotification.php` (baru) — `ShouldQueue`, `via() = [FcmChannel, 'database']` (tanpa broadcast). Konstruktor `(Report, string $event)`, $event ∈ {approved, en_route, arrived, resolved}; `toFcm()` data-only (priority high, action_url `reports.show`, type `report_status`); `toArray()` simpan title/message/status/event.
  - `ReportActionController` helper privat `notifyReporter($report, $event)` — guard: lewati bila `report->user` null atau aktornya pelapor sendiri. Dipanggil di `approve` (approved), `takeAction` HANYA saat transisi pending→handling (responder pertama, via flag `$becameHandling`), `arrive` HANYA pada kedatangan pertama (cek `status='arrived'` di kedua tabel sebelum update), `resolve` (resolved).
  - Test `tests/Feature/Sisupit/ReportReporterNotificationTest.php` (2): 4 notif per transisi + tak ada cross-talk ke responder; tak ada duplikat saat responder kedua join/tiba. `ReportActionAuthorizationTest` ditambah `Notification::fake()` (isolasi side-effect FCM).
- **Verifikasi:** `php artisan test` 96 passed (256 assertions; baseline 94 + 2 baru). `npm run build` lulus.
- **Catatan:** notifikasi `ShouldQueue` → butuh worker queue aktif di prod (sama seperti `EmergencyAlertNotification`). Lonceng web untuk menampilkannya = #25/TASK_11 (dikerjakan bareng).
- **Sumber:** permintaan user (analisis fitur kurang 2026-06-28, prioritas #1).
- **Status:** FIXED (TASK_06)

### #17 — Laporan hanya bisa membawa satu foto
- **Severity:** P2
- **Lokasi:** `database/migrations/2025_07_19_091844_create_reports_table.php:25` (`$table->string('photo')`), `app/Models/Report.php:28` (`'photo'` di fillable, tanpa relasi galeri)
- **Gejala:** Desain one-to-one — kirim banyak foto saat lapor → hanya 1 tersimpan; tidak ada cara unggah foto progres dari responder di TKP.
- **Dampak:** Bukti insiden terbatas; tidak mendukung dokumentasi multi-sudut/penutupan.
- **Rekomendasi:** Tabel `report_photos` + model + relasi `Report::photos()`, pertahankan kolom `photo` lama (kompatibilitas). Pakai trait `HasFile` yang sudah ada. Detail di `prompt/tasks/TASK_07_multi_foto_laporan.md`.
- **Fix (2026-06-28):**
  - Migrasi `2026_06_28_110000_create_report_photos_table` (report_id FK cascade + path). Model `ReportPhoto`, relasi `Report::photos()` hasMany. Kolom `reports.photo` dipertahankan sebagai **sampul** (foto pertama) demi kompatibilitas feed/dashboard/ReportCard yang membaca `report.photo`.
  - `ReportRequest` — `photos` array (wajib min 1 saat POST/create via `isMethod('POST')`, opsional saat PUT), `photos.*` image mimes max 4MB; `photo` lama jadi nullable.
  - `ReportController::store` — simpan tiap file `photos[]` ke disk `public`, set foto pertama ke kolom `photo`, buat baris `report_photos`. `show()` memuat relasi `photos`.
  - `Reports/Show.jsx` — galeri grid (fallback ke `report.photo` lama bila relasi kosong), modal per-foto. `Reports/Create.jsx` — pemilih multi-file (maks 6) + preview grid + hapus per-foto.
  - Test `tests/Feature/Sisupit/ReportMultiPhotoTest.php` (2). `ReportCreationTest` diubah kirim `photos[]` (kontrak create berubah dari `photo` tunggal).
- **Verifikasi:** `php artisan test` 106 passed (297 assertions; baseline 104 + 2 baru, ReportCreationTest diperbarui). `npm run build` lulus.
- **Catatan/residual:** halaman edit laporan tak mengelola galeri (lihat #30 — `Reports/Edit.jsx` ternyata form Publisher yang salah, di luar scope). Foto progres oleh responder di TKP = kemungkinan follow-up, belum diimplementasi.
- **Sumber:** permintaan user (analisis fitur kurang 2026-06-28, prioritas #4).
- **Status:** FIXED (TASK_07)

### #30 — `Reports/Edit.jsx` adalah form Publisher yang salah (edit laporan rusak)
- **Severity:** P2 (fitur edit laporan non-fungsional)
- **Lokasi:** `resources/js/Pages/Front/Reports/Edit.jsx` (render `props.publisher`, `data.logo`, submit ke `route('admin.publishers.index')`); di-render oleh `ReportController::edit()` yang mengirim `report` + `page_settings`.
- **Gejala:** Halaman edit laporan menampilkan form penerbit (nama/alamat/email/phone/logo) — sisa scaffolding lama (eks subsistem Publisher), bukan form laporan. Field yang dikirim (`logo`/`email`/...) tak cocok dgn `ReportRequest` (yang mewajibkan title/description/region/lat/lng/address) → `update()` pasti gagal validasi. Jadi **edit laporan tidak berfungsi** sejak sebelum TASK_07.
- **Dampak:** Pelapor tak bisa mengubah laporannya; tombol/route edit menyesatkan.
- **Rekomendasi:** Ganti `Reports/Edit.jsx` dengan form laporan sebenarnya (tiru `Create.jsx`, termasuk galeri foto #17), atau hapus jalur edit jika tak diperlukan. Perlu keputusan user soal scope edit (boleh ubah foto/lokasi/dll).
- **Ditemukan saat:** TASK_07 (membaca Edit.jsx untuk pastikan perubahan `photo→photos` tak merusaknya — ternyata sudah rusak independen).
- **Keputusan user (2026-06-28):** scope = **konten + kelola foto** (judul/deskripsi/patokan + tambah/hapus foto galeri, lokasi & wilayah TIDAK diubah); akses = **pelapor saja & hanya saat status TERLAPOR**.
- **Fix (2026-06-28, TASK_16):**
  - `Reports/Edit.jsx` ditulis ulang jadi form laporan sebenarnya (judul/deskripsi/patokan + galeri foto: hapus foto lama via `removed_photos[]`, tambah foto baru via `photos[]`, badge "BARU", maks 6, min 1).
  - `ReportController::edit` — `authorizeReportEdit` (owner + TERLAPOR), backfill foto legacy (`photo` tanpa baris `report_photos`) ke galeri, load `photos`. `update` — hanya update title/description/address (lokasi tak disentuh), proses hapus/tambah foto dalam transaksi, hitung ulang sampul (`photo`), tolak bila foto tersisa < 1.
  - `ReportRequest` — region/lat/lng wajib hanya saat POST (create); pada PUT (edit) opsional. `removed_photos[]` divalidasi (array of integer).
  - `authorizeReportEdit` privat (owner-only + TERLAPOR). Entry point: tombol **Edit** di `Reports/Show.jsx` (hanya owner & saat TERLAPOR).
  - Test `tests/Feature/Sisupit/ReportEditTest.php` (5). `ReportOwnershipTest` "staff manage" diubah → staff kini 403 di form edit (edit = pelapor saja; staff pakai workflow aksi).
- **Verifikasi:** `php artisan test` 113 passed (315 assertions; baseline 108 + 5 baru, 1 test ownership disesuaikan). `npm run build` lulus.
- **Sumber:** review/implementasi 2026-06-28.
- **Status:** FIXED (TASK_16)

### #18 — Tidak ada kanal pesan/koordinasi per insiden
- **Severity:** P2
- **Lokasi:** `app/Http/Controllers/ReportActionController.php`, `resources/js/.../Reports/Show.jsx`
- **Gejala:** Tak ada model/tabel/endpoint pesan per laporan; koordinasi hanya lewat perubahan status + tracking lokasi. (`Enums/MessageType` tidak terkait — hanya untuk flash message.)
- **Dampak:** Pusat Komando & responder lapangan tak bisa bertukar info teks (akses jalan, kebutuhan unit, kondisi korban) pada insiden yang sama.
- **Rekomendasi:** `ReportMessage` + `Events/ReportMessageSent` (broadcast Reverb privat per laporan) + otorisasi channel re-use pola ownership/role (ATURAN EMAS #7). Infra Reverb sudah ada (`Events/ResponderLocationUpdated`). **Scope yang harus dikonfirmasi:** warga ikut chat atau internal responder+command center saja. Detail di `prompt/tasks/TASK_08_chat_dalam_insiden.md`.
- **Sumber:** permintaan user (analisis fitur kurang 2026-06-28, prioritas #2).
- **Status:** OPEN (TASK_08)

### #19 — Tidak ada manajemen armada/Unit (kendaraan & dispatch)
- **Severity:** P3 (fitur besar — bertahap, butuh keputusan scope)
- **Lokasi:** `app/Models/Unit.php` — **tidak ada** (peta arsitektur lama menyebutnya "stub kosong"; verifikasi 2026-06-28: `grep "class Unit"` di `app/` nol hasil — perlu koreksi ARCHITECTURE_MAP). Nol tabel `units`/`report_unit`.
- **Gejala:** Aplikasi mengoordinasikan orang (petugas/relawan) tapi tak ada konsep kendaraan/unit, status ketersediaan, atau dispatch ke insiden.
- **Dampak:** Fondasi DAMKAR hilang — tidak bisa melacak truk/tangki/rescue yang dikerahkan.
- **Rekomendasi:** Fase 1 katalog Unit (CRUD admin, tiru `HydrantController`); Fase 2 pivot `report_units` + dispatch/release sejajar siklus status laporan. Keputusan scope (tenant/relasi pos/tracking) wajib dikonfirmasi dulu. Detail di `prompt/tasks/TASK_09_armada_unit_dispatch.md`.
- **Sumber:** permintaan user (analisis fitur kurang 2026-06-28, prioritas #3).
- **Status:** FIXED (TASK_09, 2026-06-29) — scope dikonfirmasi user: ter-scope wilayah (Tenantable) + homebase pos opsional, Fase 1+2 (katalog + dispatch), status saja (tanpa GPS unit). Terimplementasi: tabel `units` & `report_units`, model `Unit` (Tenantable+SoftDeletes) & `ReportUnit`, `Admin\UnitController` (CRUD ter-scope), `ReportActionController::dispatchUnit/releaseUnit` (+ auto-release saat resolve), props `availableUnits` di Show, panel pengerahan armada (staf), menu "Manajemen Armada" (sidebar+mobile). Tes: `UnitDispatchTest` (5) + `UnitManagementTest` (3).

### #20 — Petugas yurisdiksi kecamatan+ terjebak loop "lengkapi profil sampai desa"
- **Severity:** P1 (akun petugas tak bisa dipakai — terkunci di onboarding)
- **Lokasi:** `app/Http/Middleware/EnsureProfileComplete.php:37` (`EXEMPT_ROLES`) & `:61` (cek `village_code`); berinteraksi dengan `app/Http/Controllers/Admin/UserController.php:281` (`trimRegionToLevel()`).
- **Reproduksi:** (1) User daftar mandiri (`masyarakat`) → lengkapi profil HP+wilayah sampai desa. (2) Admin set jadi `petugas` level **kecamatan** via Assign Role. (3) Login lagi → dipaksa isi complete-profile sampai desa lagi.
- **Akar masalah:** `trimRegionToLevel()` sengaja menulis `village_code => null` untuk level kecamatan/kabupaten/provinsi agar tenant scope (`Tenantable`, `scopeIsAdmin`) berhenti tepat di tingkat itu — ini **benar**. Tapi `EnsureProfileComplete` menganggap `village_code` null = profil belum lengkap, dan `petugas` **tidak** ada di `EXEMPT_ROLES` (hanya `superadmin/admin/pejabat`). Jadi petugas kecamatan dilempar balik ke complete-profile tiap login; jika ia mengisinya, `village_code` terisi lagi dan justru **merusak yurisdiksinya** (kembali terkurung 1 desa) sampai admin set ulang → loop.
- **Cakupan terdampak:** hanya `petugas`. `admin`/`pejabat` sudah exempt; `relawan` bukan `JURISDICTIONAL_ROLES` sehingga wilayahnya tak pernah di-trim.
- **Fix:** tambah `'petugas'` ke `EXEMPT_ROLES` (kini = `superadmin` + seluruh `JURISDICTIONAL_ROLES`), konsisten dengan maksud terdokumentasi: akun staf dikelola terpusat lewat Admin/AssignUser, bukan onboarding mandiri.
- **Verifikasi:** `php artisan test` 84 passed (sebelum & sesudah). Manual: promote user → petugas kecamatan → login → langsung ke dashboard, tak ada complete-profile.
- **Sumber:** laporan user 2026-06-28.
- **Status:** FIXED

### #22 — Daftar relawan tidak ter-scope yurisdiksi
- **Severity:** P1 (kebocoran PII relawan lintas-tenant + akses data di luar yurisdiksi)
- **Lokasi:** `app/Http/Controllers/Front/RelawanController.php` — `index()` l.20, `regionFilterOptions()` l.102, `show()` l.52.
- **Gejala:** Rute `/relawan` & `/relawan/{id}` sudah benar di-gate `role:petugas|admin|superadmin` (2026-06-27, bukan publik), TAPI controllernya tidak menerapkan scope wilayah: `index()` menampilkan SEMUA relawan se-Indonesia (filter kabupaten/kecamatan/desa hanya opsional, dipilih user — tidak dipaksakan), `regionFilterOptions()` menawarkan dropdown wilayah dari seluruh relawan nasional, dan `show()` bisa membuka detail relawan lintas wilayah lewat ID (nama, HP, alamat, area KTP, dst.).
- **Akar masalah:** Query relawan dibangun langsung dari `User::query()->whereHas('roles', ...)` tanpa scope yurisdiksi, padahal `User::scopeIsAdmin()` (`User.php:62`) sudah jadi pola baku untuk membatasi user ke hierarki wilayah admin/petugas yang login (dipakai `UserController` index). Berbeda dari menu Manajemen Pengguna yang sudah benar ter-scope.
- **Dampak:** Petugas/admin wilayah mana pun melihat & mengakses data pribadi relawan di luar yurisdiksinya — bocor PII lintas-tenant, inkonsisten dengan prinsip multi-tenant sistem.
- **Keputusan user (2026-06-28):** daftar relawan adalah menu untuk petugas ke atas DAN harus ter-scope sesuai yurisdiksi.
- **Fix:** Tambah `->isAdmin()` di tiga query (`index()`, `regionFilterOptions()`, `show()`) `RelawanController`. Superadmin tetap lihat semua (scopeIsAdmin bypass). `show()` kini 404 untuk relawan di luar yurisdiksi (cegah IDOR detail lintas wilayah).
- **Verifikasi:** `php artisan test` 90 passed (228 assertions; baseline 86 + 4 test baru `tests/Feature/Sisupit/VolunteerListJurisdictionTest.php`: list ter-scope, detail lintas wilayah → 404, superadmin lihat semua, non-staff → 403). `npm run build` sukses.
- **Sumber:** laporan/arahan user 2026-06-28.
- **Status:** FIXED

### #21 — Admin wilayah bisa mengelola RBAC global & pengumuman nasional
- **Severity:** P1 (privilege escalation lintas-tenant — admin wilayah mengontrol model akses seluruh sistem)
- **Lokasi:** `routes/admin.php:12` — grup tunggal `role:admin|superadmin` membungkus SEMUA controller admin; hanya `SettingController` yang sebelumnya diperketat ke `role:superadmin`.
- **Reproduksi:** login `admin@denpasar.go.id` (role `admin`, yurisdiksi kota) → buka `/admin/roles`, `/admin/permissions`, `/admin/assign-permissions`, `/admin/route-accesses`, `/admin/announcements` → semua **200 OK** & bisa CRUD.
- **Akar masalah:** RBAC sistem (role/permission/assign-permission/route-access) dan pengumuman bersifat **global lintas-tenant**, bukan ter-scope yurisdiksi. Tapi gating route menyamakannya dengan menu ter-scope (users/reports/facilities). Controller RBAC (mis. `RoleController`) tak punya cek role internal sama sekali — murni andalkan middleware grup. Akibatnya admin wilayah bisa membuat/mengubah/menghapus role & permission, menempelkan permission ke role mana pun, mengubah route-access, dan broadcast pengumuman nasional.
- **Keputusan user (2026-06-28):** batasi RBAC **dan** pengumuman ke superadmin saja.
- **Fix:** Di `routes/admin.php`, `AnnouncementController`/`RoleController`/`PermissionController`/`AssignPermissionController`/`RouteAccessController`/`SettingController` dipindah ke grup bersarang `Route::middleware('role:superadmin')` (pola yang sudah ada untuk Settings). `UserController` tetap di grup `role:admin|superadmin` (ter-scope yurisdiksi via `UserPolicy`). Sidebar (`Sidebar.jsx`) & mobile nav (`MobileBottomNav.jsx`): seksi "Pengumuman", "Kontrol Akses", "Sistem" dipindah ke balik `isSuperadmin` agar admin wilayah tak melihat link yang berujung 403.
- **Verifikasi:** `php artisan test` 86 passed (223 assertions; +2 test baru di `RoleAccessTest.php`: admin wilayah → 403 di 5 rute, superadmin → 200); `npm run build` sukses. Baseline sebelum: 84 passed.
- **Sumber:** laporan user 2026-06-28 (login admin Denpasar masih bisa akses semua kontrol akses).
- **Status:** FIXED

### #23 — Manajemen Fasilitas Pompa & Pos Pemadam belum ada di panel admin (+ bug fillable)
- **Severity:** P2 (fitur kurang) — sub-temuan bug data P2
- **Lokasi:** `routes/web.php` (grup `admin`), `app/Http/Controllers/Admin/` (hanya `HydrantController`), `app/Models/Pompa.php`, `app/Models/PosPemadam.php`, `resources/js/Pages/Admin/` (hanya `Hydrants/`).
- **Gejala:** Sidebar "Manajemen Fasilitas" hanya mengarah ke CRUD Hydrant. Pompa (`/pumps`) & Pos Pemadam (`/fire-stations`) cuma punya halaman publik read-only (`Front\PompaController`, `Front\PosPemadamController`) — admin tak bisa menambah/ubah/hapus. Rute `admin.facilities.index` me-render `Admin/Facilities/Index` yang **file-nya tak ada** (dead/broken, tak ada link ke sana).
- **Bug data tersembunyi (ditemukan saat kerja):** `$fillable` kedua model menyebut `location_lat`/`location_lng` yang **tidak ada** di tabel (kolom aslinya `lat`/`lng`, lihat migrasi `2026_05_01_*`), dan tak menyertakan kode wilayah. Akibatnya `Pompa::create()`/`PosPemadam::create()` (mis. di seeder) **diam-diam membuang** koordinat & yurisdiksi → data pompa/pos lama kemungkinan `lat/lng` NULL. Casting pun salah sasaran.
- **Keputusan user (2026-06-28):** (1) full parity dengan Hydrant — pakai kolom wilayah (sudah ada dari migrasi `2026_05_15_132259`) + `Tenantable` agar admin wilayah ter-scope; (2) tiga link sidebar terpisah (Hydrant / Pompa / Pos Pemadam), bukan halaman hub.
- **Fix:**
  - Model `Pompa` & `PosPemadam`: `use Tenantable`, ganti `$fillable` salah → `$guarded = []` (pola Hydrant), casting `lat`/`lng`, tambah relasi wilayah.
  - Controller baru `Admin\PompaController` & `Admin\PosPemadamController` (mirror `HydrantController`: index search+filter+paginate ter-scope, create/store/edit/update/destroy, auto-fill yurisdiksi). Menyertakan `province_code` di simpan (Hydrant lama melewatkannya — diperbaiki di sini agar scope level provinsi berfungsi).
  - Rute resource `admin.pumps.*` & `admin.fire-stations.*` (`->except(['show'])`) di grup admin `routes/web.php`.
  - Halaman React `Admin/Pumps/{Index,Create,Edit}.jsx` & `Admin/FireStations/{Index,Create,Edit}.jsx` (mirror Hydrant: peta Leaflet pin-picker, reverse-geocode, blok Area Yurisdiksi), field per skema (pompa: type/capacity_lpm/description; pos: type/phone/vehicle_count).
  - Sidebar: "Manajemen Fasilitas" → tiga link terpisah; hapus import `IconBuilding` yang jadi tak terpakai.
- **Catatan:** rute & file `Admin/Facilities/Index` yang broken **dibiarkan** (di luar scope; tak ada yang me-link). Front controller `withoutGlobalScope('tenant')` kini benar-benar berfungsi (publik tetap lihat se-Indonesia) setelah `Tenantable` aktif.
- **Verifikasi:** `php artisan test` 90 passed (228 assertions, = baseline, tanpa regresi). `npm run build` sukses (client + SSR). `route:list` mengonfirmasi 12 rute baru (`{pump}`/`{fire_station}` binding cocok). Manual CRUD belum dijalankan via browser.
- **Sumber:** permintaan user 2026-06-28 ("manajemen fasilitas ... buat untuk pumps, fire-stations").
- **Status:** FIXED

### #24 — "Tolak Data" hard-delete laporan padahal UI klaim "diarsipkan"
- **Severity:** P1 (kehilangan data + UI menyesatkan)
- **Lokasi:** `resources/js/Pages/Front/Reports/Show.jsx:134-139` (`executeReject` → `reports.destroy` + toast "Laporan diarsipkan"), dialog l.581-597 ("ditandai sebagai hoax dan diarsipkan"); `app/Http/Controllers/ReportController.php:216-230` (`destroy()` → `$this->delete_file()` + `$report->delete()`).
- **Gejala:** Tombol "Tolak Data" di panel Verifikasi memanggil endpoint `destroy` yang **benar-benar menghapus** baris laporan + file foto dari disk. Tidak ada kolom/SoftDeletes — penghapusan permanen.
- **Dampak:** (1) Jejak audit laporan hoax/ditolak hilang total — tak bisa ditelusuri ulang (penting untuk sistem darurat). (2) UI berbohong: dialog & toast bilang "diarsipkan", padahal dihapus. (3) Endpoint `destroy` yang sama dipakai warga untuk menghapus laporannya sendiri — fungsi tolak-staff & hapus-pemilik tercampur dalam satu jalur.
- **Koreksi saat reproduce (2026-06-28):** (1) `Report` SUDAH `use SoftDeletes` (`Report.php:9,17`) → `destroy()` itu soft-delete (recoverable), BUKAN hard-delete; klaim awal keliru. (2) Bug riil & lebih parah: `route('reports.destroy')` tak terdaftar (yang ada `front.reports.destroy`) → tombol Tolak melempar error Ziggy & **tidak berfungsi sama sekali**. (3) `front.reports.destroy` ternyata tak dipanggil UI mana pun (grep) → satu-satunya pemakai endpoint hapus adalah tombol Tolak yang rusak itu. (4) `HasFile::delete_file()` pakai `Storage::delete()` (disk default), bukan `Storage::disk('public')` → foto tak ikut terhapus (orphan) — dicatat untuk #29.
- **Keputusan user (2026-06-28):** opsi (a) — Tolak = set status `ditolak` (+ alasan opsional), laporan tetap terarsip & terlihat (staff di arsip, pemilik di Riwayat Saya), endpoint reject-staff dipisah dari hapus-milik-sendiri.
- **Fix (2026-06-28):**
  - Migrasi `2026_06_28_100000_add_rejection_fields_to_reports_table.php`: kolom `rejected_reason` (nullable) + `rejected_at`. `Report` fillable + cast `rejected_at`.
  - `ReportActionController::reject(Request, $id)` — role petugas/admin/superadmin, tolak hanya bila belum `resolved`, set status `ditolak` + alasan + `rejected_at`. Rute `POST /reports/{report}/reject` name `reports.reject` (`routes/web.php`).
  - Feed publik dikecualikan dari `ditolak`: `ReportController::index` (`whereNotIn('status', ['TERLAPOR','ditolak'])` untuk non-staff) + `DashboardController` `reportsFeed` (`where status != ditolak`). Query aktif lain sudah `whereIn` daftar yang tak memuat `ditolak`.
  - Frontend: `Components/StatusBadge.jsx` + StatusBadge lokal `Reports/Index.jsx` tambah `ditolak`; `Reports/Show.jsx` arahkan Tolak ke `reports.reject` + textarea alasan opsional, label status `ditolak`, banner "Laporan Ditolak" + alasan, panel aksi disembunyikan saat `ditolak`.
- **Verifikasi:** `php artisan test` 94 passed (239 assertions; baseline 90 + 4 test baru `tests/Feature/Sisupit/ReportRejectTest.php`). `npm run build` lulus (client + SSR).
- **Sumber:** review alur end-to-end 2026-06-28 (#1 prioritas).
- **Status:** FIXED (TASK_10)

### #25 — Tidak ada UI lonceng/inbox notifikasi web
- **Severity:** P2 (gap fitur — melemahkan #16)
- **Lokasi:** `resources/js/Layouts/AppLayout.jsx:119-175` (header hanya avatar + ThemeSwitcher, tanpa bell); channel `'database'` aktif di `app/Notifications/EmergencyAlertNotification.php:33` (dan direncanakan juga di TASK_06).
- **Gejala:** `EmergencyAlertNotification` menulis ke tabel `notifications` (channel `database`), tapi tidak ada satu pun komponen frontend yang membaca/menampilkannya. Tidak ada endpoint daftar/mark-as-read notifikasi.
- **Dampak:** Notifikasi tersimpan di DB sia-sia di web. Pelapor/relawan non-Android (atau yang FCM-nya gagal) tak punya kanal melihat update sama sekali. Rencana #16/TASK_06 (FCM + database ke pelapor) hanya efektif penuh di Android; loop-balik kepercayaan tak lengkap di web.
- **Rekomendasi:** Tambah dropdown lonceng di `AppLayout` header (badge jumlah belum dibaca) + endpoint `GET /notifications` & `POST /notifications/{id}/read` (atau mark-all) baca `auth()->user()->notifications`. Pertimbangkan kerjakan bersama TASK_06 agar "balik ke pelapor" benar-benar terlihat di web.
- **Fix (2026-06-28, bareng TASK_06):**
  - `HandleInertiaRequests::share()` — share `notifications` (8 terbaru, dipetakan: id/title/message/report_id/read_at/created_at) + `unread_notifications_count`. `message` fallback ke `data['address']` agar `EmergencyAlertNotification` lama (pakai key `address`) tetap tampil.
  - `app/Http/Controllers/NotificationController.php` (baru) — `read($id)` (markAsRead → redirect `reports.show` bila ada report_id) & `readAll()` (markAsRead semua unread). Rute `POST /notifications/{id}/read` (`notifications.read`) & `POST /notifications/read-all` (`notifications.readAll`) di grup `auth`.
  - `AppLayout.jsx` — dropdown lonceng di header (ikon `IconBell` + badge jumlah belum dibaca, max "9+"); daftar notifikasi (dot belum-dibaca, judul, pesan, waktu `id-ID`), klik item → `notifications.read` (tandai baca + buka laporan), tombol "Tandai semua dibaca".
- **Verifikasi:** termasuk dalam run 96 passed; `npm run build` lulus (AppLayout ter-bundle ulang).
- **Sumber:** review alur end-to-end 2026-06-28.
- **Status:** FIXED (TASK_11)

### #26 — `take-action`/`arrive` tidak ter-scope yurisdiksi maupun cek standby
- **Severity:** P2 (inkonsistensi model multi-tenant; bukan kebocoran PII)
- **Lokasi:** `app/Http/Controllers/ReportActionController.php:62` (`takeAction`), `:100` (`arrive`) — hanya `hasAnyRole(['petugas','relawan'])` lalu `Report::withoutGlobalScopes()->findOrFail($id)`.
- **Gejala:** `approve()` menyiarkan notifikasi hanya ke relawan `is_standby` di wilayah laporan, dan feed dashboard sudah ter-scope. Tapi endpoint respons tidak mengecek wilayah responden maupun status siaga → relawan/petugas dari wilayah lain, atau relawan yang sudah mematikan siaga, tetap bisa merespons insiden mana pun dengan POST `take-action` langsung (mis. via ID).
- **Dampak:** Responden lintas-wilayah bisa menempel ke insiden di luar yurisdiksinya — tidak bocor data pribadi, tapi melanggar prinsip isolasi wilayah yang diterapkan di tempat lain.
- **Rekomendasi (perlu keputusan user):** apakah desainnya "siapa saja boleh bantu" (maka biarkan, dokumentasikan sebagai sengaja) atau batasi `take-action`/`arrive` ke wilayah laporan (tiru pola `where($column, $levelCode)` di DashboardController) + opsional wajib `is_standby`.
- **Keputusan user (2026-06-28):** batasi ke wilayah laporan (TANPA wajib siaga).
- **Fix (2026-06-28):**
  - `ReportActionController::ensureWithinJurisdiction(Report, $user)` — superadmin & user tanpa kode wilayah (admin nasional) bypass; selain itu ambil level terdalam responder (`village→district→city→province`) dan tolak (403) bila `report->{column}` ≠ kode responder. Dipanggil di awal `takeAction` & `arrive` setelah fetch report (pola re-check `withoutGlobalScopes`, ATURAN EMAS #7).
  - Tidak menyentuh `is_standby` (sesuai keputusan). `correct-location`/`update-location` tak perlu cek lagi (hanya bisa dipakai responder aktif yang sudah lolos `take-action`).
  - Test `tests/Feature/Sisupit/ReportResponderJurisdictionTest.php` (3): relawan sewilayah boleh; relawan beda desa → 403 (take-action & arrive); petugas tingkat kabupaten yang mencakup laporan boleh. `ReportActionAuthorizationTest` diberi `village_code` pada laporan agar positif-case responder tetap lolos.
- **Verifikasi:** `php artisan test` 101 passed (271 assertions; baseline 98 + 3 baru). Tanpa perubahan frontend (feed & Show sudah ter-scope wilayah; ini pertahanan berlapis terhadap POST langsung).
- **Sumber:** review alur end-to-end 2026-06-28.
- **Status:** FIXED (TASK_12)

### #27 — Tidak ada aksi "Batal Meluncur" (un-respond)
- **Severity:** P2 (UX/operasional)
- **Lokasi:** `app/Http/Controllers/ReportActionController.php` (tak ada method cancel); UI `resources/js/Pages/Front/Reports/Show.jsx:480-499` (hanya alur maju Meluncur→Tiba).
- **Gejala:** Setelah responder menekan "Meluncur" (`en_route`), tidak ada cara membatalkan. Salah pencet atau batal berangkat membuat baris responder bertahan `en_route`, peta terus menampilkannya, dan `watchPosition` GPS terus mengirim lokasi sampai staff `resolve` insiden.
- **Dampak:** Data responden tidak akurat (orang yang tak jadi datang masih tampil meluncur), pemborosan baterai/GPS, dan komandan salah baca kekuatan lapangan.
- **Rekomendasi:** Tambah aksi `cancelResponse` (hapus/`finished` baris responder milik sendiri) + tombol "Batal Meluncur" saat status `en_route`. Pertimbangkan: bila responden terakhir mundur dan tak ada lagi, kembalikan status report `handling`→`pending`.
- **Fix (2026-06-28):**
  - `ReportActionController::cancelResponse($id)` — hanya boleh saat baris responder milik sendiri berstatus `en_route` (selain itu 403); hapus baris (GPS berhenti karena `isCurrentlyResponding` jadi false + hilang dari manifes). Bila tak ada lagi responder aktif (`en_route`/`arrived`) & status `handling` → kembalikan ke `pending` + `broadcast(ReportStatusChanged 'pending')`.
  - Rute `POST /reports/{report}/cancel-response` (`reports.cancel-response`).
  - `Reports/Show.jsx` — tombol "Batal Meluncur" (variant outline) di bawah "Tiba di Lokasi" saat `myRecord.status === 'en_route'`; handler `handleCancelResponse`.
  - Test `tests/Feature/Sisupit/ReportCancelResponseTest.php` (3): cancel saat en_route → baris hapus + revert pending; status tetap handling bila responder lain masih aktif; tak bisa cancel setelah `arrived` (403).
- **Verifikasi:** `php artisan test` 104 passed (286 assertions; baseline 101 + 3 baru). `npm run build` lulus.
- **Residual (minor):** marker responder yang membatalkan baru hilang dari peta perangkat LAIN setelah refresh (tak ada event hapus-marker; sama dengan keterbatasan bahwa responder baru juga belum muncul live). Status sudah real-time via #28.
- **Sumber:** review alur end-to-end 2026-06-28.
- **Status:** FIXED (TASK_13)

### #28 — Perubahan status tidak di-broadcast (halaman terbuka tak update real-time)
- **Severity:** P2 (real-time tidak lengkap)
- **Lokasi:** `app/Http/Controllers/ReportActionController.php:26` (`approve`), `:123` (`resolve`) — hanya `back()` (Inertia), tanpa broadcast event status. (Bandingkan `updateLocation`/`correctLocation` yang sudah broadcast.)
- **Gejala:** Tracking lokasi responden real-time via Reverb, tapi transisi status laporan (TERLAPOR→pending→handling→resolved) tidak disiarkan. Halaman `Reports/Show` yang sedang terbuka di perangkat lain (pelapor/responder/komando) baru menampilkan status baru setelah refresh; GPS responder baru berhenti setelah menerima props segar.
- **Dampak:** Pengalaman "live command center" timpang — peta bergerak tapi badge status & panel aksi diam sampai reload. Pelapor yang memantau juga tak lihat perubahan seketika.
- **Rekomendasi:** Broadcast event status (mis. `ReportStatusChanged`) di tiap transisi pada channel `report-tracking.{id}` yang sudah ada; listener di `Show.jsx` perbarui `report.status`. Infra Reverb sudah tersedia.
- **Fix (2026-06-28):**
  - `app/Events/ReportStatusChanged.php` (baru) — `ShouldBroadcastNow` (instan, sama pola `ResponderLocationUpdated`), `PrivateChannel('report-tracking.{id}')`, payload `reportId`/`status`/`rejectedReason`.
  - `ReportActionController` `broadcast(new ReportStatusChanged(...))` di `approve` (pending), `reject` (ditolak + reason), `takeAction` saat transisi pending→handling, `resolve` (resolved).
  - `Reports/Show.jsx` — `report.status`/`report.rejected_reason` dipindah ke state `reportStatus`/`rejectedReason` (di-sync dari props saat Inertia + di-update listener). Listener `.listen('ReportStatusChanged')` perbarui badge, panel verifikasi/aksi, banner ditolak, dan ikon peta tanpa refresh.
  - Test `tests/Feature/Sisupit/ReportStatusBroadcastTest.php` (2): event ter-dispatch dgn status benar di approve/handling/resolve + reject (dengan reason). `Event::fake([ReportStatusChanged::class])` + `Notification::fake()`.
- **Verifikasi:** `php artisan test` 98 passed (264 assertions; baseline 96 + 2 baru). `npm run build` lulus.
- **Catatan:** real-time bergantung Reverb aktif (`BROADCAST_CONNECTION=reverb` di prod). Channel auth `report-tracking.{id}` sudah ada (`routes/channels.php`) — event baru pakai channel yang sama, tak ubah otorisasi.
- **Sumber:** review alur end-to-end 2026-06-28.
- **Status:** FIXED (TASK_14)

### #29 — Batch minor alur respons
- **Severity:** P3
- **Lokasi & item:**
  1. `report->category` dead reference — `app/Notifications/EmergencyAlertNotification.php:39,47` memakai `$this->report->category ?? 'KEBAKARAN'`, padahal kolom `category` tidak ada di tabel `reports` → selalu fallback. Kosmetik/dead.
  2. Aksi tidak cek status report dulu — `ReportActionController` `approve`/`takeAction`/`arrive` tak memvalidasi status saat ini (mis. `take-action` masih bisa di laporan `resolved`; double-`approve`). Edge case kecil, idempoten sebagian.
  3. Casing import campur — `@/components/ui/...` (huruf kecil) vs folder asli `resources/js/Components/ui` (huruf besar) di ~8 file (mis. `Reports/Show.jsx:6`, `ReportCard.jsx:6`, `Home.jsx:3`, beberapa Admin). CI Ubuntu saat ini hijau (build lewat), tapi rapikan agar tak jadi jebakan di FS case-sensitive saat rebuild di VPS.
- **Dampak:** Semua minor — dead reference, edge transisi, dan risiko build latent.
- **Rekomendasi:** Bersihkan saat menyentuh file terkait (jangan rename massal khusus untuk ini di luar scope). Casing bisa diseragamkan dalam satu PR kecil terpisah.
- **Fix (2026-06-28):**
  1. `EmergencyAlertNotification` — `strtoupper($this->report->category ?? 'KEBAKARAN')` (toFcm & toWebPush) → literal `'🚨 DARURAT KEBAKARAN!'` (kolom `category` tak ada; selalu fallback).
  2. `ReportActionController` — guard status: `approve` hanya bila `TERLAPOR` (cegah approve ganda); `takeAction`/`arrive` 403 bila status `resolved`/`ditolak` (tak bisa respons insiden tertutup). Test di `ReportActionAuthorizationTest` (+2).
  3. Casing import diseragamkan `@/components/` → `@/Components/` (11 file: `Home.jsx`, `Reports/Show.jsx`, `ReportCard.jsx`, `ComboBox.jsx`, `DialogRelawanList/Detail.jsx`, `Admin/{FireStations,Hydrants,Pumps}/Create.jsx`, `ui/{combobox,calendar1}.jsx`) agar tak jadi jebakan di FS case-sensitive (VPS Linux).
- **Verifikasi:** `php artisan test` 108 passed (300 assertions; baseline 106 + 2 guard test). `npm run build` lulus (casing OK).
- **Sumber:** review alur end-to-end 2026-06-28.
- **Status:** FIXED (TASK_15)

### #31 — Channel tracking & halaman Show laporan tidak ter-scope yurisdiksi
- **Severity:** P2 (kebocoran PII/lokasi lintas-tenant; konsisten dengan kelas #2/#22/#26)
- **Lokasi:** `routes/channels.php:22-31` (otorisasi channel `report-tracking.{reportId}`); `app/Http/Controllers/ReportController.php:75` (`$isStaff`), `:78` (gate akses `show()`)
- **Gejala:** Otorisasi memakai `$isStaff = $user->hasAnyRole(['admin','superadmin','petugas'])` **tanpa** memeriksa apakah laporan berada di wilayah staf. Akibatnya:
  1. **Channel WebSocket:** petugas/admin wilayah mana pun bisa `subscribe` ke `report-tracking.{id}` laporan mana pun → menerima siaran live `ResponderLocationUpdated` (GPS responder + nama), `IncidentLocationCorrected` (titik presisi insiden), dan `ReportStatusChanged` untuk insiden di SELURUH Indonesia.
  2. **Halaman Show:** `ReportController::show()` mengizinkan staf mana pun membuka detail laporan lintas wilayah (nama/HP pelapor & responder, alamat, jejak GPS) via ID.
- **Dampak:** Bocor PII pelapor & lokasi-presisi responden/insiden lintas wilayah ke seluruh staf nasional. Bertentangan dengan keputusan desain regional yang sudah ditegakkan berulang: feed dashboard per-wilayah (#2), daftar relawan ter-scope (#22), dan respons take-action/arrive dibatasi wilayah (#26 — bahkan sudah ada helper `ReportActionController::ensureWithinJurisdiction`).
- **Catatan desain:** sama seperti #2/#26, perlu **keputusan user** dulu — apakah Pusat Komando dimaksudkan NASIONAL (kalau ya: ini WONTFIX, tapi minimal channel auth & `show()` harus disamakan eksplisit + didokumentasikan) atau REGIONAL (kalau ya: terapkan cek wilayah yang sama seperti `ensureWithinJurisdiction` di `channels.php` dan `show()`; superadmin/admin nasional bypass).
- **Rekomendasi fix (bila regional):** ekstrak logika `ensureWithinJurisdiction` jadi cek reusable; di `channels.php` tolak staf di luar wilayah laporan; di `show()` ganti `$isStaff` global jadi "staf DAN sewilayah" (pelapor & helper tetap boleh lintas-tenant by relation).
- **Keputusan user (2026-06-29):** REGIONAL — komando per wilayah, bukan nasional.
- **Fix (2026-06-29):** Logika yurisdiksi dipusatkan ke `User::withinReportJurisdiction(Report): bool` (superadmin & admin nasional tanpa kode wilayah → true; selain itu level paling spesifik user dicocokkan dgn kolom laporan sederajat). Dipakai di tiga tempat: `routes/channels.php` (gate `$isStaff`), `ReportController::show()` (gate `$isStaff`), `ReportActionController::ensureWithinJurisdiction()` (kini wrapper tipis di atas method ini). Pelapor & helper tetap boleh akses lintas-tenant via relasi. Sekaligus tambah `use App\Models\Report;` di `channels.php` — sebelumnya `Report::find()` tak ter-import (file non-namespaced → `\Report` yang tak ada) = bug laten otorisasi channel.
- **Test:** `tests/Feature/Sisupit/ReportShowJurisdictionTest.php` (4): staf sewilayah Ok, staf luar wilayah 403, superadmin Ok lintas wilayah, pelapor Ok lintas tenant.
- **Verifikasi:** `php artisan test` 127 passed (345 assertions; baseline 121 + 6 baru #31/#32). `vendor/bin/pint` bersih.
- **Sumber:** audit menyeluruh 2026-06-29.
- **Status:** FIXED (2026-06-29)

### #32 — Dispatch/release unit tak ter-scope yurisdiksi laporan; releaseUnit menulis lintas-tenant
- **Severity:** P3 (korupsi state dispatch lintas wilayah; langgar ATURAN EMAS #7)
- **Lokasi:** `app/Http/Controllers/ReportActionController.php:206-236` (`dispatchUnit`), `:239-262` (`releaseUnit`); `app/Models/ReportUnit.php` (tanpa trait `Tenantable`); pivot `report_units` tanpa kolom wilayah (`2026_06_28_120100_*`)
- **Gejala:** Berbeda dengan `takeAction`/`arrive` yang memanggil `ensureWithinJurisdiction($report, $user)`, kedua endpoint unit **tidak** mengecek apakah laporan ada di wilayah aktor:
  1. **`releaseUnit`:** cari pivot `ReportUnit::where(report_id)->where(unit_id)->where(status,'dispatched')` (ReportUnit tak ter-scope) lalu `Unit::withoutGlobalScopes()->whereKey($unit_id)->update(['status'=>'available'])` — **nol re-check** wilayah. `report_id`+`unit_id` enumerable → petugas/admin wilayah A bisa men-set unit wilayah B jadi `available`, merusak state dispatch & data unit wilayah lain. Inilah pola `withoutGlobalScopes()` tanpa re-check yang dilarang ATURAN EMAS #7.
  2. **`dispatchUnit`:** `Unit::findOrFail` ter-scope (hanya unit wilayah sendiri yang bisa dikerahkan — aman), TAPI report di-fetch `withoutGlobalScopes` tanpa cek wilayah → petugas bisa kerahkan unit-nya sendiri ke insiden luar wilayah (membuat pivot pada laporan asing + menandai unitnya sibuk). Dampak lebih kecil tapi tetap inkonsisten.
- **Dampak:** Manipulasi/korupsi state armada lintas wilayah; melemahkan isolasi multi-tenant. Bukan kebocoran data baca, tapi penulisan lintas-tenant.
- **Catatan tambahan (minor, sekalian):** `dispatchUnit` mengizinkan pengerahan ke laporan berstatus `TERLAPOR` (belum divalidasi) — hanya `resolved`/`ditolak` yang ditolak. Pertimbangkan batasi ke laporan yang sudah `pending`/`handling`.
- **Rekomendasi fix:** panggil `ensureWithinJurisdiction($report, $user)` di awal `dispatchUnit` & `releaseUnit` (selaras `takeAction`/`arrive`); di `releaseUnit`, fetch unit ter-scope (tanpa `withoutGlobalScopes`) atau verifikasi wilayah unit/laporan vs aktor sebelum update. Superadmin/admin nasional bypass mengikuti pola yang ada.
- **Fix (2026-06-29):** `dispatchUnit` & `releaseUnit` kini memanggil `ensureWithinJurisdiction($report, auth()->user())` di awal (selaras `takeAction`/`arrive`; `ensureWithinJurisdiction` kini delegasi ke `User::withinReportJurisdiction`, lihat #31). `releaseUnit` tak lagi pakai `Unit::withoutGlobalScopes()` — diganti `Unit::whereKey($id)->update(['status'=>'available'])` yang TUNDUK Tenantable (staf wilayah hanya bisa membebaskan unit di wilayahnya; admin nasional/superadmin bypass), menghapus pelanggaran ATURAN EMAS #7.
- **Test:** `tests/Feature/Sisupit/UnitDispatchTest.php` (+2): petugas luar wilayah → 403 saat dispatch & saat release (unit tetap pada status semula).
- **Verifikasi:** lihat #31 (suite sama, 127 passed / 345 assertions).
- **Sumber:** audit menyeluruh 2026-06-29.
- **Status:** FIXED (2026-06-29)

### #33 — Alur respons relawan tidak konsisten & detail tak bisa diakses sebelum commit
- **Severity:** P2 (UX rusak + alur respons relawan cacat)
- **Lokasi:** `app/Http/Controllers/ReportController.php` (`show` otorisasi), `app/Http/Controllers/ReportHelperController.php` (`store`), `resources/js/Components/ReportCard.jsx`, `resources/js/Pages/Front/Reports/Show.jsx`
- **Gejala:** Relawan punya DUA alur respons yang berbeda semantik:
  1. Dari kartu radar ("Saya Akan Bantu" → `HelpConfirmAlertDialog` → `front.helpers.store`): set `status='waiting'`, TIDAK ubah laporan ke `handling`, TIDAK set waktu, TIDAK broadcast, redirect ke dashboard.
  2. Dari detail ("Meluncur ke Lokasi" → `take-action`): set `en_route`, ubah ke `handling`, broadcast roster.
  Akibat: (a) status `waiting` tak dikenali `Show.jsx` → manifes badge mentah "waiting", Panel Tindakan jatuh ke fallback "Anda Sedang di Lokasi." (SALAH) tanpa tombol Tiba/Batal → relawan mandek. (b) `ReportController::show()` menolak relawan non-helper (403) → relawan harus commit "Saya Akan Bantu" secara buta sebelum bisa melihat detail insiden. (c) Respons dari kartu tak ter-broadcast → viewer lain tak lihat relawan baru real-time.
- **Keputusan produk (user, 2026-06-29):** satukan alur respons di halaman detail; izinkan relawan membuka detail read-only (ter-scope yurisdiksi) sebelum memutuskan meluncur (menerima trade-off ekspos lokasi/PII ke relawan siaga sewilayah).
- **Fix (2026-06-29):**
  1. `show()` — tambah `$isRelawanInArea = hasRole('relawan') && status!='ditolak' && withinReportJurisdiction($report)` ke gerbang akses (read-only sebelum commit).
  2. `ReportCard.jsx` — tombol relawan diganti dari `HelpConfirmAlertDialog` jadi `Link` "Lihat & Respons" → `reports.show`; respons kini lewat "Meluncur ke Lokasi" (`take-action`) di detail (en_route + handling + broadcast `ResponderRosterChanged`). Import `HelpConfirmAlertDialog` dihapus dari kartu.
  3. `Show.jsx` — `getResponderStatus('waiting')` diberi label "Bersiap"; cabang panel "Anda Sedang di Lokasi." dipersempit ke `status==='arrived'` saja (status tak terduga menampilkan label netral, bukan klaim palsu).
- **Sisa cleanup (BELUM, di luar scope ini):** endpoint `front.helpers.store` (`ReportHelperController::store`, route web.php:162) + komponen `HelpConfirmAlertDialog.jsx` & `VolunteerAction.jsx` (dead, tak dipakai) kini tak terpakai oleh alur hidup; status `'waiting'` jadi legacy. Pertimbangkan hapus/deprecate di task terpisah agar tak ada lagi sumber data `waiting` baru.
- **Verifikasi:** `npm run build` lulus; `php artisan test` 127 passed (345 assertions). Manual: relawan buka kartu → Lihat & Respons → detail → Meluncur → Tiba/Batal berfungsi & ter-broadcast.
- **Sumber:** review tampilan relawan 2026-06-29.
- **Status:** FIXED (sisa cleanup endpoint mati OPEN)

### #34 — Deteksi GPS form lapor: fix jaringan diterima buta, cache basi, tanpa fallback, GPS ganda
- **Severity:** P2 (lokasi laporan darurat bisa salah kota → salah tenant/respons)
- **Lokasi:** `resources/js/Pages/Front/Reports/Create.jsx` (`getUserLocation`, submit guard), `resources/js/Components/UserLeafletMap.jsx` (EFFECT 2), `resources/js/lib/utils.js` (`GEO_OPTIONS`)
- **Gejala (laporan user):** saat create report GPS sering error — kadang lama, kadang tak terdeteksi, kadang "lari ke Surabaya".
- **Root cause (4 hal terpisah):**
  1. **`coords.accuracy` tak pernah dibaca** (grep seluruh repo: nihil). Bila perangkat tak dapat GPS asli (dalam ruangan/PC tanpa modul/WebView tanpa izin), browser jatuh ke lokasi berbasis jaringan (WiFi/IP) yang bisa me-resolve ke kota POP/gateway ISP (mis. Surabaya) dengan akurasi puluhan km. Fix ngawur ini diterima identik dgn fix 10 m **dan** langsung auto-isi yurisdiksi (provinsi→desa) yang salah.
  2. **`maximumAge: 30000`** → boleh balas fix cache s.d. 30 dtk lama = "GPS lama"/basi.
  3. **`enableHighAccuracy:true` + timeout 20 dtk tanpa fallback/retry** → di perangkat tanpa GPS timeout lalu gagal total = "tidak terdeteksi".
  4. **Dua permintaan GPS bersamaan:** saat mount `data.lat/lng` kosong → `UserLeafletMap` EFFECT 2 ikut memanggil `getCurrentPosition` sendiri, paralel dgn `Create.jsx` (boros + race + peta bisa tampil titik beda dari form).
- **Fix (2026-07-05):**
  1. `utils.js` — preset baru `GEO_OPTIONS.fresh` (`highAccuracy`, `maximumAge:0`, timeout 12 dtk) + `lowAccuracy` (jaringan, fallback). Helper `getFreshPosition()` (coba akurat-segar → fallback SEKALI ke akurasi-rendah). Konstanta `GEO_ACCURACY_THRESHOLD=1000` (m) & `DEFAULT_MAP_CENTER` (Denpasar).
  2. `Create.jsx` — `getUserLocation` pakai `getFreshPosition`; jika `accuracy > threshold` → `applyUntrustedPoint` (pakai titik sbg awalan pin tapi **kosongkan yurisdiksi** + toast minta geser pin); gagal total → pin di `DEFAULT_MAP_CENTER` untuk digeser manual. Submit guard: create wajib `lat/lng` **dan** `province_code` (cegah kirim tanpa wilayah dgn pesan ramah, bukan error field tersembunyi).
  3. `UserLeafletMap.jsx` — prop `autoLocate` (default `true`, Pumps/FireStations tetap auto-center); form lapor set `autoLocate={false}` → hilangkan GPS ganda.
- **Catatan WebView:** "lama saat pertama buka" juga terbantu (maximumAge:0 + fallback akurasi-rendah mempercepat cold fix). Jika WebView Android tetap gagal deteksi, cek sisi native: `setGeolocationEnabled(true)`, `onGeolocationPermissionsShowPrompt`, izin `ACCESS_FINE_LOCATION` (di luar repo ini).
- **Verifikasi:** `npm run build` lulus (2×). Manual pending di perangkat: fix akurat → auto-isi wilayah; fix buruk/gagal → pin bisa digeser, wilayah terisi setelah drag; submit tanpa wilayah ditahan dgn toast.
- **Sumber:** laporan user GPS error 2026-07-05.
- **Status:** FIXED (verifikasi manual perangkat pending)

### #35 — Migrasi penuh layanan OSM ke self-hosted + hardening fallback config
- **Severity:** P2 (privasi lokasi + kepatuhan ToS + ketahanan)
- **Lokasi:** `config/services.php`, `.env` & `.env.example`, `docker/osrm/` (baru), `app/Http/Controllers/Api/RouteController.php`, `resources/js/lib/utils.js` + 14 file peta, `tests/Feature/Sisupit/GeocodeControllerTest.php`
- **Konteks:** audit atas permintaan user "di mana saja pakai OSM & apakah semua sudah ke Nominatim lokal". Temuan: reverse-geocode/search sudah terpusat di `GeocodeController` & dev sudah tunjuk Nominatim lokal, TAPI (a) routing OSRM masih server demo publik `router.project-osrm.org` (`OSRM_BASE_URL` tak di-set), (b) default `config/services.php` untuk Nominatim & OSRM fallback ke host publik → bila env lupa di-set, diam-diam membebani server publik (ToS + bocor lokasi user), (c) URL tile basemap CARTO di-hardcode di 14 file.
- **Fix (2026-07-05, lokal — VPS dikerjakan terpisah paling akhir):**
  1. **OSRM self-hosted:** `docker/osrm/` baru (docker-compose + `prepare-bali.ps1` + `.env`/`.env.example` + README) meniru pola `docker/nominatim/`. Memakai ulang `docker/nominatim/data/bali.osm.pbf`; pipeline MLD (extract→partition→customize). **Terbukti jalan lokal**: container `sisupit-osrm` up di host :5001 (5000 direservasi Windows), `curl .../route/v1/driving/...` balas `code:Ok` rute Denpasar 5788 m.
  2. **Hardening config:** default `services.nominatim.base_url` & `services.osrm.base_url` diubah dari host publik → `http://127.0.0.1:8080` / `:5000`. Env hilang kini gagal cepat (connection refused), bukan diam-diam publik. `.env` lokal + `.env.example` diberi `OSRM_BASE_URL`/`OSRM_USER_AGENT` (lokal host :5001).
  3. **Sentralisasi tile:** konstanta `MAP_TILE_URL` di `resources/js/lib/utils.js`; 14 URL CARTO hardcoded diganti impor konstanta ini → swappable ke tile server sendiri dari satu tempat.
  4. **Test:** `GeocodeControllerTest` di-decouple dari host publik (`Http::fake('*')` alih-alih `*nominatim.openstreetmap.org*`) — kalau tidak, request nyata lolos ke Nominatim lokal yang berjalan → test 502/JSON gagal.
- **VPS (2026-07-06, prod/staging/dev):** kedua service di-deploy sebagai **satu instance bersama** di `/opt/geo/{nominatim,osrm}` (Docker 29.6). Nominatim host :8088 (8080 dipakai reverb prod), OSRM :5000, **bind `127.0.0.1` saja** (tak terekspos publik). Ketiga `.env` (`/var/www/sisupit`, `-staging`, `-dev`) ditambah `NOMINATIM_BASE_URL=http://127.0.0.1:8088` + `OSRM_BASE_URL=http://127.0.0.1:5000` (di-backup dulu); prod `config:cache`, staging/dev `config:clear`. Verified end-to-end lewat bootstrap Laravel tiap env: Nominatim reverse 200 (alamat Denpasar), OSRM route 200 `code:Ok`. `restart=unless-stopped` + docker enabled → tahan reboot. Detail: memory `project_sisupit_vps_geo_deploy_2026-07-06`.
- **Kode app ke VPS (2026-07-06):** commit `d3977cc` (#34+#35 + `public/build`) di-push ke `main`+`staging`+`dev` (fast-forward dari 36e5cdd) lalu `git pull` di ketiga folder VPS + optimize:clear + prod config:cache + reload php8.2-fpm. Verified: 3 HEAD=d3977cc, 3 situs HTTP 200. (Spotlight.jsx & deploy/* WIP sesi lain sengaja dikecualikan.)
- **Sisa (OPEN):** (a) Tile server self-hosted penuh (TileServer-GL/OpenMapTiles) = proyek infra terpisah; kini tetap CARTO tapi sudah terpusat. (b) Data VPS baru Bali; Indonesia penuh = swap PBF + reimport.
- **Verifikasi:** `npm run build` lulus; `php artisan test` 127 passed (345 assertions); OSRM lokal & VPS balas rute nyata; `config:show services` lokal → `127.0.0.1:8080`/`5001`, VPS 3 env → `127.0.0.1:8088`/`5000`.
- **Sumber:** audit ketergantungan OSM 2026-07-05.
- **Status:** FIXED (lokal + VPS 3 environment)

### #36 — Seeder fasilitas: kode wilayah Pompa/Pos salah label vs kode BPS asli
- **Severity:** P3 (integritas data seed + scoping tenant, bukan bug runtime)
- **Lokasi:** `database/seeders/PompaSeeder.php`, `database/seeders/PosPemadamSeeder.php`
- **Konteks:** ditemukan saat memperbaiki koordinat fasilitas (permintaan user "titik pompa/pos/hydrant sama dengan lokasinya"). Komentar & `district_code` beberapa fasilitas tidak konsisten dengan kode BPS laravolt: `517102` dikomentari "Denpasar Barat" padahal `517102` = **Denpasar Timur** (Barat = `517103`, Utara = `517104`). Contoh: "Pompa Sentral Pasar Badung" beralamat Denpasar Barat tapi ber-`district_code` `517102` (Timur); "Pos Pemadam Sektor Ubung" (Denpasar Utara) ber-`district_code` `517103` (Barat). Sebagian `village_code` juga meragukan.
- **Dampak:** koordinat (lat/lng) fasilitas **sudah benar** & peta memplot per koordinat, jadi marker tampil di tempat yang tepat. Namun `Tenantable` menyaring fasilitas per `district_code`/`village_code` → admin tingkat kecamatan bisa keliru melihat/menyembunyikan fasilitas yang sebenarnya di wilayahnya (atau bukan). Verifikasi reverse-geocode koordinat lama Pompa/Pos: semua duduk di kelurahan yang benar sesuai alamat.
- **TIDAK dikerjakan (di luar scope task "perbaiki titik"):** menyamakan kode ke lokasi asli mengubah cakupan Tenantable (siapa admin yang melihat fasilitas apa) → keputusan arsitektur, bukan fix koordinat. Perlu konfirmasi user.
- **Sumber:** perbaikan koordinat fasilitas + reseed laporan Denpasar 2026-07-07.
- **Status:** OPEN

### #37 — Form lapor darurat-first (Kluster A review UI/UX) + backlog review B–H
- **Severity:** P0 (beban kognitif saat panik) untuk Kluster A; B–H P1–P2
- **Lokasi:** `app/Http/Requests/ReportRequest.php`, `resources/js/Pages/Front/Reports/Create.jsx`, `tests/Feature/Sisupit/ReportMultiPhotoTest.php`
- **Konteks:** review kegunaan + review UI menyeluruh dari user (2026-07-11) menuntut form lapor lebih "darurat-first": tombol utama besar/sticky, pilihan cepat jenis, foto opsional & tidak dominan, status GPS tegas. Menguatkan temuan UX 2026-07-06 (foto wajib berbahaya; `description` server `required` tapi UI berlabel "(Opsional)").
- **Keputusan produk user (dikonfirmasi 2 gerbang):** validasi **bergantung jenis kejadian** — KEBAKARAN (rumah/toko/kendaraan/lahan) → foto+deskripsi+patokan OPSIONAL (lapor cepat); NON-kebakaran ('lainnya') → ketiganya WAJIB + judul teks bebas. Lokasi (lat/lng/wilayah) selalu wajib.
- **Fix Kluster A (2026-07-11):**
  1. **`ReportRequest`** — sinyal `incident_type` (in:rumah,toko,kendaraan,lahan,lainnya; tak disimpan sbg kolom, jenis tersimpan di `title`). `$isOtherEmergency = POST && incident_type==='lainnya'` → `photos`/`description`/`address` `required` hanya saat 'lainnya', selain itu `nullable`. Di luar POST tetap nullable.
  2. **`Create.jsx`** — (a) pilihan cepat 5 tombol besar (`min-h-[72px]`) ganti input judul bebas; 'Lainnya' memunculkan input teks; judul auto ("Kebakaran Rumah"…). (b) foto **collapsible** "Tambah foto jika aman" + pesan keselamatan "Jangan mendekat ke api hanya untuk mengambil foto"; auto-buka & label "(Wajib)" saat 'lainnya'. (c) **sticky CTA** "Kirim Laporan Darurat" (`fixed bottom-16` di atas MobileBottomNav h-16 z-50, `h-12`=48px, `sm:hidden`); tombol desktop `hidden sm:flex`; form `id="reportForm"`. (d) status GPS **4-tingkat** derivasi (`locState`): biru memindai / hijau siap / **kuning kurang akurat** (titik ada tapi `province_code` kosong) / merah gagal — sebelumnya fix tak-akurat keliru tampil hijau. (e) label diperpendek ("Patokan Lokasi (Opsional/Wajib)"). Root padding `pb-40 lg:pb-8` agar konten tak tertutup CTA+nav.
  3. **Test** — `ReportMultiPhotoTest` "rejects without any photo" (asumsi foto selalu wajib) → dipecah jadi 2: kebakaran (`incident_type=rumah`) tanpa foto **berhasil**; 'lainnya' tanpa foto **ditolak** (`assertSessionHasErrors('photos')`).
- **Verifikasi:** `npm run build` lulus (client+SSR); `php artisan test` **133 passed** (368 assertions, dari baseline 132). Verifikasi visual perangkat/browser **pending**.
- **Backlog review UI/UX 2026-07-11 (OPEN, prioritas):** **B** kamus & warna status — Selesai=biru sudah 80% (audit konsistensi semua permukaan + putuskan handling teal vs emerald existing). **C** admin = antrean triase (default filter aktif, Export Excel→sekunder, chip urgensi umur/foto/GPS, TERLAPOR kontras tinggi, header "Menunggu Verifikasi: X"). **D** legend peta diperbesar + ikon per-status. **E** detail laporan: pisah 3 panel (Aksi/Lokasi/Detail), satu tombol dominan per role, Tolak jadi destructive kecil, microcopy koreksi lokasi. **F** landing darurat-first (Lapor dominan vs Masuk, nomor darurat tombol tel besar, hero operasional, statistik "0" dijaga). **G** dashboard petugas/relawan (CTA misi besar, umur laporan, jarak km). **H** tipografi/ukuran lintas layar (tombol ≥48px, label status 12–13px semibold, kurangi uppercase kecil).
- **Kluster H — Tipografi status label (FIXED 2026-07-11):** fokus pelanggaran "label status terlalu kecil / uppercase mungil" — bukan sweep global. Semua badge/pill **status** `text-[9px] ... uppercase` → **`text-xs` (12px) font-semibold, buang uppercase+tracking**: `Front/Reports/Show` badge responden (×2), pill status fasilitas `Hydrants/Pumps/FireStations/Volunteers` Index (Aktif/Perbaikan/Siaga kini title-case). Tombol ≥48px: CTA primer di layar laporan sudah ≥48px sejak A/E/F (Show h-12, Landing/Spotlight h-14); tombol h-10 di grid kartu padat (ReportCard/petugas) dipertahankan sebagai kompromi. Section micro-label `text-[10px] uppercase` sengaja DIBIARKAN (sweep besar/stilistik). Build OK, **135 passed**.
- **Kluster B — Konsistensi kamus & warna status (FIXED 2026-07-11):** audit semua permukaan. **Warna sudah seragam** (token semantik: TERLAPOR=destructive, pending=warning, handling=success/emerald, resolved=info/biru, ditolak=muted) sejak brand-align — tak diubah. **Label diselaraskan** ke kamus kanonik yg sudah dipakai Admin/Reports (C) + Peta (D): **Laporan Masuk / Laporan Terverifikasi / Penanganan / Selesai / Ditolak**. Perbaikan: `Components/StatusBadge` (sumber kebenaran; 'Darurat'→'Laporan Masuk', 'Menunggu'→'Laporan Terverifikasi' — otomatis merambat ke Petugas/Admin Dashboard yg memakainya); `Front/Reports/Show` ('Menunggu Bantuan'→'Laporan Terverifikasi', 'Dalam Penanganan'→'Penanganan'); `Components/ReportCard` ('Darurat'→'Laporan Masuk'); `Front/Reports/Index` **StatusBadge LOKAL duplikat DIHAPUS** (anti-pola persis yg komponen StatusBadge cegah — dulu label UPPERCASE 'TERLAPOR'/'MENUNGGU') → pakai komponen bersama (import Badge tak terpakai ikut dibuang). Guideline seksi "Status Laporan" sudah kanonik (tak diubah); demo badge generiknya dibiarkan (ilustrasi komponen, bukan kamus). Button-state ReportCard ('Menunggu Relawan' dst) dibiarkan (domain aksi, bukan badge status). Build OK, **135 passed**.
- **Kluster D — Legend peta diperbesar + ikon per-status (FIXED 2026-07-11):** `Pages/Monitoring/Map.jsx` panel "Layer" (legend+filter). Chip status **diperbesar**: `text-[10px]`→`text-[11px]`, titik 6px→8px, padding `px-2 py-0.5`→`px-2.5 py-1`, panel `max-w-[15rem]`→`[16rem]`. **Ikon per-status**: chip Kejadian kini pakai **glyph pin** berwarna status (`MiniPin`, meniru marker teardrop di peta, warna dari `s.dot`→text-) alih-alih titik polos; chip **fasilitas** dapat **titik berwarna** `facilityColor` (Aktif=biru/Perbaikan=merah) yang sebelumnya TAK ADA indikator warna; relawan titik (Siaga=hijau). `StatusChip` di-refactor terima prop `glyph` (node) + helper `MiniPin`/`Dot`. Build OK, **135 passed** (UI-only).
- **Kluster F — Landing darurat-first (FIXED 2026-07-11):** `Pages/Landing.jsx` hero. **Lapor dominan vs Masuk**: "Lapor Darurat" solid destructive dibesarkan (h-12→h-14, shadow); "Masuk"/"Dashboard" diturunkan jadi `variant="ghost"` teks muted (sekunder, login juga tetap ada di navbar). **Nomor darurat = aksi sekunder** (revisi user 2026-07-11: versi awal "tombol tel besar" diturunkan): tombol kompak outline muted 1-baris (border-border/bg-card, ikon telepon + nomor), jelas subordinat ke CTA lapor; `tel:` dirapikan `(0361)223333`→`0361223333` (dialer-friendly). Statistik "0" **dijaga** (`?? 0` + toLocaleString, tak disembunyikan/ dipalsukan). Hero illustration & seksi lain tak diubah. **Koreksi routing (2026-07-11):** `/` sebenarnya merender **Spotlight** (`HomeController::landing()` → `return $this->spotlight()`, blok Landing dikomentari sejak 2026-07-11), jadi poles F sempat dorman. Keputusan user: `/` **tetap ke Spotlight**; halaman Landing dipoles diakses lewat route baru **`/landing`** (`home.landing.page` → `HomeController::landingPage()`, render `inertia('Landing')` dgn 3 stat). Test `LandingWebViewTest` +1 (`/landing`→component Landing). Build OK, **135 passed**. **Spotlight (live di `/`) di-darurat-first-kan (2026-07-11):** `Spotlight.jsx` — **primer = "LAPOR SEKARANG!"** dibesarkan (h-12→h-14 px-10); **sekunder = nomor darurat** sbg tombol kompak outline muted 1-baris (border-border/bg-card, ikon+nomor). Revisi user (2×): (1) versi awal kartu tel besar bg-destructive DITURUNKAN jadi sekunder; (2) tiga tombol (Lapor/telepon/unduh) awalnya beda ukuran+lebar+gaya → dikelompokkan **satu stack `max-w-sm` w-full gap-3 dengan 3 tingkat jelas**: PRIMER Lapor (h-14 solid destructive) › SEKUNDER telepon (h-12 outline border/card) › TERSIER Unduh APK (h-11 transparan muted, tanpa border). `tel:(0361)223333`→`0361223333`, typo "Cepat,Tepat"→"Cepat, Tepat", IconDownload import dibuang. Build OK, **135 passed**. Kontrak revert: frasa "kembalikan spotlight ke kondisi sekarang" = pulihkan Spotlight.jsx ke commit sebelum ini (lihat memori feedback_spotlight_revert_contract).
- **Kluster G — Dashboard petugas/relawan (FIXED 2026-07-11):** tanpa ubah controller (payload sudah bawa lat/lng + created_at). **Petugas** (`Pages/Petugas/Dashboard`): fix GPS sekali (GEO_OPTIONS.oneShot, senyap bila ditolak) → tiap misi diperkaya `isUrgent` (TERLAPOR) + `distKm` (haversine garis-lurus, helper lokal); chip **jarak km ke TKP** (IconRoute, "±X km"), umur "Dilaporkan {time}" jadi merah saat urgent, **CTA per-misi diperbesar & status-aware** (TERLAPOR→"Tanggapi" solid destructive; lainnya→"Pantau" outline, h-9→h-10). **Relawan** (`Components/ReportCard` — dipakai hanya di `Pages/Dashboard`): umur mentah tanggal → **`timeAgo`** relatif; chip jarak km (Navigation icon) via prop `myPos` dari Dashboard (GPS relawan sekali); semua **CTA h-8→h-10** (nav h-8→h-10). Build client+SSR OK, **134 passed** (UI-only). Distance = garis lurus (bukan OSRM) — cukup untuk taksiran, tanpa panggilan jaringan per baris.
- **Kluster E — Hierarki detail laporan (FIXED 2026-07-11):** `Front/Reports/Show.jsx` panel verifikasi TERLAPOR — **satu aksi dominan** "Broadcast Misi" (`h-12`, satu-satunya tombol solid) + **Tolak diturunkan** jadi tombol teks `variant="ghost"` destructive kecil (`h-8`, "Tolak laporan"), bukan lagi dua tombol setara. Microcopy koreksi lokasi diperjelas (alasan + dampak: "Titik laporan mungkin belum tepat… agar rekan lain menuju titik yang benar"). Split kiri(Detail+Peta)/kanan(Aksi+Manifes) sudah ada → dipertajam hierarki, tak dibongkar (ATURAN EMAS #2). Build OK, **134 passed** (UI-only, tak ubah test). Sisa E opsional (reorder Aksi-first di mobile, split literal 3-kolom) belum dikerjakan — perlu keputusan bila diinginkan.
- **Kluster C — Admin = antrean triase (FIXED 2026-07-11):** `Admin/ReportController::index` default filter → **`aktif`** (bukan 'Semua') + prop `menunggu_verifikasi` (count TERLAPOR, ter-scope Tenantable, independen filter). `Admin/Reports/Index.jsx`: pill "Aktif" ditambah & jadi default; **banner "X laporan menunggu verifikasi"** (klik → filter TERLAPOR); **Export Excel dipindah ke menu kebab ⋮** (DropdownMenu, sekunder) — pemakaian DropdownMenu pertama di Pages; **chip urgensi** di kartu (umur relatif via `timeAgo` helper baru di utils, ada/tanpa foto dari kolom `photo`, "Tanpa titik"); kartu **TERLAPOR kontras** (border+bg destructive + ikon alert); tombol TERLAPOR jadi **"Tinjau & Verifikasi"** solid dominan (lainnya tetap ghost "Detail"). `ReportsExport` sudah handle 'aktif' (tak berubah). Test: +1 (`ReportExportTest` default aktif + hitung menunggu_verifikasi). Build OK, **134 passed**.
- **Sumber:** review kegunaan + review UI user 2026-07-11.
- **Status:** SELESAI — Kluster A–H semua FIXED (verifikasi visual browser pending untuk semua). Tak ada sisa backlog #37.

### #38 — Poles halaman "Laporan Diterima" (/thanks) pasca-lapor darurat
- **Severity:** P2 (UX pasca-lapor: kejelasan aksi + kerapian mobile)
- **Lokasi:** `resources/js/Pages/Front/Reports/Thanks.jsx`
- **Konteks:** review UX user 2026-07-12 atas `/reports/thanks/{report}`. Halaman sudah fungsional (nomor laporan, waktu, aksi, pesan keselamatan) tapi perlu dirapikan agar lebih "pasca-lapor darurat": tenangkan warga, aksi jelas, jangan menjanjikan relawan sudah menerima.
- **Fix (2026-07-12, poin 2–6):**
  1. **Copy over-promise (poin 4):** "Pusat Komando dan Relawan terdekat telah menerima…" → **"Pusat Komando telah menerima laporan Anda. Petugas/relawan terdekat sedang dikoordinasikan…"** (tak menjanjikan relawan sudah menerima bila sistem belum memastikan).
  2. **CTA lebih darurat (poin 3):** primer tetap "Pantau Bantuan" (default brand); "Telepon Damkar" outline → **`variant="destructive"` solid** "Telepon Damkar Sekarang" + microcopy "Telepon jika api membesar atau ada korban."
  3. **Mini-stepper (poin 5):** alur `Laporan Masuk → Terverifikasi → Penanganan → Selesai` (label **kanonik** StatusBadge/#37-B, bukan "Verifikasi/Petugas Bergerak" usulan mentah), tahap aktif "Laporan Masuk" (destructive).
  4. **Note nomor laporan (poin 6):** teks kecil "Sebutkan nomor laporan ini saat menelepon Damkar."
  5. **Kerapian mobile (poin 2):** container `pb-24 sm:pb-6` (kartu terakhir tak tertutup MobileBottomNav; AppLayout hanya `pb-20`); kartu "Layanan Resmi" di mobile diblok center. Foto pejabat **tetap tampil di mobile & desktop** (revisi user 2026-07-12: foto pejabat wajib muncul).
- **DITUNDA — poin 1 (akses tanpa login):** keputusan user 2026-07-12 = **tetap wajib login** (route `front.reports.thanks` di grup `auth,verified`). Signed-URL/token sementara untuk pemilik laporan TIDAK diadopsi sekarang (bukti laporan agak sensitif; diff & risiko keamanan di luar poles UX ini). Konsekuensi: bila session habis / link dibuka ulang tanpa login → dilempar ke login. Bila diinginkan nanti: route pakai middleware `signed` (tanpa `auth`) + `store()` redirect ke URL bertanda-tangan berbatas waktu.
- **Follow-up 2026-07-12 — nomor laporan konsisten lintas peran:** nomor `LP-YYYY-NNNNN` semula hanya di halaman Thanks (rumus inline). Diangkat jadi helper tunggal **`reportNumber(report)` di `resources/js/lib/utils.js`** (turunan `id`+tahun `created_at`, tak disimpan) → dipakai di **`Front/Reports/Show`** (bawah judul header, dilihat semua peran), **`Admin/Reports/Index`** (kartu antrean, bawah judul), **`Petugas/Dashboard`** (kartu misi, bawah judul). Thanks ikut refactor ke helper (buang duplikat). Payload petugas `DashboardController::index` activeMissions ditambah `created_at` agar tahun nomor akurat (sebelumnya hanya `time` terformat). Foto pejabat di Thanks juga dibesarkan potret `h-28 w-24` (rounded-lg, ganti lingkaran kecil) atas permintaan user. Front/Reports/Index (daftar warga) belum diberi nomor — di luar permintaan (admin+petugas).
- **Verifikasi:** `php artisan test` **135 passed** (382 assertions, tak berubah — UI-only + payload additive); `npm run build` lulus (client+SSR). Verifikasi visual browser **pending**.
- **Sumber:** review UX halaman thanks user 2026-07-12.
- **Status:** SELESAI (poin 2–6 FIXED; poin 1 DITUNDA atas keputusan user; nomor laporan kini konsisten di detail/admin/petugas).

### #39 — Berita Acara / Laporan Kegiatan Penyelamatan (petugas isi pasca-insiden)
- **Severity:** P2 (fitur baru — dokumentasi resmi penanganan insiden)
- **Konteks:** permintaan user 2026-07-12 (format laporan Damkar Denpasar). Saat insiden ditutup, petugas perlu mendokumentasikan "Laporan Kegiatan Penyelamatan" (jenis kejadian, sumber info, waktu, lokasi, pemilik lahan, kerugian, tim atensi, identitas korban) + upload **foto kejadian** & **foto KTP korban**. Data awal diisi **sementara**; setelah investigasi diisi **data valid**.
- **Keputusan user (AskUserQuestion 2026-07-12):**
  1. **Alur:** insiden **tutup dulu** (alur `resolve()` TIDAK diubah), berita acara diisi belakangan lewat panel/halaman terpisah.
  2. **Sementara vs Final = record TERPISAH (append-only)**, bukan edit satu record — tiap simpan membuat entri baru bertanda `sementara`/`final` agar bisa dibandingkan.
  3. **Korban bisa banyak** (daftar dinamis, tiap korban punya foto KTP sendiri).
  4. **Foto KTP = PII → disk PRIVAT** (`storage/app`, disk `local`), diakses hanya lewat route bergerbang role+yurisdiksi. Foto kejadian tetap publik (galeri).
- **Implementasi:**
  - **Migrasi:** `report_resolutions` (report_id NON-unik, hasMany; status sementara/final, created_by, occurred_at, jenis_kejadian, sumber_informasi, lokasi_alamat/kelurahan/kecamatan, pemilik_nama/umur, kerugian, tim_atensi, kronologi), `report_victims` (report_resolution_id, nama/tanggal_lahir/alamat/ktp_path), `report_resolution_photos` (report_resolution_id, path).
  - **Model:** `ReportResolution`, `ReportVictim`, `ReportResolutionPhoto` + `Report::resolutions()` (HasMany).
  - **Controller baru `ReportResolutionController`:** `create` (form, prefill dari entri terbaru / data laporan + tim atensi dari nama officers/helpers), `store` (buat entri baru; KTP → `store('ktp','local')`, foto → `store('resolutions','public')`), `destroy` (hapus entri + file KTP privat & foto), `ktp` (streaming file KTP dari disk privat, `Storage::disk('local')->response()`). Semua bergerbang `authorizeStaff()` = role petugas/admin/superadmin + `withinReportJurisdiction` (report di-fetch withoutGlobalScopes → ATURAN EMAS #7).
  - **Routes (web.php, grup auth+verified):** `reports.resolution.create` (GET), `reports.resolution.store` (POST), `reports.resolution.destroy` (DELETE), `reports.resolution.ktp` (GET).
  - **Frontend:** `ReportController::show` kirim prop `resolutions` (staf saja; KTP dikirim sebagai URL route, path TIDAK dibocorkan) + `canManageResolution`. `Show.jsx` panel "Laporan Kegiatan Penyelamatan" (timeline entri, badge Sementara/Final, korban + link "Lihat KTP", foto, tombol Buat & hapus). Halaman baru `Front/Reports/Resolution/Create.jsx` (form korban dinamis + galeri foto, dua tombol "Simpan sebagai Sementara"/"Final" via `useForm().transform`).
- **Verifikasi:** `php artisan test` **141 passed** (408 assertions; +6 test baru `ReportResolutionTest`: gate non-staf, simpan korban+foto & KTP di disk privat bukan public, append-only, KTP hanya staf, blok lintas-yurisdiksi, hapus entri+file). `npm run build` lulus (client+SSR). Verifikasi visual browser **pending**.
- **Catatan PII:** KTP tidak pernah dapat URL publik; hanya via `reports.resolution.ktp` (auth+role+yurisdiksi). `php artisan storage:link` tetap diperlukan untuk foto kejadian (public) di server, bukan untuk KTP.
- **Sumber:** permintaan user 2026-07-12.
- **Status:** SELESAI (fitur baru FIXED; verifikasi visual browser pending).

### #40 — Petugas kesulitan menemukan laporan Selesai untuk isi Berita Acara
- **Severity:** P2 (UX gap — jalur kerja terputus pasca-insiden)
- **Konteks:** permintaan user 2026-07-15. Setelah petugas menandai insiden **Selesai** (`resolve()` → status `resolved`) dan kembali ke dashboard, laporan itu **hilang dari semua permukaan** yang biasa dipakai petugas, sehingga sulit ditemukan lagi untuk mengisi Laporan Kegiatan Penyelamatan (#39).
- **Root cause:**
  1. `DashboardController` (branch petugas) hanya query `whereIn('status', ['pending','handling','TERLAPOR'])` → begitu `resolved`, laporan lenyap dari banner, peta taktis, & daftar misi.
  2. Satu-satunya pintu ke form berita acara ada di halaman **detail** (`Show.jsx` → `reports.resolution.create`); butuh entry point.
  3. Nav "Arsip & Riwayat" → `front.reports.index?filter=mine` = `where user_id = petugas.id` (laporan yang DIA buat sbg pelapor), bukan yang dia tangani → laporan warga tak muncul.
- **Fix (best practice: work-queue + hand-off, alur `resolve()` TIDAK diubah):**
  - **A — Antrian dashboard.** `DashboardController` petugas kirim prop baru `pendingResolutions`: `Report::where('status','resolved')->whereDoesntHave('resolutions', status=final)->withCount('resolutions')`, ter-scope wilayah sama dgn `activeMissions`, urut `updated_at desc`, limit 20. `Petugas/Dashboard.jsx` tampilkan seksi **"Menunggu Berita Acara"** (hanya bila ada) dengan pill progres `has_draft` ("Draft tersimpan"/"Belum dibuat") + CTA satu-ketuk ke `reports.resolution.create`.
  - **B — Hand-off saat resolve.** `Show.jsx executeResolve` onSuccess kini toast beraksi **"Isi Sekarang"** → `router.visit(reports.resolution.create)`, hanya bila `canManageResolution` (staf berwenang).
- **Verifikasi:** `npm run build` lulus (client+SSR). `php artisan test` **146 passed** (465 assertions; +5 test baru `PetugasDashboardPendingResolutionTest`: muncul saat belum final, flag `has_draft` untuk entri sementara, tersembunyi saat sudah final, ter-scope yurisdiksi, laporan aktif tidak masuk queue). Verifikasi visual browser pending.
- **Sumber:** permintaan user 2026-07-15.
- **Status:** SELESAI (FIXED; verifikasi visual browser pending).

### #41 — Pejabat daerah 403 saat membuka detail laporan di wilayahnya
- **Severity:** P2 (akses terputus — role pemantau resmi tak bisa menjalankan fungsinya)
- **Konteks:** permintaan user 2026-07-16. User menetapkan pejabat untuk **Kota Denpasar** (mis. `city_code 5171`). Dashboard pejabat (`Admin/Dashboard`) benar menampilkan daftar laporan Denpasar, tapi **klik salah satu → 403**. Ekspektasi: pejabat = akses **setara admin di yurisdiksinya, VIEW-ONLY**.
- **Root cause:** `DashboardController` JALUR 1 sudah menyertakan role `pejabat` (dengan isolasi yurisdiksi + flag `isPejabat`), TAPI `ReportController::show` — satu-satunya gerbang halaman detail — hanya mengakui `['admin','superadmin','petugas']` sbg `$isStaff`. Role `pejabat` tak ada di daftar mana pun (bukan reporter/staff/helper/relawan) → `abort(403)`. Konsistensi role bocor: pola pejabat diterapkan di dashboard tapi tidak di halaman detail.
- **Fix (minimal, meniru pola dashboard read-only):**
  - `ReportController::show`: tambah `$isPejabat = hasRole('pejabat') && withinReportJurisdiction($report)`; masukkan ke gerbang akses; muat berita acara bila `$isStaff || $isPejabat`; prop baru `canViewResolution` (view) terpisah dari `canManageResolution` (kelola, tetap `$isStaff`). Flag aksi/dispatch tetap staf-saja → view-only otomatis.
  - `Front/Reports/Show.jsx`: panel Berita Acara kini tampil untuk `canViewResolution`; tombol **Buat**, teks panduan, dan tombol **Hapus** disembunyikan bila `!canManageResolution`. Tombol aksi memang sudah di-gate `isStaffOrAdmin` (pejabat tak termasuk).
  - `ReportResolutionController::ktp`: gerbang BACA baru `authorizeView` (staf ATAU pejabat, keduanya ter-yurisdiksi) agar link KTP dari tampilan pejabat tak 403; `create/store/destroy` tetap `authorizeStaff`.
- **Verifikasi:** `php artisan test` (subset Report) **62 passed** (+2 test baru di `ReportShowJurisdictionTest`: pejabat sewilayah boleh lihat & `canManageResolution=false`, pejabat luar wilayah 403). `npm run build` lulus (client+SSR). Verifikasi visual browser pending.
- **Sumber:** permintaan user 2026-07-16.
- **Status:** SELESAI (FIXED; verifikasi visual browser pending).

### #42 — `arrive` menolak responder yang sudah meluncur (403) saat kode wilayahnya beda dari kelurahan insiden
- **Severity:** P2 (alur misi terputus — responder yang sudah commit tak bisa menandai Tiba)
- **Konteks:** permintaan user 2026-07-17. Dari data seeder, relawan yang bukan dari kelurahan insiden muncul berstatus "menuju lokasi" (`en_route`) pada insiden `handling`; saat klik **Tiba** → 403 "di luar wilayah penugasan".
- **Root cause (dua lapis):**
  1. **`arrive` adalah satu-satunya aksi in-mission yang masih cek yurisdiksi.** `takeAction` (gabung) benar memakai `ensureWithinJurisdiction`, TAPI `cancelResponse`/`updateLocation`/`correctLocation` semuanya berbasis KEANGGOTAAN (cek baris responder milik user). `arrive` malah ikut `ensureWithinJurisdiction` → ganjil sendiri. `withinReportJurisdiction` mencocokkan level PALING SPESIFIK user: relawan (punya `village_code`) dicek per-**kelurahan**, petugas (tanpa village) per-**kecamatan**. Bonus bug: `arrive` tak memverifikasi user memang responder → UPDATE 0-baris diam-diam tapi balas "sukses".
  2. **Data seeder tak setia pada aturan app.** `ReportSeeder` memilih responder per-**kota** (5171) + fallback `: $relawanAll` (bisa tarik kota lain). Anchor insiden tersebar di 18 kelurahan / 4 kecamatan, sedangkan relawan seed hanya di 3 kelurahan & petugas hanya di kec. 517101 → mayoritas gagal `withinReportJurisdiction`. State ini mustahil lewat alur normal (takeAction memblokirnya di titik gabung).
- **Best practice:** yurisdiksi menjaga saat **GABUNG** (takeAction); **keanggotaan** menjaga sisa siklus hidup misi. Sekali sah jadi responder, aksi lanjutan mengikuti keanggotaan, bukan lokasi terkini — konsisten dgn "pelapor selalu bisa lihat laporannya" & jawaban #41.
- **Fix (A+B, keputusan user):**
  - **A — `ReportActionController::arrive`:** ganti `ensureWithinJurisdiction` dgn gerbang keanggotaan (harus punya baris responder `en_route` di insiden ini), meniru `correctLocation`. Cek status `resolved/ditolak` tetap didahulukan. `ensureWithinJurisdiction` masih dipakai `takeAction`/`dispatchUnit`/`releaseUnit`.
  - **B — `ReportSeeder`:** buang fallback lintas-kota (`: $relawanAll`/`$petugasAll`) — pool WAJIB Kota Denpasar, kosong → error. Assign per-laporan **utamakan** responder yang lolos `withinReportJurisdiction($report)`, fallback ke pool Denpasar untuk jaminan coverage (aman karena arrive kini berbasis keanggotaan). Catatan: relawan TIDAK bisa dibuat city-level (null village) karena `EnsureProfileComplete` tak mengecualikan relawan → jebakan loop "lengkapi profil".
- **Verifikasi:** full `php artisan test` **149 passed** (480 assertions; +1 test `ReportResponderJurisdictionTest`: "committed responder mark arrival even if region no longer matches"). 16 test aksi/yurisdiksi/cancel/notif tetap hijau. Lint bersih. Verifikasi visual browser + reseed manual pending.
- **Sumber:** permintaan user 2026-07-17.
- **Status:** SELESAI (FIXED; verifikasi visual browser + reseed pending).

### #43 — "Lihat Semua Laporan" pemantau (pejabat/relawan) pakai tampilan sederhana, bukan ala admin/reports
- **Severity:** P3 (konsistensi UX — pemantau tak dapat peta sebaran + triase seperti admin)
- **Konteks:** permintaan user 2026-07-17. Dari dashboard, "Lihat Semua Laporan" pejabat (dan nav relawan) mengarah ke `front.reports.index` yang merender `Front/Reports/Index` (daftar polos), padahal admin dapat `Admin/Reports/Index` (peta + triase). `admin.reports.index` di-gate `role:admin|superadmin` → pejabat/relawan tak bisa pakai rute itu. Permintaan: samakan tampilan dgn admin/reports, disesuaikan role; utk pejabat/relawan teks aksi BUKAN "Tinjau & Verifikasi".
- **Fix (DRY — pakai ulang komponen admin, parameter role):**
  - `ReportController::index`: untuk `pejabat`/`relawan` (kecuali `filter=mine` → tetap "Riwayat Saya" milik sendiri) render `Admin/Reports/Index` via `monitoringIndex()` — ter-scope Tenantable, sembunyikan TERLAPOR+ditolak, `status` aktif=pending+handling, kirim `canVerify=false`, `canExport=false`, `indexRouteName='front.reports.index'`. Warga/petugas tetap `Front/Reports/Index`.
  - `Admin/Reports/Index.jsx`: parameter `canVerify`/`canExport`/`indexRouteName` (default = perilaku admin lama). Efek saat pemantau: UseFilter & paginasi lewat `front.reports.index`; kebab Export & banner "menunggu verifikasi" disembunyikan; pill & legenda TERLAPOR dibuang; CTA urgent "Tinjau & Verifikasi" hanya bila `canVerify` — pemantau dapat tombol "Detail".
- **Verifikasi:** `npm run build` lulus. `php artisan test` **153 passed** (full 149 + 4 test baru `ReportIndexRoleViewTest`: pejabat/relawan→Admin/Reports/Index canVerify=false, warga→Front/Reports/Index, relawan filter=mine→Front/Reports/Index). Verifikasi visual browser pending.
- **Sumber:** permintaan user 2026-07-17.
- **Status:** SELESAI (FIXED; verifikasi visual browser pending; belum di-commit/deploy).

### #44 — User login tanpa kode wilayah (akun Google belum lengkapi profil) dapat AKSES NASIONAL
- **Severity:** P1 (kebocoran data / IDOR — user biasa melihat seluruh laporan nasional termasuk PII)
- **Konteks:** permintaan user 2026-07-25. `Tenantable` (`app/Traits/Tenantable.php`) hanya menambah filter `WHERE *_code=...` bila user punya salah satu kode wilayah. Akun daftar/login via Google dibuat `masyarakat` TANPA kode wilayah & telepon (`SocialiteController::findOrCreateUser`). User null-region non-superadmin lolos SEMUA cek → query Tenantable (Report/Hydrant/Pompa/PosPemadam/Unit) tak terfilter = melihat data NASIONAL. `EnsureProfileComplete` memang mengarahkan mereka ke complete-profile utk rute web non-exempt, tapi data-layer sendiri tidak aman (langgar prinsip aturan emas #7).
- **Fix:** di `Tenantable`, setelah semua cek kode wilayah, tambahkan `$builder->whereRaw('1 = 0')` untuk user login yang tak punya kode wilayah apa pun & bukan superadmin → hasil KOSONG (bukan nasional). Superadmin tetap bypass (langkah 1). Guest (auth tak login) tak masuk blok → halaman publik fasilitas tetap tampil semua.
- **Fix lanjutan (sama pola, `User::scopeIsAdmin`):** daftar `/admin/users` (dan daftar relawan) pakai `User` (BUKAN Tenantable) via `scopeIsAdmin` — punya lubang identik (null-region admin → semua user nasional). Ditambah `else { $query->whereRaw('1 = 0'); }` di akhir rantai `elseif` wilayah.
- **Verifikasi:** `TenantableNullRegionTest` (5 pass: Tenantable null-region→0/region→scoped/superadmin→nasional; scopeIsAdmin null-region admin→0/region admin→scoped). Full suite hijau, Pint bersih. Diperlukan: user Google isi complete-profile utk mendapat akses ter-scope.
- **Fix label (menyesatkan):** null-region non-superadmin dulu ditampilkan "Nasional" di 3 tempat — kini "Belum diisi" (hanya superadmin yang tetap "Nasional"): `UserResource.region` (daftar /admin/users), `ProfileController::resolveJurisdiction` (kartu Yurisdiksi Akun), `Admin/Dashboard.jsx` getAdminLevelName (pakai `auth.user.role`). Laporan user: akun baru (fymen@mailinator.com) tampil "Nasional" padahal belum isi wilayah.
- **Fix sibling ketiga (`User::withinReportJurisdiction`):** juga ditutup atas persetujuan user 2026-07-25. `$column === null` (non-superadmin tanpa kode wilayah) kini `return false` (bukan `true`/nasional) — staf belum lengkap tak lagi bisa lihat/beraksi laporan lintas wilayah. Dipakai di `ReportController::show`/`ReportActionController`/`channels.php`. Full suite tetap hijau (169 pass) — semua test staf sudah pakai kode wilayah yang benar. Test tambahan: null-region staf→false, staf sewilayah/superadmin→true.
- **Total 3 titik null-region ditutup:** `Tenantable` (query data), `User::scopeIsAdmin` (daftar user/relawan), `User::withinReportJurisdiction` (akses laporan). + label "Nasional"→"Belum diisi" di 3 UI. Verifikasi akhir: **169 passed**, build & Pint bersih.
- **Sumber:** permintaan user 2026-07-25.
- **Status:** SELESAI (FIXED; belum di-commit/deploy).

### #45 — Staf kabupaten lain bisa membuka panel admin di subdomain milik tenant lain
- **Severity:** P2 (bukan kebocoran data — tampilannya yang menyesatkan & tak bisa diterima pelanggan "beli")
- **Konteks:** ditemukan saat analisis perubahan model bisnis 2026-07-28 (Badung BELI, bukan sewa). TASK_17 memasang dua sumber kebenaran wilayah yang tak pernah dipertemukan: `ResolveTenant` (`app/Http/Middleware/ResolveTenant.php:22`) menaruh tenant hasil **host/subdomain** ke container — dipakai HANYA untuk branding; `Tenantable` (`app/Traits/Tenantable.php:11-53`) men-scope data dari **region user** — buta terhadap host. Tidak ada satu pun tempat yang membandingkan keduanya.
- **Reproduce:** login admin Denpasar (`city_code=5171`) → buka `badung.sisupit.com/admin/reports` → halaman terbuka normal, kop/branding menampilkan **Damkar Badung** (shared prop `tenant`) sementara isi tabel adalah **laporan Denpasar** (scope `Tenantable`).
- **Dampak:** BUKAN IDOR — `Tenantable` tetap benar, nol baris Badung terlihat. Tetapi tampilannya persis seperti kebocoran, dan bagi kabupaten yang MEMBELI sistem ini, "admin dinas lain bisa membuka panel admin kami" tidak dapat diterima sekalipun secara teknis aman.
- **Rencana fix:** middleware `EnsureTenantHostMatchesStaff` di grup `routes/admin.php` (BUKAN grup `web` global — jaga jalur lapor warga tetap tak tersentuh). Bypass superadmin/guest/user tanpa `city_code`. **KRITIS:** pakai `Tenant::resolveFromHost($request->getHost())`, JANGAN `currentTenant()` — `currentTenant()` jatuh ke default Denpasar di apex, sehingga memakainya akan memantulkan seluruh staf non-Denpasar begitu mereka membuka `sisupit.com`. Host tak me-resolve ke tenant nyata → no-op.
- **Sumber:** analisis atas permintaan user 2026-07-28.
- **Status:** OPEN — dikerjakan sebagai slice 1 `TASK_18` (`prompt/tasks/TASK_18_edition_sewa_beli.md`).

### #46 — Lonceng notifikasi tidak pernah update sendiri (tanpa Echo & tanpa polling)
- **Severity:** P2 (fungsional/UX — bukan keamanan; menghambat klaim "real-time" ke pelanggan)
- **Konteks:** ditemukan 2026-07-31 saat menyiapkan video panduan alur. `EmergencyAlertNotification::via()` (`app/Notifications/EmergencyAlertNotification.php:33`) sudah mengirim ke `['fcm', 'database', 'broadcast']`, jadi payload lonceng MEMANG disiarkan. Tetapi di sisi klien tidak ada yang mendengarkan: `AppLayout.jsx:19-20` membaca `notifications` + `unread_notifications_count` murni dari shared props Inertia, dan `useEffect` di bawahnya (`AppLayout.jsx:22-79`) hanya mengurus token FCM WebView — tak ada `window.Echo.private(...).notification(...)` maupun `setInterval` polling. Satu-satunya pemakaian Echo di seluruh `resources/js` adalah `Front/Reports/Show.jsx:618` (channel `report-tracking.{id}`).
- **Dampak:** petugas/relawan yang membuka aplikasi di desktop TIDAK melihat badge lonceng bertambah sampai mereka berpindah halaman atau me-refresh. Kanal `broadcast` pada notifikasi jadi terkirim tanpa konsumen. Di ponsel dampaknya tertutup oleh push FCM, sehingga isu ini mudah luput.
- **Rencana fix (belum dikerjakan):** di `AppLayout`, berlangganan `window.Echo.private('App.Models.User.'+auth.id).notification(cb)` lalu `router.reload({ only: ['notifications','unread_notifications_count'] })` — pola yang sama dengan `Show.jsx`. Perlu memastikan `BroadcastServiceProvider`/`channels.php` mengizinkan channel notifikasi milik user sendiri.
- **Sumber:** temuan sampingan saat produksi video panduan 2026-07-31 (di luar scope, tidak dikerjakan).
- **Status:** OPEN

### #47 — Reverb dan kontainer Nominatim sama-sama memakai port 8080 → BroadcastException saat Docker menyala
- **Severity:** P2 (dev/ops — memunculkan layar "Internal Server Error" ke pengguna pada aksi normal)
- **Konteks:** ditemukan 2026-07-31. `.env` lokal memakai `REVERB_PORT=8080` sementara `docker/nominatim/` memetakan `0.0.0.0:8080->8080` (`NOMINATIM_BASE_URL=http://127.0.0.1:8080`). Selama Docker mati keduanya tak pernah bertemu, tetapi begitu kontainer `sisupit-nominatim` menyala, panggilan HTTP Laravel ke broker Reverb mendarat di Apache milik Nominatim.
- **Reproduce:** nyalakan `docker start sisupit-nominatim` + `php artisan reverb:start --port=8080`, lalu jalankan aksi yang menyiarkan event (`ReportActionController::resolve` → `ReportStatusChanged` yang `ShouldBroadcastNow`). Hasil: `Illuminate\Broadcasting\BroadcastException: Pusher error: ... 404 Not Found ... Apache/2.4.52 (Ubuntu) Server at localhost Port 8080` dan halaman error Inertia menutupi UI. Status laporan tetap berubah (transaksi DB sudah commit sebelum broadcast), jadi gejalanya "aksi berhasil tapi layar error".
- **Rencana fix (belum dikerjakan):** pisahkan port secara permanen — mis. `REVERB_PORT=8090` di `.env`/`.env.example` (VPS memakai 8080/8081/8082 untuk Reverb, jadi cukup lokal), atau pindahkan pemetaan port Nominatim. Perlu juga dipertimbangkan agar kegagalan broadcast tidak menjatuhkan seluruh request (`ShouldBroadcastNow` sinkron di dalam siklus request).
- **Catatan:** selama pembuatan video, `.env` lokal sempat diarahkan ke 8090 lalu **dikembalikan ke 8080** (kondisi semula).
- **Sumber:** temuan sampingan saat produksi video panduan 2026-07-31 (di luar scope, tidak dikerjakan).
- **Status:** OPEN

### #48 — Menu "Pusat Bantuan" di sidebar mengarah ke `/` (halaman bantuan tidak pernah ada)
- **Severity:** P3 (UX/kepercayaan — menu yang menjanjikan bantuan justru melempar ke landing)
- **Konteks:** ditemukan 2026-08-04 saat mengerjakan TASK_19. `resources/js/Layouts/Partials/Sidebar.jsx:64` memasang `<NavLink url={'/'} title="Pusat Bantuan" icon={IconMapPin} />` — tautan ke landing, bukan halaman bantuan; ikonnya pun peta, bukan bantuan. Tidak ada route/halaman bantuan di seluruh repo.
- **Dampak:** pengguna yang mencari pertolongan (termasuk petugas baru) diputar balik ke landing tanpa jawaban. Aplikasi juga sama sekali tidak punya Syarat & Ketentuan / Kebijakan Privasi padahal memproses PII berat (GPS presisi, foto, KTP korban) dan sudah didistribusikan sebagai APK.
- **Fix (TASK_19):** dibuat `InfoController` + 5 halaman publik (`/pusat-bantuan`, `/syarat-ketentuan`, `/kebijakan-privasi`, `/tentang`, `/paket-lisensi`); tautan sidebar diarahkan ke `info.help` dan dipindah ke seksi baru "Bantuan & Legal"; footer `PublicLayout` mendapat kolom "Informasi".
- **Sumber:** permintaan user 2026-08-04.
- **Status:** SELESAI (FIXED; belum di-commit/deploy).

### #49 — Belum ada halaman/alur penghapusan akun (syarat Google Play untuk APK)
- **Severity:** P2 (kepatuhan distribusi — bukan keamanan)
- **Konteks:** ditemukan 2026-08-04 saat TASK_19. APK sudah dibagikan (`public/apk/sisupit.apk`, tombol unduh di halaman Login). Google Play mensyaratkan tautan publik berisi cara meminta penghapusan akun beserta data apa yang dihapus dan apa yang tetap disimpan. Saat ini Syarat & Ketentuan baru menyebut "hubungi kontak instansi" — belum ada halaman khusus maupun alur mandiri di aplikasi.
- **Catatan teknis:** `ProfileController::destroy` sudah ada (Breeze), tetapi belum diputuskan perilakunya terhadap laporan & berita acara yang menjadi arsip resmi instansi — itulah keputusan yang harus dibuat sebelum halaman ini dibuat.
- **Rencana fix (belum dikerjakan):** halaman `/hapus-akun` yang menjelaskan cakupan penghapusan + tombol permintaan; sinkronkan dengan kebijakan retensi di Kebijakan Privasi.
- **Sumber:** TASK_19 — opsi ini TIDAK dipilih user saat penentuan cakupan 2026-08-04.
- **Status:** OPEN

### #50 — Video panduan (`docs/video/*.mp4`) tidak tersaji ke pengguna
- **Severity:** P3 (pemanfaatan aset yang sudah dibuat)
- **Konteks:** ditemukan 2026-08-04 saat TASK_19. Video alur lengkap (desktop & mobile) sudah diproduksi 2026-07-31 dan disimpan di `docs/video/`, yang **tidak** disajikan web server (`public/` yang disajikan). Akibatnya Pusat Bantuan baru hanya bisa memakai panduan teks.
- **Pertimbangan:** menyalin mp4 ke `public/` menambah berkas besar ke git (repo ini juga sudah men-track `public/build`). Alternatif: hosting video di luar repo lalu tautkan dari Pusat Bantuan.
- **Sumber:** TASK_19 (di luar scope, tidak dikerjakan).
- **Status:** OPEN

### #51 — Identitas penyedia di dokumen legal (PT Tawarin Dimana Aja) bertentangan dengan draf PKS (MAESA perorangan)
- **Severity:** P1 (cacat hukum — dua dokumen yang saling merujuk menyebut PIHAK PERTAMA yang berbeda)
- **Konteks:** ditemukan 2026-08-07 saat menggabungkan dua draf legal dari `docs/*.docx` ke halaman Syarat & Ketentuan. Kedua draf menyebut aplikasi dimiliki dan dioperasikan **PT Tawarin Dimana Aja**, sedangkan `Kontrak_Sisupit_Damkar_Denpasar_v2.docx` menuliskan komparisi **"MAESA, warga negara Indonesia, pemegang NIK [___] ... bertindak untuk dan atas nama diri sendiri"** sebagai PIHAK PERTAMA. Draf PKS itu bahkan sudah memuat catatan penyusun bahwa komparisi wajib disesuaikan bila usaha berbadan hukum.
- **Dampak:** halaman `/syarat-ketentuan` menyatakan ketentuannya satu kesatuan dengan PKS, tetapi pihak yang disebut di kedua dokumen berbeda badan hukumnya. Klausul yang bersandar pada identitas penyedia ikut menggantung: yurisdiksi Pengadilan Negeri (kantor pusat PT), tanggung jawab direksi/komisaris, dan kepemilikan hak cipta aplikasi (perorangan vs badan hukum).
- **Keputusan user 2026-08-07:** halaman aplikasi memakai **PT Tawarin Dimana Aja**; berkas PKS **tidak** ikut diubah pada sesi ini.
- **Rencana fix (belum dikerjakan):** perbarui komparisi + seluruh penyebutan PIHAK PERTAMA di `Kontrak_Sisupit_Damkar_Denpasar.docx` dan `_v2.docx` menjadi badan hukum PT (nama penanda tangan, jabatan, akta pendirian, NPWP/NIB), lalu selaraskan klausul HKI dan yurisdiksi. Wajib ditinjau bagian hukum sebelum dipakai tanda tangan.
- **Sumber:** permintaan user 2026-08-07 (penggabungan draf ToS).
- **Status:** OPEN

### #52 — Alamat kantor pusat penyedia masih kosong padahal menentukan yurisdiksi sengketa
- **Severity:** P2 (kelengkapan dokumen legal)
- **Konteks:** ditemukan 2026-08-07. Klausul penyelesaian sengketa pada kedua tab Syarat & Ketentuan menunjuk "Pengadilan Negeri yang wilayah hukumnya mencakup kantor pusat PT Tawarin Dimana Aja", tetapi alamatnya belum diketahui. Kedua draf `docs/*.docx` juga masih memuat placeholder `[Masukkan Alamat Kantor Resmi]`.
- **Penanganan sementara:** `config/legal.php` mendapat kunci `penyedia.alamat` dan `penyedia.telepon` (default `null`, dapat diisi lewat `LEGAL_PENYEDIA_ALAMAT` / `LEGAL_PENYEDIA_TELEPON` di `.env`). Bila kosong, baris alamat/telepon **tidak ditampilkan** di halaman — dokumen tidak menampilkan placeholder kepada publik, tetapi juga belum lengkap.
- **Rencana fix:** isi `LEGAL_PENYEDIA_ALAMAT` (dan telepon) di `.env` produksi sesuai akta pendirian PT, lalu verifikasi tampilannya di `/syarat-ketentuan` bagian "Hubungi kami" dan "Kontak legal".
- **Sumber:** permintaan user 2026-08-07.
- **Status:** OPEN

### #53 — Menu "Bantuan & Legal" tak terjangkau di mobile; menu admin menumpuk dalam popover
- **Severity:** P2 (kepatuhan distribusi + UX; bukan keamanan)
- **Konteks:** dilaporkan user 2026-08-07. Akar masalahnya duplikasi: `Sidebar.jsx` dan `MobileBottomNav.jsx` masing-masing memelihara daftar menu sendiri (komentar "Sinkronisasi dengan Sidebar" di `MobileBottomNav.jsx:32` menunjukkan ini sudah disadari). TASK_19 hanya menambah seksi "Bantuan & Legal" di `Sidebar.jsx`, sementara sidebar itu di-mount `hidden lg:block` (`AppLayout.jsx:107`) — hanya tampil ≥1024px.
- **Dampak:**
  1. Di bawah 1024px tak ada satu pun tautan Pusat Bantuan/S&K/Privasi/Tentang. Untuk NON-admin bahkan tak ada tombol menu sama sekali (`MobileBottomNav.jsx:386-392` langsung menjadi ikon Profil), sehingga warga/petugas/relawan di ponsel tak punya jalan ke halaman legal selain mengetik URL. APK sudah dibagikan dan Google mensyaratkan Kebijakan Privasi terjangkau dari dalam aplikasi.
  2. Popover admin memuat sampai 13 item dalam panel `w-52` (208px) ber-`max-h-[70vh]` yang harus di-scroll — wadah yang salah untuk sebanyak itu (Material 3: bottom nav 3–5 destinasi, overflow ke panel penuh).
  3. Tablet 768–1023px masuk zona mati: sidebar belum muncul, sedangkan bottom-nav dibatasi `max-w-md` (448px) di tengah layar selebar 1024px.
- **Fix (2026-08-07):** `Sidebar` dijadikan SATU sumber kebenaran untuk semua ukuran layar — dipakai sebagai sidebar desktop, rail tablet (prop `compact`; label & judul seksi disembunyikan lewat arbitrary variant Tailwind, bukan cabang render terpisah), dan isi Sheet "Menu" pada bottom-nav. Slot ke-5 bottom-nav kini tombol "Menu" untuk SEMUA peran; popover admin 13 item dihapus. Breakpoint sidebar turun ke `md` (rail 80px) dan penuh di `lg`. Footer `AppLayout` mendapat baris tautan legal sebagai jaring pengaman lintas-ukuran, dan nama penyedia di footer ditarik dari `config/legal.php` lewat shared prop `penyedia_nama` — sebelumnya hardcoded "PT. Tawarin Dimana Saja", ejaan yang berbeda dari dokumen legal.
- **Verifikasi:** `php artisan test` 182 passed (726 assertions), `npm run build` lulus (client + SSR), Pint & Prettier bersih. Markup diperiksa lewat render SSR sungguhan (login superadmin → `/dashboard`): kelas `md:block`/`lg:w-64` pada sidebar, `md:hidden` pada bar bawah, tombol `aria-label="Buka menu"`, seksi "Bantuan & Legal", dan keempat tautan legal di footer — semuanya ter-render, dan kelas responsifnya terbukti ada di CSS terkompilasi. **Sisa yang belum diverifikasi = perilaku interaktif & rupa visual** (Sheet membuka/menutup, keterbacaan rail) — daftar periksa manual di `prompt/tasks/TASK_20_navigasi_mobile_tablet.md`.
- **Sumber:** laporan user 2026-08-07.
- **Status:** SELESAI (FIXED) lagi 2026-08-19 lewat TASK_31 — slot ke-5 bottom-nav kembali jadi "Menu" untuk SEMUA peran (tautan legal & Keluar terjangkau di ponsel), kali ini tanpa mencabut bentuk popover yang diminta user. Sempat REOPEN 2026-08-13 (lihat catatan pembalikan di #54).

### #54 — Panel menu mobile "terlalu primitif": sidebar desktop dituang apa adanya ke Sheet
- **Severity:** P2 (UX; bukan keamanan)
- **Konteks:** dilaporkan user 2026-08-08, lanjutan langsung dari #53. Perbaikan #53 benar secara arsitektur (satu daftar menu) tetapi menyamakan SUMBER dengan PENYAJIAN: slot "Menu" membuka `<SheetContent side="right">` yang isinya komponen `<Sidebar/>` desktop apa adanya (`MobileBottomNav.jsx:232-243` pra-perubahan).
- **Dampak:**
  1. **Arah panel melawan pemicunya.** Tombolnya di pojok kanan-bawah, panelnya meluncur dari kanan — idiom drawer hamburger yang tempatnya di kiri-atas. Isi panel mendarat di paruh atas layar, jauh dari jempol; padahal justru bottom sheet yang duduk di zona jempol (Material, NN/g).
  2. **Daftar datar tanpa hierarki.** Superadmin menerima 26 baris identik dengan 6 heading dalam satu kolom yang harus di-scroll. Kelompok yang jarang disentuh (Kontrol Akses, Sistem) berbobot visual sama dengan "Lapor Darurat!".
  3. **Tidak ada identitas pengguna di mana pun pada mobile.** Blok profil di header `AppLayout.jsx:213-273` dikomentari, jadi nama/peran/instansi tak pernah tampil di ponsel — padahal panel inilah rumahnya di hampir semua aplikasi modern.
  4. **Mekanika minimum.** Tanpa titik henti (detent), tanpa tombol tutup eksplisit (NN/g: grab handle saja ambigu dan tak terbaca pembaca layar), tanpa pencarian meski >20 tujuan, tanpa `env(safe-area-inset-bottom)` sehingga bar bawah tertimpa gesture bar di ponsel APK, dan tombol Back perangkat menutup HALAMAN alih-alih panel.
  5. Popover "Fasilitas" di slot ke-2 memakai wadah & mekanisme klik-luar buatan tangan sendiri — dua idiom panel berbeda dalam satu bar.
- **Fix (2026-08-08):** daftar menu dipindah ke `resources/js/Layouts/Partials/navItems.js` sebagai satu-satunya sumber data (`buildNavSections`, `buildQuickActions`, `resolveAbilities`), lalu tiap permukaan merendernya dengan idiom yang pantas. Panel mobile jadi `MobileMenuPanel.jsx`: drawer vaul dari bawah, titik henti `[0.62, 1]`, kepala identitas (avatar/nama/peran/instansi) + tombol ✕, petak aksi cepat 2 kolom, seksi Administrasi/Kontrol Akses/Sistem terlipat (default tertutup, otomatis terbuka kalau halaman aktif ada di dalamnya), pencarian saat tujuan >12, legal turun jadi teks kecil di kaki panel. Popover Fasilitas ikut memakai drawer yang sama. `hooks/use-sheet-history.js` membuat Back perangkat menutup panel. `viewport-fit=cover` + `env(safe-area-inset-bottom)` di bar bawah, kaki drawer, dan padding konten `AppLayout`.
- **Verifikasi:** `php artisan test` 182 passed (726 assertions, sama dengan baseline), `npm run build` lulus (client + SSR), Prettier bersih. Markup diperiksa lewat render SSR sungguhan (login superadmin → `/dashboard`): `aria-label="Buka menu"` & `"Buka daftar fasilitas publik"`, slot Beranda/Riwayat, `env(safe-area-inset-bottom)`, `viewport-fit=cover`, serta ke-7 judul seksi + 26 NavLink sidebar desktop semuanya ter-render tanpa error SSR. **Sisa yang belum diverifikasi = perilaku interaktif & rupa visual** (seretan antar titik henti, Back di APK, keterbacaan gelap/terang) — daftar periksa manual di `prompt/tasks/TASK_21_panel_menu_mobile.md`.
- **Sumber:** laporan user 2026-08-08.
- **Status:** DIBALIKKAN atas permintaan user (2026-08-13). Bagian **sumber data**-nya dipulihkan 2026-08-19 (TASK_31/#71): bottom-nav membaca `navItems.js` lagi. Bagian **penyajian**-nya (drawer vaul, titik henti, kepala identitas, pencarian) tetap dibalikkan sesuai keputusan user — popover melayang yang bertahan.

#### Catatan pembalikan #53/#54 (2026-08-13)
- **Permintaan:** "untuk menu di mobile bottomnav kembalikan ke sebelumnya". Ditanyakan
  eksplisit versi mana yang dimaksud dengan dua pilihan berpratinjau; user memilih
  **popover lama pra-TASK_20** (commit `ea96039`) **dan** meminta panel Fasilitas ikut
  dikembalikan. Peringatan bahwa versi itu tidak memuat Pusat Bantuan/S&K/Privasi
  tertulis di pilihan yang ia ambil.
- **Perubahan:** `resources/js/Layouts/Partials/MobileBottomNav.jsx` dipulihkan ke isi
  `ea96039` — dua popover melayang + slot ke-5 bercabang (popover "Menu" untuk
  admin/superadmin, tautan Profil/Masuk untuk peran lain).
- **Dua hal dari TASK_20/21 sengaja DIPERTAHANKAN** karena bukan bagian panel menu dan
  mencabutnya merusak tata letak lain: breakpoint `md:hidden` (versi lama `lg:hidden`,
  padahal `AppLayout.jsx:116` memasang rail ikon mulai `md` dan konten ber-`md:pb-0` →
  di tablet akan muncul dua navigasi sekaligus + konten tertimpa), dan padding
  `env(safe-area-inset-bottom)` pada bilah.
- **Konsekuensi yang diterima:** dampak #53 poin 1 & 2 dan #54 poin 1–5 kembali berlaku
  di bawah md. Jalur legal yang tersisa untuk pengguna ponsel = tautan di footer
  `AppLayout` (ditambahkan pada perbaikan #53, tidak ikut dibalikkan). Duplikasi daftar
  menu hidup lagi: menu baru harus ditulis di `navItems.js` **dan** `MobileBottomNav.jsx`.
- **Kode yatim:** `resources/js/Layouts/Partials/MobileMenuPanel.jsx` dan
  `resources/js/hooks/use-sheet-history.js` tidak lagi diimpor siapa pun. **DIHAPUS
  2026-08-13 atas permintaan user** (pulihkan dari commit `2a1e2b6` bila pembalikan ini
  dibatalkan). `navItems.js` tetap hidup karena dipakai `Sidebar.jsx`.
- **Sisa yang sengaja dibiarkan (di luar scope, belum dikerjakan):** setelah penghapusan
  itu, tiga ekspor `navItems.js` tak lagi punya pemakai — `buildQuickActions`,
  `flattenNavItems`, `findNavItem`. Begitu pula komponen `Components/ui/drawer.jsx`
  beserta dependensi `vaul` (tidak diimpor komponen lain mana pun). Membersihkannya =
  keputusan tersendiri; jangan dihapus diam-diam saat mengerjakan task lain.
- **Verifikasi:** `php artisan test` 224 passed (883 assertions), `npm run build` lulus
  (client + SSR). Rupa visual & perilaku popover belum dicek mata manusia.

### #55 — `routes/channels.php` tidak pernah dimuat: `/broadcasting/auth` tidak ada, semua channel privat mati
- **Severity:** P1 (fitur inti real-time mati diam-diam — tanpa pesan error yang terlihat pengguna)
- **Konteks:** ditemukan 2026-08-10 saat menyiapkan aplikasi desktop (Electron) yang ikut mendengar siaran notifikasi. `bootstrap/app.php` memanggil `withRouting(web:, commands:, health:)` **tanpa** argumen `channels:`, dan tidak ada `App\Providers\BroadcastServiceProvider` (`app/Providers/` hanya berisi `AppServiceProvider.php`). Tidak ada pula panggilan `Broadcast::routes()` di mana pun (`grep -rn "Broadcast::" routes/ app/` hanya menemukan `routes/channels.php` itu sendiri). Akibatnya `routes/channels.php` adalah kode mati dan endpoint otorisasi tidak pernah terdaftar.
- **Reproduce:**
  1. `php artisan route:list --path=broadcasting` → "Your application doesn't have any routes matching the given criteria" (total route terdaftar: 120).
  2. Produksi: `curl -X POST https://sisupit.com/broadcasting/auth -d "socket_id=1.1&channel_name=private-App.Models.User.1"` → **HTTP 404**.
  3. Server Reverb sendiri SEHAT — handshake `wss://sisupit.com/app/<key>?protocol=7` membalas `pusher:connection_established` beserta `socket_id`. Jadi yang rusak murni lapisan otorisasi HTTP, bukan WebSocket-nya.
- **Dampak:** setiap `Echo.private(...)` gagal di tahap `pusher:subscription_error` dan hanya menulis ke console browser — tidak ada gejala yang terlihat pengguna, sehingga fitur tampak "ada" padahal tak pernah berjalan:
  1. **Pelacakan langsung di detail laporan mati** (`Front/Reports/Show.jsx:619` berlangganan `private-report-tracking.{id}`). Keempat event di `app/Events/` (`ReportStatusChanged`, `ResponderLocationUpdated`, `ResponderRosterChanged`, `IncidentLocationCorrected`) semuanya `PrivateChannel` — jadi peta responder bergerak, badge status reaktif (#28), dan roster (#33) tak pernah sampai ke klien. Server tetap menyiarkan; tak ada yang boleh mendengar.
  2. **Ini akar penyebab #46** yang selama ini dicatat sebagai "lonceng tak punya listener". Menambahkan listener `Echo.private('App.Models.User.'+id).notification(...)` saja TIDAK akan menyembuhkan #46 selama endpoint otorisasi belum ada — rencana fix #46 perlu dikerjakan setelah temuan ini.
  3. Kanal `broadcast` pada `EmergencyAlertNotification::via()` (`app/Notifications/EmergencyAlertNotification.php:34`) terkirim tanpa konsumen yang mungkin.
- **Fix (2026-08-11, TASK_22):** satu baris di `bootstrap/app.php` — `channels: __DIR__.'/../routes/channels.php'` pada `withRouting(...)`, yang memuat `routes/channels.php` sekaligus mendaftarkan `POST /broadcasting/auth` (middleware `web`). Satu perubahan menyusul di `routes/channels.php`: `Report::find()` → `Report::withoutGlobalScopes()->find()` pada channel `report-tracking`, karena global scope `Tenantable` memfilter laporan ke wilayah user yang login sehingga responder LINTAS DESA (relawan yang sudah mengambil tugas — lihat #42) tak pernah menemukan laporannya dan ditolak walau berhak. Otorisasi tidak dilonggarkan: ketiga cek di dalam callback (pelapor / staf + `withinReportJurisdiction()` / anggota `report_helpers`) adalah re-check manual yang wajib menyertai bypass itu (ATURAN EMAS #7). Terbukti oleh test: staf luar wilayah tetap 403.
- **Blast radius yang perlu diperiksa saat fix:** perubahan ini MENGAKTIFKAN otorisasi yang selama ini mati, jadi callback di `routes/channels.php` baru benar-benar dieksekusi untuk pertama kalinya di produksi. Callback `report-tracking.{reportId}` melakukan query `Report::find()` + `withinReportJurisdiction()` + query `report_helpers` pada SETIAP percobaan langganan — perlu dipastikan aman & tidak berat. Sesudah fix, verifikasi `/broadcasting/auth` membalas 200 untuk pihak yang berhak dan 403 untuk yang tidak (uji lintas-yurisdiksi sesuai #31).
- **Verifikasi:** `php artisan route:list --path=broadcasting` → route muncul. Test baru `tests/Feature/Sisupit/BroadcastingAuthTest.php` (6 test): endpoint terdaftar; 200 untuk pemilik channel notifikasi, 403 untuk user lain; 200 untuk pelapor & staf di wilayah laporan, 403 untuk staf luar wilayah (#31); 200 untuk relawan anggota `report_helpers` lintas desa. Suite penuh 190 passed (743 assertions), naik dari baseline 182. **Catatan test:** `.env.testing` memakai `BROADCAST_CONNECTION=log` yang `auth()`-nya kosong sehingga callback channel tak pernah dievaluasi — test sengaja memilih driver `reverb` (kredensial dummy, `socketAuth()` hanya HMAC lokal) lalu me-require ulang `routes/channels.php`, karena `Broadcast::channel()` menempel ke driver yang aktif saat pendaftaran.
- **SISA (belum diverifikasi):** jalur end-to-end di produksi setelah deploy — `curl -i -X POST https://sisupit.com/broadcasting/auth` harus membalas 419/302 (CSRF), bukan 404; lalu marker responder benar-benar bergerak di halaman Show. Belum ada browser automation di repo ini.
- **Sumber:** temuan sampingan saat membangun aplikasi desktop 2026-08-10.
- **Status:** SELESAI (FIXED) 2026-08-11 — TASK_22

### #56 — Kolom wilayah kosong punya DUA makna yang tak terbedakan; user berprofil separuh terisi tak pernah dapat notifikasi
- **Severity:** P1 (nyawa/operasional — responder yang seharusnya disiagakan tidak pernah menerima siaran, dan gagalnya senyap)
- **Dilaporkan user 2026-08-10:** "kalau belum melengkapi data maka tidak dapat notif" — dan diminta membedakan mana yang *belum melengkapi data* dan mana yang *memang admin kabupaten sehingga village_code-nya kosong*. User menandai bagian ini **pernah jadi masalah sebelumnya** dan minta ekstra hati-hati.
- **Akar masalah — satu representasi untuk dua makna:** tidak ada kolom "tingkat yurisdiksi" pada `users`. Kolom `province_code`/`city_code`/`district_code`/`village_code` yang `NULL` bisa berarti dua hal yang berlawanan:
  1. **Sengaja luas.** `Admin\UserController::trimRegionToLevel()` (`app/Http/Controllers/Admin/UserController.php:269-281`) MENG-NULL-KAN kolom di bawah tingkat yang diberikan — staf kabupaten sengaja punya `district_code = NULL` dan `village_code = NULL`, staf provinsi punya tiga kolom NULL. Ini benar dan disengaja; `EnsureProfileComplete` bahkan mengecualikan `superadmin/admin/petugas/pejabat` justru karena ini (komentarnya menyebut eksplisit, `app/Http/Middleware/EnsureProfileComplete.php:34-40`).
  2. **Belum diisi.** Warga/relawan yang belum menuntaskan onboarding.
  Satu-satunya pembeda yang ada saat ini cuma **peran** — tidak pernah ditulis sebagai aturan, hanya tersirat di daftar `EXEMPT_ROLES`. Setiap kode yang menebak makna NULL dari bentuk datanya saja pasti salah untuk salah satu kelompok.
- **Akibat langsung — zona mati di `User::scopeNotifiableForReport()` (`app/Models/User.php:189-220`).** Cabang cascade hanya ditambahkan bila `$ceiling->rank() <= $level->rank()`, dengan rank DESA=4, KECAMATAN=3, KABUPATEN=2, PROVINSI=1 (`app/Enums/TenantLevel.php`). Konsekuensi yang perlu dihitung, bukan dikira:
  1. **Relawan (ceiling default DESA, rank 4):** TIDAK ADA satu pun cabang cascade yang aktif (4≤3, 4≤2, 4≤1 semuanya salah). Relawan hanya tertangkap lewat tiga jalan: superadmin, keempat kolom NULL, atau `village_code` PERSIS sama dengan desa laporan. Maka **relawan yang sudah mengisi provinsi/kota tetapi belum mengisi desa TIDAK PERNAH menerima notifikasi apa pun** — profil separuh terisi justru lebih buruk daripada profil kosong sama sekali.
  2. **Staf tingkat PROVINSI:** pada ceiling default petugas (KABUPATEN, rank 2), cabang PROVINSI tak pernah ditambahkan (2≤1 salah). Staf yang hanya punya `province_code` tidak akan tertangkap cabang mana pun → tidak pernah dapat notifikasi.
  3. **Cermin dari masalah yang sama:** user dengan KEEMPAT kolom NULL masuk cabang jaring pengaman (`User.php:194-199`) → menerima **setiap laporan se-Indonesia**. Jadi bug yang sama menghasilkan dua gejala berlawanan: sebagian tak dapat apa-apa, sebagian dibanjiri.
  4. **Laporan tanpa `village_code`** (geocode gagal saat lapor) membuat cabang pencocokan desa tak pernah dipasang (`User.php:201-203`) → pada ceiling DESA, TIDAK ADA relawan yang disiarkan sama sekali.
- **Perangkap representasi (yang paling mungkin jadi "masalah kemarin"):** seluruh logika memakai `whereNull(...)`. Kolomnya `char(2/4/7/10) NULLABLE` (`database/migrations/2026_05_15_132259_add_hierarchical_tenant_columns_to_sisupit_tables.php:18-21`). Kode aplikasi (`trimRegionToLevel`) menulis **NULL** — sudah benar. TETAPI bila ada baris yang berisi **`'0'`, `''`, atau `'00'`** (hasil import, seeder lama, atau form yang mengirim string kosong), baris itu **tidak** akan cocok `whereNull` maupun cocok kode wilayah mana pun → user tersebut jatuh ke zona mati permanen tanpa jejak error. **Ini belum diverifikasi terhadap data produksi** (MySQL lokal mati saat pemeriksaan, dan tidak ada akses DB produksi pada sesi ini) — wajib dicek sebelum menyimpulkan.
- **Query verifikasi (jalankan di produksi lebih dulu):**
  ```sql
  -- 1. Adakah nilai selain NULL yang bermakna "kosong"?
  SELECT 'village' k, village_code v, COUNT(*) n FROM users WHERE village_code IN ('0','','00') GROUP BY village_code
  UNION ALL SELECT 'district', district_code, COUNT(*) FROM users WHERE district_code IN ('0','','00') GROUP BY district_code
  UNION ALL SELECT 'city', city_code, COUNT(*) FROM users WHERE city_code IN ('0','','00') GROUP BY city_code
  UNION ALL SELECT 'province', province_code, COUNT(*) FROM users WHERE province_code IN ('0','','00') GROUP BY province_code;

  -- 2. Siapa saja yang ada DI ZONA MATI: bukan semua-NULL, tapi village_code kosong.
  SELECT u.id, u.name, r.name AS peran, u.province_code, u.city_code, u.district_code, u.village_code
  FROM users u
  LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id
  LEFT JOIN roles r ON r.id = mhr.role_id
  WHERE u.village_code IS NULL
    AND NOT (u.province_code IS NULL AND u.city_code IS NULL AND u.district_code IS NULL);
  ```
  Baris hasil query 2 yang berperan `relawan` = korban zona mati (harus dapat notif, tak pernah dapat). Baris berperan `admin`/`petugas`/`pejabat` = **sah**, itu staf berjurisdiksi luas — JANGAN diperlakukan sebagai data rusak.
- **⚠️ Perangkap saat memperbaiki (JANGAN dilanggar):**
  - **Jangan** mewajibkan `village_code` terisi untuk menerima notifikasi — itu mematikan admin/petugas kabupaten & provinsi yang `village_code`-nya memang sengaja NULL.
  - **Jangan** memperlakukan "ada kolom NULL" sebagai "profil belum lengkap" lalu memaksa onboarding — `EnsureProfileComplete` sudah sengaja mengecualikan peran staf; menyamakan keduanya akan mengunci staf dalam loop "lengkapi profil sampai desa" (regresi yang sama persis dengan yang pernah diperbaiki untuk petugas, lihat [[project_sisupit_petugas_profile_loop_2026-06-28]]).
  - **Jangan** menghapus cabang jaring pengaman "keempat kolom NULL" tanpa mengganti sumber kebenarannya — akun staf nasional bergantung padanya.
- **Arah fix yang disarankan (belum dikerjakan, perlu keputusan):** berhenti menyimpulkan tingkat yurisdiksi dari pola NULL. Turunkan tingkat secara eksplisit dari **kolom terdalam yang terisi** (village→DESA, district→KECAMATAN, city→KABUPATEN, province→PROVINSI, tak ada→nasional/belum lengkap), simpan sebagai kolom `jurisdiction_level` pada `users` (diisi `trimRegionToLevel` + onboarding), lalu ubah `scopeNotifiableForReport` menjadi: cocokkan pada kolom sesuai tingkat user, dan `ceiling` hanya membatasi SEBERAPA LUAS siaran boleh menjangkau — bukan menggugurkan user yang tingkatnya lebih luas dari ceiling (penyebab kasus 2 di atas). Bedakan "belum lengkap" dari "luas" lewat kolom eksplisit itu + peran, bukan lewat `whereNull`. Sertakan normalisasi data satu kali (`'0'`/`''` → `NULL`) bila query verifikasi menemukannya.
- **Cakupan lain yang ikut terdampak:** `notifiableForReport` dipakai di `ReportController.php:307` (siaran awal ke pusat komando) dan `ReportActionController.php:57,59` (siaran lapangan setelah validasi) — perbaikan harus diuji pada ketiganya.
- **KOREKSI 2026-08-11 (saat mengerjakan fix) — dua dari empat "zona mati" di atas ternyata PERILAKU YANG DISENGAJA, bukan bug:**
  - *Kasus 2* (staf provinsi tak dapat notif pada ceiling KABUPATEN) di-assert eksplisit di `tests/Feature/Sisupit/ReportNotificationLevelTest.php:75`, dan admin bisa menaikkannya lewat Setting (test baris 94-105). Itu memang arti `KEY_NOTIFY_LEVEL_PETUGAS`.
  - *Kasus 1 bagian kedua* (relawan tingkat kecamatan/kabupaten tak dapat notif pada ceiling DESA) di-assert di baris 91. Itu memang arti `KEY_NOTIFY_LEVEL_RELAWAN`.
  - Karena itu **arah fix "ceiling jangan menggugurkan user yang lebih luas" yang saya tulis di bawah DIBATALKAN** — menerapkannya berarti membatalkan keputusan produk yang sudah dikunci test. Ceiling tetap berarti "sampai tingkat mana siaran boleh naik dari desa laporan".
  - *Kasus 4* (laporan tanpa `village_code`) tidak bisa terjadi lewat form: `ReportRequest:64-67` mewajibkan `village_code` saat create. Tersisa sebagai risiko data impor/seeder saja.
  - Yang benar-benar rusak tinggal **satu**, dan justru gejala kebalikannya: cabang jaring pengaman tidak memandang peran, sehingga **relawan berprofil kosong menerima siaran darurat SE-INDONESIA** (`is_standby` default `true`, dan `EnsureProfileComplete` tidak menghalangi karena push FCM tak lewat middleware HTTP).
- **Fix (2026-08-11, TASK_23):**
  - `app/Enums/TenantLevel.php` — `TenantLevel::forCodes()`: menurunkan tingkat yurisdiksi dari kolom TERDALAM yang terisi (`null` bila tak ada), satu sumber kebenaran + tempat mendokumentasikan dua makna "kosong". Memakai truthiness `(bool)` sehingga `'0'`/`''` ikut dianggap kosong, sama seperti `withinReportJurisdiction()` dan `regionRank()` yang sudah ada.
  - `app/Models/User.php` — konstanta `User::STAFF_ROLES` (aturan bernama, tak lagi tersirat) + `User::jurisdictionLevel()`; cabang jaring pengaman "keempat kolom NULL" di `scopeNotifiableForReport()` dibatasi ke `STAFF_ROLES`. Sejalan dengan #44 yang sudah ditegakkan di `withinReportJurisdiction()` dan `scopeIsAdmin()` — jalur notifikasi adalah satu-satunya yang tertinggal memakai aturan lama.
  - `app/Http/Middleware/EnsureProfileComplete.php` — `EXEMPT_ROLES` menunjuk `User::STAFF_ROLES` (isinya identik, hanya sumbernya disatukan agar tak bisa berbeda diam-diam).
  - `app/Http/Controllers/Admin/UserController.php` — `regionRank()` memakai `jurisdictionLevel()`, menghapus duplikat logika penurunan tingkat.
  - **Perubahan perilaku yang disengaja:** relawan/masyarakat berprofil kosong yang sebelumnya menerima SEMUA laporan nasional kini tidak menerima apa pun sampai profilnya lengkap. Staf berprofil kosong (petugas/admin nasional) tidak terpengaruh.
  - **Sengaja TIDAK dilakukan** (sesuai perangkap di atas): tidak mewajibkan `village_code` untuk menerima notifikasi; tidak memaksa staf lewat onboarding; cabang jaring pengaman dipersempit, bukan dihapus.
- **Verifikasi:** dua test baru di `ReportNotificationLevelTest.php` — (1) satu skenario yang memuat ketiga kelompok sekaligus: petugas nasional DAPAT, relawan desa DAPAT, relawan berprofil kosong TIDAK; (2) `jurisdictionLevel()` untuk kelima bentuk data termasuk string kosong. Empat test lama di file itu tetap hijau tanpa diubah. Suite penuh 190 passed (743 assertions).
- **SISA (belum diverifikasi):** query verifikasi `'0'`/`''` di produksi belum dijalankan (tak ada akses DB produksi pada sesi ini). Bila ada barisnya, `forCodes()` sudah memperlakukannya sebagai kosong, tetapi `whereNull` di cabang jaring pengaman dan di cascade TIDAK — jadi normalisasi data satu kali tetap perlu. Baris relawan berwilayah kosong = kandidat yang harus diminta melengkapi profil; baris berperan admin/petugas/pejabat SAH, jangan diperlakukan sebagai data rusak.
- **Sumber:** laporan user 2026-08-10 saat membahas cakupan penerima notifikasi.
- **Status:** SELESAI (FIXED) 2026-08-11 — TASK_23

### #57 — Produksi berjalan dengan `APP_ENV=local` dan `APP_DEBUG=true`
- **Severity:** P1 (kebocoran informasi: jejak galat penuh + isi konfigurasi terbuka ke publik)
- **Ditemukan 2026-08-11** saat menyiapkan deploy #55/#56 ke staging & dev: `/var/www/sisupit/.env` di VPS produksi berisi `APP_ENV=local` dan `APP_DEBUG=true` (staging & dev juga `APP_DEBUG=true`, tapi dampaknya lebih ringan karena bukan lingkungan publik utama).
- **Dampak:**
  1. Setiap galat 500 menampilkan halaman debug Laravel berisi jejak tumpukan, potongan kode sumber, dan **isi variabel environment** (kredensial DB, APP_KEY, kunci Reverb/FCM) kepada siapa pun yang memicunya.
  2. Penangan pengecualian di `bootstrap/app.php:31-45` sengaja hanya merender halaman `ErrorHandling` yang ramah bila `! app()->environment(['local','testing'])`. Dengan `APP_ENV=local`, cabang itu **tidak pernah** aktif di produksi — jadi halaman error rapi yang sudah dibuat justru tak pernah terpakai di tempat yang paling membutuhkannya.
  3. Perilaku lain yang bergantung environment (mis. `crossSubdomainThanksRedirect`, penulisan log verbose) ikut memakai jalur "local" di produksi.
- **Fix (2026-08-11, TASK_24):** `/var/www/sisupit/.env` → `APP_ENV=production` + `APP_DEBUG=false`; `.env` staging & dev → `APP_DEBUG=false` (keduanya domain publik berisi salinan PII produksi, risiko bocornya sama). Cadangan `.env.bak-57-<timestamp>` dibuat di tiap direktori. Tidak ada perubahan kode. Tidak ada config cache di ketiga env, jadi `config:clear` tak diperlukan.
- **Verifikasi:** SEBELUM — `curl https://sisupit.com/halaman-yang-tidak-ada-xyz` mengembalikan halaman galat bawaan Laravel (`<title>Not Found</title>` + normalize.css inline); staging (`APP_ENV=staging`) sudah merender `ErrorHandling`. SESUDAH — produksi ikut merender `ErrorHandling`, tanpa `Whoops` maupun jejak `vendor/laravel/framework`. Beranda ketiga env 200, path tak dikenal 404. Risiko `URL::forceScheme('https')` yang ikut aktif (`AppServiceProvider:38`) sudah terbukti aman karena staging/dev berjalan dengan cabang itu sejak lama; komponen `ErrorHandling.jsx` diverifikasi ADA di revisi produksi `4a4ed6b` sebelum saklar dibalik.
- **Sumber:** inspeksi `.env` ketiga environment saat deploy 2026-08-11.
- **Status:** SELESAI (FIXED) 2026-08-11 — TASK_24

### #58 — `public/build` yang ter-commit dibangun tanpa `VITE_REVERB_APP_KEY`: `window.Echo` tak pernah dibuat
- **Severity:** P1 (seluruh fitur real-time di browser mati, di SEMUA environment)
- **Ditemukan 2026-08-11** saat memverifikasi hasil perbaikan #55 di staging. `resources/js/echo.js:12` hanya membuat `window.Echo` bila `import.meta.env.VITE_REVERB_APP_KEY` terisi; Vite mengganti nilai itu **saat build**. Pada aset yang ter-commit (`public/build/assets/app-*.js`) tidak ada satu pun string `broadcaster:"reverb"` maupun `sisupit.com`, sementara string peringatan pada cabang `else` (`VITE_REVERB_APP_KEY tidak di-set`) ADA — bukti bahwa nilainya kosong saat build sehingga blok `new Echo({...})` dibuang sebagai kode mati. `pusher-js` tetap ikut ter-bundle, jadi ukurannya tidak berubah dan tidak ada gejala yang terlihat.
- **Dampak:** `window.Echo` `undefined` di browser, dan semua pemakainya dijaga `if (window.Echo)` sehingga gagal **tanpa error**. Pelacakan responder di `Front/Reports/Show.jsx:619` dan badge status real-time (#28) tidak akan hidup walaupun #55 sudah memperbaiki sisi server. **Aplikasi desktop Electron TIDAK terpengaruh** — ia memakai WebSocket sendiri di main process, bukan `window.Echo`.
- **Dugaan penyebab:** build terakhir yang ter-commit (`1403441`, sesudah TASK_21) dijalankan dari **git worktree** yang tidak punya `.env`/`.env.production`, sehingga variabel `VITE_*` kosong. `.env` di repo utama memakai interpolasi gaya Laravel (`"${REVERB_APP_KEY}"`) sedangkan `.env.production` berisi nilai harfiah — keduanya ada di repo utama, tidak ada di worktree.
- **Fix (2026-08-11, TASK_25) — akar, bukan gejalanya.** Build ulang saja hanya menambal sekali pakai dan tidak menyentuh masalah kedua (host terpaku satu domain). Karena itu nilainya dipindah jadi dibaca RUNTIME, mengikuti pola `MAP_TILE_URL` yang sudah ada di repo: `config/services.php` blok `reverb` (key/host/port/scheme dari env server, TANPA `secret`) → `window.REVERB_CONFIG` di `app.blade.php` → dibaca `resources/js/echo.js`. `.env.example` diperbarui: `VITE_REVERB_*` tidak dipakai lagi, dan pindah domain/environment tidak lagi memerlukan rebuild frontend. Aset di-build ulang & di-commit mengikuti alur deploy baku repo.
- **Gotcha yang ditemui:** `@json([...])` MULTI-BARIS membuat Blade gagal parse (`Unclosed '[' does not match ')'`). Karena itu array-nya dikumpulkan di `config/services.php` dan blade cukup memanggil `@json(config('services.reverb'))` — argumen tunggal, sekaligus menjaga satu sumber nilai.
- **Verifikasi:** aset baru memuat `broadcaster:"reverb"` DAN `REVERB_CONFIG`, tanpa `wsHost:"..."` harfiah (sebelumnya kebalikannya persis). 3 test regresi baru di `tests/Feature/Sisupit/ReverbClientConfigTest.php`: injeksi ada di setiap halaman; **app secret tidak pernah ikut ke browser**; host mengikuti env server sehingga tiap environment menunjuk Reverb-nya sendiri. Suite penuh 193 passed (752 assertions), naik dari 190.
- **SISA (belum diverifikasi):** pemeriksaan langsung di browser — buka detail laporan aktif di staging, pastikan `window.Echo` ada dan DevTools→Network→WS menyambung ke `staging.sisupit.com`, bukan `sisupit.com`. Repo tak punya browser automation.
- **Sumber:** verifikasi pasca-deploy #55 di staging 2026-08-11.
- **Status:** SELESAI (FIXED) 2026-08-11 — TASK_25

### #59 — `REVERB_APP_KEY`/`SECRET` identik di produksi, staging, dan dev
- **Severity:** P3 (higiene kredensial; bukan celah langsung, tapi menghapus batas antar-environment)
- **Ditemukan 2026-08-11** setelah #58 diperbaiki: `window.REVERB_CONFIG` yang dikirim ketiga environment memuat app key yang sama persis (`k6wxyftqnvctsl54svr6`). Wajar — `.env` staging/dev disalin dari produksi saat provisioning 2026-07-06 dan hanya `APP_ENV/APP_URL/DB_DATABASE/REVERB_HOST/REVERB_SERVER_PORT/SESSION_COOKIE` yang diubah.
- **Dampak:** karena `REVERB_APP_SECRET` juga sama, tanda tangan otorisasi channel yang dibuat server staging **valid di Reverb produksi**, dan sebaliknya. Siapa pun yang bisa login di staging/dev (data PII produksi tersalin ke sana) bisa memakainya untuk berlangganan channel privat di produksi bila mengetahui socket id yang tepat. Selama #58 belum diperbaiki hal ini tersembunyi karena browser staging/dev memang menyambung ke Reverb produksi.
- **Rencana fix (belum dikerjakan):** buat `REVERB_APP_ID`/`APP_KEY`/`APP_SECRET` sendiri untuk staging dan dev, lalu restart `reverb-staging`/`reverb-dev`. Sejak #58 nilai sisi browser dibaca runtime, jadi **tidak perlu rebuild frontend** — cukup ubah `.env` masing-masing. Pertimbangkan sekalian memisahkan `APP_KEY` per environment (saat provisioning sengaja disamakan agar data terenkripsi hasil salinan tetap terbaca — kalau diubah, kolom terenkripsi di salinan DB jadi tak terbaca, jadi ini keputusan tersendiri).
- **Sumber:** verifikasi pasca-perbaikan #58, 2026-08-11.
- **Status:** OPEN

### #60 — OPD tingkat kota tak terlihat oleh staf ber-`district_code`/`village_code` (Tenantable memfilter pakai kode tersempit)
- **Severity:** P2 (fitur OPD terkait mati diam-diam bagi sepertiga staf Denpasar; pola yang sama menular ke Unit/Hydrant/Pompa/PosPemadam)
- **Ditemukan 2026-08-13** saat mengisi master OPD Denpasar lewat `AgencySeeder` di produksi (permintaan user, TASK_27 §SISA). Bukan bug baru dari TASK_27 — ini sifat `app/Traits/Tenantable.php:14-52` yang baru terasa akibatnya sekarang.
- **Akar:** scope global memilih SATU kolom, yaitu yang **tersempit** milik user, lalu menuntut kecocokan persis: `village_code` → `district_code` → `city_code` → `province_code`. Tidak ada gagasan "baris yang lebih luas tetap terlihat oleh yang lebih sempit". Sementara itu `Admin\AgencyController::withTenantCodes()` menyalin yurisdiksi admin yang menyimpan — admin kota Denpasar (`51/5171/NULL/NULL`) menghasilkan baris ber-`district_code = NULL`, yang tak akan pernah cocok dengan `where district_code = '517101'`.
- **Dampak terukur di produksi (2026-08-13):** dari 18 akun admin+petugas ber-`city_code=5171`, **6 melihat daftar OPD KOSONG**. Diverifikasi dengan menjalankan `Agency::recommendedIdsFor('rumah')` sebagai user sungguhan: admin kota → `BPBD,PLN,PMI` + 2 OPD tercentang otomatis; petugas kecamatan (`.../517101/NULL`) dan petugas desa → `(KOSONG)` + 0 rekomendasi. Bagi mereka fitur "OPD terkait" hilang tanpa pesan galat apa pun — persis pola gagal-diam yang sudah dua kali jadi sumber temuan di repo ini (#55, #58).
- **Catatan:** ini konsisten dengan Unit/Hydrant/Pompa/PosPemadam yang memakai trait sama, jadi kemungkinan besar mereka pun tak terlihat oleh staf ber-kecamatan/desa. Belum diukur.
- **Opsi fix (belum diputuskan — menyentuh trait yang dipakai banyak model, butuh keputusan user):**
  1. Ubah `Tenantable` jadi hierarkis: baris cocok bila kolomnya NULL **atau** sama, dari provinsi ke desa (paling benar, blast radius paling besar — semua model ber-Tenantable ikut berubah, termasuk `Report`).
  2. Khusus `Agency`: pakai scope sendiri yang hierarkis, biarkan model lain apa adanya (diff kecil, tapi menambah satu aturan wilayah kedua di codebase — melanggar semangat "satu sumber kebenaran").
  3. Operasional saja: kosongkan `district_code`/`village_code` pada 6 akun staf tersebut agar mereka jadi tingkat kota. Tidak menyentuh kode, tapi mengubah arti data dan bertabrakan dengan #56 (`STAFF_ROLES`: kolom kosong pada staf memang berarti "sengaja luas").
- **Fix (2026-08-13, TASK_29) — opsi 1 dipilih user.** `app/Traits/Tenantable.php`: rantai "pilih SATU kolom tersempit lalu `return`" diganti dengan — untuk **tiap tingkat yang dimiliki user**, baris harus `NULL` **atau** sama. Cabang superadmin dan cabang "tanpa kode wilayah → `whereRaw('1 = 0')`" (#44) tidak disentuh. Alasan memilih opsi ini di atas dua alternatif (scope khusus `Agency`; mengosongkan kolom wilayah 6 akun) ada di file task §5: diukur di data produksi lebih dulu, aturan baru hanya menambah baris ber-kolom NULL, dan laporan/hidran/pompa/pos **tidak punya satu pun** baris seperti itu (0 dari 131/51/6/7) — jadi yang berubah persis 5 baris data master (3 OPD + 2 armada), tanpa memperluas wewenang siapa pun.
- **Bukan aturan baru:** `User::scopeNotifiableForReport` (`app/Models/User.php:263-276`) sudah lama memakai makna yang sama ("kolom lebih sempit NULL = wewenang lebih luas") untuk memilih penerima siaran darurat. Perbaikan ini menyelaraskan `Tenantable` dengan aturan yang sudah dipercaya di jalur paling kritis.
- **TIDAK mengubah penerima notifikasi darurat.** Penerima dipilih `scopeNotifiableForReport`, dan `User` **tidak memakai** trait `Tenantable`. Relawan tetap disaring `notify_level_relawan` + `is_standby`. (Sebaliknya, opsi 3 yang ditolak justru akan mengubahnya: mengosongkan `village_code` 4 petugas membuat mereka menerima siaran se-kota, bukan se-desa.)
- **Efek samping yang menguntungkan:** user ber-`district_code` sebelumnya difilter **hanya** dengan `district_code`, tanpa memeriksa provinsi/kota sama sekali — baris kabupaten lain yang kebetulan berkode kecamatan sama ikut terambil. Aturan baru memeriksa tiap tingkat, jadi cakupannya lebih rapat. Dikunci test `it now also checks province and city for a district-scoped user`.
- **Verifikasi:** test baru `tests/Feature/Sisupit/TenantableHierarchyTest.php` (7 kasus) — ditulis MERAH lebih dulu (4 gagal / 3 lulus) lalu hijau seluruhnya sesudah fix. Suite penuh 215 → 222 passed. Di produksi: keenam staf yang tadinya melihat OPD KOSONG kini melihat 3 OPD, dan jumlah laporan yang terlihat tiap tingkat TIDAK bergeser (131 kota / 77 kecamatan / 20 desa).
- **Sumber:** verifikasi pasca-pengisian master OPD Denpasar, 2026-08-13.
- **Status:** SELESAI (FIXED) 2026-08-13 — TASK_29

### #61 — `registered_tenants` & `Tenant::forCity()` tak punya fallback: tabel `tenants` kosong = semua pelapor divonis "kabupatenmu belum terdaftar"
- **Severity:** P3 (data, bukan kode — tapi berulang tiap kali multi-tenant di-deploy ke environment baru)
- **Ditemukan 2026-08-13** oleh user saat mencoba melapor dari Denpasar di PRODUKSI: muncul peringatan kuning "Kabupatenmu belum terdaftar di layanan ini ... hubungi 112".
- **Akar:** deploy 2026-08-13 menaikkan produksi dari `4a4ed6b` ke kode multi-tenant (TASK_17) berikut migrasi `tenants`, tetapi `TenantSeeder` **sengaja tidak dijalankan** (dinilai "data bisnis, `TENANT_BASE_DOMAIN` kosong = single-tenant, jadi aman"). Penilaian itu SALAH: dua jalur membaca tabel `tenants` tanpa peduli konfigurasi subdomain, dan keduanya tidak punya jaring pengaman seperti `Tenant::default()`/`fromConfig()`:
  1. `ReportController::create():332` → `registered_tenants` = `Tenant::where('is_active', true)->get(...)`. Kosong → `Create.jsx:615` `matchedTenant` selalu `undefined` → banner kuning untuk SETIAP kota, termasuk kota pelanggan sendiri.
  2. `ReportController::thanks()` → `Tenant::forCity()` → `null` → halaman Terima Kasih kehilangan nama pejabat & instansi, jatuh ke teks generik.
- **Dampak:** warga Denpasar yang melapor darurat dibilang wilayahnya tak dilayani dan diarahkan ke 112 — merusak kepercayaan tepat di momen paling genting. Laporan tetap tersimpan (banner ini murni informatif, bukan pemblokir).
- **Fix (2026-08-13, data saja — TANPA perubahan kode):** `php artisan db:seed --class=TenantSeeder --force` di ketiga environment. Di PRODUKSI `pejabat_nama`/`pejabat_jabatan` Badung dikosongkan setelahnya karena seeder menulis placeholder harfiah `'Nama Pejabat Badung'` — nama itu akan tampil sebagai pejabat penanda tangan di halaman Terima Kasih warga Badung sungguhan; `ReportController:431` sudah menangani `pejabat_nama` kosong dengan melewati blok tersebut. `nama_instansi` Badung faktual, dibiarkan.
- **Gotcha cache yang wajib diingat:** `Tenant::forCity()`/`resolveFromHost()`/`default()` memakai `Cache::rememberForever` dan **menyimpan hasil NULL juga**, sedangkan `Tenant::flushResolutionCache()` HANYA membuang `tenant:default`. Setelah menyemai tenant, kunci `tenant:city:<kode>` dan `tenant:subdomain:<sub>` HARUS dibuang manual — kalau tidak, halaman Terima Kasih tetap kehilangan pejabat selamanya walau tabelnya sudah terisi.
- **Verifikasi:** `ReportController::create()` dipanggil sungguhan di produksi sebagai warga login (header `X-Inertia`), prop diperiksa dan pencocokan `Create.jsx:615` ditirukan: pin Denpasar → HIJAU "diarahkan ke Damkar Kota Denpasar", pin Badung → HIJAU, pin Jakarta Pusat (5171→3171, memang belum terdaftar) → tetap KUNING. Jalur peringatannya masih hidup, yang diperbaiki datanya.
- **Sisa/pencegahan:** onboarding kabupaten baru harus memasukkan "isi tabel `tenants`" sebagai langkah wajib, bukan opsional. Pertimbangkan memberi `registered_tenants` fallback ke `Tenant::default()` bila tabel kosong, agar instalasi baru tidak pernah menampilkan vonis "belum terdaftar" kepada kota pemiliknya sendiri.
- **Sumber:** laporan user 2026-08-13 setelah deploy `2cd7e03`.
- **Status:** SELESAI (FIXED) 2026-08-13 — data produksi; sisi kode dibiarkan (lihat "Sisa/pencegahan")

### #62 — Dashboard OPD menuduh akun yang SUDAH tertaut instansi sebagai "belum ditautkan"
- **Severity:** P2 (fitur OPD terkait tampak rusak total bagi setiap akun OPD — tidak ada satu pun yang bisa memakainya)
- **Ditemukan 2026-08-13** saat membuat akun uji peran `opd` atas permintaan user. Terungkap hanya karena akun OPD baru ada sekarang; kode-nya sendiri sudah begitu sejak TASK_27.
- **Akar:** `DashboardController:159` memakai relasi `$user->agency?->name`. `Agency` memakai trait `Tenantable`, sedangkan akun OPD **sengaja tanpa kode wilayah** (mitra luar Damkar — relevansinya ditentukan keanggotaan `report_agencies` + `agency_id`, bukan wilayah). Akibatnya relasi itu jatuh ke cabang "tanpa kode wilayah & bukan superadmin → `whereRaw('1 = 0')`" (#44) dan mengembalikan `null` meskipun `users.agency_id` terisi benar.
- **Dampak:** `Opd/Dashboard.jsx:30` menampilkan peringatan **"Akun Anda belum ditautkan ke instansi mana pun, jadi belum ada permintaan yang bisa ditampilkan. Hubungi admin Damkar wilayah Anda"** — pernyataan yang KELIRU dan menyesatkan: akunnya tertaut, dan permintaan bantuan tetap masuk. Judul halaman ikut jatuh ke teks generik "Instansi Terkait". Petugas OPD yang membacanya akan mengira dirinya belum didaftarkan dan menghubungi admin tanpa perlu.
- **Ironi yang memperjelas ini bug, bukan desain:** query `$requests` 20 baris DI ATASNYA dalam method yang sama sudah benar — memakai `Report::withoutGlobalScopes()` dengan `agency_id` sebagai re-check ownership (ATURAN EMAS #7), persis karena penulisnya sadar wilayah tak berlaku untuk OPD. Hanya baris `agencyName` yang terlewat.
- **Fix (2026-08-13):** `DashboardController` mengambil nama instansi lewat `Agency::withoutGlobalScopes()->whereKey($user->agency_id)->value('name')`, dibungkus cek `$user->agency_id` — pembatasnya tetap `agency_id` akun itu sendiri, pola yang sama dengan query `$requests`. Relasi `$user->agency` tidak diubah (dipakai HANYA di baris ini, sudah dicek repo-wide) agar tidak mengubah semantik relasi bagi pemakai lain di kemudian hari.
- **Alternatif yang DITOLAK:** memberi akun OPD kode wilayah (mis. `51`/`5171`) supaya relasinya lolos Tenantable. Itu menyembuhkan gejala sambil membuka data Damkar yang bukan hak mitra luar, dan bertentangan dengan alasan akun OPD dibuat tanpa wilayah sejak awal.
- **Verifikasi:** `tests/Feature/Sisupit/OpdDashboardTest.php` (2 kasus) — dibuktikan MERAH lebih dulu dengan mengembalikan controller ke versi lama (`agencyName` tidak cocok), hijau sesudah fix. Kasus kedua menjaga agar peringatan "belum ditautkan" TETAP muncul untuk akun yang memang `agency_id`-nya null.
- **Sumber:** pembuatan akun uji OPD 2026-08-13.
- **Status:** SELESAI (FIXED) 2026-08-13

### #63 — Konfirmasi OPD berhenti sebagai flash message: Pusat Komando tak pernah tahu listrik sudah dipadamkan
- **Severity:** P2 (keselamatan kerja petugas di lokasi; fitur "butuh konfirmasi" TASK_27 tak sampai ke pihak yang menunggunya)
- **Ditemukan 2026-08-18** dari permintaan user "notif listrik padam masuk ke admin dll".
- **Akar:** `ReportActionController::confirmAgency()` hanya meng-update baris pivot `report_agencies` lalu `return back()->with('success', ...)`. Tidak ada satu pun `Notification::send` di seluruh method. TASK_27 membangun notifikasi SATU ARAH saja (Damkar → OPD lewat `AgencyDispatchNotification`); arah baliknya tak pernah dibuat.
- **Dampak:** ketika akun OPD (mis. PLN) sendiri yang menekan "Listrik sudah dipadamkan di lokasi kejadian", satu-satunya orang yang melihat kabar itu adalah petugas PLN yang menekannya. Operator Pusat Komando dan petugas Damkar yang sedang di lokasi tidak menerima apa pun — padahal justru merekalah yang menunggu konfirmasi itu untuk boleh menyemprot air ke material yang mungkin masih beraliran listrik. Satu-satunya cara mengetahuinya adalah kebetulan sedang membuka halaman detail insiden dan me-refresh.
- **Fix (2026-08-18, TASK_30):** `AgencyConfirmationNotification` (FCM + database/lonceng web, blok `apns` sesuai TASK_26, tanpa sirine karena ini koordinasi bukan panggilan meluncur) dikirim lewat `notifyCommandCenterOfConfirmation()`. Penerimanya DUA kelompok: (a) admin+petugas yang menaungi laporan, dipilih dengan `notifiableForReport()` dan ceiling `Setting::KEY_NOTIFY_LEVEL_PETUGAS` — lebar yang SAMA dengan siaran `approve()`, supaya "seberapa luas Pusat Komando sebuah laporan" tetap satu jawaban di seluruh aplikasi; (b) petugas yang sedang menangani insiden itu (`report_officers`), karena keanggotaan bisa berasal dari luar wilayah siaran dan merekalah yang keselamatannya bergantung pada kabar ini (pola yang sama dipakai `arrive()`, #42). Yang mencatat konfirmasi tidak dikabari tindakannya sendiri.
- **Tetap DATA, bukan cabang kode:** kalimatnya diambil dari snapshot `confirmation_label` pivot, bukan dari nama instansi — OPD baru yang butuh konfirmasi cukup didaftarkan lewat `/admin/agencies` (aturan TASK_27, jangan pernah menulis `if ($agency->code === 'pln')`).
- **Verifikasi:** test `it tells the command center and the officers on scene when an agency confirms` di `ReportAgencyTest.php` — menjaga sekaligus bahwa petugas desa lain yang TIDAK terlibat tidak ikut kebanjiran, dan bahwa akun OPD yang menekan tombolnya tidak dikirimi notifikasi sendiri.
- **Sumber:** permintaan user 2026-08-18.
- **Status:** SELESAI (FIXED) 2026-08-18 — TASK_30

### #64 — "Cari SKKL/Hydrant terdekat" memakai `acos()`/`radians()` yang tidak ada di SQLite bawaan PHP
- **Severity:** P3 (fitur mati di lokal & testing, jalan di produksi — jenis bug yang tak pernah terlihat saat dikembangkan)
- **Ditemukan 2026-08-18** saat menggabungkan dua sumber data di halaman SKKL (TASK_30).
- **Akar:** `Front\PompaController` & `Front\HydrantController` menghitung jarak lewat `selectRaw` haversine (`6371 * acos(cos(radians(?)) * ...)`). Fungsi matematika itu hanya tersedia bila SQLite dikompilasi dengan `SQLITE_ENABLE_MATH_FUNCTIONS` — build bawaan PHP umumnya tidak. Di MySQL produksi fungsinya ada, jadi fiturnya jalan; di SQLite lokal/testing query yang sama melempar galat.
- **Fix parsial (2026-08-18, TASK_30):** `Front\PompaController` kini menghitung jarak di PHP (`haversineKm()`), sekaligus karena daftar gabungan dua tabel tak lagi bisa diurutkan oleh satu `ORDER BY` di salah satu query.
- **SISA (belum dikerjakan, di luar scope TASK_30):** `Front\HydrantController` masih memakai `selectRaw` haversine yang sama. Halaman `/hydrants` dengan tombol "Cari Terdekat" karena itu masih rawan galat di environment ber-SQLite. Perbaikannya: pindahkan ke pola `haversineKm()` yang sama.
- **Sumber:** pengerjaan TASK_30.
- **Status:** OPEN (sebagian) — sisi SKKL sudah, sisi Hydrant belum

### #65 — Empat halaman RBAC (Peran/Izin/Tetapkan Izin/Rute Akses) masih desktop-only: tabel menjulur keluar kartu di ponsel
- **Severity:** P3 (kosmetik/keterpakaian; tidak ada data bocor atau aksi yang salah — hanya tak bisa dipakai dari ponsel)
- **Ditemukan 2026-08-19** dari laporan user ("masih tampilan lama dan hanya tampilan desktop").
- **Akar:** keempat `Index.jsx` (`Admin/Roles`, `Admin/Permissions`, `Admin/AssignPermissions`, `Admin/RouteAccesses`) merender `<Table>` langsung di dalam `CardContent className="px-0 py-0"` **tanpa pembungkus `overflow-x-auto` dan tanpa tampilan alternatif**. Tabel 4–6 kolom karena itu menjulur melewati tepi kartu di layar sempit. Pola mobile-first-nya sudah lama ada di repo — `Admin/Users/Index.jsx` memakai tabel `hidden md:block` + daftar kartu `md:hidden` — keempat halaman ini saja yang tertinggal saat pola itu diterapkan.
- **Fix (2026-08-19):** pola `Admin/Users/Index.jsx` disalin apa adanya ke keempatnya (tabel dibungkus `hidden overflow-x-auto md:block`, daftar kartu `md:hidden` dengan kepala kartu + baris info berikon + kaki aksi `flex-1`). AlertDialog hapus diangkat jadi komponen lokal (`DeleteRoleDialog`, dst.) supaya tidak kembar antara tabel dan kartu. Kolom "Dibuat pada" disembunyikan sampai `lg` seperti Users. Baris filter dibuat kolom penuh di ponsel (`w-full lg:w-1/4` / `lg:w-24` / `lg:w-auto`) — sebelumnya `sm:w-1/4` menyempit di 640px padahal barisnya baru jadi baris di `lg`. Tombol form (Reset/Simpan) jadi `flex-col-reverse ... sm:flex-row` full-width di ponsel.
- **Empty state:** ditambahkan "Data tidak ditemukan." — sebelumnya daftar kosong berarti layar benar-benar kosong tanpa keterangan (paling terasa di ponsel, yang tak punya kepala tabel sebagai petunjuk).
- **Bug tampilan yang ikut ditemukan & diperbaiki di berkas yang sama:**
  1. `Badge variant="aoutline"` di `AssignPermissions/Index.jsx` — varian itu tidak ada di `Components/ui/badge.jsx`, jadi cva jatuh ke `default` dan seluruh badge izin ter-render **solid primary**, bukan outline. → `outline`.
  2. `<Select defaultValue="data.guard_name">` di keempat form Roles/Permissions Create+Edit — string harfiah, bukan nilai `data.guard_name`. Select-nya jadi tak terkendali dan **tidak ada item yang tercentang** saat dropdown dibuka (teks yang tampak benar hanya karena `<SelectValue>` diberi children manual). → `value={data.guard_name}`.
  3. Kelas typo `fles-wrap` di `PaginationContent` keempat halaman — tidak ada di Tailwind, jadi tautan halaman tak pernah membungkus dan meluber di ponsel. → `flex flex-wrap`.
  4. `console.log(props)` tertinggal di `Roles/Edit.jsx`, `Permissions/Edit.jsx`, `AssignPermissions/Edit.jsx` — membocorkan seluruh props (termasuk daftar izin) ke konsol browser.
  5. Label salin-tempel: judul kolom "Rote" (→ "Rute"), footer halaman Izin berbunyi "… Peran" (→ "Izin"), judul kolom "Permission" (→ "Izin").
- **Verifikasi:** `php artisan test` 236 passed (926 assertions) sebelum & sesudah — tak ada test untuk lapisan presentasi ini; `npm run build` lulus (client + SSR). **Verifikasi visual manual masih perlu** di lebar 375px/768px/1280px untuk keempat halaman (repo tak punya browser automation).
- **Sumber:** permintaan user 2026-08-19.
- **REVISI 2026-08-20 (permintaan user, membatalkan satu baris "Tidak berubah" di atas):** "untuk fasilitas dan menu di mobile saat active jangan pakai merah seperti di desktop tapi pakai seperti sebelumnya yang ada di production". Yang dimaksud adalah **isi popover**, bukan tombol slotnya (dipertegas lewat pilihan; ukuran ikon/label #72 juga sengaja TIDAK dikembalikan ke 28px). Jadi keputusan "baris popover tetap dialek `NavLink` (blok solid merah)" **dicabut**: baris aktif di popover Fasilitas & Menu kembali ke bentuk production, yaitu **tint 10% + teks/ikon sewarna** (`bg-teal/10 text-teal` dst.; `bg-destructive/10 text-destructive` untuk item tanpa warna jenis), plus `font-semibold` & `aria-current="page"` sebagai ganti kontras yang hilang. Alasan user: di dalam panel, blok merah solid terbaca seperti tombol aksi darurat — idiom yang di aplikasi ini dipegang tombol "Lapor" — bukan seperti "kamu di sini"; blok solid itu pun baru berumur sehari dan belum pernah sampai produksi. **Kotak ikon slot BILAH tidak ikut berubah** (tetap `rounded-xl bg-destructive`), sehingga kini ada dua bentuk penanda aktif dalam satu berkas — itu diterima dan dicatat di `prompt/docs/PENGECUALIAN_ATURAN.md` **#2**. Hidup di `MobileBottomNav.jsx`: `FASILITAS_ITEM_TONE` (menggantikan `FASILITAS_ICON_COLOR`), `MENU_ACTIVE_TONE`, `FloatingLink`.
- **Status:** SELESAI (FIXED) 2026-08-19 — sisa verifikasi visual manual

### #66 — Typo "Menamplikan" di footer SEMUA daftar admin
- **Severity:** P4 (kosmetik murni)
- **Ditemukan 2026-08-19** saat mengerjakan #65.
- **Akar:** teks `Menamplikan {from} dari {total} …` disalin-tempel ke setiap `Admin/*/Index.jsx` (Users, Roles, Permissions, AssignPermissions, RouteAccesses, Units, Announcements, dst.), termasuk `page_settings.subtitle` di sisi controller ("menamplikan semua data …"). Seharusnya "Menampilkan".
- **Sengaja TIDAK diperbaiki di #65:** memperbaiki hanya 4 halaman yang sedang disentuh justru membuat aplikasi tidak konsisten — separuh daftar berbunyi "Menampilkan", separuh "Menamplikan". Perbaikannya harus sekali jalan untuk seluruh repo (frontend + string subtitle di controller), jadi layak jadi task kecil tersendiri.
- **Status:** OPEN

### #67 — Panel "OPD Terkait" di detail laporan masih memakai kontrol HTML bawaan (`<select>`/`<input type="checkbox">`)
- **Severity:** P3 (kosmetik/konsistensi; fungsinya jalan, tapi tampilannya beda sendiri dari seluruh app)
- **Ditemukan 2026-08-19** dari permintaan user ("di reports/show jangan pakai form bawaan pada libatkan OPD lain").
- **Akar:** `resources/js/Pages/Front/Reports/Show.jsx` memakai elemen form asli browser di dua tempat pada alur OPD (TASK_27):
  1. dropdown "Libatkan OPD lain…" = `<select>` + `<option>` polos yang hanya di-Tailwind-kan agar mirip. Karena `<option>` tidak bisa di-style, daftarnya tetap dirender oleh OS — di Windows/Android tampil putih kotak dengan font sistem, **tidak ikut tema gelap**, dan tingginya tak sama dengan tombol di sebelahnya.
  2. daftar centang OPD di dialog Broadcast = `<input type="checkbox">` mengandalkan `@tailwindcss/forms`; warna centangnya datang dari `text-info` (properti `accent`/`color` bawaan), bukan token `data-[state=checked]` seperti komponen shadcn lain.
  Padahal `Components/ui/{select,checkbox,label}.jsx` sudah ada dan dipakai di seluruh form admin (`Admin/Agencies/Create.jsx` sebagai patokan).
- **Fix (2026-08-19):** ketiga kontrol di alur OPD diganti ke komponen shadcn yang sudah ada — `Select/SelectTrigger/SelectValue/SelectContent/SelectItem` (placeholder pindah dari `<option value="">` ke `<SelectValue placeholder>`, nilai item jadi `String(a.id)` karena Radix hanya menerima string), `Checkbox` dengan `onCheckedChange` + `data-[state=checked]:bg-info` (rona `info` panel dipertahankan), dan `Label` untuk "Catatan (opsional)" di dialog Catat Konfirmasi (dipasangkan ke `Textarea` lewat `htmlFor`/`id` — sebelumnya `<label>` polos tanpa kaitan, klik label tak memfokus kolom).
- **Yang TIDAK berubah:** `handleAddAgency` tetap mengirim `Number(agencyToAdd)`; state, route, dan validasi server tak tersentuh. Baris OPD di dialog Broadcast tetap dibungkus `<label>` sehingga seluruh kartu tetap bisa diklik (`<button>` milik Radix Checkbox adalah elemen labelable, jadi klik pada label diteruskan ke sana).
- **Verifikasi:** `php artisan test` 236 passed (926 assertions) sebelum & sesudah — tak ada test untuk lapisan presentasi ini; `npm run build` lulus (client + SSR). **Verifikasi visual manual masih perlu**: buka detail laporan sebagai Pusat Komando → dropdown "Libatkan OPD lain" (terang & gelap, ponsel & desktop), dialog Broadcast (centang/lepas centang, "N dipilih" ikut berubah), dialog Catat Konfirmasi.
- **Sumber:** permintaan user 2026-08-19.
- **Status:** SELESAI (FIXED) 2026-08-19 — sisa verifikasi visual manual

### #68 — Sisa kontrol bawaan di `Front/Reports/Show.jsx`: dropdown "Pilih unit tersedia" (panel Armada) & label dialog Tolak
- **Severity:** P4 (kosmetik; salah satunya bahkan belum terlihat pengguna)
- **Ditemukan 2026-08-19** saat mengerjakan #67, **sengaja tidak dikerjakan** (di luar scope permintaan user yang menyebut panel OPD).
- **Akar:** di berkas yang sama masih ada (a) `<select>`/`<option>` "Pilih unit tersedia…" pada panel "Pengerahan Armada" — panel itu sedang disembunyikan oleh sakelar `SHOW_ARMADA_PANEL = false` (keputusan user 2026-06-29), jadi bug tampilannya baru muncul kalau panel dihidupkan lagi; dan (b) `<label>` polos untuk "Alasan penolakan (opsional)" di dialog Tolak, tanpa `htmlFor` ke `Textarea`-nya.
- **Perbaikannya:** salin pola dari #67 (`Select` + `SelectValue placeholder`, `Label htmlFor`). Layak dikerjakan sekalian bila panel Armada dihidupkan kembali.
- **Status:** OPEN

### #69 — `Components/ui/select.jsx`: daftar opsi dipaksa setinggi trigger, jadi dropdown terlihat kosong (SEMUA halaman)
- **Severity:** P2 (fitur terlihat rusak: dropdown apa pun di app ini hanya memperlihatkan ±1 opsi, tanpa petunjuk bahwa daftarnya bisa di-scroll)
- **Ditemukan 2026-08-19** dari laporan user "data OPD-nya malah tidak muncul saat saya pilih Libatkan OPD lain", setelah `<select>` bawaan diganti komponen shadcn (#67).
- **Akar (dua lapis, keduanya di berkas yang sama):**
  1. `SelectPrimitive.Viewport` diberi kelas `h-[var(--radix-select-trigger-height)]` saat `position === 'popper'` (default komponen ini). Var itu = tinggi TRIGGER, jadi area daftar ikut jadi ±36–40px — hanya muat satu opsi. Radix pula yang menyuntik `[data-radix-select-viewport]{scrollbar-width:none}` + menyembunyikan scrollbar webkit, sehingga tak ada satu pun isyarat visual bahwa masih ada isi di bawahnya. Diverifikasi bukan teori: aturan `.h-\[var\(--radix-select-trigger-height\)\]{height:var(--radix-select-trigger-height)}` benar-benar ter-emit di `public/build/assets/app-*.css`.
  2. Radix memberi Viewport `flex: 1` + `overflow: hidden auto` (`node_modules/@radix-ui/react-select/dist/index.mjs:733-745`) dengan asumsi induknya flex column, **tapi `SelectContent` di repo ini tidak punya `flex flex-col`** (dan `SelectPopperPosition` Radix juga tidak menyetelnya, baris 690-702). Jadi `flex: 1` mati total: menghapus butir 1 saja akan membuat daftar tumbuh melewati `max-h-96` lalu terpotong `overflow-hidden` **tanpa bisa di-scroll** — bug lain, bukan perbaikan.
- **Fix (2026-08-19):** `SelectContent` diberi `flex … flex-col` (menghidupkan `flex: 1` Radix seperti yang dirancang) dan kelas tinggi di Viewport dibuang, menyisakan `w-full min-w-[var(--radix-select-trigger-width)]`. Tinggi kini dibatasi `max-h-96` milik Content dan Viewport-lah yang meng-scroll — perilaku shadcn sebagaimana mestinya.
- **Blast radius (disengaja):** berkas ini dipakai ~28 halaman (semua form Admin, Auth/Register, Tenants, Units, dst.). Semua dropdown ikut berubah — semuanya ke arah benar: daftar tampil penuh sampai 384px lalu bisa di-scroll. Tidak ada perubahan API komponen, tidak ada halaman yang perlu ikut disesuaikan.
- **Kenapa tak pernah ketahuan sebelumnya:** sebelum #67, satu-satunya dropdown di jalur kerja harian (lapor/verifikasi) adalah `<select>` bawaan browser yang popup-nya digambar OS. Dropdown shadcn hanya dipakai di form master admin yang jarang dibuka, dan pilihannya sedikit (2–3 item) sehingga "hanya satu terlihat" terbaca sebagai daftar yang memang pendek.
- **Verifikasi:** `npm run build` lulus; bundel `select-*.js` hasil build sudah berisi `flex max-h-96 min-w-[8rem] flex-col` dan tak lagi memuat `h-[var(--radix-select-trigger-height)]`. **Verifikasi visual manual masih perlu** — buka salah satu dropdown panjang (mis. Kategori di `/admin/agencies/create`, atau "Libatkan OPD lain") dan pastikan daftar tampil penuh & bisa di-scroll.
- **Sumber:** laporan user 2026-08-19.
- **Status:** SELESAI (FIXED) 2026-08-19 — sisa verifikasi visual manual

### #70 — Master OPD kosong di lingkungan dev: panel "OPD Terkait" tak punya penjelasan apa pun
- **Severity:** P3 (bukan kerusakan data; operator hanya tidak diberi tahu kenapa pilihannya kosong)
- **Ditemukan 2026-08-19** saat menelusuri laporan user pada #69. Terbukti dari data: `sisupit_dev` punya `reports=140`, `users=29`, tapi **`agencies=0`** — `AgencySeeder` (sudah terdaftar di `DatabaseSeeder`) belum pernah dijalankan di DB itu.
- **Akar:** `ReportController::show` mengirim `agencyOptions = []` bila master OPD kosong, dan panel di `Front/Reports/Show.jsx` tetap merender pemilihnya. Dengan `<select>` bawaan hal itu tak kentara (baris placeholder `<option>` tetap terlihat); dengan dropdown shadcn yang terbuka adalah kotak kosong — tak terbedakan dari fitur rusak.
- **Fix (2026-08-19):** pemilih hanya dirender bila ada OPD yang masih bisa diminta (`addableAgencies`). Selain itu tampil kotak status bergaya sama dengan panel Armada, membedakan dua sebab: "Belum ada master OPD di wilayah ini" (+ pintasan **Kelola OPD** ke `admin.agencies.index`, hanya untuk admin/superadmin karena route-nya `role:admin|superadmin` — `petugas` boleh melibatkan OPD tapi tidak mengelola masternya) vs "Semua OPD sudah dilibatkan".
- **Catatan lingkungan:** `php artisan db:seed --class=AgencySeeder` dijalankan di `sisupit_dev` 2026-08-19 (idempoten, `firstOrCreate` per nama) → 3 contoh OPD Denpasar (BPBD/PLN/PMI, `city_code` 5171) supaya fiturnya bisa diverifikasi di lokal. Produksi/staging tidak disentuh.
- **Sumber:** penelusuran laporan user 2026-08-19.
- **Status:** SELESAI (FIXED) 2026-08-19

### #71 — Sembilan menu desktop tidak pernah muncul di ponsel (buah dari pengecualian "dua daftar")
- **Severity:** P2 (UX + kepatuhan distribusi; bukan keamanan). Ini bukan temuan baru secara konsep melainkan **biaya yang benar-benar tertagih** dari pengecualian 2026-08-13 — dan bukti bahwa peringatan di komentar `navItems.js` tidak cukup sebagai penjaga.
- **Ditemukan 2026-08-19** atas permintaan user ("cek menu di mobile, pastikan semua menu di desktop muncul di mobile"), dengan membandingkan `navItems.js` (sumber `Sidebar.jsx`) terhadap JSX statis di `MobileBottomNav.jsx`.
- **Akar:** `MobileBottomNav.jsx` menuliskan ulang seluruh daftar menu sebagai `<FloatingLink href={route(...)} label="..."/>` (baris 122–372 versi lama) plus menyalin detektor peran dari `navItems.js`. Tidak ada satu pun mekanisme yang memaksa kedua daftar sinkron, sehingga menu yang lupa ditulis hilang **tanpa gejala**: tak ada galat, tak ada test merah, hanya menu yang tidak ada.
- **Yang hilang di ponsel:**
  1. `admin.pumps` "Manajemen SKKL" (TASK_30) — admin/superadmin
  2. `admin.fire-stations` "Manajemen Pos Pemadam" — admin/superadmin
  3. `admin.agencies` "Manajemen OPD Terkait" (TASK_27) — admin/superadmin
  4. `admin.tenants` "Instansi / Kabupaten" — superadmin
  5–8. `info.help`, `info.terms`, `info.privacy`, `info.about` — semua peran (ini dampak #53 poin 1 yang memang sudah diterima saat pembalikan; satu-satunya jalur tersisa = footer `AppLayout`, harus menggulir ke dasar halaman)
  9. `register` "Daftar Baru" — tamu
- **Temuan sampingan:** popover "Menu" hanya dirender untuk admin/superadmin, jadi **petugas, pejabat, relawan, dan warga tidak punya pintu menu apa pun** di ponsel — satu-satunya jalan ke Keluar bagi mereka adalah tombol di dalam `Profile/Edit.jsx:125`. Label pun menyimpang ("Kelola Fasilitas" vs "Manajemen Hydrant", "Kelola Pengguna" vs "Manajemen Pengguna") — dua kosakata untuk satu menu.
- **Fix (2026-08-19, TASK_31, disetujui user lewat dua pertanyaan berpilihan):** isi kedua popover `MobileBottomNav.jsx` dibangun dari `buildNavSections()`. **Bentuk visualnya tidak disentuh** — tetap popover melayang buatan tangan sesuai keputusan user 2026-08-13; yang berubah hanya dari mana isinya diambil, sehingga pembalikan itu tidak dibatalkan diam-diam. Bilah memegang empat jangkar tetap (Beranda, Fasilitas, SOS, Riwayat) yang didaftar sebagai **kunci** (`BAR_ITEM_KEYS`/`FASILITAS_ITEM_KEYS`), dan slot ke-5 "Menu" — kini untuk **semua peran** — memuat semua seksi yang tersisa. Karena pembagiannya memakai daftar kunci dan bukan daftar menu, item baru di `navItems.js` otomatis mendarat di popover "Menu" tanpa perubahan apa pun di bottom-nav.
- **Penjaga:** `tests/Feature/Sisupit/MobileNavParityTest.php` — bottom-nav wajib mengimpor `buildNavSections`, dilarang memaku tujuan `route('admin.`/`route('info.`/`route('profile.`/`route('logout'`, dan setiap kunci jangkar wajib masih ada di `navItems.js`.
- **Verifikasi:** `php artisan test` 236 → **239 passed (943 assertions)**, `npm run build` lulus (client + SSR). **Verifikasi visual/interaktif manual belum dilakukan** — daftar periksa per peran ada di `prompt/tasks/TASK_31_menu_mobile_lengkap.md` §6.
- **Harga yang disetujui user:** bagi peran non-admin, "Profil" berpindah dari tautan langsung di bilah menjadi satu ketukan di dalam popover "Menu".
- **Sumber:** permintaan user 2026-08-19.
- **Status:** SELESAI (FIXED) 2026-08-19 — sisa verifikasi visual manual

### #72 — Bilah bawah ponsel memakai bahasa visualnya sendiri: "tidak menyatu dengan keseluruhan sistem"
- **Severity:** P3 (UX/konsistensi; tak ada fungsi yang rusak)
- **Dilaporkan user 2026-08-19** persis setelah #71 diperbaiki: "tombol-tombol di mobile-nya tidak menyatu terlihat dengan keseluruhan sistem". Diaudit terhadap token & komponen yang ada, delapan penyimpangan terukur:
  1. **Ukuran ikon melompat** — bilah `h-7 w-7` (28px), sedangkan sistem memakai 16px di dalam `Button` (`[&_svg]:size-4`), 18px di baris popover, 20px di `NavLink` sidebar. Elemen paling permanen di layar justru yang paling besar.
  2. **Bentuk asing** — `rounded-full` (pil lonjong) satu-satunya di aplikasi; `card.jsx` & `NavLink` `rounded-xl`, `button.jsx` & `badge.jsx` `rounded-md`.
  3. **Dua dialek "aktif" untuk menu yang sama** — sidebar `bg-destructive text-destructive-foreground` (blok solid), bilah "teks merah + `bg-destructive/10`". Beranda yang sama tampak berbeda tergantung lebar layar.
  4. **Ikon tak sinkron antar permukaan** — Beranda `IconDashboard` (sidebar) vs `IconHome` (bilah).
  5. **Satu ikon dua makna** — slot "Fasilitas" memakai `IconFiretruck`, padahal di seluruh sistem ikon itu berarti **Pos Pemadam** (`fire_stations`).
  6. **Ketebalan garis berubah saat aktif** (`stroke` 1.5 → 2) — tak ada padanannya di komponen lain; ikon seolah bergetar tiap pindah halaman.
  7. **SOS berupa raster** `/icon.png` 44px di antara empat ikon garis — tak mengikuti token tema (merahnya beku, tak berubah di mode gelap).
  8. **Panel melayang beridiom sendiri** — panah segitiga `rotate-45` + `shadow-lg`, sedangkan satu-satunya panel lain (lonceng notifikasi, `AppLayout`) memakai `DropdownMenuContent`: `rounded-xl`, `shadow-md`, tanpa panah. Baris menu 40px (< target sentuh 48px) dan label bilah 10px — padahal #37 kluster H baru saja menaikkan label status 9px → 12px karena tak terbaca.
- **Fix (2026-08-19, arah dipilih user dari tiga opsi berpratinjau):**
  - **Bilah "sebahasa sidebar"** — penanda aktif jadi kotak `rounded-xl bg-destructive` berikon putih (dialek `NavLink`), ikon 20px, `stroke` TETAP 1.75, label 12px. `SlotContent` dipakai bersama oleh tautan & pembuka popover supaya keduanya mustahil berbeda rupa.
  - **Ikonografi diselaraskan** — Beranda → `IconDashboard` (sama dengan sidebar); Fasilitas → `IconMapPin` sehingga `IconFiretruck` kembali berarti Pos Pemadam saja.
  - **SOS = lingkaran solid `bg-destructive` berisi petir putih vektor** (`IconBoltFilled`). User memilih "ikon brand di dalam lingkaran solid merah"; ternyata `/icon.png` **sendiri** sudah berupa kotak merah berpetir putih, sehingga menaruhnya di atas lingkaran merah = dua nuansa merah bertumpuk. Bentuk brand-nya digambar ulang sebagai vektor: rupanya sama, tapi merahnya memakai token `--destructive` (ikut mode gelap) dan tajam di semua kerapatan piksel. `/icon.png` tetap dipakai sebagai favicon, logo header, dan ikon launcher APK — tidak disentuh.
  - **Popover disamakan dengan dropdown sistem** — panah dibuang, wadah `rounded-xl border bg-popover shadow-md`, baris `min-h-[48px]`, judul seksi 11px. Baris aktif ikut solid merah; warna per jenis fasilitas (info/teal/volunteer) dipertahankan sebagai warna ikon saat TIDAK aktif, dan `volunteers` dikoreksi dari `text-info` ke `text-volunteer` agar seragam dengan warna relawan di peta.
- **Revisi 2026-08-19 setelah user melihat hasilnya** (tiga koreksi sekaligus):
  1. ~~**Penanda aktif jadi GARIS minimalis**~~ — dicoba lalu **ditolak user pada iterasi berikutnya** ("ternyata garis tipis tidak bagus, gunakan seperti sebelumnya yang rekomendasi seperti desktop"). Penanda aktif **kembali & final: kotak `rounded-xl bg-destructive` berikon putih**, dialek `NavLink` sidebar. Jangan hidupkan lagi varian garis.
  2. **SOS**: `/icon.png` dicoba dua ukuran (40px lalu 24px) dan tetap "belum mau menyatu". **Akar masalahnya bukan ukuran melainkan jenis aset** — `/icon.png` adalah *lockup* (petir + wadah merah menyatu dalam satu gambar), sedangkan slot navigasi lain diisi *glyph* monokrom yang mewarisi warna. Akibatnya tiga hal yang mustahil hilang dengan mengatur ukuran: (a) SOS selalu berupa blok merah padahal blok merah kini berarti "halaman aktif", jadi ia tampak aktif terus; (b) saat benar-benar aktif, kotak merah token menimpa kotak merah PNG → dua nuansa merah + dua sudut membulat; (c) tak ikut mode gelap, tak setajam vektor. Glyph monokrom (`IconBoltFilled`) sempat dipakai, lalu **user mengoreksi cara pasangnya, bukan asetnya**: "gunakan icon.png, ikonnya sebenarnya petir putih dalam kotaknya". **Keputusan final: `/icon.png` dipakai dan MENGGANTIKAN kotak ikon slot** — bukan diletakkan di dalamnya. Justru penumpukan itulah sumber "dua merah" tadi; begitu tile brand-nya diperlakukan SEBAGAI kotak slot (32px, sama tinggi dengan kotak slot lain), masalahnya hilang tanpa mengorbankan brand. Aturan turunan yang wajib dijaga: **slot itu tak boleh diberi latar merah lagi** — saat halaman `/reports/create` aktif penandanya **cincin** (`ring-2 ring-destructive/50 ring-offset-2`), bukan bidang. Slot tetap memakai komponen `NavItem` yang sama dengan slot lain (prop `imageSrc`, `ariaLabel`, `className` ditambahkan) sehingga iramanya mustahil menyimpang.
  3. **"Seolah ada 2 yang sedang aktif"** — laporan user, dan memang cacat bahasa visual: tombol pembuka popover memakai `active={isFasilitasActive || showFasilitas}`, jadi membuka panel memerahkan tombolnya dengan warna yang sama dengan penanda halaman aktif. **Best practice yang diterapkan: pisahkan "di mana saya" dari "panel ini terbuka".** Warna aksen hanya untuk lokasi (satu slot saja); panel terbuka = keadaan sesaat tombol, dinyatakan netral dengan `bg-accent` + `aria-expanded`/`aria-haspopup`. Keduanya boleh muncul bersamaan pada satu slot (sedang di `/pumps` lalu membuka panel Fasilitas) dan tetap terbaca beda. Konsekuensi turunan: hover ikut netral (`hover:text-foreground`, dulu memerah) agar merah punya satu makna, dan tautan aktif mendapat `aria-current="page"`.
- **Tidak berubah:** bentuk popover melayang (keputusan user 2026-08-13), baris popover tetap dialek `NavLink` (blok solid merah — di dalam daftar, penanda "halaman saat ini" yang lazim memang baris terisi, bukan garis), pembagian slot & sumber daftar dari #71, serta seluruh logika peran.
- **Catatan kecil (tidak dikerjakan):** kelas `no-scrollbar` yang dipakai panel ini **tidak didefinisikan di mana pun** (`resources/css/app.css` maupun `tailwind.config.js`) — sudah begitu sejak sebelum perubahan ini, jadi scrollbar bawaan tetap tampil saat panel panjang. Sengaja dibiarkan agar diff tetap fokus.
- **Verifikasi:** `php artisan test` **239 passed**, `npm run build` lulus (client + SSR), Prettier bersih. **Verifikasi visual manual belum dilakukan.**
- **Sumber:** laporan user 2026-08-19.
- **Status:** SELESAI (FIXED) 2026-08-19 — sisa verifikasi visual manual

### #73 — Chip langkah peta ber-`z-[400]` menembus SEMUA lapisan halaman (dialog "Pakai Lokasi Saat Ini" & header sticky tertimpa)
- **Severity:** P2 (UX; dialog tetap bisa ditekan, tapi tampak rusak dan teksnya tertutup)
- **Dilaporkan user 2026-08-20:** "saat klik tambah hydrant, pop up gunakan lokasi saat ini bertabrakan dengan klik area peta, geser pin pada peta".
- **Akar:** enam halaman form fasilitas (`Admin/{Hydrants,Pumps,FireStations}/{Create,Edit}.jsx`) menaruh chip "1. Klik Area Peta"/"2. Geser Pin"/"Geser pin pada peta…" di `absolute … z-[400]`. Angka 400 disalin dari **konvensi z-index internal Leaflet** (pane popup Leaflet = 700, marker = 600, dst.) — tapi chip ini bukan anak peta, melainkan saudara `div` peta di dalam wadah halaman biasa. Tak ada satu pun leluhur yang membuat *stacking context* baru, jadi 400 diadu langsung dengan lapisan aplikasi: header sticky `z-40` dan `AlertDialog` Radix (overlay + content `z-50`). Chip menang telak atas keduanya.
- **Fix (2026-08-20):** `z-[400]` → `z-10` di keenam berkas. Peta sendiri sudah `z-0`, jadi selisih 10 sudah cukup untuk menaruh chip di atas peta tanpa ikut naik ke atas dialog. Diberi komentar di tiap berkas agar angka 400 tidak kembali disalin.
- **Aturan turunan:** overlay di atas peta hanya boleh memakai z-index satu digit/puluhan; skala z-index Leaflet (400–700) berlaku **di dalam** kontainer peta, bukan untuk elemen HTML biasa yang menumpuk di atasnya.
- **Sumber:** laporan user 2026-08-20.
- **Status:** SELESAI (FIXED) 2026-08-20 — sisa verifikasi visual manual

### #74 — Geser pin: deteksi wilayah tanpa umpan balik apa pun, dan tak pernah diperiksa apakah titiknya masih di wilayah tugas
- **Severity:** P2 (UX + kualitas data)
- **Dilaporkan user 2026-08-20:** "saat pin geser area yuridiksi tidak terisi otomatis, dan tidak cek apakah sudah sesuai dengan yuridiksinya".
- **Akar (dua hal berbeda yang bergejala sama):**
  1. **Terasa tidak terisi.** `updateLocationData()` memang mengisi Area Yurisdiksi, tapi lewat reverse-geocode ke Nominatim yang di-rate-limit ~1 req/detik (`GeocodeController` memakai `Cache::lock`) lalu 1–3 `fetch` lanjutan ke `/api/regions/*`. Selama itu **tidak ada satu pun indikator**; badge tetap berbunyi "Auto-detected" seolah sudah selesai. Lebih buruk, `catch` hanya menulis ke `console.error` (di halaman Edit bahkan tak ada `console` sama sekali) — kalau Nominatim gagal/502, koordinat berpindah dan wilayah diam **tanpa pesan apa pun**.
  2. **Tidak ada pemeriksaan kecocokan.** Level yang sudah jadi wewenang admin sengaja **tidak** ikut berubah saat pin digeser (nilainya dari akun, bukan dari peta) — perilaku ini benar dan dipertahankan. Tapi karena begitu, pin bisa digeser melewati batas kabupaten dan formnya tetap terlihat wajar: kolom kunci masih menunjukkan wilayah sendiri, padahal koordinatnya sudah di kabupaten tetangga.
- **Fix (2026-08-20):**
  - Penanda `isDetecting` → badge "Mendeteksi wilayah…" berikon `IconLoader2` menggantikan badge "Auto-detected" selama proses berjalan; `finally { setIsDetecting(false) }` agar tak pernah tergantung.
  - `catch` kini juga `toast.error('Gagal mendeteksi wilayah dari titik ini. Isi Area Yurisdiksi secara manual.')` — kegagalan dikatakan apa adanya, bukan ditelan.
  - `jurisdictionMismatch()` **baru** di `resources/js/lib/utils.js`: membandingkan nama wilayah hasil reverse-geocode (yang memang sudah diambil, jadi **tanpa panggilan jaringan tambahan**) dengan nama wilayah akun untuk tiap level yang dikunci; level TERLUAR yang tak cocok yang dilaporkan (salah kabupaten lebih penting daripada salah desa tetangga). Hasilnya = `toast.warning` + kotak merah permanen di atas Area Yurisdiksi.
  - Sengaja **peringatan, bukan pemblokir**: nama OSM tidak selalu selengkap tabel `indonesia_*` (kerap hanya nama banjar yang keluar), jadi memblokir akan menghalangi pendataan yang sah. Penjaga kerasnya di server → #75.
- **Cakupan:** keenam berkas (Create + Edit) di `Admin/{Hydrants,Pumps,FireStations}`. `Admin/Hydrants/*` melayani hydrant resmi **dan** hydrant warga lewat prop `variant`, jadi keempat modul yang diminta user ikut tercakup.
- **Sumber:** laporan user 2026-08-20.
- **Status:** SELESAI (FIXED) 2026-08-20 — sisa verifikasi visual manual

### #75 — Kode wilayah anak tak pernah diadu dengan induknya di server: aset bisa tersimpan dengan kecamatan/desa milik kabupaten lain
- **Severity:** P1 (integritas data; senyap total)
- **Ditemukan 2026-08-20** saat mengerjakan #74 (permintaan user "dan tidak cek apakah sudah sesuai dengan yuridiksinya").
- **Akar:** keempat controller fasilitas (`HydrantController`, `HydrantWargaController`, `PompaController`, `PosPemadamController`) menyalin pola yang sama:
  ```php
  $validated['district_code'] = $user->district_code ?? $request->district_code;
  ```
  Aturannya ("yurisdiksi admin menang atas isi form") benar, tapi ia **hanya menjaga level yang dikunci**. Level yang masih terbuka diterima apa adanya, tanpa memeriksa apakah pilihannya masih berada di dalam level di atasnya. Admin kota Denpasar (`city_code=5171`, kecamatan/desa NULL) karena itu bisa menyimpan aset ber-`city_code` 5171 tapi `village_code` milik Badung — misalnya karena pin digeser melewati batas kota lalu auto-fill peta ikut berpindah (persis skenario #74). Barisnya tetap terlihat oleh admin itu (`Tenantable` menyaring per kota), jadi **datanya rusak tanpa gejala**: tak ada galat, tak ada test merah, dan rekap per desa/kecamatan diam-diam salah.
- **Fix (2026-08-20):** trait baru `app/Traits/ResolvesFacilityJurisdiction.php`, dipakai keempat controller (store & update):
  - Rantai kode diperiksa memakai bentuk **kode BPS** yang dipakai laravolt/indonesia — kode tiap level selalu diawali kode induknya (51 → 5171 → 5171012 → 5171012006). Jadi konsistensinya bisa dipastikan **tanpa query ke tabel `indonesia_*`** sama sekali; penting karena tabel referensi itu tidak selalu terisi di semua environment (mis. test).
  - Ketidakcocokan → `ValidationException` berbahasa Indonesia pada kolom yang bersangkutan (form Inertia menampilkannya di tempat), **bukan** diam-diam ditimpa.
  - Level atas yang kosong **diturunkan** dari level bawah yang sudah terbukti konsisten. Form fasilitas hanya mengirim desa (provinsi tidak ada di formnya), sehingga sebelum ini `province_code`/`district_code` tersimpan kosong padahal informasinya sudah ada di dalam kode desa — rekap per kecamatan jadi bolong tanpa sebab.
  - Kolom wilayah user yang berisi string kosong diperlakukan sama dengan NULL (= tidak mengunci), selaras dengan makna NULL yang sudah dipakai `Tenantable` & `User::scopeNotifiableForReport` (lihat #56, TASK_29).
- **Penjaga:** `tests/Feature/Sisupit/FacilityJurisdictionTest.php` (11 test) — desa/kecamatan/kota di luar induk ditolak di keempat modul dan tak ada baris yang tersimpan; yurisdiksi akun tetap menang atas nilai form yang dipalsukan; level atas diturunkan dari kode desa; jalur `update` ikut dijaga.
- **Tidak berubah:** `Tenantable` (visibilitas baris) dan aturan "yurisdiksi akun menang" — yang ditambahkan hanya pemeriksaan konsistensi + penurunan level atas.
- **Verifikasi:** `php artisan test` 239 → **250 passed (972 assertions)**, `npm run build` lulus (client + SSR), Pint & Prettier bersih.
- **Sumber:** turunan permintaan user 2026-08-20.
- **Status:** SELESAI (FIXED) 2026-08-20

### #76 — "status === 'Aktif'" sebagai penentu warna: begitu ada status ketiga, semua yang bukan 'Aktif' jadi merah
- **Severity:** P2 (salah baca visual; menyesatkan di layar operasional)
- **Ditemukan 2026-08-21** saat mengerjakan TASK_33, **sebelum** sempat tayang.
- **Akar:** hukum warna fasilitas ("Perbaikan = merah") ditulis di enam tempat sebagai
  kebalikannya — `status === 'Aktif' ? biru : merah` — di `Admin/Hydrants/Index.jsx` (ikon
  kartu + marker peta), `Admin/Pumps/Index.jsx` (idem), `Pages/Pumps/Index.jsx` (ikon + badge),
  dan `Components/UserLeafletMap.jsx` (marker + judul popup). Selama kosakata status hanya
  berisi dua nilai, kedua bentuk itu setara. Begitu hydrant warga mendapat status ketiga &
  keempat (`Belum Modifikasi`/`Sudah Modifikasi`, TASK_33), bentuk "bukan Aktif" langsung
  memerahkan **seluruh** hydrant warga di kartu daftar, marker peta admin, marker
  `UserLeafletMap`, dan badge halaman publik — padahal tak satu pun rusak. Di layar operasional
  merah berarti "tidak bisa dipakai", jadi keliru ini bukan sekadar kosmetik.
  `Pages/Monitoring/Map.jsx` sudah menulisnya sebagai `=== 'Perbaikan'` sejak awal dan aman —
  bukti bahwa dua bentuk yang setara hidup berdampingan tanpa ada yang menyadarinya.
- **Fix (2026-08-21):** `facilityStatusIsFaulty(status)` di `resources/js/lib/utils.js` jadi
  sumber kebenaran tunggal (`status === 'Perbaikan'`), dipakai keenam tempat.
- **Ikutan yang ditemukan bersamaan:** popup marker `UserLeafletMap` mencetak nilai status
  MENTAH (`marker.status`), sehingga satu aset berbunyi "Aktif" di peta dan "Berfungsi" di
  kartu di sebelahnya — persis keluhan yang melahirkan `facilityStatusLabel()` di TASK_30.
  Kini popup ikut memakai helper itu.
- **Aturan turunan:** warna fasilitas ditentukan dengan menanyakan **"apakah rusak?"**, tidak
  pernah dengan **"apakah nilainya 'Aktif'?"**. Menambah status baru tidak boleh mengubah warna
  status yang sudah ada.
- **Penjaga:** tidak ada test (warna murni presentasi) — dijaga oleh helper tunggal + catatan
  ini. Kalau menemukan `status === 'Aktif'` baru di kode fasilitas, itu regresi.
- **Sumber:** turunan permintaan user 2026-08-21 (TASK_33).
- **Status:** SELESAI (FIXED) 2026-08-21

### #77 — Pejabat tidak pernah menerima notifikasi apa pun, dan channel real-time-nya tertutup
- **Severity:** P2 (peran fungsional separuh mati; senyap total)
- **Ditemukan 2026-08-25** dari pertanyaan user ("apakah pejabat dapat notif jika admin broadcast?").
- **Akar (dua, berdiri sendiri):**
  1. `ReportActionController::approve()` menyaring penerima di **pemanggil**
     (`User::role('petugas')` / `User::role('relawan')`), bukan di
     `scopeNotifiableForReport`. Scope-nya sendiri sebenarnya sudah siap melayani pejabat —
     `User::STAFF_ROLES` memuatnya untuk cabang "wilayah kosong = nasional" (#56) — tapi
     cabang itu tak pernah tercapai karena perannya sudah disaring keluar lebih dulu.
     Ketiga jalur notifikasi lain (`ReportController::store`,
     `notifyCommandCenterOfConfirmation`, `notifyReporter`) sama: tak satu pun menyebut
     `pejabat`. Karena lonceng web membaca `$user->notifications()`, kotak notifikasi
     pejabat **selalu kosong** — tak ada galat, tak ada gejala.
  2. `routes/channels.php` menetapkan `$isStaff = hasAnyRole(['admin','superadmin','petugas'])`.
     Saat #41 memperluas gerbang HALAMAN detail insiden ke `pejabat`, gerbang CHANNEL tidak
     ikut diperluas. Akibatnya halaman terbuka tapi badge status & marker responder diam;
     satu-satunya jejaknya `POST /broadcasting/auth` → 403 di DevTools.
- **Pola yang berulang:** ini kekambuhan bentuk #41 — "peran baru ditambahkan di satu gerbang,
  gerbang sebelahnya tertinggal". Saat menambah peran ke sebuah kemampuan, telusuri SEMUA
  gerbang kemampuan itu: halaman, channel, notifikasi, dan navigasi.
- **Fix (2026-08-25, TASK_34):** blok penerima ketiga di `approve()` (dengan kunci setting
  sendiri `Setting::KEY_NOTIFY_LEVEL_PEJABAT`, default KABUPATEN, agar jangkauan pejabat tak
  ikut berubah saat admin menurunkan jangkauan petugas); `pejabat` masuk `$isStaff` di
  `routes/channels.php` — tetap dikunci `withinReportJurisdiction()` sehingga #31 utuh; dan
  saklar siaga `users.is_standby` dibuka untuk pejabat lewat konstanta baru
  `User::STANDBY_ROLES` (`toggleStandby` pindah dari `VolunteerController` ke
  `ProfileController`, route `volunteer.standby` → `profile.standby`).
- **Yang SENGAJA tidak dilakukan:** admin & petugas tidak diberi saklar siaga — mematikan
  notifikasi Pusat Komando berarti laporan warga bisa menganggur tanpa ada yang tahu.
- **Penjaga:** 9 test baru — `ReportNotificationLevelTest` (4), `BroadcastingAuthTest` (2),
  `UserSelfServiceAuthorizationTest` (3).
- **Verifikasi:** `php artisan test` 251 → **260 passed (1004 assertions)**, `npm run build`
  lulus (client + SSR), Pint & Prettier bersih. Verifikasi manual per peran: §6 TASK_34.
- **Sumber:** permintaan user 2026-08-25.
- **Status:** SELESAI (FIXED) 2026-08-25

### #78 — Kode desa karangan di seeder fasilitas: rekap air per desa berjudul angka
- **Severity:** P2 (data wilayah rusak diam-diam; gejalanya cuma satu judul aneh di layar)
- **Ditemukan 2026-08-25** dari laporan user: di /admin/pumps kartu "Ringkasan Air Desa"
  memuat baris berjudul `5171012001` alih-alih nama desa.
- **Akar (dua lapis, lapis kedua yang sebenarnya):**
  1. `Admin\PompaController::waterSummary()` menerjemahkan `village_code` → nama lewat
     `indonesia_villages` dan jatuh ke `?? $code` bila kodenya tak ketemu. Kode 10 digit itu
     tak berarti apa pun bagi operator, dan yang lebih buruk: ia menyamar sebagai nama desa,
     sehingga tak ada yang menyimpulkan datanya rusak.
  2. Kodenya memang tidak pernah ada. `HydrantSeeder::getWilayahCodes()` menebak desa dari
     KATA di alamat lalu mengembalikan kode yang ditulis tangan; `PompaSeeder` &
     `PosPemadamSeeder` menuliskannya langsung di tiap entri. Di DB dev: **33 dari 51**
     hydrant, 2 dari 6 pompa, dan 3 dari 7 pos memakai kode desa yang tak ada satu pun
     barisnya di `indonesia_villages`. Dari 25 baris sisanya, hampir semuanya berkode SAH
     tapi menunjuk desa yang salah (Pos "Kuta" tersimpan di TUBAN, "Mengwi" di MUNGGU, pompa
     ITDC Nusa Dua di PECATU). Bandingkan `ReportSeeder::denpasarAnchors()` yang kodenya
     benar karena diambil langsung dari `indonesia_villages` berikut centroidnya.
- **Kenapa gejalanya cuma satu baris:** kode desa yang salah tidak pernah menghentikan apa
  pun — daftar tetap tampil, peta tetap menggambar (marker pakai lat/lng), `Tenantable`
  menyaring per kota. Yang meleset senyap: rekap per desa, penyaringan per kecamatan, dan
  visibilitas bagi staf ber-kecamatan/desa (kodenya tak akan pernah cocok).
- **Fix (2026-08-25, TASK_37):**
  - layar: `waterSummary()` tidak pernah lagi menampilkan kode. Desa tak dikenal berjudul
    "Desa tidak dikenal · Kec. <nama>", kecamatannya diturunkan dari awalan kode desa;
  - data: perintah baru `php artisan sisupit:fix-facility-village-codes` (default TINJAU,
    menulis hanya dengan `--apply`) menentukan ulang desa dari TITIK fasilitas —
    reverse-geocode lewat `Api\GeocodeController` (jalur Nominatim satu-satunya, cache &
    rate-limit-nya ikut terpakai), centroid desa terdekat hanya sebagai cadangan `--offline`.
    Kode yang SAH tidak pernah ditimpa kecuali operator meminta `--include-mismatch`;
  - seeder: `HydrantSeeder::getWilayahCodes()` DIHAPUS, diganti `hydrantRegions()` — kode
    kecamatan+desa per hydrant, pasangan tetap dari `hydrantCoordinates()`, ditentukan sekali
    lewat reverse-geocode lalu di-hardcode (pola yang sama dengan koordinatnya). `PompaSeeder`
    & `PosPemadamSeeder` kodenya dibetulkan satu per satu dengan cara yang sama.
- **Aturan turunan:** kode wilayah tidak pernah ditulis dari ingatan/tebakan kata. Sumbernya
  cuma dua: dropdown wilayah (yang membaca `indonesia_*`) atau titik koordinat lewat
  geocoder. Dan tidak ada kode wilayah yang boleh sampai ke layar sebagai identitas tempat.
- **Penjaga:** `tests/Feature/Sisupit/FacilityVillageCodeRepairTest.php` (7 test).
- **Verifikasi:** `php artisan test` 263 → **270 passed**; keempat DB (dev lokal +
  prod/staging/dev VPS) dibersihkan dengan `--include-mismatch --apply` — 64 baris per env,
  cadangan mysqldump di `/root/backup-kodedesa-20260825-100727`. Sesudahnya: 0 kode desa tak
  dikenal, rantai desa↔kecamatan konsisten, jumlah baris tak berubah.
- **Sumber:** laporan user 2026-08-25.
- **Status:** SELESAI (FIXED) 2026-08-25

### #79 — `CODE_LENGTHS['district'] = 7` padahal kode kecamatan di database 6 digit
- **Severity:** P2 (menghasilkan kode kecamatan yang tak pernah cocok — belum terbukti
  menimbulkan baris rusak di data yang ada)
- **Ditemukan 2026-08-25** sambil mengerjakan #78, saat menurunkan nama kecamatan dari kode desa.
- **Akar:** `App\Traits\ResolvesFacilityJurisdiction::CODE_LENGTHS` menyatakan kecamatan
  sepanjang 7 karakter, dan komentarnya mencontohkan `5171012`. Isi database tidak begitu:
  **seluruh 7.285** baris `indonesia_districts` berkode **6** digit (`517101`), desa 10 digit
  (`5171012008`) — dan semua kolom `district_code` di data nyata (hydrants, pompas,
  pos_pemadams, reports, users) pun 6 digit. Pemeriksaan `str_starts_with()` tetap benar
  karena awalannya memang cocok, tapi `parentCode($village, 'district')` — yang dipakai
  mengisi `district_code` bila form hanya mengirim desa — menghasilkan `5171012`, kode yang
  tidak dimiliki kecamatan mana pun.
- **Akibat yang mungkin:** baris fasilitas ber-`district_code` 7 digit tak akan pernah cocok
  dengan `district_code` staf (6 digit), jadi ia hilang dari pandangan staf tingkat kecamatan
  tanpa gejala — bentuk yang sama dengan #60. Belum ada baris seperti itu di dev karena
  keempat form fasilitas selalu mengirim `district_code` dari dropdown.
- **Ikutan:** `tests/Feature/Sisupit/FacilityJurisdictionTest.php` mematok asumsi yang sama
  (`expect($hydrant->district_code)->toBe('5171012')`), jadi test-nya ikut hijau di atas
  angka yang salah — perbaikannya harus menyentuh test itu juga.
- **Asal angka 7:** tampaknya dari LEBAR KOLOM — `char('district_code', 7)` di migrasi
  `add_hierarchical_tenant_columns_to_sisupit_tables`, dan `char('code', 7)` milik paket
  laravolt sendiri. Kolom yang longgar bukan berarti kodenya sepanjang itu; panjang kode
  wilayah harus dibaca dari ISI tabel `indonesia_*`.
- **Fix (2026-08-25, TASK_38):** `CODE_LENGTHS['district']` jadi 6 + docblock diperbaiki;
  helper baru `districtCodeFromVillage()` supaya panjang kode wilayah hanya ditulis di satu
  tempat (konstanta `DISTRICT_CODE_LENGTH` sementara di `Admin\PompaController` — dibuat di
  TASK_37 saat trait belum bisa dipercaya — ikut dihapus). Kolom `char(7)` DIBIARKAN: 7 ≥ 6,
  menyempitkannya cuma ALTER banyak tabel tanpa manfaat.
- **Penjaga:** test baru di `FacilityJurisdictionTest` — *"it derives a district code that a
  real kecamatan actually has"* — mengadu kode turunan dengan tabel `indonesia_districts`,
  BUKAN dengan angka lain. Inilah bentuk test yang absen selama ini: seluruh test lama di
  berkas itu hanya membandingkan kode dengan kode, jadi mereka hijau selama semua pihak salah
  bersama-sama. Sudah dibuktikan bolak-balik: dengan konstanta 7 test ini merah, dengan 6 hijau.
- **Data:** tidak ada satu pun baris ber-`district_code` panjang ≠ 6 di dev (8 tabel diperiksa)
  — jalur turunan ini jarang tersentuh karena keempat form fasilitas selalu mengirim
  `district_code` dari dropdown. Query pemeriksaan untuk staging/produksi ada di §6 TASK_38.
- **Verifikasi:** `php artisan test` 270 → **271 passed**.
- **Status:** SELESAI (FIXED) 2026-08-25

### #80 — Nomor darurat nasional ditulis mati di 14 tempat: satu yang terlewat = dua nomor darurat
- **Severity:** P2 (tak merusak apa pun sampai nomornya berubah — lalu berubah jadi salah-informasi
  keselamatan, bukan sekadar tampilan)
- **Ditemukan 2026-08-26** saat mengerjakan permintaan user "nomor damkar 112 diganti jadi 113".
- **Akar:** angka `'112'` dipaku di **empat belas** tempat tanpa satu pun sumber bersama —
  sembilan berkas frontend (`Layouts/PublicLayout.jsx`, `Pages/Front/Reports/Create.jsx`,
  `Pages/Front/Reports/Thanks.jsx`, `Pages/Info/Help.jsx` ×3, `Pages/Info/Terms.jsx` ×3,
  `Pages/Monitoring/Map.jsx`, `Pages/Admin/Tenants/Form.jsx`), tiga controller
  (`ReportController`, `Front\MonitoringMapController`, `Front\PosPemadamController`),
  `database/seeders/TenantSeeder.php`, dan dua berkas test. Semuanya memakai angka itu untuk
  peran yang sama: **cadangan** saat `tenants.telepon_darurat` kosong.
- **Akibat:** mengganti nomornya adalah operasi yang harus tepat empat belas kali. Satu berkas
  terlewat tidak menimbulkan galat, tidak memerahkan test, dan tidak terlihat di halaman yang
  sedang dibuka — yang terjadi hanya aplikasi menyebut **dua nomor darurat berbeda** di dua
  halaman. Bentuknya sama persis dengan #71 (dua daftar menu) dan #53/#54: duplikasi yang
  membusuk tanpa gejala.
- **Ikutan yang ikut ketahuan:** kalimat penafian di `Info/Help.jsx` & `Info/Terms.jsx` berbunyi
  "telepon {nomor instansi} atau 112". Karena cadangan nomor instansi ADALAH nomor nasional,
  tenant yang belum mengisi nomornya membaca "113 atau 113".
- **Fix (2026-08-26):** konstanta tunggal `NOMOR_DARURAT_NASIONAL` di `resources/js/lib/utils.js`
  (rumah yang sudah dipakai `MAP_TILE_URL`, `GEO_OPTIONS`, `FACILITY_STATUS_LABELS`) —
  kesembilan berkas frontend membacanya dari sana. Kalimat "…atau …" kini hanya muncul bila
  nomor instansi memang berbeda dari nomor nasional.
- **SISA yang disengaja:** sisi server tetap memakai literal `'113'` di empat tempat
  (tiga controller + seeder). Menyatukannya menuntut kunci config baru + pengiriman ke frontend
  lewat `HandleInertiaRequests`, dan itu keputusan tersendiri — bukan bagian permintaan user.
  Komentar di atas konstanta menyebut keempat berkas itu agar keduanya berubah bersamaan.
- **Sumber:** permintaan user 2026-08-26.
- **Status:** SEBAGIAN (frontend FIXED, sisi server masih empat literal)

### #81 — `PublicPageHeader` kehilangan seluruh pemakainya setelah halaman info ikut wajah fasilitas
- **Severity:** P3 (kode mati, tidak ada dampak perilaku)
- **Ditemukan 2026-08-26** sebagai akibat langsung permintaan user "ganti semua tampilan pusat
  bantuan dan lain-lain konsepnya seperti fasilitas".
- **Akar:** `resources/js/Components/PublicPageHeader.jsx` (hero gradient merah + chip ikon +
  judul `text-3xl font-black`) dibuat untuk halaman fasilitas publik. Ketiga halaman fasilitas
  berhenti memakainya 2026-08-25 (TASK_35 lanjutan, penyeragaman tamu/login), sehingga
  pemakainya tinggal kelima halaman info lewat `Info/Partials/InfoShell.jsx` — dan komentar di
  ketiga berkas fasilitas serta `.claude/skills/sisupit-ui/SKILL.md` menuliskannya sebagai
  alasan komponen itu tetap hidup. Sejak InfoShell memakai `HeaderTitle`, pemakainya **nol**.
- **Kenapa TIDAK dihapus:** MASTER_PROMPT — "hapus kode hanya bila yakin mati dan jelaskan
  kenapa", dan `CLAUDE.md` menyimpan instruksi eksplisit "PublicPageHeader TETAP dipakai kelima
  halaman info/legal — jangan dihapus". Instruksi itu lahir dari konteks yang kini berubah, jadi
  pencabutannya keputusan user, bukan efek samping perubahan rupa.
- **Tindakan yang menunggu keputusan user:** hapus berkasnya, atau biarkan sebagai cadangan bila
  hero itu masih diinginkan untuk halaman pemasaran kelak.
- **Status:** OPEN (menunggu keputusan user)

### #82 — Banjar bisa tersimpan di bawah desa yang bukan miliknya
- **Severity:** P2 (data rusak diam-diam; tak ada gejala di layar)
- **Ditemukan 2026-08-26** saat user meminta pemeriksaan hasil TASK_40, dan **dibuktikan dengan
  test sementara sebelum diperbaiki**: sebuah tandon berkode desa `5171022009` tersimpan
  menunjuk banjar milik desa `5171012001` — request lolos, redirect sukses, nol galat.
- **Akar (dua lapis, keduanya perlu):**
  1. **Server** — `Admin\HydrantWargaController::validateData()` dan
     `ProfileController::storeCompleteProfile()` sama-sama hanya memakai `exists:banjars,id`.
     Rule itu membuktikan barisnya ADA, bukan bahwa ia milik desa yang sedang disimpan.
  2. **Form** — `Admin/Hydrants/{Create,Edit}.jsx`: `useEffect` yang mengikuti `village_code`
     hanya me-*refetch* daftar pilihan, **tidak pernah mengosongkan `data.banjar_id`**.
     (`Profile/CompleteProfile.jsx` justru sudah benar melakukannya sejak awal — ketiga layar
     ini lahir bersamaan tapi hanya satu yang mengosongkannya.)
- **Kenapa terjangkau tanpa request rekayasa:** menggeser pin memicu reverse-geocode yang
  menimpa `village_code` (TASK_32) SESUDAH banjar dipilih. Admin memilih desa → memilih banjar →
  menggeser pin sedikit → desanya berpindah, id banjar lamanya ikut terkirim. Ini bentuk yang
  sama dengan #78: tak ada yang menolak apa pun, yang rusak hanya rekapnya.
- **Fix (2026-08-26):**
  - `Banjar::assertBelongsToVillage()` — SATU aturan, berdiri di samping `optionsForVillage()`
    supaya "apa yang ditawarkan" dan "apa yang diterima" tak pernah berjalan sendiri-sendiri.
    Tanpa Tenantable dengan alasan yang sama (#44), dan re-check pengganti yang disyaratkan
    ATURAN EMAS #7 adalah kecocokan desa itu sendiri — syarat yang lebih sempit daripada scope
    kabupaten. `is_active` SENGAJA tidak diperiksa: itu mengatur apa yang ditawarkan, bukan apa
    yang sah, dan menonaktifkan sebuah banjar tak boleh membuat tandon lama gagal disunting.
  - `HydrantWargaController::preparedData()` — **urutannya mengikat**: banjar diadu dengan
    `village_code` HASIL `withJurisdictionCodes()`, bukan dengan isi request. Untuk admin yang
    desanya terkunci, kode dari akunnya yang tersimpan; memeriksa isi request berarti memeriksa
    kode yang bahkan tak jadi dipakai (dikunci test tersendiri).
  - Kedua form: pengosongan `banjar_id` saat desa berganti, lewat **ref** — bukan pengosongan
    tanpa syarat. Di layar Edit render pertama membawa desa DAN banjar yang sudah tersimpan,
    jadi pengosongan tanpa syarat justru menghapus banjar yang sedang dibuka.
- **Penjaga:** tiga test baru di `tests/Feature/Sisupit/BanjarMasterTest.php`, ketiganya
  **dibuktikan merah** dengan mematikan `assertBelongsToVillage()` sebelum dinyatakan selesai.
  Test 295 → 298 passed (1113 assertions).
- **Status:** FIXED

### #83 — Nama POI beraksara asing bocor ke kalimat konfirmasi **wilayah** di layar Lengkapi Profil
- **Severity:** P2 (tak merusak data, tapi terbaca sebagai aplikasi rusak tepat di layar pertama
  yang dilihat pengguna baru)
- **Dilaporkan user 2026-08-26:** "saat pertama daftar ada tulisan korea di otomatis detect
  lokasi saat akan mengisi yurisdiksi, contoh gunakan lokasi saat ini di pemogan".
- **Akar:** `resources/js/Pages/Profile/CompleteProfile.jsx` menaruh `display_name` **mentah**
  dari Nominatim ke dalam kalimat *"Lokasi terdeteksi di sekitar **X**. Wilayah di bawah sudah
  terisi otomatis"*. `display_name` **selalu diawali objek terdekat**, dan nama objek itu adalah
  tag `name` OSM apa adanya — ditulis kontributornya dalam aksara apa pun. Di koridor wisata
  Kuta–Pemogan ini bukan kasus langka; instance Nominatim kita sendiri menjawab:
  ```
  -8.69842,115.17399 → "Рынок, Jalan Pandawa, Legian, Kuta, Badung, Bali…"
  -8.70777,115.18378 → "エアアジア, Sunset Road, Kuta, Badung, Bali…"
  -8.70892,115.17216 → "Длинная улица всякого, Jalan Raya Legian…"
  ```
- **Kenapa `accept-language=id` tidak menolong** (dan kenapa memperbaikinya di
  `GeocodeController` akan salah sasaran): parameter itu hanya memilih di antara varian
  `name:<lang>` sebuah objek. Kalau tag `name` utamanya sendiri beraksara Korea/Rusia/Jepang dan
  tak ada `name:id`, string itulah yang sah dikembalikan. **Bukan bug geocoder — bug pemakai
  datanya.**
- **Akar kedua (ikut diperbaiki):** banner itu mengklaim "wilayah di bawah sudah terisi otomatis"
  **tanpa pernah memeriksa apakah pencocokan berhasil**, sehingga saat `matchRegionName()` gagal
  ia tetap tampil di atas dropdown yang kosong — dan alamat yang disebutnya memang tidak pernah
  wajib nyambung dengan apa pun yang terisi.
- **Fix (2026-08-26, TASK_42):** banner tidak lagi mengutip geocoder. Isinya dirangkai dari
  **nama wilayah hasil pencocokan** (`matchedVill/matchedDist/matchedCity/matchedProv`) — nama
  dari tabel `indonesia_*`, jadi dijamin berbahasa Indonesia **dan** dijamin sama dengan isi
  dropdown di bawahnya. Tidak ada yang cocok = banner tidak muncul. Desa gagal dicocokkan =
  satu baris tambahan yang menyuruh memilih sendiri (permintaan user).
- **SENGAJA tidak diikutkan:** `Front/Reports/Create.jsx` (`fullAddress`) dan keempat form
  fasilitas admin (`address: result?.display_name`) tetap memakai `display_name` utuh. Di sana
  yang diminta memang **alamat**, dan nama landmark — beraksara apa pun — justru menolong
  responder menemukan lokasi. Yang keliru di CompleteProfile bukan "ada nama POI", melainkan
  "nama POI dipakai sebagai judul wilayah".
- **Penjaga:** tidak ada — repo tak punya test frontend. Langkah verifikasi manual ada di
  `prompt/tasks/TASK_42_aksara_asing_deteksi_lokasi.md` §5.
- **ADENDUM 2026-08-27 (dilaporkan user, TASK_43):** kambuh di layar lain, dan penilaian awal
  "layar lain tidak terdampak" TERNYATA KELIRU. `Front/Reports/Create.jsx` menaruh
  `display_name` mentah ke panel **"Alamat Lengkap (otomatis)"** (mode input manual Pusat
  Komando), ke tombol "Salin ke patokan", ke cadangan badge lokasi, dan ke dua baris dropdown
  hasil pencarian. Lebih jauh, **enam form fasilitas admin** (`Hydrants`/`Pumps`/`FireStations`
  × Create/Edit) menyimpannya ke kolom `address` — di sana aksaranya tidak cuma tampil, ia
  MASUK KE DATA. Fix: helper tunggal `alamatTerbaca()` di `lib/utils.js` yang membuang SEGMEN
  (dipisah koma) yang memuat aksara di luar rentang Latin; sisanya utuh, termasuk diakritik
  seperti "Café Romano". Dipasang di ketujuh berkas itu. CompleteProfile TETAP memakai
  penyelesaian aslinya (nama wilayah hasil pencocokan) — di sana yang benar bukan "alamat yang
  disaring" melainkan "bukan alamat sama sekali".
- **Status:** FIXED

### #84 — Dashboard tidak pernah tahu ada kejadian sampai seseorang menekan reload
- **Severity:** P2 (fungsional; pada aplikasi kesiapsiagaan, jeda = waktu tanggap)
- **Dilaporkan user 2026-08-27:** "Dashboard auto update saat ada kejadian sekarang masih perlu
  reload".
- **Akar (dua lapis):**
  1. **Tak ada siaran saat laporan DIBUAT.** `ReportStatusChanged` baru lahir pada transisi
     BERIKUTNYA (approve/tolak/handling/resolve), jadi justru peristiwa paling penting —
     laporan darurat masuk — tidak menyiarkan apa pun.
  2. **Tak ada channel yang bisa didengar dashboard.** Satu-satunya channel yang ada,
     `report-tracking.{id}`, adalah channel PER-LAPORAN: untuk mendengarnya kita harus sudah
     tahu id laporannya, padahal yang ditunggu dashboard justru laporan yang belum ada.
     Akibatnya realtime di aplikasi ini cuma terpasang di SATU berkas (`Reports/Show.jsx`)
     sejak #28, dan keempat dashboard murni prop Inertia hasil render server.
- **Fix (2026-08-27, TASK_43):** event `ReportFeedChanged` + channel per tingkat wilayah.
  Yang MENGIKAT, dan jadi alasan bentuknya seperti ini:
  - **Saringan & channel WAJIB satu rumus.** `DashboardController` menyaring dengan "tingkat
    tersempit yang menang", rumus yang sebelumnya ditulis ulang di EMPAT tempat. Kini satu
    `User::narrowestJurisdictionColumn()`, dan `User::reportFeedChannel()` diturunkan darinya.
    Kalau saringan & channel diturunkan dari rumus berbeda, dashboard cuma DIAM saat ada
    kejadian yang sebenarnya masuk daftarnya — tanpa galat, tanpa gejala (bentuk #60/#78).
  - **Otorisasi channel tidak menulis aturannya lagi.** `routes/channels.php` membandingkan
    permintaan ke `User::reportFeedChannel()`; sebuah akun hanya boleh masuk ke channel yang
    memang jatahnya. Satu aturan, bukan dua yang bisa menyimpang.
  - **Payloadnya aba-aba, bukan data** (`reportId` + `status` saja). Penerimanya SATU WILAYAH
    PENUH, jauh lebih luas daripada channel per-laporan; yang menampilkan datanya tetap server
    lewat `router.reload()`, sehingga scope Tenantable & otorisasi halaman dihitung ulang di
    sana. Karena itu ia TIDAK digabung ke `ReportStatusChanged`, yang payloadnya memuat alasan
    penolakan — satu payload berlaku untuk semua channel sebuah event, jadi menggabungkannya
    berarti menyiarkan alasan penolakan ke seluruh wilayah.
  - **OPD tidak ikut skema wilayah.** Akun OPD sengaja tanpa kode wilayah (#44); relevansinya
    keanggotaan `report_agencies`. Ia mendengar di `reports.agency.{id}`.
- **Penjaga:** `tests/Feature/Sisupit/ReportFeedRealtimeTest.php` (13 test), yang mengadu KEDUA
  sisi — channel yang didengar akun vs channel yang dibangunkan laporan. Empat di antaranya
  **dibuktikan merah** dengan merusak `reportFeedChannel()` dan `ReportFeedChanged::for()`
  sebelum dinyatakan selesai.
- **Status:** FIXED

### #85 — Mini-stepper halaman "Laporan Diterima" berhenti selamanya di langkah pertama
- **Severity:** P3 (kosmetik, tapi menyesatkan pelapor yang sedang menunggu)
- **Dilaporkan user 2026-08-27:** "Di report/thanks auto update sesuai keadaan terkini".
- **Akar:** `Front/Reports/Thanks.jsx` menandai tahap aktif dengan `i === 0` — dipaku, bukan
  dibaca. Itu masuk akal ketika halaman ini masih layar sekali-pakai lewat flash, tapi sejak
  #38 ia jadi halaman ber-ID yang bisa dibuka ulang kapan saja: laporan yang sudah ditangani
  atau bahkan sudah selesai tetap berbunyi "Laporan Masuk". `ReportController::thanks()` bahkan
  tidak mengirim kolom `status` sama sekali, jadi datanya memang tak pernah tersedia.
- **Fix (2026-08-27, TASK_43):** `status` ikut dikirim; tahap aktif dibaca dari deret
  `STEP_STATUS` yang sejajar dengan `STEPS`; `ditolak` ditampilkan sebagai keterangan
  tersendiri karena ia jalan buntu, bukan langkah kelima. Perubahan berikutnya masuk lewat
  channel `report-tracking.{id}` dan event `ReportStatusChanged` yang **sudah ada** — pelapor
  memang sudah berhak di channel itu, jadi tak ada permukaan otorisasi baru.
- **Penjaga:** satu test di `ReportFeedRealtimeTest.php` (prop `report.status` terkirim).
  Rupa steppernya sendiri verifikasi visual.
- **Status:** FIXED
### #86 — Pin koreksi lokasi melompat kembali ke titik asal setiap tik GPS
- **Severity:** P2 (fungsional; koreksi titik TKP praktis tak bisa diselesaikan di lapangan)
- **Dilaporkan user 2026-08-27:** "Saat tiba dilokasi dan perbaiki geser titik lokasi bug
  kembali ke titik asli".
- **Akar (dua lapis, keduanya di `resources/js/Pages/Front/Reports/Show.jsx`):**
  1. **Marker TKP dibongkar-pasang tiap redraw.** Effect peta memulai kerjanya dengan
     `incidentMarkerRef.current.remove()` lalu membangun marker BARU dari
     `incidentLocation` — koordinat asal dari server.
  2. **Posisi hasil geseran tak pernah ikut menggambar apa pun.** `dragend` hanya menulis
     `pendingPosition`, state yang cuma dibaca saat tombol "Konfirmasi Lokasi" ditekan.
  Pemicunya justru orang yang sedang mengoreksi: responder ber-status `arrived` masih
  `isCurrentlyResponding`, jadi `watchPosition` miliknya memanggil `setOfficerList` tiap tik
  GPS → `officerList` ada di dependensi effect → effect jalan ulang → pin kembali ke titik
  asal. Tidak ada galat, tidak ada gejala lain: pin sekadar "menolak" digeser.
- **Fix (2026-08-27, TASK_44):** marker TKP dipakai ULANG antar redraw (pola yang memang sudah
  dipakai `renderMarker` untuk marker responder) dan posisinya diambil dari
  `pendingPosition ?? incidentLocation`, sehingga geseran jadi bagian dari sumber kebenaran
  gambar, bukan catatan di samping. Dua hal yang mengikat:
  - **`dragstart`/`dragend` menjaga `isDraggingIncidentRef`**, dan redraw tidak memanggil
    `setLatLng` selama pin sedang dipegang — tanpa ini pin direnggut kembali ke posisi lama
    persis saat jari masih menahannya.
  - **`pendingPosition` SENGAJA tidak dimasukkan ke dependensi effect**: effect itu melepas &
    menyambung ulang channel Echo dan menggambar ulang rute OSRM. Nilai terbarunya tetap
    terbaca karena dependensi lain sudah memicu render dengan closure segar.
  `setIcon()` juga tak lagi dipanggil tiap redraw (ia membangun ulang elemen DOM marker) —
  hanya saat status insiden berpindah dari/ke `resolved`.
- **Penjaga:** tidak ada — repo tak punya browser automation dan ini murni perilaku Leaflet.
  Verifikasi manual ada di file task §6.
- **Status:** FIXED

### #87 — Peta Pemantauan tak punya satu pun jalan ke detail insiden
- **Severity:** P3 (alur kerja; bukan kesalahan data)
- **Dilaporkan user 2026-08-27:** "Di peta pemantauan saat klik kejadian mengarah ke detail".
- **Akar:** marker kejadian di `resources/js/Pages/Monitoring/Map.jsx` hanya `bindPopup()`
  berisi judul/lokasi/waktu/status. Operator yang melihat titik merah di peta harus mengingat
  judulnya, pindah ke Verifikasi Laporan, lalu mencarinya di sana. `id` laporan SUDAH lama
  dikirim `MonitoringMapController` — tak ada yang kurang di sisi data.
- **Fix (2026-08-27, TASK_44):** popup mendapat tombol "Lihat Detail". Bentuknya
  **`<a href>` asli**, bukan hanya handler: popup Leaflet itu HTML mentah sehingga `<Link>`
  Inertia tak bisa dipakai, dan bila handler `popupopen` gagal terpasang tautannya tetap
  berfungsi (muat ulang penuh). Handler hanya menaikkannya jadi `router.visit()`.
  Klik marker TETAP membuka popup (keputusan user, alternatif "langsung pindah halaman"
  ditolak): info triase harus tetap terbaca tanpa meninggalkan peta, dan marker yang bertumpuk
  membuat navigasi sekali-klik rawan salah sasaran.
- **Tidak membuka apa pun yang baru:** halaman ini sudah bergerbang
  `petugas|admin|superadmin|pejabat` dan datanya ter-scope yurisdiksi di server — gerbang yang
  sama dengan `ReportController::show`.
- **Status:** FIXED

### #88 — Insiden bisa ditutup dan ditolak tanpa meninggalkan jejak siapa pelakunya
- **Severity:** P2 (akuntabilitas; keputusan yang dipertanggungjawabkan ke pimpinan)
- **Dilaporkan user 2026-08-27:** "Siapa yang klik selesai kejadian muncul dan tercatat".
- **Akar:** `ReportActionController::resolve()` hanya menulis `status = 'resolved'`. Tidak ada
  kolom pelakunya, jadi pertanyaan "siapa yang menutup insiden ini?" **tak bisa dijawab dari
  data mana pun** — bukan tersembunyi di layar, memang tak pernah disimpan. `reject()` setengah
  jalan: sejak #24 ia menyimpan `rejected_at` & `rejected_reason` (KAPAN & KENAPA) tapi tidak
  SIAPA, ketimpangan yang akan terulang setiap kali ada aksi penutup baru.
- **Fix (2026-08-27, TASK_44):** migrasi ADITIF `resolved_by`/`resolved_at`/`rejected_by`
  (nullable, `nullOnDelete`), diisi di kedua aksi, lalu ditampilkan di halaman detail insiden,
  daftar Verifikasi Laporan, dan berkas Export Excel (kolom "Ditutup Oleh", "Waktu Ditutup",
  "Ditolak Oleh"). Empat hal yang mengikat:
  - **Nama relasinya `resolver()`/`rejector()`, BUKAN `resolvedBy()`/`rejectedBy()`** seperti
    pola `ReportAgency`. Model `Report` dikirim UTUH ke halaman detail, dan relasi
    diserialisasi dengan nama ter-snake_case — `resolvedBy` akan MENIMPA kolom `resolved_by`
    di JSON sehingga atributnya berubah dari angka jadi objek tanpa galat apa pun. Pola yang
    diikuti adalah `ReportResolution::creator()` untuk `created_by`.
  - **`resolved_at` BUKAN duplikat kolom "Jam Selesai" di rekap.** Yang itu diturunkan dari
    `finished_at` responder terakhir; yang ini saat Pusat Komando menyatakan insiden ditutup.
    Keduanya bisa berjarak jauh, jadi keduanya diekspor berdampingan.
  - **Tanpa backfill.** Laporan yang ditutup/ditolak sebelum kolomnya ada memang tak diketahui
    pelakunya; layar berbunyi "tidak tercatat", tidak mengarang nama dan tidak menyembunyikan
    pertanyaannya.
  - **Audiens jejak = rekan kerja & pengawas, bukan pelapor.** Jejak penutupan memang sudah
    berada di dalam "Panel Tindakan Anda" yang bergerbang peran, jadi jejak PENOLAKAN
    mengikuti audiens yang sama lewat satu penjaga `canSeeClosureActor` — kartu "Laporan
    Ditolak" sendiri terbuka untuk pelapor, dan nama petugas penolak di sana adalah keputusan
    tersendiri. Ubah di satu tempat itu bila kelak dikehendaki lain.
- **Penjaga:** `tests/Feature/Sisupit/ReportClosureActorTest.php` (6 test, **keenamnya
  dibuktikan merah** lebih dulu). Test terakhir mengunci panjang tiga daftar berkas ekspor
  (heading, nilai per baris, lebar kolom) agar penambahan kolom berikutnya tak bisa lolos
  setengah jalan dan menggeser seluruh rekap tanpa galat.
- **Status:** FIXED
### #89 — Admin kabupaten mengelola master OPD tapi tak bisa membuatkan akunnya
- **Severity:** P3 (alur kerja; menyandera pekerjaan admin ke superadmin)
- **Dilaporkan user 2026-08-27:** "Di manajemen pengguna harus ada untuk ubah jadi opd".
- **Akar:** `Admin\UserController::assignableRoleNames()` mengembalikan
  `['masyarakat','relawan','petugas','pejabat']` untuk admin non-superadmin — `opd` tak ada di
  daftar itu, sehingga opsinya tak pernah sampai ke layar (prop `assignable_roles`) dan
  `Rule::in()` di `assignRole()` akan menolaknya andai pun dipaksa. Seluruh sisa alurnya SUDAH
  lengkap sejak TASK_27: pemilih instansi di `Admin/Users/Index.jsx`, validasi `agency_id`
  wajib, dan pelepasan tautan saat peran dipindah. Yang hilang cuma satu nama di satu array.
- **Kenapa ini janggal:** admin kabupaten justru pemegang `/admin/agencies` — ia bisa
  MENDAFTARKAN instansinya tapi tidak bisa MEMBUATKAN akunnya, sehingga tiap penambahan mitra
  harus menunggu superadmin.
- **Fix (2026-08-27, TASK_45):** `opd` masuk daftar. **Bukan eskalasi hak akses:** `opd` di
  luar `User::STAFF_ROLES` (ia tak pernah menerima siaran wilayah, #56/#44), dan penautan
  instansinya sudah dijaga `Agency::whereKey()` yang ber-`Tenantable` sehingga admin hanya bisa
  menunjuk instansi di wilayahnya sendiri. Batas lama utuh: admin tetap tak bisa mengangkat
  admin/superadmin.
- **Penjaga:** tiga test di `UserAssignRoleTest.php` — termasuk satu yang mengadu prop
  `assignable_roles` yang benar-benar sampai ke layar, bukan cuma isi konstantanya.
- **Status:** FIXED

### #90 — Tangga `if` peran menyebut OPD, pejabat, dan superadmin "Anggota Masyarakat"
- **Severity:** P2 (akun membaca dirinya sendiri sebagai peran yang salah)
- **Dilaporkan user 2026-08-27:** "Di profil masih bug untuk role nya seharusnya opd tapi masih
  muncul sebagai anggota masyarakat".
- **Akar:** `resources/js/Pages/Profile/Edit.jsx` menentukan nama peran lewat tangga tiga
  cabang: `relawan → admin/petugas → 'Anggota Masyarakat'`. Prop `auth.user.role` sebenarnya
  SUDAH membawa seluruh peran (`UserSingleResource::getRoleNames()`) — datanya tak pernah
  kurang. Yang salah bentuk kodenya: cabang terakhir bukan "tidak dikenal", melainkan sebuah
  KLAIM ("warga biasa"). Karena itu bukan cuma `opd` yang salah — `pejabat` dan `superadmin`
  pun berbunyi "Anggota Masyarakat" sejak peran-peran itu lahir, tanpa satu pun gejala.
- **Fix (2026-08-27, TASK_45):** kamus `ROLE_LABELS` + `roleLabel()`/`roleTone()` di
  `lib/utils.js`, pola yang sama dengan `facilityStatusLabel()`. Tiga hal yang mengikat:
  urutan daftarnya BERARTI (satu akun bisa berperan ganda; yang tampil adalah yang paling
  menentukan wewenangnya), peran yang tak dikenal berbunyi **"Peran belum ditetapkan"** dan
  BUKAN "Anggota Masyarakat" — mengklaim warga biasa itulah bugnya, dan lencana perisai kini
  mengikuti "bukan warga biasa" alih-alih daftar dua peran.
- **Penjaga:** `RoleLabelParityTest.php` — mengadu ROLE_LABELS dengan peran yang NYATA ada di
  `Role::where('guard_name','web')` (diseed tiap test), lalu memastikan halaman Profil tak
  menyusun namanya sendiri lagi. Membaca berkas sumber JS, pola `MobileNavParityTest`.
- **Status:** FIXED

### #91 — "Arsip & Riwayat" akun OPD selalu kosong: dua jalurnya sama-sama buntu
- **Severity:** P2 (menu yang ada tapi tak pernah berisi)
- **Dilaporkan user 2026-08-27:** "Di opd riwayatnya masih bug belum muncul".
- **Akar:** `ReportController::index()` cuma punya dua jalur, dan keduanya mustahil berisi bagi
  akun OPD:
  1. tab **"Riwayat Saya"** menyaring `user_id` — OPD tak pernah MEMBUAT laporan;
  2. tab **"Semua Laporan"** memakai `Report` ber-`Tenantable`, sedangkan akun OPD sengaja
     TANPA kode wilayah (relevansinya keanggotaan, bukan wilayah — #44), sehingga jatuh ke
     cabang `whereRaw('1 = 0')`.
  Menu "Arsip & Riwayat" sendiri memang ditawarkan ke semua akun yang login (`navItems.js`),
  jadi OPD melihat menunya, membukanya, dan selalu mendapat daftar kosong tanpa penjelasan.
- **Fix (2026-08-27, TASK_45):** cabang `agencyIndex()` — daftar insiden yang INSTANSINYA
  diminta membantu, satu-satunya bentuk riwayat yang punya arti bagi mitra luar. Gerbangnya
  keanggotaan `report_agencies`, pola yang SAMA dengan `show()` (`$isAgencyPartner`) dan
  dashboard OPD. Dua hal yang mengikat: `withoutGlobalScopes()` wajib (permintaan bantuan bisa
  datang dari kelurahan mana pun) sehingga re-check ownership-nya adalah `agency_id` akun itu
  sendiri (ATURAN EMAS #7), dan akun OPD yang **belum ditautkan** ke instansi mana pun melihat
  KOSONG — bukan melihat semuanya. Kedua tab disembunyikan lewat prop `scope: 'agency'`: tab
  yang selalu memulangkan daftar kosong terbaca sebagai bug.
- **Penjaga:** tiga test di `OpdDashboardTest.php`, termasuk satu yang memastikan
  `?filter=mine` tidak jadi celah kembali ke jalur lama.
- **Status:** FIXED

### #92 — Seluruh peta di ketiga environment tercoret "API KEY REQUIRED" milik CARTO
- **Severity:** P1 (semua peta di prod, staging, dan dev sekaligus)
- **Dilaporkan user 2026-08-27:** "di maps muncul api key required carto.com".
- **Akar:** `MAP_TILE_URL` **tidak pernah diisi di environment mana pun** — `.env` lokal
  masih mengomentarinya dan ketiga `.env` VPS pun tak memuatnya — sehingga semua peta jatuh
  ke nilai cadangan CARTO Voyager di `config/services.php` (dan kembarannya `CARTO_VOYAGER`
  di `resources/js/lib/utils.js`). Ketika CARTO mulai mewajibkan API key, tile-nya tetap
  dikirim HTTP 200 berisi peta yang benar, hanya saja **dicap tulisan miring "API KEY
  REQUIRED — carto.com/basemaps/apikey"**. Karena itu tak ada satu pun gejala teknis: tak ada
  galat, tak ada tile gagal muat, tak ada baris log. Dibuktikan dengan menarik tile Denpasar
  z13/6717/4293 langsung dari CARTO.
- **Pelajaran yang lebih besar dari bug-nya:** nilai cadangan yang menunjuk **layanan pihak
  ketiga tanpa akun** bukanlah jaring pengaman, melainkan ketergantungan yang tak tercatat.
  Selama env tak diisi, "sementara" itu jadi konfigurasi produksi yang sesungguhnya, dan
  perubahan kebijakan pihak lain mengubah ke-14 peta bersamaan. Mekanisme runtime-inject
  (TASK_25) sendiri bekerja benar — yang keliru isi cadangannya.
- **Fix (2026-08-27, TASK_46):** basemap **di-self-host** — `docker/tiles/` (TileServer-GL +
  vector tiles hasil tilemaker dari `bali.osm.pbf` milik Nominatim, style OSM Bright),
  sepola dengan `docker/nominatim/` & `docker/osrm/`. Keputusan user setelah disodori empat
  pilihan. Cadangan di `config/services.php` & `utils.js` dipindah ke tile OSM resmi — bukan
  sebagai sumber produksi, melainkan supaya environment yang lupa diisi tetap menampilkan
  peta yang terbaca, bukan peta bercap atau layar kosong.
- **Ikutan yang ikut dibetulkan:** dari 14 pemanggilan `L.tileLayer`, hanya 5 yang memasang
  `attribution` — sembilan peta lain tak menyebut OpenStreetMap sama sekali, padahal data
  tile turunan OSM mewajibkannya. Kesembilannya kini memakai string yang PERSIS sama dengan
  kelima yang sudah ada, supaya tak lahir dua kalimat atribusi berbeda di satu aplikasi.
- **Jebakan yang ditemukan saat mengerjakan (dicatat di `docker/tiles/README.md`):** tanpa
  berkas font (glyph), TileServer-GL tetap menggambar tile dengan benar — jalan, sungai,
  blok bangunan — **tapi tanpa satu pun nama jalan atau desa**, dan tak melaporkan galat
  apa pun. Style bawaan image (`basic-preview`) juga begitu. Jadi "peta polos" = periksa
  `data/fonts/`, bukan style-nya.
- **Status:** FIXED & TERPASANG 2026-08-27 di prod/staging/dev. Tile server di `/opt/geo/tiles`
  (port **8083** — 8080/8081/8082 di VPS sudah dipakai tiga instance Reverb), disajikan Nginx
  di `/tiles/` dengan `proxy_cache`. `MAP_TILE_URL` diisi di ketiga `.env`, tiap environment
  menunjuk domainnya sendiri. TANPA deploy kode, TANPA rebuild, TANPA migrasi — persis yang
  dijanjikan desain runtime-inject TASK_25. Ketiga domain: 0 rujukan `cartocdn`, tile 200.
- **Lanjutan rupa (2026-08-28, permintaan user "gunakan sisupit light"):** style peta diganti
  dari OSM Bright ke **Sisupit Light** — turunan Positron v1.9 (BSD-3) yang disetel sendiri.
  Alasannya bukan selera: di aplikasi ini **warna adalah data** (merah = kejadian, teal =
  fasilitas, ungu = relawan, biru = selesai), sedangkan OSM Bright menggambar jalan
  kuning-oranye, label cokelat-merah, dan nama POI sampai tingkat warung — basemap ikut
  berebut warna dengan marker yang harus dibaca lebih dulu. Empat kelompok perubahan dari
  Positron didokumentasikan di `docker/tiles/style/sisupit-light/README.md`.
- **Temuan ikutan yang ikut tertutup:** 16 layer OSM Bright (dan 10 layer Positron asli)
  memakai `{name:latin}
{name:nonlatin}`, jadi **nama POI beraksara Jepang/Rusia/Korea ikut
  TERGAMBAR DI DALAM GAMBAR TILE** — bentuk lain dari #83, dan di sini tak bisa disaring dari
  sisi aplikasi sama sekali karena aksaranya sudah jadi piksel sebelum sampai ke browser.
  Sisupit Light memakai `{name:latin}` saja.
- **Yang mengikat sesudah ini:** (1) **id style tetap `sisupit`** — id itu ada di dalam
  `MAP_TILE_URL` ketiga environment, jadi mengganti NAMA style berarti menyunting tiga
  `.env` di VPS, sementara mengganti ISI style tidak menyentuh apa pun; (2) style ikut REPO
  (`docker/tiles/style/`, bind mount) dengan alasan yang sama seperti `config.json` — ia
  keputusan rupa, bukan data, dan `data/` diabaikan git; (3) fontstack di style DIKUNCI ke
  Noto Sans, tidak lagi menumpang fallback dari Metropolis yang tidak kita punya, karena
  peta tanpa nama jalan adalah kegagalan yang tak melaporkan dirinya sendiri; (4) sesudah
  dipasang di server, **cache Nginx `/var/cache/nginx/tiles` wajib dikosongkan** — kalau
  tidak, tile lama masih disajikan sampai kedaluwarsa dan perubahannya terlihat
  setengah-setengah, yang mudah disalahartikan sebagai style gagal dipasang.
- **Lanjutan (2026-08-28, laporan user "tampilan full pulau balinya sangat jelek, terlalu
  rame, dan apa maksud angka2 tersebut di maps?"):** tiga sebab terpisah, dan yang terbesar
  BUKAN style. (a) angka = `{ref}` nomor rute nasional pada layer `highway_name_motorway`,
  tergambar telanjang karena style ini tak punya sprite perisai — layernya dibuang;
  (b) Positron tak memberi `minzoom` pada `place_village/suburb/other` sehingga ratusan nama
  desa berdesakan sejak z9 — kini berbatas zoom; (c) **`bali.mbtiles` dibangun TANPA
  poligon laut**, jadi laut sewarna daratan dan pulau Bali tak berbentuk sama sekali.
- **Akar (c) ada di fix #92 sendiri:** `--bbox` dipakai sebagai jalan pintas supaya tilemaker
  mau jalan tanpa shapefile pantai yang tidak diunduh. Yang tercatat waktu itu hanya "tanpa
  bbox tilemaker menolak jalan"; yang tidak tercatat adalah APA YANG HILANG karena
  shapefilenya absen — skema OpenMapTiles tidak pernah mengambil laut dari PBF.
  **Aturan turunan: sebuah flag yang dipakai untuk MELEWATI prasyarat wajib mencatat apa yang
  hilang karenanya**, kalau tidak jalan pintasnya berumur panjang tanpa gejala.
- **Jebakan kedua saat memperbaikinya:** shapefile pantai tersedia dalam 3857 & 4326.
  Tilemaker membaca koordinatnya sebagai lintang/bujur apa adanya, jadi versi **3857** (meter)
  menghasilkan poligon laut sebesar dunia yang MENUTUPI daratan — seluruh Denpasar
  berwarna laut. Kebalikan persis dari gejala semula, sama-sama HTTP 200. Pakai **4326**.
- **Pola yang layak diingat:** ketiga kegagalan basemap sejauh ini sekeluarga — font hilang
  (peta tanpa nama), pantai hilang (pulau tanpa bentuk), pantai salah proyeksi (darat tertutup
  laut). Ketiganya menjawab 200 dan tak menulis satu baris log. **Pemeriksaan yang berguna
  bukan "apakah tile-nya 200?" melainkan melihat gambarnya di zoom kota DAN zoom pulau.**
- **Latar sedunia (2026-08-28, permintaan user):** zoom keluar dari Bali dulu menampilkan
  bidang kosong. Kini ada tileset KEDUA `world.mbtiles` (z0-8, ~30 MB) berisi hanya siluet
  daratan/laut — nol data OSM, dibangun dengan `process-coastline.lua` yang memang
  mengabaikan PBF. Style membacanya sebagai sumber kedua, digambar tepat setelah `background`
  dengan `maxzoom: 13`. **Batas itu jangan dinaikkan:** garis pantai latar beresolusi z8, dan
  dipaksa ke zoom rinci ia merembes ke daratan sehingga laut menutupi tanah tepi pantai, dan
  tak ada layer apa pun yang mengecatnya kembali jadi darat.
- **Kegagalan KEEMPAT sekeluarga (2026-08-28):** sesudah style baru terpasang & terverifikasi
  di server, pengguna tetap melihat peta lama. Bukan salah pemasangan — `style.json` dan enam
  tile prod terbukti md5-identik dengan lokal. Akarnya `expires 30d` di blok Nginx `/tiles/`:
  **URL yang sama dengan isi berbeda tak akan pernah terlihat** sampai cache browser tiap
  pengguna kedaluwarsa. Mengosongkan `proxy_cache` tidak menolong (itu cache SERVER), dan
  Ctrl+Shift+R cuma menyegarkan tile yang dimuat saat itu — begitu peta digeser, tetangganya
  tetap dari cache lama. Di APK & browser HP tak ada gerakan setara sama sekali.
- **Fix & aturan tetap:** penanda versi di URL (`.../{y}{r}.png?v=20260828`) di `.env` tiap
  environment + `config:clear`. **Naikkan angkanya setiap kali style atau mbtiles berubah.**
  Bekerja tanpa deploy kode/rebuild/update APK karena halaman HTML ber-`no-cache`, jadi URL
  barunya sampai ke pengguna pada pemuatan berikutnya, termasuk di dalam WebView.
- **Pelajaran ukur-mengukur:** ukuran berkas PNG BUKAN bukti dua tile sama. Tile yang sama
  bisa keluar 27.345 B atau 28.541 B tergantung apakah ia render segar atau hasil kemasan
  ulang; diperiksa dengan `ImageChops.difference` dan **identik piksel demi piksel**. Yang sah:
  md5 pada URL yang sama, atau perbandingan piksel.

### #93 — `resources/js/lib/utils.js` memuat byte NUL mentah di dalam regex
- **Severity:** P3 (belum menimbulkan gejala; rapuh, bukan rusak)
- **Ditemukan 2026-08-27** saat mengerjakan TASK_46 — bukan bagian dari task itu, jadi
  SENGAJA tidak diperbaiki (ATURAN EMAS #6).
- **Gejalanya sekarang:** `grep` menolak membaca berkas itu sebagai teks ("Binary file
  matches"), sehingga pencarian biasa melewatinya diam-diam.
- **Akar:** konstanta `AKSARA_TAK_TERBACA` (helper `alamatTerbaca()`, TASK_43) menulis awal
  rentang kelas karakternya sebagai **byte NUL literal**, bukan escape `\0` / `\x00`.
- **Kenapa ini layak dicatat:** kalau ada tool yang membuang byte itu — prettier, editor,
  proses salin-tempel, konversi encoding — kelas karakternya berubah bentuk dan MASIH jadi
  regex yang sah, tapi bermakna lain. `alamatTerbaca()` akan mulai membuang atau meloloskan
  segmen alamat yang salah **tanpa galat apa pun**, dan gejalanya baru terlihat sebagai
  alamat aneh di form lapor & enam form fasilitas.
- **Usul fix (satu baris):** ganti byte itu dengan escape `\x00`, lalu kunci dengan test yang
  memastikan `alamatTerbaca()` membuang segmen beraksara Korea/Kana/Kiril tapi mempertahankan
  "Café Romano" (kasus yang sudah disebut TASK_43).
- **Status:** OPEN

---

### #94 — Laporan yang sudah DITOLAK berbunyi "Laporan Terverifikasi" di Verifikasi Laporan
- **Severity:** P2 (salah menyebut keadaan laporan di layar kerja operator; tanpa galat)
- **Dilaporkan user 2026-08-27**, dikerjakan sebagai TASK_48.
- **Gejala:** di `/admin/reports` (chip "Semua"), laporan berstatus `ditolak` memakai lencana
  **kuning bertuliskan "Laporan Terverifikasi"** dan pinnya kuning di peta sebaran — nama
  status lain, bukan namanya sendiri. Tak ada chip filter "Ditolak" sama sekali, jadi satu-
  satunya cara melihatnya adalah menyisir chip "Semua".
- **Akar:** `resources/js/Pages/Admin/Reports/Index.jsx:48` — halaman itu memelihara kamus
  status **sendiri** (`STATUS_META`) karena butuh warna pin/titik/legenda yang tidak
  disediakan `Components/StatusBadge.jsx`, dan kamus itu berhenti di EMPAT status. `ditolak`
  lahir di #24 tapi tak pernah menyusul ke sini. Karena `markerStyle()` dan `StatusBadge`
  lokal sama-sama bercadangan `STATUS_META[status] || STATUS_META.pending`, status yang tak
  dikenal **tidak tampil apa adanya melainkan MENGAKU jadi status lain** — bentuk yang sama
  dengan #90 (cabang terakhir sebuah tangga adalah KLAIM, bukan "tidak dikenal").
- **Layar kedua dengan akar yang sama** (ditemukan saat menelusuri, ikut diperbaiki atas
  persetujuan user): `resources/js/Pages/Monitoring/Map.jsx:23` — `REPORT_STATUS` juga
  berhenti di empat status, padahal `MonitoringMapController:26` memang mengirim laporan
  `ditolak` ke browser dan `reportHidden` menyembunyikannya sejak awal. Karena chip status
  dirender DARI daftar itu, tak ada chip untuk menyalakannya: **kejadian yang ditolak tak
  pernah bisa ditampilkan di Peta Pemantauan meski datanya sampai ke klien**, dan komentar di
  baris 117 yang berbunyi "tetap bisa dinyalakan lewat chip status" sudah lama tidak benar.
- **Fix:** entri `ditolak` (label "Ditolak", abu-abu netral sewarna `Components/StatusBadge`)
  ditambahkan ke KEDUA kamus; chip filter "Ditolak" masuk ke `STATUS_OPTIONS` + legenda peta.
  Sisi server TIDAK berubah — `Admin\ReportController::index` sudah `where('status', $status)`
  generik dan `ReportsExport::STATUS_LABELS` sudah punya `'ditolak' => 'Ditolak'` sejak
  TASK_39, jadi filter & Export Excel langsung benar.
- **Yang mengikat:** chip "Ditolak" **tidak** ditampilkan ke pemantau (pejabat/relawan,
  `canVerify=false`). Mereka memakai halaman yang sama lewat `front.reports.index`, dan
  `ReportController::index:104` menyaring `whereNotIn('status', ['TERLAPOR','ditolak'])` —
  chip yang selalu memulangkan daftar kosong terbaca sebagai bug. Keduanya kini didaftar di
  satu tempat, `MONITOR_HIDDEN_STATUSES`, yang dipakai pill maupun legenda.
- **Penjaga:** `tests/Feature/Sisupit/ReportStatusDictionaryTest.php` (4 test, TIGA
  dibuktikan merah dulu). Yang pertama sengaja **tidak** mengadu kamus dengan kamus (pelajaran
  #79): ia MENOLAK laporan lewat endpoint sungguhan, membaca status yang benar-benar tertulis
  di kolomnya, lalu menuntut kedua kamus layar mengenal string itu.
- **Status:** FIXED (TASK_48, 2026-08-27)

---

### #95 — Kolom `reports.address` memikul dua makna; "Alamat Presisi" adalah klaim tanpa penjamin
- **Severity:** P2 (menyesatkan responder soal LOKASI, dan menghapus keterangan warga tanpa jejak)
- **Dilaporkan user 2026-08-28** ("di report/show alamat presisi itu bisa jadi bug"), dikerjakan
  sebagai TASK_49.
- **Gejala:** panel **"Alamat Presisi"** di halaman detail insiden bisa (a) KOSONG padahal titik
  kejadian diketahui persis — laporan kebakaran sah tanpa patokan, sebab `ReportRequest`
  membuatnya opsional demi darurat-first; (b) berisi kalimat manusia yang menunjuk tempat lain
  dari pin di peta tepat di atasnya; atau (c) berubah sendiri jadi alamat mesin setelah
  responder mengoreksi pin. Ketiganya tanpa galat.
- **Akar:** SATU kolom, DUA penulis dengan dua makna. `ReportController::store()` menulis
  **patokan yang diketik warga** ke `reports.address`; `ReportActionController::correctLocation()`
  **menimpa kolom yang sama** dengan `display_name` Nominatim yang dikirim `Show.jsx`. Judul
  "Alamat Presisi" karena itu tidak dijamin siapa pun — bentuk yang sama dengan #90 dan #94:
  sebuah nilai mengaku jadi sesuatu yang bukan dirinya.
- **Kenapa tak bisa diperbaiki di layar saja:** alamat hasil geocode TIDAK PERNAH sampai ke
  server. `Front/Reports/Create.jsx` sudah lama menghitungnya (state `fullAddress`, tampil di
  panel "Alamat Lengkap (otomatis)" sejak TASK_28, disaring `alamatTerbaca()` sejak TASK_43)
  tapi `useForm` tak pernah mengirimkannya dan tak ada kolom yang menampungnya. Jadi
  satu-satunya alamat yang tersimpan adalah kalimat manusia — atau tidak ada sama sekali.
- **Fix:** kolom BARU `reports.geo_address` (aditif, nullable, tanpa backfill). Mesin menulis ke
  sana (form lapor & `correctLocation`), manusia tetap memegang `address`. Halaman detail jadi
  dua baris: **Alamat** (dari titik) di atas, **Patokan Lokasi** (ketikan warga) di bawah; nama
  "Patokan Lokasi" sengaja sama dengan label di form lapor (keputusan user — satu konsep, satu
  nama). Laporan lama di-reverse-geocode SEKALI saat halaman dibuka sebagai cadangan tampilan,
  tidak ditulis balik ke DB.
- **Ikutan yang wajib ikut:** SEMBILAN layar meringkas laporan jadi satu baris "di mana" dengan
  membaca `address` langsung (5× `DashboardController`, `MonitoringMapController`, prefill
  berita acara, `Admin/Reports/Index`, `ReportCard`, `Front/Reports/Index`). Begitu kolom itu
  berhenti ditimpa alamat mesin, sebagian di antaranya akan menampilkan baris KOSONG tanpa ada
  yang sadar. Aturannya kini satu tempat: `Report::alamatTampil()` (server) + `alamatLaporan()`
  (`lib/utils.js`), alamat mesin dulu & patokan sebagai cadangan.
- **Yang mengikat:** payload `IncidentLocationCorrected` ikut berganti nama `address` →
  `geoAddress`. Nama lama akan mendarat di tempat patokan di layar penerima — persis bug ini.
- **Penjaga:** `tests/Feature/Sisupit/ReportAddressPatokanTest.php` (6 test, EMPAT dibuktikan
  merah dulu), termasuk parity aturan tampil antara server & klien.
- **Status:** FIXED (TASK_49, 2026-08-28)

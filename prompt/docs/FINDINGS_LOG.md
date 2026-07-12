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
- **Kluster E — Hierarki detail laporan (FIXED 2026-07-11):** `Front/Reports/Show.jsx` panel verifikasi TERLAPOR — **satu aksi dominan** "Broadcast Misi" (`h-12`, satu-satunya tombol solid) + **Tolak diturunkan** jadi tombol teks `variant="ghost"` destructive kecil (`h-8`, "Tolak laporan"), bukan lagi dua tombol setara. Microcopy koreksi lokasi diperjelas (alasan + dampak: "Titik laporan mungkin belum tepat… agar rekan lain menuju titik yang benar"). Split kiri(Detail+Peta)/kanan(Aksi+Manifes) sudah ada → dipertajam hierarki, tak dibongkar (ATURAN EMAS #2). Build OK, **134 passed** (UI-only, tak ubah test). Sisa E opsional (reorder Aksi-first di mobile, split literal 3-kolom) belum dikerjakan — perlu keputusan bila diinginkan.
- **Kluster C — Admin = antrean triase (FIXED 2026-07-11):** `Admin/ReportController::index` default filter → **`aktif`** (bukan 'Semua') + prop `menunggu_verifikasi` (count TERLAPOR, ter-scope Tenantable, independen filter). `Admin/Reports/Index.jsx`: pill "Aktif" ditambah & jadi default; **banner "X laporan menunggu verifikasi"** (klik → filter TERLAPOR); **Export Excel dipindah ke menu kebab ⋮** (DropdownMenu, sekunder) — pemakaian DropdownMenu pertama di Pages; **chip urgensi** di kartu (umur relatif via `timeAgo` helper baru di utils, ada/tanpa foto dari kolom `photo`, "Tanpa titik"); kartu **TERLAPOR kontras** (border+bg destructive + ikon alert); tombol TERLAPOR jadi **"Tinjau & Verifikasi"** solid dominan (lainnya tetap ghost "Detail"). `ReportsExport` sudah handle 'aktif' (tak berubah). Test: +1 (`ReportExportTest` default aktif + hitung menunggu_verifikasi). Build OK, **134 passed**.
- **Sumber:** review kegunaan + review UI user 2026-07-11.
- **Status:** Kluster A, C & E FIXED (verifikasi visual pending); B, D, F–H OPEN (backlog)

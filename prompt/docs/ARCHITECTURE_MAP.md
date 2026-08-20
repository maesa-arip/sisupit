# ARCHITECTURE MAP — Sisupit

> Hasil onboarding (TASK_01, 2026-06-25). Peta faktual codebase, diverifikasi langsung
> dari kode (route:list, model, migration, test run) — bukan dari dokumen lama. Update
> saat struktur berubah. `?` menandai hal yang ambigu/perlu konfirmasi user.

## Stack & perintah

```
Stack     : PHP 8.2.26, Laravel ^11.31, Inertia v2 + React 18, Vite 6, Tailwind v3,
            Pest v3, SQLite (lokal & testing), spatie/laravel-permission ^6.17,
            laravolt/indonesia ^0.41 (data wilayah), Reverb ^1.0 (WebSocket)
Build     : npm run build            (vite build && vite build --ssr) — lihat package.json:5
Test      : php artisan test         (Pest) — status saat onboarding: 65 passed (164 assertions), 44.5s
Run (dev) : composer dev             (php artisan serve + queue:listen + pail + npm run dev, concurrently) — composer.json:71-74
Lint      : vendor/bin/pint          (PHP, ada tapi TIDAK dijalankan di CI)
            npm run format           (prettier --write — auto-fix, BUKAN check-only; tidak ada script "format:check")
            tightenco/duster terpasang di composer require-dev tapi tidak ada script duster di composer.json — pemakaiannya tidak jelas (?)
```

CI (`.github/workflows/tests.yml`) hanya menjalankan `composer install` → `npm ci` →
`npm run build` → `php artisan test`. **Tidak ada langkah lint/format-check di CI** —
Pint/Prettier/Duster terpasang tapi tidak digerbangkan.

## Struktur folder utama

```
app/
  Http/Controllers/
    Admin/        CRUD admin: User (incl. assignRole), Role, Permission, AssignPermission,
                  RouteAccess, Announcement, Hydrant, Report (index/export), Setting,
                  Agency (master OPD/instansi terkait — TASK_27)
    Front/        Controller publik: HydrantController, PompaController,
                  PosPemadamController, RelawanController,
                  MonitoringMapController (Peta Pemantauan terpadu — semua layer)
    Auth/         Breeze + SocialiteController
    Api/          FcmController (register token FCM), GeocodeController (proxy Nominatim),
                  RouteController (proxy OSRM — rute jalan asli untuk tracking peta)
    ReportController.php        CRUD laporan darurat (front-facing, milik user sendiri)
    ReportActionController.php  Workflow status: approve/reject/takeAction/cancelResponse/
                                 arrive/resolve/updateLocation/correctLocation
    ReportResolutionController.php  Berita Acara/Laporan Kegiatan Penyelamatan (FINDINGS #39):
                                 create/store/destroy + ktp (streaming KTP dari disk privat)
    DashboardController.php     3 varian dashboard berbeda per role (lihat alur di bawah)
    HomeController.php          Landing publik (/) + Spotlight (/spotlight) + chart statistik;
                                landing() redirect WebView (UA∋SisupitApp) ke spotlight/dashboard
    InfoController.php          Halaman informasi publik (TASK_19): Syarat & Ketentuan,
                                Kebijakan Privasi, Pusat Bantuan, Tentang, Paket & Lisensi —
                                isi statis di React, PIHAK-nya dari tenant + tenants.edition
    ProfileController.php       Profil user (Breeze + complete-profile + KTP)
    VolunteerController.php     Self-register relawan + toggle standby
    ReportHelperController.php  (terpisah dari ReportActionController — lihat catatan risiko)
  Models/        Agency (OPD/instansi terkait — Tenantable+SoftDeletes, TASK_27),
                 ReportAgency (pivot pelibatan OPD↔laporan, TASK_27),
                 Announcement, Pompa, PosPemadam, ReportHelper, RouteAccess,
                 SocialAccount, Unit (armada/kendaraan — Tenantable+SoftDeletes, TASK_09),
                 ReportUnit (pivot dispatch unit↔laporan, TASK_09), Hydrant, TrackingLog,
                 ReportOfficer, Report, FcmToken, Setting, User
  Policies/      UserPolicy.php — satu-satunya Policy di codebase
  Traits/
    Tenantable.php   Global scope multi-tenant hierarkis
    HasFile.php      Helper upload/update/delete file ke disk 'public'
    ResolvesFacilityJurisdiction.php  Kode wilayah saat SIMPAN aset fasilitas (2026-08-20, #75):
                     yurisdiksi akun mengunci level yang dimilikinya, level terbuka diambil dari
                     form TAPI wajib masih di dalam induknya (dicek lewat awalan kode BPS, tanpa
                     query indonesia_*), lalu level atas yang kosong diturunkan dari kode desa.
                     Dipakai HydrantController, HydrantWargaController, PompaController,
                     PosPemadamController — store & update
  Enums/         MessageType, UserGender, TenantLevel (desa/kecamatan/kabupaten/provinsi)
  Events/        ResponderLocationUpdated, IncidentLocationCorrected, ReportStatusChanged (broadcast via Reverb)
  Notifications/ EmergencyAlertNotification (FCM + database + broadcast; WebPush dimatikan, PWA dihapus)
  Helpers/helpers.php   flashMessage(), usernameGenerator()
  Http/Middleware/HandleInertiaRequests.php  shared props: auth, ziggy, flash_message, announcemet (typo, lihat anti-pola)
routes/
  web.php         Rute publik + front (reports, profile, geocode proxy, dashboard, webpush)
  admin.php       Rute /admin/* (users, roles, permissions, announcements, route-accesses, settings)
  api.php         Hampir kosong — FCM/geocode/regions sebenarnya didaftarkan di web.php
  auth.php, channels.php, console.php
resources/js/
  Pages/          Inertia pages: Admin/, Front/, Auth/, Petugas/, Profile/, Settings/ (dead, lihat CONVENTIONS)
  Components/ui/  38 komponen shadcn-style (Radix + cva)
  Layouts/        AppLayout (utama), AuthenticatedLayout (Breeze legacy), GuestLayout
                  Navigasi SEMUA UKURAN = SATU daftar di Partials/navItems.js
                  (buildNavSections), dua permukaan:
                   - Partials/Sidebar.jsx: sidebar penuh (≥lg) + rail ikon (md, `compact`)
                   - Partials/MobileBottomNav.jsx (<md): bar 5 slot dengan dua popover
                     melayang buatan tangan — bentuk pra-TASK_20 yang diminta user
                     2026-08-13 dan TETAP dipertahankan. Empat jangkar tetap (Beranda,
                     Fasilitas, SOS, Riwayat) didaftar sebagai KUNCI di BAR_ITEM_KEYS /
                     FASILITAS_ITEM_KEYS; slot ke-5 "Menu" (kini untuk SEMUA peran) memuat
                     semua seksi sisanya. Menu baru cukup ditulis di navItems.js — ia
                     otomatis mendarat di popover "Menu".
                  Pengecualian "dua daftar" 2026-08-13 DICABUT 2026-08-19 (TASK_31) setelah
                  9 menu terbukti hilang di ponsel — FINDINGS #71, #53/#54 FIXED lagi.
                  Penjaga: tests/Feature/Sisupit/MobileNavParityTest.php.
                  Partials/MobileMenuPanel.jsx + hooks/use-sheet-history.js DIHAPUS
                  2026-08-13 (sisa TASK_21; pulihkan dari commit 2a1e2b6 bila dibutuhkan).
database/
  migrations/     27 file (lihat daftar di bawah)
  seeders/        RolePermissionSeeder (sumber role & permission), PompaSeeder, HydrantSeeder, dll.
docker/nominatim/ Self-hosted geocoding (Nominatim Bali) — RUNNING lokal :8080, belum di VPS
docker/osrm/      Self-hosted routing (OSRM Bali, MLD) — RUNNING lokal :5001 (host), belum di VPS
```

## Modul & tanggung jawab

| Modul | Tanggung jawab | File kunci |
|-------|----------------|-----------|
| Laporan Darurat | CRUD laporan milik sendiri (status TERLAPOR→pending→handling→resolved/ditolak). Edit (TASK_16/#30) = pelapor saja & hanya saat TERLAPOR: konten + kelola galeri foto, lokasi tak diubah. **Penetapan lokasi punya DUA mode** (TASK_28): warga = pin peta + reverse-geocode (darurat-first, tak berubah), Pusat Komando = **pilih wilayah** provinsi→desa lalu pin melompat ke centroid `meta` wilayah terpilih (laporan lewat telepon: operator tahu nama desanya, bukan titik petanya). Gerbangnya prop `region_picker` dari `create()` — berisi yurisdiksi operator sebagai nilai awal (Bali otomatis untuk akun Bali; prefilled, **tidak** dikunci) dan `null` untuk non-staf. Di mode manual, geser pin hanya mengoreksi lat/lng — kode wilayah TIDAK ditimpa hasil geocoder | `app/Http/Controllers/ReportController.php`, `resources/js/Pages/Front/Reports/Create.jsx` |
| Workflow Respons | approve/reject/takeAction/cancelResponse/arrive/resolve/updateLocation/correctLocation. `reject` (TASK_10) = status `ditolak` (arsip). `cancelResponse` (TASK_13) = batal meluncur saat `en_route` (revert handling→pending bila responder terakhir mundur). take-action/arrive ter-scope wilayah laporan (TASK_12) | `app/Http/Controllers/ReportActionController.php` |
| OPD / Instansi Terkait | Pelibatan instansi luar Damkar (BPBD, PLN, PMI, ...) pada insiden (TASK_27). Master `agencies` ter-`Tenantable` dikelola admin di `/admin/agencies`; pelibatan per insiden di `report_agencies`. **Dua perilaku khusus disimpan sebagai DATA, bukan cabang kode** — `default_incident_types` (OPD mana tercentang otomatis untuk jenis kejadian apa; rekomendasi dihitung server lewat `Agency::recommendedIdsFor()`, tetap bisa di-uncentang operator) dan `requires_confirmation`+`confirmation_label` (mis. PLN "Listrik sudah dipadamkan di lokasi kejadian"). Karena itu **jangan pernah menulis `if ($agency->code === 'pln')`** — menambah OPD yang butuh konfirmasi harus cukup lewat admin. Pivot menyimpan SNAPSHOT nama+aturan konfirmasi agar catatan insiden lama tak berubah saat master disunting. Konfirmasi boleh dari akun OPD sendiri maupun dicatatkan operator; `confirmed_source` membedakan. Konfirmasi yang belum terpenuhi **tidak memblokir** `resolve()` — hanya peringatan di dialog penutupan | `app/Models/Agency.php`, `app/Models/ReportAgency.php`, `app/Http/Controllers/Admin/AgencyController.php`, `ReportActionController::{approve,notifyAgencies,removeAgency,confirmAgency}` |
| Berita Acara | Laporan Kegiatan Penyelamatan yang diisi petugas pasca-insiden (FINDINGS #39). Append-only: entri `sementara` (data awal) & `final` (hasil investigasi) disimpan terpisah. Korban banyak; foto KTP di disk privat + route bergerbang. `resolve()` TIDAK diubah — berita acara diisi belakangan | `app/Http/Controllers/ReportResolutionController.php`, `resources/js/Pages/Front/Reports/Resolution/Create.jsx` |
| Tracking Lokasi | Riwayat append-only + broadcast WebSocket ke command center. Status laporan juga disiarkan real-time via `ReportStatusChanged` (TASK_14) di channel privat yang sama → halaman Show update tanpa refresh | `app/Models/TrackingLog.php`, `app/Events/ResponderLocationUpdated.php`, `app/Events/ReportStatusChanged.php` |
| Fasilitas Fisik | Hydrant, Pompa, PosPemadam — CRUD admin ter-scope yurisdiksi + tampilan publik. **Hydrant ada DUA jenis dengan TABEL TERPISAH** (TASK_30): `hydrants` (resmi — instansi/PDAM) dan `hydrant_wargas` (swadaya banjar/desa, model `HydrantWarga`, route `admin.hydrant-warga.*`). Pemisahan tabel ini adalah **pengecualian aturan yang disetujui user 2026-08-19** — lihat `prompt/docs/PENGECUALIAN_ATURAN.md` #1: ia mengembarkan skema, jadi **menambah kolom hydrant berarti dua migrasi**. Yang TIDAK dikembarkan: komponen React (`Admin/Hydrants/{Index,Create,Edit}.jsx` melayani dua route lewat prop `variant`; nama route, label, **dan konfigurasi kolom per varian** ada di `Admin/Hydrants/variants.jsx`). **Sejak TASK_33 (2026-08-21) skema keduanya SENGAJA menyimpang, bukan lagi kembar:** hydrant warga memakai Sumber Air (`type` = Tandon/Groundtank), status Belum/Sudah Modifikasi, dan `capacity_liter` (simpanan, liter); kolom `water_pressure` & `debit_lpm` sudah dibuang di sana dan TETAP ada di `hydrants`. Pertanyaan saat menambah kolom karena itu bukan lagi "salin ke sebelah" melainkan "apakah konsepnya berlaku di kedua sisi?". Bagi pengguna keduanya tampak sebagai satu menu bertab. Yang membedakan **di mana ia dibaca**: hydrant warga muncul di modul **SKKL** (`Admin\PompaController` + `/pumps` + layer SKKL Peta Pemantauan), hydrant resmi di modul Hydrant (`/hydrants`). Daftar SKKL menggabungkan dua sumber **di PHP, bukan UNION SQL** — query Eloquent biasa dijamin membawa `Tenantable`, sub-query union gampang lolos darinya (#32) — lalu dipaginasi manual lewat `LengthAwarePaginator`. Bentuk barisnya satu: `Hydrant::toSkklRow()` & `Pompa::toSkklRow()` WAJIB memancarkan kunci yang sama, termasuk `source` yang menentukan tombol edit/hapus menunjuk ke resource mana. **Kosakata status** dipusatkan di `facilityStatusLabel()` (`resources/js/lib/utils.js`): pompa/pos/hydrant resmi menyimpan `Aktif`/`Perbaikan` dan berbunyi "Berfungsi"/"Tidak Berfungsi"; hydrant warga menyimpan `Belum Modifikasi`/`Sudah Modifikasi` dan berbunyi "Terdaftar Belum/Sudah Dimodifikasi". **Warna dihitung lewat `facilityStatusIsFaulty()`, JANGAN `status === 'Aktif'`** — bentuk lama menggambar seluruh hydrant warga merah hanya karena statusnya bukan 'Aktif'. Ikutannya: chip filter status di daftar SKKL (`/admin/pumps` & `/pumps`) WAJIB memuat KEEMPAT status, sebab filternya berjalan di level query atas dua tabel — chip yang tak lengkap membuang separuh daftar tanpa gejala. **Kode wilayah saat menyimpan** (2026-08-20, #75) dipusatkan di trait `ResolvesFacilityJurisdiction` — jangan lagi menulis `$user->x_code ?? $request->x_code` per controller; sisi klien memperingatkan (bukan memblokir) lewat `jurisdictionMismatch()` bila pin digeser keluar wilayah tugas | `app/Http/Controllers/Admin/{HydrantController,HydrantWargaController,PompaController,PosPemadamController}.php`, `app/Traits/ResolvesFacilityJurisdiction.php`, `app/Http/Controllers/Front/*`, `resources/js/lib/utils.js` |
| RBAC Dinamis | Role, Permission, AssignPermission, AssignUser, RouteAccess | `app/Http/Controllers/Admin/*`, `app/Policies/UserPolicy.php` |
| Multi-Tenant | Isolasi otomatis per wilayah via global scope Eloquent | `app/Traits/Tenantable.php` |
| Tenant Publik per Kabupaten | "Wajah publik" tiap Damkar kabupaten (TASK_17): nama instansi, pejabat, nomor darurat, subdomain — di-key `city_code`, dikelola superadmin di `/admin/tenants`. Di-resolve dari subdomain (`ResolveTenant` middleware → `currentTenant()` → shared prop Inertia `tenant`), apex→default Denpasar (kosmetik). Spotlight & Thanks tenant-driven; Thanks SELALU dari `city_code` LAPORAN (pin), non-partner→112. Statistik `HomeController` di-scope hanya saat request dari subdomain. Redirect-saat-save lintas-subdomain aktif bila `TENANT_BASE_DOMAIN` di-set. BUKAN `Tenantable` (katalog global). **TASK_19** menambah kolom `edition` (enum `TenantEdition` sewa/beli, default `sewa`, ter-index), `features` (json, belum ada UI), serta kontak legal `email_kontak`/`alamat_instansi`/`penanggung_jawab_data` — dipakai halaman Info; helper model `edition()`/`isBeli()`/`hasFeature()` aman saat atribut belum dimuat | `app/Models/Tenant.php`, `app/Http/Middleware/ResolveTenant.php`, `app/Http/Controllers/Admin/TenantController.php` |
| Halaman Informasi & Legal | Lima halaman publik tanpa auth (TASK_19): `/syarat-ketentuan`, `/kebijakan-privasi`, `/pusat-bantuan`, `/tentang`, `/paket-lisensi`. Isi dokumen statis di komponen React (pola `/guideline`), tetapi instansi penyelenggara diambil dari tenant hasil subdomain & klausul lisensi dari `tenants.edition` (sewa/beli) — kabupaten baru cukup diisi lewat `/admin/tenants`. Identitas penyedia sistem, versi & tanggal berlaku dokumen, retensi ada di `config/legal.php` (override lewat `.env`). Persetujuan S&K saat daftar dicatat di `users.terms_accepted_at`. **2026-08-07:** penyedia = `PT Tawarin Dimana Aja`; `/syarat-ketentuan` memuat DUA dokumen dalam satu halaman bertab — *Pengguna Umum* (warga/petugas/relawan) & *Pengguna Berkontrak* (instansi ber-PKS: wanprestasi, non-refundable, pengesampingan Ps. 1266 KUHPerdata, batas ganti rugi). Larangan resell/white-label berlaku penuh termasuk paket `beli`. Kontak legal terpisah dari dukungan teknis (`penyedia.email_legal`); `penyedia.alamat` menentukan yurisdiksi PN & baris disembunyikan bila kosong | `app/Http/Controllers/InfoController.php`, `resources/js/Pages/Info/*`, `config/legal.php` |
| Auth & Identitas | Breeze + Socialite (Google), auto-assign role `masyarakat`, validasi profil | `app/Http/Controllers/Auth/SocialiteController.php`, `app/Http/Controllers/ProfileController.php` |
| Relawan | Self-register, toggle siaga, radar insiden di area relawan. Daftar relawan (`Front/RelawanController`) BUKAN publik: di-gate `role:petugas\|admin\|superadmin` + ter-scope yurisdiksi via `User::scopeIsAdmin()` (FINDINGS #22) | `app/Http/Controllers/VolunteerController.php`, `app/Http/Controllers/Front/RelawanController.php` |
| Pengumuman | Broadcast info publik | `app/Http/Controllers/Admin/AnnouncementController.php` |
| Geocoding Proxy | Reverse & search Nominatim, cache 24h, lock rate-limit 1 req/detik. Base URL dari `config('services.nominatim.base_url')` (default LOKAL `127.0.0.1:8080`, bukan publik — hardening FINDINGS #35). Semua reverse-geocode frontend lewat proxy ini | `app/Http/Controllers/Api/GeocodeController.php` |
| Routing Proxy | Rute jalan asli OSRM (driving, geojson), cache 1h, lock throttle — dipakai peta tracking (`Reports/Show.jsx`) menggambar rute mengikuti jalan, bukan garis lurus. Base URL dari `config('services.osrm.base_url')` (default LOKAL, self-hosted `docker/osrm/`) | `app/Http/Controllers/Api/RouteController.php` |
| Basemap tiles | URL tile Leaflet terpusat di `MAP_TILE_URL` (`resources/js/lib/utils.js`) — dipakai 14 peta. Nilai di-inject RUNTIME dari `config('services.map.tile_url')` → `window.MAP_TILE_URL` (`app.blade.php`), swappable ke tile server sendiri lewat 1 env var `MAP_TILE_URL` TANPA rebuild (pola sama Nominatim/OSRM). Default = CARTO Voyager (turunan OSM). Tile ditarik BROWSER (bukan server) → tile server harus publik bila di-self-host | `resources/js/lib/utils.js`, `config/services.php`, `app/Http/Middleware`→`app.blade.php` |
| Simulasi Responden | Artisan `sisupit:simulate-responders` (live & `--snapshot`) gerakkan petugas/relawan menyusuri rute jalan asli ke TKP; seeder `ResponderSimulationSeeder` (snapshot, manual) | `app/Console/Commands/SimulateResponders.php` |
| Push Notification | FCM untuk insiden; WebPush dimatikan & PWA web dihapus. Payload `EmergencyAlertNotification::toFcm()` **data-only** + blok `android` (priority high) **dan** blok `apns` (aps.alert/sound `sirine.caf`/interruption-level `time-sensitive`, header push-type `alert`) — iOS memperlakukan pesan tanpa `aps.alert` sebagai background push yang tak menampilkan UI, jadi kedua blok wajib ada berdampingan (TASK_26). `device_type` dikirim frontend (`ios`/`android`). Lifecycle token per-DEVICE: login memindahkan token ke user aktif (`FcmController::store`), logout melepas token device ini (`AuthenticatedSessionController::destroy` menerima `fcm_token` di body) agar HP berhenti dapat sirine setelah keluar. **Permintaan bantuan ke OPD** via `AgencyDispatchNotification` (FCM+database, TASK_27) — DITUJUKAN ke akun peran `opd` milik instansi yang dipilih, bukan siaran wilayah; blok `apns` ikut disertakan (aturan TASK_26) tapi tanpa sirine karena ini koordinasi mitra, bukan panggilan meluncur. **Kabar balik DARI OPD** via `AgencyConfirmationNotification` (FCM+database, TASK_30/#63) saat tindakan berkondisi dipenuhi (mis. PLN "listrik sudah dipadamkan") — penerimanya Pusat Komando yang menaungi laporan (`notifiableForReport` dengan ceiling `KEY_NOTIFY_LEVEL_PETUGAS`, lebar yang sama dengan siaran `approve()`) **plus** petugas yang sedang menangani insiden itu (`report_officers`, karena keanggotaan bisa dari luar wilayah siaran); yang mencatat konfirmasi tidak dikabari tindakannya sendiri. Tanpa sirine — koordinasi, bukan panggilan meluncur. **Notif balik ke PELAPOR** tiap transisi status via `ReportStatusUpdatedNotification` (FCM+database, TASK_06). **Lonceng web** (TASK_11): `notifications` di-share via `HandleInertiaRequests`, ditandai-baca lewat `NotificationController` (`notifications.read`/`readAll`), ditampilkan di header `AppLayout` | `app/Notifications/EmergencyAlertNotification.php`, `app/Notifications/ReportStatusUpdatedNotification.php`, `app/Http/Controllers/NotificationController.php` |
| Dashboard per Role | Command center (admin) / misi aktif (petugas) / **permintaan bantuan instansi (peran `opd`, TASK_27 — ter-filter `agency_id`, bukan wilayah)** / riwayat+radar (publik/relawan). Mini-peta lama di dashboard admin DIHAPUS → dipindah ke Peta Pemantauan (CTA di dashboard) | `app/Http/Controllers/DashboardController.php` |
| Peta Pemantauan | Peta terpadu satu halaman: 5 layer (kejadian, hydrant, pos pemadam, pompa/SKKL, relawan), tiap layer punya filter sendiri. **Hydrant warga masuk layer SKKL, BUKAN layer hydrant** (TASK_30) — layer hydrant membaca tabel `hydrants`, hydrant warga dibaca dari `hydrant_wargas` dan ikut layer SKKL. (kejadian per status; fasilitas per status; relawan siaga/nonaktif), filtering client-side. Data ter-scope yurisdiksi di server (Report/Hydrant/Pompa/PosPemadam via Tenantable; relawan via `User::scopeIsAdmin`). Relawan tak punya GPS → diposisikan di centroid wilayah dari `indonesia_*.meta` (desa→kecamatan→kabupaten). **Keadaan awal saat halaman dibuka (2026-08-19, permintaan user):** hanya layer *Kejadian* yang menyala — hydrant/pos/SKKL/relawan mulai dari mata tertutup; di layer Kejadian hanya status berjalan (Laporan Masuk, Laporan Terverifikasi, Penanganan) yang tampil, `resolved` & `ditolak` disembunyikan tapi tetap bisa dinyalakan lewat chip. **Bahasa marker seragam:** SEMUA layer memakai lingkaran 32 px + ikon Tabler stroke putih (`glyphIcon`) — tidak ada lagi pin tetes untuk kejadian; yang membedakan hanya ikonnya (api / hydrant / pos / pompa / sosok orang) dan warna lingkarannya (kejadian = warna status `REPORT_STATUS[].marker`; fasilitas = `facilityColor`; relawan = `volunteerColor`: Siaga ungu, selain itu abu). Titik warna di legend WAJIB sewarna lingkaran markernya. Akses: `role:petugas\|admin\|superadmin\|pejabat` | `app/Http/Controllers/Front/MonitoringMapController.php`, `resources/js/Pages/Monitoring/Map.jsx` |
| Setting Global | Tingkat siaran notifikasi (superadmin-only) | `app/Models/Setting.php`, `app/Http/Controllers/Admin/SettingController.php` |

## Alur request (contoh kritikal)

**1. Buat & approve laporan darurat**
```
POST /reports/create  (throttle:report-create, 5/10menit)
  → ReportController::store (ReportRequest validasi)
  → Report::create (status default TERLAPOR/pending)
  → redirect dashboard

POST /reports/{id}/approve
  → ReportActionController::approve
  → hasAnyRole(['petugas','admin','superadmin']) check
  → Report::withoutGlobalScopes()->findOrFail($id)   (bypass Tenantable — lihat catatan)
  → DB::transaction: update status 'pending' + hitung cascade wilayah via
    Setting::KEY_NOTIFY_LEVEL_PETUGAS / _RELAWAN (TenantLevel enum)
  → User::role('petugas'|'relawan')->notifiableForReport(...)
  → Notification::send(..., EmergencyAlertNotification)  (FCM+DB+broadcast; WebPush off)
```

**2. Tracking lokasi real-time**
```
POST /reports/{id}/update-location  (tanpa nama rute, dipanggil axios background dari React)
  → ReportActionController::updateLocation
  → hasAnyRole(['petugas','relawan'])
  → DB::transaction: UPDATE posisi terkini di report_officers/report_helpers (raw DB::table)
                    + INSERT TrackingLog (append-only)
  → broadcast(ResponderLocationUpdated)  → Reverb → command center map (Leaflet)
```

**3. Otorisasi channel privat (WebSocket)**
```
POST /broadcasting/auth   (middleware web; didaftarkan lewat `channels:` di bootstrap/app.php)
  → Illuminate\Broadcasting\BroadcastController@authenticate
  → callback di routes/channels.php:
      private-App.Models.User.{id}      → id cocok dengan user login
      private-report-tracking.{report}  → pelapor  ATAU  staf (petugas/admin/superadmin)
                                          yang withinReportJurisdiction()  ATAU  anggota
                                          report_helpers (relawan yang mengambil tugas)
```
Argumen `channels:` pada `withRouting()` **wajib** — tanpa itu `routes/channels.php` tak
pernah dimuat, `/broadcasting/auth` 404, dan seluruh `Echo.private(...)` gagal diam-diam
tanpa gejala yang terlihat pengguna (FINDINGS #55, diperbaiki 2026-08-11). Callback
`report-tracking` memakai `Report::withoutGlobalScopes()->find()` supaya responder lintas
desa tetap bisa memantau; ketiga cek di dalamnya adalah re-check otorisasi manual yang
menyertai bypass itu.

## Autentikasi & otorisasi

- **Login**: Breeze (email/password) + Socialite Google (`Auth\SocialiteController`), auto-assign role `masyarakat` untuk user baru via Socialite.
- **Login Google dari aplikasi native** (`google.native` → `handleNativeGoogle`): app mengirim Google ID token, diverifikasi server-side ke `oauth2.googleapis.com/tokeninfo`. `aud` dicek terhadap **daftar putih Client ID** — `services.google.client_id` (Web, dipakai browser & Android) + `services.google.ios_client_id` (iOS, karena GIDSignIn menerbitkan token ber-`aud` iOS Client ID). `array_filter()` membuang kunci yang belum diisi agar nilai kosong tak pernah lolos; `iss`/`sub`/`email_verified` tetap divalidasi ketat. Jangan longgarkan jadi "terima semua aud" (TASK_26).
- **Role/permission**: `spatie/laravel-permission`, diseed `database/seeders/RolePermissionSeeder.php`. `Gate::before()` di `AppServiceProvider` membuat `superadmin` bypass total semua authorize check (termasuk Policy).
- **Pengecekan akses** dilakukan dengan **tiga mekanisme berbeda yang dicampur** (bukan satu pola tunggal):
  1. Middleware route: `role:admin|superadmin`, `role:superadmin` (`routes/admin.php:13,74`, `routes/web.php:39`)
  2. Manual `hasRole()`/`hasAnyRole()` di dalam method controller (`ReportActionController`, `DashboardController`)
  3. Laravel Policy (**hanya satu**: `UserPolicy` — dipakai di `UserController::edit/update/destroy` via `$this->authorize()`, `app/Http/Controllers/Admin/UserController.php:99,118,150`)
- **Multi-tenant (wilayah)**: lewat global scope `Tenantable`, **bukan** lewat permission. Lihat detail di bawah.
- Endpoint mutasi yang **tidak** punya gate sama sekali ditemukan di `UserController::store_relawan`/`store_detail_user` (lihat `FINDINGS_LOG.md` #1 — P0).

### Mekanisme `Tenantable` (`app/Traits/Tenantable.php`)
Global scope Eloquent yang otomatis menambahkan filter `WHERE *_code = ...` ke query model yang memakai trait ini, berdasarkan kolom wilayah user yang sedang login:
1. Superadmin (`hasRole('superadmin')`) → bypass total, tidak ada filter.
2. Jika user punya `village_code` → filter `village_code = user.village_code` (paling spesifik, scope berhenti di sini).
3. Else jika `district_code` → filter setingkat kecamatan.
4. Else jika `city_code` → filter setingkat kabupaten/kota.
5. Else jika `province_code` → filter setingkat provinsi.
6. User login TANPA kode wilayah sama sekali & BUKAN superadmin → **hasil KOSONG** (`whereRaw('1 = 0')`). Sebelumnya (bug, 2026-07-25) ia justru tidak terfilter = akses NASIONAL (mis. akun Google yang belum melengkapi profil melihat seluruh laporan+PII). Kini ditutup di data-layer; akses baru terbuka setelah wilayah diisi di complete-profile. Guest (auth tak login) tak masuk blok ini → halaman publik fasilitas tetap normal. Superadmin tetap bypass di langkah 1.

Model yang memakai `Tenantable`: **Report**, **Hydrant**, **Pompa**, **PosPemadam** (dua terakhir ditambah 2026-06-28 saat manajemen fasilitas Pompa/Pos diaktifkan — FINDINGS #23; kolom wilayahnya sudah ada sejak migrasi `2026_05_15_132259`). Model tenant-aware lain (`User` punya kolom wilayah tapi filter manual via `scopeIsAdmin`, bukan trait `Tenantable`) — **catat sebagai inkonsistensi** (lihat CONVENTIONS.md anti-pola).
Model yang **sengaja global** (tidak pakai Tenantable): `Setting`, `RouteAccess`, `Announcement` (lintas tenant by design — sesuai catatan di CLAUDE.md lama).

### Dua makna "kolom wilayah kosong" (`User::STAFF_ROLES`)
Kolom `*_code` yang NULL **tidak** punya satu arti. Pembedanya adalah **peran**, bukan bentuk data:
- **Peran staf** (`User::STAFF_ROLES` = superadmin/admin/petugas/pejabat) → yurisdiksi sengaja luas.
  `Admin\UserController::trimRegionToLevel()` memang meng-NULL-kan kolom di bawah tingkat yang
  diberikan; `EnsureProfileComplete` mengecualikan peran-peran ini karena itu.
- **Selain staf** (masyarakat/relawan) → profil belum lengkap, **bukan** yurisdiksi nasional.

Tingkat yurisdiksi diturunkan dari **kolom terdalam yang terisi** lewat satu sumber:
`TenantLevel::forCodes()` (dipakai `User::jurisdictionLevel()` dan `Admin\UserController::regionRank()`).
Cabang jaring pengaman "keempat kolom NULL = nasional" di `User::scopeNotifiableForReport()`
karena itu dibatasi ke `STAFF_ROLES` — sebelumnya relawan berprofil kosong ikut cabang ini dan
menerima siaran darurat se-Indonesia (FINDINGS #56, diperbaiki 2026-08-11).

### Peran `opd` & `User::CENTRALLY_MANAGED_ROLES` (TASK_27)
Akun mitra eksternal (BPBD/PLN/PMI) memakai peran `opd` + `users.agency_id`. Dua hal yang mudah
salah saat menyentuhnya:
- **`opd` TIDAK boleh dimasukkan ke `User::STAFF_ROLES`.** Konstanta itu menjawab pertanyaan lain
  ("kolom wilayah kosong = yurisdiksi nasional", #56) — akun OPD yang ikut ke sana akan menerima
  siaran darurat se-Indonesia. Yang dipakai `EnsureProfileComplete` adalah
  `User::CENTRALLY_MANAGED_ROLES` (= STAFF_ROLES + `opd`), yang hanya berarti "wilayahnya diisi
  admin, bukan lewat onboarding mandiri" — tanpa ini akun OPD kabupaten terjebak loop
  "lengkapi profil sampai desa", persis regresi petugas yang pernah terjadi.
- **Gerbang akses OPD ke detail insiden berbasis KEANGGOTAAN**, bukan wilayah: `ReportController::show`
  mengizinkan akun `opd` hanya bila ada baris `report_agencies` untuk instansinya (pola yang sama
  dengan `$isHelper` relawan). Ini re-check manual yang menyertai `withoutGlobalScopes()` di sana.

## Entitas / model data

| Entitas | Relasi penting | Catatan |
|---------|----------------|---------|
| User | hasMany Report, SocialAccount, FcmToken; belongsTo Province/City/District/Village (kode wilayah), **Agency** (`agency_id`, TASK_27 — hanya untuk peran `opd`); roles via Spatie | Tidak pakai `Tenantable`, filter wilayah manual (`scopeIsAdmin`). `terms_accepted_at` (TASK_19) = waktu persetujuan S&K+Privasi saat daftar (nullable; akun lama sengaja kosong, tanpa backfill) |
| Report | hasMany ReportHelper (`helpers()`), ReportOfficer (`officers()`), **ReportPhoto (`photos()`)**, **ReportAgency (`reportAgencies()`)**; belongsTo User + wilayah | Pakai `Tenantable` + `SoftDeletes`; status string (TERLAPOR/pending/handling/resolved/**ditolak**), bukan enum (lihat CONVENTIONS). `ditolak` (TASK_10) + kolom `rejected_reason`/`rejected_at`. Galeri foto via `report_photos` (TASK_07); kolom `photo` = sampul (foto pertama). `incident_type` (TASK_27) menyimpan jenis kejadian dari tombol pilihan cepat — sebelumnya dibuang setelah validasi; nilainya dari `Report::INCIDENT_TYPES` (sumber tunggal, dipakai `ReportRequest` & aturan auto-centang OPD). Nullable tanpa backfill: laporan lama tak menghasilkan rekomendasi OPD |
| Agency | hasMany ReportAgency, User (akun peran `opd`); relasi wilayah | Master OPD (TASK_27). `Tenantable`+SoftDeletes, `$guarded=[]`. `default_incident_types` (json, cast array) = aturan auto-centang; `requires_confirmation`+`confirmation_label` = konfirmasi berkondisi. `recommendedIdsFor()` mencocokkan di PHP (bukan `whereJsonContains`) karena dukungan JSON beda antara SQLite lokal/testing & MySQL produksi |
| ReportAgency | belongsTo Report, Agency, notifiedBy/confirmedBy (User) | Pivot pelibatan OPD (TASK_27), pola ReportUnit. `unique(report_id, agency_id)`; melepas = hapus baris. Kolom SNAPSHOT `agency_name`/`requires_confirmation`/`confirmation_label` sengaja menduplikasi master agar riwayat insiden tak ikut berubah saat master disunting. `confirmed_source` ∈ {`opd`,`operator`} |
| ReportPhoto | belongsTo Report | Galeri foto laporan (TASK_07, FINDINGS #17). Tabel `report_photos` (report_id cascade, path) |
| ReportResolution | belongsTo Report, User (creator); hasMany ReportVictim, ReportResolutionPhoto | Berita Acara/Laporan Kegiatan Penyelamatan (FINDINGS #39). **Append-only**: `report_id` TIDAK unik — banyak entri `sementara`/`final` per laporan agar bisa dibandingkan. Field terstruktur (jenis_kejadian, sumber_informasi, occurred_at, lokasi, pemilik, kerugian, tim_atensi, kronologi) |
| ReportVictim | belongsTo ReportResolution | Identitas korban per berita acara (bisa banyak). `ktp_path` di disk **privat** (`local`), hanya diakses lewat route `reports.resolution.ktp` bergerbang role+yurisdiksi (PII) |
| ReportResolutionPhoto | belongsTo ReportResolution | Foto kejadian per berita acara (disk public, pola report_photos) |
| ReportOfficer | belongsTo Report, User | Eloquent model ADA, tapi `ReportActionController` mengakses tabel `report_officers` via `DB::table()` mentah, bukan model ini — dua jalur akses ke data yang sama |
| ReportHelper | belongsTo Report, User; fillable: location_lat, location_lng, status | Dipakai sebagai Eloquent di `ReportHelperController`, tapi sebagai raw table di `ReportActionController` — sama seperti di atas |
| TrackingLog | belongsTo Report, User | Append-only (riwayat GPS), tidak ada update/delete |
| Hydrant, Pompa, PosPemadam | relasi wilayah (province/city/district/village); Pompa & PosPemadam pakai SoftDeletes | Ketiganya kini pakai `Tenantable`+kolom wilayah. Pompa/PosPemadam: kolom GPS aslinya `lat`/`lng` (BUKAN `location_lat/lng` — `$fillable` lama salah, sudah diperbaiki ke `$guarded=[]`, FINDINGS #23). **Hydrant (TASK_30)** dapat `water_pressure` (`Keras`/`Sedang`/`Kecil`, nullable = belum disurvei) dan `debit_lpm` (liter/menit, opsional — angkanya dipegang PDAM). Satuan `debit_lpm` sengaja sama dengan `pompas.capacity_lpm` supaya rekap per desa bisa menjumlahkan keduanya tanpa konversi. **Sejak TASK_33 `hydrant_wargas` TIDAK lagi ikut** — angkanya `capacity_liter` (simpanan) dan liter tak boleh dijumlahkan dengan liter/menit, jadi `Admin\PompaController::waterSummary` (dulu `debitSummary`) mengirim DUA pasang angka per desa, dipisahkan kunci `water_metric` dari `toSkklRow()` (bukan `source`). Keduanya juga mengirim `unknown_debit`/`unknown_capacity` agar total tak dibaca sebagai angka pasti padahal ia batas bawah |
| HydrantWarga | relasi wilayah; `Tenantable`, `$guarded=[]` | Tandon/groundtank swadaya warga (TASK_30, tabel `hydrant_wargas`). Tabelnya terpisah dari `hydrants` — pengecualian aturan yang disetujui user, lihat `prompt/docs/PENGECUALIAN_ATURAN.md` #1. **Sejak TASK_33 (2026-08-21) kosakatanya SENGAJA berbeda**, bukan lagi kembaran: `type` = Sumber Air (`HydrantWarga::WATER_SOURCES` = Tandon/Groundtank), `status` = `HydrantWarga::STATUSES` (Belum/Sudah Modifikasi — yang ditanya bukan "rusak atau tidak" melainkan apakah mulutnya sudah bisa dihisap mobil pemadam), `capacity_liter` = simpanan air dalam LITER dan **WAJIB** di `HydrantWargaController` (rekap air desa berdiri di atasnya). Kolom `water_pressure` & `debit_lpm` sudah dibuang di sini. `toSkklRow()` membuatnya berdampingan dengan `Pompa` di daftar/peta SKKL: `source` = `hydrant_warga`, `water_metric` = `capacity` (penentu angkanya boleh dijumlahkan dengan angka mana) |
| Setting | tidak ada relasi (key-value cache, `Setting::getValue/setValue`) | Global, bukan per-tenant — dipakai untuk `KEY_NOTIFY_LEVEL_PETUGAS`/`_RELAWAN` |
| RouteAccess | belongsTo Role, Permission | Global, kontrol akses per nama rute |
| Announcement | tidak ada relasi | Global, broadcast publik, dipakai di shared prop `announcemet` (typo, lihat anti-pola) |
| Unit | hasMany ReportUnit; belongsTo PosPemadam (homebase, nullable); relasi wilayah; `Tenantable`+SoftDeletes, `$guarded=[]` | Katalog armada/kendaraan (TASK_09). Status: `available`/`dispatched`/`maintenance`. CRUD admin ter-scope via `Admin\UnitController`; dispatch/release via `ReportActionController` |
| ReportUnit | belongsTo Report, Unit; `$guarded=[]`; casts dispatched_at/released_at | Pivot pengerahan unit ke insiden (TASK_09). Status pivot: `dispatched`/`released`. Auto-released saat laporan `resolve()` |
| Skill | — (master global, bukan Tenantable) | Master keahlian relawan (tabel `skills`, `name` unik). `Skill::options()` = daftar nama terurut+cache, sumber tunggal untuk editor keahlian dashboard relawan, validasi `VolunteerController::updateSkills`, & filter keahlian `Front\RelawanController`. Diseed `SkillSeeder`. `users.skills` tetap JSON array label (bukan FK) |
| FcmToken, SocialAccount | belongsTo User | Token push & akun sosial |

## Endpoint / route

Total **107 route terdaftar** (`php artisan route:list`, dijalankan saat onboarding). Ringkasan grup:

```
Catatan: `/api/regions/{cities,districts,villages}` mengembalikan BARIS PENUH tabel laravolt,
termasuk kolom `meta` (JSON `{lat,long}`, terisi 100% di keempat tingkat) — itulah sumber
centroid yang dipakai pemilih wilayah manual TASK_28, jadi tak perlu endpoint koordinat baru.

Publik (tanpa auth)     : GET / (landing publik; WebView UA∋SisupitApp di-redirect ke
                           /spotlight atau /dashboard via HomeController::landing),
                           /spotlight, /home, /relawan, /relawan/{id}, /pumps,
                           /fire-stations, /hydrants, /login, /register, /forgot-password,
                           /api/regions/{cities,districts,villages}, /webpush/public-key,
                           /syarat-ketentuan, /kebijakan-privasi, /pusat-bantuan, /tentang,
                           /paket-lisensi (TASK_19 — sengaja publik: dokumen legal harus
                           terbaca sebelum daftar & syarat Google OAuth/Play Store),
                           /openssl-test  (?? debug leftover — lihat FINDINGS_LOG #3)
auth (login saja)       : POST /fcm-token, POST /notifications/{id}/read & /notifications/read-all
                           (lonceng web, TASK_11), POST /webpush/subscribe (tanpa middleware 'auth'
                           padahal memanggil $request->user() — lihat FINDINGS_LOG #4)
auth+verified           : /dashboard, /reports/* (CRUD milik sendiri + approve/reject/take-action/
                           cancel-response/dispatch-unit/release-unit/agencies[POST/DELETE]/
                           agencies/confirm (OPD terkait TASK_27 — notify & remove = Pusat Komando
                           dalam yurisdiksi; confirm juga boleh dari akun OPD yang bersangkutan,
                           otorisasi dicek di controller)/arrive/resolve/update-location/
                           correct-location/resolution[create,store,destroy]/victims/{v}/ktp
                           — 4 terakhir = Berita Acara FINDINGS #39, staf+yurisdiksi), /profile/*,
                           /complete-profile, /volunteer/register, /volunteer/standby,
                           /helpers/create, /users/relawan/{user}, /users/detail/{user}
                           (2 terakhir TANPA role check — FINDINGS_LOG #1, P0)
auth (login saja)       : /api/geocode/{reverse,search}, /api/route/directions (proxy OSRM)
role:petugas|admin|superadmin|pejabat : /peta-pemantauan (front.monitoring.map — Peta Pemantauan terpadu)
role:admin|superadmin   : /admin/users/*, /admin/facilities (dead, no view),
                           /admin/hydrants/* (resource), /admin/hydrant-warga/* (resource,
                           TASK_30 — hydrant swadaya warga, tabel terpisah), /admin/pumps/* (resource),
                           /admin/fire-stations/* (resource), /admin/units/* (resource, TASK_09),
                           /admin/agencies/* (resource, TASK_27 — master OPD terkait),
                           /admin/reports/*
role:superadmin (admin.php): /admin/announcements/*, /admin/roles/*, /admin/permissions/*,
                           /admin/assign-permissions/*, /admin/route-accesses/* (FINDINGS #21)
role:superadmin         : /admin/settings (GET/PUT)
```

## Test

- Framework: Pest v3 + `pest-plugin-laravel`. Test domain spesifik di `tests/Feature/Sisupit/`
  (RoleAccess, ReportCreation, ReportActionAuthorization, AdminTenantScope, ReportOwnership,
  SocialiteDefaultRole, GeocodeController, ReportRateLimit).
- DB testing: SQLite in-memory (`.env.testing`, `DB_DATABASE=:memory:`), terpisah dari dev DB.
- **Hasil run saat onboarding (2026-06-25): 65 passed, 164 assertions, ~44.5s. Tidak ada test merah/skip.**
- Cakupan: auth bypass, IDOR laporan, tenant scope, role check workflow respons — **cakupan baik untuk
  area yang sudah pernah jadi insiden** (lihat memori sesi sebelumnya), tapi **tidak ada test untuk
  `UserController::store_relawan`/`store_detail_user`** (area temuan baru #1) maupun untuk
  `DashboardController` reports feed (#2).
- Tidak ada test frontend (no Jest/Vitest/Playwright terpasang).

## Catatan & area berisiko

1. **`withoutGlobalScopes()` selalu butuh re-check otorisasi manual** — konvensi yang sudah ada
   (lihat `ReportController::authorizeReportAccess`), tapi **2 controller baru ditemukan melanggar
   pola ini secara berbeda** (bukan `withoutGlobalScopes` tapi tetap menerima `User $user` dari
   route-model-binding tanpa authorize) — lihat FINDINGS_LOG #1.
2. **Dua jalur akses ke `report_officers`/`report_helpers`** (Eloquent model vs `DB::table()` mentah)
   — risiko drift logika bisnis (validasi/cast yang ada di model tidak berlaku saat lewat `DB::table()`).
3. **`DashboardController::index` "Semua Laporan" feed** mem-bypass `Tenantable` total dan mengirim
   kolom mentah (termasuk `phone`, `name`, alamat presisi) ke SEMUA user login (masyarakat/relawan)
   tanpa filter wilayah maupun Resource transform — beda perilaku dengan `nearbyEmergencies` di
   fungsi yang sama yang justru sengaja difilter per wilayah relawan. Perlu konfirmasi user apakah
   "lihat semua laporan nasional" memang fitur yang diinginkan untuk warga biasa.
4. **RBAC dicampur 3 cara** (middleware, manual hasRole, satu Policy) — saat menambah endpoint baru,
   gampang lupa salah satu pola karena tidak ada satu titik enforcement.
5. **`routes/api.php` hampir kosong** — endpoint nyata didaftarkan session-based di `web.php`. Belum
   ada keputusan auth pattern (session vs Sanctum) untuk konsumen mobile/eksternal di masa depan.

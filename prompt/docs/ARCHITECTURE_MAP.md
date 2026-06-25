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
    Admin/        CRUD admin: User, Role, Permission, AssignPermission, AssignUser,
                  RouteAccess, Announcement, Hydrant, Report (index/export), Setting
    Front/        Controller publik: HydrantController, PompaController,
                  PosPemadamController, RelawanController
    Auth/         Breeze + SocialiteController
    Api/          FcmController (register token FCM), GeocodeController (proxy Nominatim)
    ReportController.php        CRUD laporan darurat (front-facing, milik user sendiri)
    ReportActionController.php  Workflow status: approve/takeAction/arrive/resolve/
                                 updateLocation/correctLocation
    DashboardController.php     3 varian dashboard berbeda per role (lihat alur di bawah)
    HomeController.php          Landing page publik + chart statistik
    ProfileController.php       Profil user (Breeze + complete-profile + KTP)
    VolunteerController.php     Self-register relawan + toggle standby
    ReportHelperController.php  (terpisah dari ReportActionController — lihat catatan risiko)
  Models/        Announcement, Pompa, PosPemadam, ReportHelper, RouteAccess,
                 SocialAccount, Unit (stub kosong, tidak dipakai), Hydrant, TrackingLog,
                 ReportOfficer, Report, FcmToken, Setting, User
  Policies/      UserPolicy.php — satu-satunya Policy di codebase
  Traits/
    Tenantable.php   Global scope multi-tenant hierarkis
    HasFile.php      Helper upload/update/delete file ke disk 'public'
  Enums/         MessageType, UserGender, TenantLevel (desa/kecamatan/kabupaten/provinsi)
  Events/        ResponderLocationUpdated, IncidentLocationCorrected (broadcast via Reverb)
  Notifications/ EmergencyAlertNotification (FCM + database + broadcast; WebPush dimatikan, PWA dihapus)
  Helpers/helpers.php   flashMessage(), usernameGenerator(), signatureMidtrans() (lihat anti-pola)
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
database/
  migrations/     27 file (lihat daftar di bawah)
  seeders/        RolePermissionSeeder (sumber role & permission), PompaSeeder, HydrantSeeder, dll.
docker/nominatim/ Artifact self-hosted geocoding (docker-compose + .env.example + README), belum di-deploy
```

## Modul & tanggung jawab

| Modul | Tanggung jawab | File kunci |
|-------|----------------|-----------|
| Laporan Darurat | CRUD laporan milik sendiri (status TERLAPOR→pending→handling→resolved) | `app/Http/Controllers/ReportController.php` |
| Workflow Respons | approve/takeAction/arrive/resolve/updateLocation/correctLocation | `app/Http/Controllers/ReportActionController.php` |
| Tracking Lokasi | Riwayat append-only + broadcast WebSocket ke command center | `app/Models/TrackingLog.php`, `app/Events/ResponderLocationUpdated.php` |
| Fasilitas Fisik | Hydrant, Pompa, PosPemadam — CRUD admin + tampilan publik | `app/Http/Controllers/Admin/HydrantController.php`, `app/Http/Controllers/Front/*` |
| RBAC Dinamis | Role, Permission, AssignPermission, AssignUser, RouteAccess | `app/Http/Controllers/Admin/*`, `app/Policies/UserPolicy.php` |
| Multi-Tenant | Isolasi otomatis per wilayah via global scope Eloquent | `app/Traits/Tenantable.php` |
| Auth & Identitas | Breeze + Socialite (Google), auto-assign role `masyarakat`, validasi profil | `app/Http/Controllers/Auth/SocialiteController.php`, `app/Http/Controllers/ProfileController.php` |
| Relawan | Self-register, toggle siaga, radar insiden di area relawan | `app/Http/Controllers/VolunteerController.php` |
| Pengumuman | Broadcast info publik | `app/Http/Controllers/Admin/AnnouncementController.php` |
| Geocoding Proxy | Reverse & search Nominatim, cache 24h, lock rate-limit 1 req/detik | `app/Http/Controllers/Api/GeocodeController.php` |
| Push Notification | FCM (native Android) untuk insiden; WebPush dimatikan & PWA web dihapus. Lifecycle token per-DEVICE: login memindahkan token ke user aktif (`FcmController::store`), logout melepas token device ini (`AuthenticatedSessionController::destroy` menerima `fcm_token` di body) agar HP berhenti dapat sirine setelah keluar | `app/Notifications/EmergencyAlertNotification.php` |
| Dashboard per Role | Command center (admin) / misi aktif (petugas) / riwayat+radar (publik/relawan) | `app/Http/Controllers/DashboardController.php` |
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

## Autentikasi & otorisasi

- **Login**: Breeze (email/password) + Socialite Google (`Auth\SocialiteController`), auto-assign role `masyarakat` untuk user baru via Socialite.
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
6. User tanpa kode wilayah sama sekali (admin nasional) → otomatis tidak terfilter (tidak ada kolom yang match), efeknya sama dengan bypass meski bukan superadmin — **ini bukan flag eksplisit, implisit dari null check** (`?` — perlu dikonfirmasi apakah ini sengaja).

Model yang memakai `Tenantable`: **Report**, **Hydrant**. Model tenant-aware lain (`User` punya kolom wilayah tapi filter manual via `scopeIsAdmin`, bukan trait `Tenantable`) — **catat sebagai inkonsistensi** (lihat CONVENTIONS.md anti-pola).
Model yang **sengaja global** (tidak pakai Tenantable): `Setting`, `RouteAccess`, `Announcement` (lintas tenant by design — sesuai catatan di CLAUDE.md lama).

## Entitas / model data

| Entitas | Relasi penting | Catatan |
|---------|----------------|---------|
| User | hasMany Report, SocialAccount, FcmToken; belongsTo Province/City/District/Village (kode wilayah); roles via Spatie | Tidak pakai `Tenantable`, filter wilayah manual (`scopeIsAdmin`) |
| Report | hasMany ReportHelper (`helpers()`), ReportOfficer (`officers()`); belongsTo User + wilayah | Pakai `Tenantable`; status string (TERLAPOR/pending/handling/resolved), bukan enum (lihat CONVENTIONS) |
| ReportOfficer | belongsTo Report, User | Eloquent model ADA, tapi `ReportActionController` mengakses tabel `report_officers` via `DB::table()` mentah, bukan model ini — dua jalur akses ke data yang sama |
| ReportHelper | belongsTo Report, User; fillable: location_lat, location_lng, status | Dipakai sebagai Eloquent di `ReportHelperController`, tapi sebagai raw table di `ReportActionController` — sama seperti di atas |
| TrackingLog | belongsTo Report, User | Append-only (riwayat GPS), tidak ada update/delete |
| Hydrant, Pompa, PosPemadam | tidak ada relasi signifikan; Pompa & PosPemadam pakai SoftDeletes | Hydrant pakai `Tenantable`+wilayah; Pompa/PosPemadam tidak punya kolom tenant sama sekali (?) |
| Setting | tidak ada relasi (key-value cache, `Setting::getValue/setValue`) | Global, bukan per-tenant — dipakai untuk `KEY_NOTIFY_LEVEL_PETUGAS`/`_RELAWAN` |
| RouteAccess | belongsTo Role, Permission | Global, kontrol akses per nama rute |
| Announcement | tidak ada relasi | Global, broadcast publik, dipakai di shared prop `announcemet` (typo, lihat anti-pola) |
| Unit | — | **Stub kosong, tidak dipakai di mana pun** — kandidat dead code |
| FcmToken, SocialAccount | belongsTo User | Token push & akun sosial |

## Endpoint / route

Total **107 route terdaftar** (`php artisan route:list`, dijalankan saat onboarding). Ringkasan grup:

```
Publik (tanpa auth)     : GET / (spotlight), /home, /relawan, /relawan/{id}, /pumps,
                           /fire-stations, /hydrants, /login, /register, /forgot-password,
                           /api/regions/{cities,districts,villages}, /webpush/public-key,
                           /openssl-test  (?? debug leftover — lihat FINDINGS_LOG #3)
auth (login saja)       : POST /fcm-token, POST /webpush/subscribe (tanpa middleware 'auth'
                           padahal memanggil $request->user() — lihat FINDINGS_LOG #4)
auth+verified           : /dashboard, /reports/* (CRUD milik sendiri + approve/take-action/
                           arrive/resolve/update-location/correct-location), /profile/*,
                           /complete-profile, /volunteer/register, /volunteer/standby,
                           /helpers/create, /users/relawan/{user}, /users/detail/{user}
                           (2 terakhir TANPA role check — FINDINGS_LOG #1, P0)
                           /api/geocode/{reverse,search}
role:admin|superadmin   : /admin/users/*, /admin/announcements/*, /admin/roles/*,
                           /admin/permissions/*, /admin/assign-permissions/*,
                           /admin/assign-users/*, /admin/route-accesses/*,
                           /admin/facilities, /admin/hydrants/* (resource), /admin/reports/*
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

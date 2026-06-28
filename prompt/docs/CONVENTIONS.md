# CONVENTIONS — Sisupit

> Pola yang **WAJIB ditiru** saat mengedit repo ini, diturunkan dari kode yang sudah ada
> (diverifikasi langsung saat onboarding, 2026-06-25) — bukan preferensi umum.

## Backend

| Aspek | Konvensi repo ini | Contoh file |
|-------|-------------------|-------------|
| Layering | Controller gemuk langsung ke Model/Eloquent — tidak ada Service/Repository layer | `app/Http/Controllers/ReportActionController.php` |
| Validasi | **Campuran**: Form Request untuk CRUD admin (`UserRequest`, `ReportRequest`, `AnnouncementRequest`), inline `$request->validate()` untuk aksi non-CRUD (`ProfileController`, `ReportActionController::updateLocation/correctLocation`) | `app/Http/Requests/Admin/UserRequest.php`; `app/Http/Controllers/ReportActionController.php:145` |
| Otorisasi | **Tiga jalur dicampur**: middleware route (`role:admin\|superadmin`), manual `hasRole()`/`hasAnyRole()` di awal method, dan SATU Laravel Policy (`UserPolicy`, via `$this->authorize()`) — tidak ada pola tunggal yang konsisten di semua controller | `app/Http/Controllers/Admin/UserController.php:99` (`authorize`) vs `app/Http/Controllers/ReportActionController.php:22` (manual `hasAnyRole`) |
| Bypass tenant scope | `Model::withoutGlobalScopes()->findOrFail($id)` **wajib** diikuti re-check otorisasi/ownership eksplisit — pernah jadi sumber bug IDOR (lihat memori sesi sebelumnya), jangan dihapus tanpa pengganti | `app/Http/Controllers/ReportController.php:217` (`authorizeReportAccess`) |
| Format response | Inertia response (`inertia('Namespace/Page', [...])`) untuk halaman; `response()->json()` polos (tanpa envelope `{success,data}`) untuk endpoint AJAX (`updateLocation`, `geocode`, `webpush/subscribe`) | `app/Http/Controllers/ReportActionController.php:188`; `app/Http/Controllers/Api/GeocodeController.php` |
| Penanganan error | `try/catch` per-method di controller (bukan exception handler terpusat khusus), pesan ke user via `flashMessage(MessageType::ERROR->message(error: $e->getMessage()))` — **menampilkan `$e->getMessage()` mentah ke user**, bukan pesan ramah generik | `app/Http/Controllers/Admin/UserController.php:213-224` (`store_relawan` catch block) |
| Flash message | Helper `flashMessage($message, $type='success')` (BUKAN `session()->flash()` langsung) → di-share ke frontend lewat prop Inertia `flash_message` (dipetakan dari session key `message`/`type`, nama berbeda dari helpernya — lihat anti-pola) | `app/Helpers/helpers.php:5-10`; `app/Http/Middleware/HandleInertiaRequests.php:44-47` |
| Penamaan | snake_case untuk nama method controller non-standar (`store_relawan`, `store_detail_user`) berdampingan dengan camelCase resource standar (`store`, `update`) — **tidak konsisten** | `app/Http/Controllers/Admin/UserController.php:213,230` |
| Status/enum | **Campuran**: `Report::status` adalah string mentah (`'TERLAPOR'`, `'pending'`, `'handling'`, `'resolved'`, `'ditolak'`) — TIDAK pakai PHP enum, padahal enum lain (`MessageType`, `TenantLevel`, `UserGender`) sudah ada dan dipakai konsisten. **Saat menambah status baru, perbarui SEMUA peta status**: `Components/StatusBadge.jsx`, StatusBadge lokal `Reports/Index.jsx`, `getReportStatus` di `Reports/Show.jsx`, `getStatusConfig` di `ReportCard.jsx`, + filter feed (`ReportController::index`, `DashboardController`) | `app/Enums/TenantLevel.php` (enum yang benar) vs `app/Http/Controllers/ReportActionController.php:29` (string mentah) |
| Upload file | Trait `HasFile` (`upload_file`/`update_file`/`delete_file`), disk `public` — bukan logic upload manual | `app/Traits/HasFile.php` |
| Scope query reusable | `scopeFilter()` dan `scopeSorting()` di model untuk pencarian/sorting dari query string (`search`, `field`, `direction`) | model mana pun dengan listing admin, mis. `app/Models/Hydrant.php` |
| Rate limit aksi sensitif | `RateLimiter::for()` di `AppServiceProvider::boot()` — saat ini hanya **satu** limiter: `report-create` (5/10menit per user/IP) | `app/Providers/AppServiceProvider.php:34-36` |
| Setting global vs tenant | `Setting::getValue()`/`setValue()` (cache permanen, invalidate saat set) untuk kebijakan lintas-tenant — jangan dicampur dengan data per-tenant yang harus pakai `Tenantable` | `app/Models/Setting.php` |
| Region/wilayah | Selalu `*_code` (province/city/district/village_code), relasi ke tabel `indonesia_*` (package `laravolt/indonesia`) | migrasi `2026_05_15_132259_add_hierarchical_tenant_columns_to_sisupit_tables.php` |
| Uang | **Tidak ada alur uang aktif.** Sisa scaffolding Midtrans (paket `midtrans/midtrans-php`, helper `signatureMidtrans()`, config `services.midtrans`, key `.env`, script `snap.js` di layout) sudah **dihapus total** 2026-06-27 (lihat FINDINGS_LOG #15). Yang tersisa hanya `formatToRupiah()` di frontend (kosmetik). Jangan asumsikan ada flow pembayaran | — |

## Frontend

| Aspek | Konvensi repo ini | Contoh file |
|-------|-------------------|-------------|
| Pemanggilan API | `useForm()` dari `@inertiajs/react` langsung di komponen halaman, tidak ada service layer. `axios` dipakai ad-hoc untuk endpoint non-Inertia (region dropdown, geocode) | `resources/js/Pages/Front/Reports/Create.jsx` |
| Loading state | `useForm().processing` untuk disable tombol submit — tidak ada komponen skeleton/spinner global yang dipakai konsisten (`Components/ui/skeleton.jsx` ada tapi adopsinya tidak menyeluruh) | `resources/js/Pages/Admin/Users/Create.jsx:314` |
| Empty state | Ad-hoc per halaman (teks fallback langsung di JSX), bukan komponen reusable; `CommandEmpty` hanya untuk combobox | `resources/js/Components/ui/combobox.jsx` |
| Error state | `<InputError message={errors.fieldname} />` membaca `useForm().errors` dari validasi server | `resources/js/Components/InputError.jsx`; dipakai di `Admin/Users/Create.jsx:134` |
| Toast/notifikasi | `sonner`, `<Toaster position="top-center" richColors />` di-mount sekali di `AppLayout`. **Pola wajib per form**: di `onSuccess` callback `post()/put()/delete()`, panggil `flashMessage(success)` (dari `lib/utils.js`, baca `props.flash_message`) lalu `toast[flash.type](flash.message)` — ini BUKAN listener global, jadi **harus ditambahkan manual di setiap form** | `resources/js/Layouts/AppLayout.jsx:5,100`; pola di `resources/js/Pages/Admin/Announcements/Create.jsx:31-34` |
| Form & validasi | Inertia `useForm()` + error dari server — `zod` ada di package.json tapi hanya dipakai untuk skema internal `data-table.jsx`, **tidak pernah** untuk validasi form manapun | `resources/js/Components/data-table.jsx:47` |
| Warna/token | CSS variable HSL di `:root` (`resources/css/app.css`), dipetakan ke Tailwind theme (`tailwind.config.js`) — tidak ada hex mentah/arbitrary color yang ditemukan saat sampling | `resources/css/app.css:6-49`; `tailwind.config.js:27-93` |
| Konfirmasi destruktif | `AlertDialog` dari `Components/ui/alert-dialog` sebelum `router.delete()` — pola konsisten di semua halaman admin CRUD | `resources/js/Pages/Admin/Users/Index.jsx:207-245` |
| Layout & navigasi | `AppLayout` (utama, sidebar+header, dipakai Admin & Front) vs `AuthenticatedLayout` (Breeze default, **legacy**, navbar saja) vs `GuestLayout`. Sidebar (`Partials/Sidebar.jsx`) dikondisikan oleh `auth.role` (array) dari shared prop | `resources/js/Layouts/AppLayout.jsx:21,113,159-163` |
| State/data fetching | Tidak ada react-query/redux — state lokal `useState` + props Inertia (server-driven) | seluruh `resources/js/Pages/**` |
| Format tanggal | `Intl.DateTimeFormat('id-ID', ...)` manual per halaman — `date-fns` ada di package.json tapi **tidak dipakai di mana pun** | `resources/js/Pages/Admin/Dashboard.jsx:19` |
| Format uang | `formatToRupiah()` di `lib/utils.js` — **dead code, tidak dipakai di mana pun** (tidak ada alur uang aktif) | `resources/js/lib/utils.js:18-26` |
| Map (Leaflet) | Diwire manual per halaman (`useRef` + `useEffect`, akses `window.L` langsung), tidak ada komponen Map reusable — `UserLeafletMap.jsx` generik tapi `Admin/Dashboard.jsx` punya implementasi Leaflet sendiri yang terpisah | `resources/js/Components/UserLeafletMap.jsx`; `resources/js/Pages/Admin/Dashboard.jsx:14-89` |
| Komponen library | shadcn-style (Radix UI + `class-variance-authority`) di `resources/js/Components/ui/*` (38 komponen) | `resources/js/Components/ui/` |

## Git / commit

- Pesan commit pendek, Bahasa Indonesia, deskriptif tanpa prefix konvensional (`feat:`/`fix:`)
  — contoh dari history: "perbaikan notif web push ke notif app", "penambahan fcm".
- Branch kerja: `main` langsung (tidak terlihat pola feature-branch dari history terbaru); ada
  commit lama "merge perbaikan cek role dev ke main" yang menunjukkan branch `dev` pernah dipakai.
- `public/build` (hasil `npm run build`) **ter-track di git** (baris `.gitignore` untuk itu
  dikomentari) — `npm run build` ulang akan menghasilkan diff besar (~240 file hash baru).
  Kemungkinan deploy tanpa build step di host produksi — **jangan jalankan `npm run build` lalu
  commit hasilnya tanpa konfirmasi user**, kecuali memang itu tujuan task.

## ANTI-POLA YANG ADA DI REPO (jangan ditiru, jangan diperluas)

- **Endpoint mutasi tanpa authorize sama sekali**: `UserController::store_relawan` &
  `store_detail_user` menerima `User $user` dari route-model-binding (sama seperti
  `edit`/`update`/`destroy` di controller yang sama) tapi **tidak** memanggil
  `$this->authorize()` — lihat `FINDINGS_LOG.md` #1 (P0). Saat menambah method baru yang
  menerima model user lain di controller ini, **selalu** ikuti pola `edit()`/`update()` yang
  benar (authorize dulu), bukan pola dua method ini.
- **Bypass `Tenantable` tanpa filter pengganti** untuk feed publik: `DashboardController`
  "Semua Laporan" mengirim kolom PII mentah (`phone`, `name`, alamat) tanpa Resource transform
  dan tanpa filter wilayah — beda dengan `nearbyEmergencies` di fungsi yang sama yang justru
  benar memfilter. Lihat `FINDINGS_LOG.md` #2.
- ~~**Dua jalur akses ke tabel yang sama**~~ — **diklarifikasi sebagai keputusan sadar
  (2026-06-25), bukan anti-pola tak disengaja.** `report_officers`/`report_helpers`
  punya Eloquent model (`ReportOfficer`, `ReportHelper`, dipakai `ReportHelperController`)
  tapi `ReportActionController` sengaja memakai `DB::table()` mentah demi
  `lockForUpdate()` (cegah double-insert saat respons konkuren) — lihat komentar di
  kedua model dan di atas `ReportActionController`, serta `FINDINGS_LOG.md` #6. **Jangan
  konsolidasi ke Eloquent tanpa mempertahankan locking yang sama.** Jangan tambah jalur
  akses ketiga.
- **Jangan tambah helper dengan pola nested function-in-function** (deklarasi `function`
  di dalam body `if (!function_exists(...))` milik helper lain) — pernah terjadi pada eks
  `signatureMidtrans()` (sudah dihapus bersama scaffolding Midtrans, FINDINGS_LOG #15).
  Tiap helper harus punya blok `if (!function_exists('namanya'))` top-level sendiri.
- **Shared prop Inertia bertypo**: `'announcemet'` (bukan `announcement`) di
  `HandleInertiaRequests.php:48` — sudah dipakai konsisten di frontend dengan ejaan yang
  sama, jadi **jangan diam-diam diperbaiki** (akan memutus semua referensi frontend) tanpa
  task khusus yang mengganti kedua sisi sekaligus.
- **Pesan error mentah ke user**: banyak `catch (Throwable $e) { flashMessage(MessageType::ERROR->message(error: $e->getMessage())) }`
  menampilkan `$e->getMessage()` langsung ke UI — bisa membocorkan detail internal (nama
  kolom DB, dll). Pola yang ada, tapi jangan diperluas ke controller baru.
- **`npm run format` adalah auto-fix (`prettier --write .`), bukan check** — tidak ada cara
  memverifikasi format tanpa mengubah file. CI tidak menjalankan lint/format sama sekali.
- **`formatToRupiah()` & `date-fns` terpasang tapi tidak dipakai** — jangan asumsikan ada alur
  finansial aktif hanya karena helper currency ada.

## Keputusan teknis terkunci

- **`ReportActionController` memakai `DB::table()` mentah untuk `report_officers`/
  `report_helpers`, BUKAN model Eloquent `ReportOfficer`/`ReportHelper`** — disengaja
  demi `lockForUpdate()` (konkurensi). Dikonfirmasi user 2026-06-25, lihat
  `FINDINGS_LOG.md` #6. Jangan konsolidasi tanpa task khusus + test concurrency.
- **`date-fns` di `package.json` dipertahankan meski belum dipakai** — dikonfirmasi user
  2026-06-25 (kemungkinan dipakai untuk format tanggal id-ID di masa depan, lebih baik
  dari `Intl` manual yang dipakai sekarang). Jangan hapus dependency ini tanpa bertanya
  ulang; juga jangan mulai memakainya untuk satu halaman saja tanpa menyamakan pola
  format tanggal di seluruh app (lihat `prompt/docs/ARCHITECTURE_MAP.md`/SKILL.md).
- **Mass-reformat Pint/Prettier untuk utang gaya kode lama (35+/144 file) dijadwalkan
  sebagai task terpisah**, bukan dikerjakan ad-hoc — lihat
  `prompt/tasks/TASK_05_documentation_and_deferred.md` Bagian B. Sampai task itu
  dikerjakan, gate CI untuk Pint/Prettier bersifat informational (`continue-on-error`),
  bukan blocking.

- Database lokal & testing: **SQLite** — jangan asumsikan fitur SQL spesifik MySQL/PostgreSQL
  (mis. `REGEXP` di beberapa `scopeFilter`) tersedia tanpa verifikasi kompatibilitas driver produksi.
- Broadcast: **Laravel Reverb**, default `.env.example` masih `BROADCAST_CONNECTION=log` —
  pastikan diisi benar di environment non-local sebelum mengandalkan tracking real-time.
- Nominatim: hanya ~1 request/detik (kebijakan publik instance), **selalu** lewat
  `GeocodeController` (cache 24h + `Cache::lock`) — jangan panggil Nominatim langsung dari
  frontend/controller lain. `docker/nominatim/` sudah disiapkan untuk migrasi self-hosted.
- Role check: **selalu** `hasRole()`/`hasAnyRole()` dari Spatie Permission, bukan kolom
  string manual. `User::role([...])` bisa melempar `RoleDoesNotExist` di DB belum ter-seed
  (lihat workaround di `HomeController`).

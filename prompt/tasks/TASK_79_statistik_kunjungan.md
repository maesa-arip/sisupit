# TASK_79 — Statistik kunjungan web per hari (FINDINGS #208)

| Field | Isi |
|-------|-----|
| ID | TASK_79 |
| Severity | P3 |
| Tipe | fitur |
| Sumber | permintaan user 2026-10-14 ("Buat fitur kunjungan ke web per hari") |
| Branch | `main` (lokal, belum di-commit) |
| Status | DONE - lokal, belum dideploy (ADA MIGRASI `2026_10_14_100000_create_site_visit_tables`) |

## 1. Keputusan user (2026-10-14)

- Yang melihat: **superadmin saja** (lintas tenant).
- Dihitung: **pengunjung unik + halaman dibuka** per hari.
- Rincian: **web vs APK**, **tamu vs masuk akun**, **halaman terpopuler**, **per tenant/kota**.

## 2. Kondisi awal

Tidak ada analitik apa pun (tanpa Google Analytics/Umami, tanpa tabel kunjungan).

## 3. Rancangan

1. **Agregat harian, bukan log mentah.** `site_visitors_daily` = satu baris per pengunjung unik per hari per kombinasi
   rincian (`insertOrIgnore` pada UNIQUE). `site_page_views_daily` = penghitung per (tanggal, tenant, kanal, login, rute),
   `upsert` dengan `views + 1` (teruji di SQLite DAN MySQL lokal).
2. **Privasi:** `visitor` = sha256(APP_KEY | tanggal | IP | User-Agent). Garam harian = tak bisa dirangkai antarhari; IP
   mentah, user_id, dan URL ber-ID tidak disimpan (halaman = NAMA RUTE). Konsekuensi: angka periode = JUMLAH pengunjung
   harian (orang yang sama dua hari = dua), dan pengunjung yang login di tengah kunjungan terhitung di "tamu" dan "masuk".
3. **Tanpa beban ke halaman:** pencatatan di `terminate()` (sesudah respons dikirim PHP-FPM), galat hanya `report()`.
4. **Yang dihitung:** GET 200, punya nama rute, HTML atau kunjungan Inertia penuh. **Tidak:** muat ulang parsial
   (`X-Inertia-Partial-Component`, mis. polling status tamu 30 dtk), prefetch, JSON, redirect, bot (regex UA), UA kosong.
5. **Tanggal WITA** (`app.local_timezone`, #134). **Tenant** = subdomain yang dibuka (bukan lokasi pengunjung).
   **Kanal** = `isNativeApp()` (UA `SisupitApp`).
6. **Retensi:** `SiteVisitor` Prunable 400 hari lewat `model:prune` harian (routes/console.php); tabel tampilan halaman disimpan.

## 4. Berkas

- `database/migrations/2026_10_14_100000_create_site_visit_tables.php`
- `app/Http/Middleware/RecordSiteVisit.php` (+ `bootstrap/app.php`, grup web)
- `app/Models/SiteVisitor.php`, `routes/console.php`
- `app/Http/Controllers/Admin/SiteVisitController.php`, `routes/admin.php` (`admin.visits.index`, `role:superadmin`)
- `resources/js/Pages/Admin/Visits/Index.jsx` - periode 7/30/90/365 hari, pil wilayah, 4 kartu angka, grafik batang per
  hari (pengunjung / halaman dibuka), rincian web-APK, tamu-login, per wilayah, 10 halaman terpopuler
- `resources/js/Layouts/Partials/navItems.js` - Sistem > Statistik Kunjungan (superadmin)
- `tests/Feature/Sisupit/SiteVisitTest.php` (6 test)

## 5. Verifikasi

- SiteVisitTest 6 passed; suite penuh (lihat CLAUDE.md baseline).
- MySQL lokal (sisupit_dev): migrasi jalan; 3x GET /tentang browser -> `views = 3`, 1x APK baris terpisah, 2 pengunjung.
- **Belum:** cek visual halaman (ekstensi Chrome tak tersambung saat sesi), uji di ponsel.

## 6. Deploy

Kode dan `php artisan migrate` WAJIB naik bersamaan (cadangan DB dulu). Tanpa migrasi, middleware hanya menulis
galat ke log (`report()`), halaman tetap jalan; `/admin/visits` akan 500.

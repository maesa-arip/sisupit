# TASK 24 — Produksi berhenti berjalan sebagai `local` + debug menyala

| Field | Isi |
|-------|-----|
| ID | TASK_24 |
| Severity | P1 |
| Tipe | security (konfigurasi server) |
| Sumber | FINDINGS_LOG #57 |
| Status | DONE (2026-08-11) |

---

## 1. Deskripsi masalah / tujuan

`/var/www/sisupit/.env` di VPS produksi berisi `APP_ENV=local` dan `APP_DEBUG=true`.
Setiap galat 500 menampilkan jejak tumpukan Laravel lengkap **beserta isi variabel
environment** (kredensial DB, `APP_KEY`, kunci Reverb/FCM) kepada siapa pun yang memicunya.

## 2. Reproduce (bukti masalah ada)

`curl -s https://sisupit.com/halaman-yang-tidak-ada-xyz` → halaman galat bawaan Laravel
(`<title>Not Found</title>` + normalize.css inline), **bukan** halaman `ErrorHandling`
milik aplikasi. Pembanding pada saat yang sama: `https://staging.sisupit.com/...`
(`APP_ENV=staging`) mengembalikan komponen `ErrorHandling`.

## 3. Root cause

Bukan bug kode — konfigurasi server. Penangan pengecualian di `bootstrap/app.php:33`
sengaja hanya merender `ErrorHandling` bila `! app()->environment(['local','testing'])`.
Dengan `APP_ENV=local` di produksi, cabang itu tidak pernah aktif justru di tempat yang
paling membutuhkannya, dan `APP_DEBUG=true` membuat halaman penggantinya membocorkan
konfigurasi.

## 4. Perubahan

- `/var/www/sisupit/.env` — `APP_ENV=local` → `production`, `APP_DEBUG=true` → `false`.
- `/var/www/sisupit-staging/.env`, `/var/www/sisupit-dev/.env` — `APP_DEBUG=true` → `false`.
  Keduanya domain publik yang memuat salinan PII produksi, jadi risiko bocornya sama.
- Cadangan otomatis: `.env.bak-57-<timestamp>` di tiap direktori.
- **Tidak ada perubahan kode.**

## 5. Blast radius

Hanya dua tempat di kode yang bergantung environment:
- `bootstrap/app.php:33` — cabang halaman galat ramah. **Justru ini yang diperbaiki.**
- `app/Providers/AppServiceProvider.php:38` — `URL::forceScheme('https')` kini aktif di
  produksi. Aman: produksi memang HTTPS penuh, dan staging/dev sudah berjalan dengan
  cabang ini sejak lama tanpa masalah.

Risiko utama yang diperiksa lebih dulu: komponen `resources/js/Pages/ErrorHandling.jsx`
harus ada di revisi yang sedang jalan di produksi (`4a4ed6b`) — diverifikasi ada, termasuk
aset `public/build/assets/ErrorHandling-*.js`. Tanpa itu halaman galat akan blank.

## 6. Verifikasi

- [x] `curl https://sisupit.com/halaman-yang-tidak-ada-xyz` → merender `ErrorHandling`,
      tidak ada `Whoops` maupun jejak `vendor/laravel/framework`
- [x] Beranda ketiga env → HTTP 200; path tak dikenal → HTTP 404 (status tetap benar)
- [x] Tidak ada config cache di ketiga env (tak perlu `config:clear`)
- [x] `php artisan test` 193 passed (tak terpengaruh — perubahan server saja)

## 7. Rollback

`cp .env.bak-57-<timestamp> .env` di direktori terkait. Tidak ada perubahan kode maupun
skema, jadi rollback seketika dan tanpa jejak.

---

## Acceptance criteria

- [x] Produksi tidak lagi memaparkan jejak galat & isi environment
- [x] Halaman `ErrorHandling` yang sudah dibuat akhirnya terpakai di produksi
- [x] `APP_DEBUG=false` di ketiga environment publik
- [x] `FINDINGS_LOG.md` #57 → FIXED

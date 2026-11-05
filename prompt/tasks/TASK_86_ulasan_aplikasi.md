# TASK_86 — Ulasan aplikasi Sisupit + testimoni di halaman depan

| Field | Isi |
|-------|-----|
| ID | TASK_86 (FINDINGS #229) |
| Severity | P3 |
| Tipe | fitur kecil (ADA MIGRASI) |
| Sumber | permintaan user 2026-11-01 |
| Status | DONE (lokal) |

---

## 1. Tujuan

User: "buatkan fitur review" untuk APLIKASI (mis. "aplikasi ini sangat membantu"), harus muncul di
semua platform (Android, iOS, web, desktop). Keputusan user selama diskusi:

1. Ulasan masuk ke **database Sisupit**, BUKAN ulasan Play Store/App Store (jadi tanpa In-App Review
   API, tanpa rilis APK/iOS/exe baru - satu web melayani keempat platform).
2. **Testimoni ditampilkan** di halaman depan.
3. **Semua peran** boleh mengulas; **tamu tidak**.

## 2. Kondisi awal

Belum ada fitur ulasan/rating/feedback apa pun (grep `rating|ulasan|review|feedback|kepuasan` di
`app/`, `database/migrations`, `routes/`, `Pages/` hanya mengenai komentar & data hydrant).

## 3. Desain (best practice yang dipakai)

- **Satu ulasan per pengguna**, bisa diubah kapan saja (UNIQUE `user_id`, simpan = menimpa) - rata-rata
  tak terdistorsi satu orang yang mengisi berkali-kali.
- **Form singkat**: bintang 1-5 wajib, tag cepat opsional (`AppReview::TAGS`), komentar opsional
  maks 500, saklar "Boleh ditampilkan sebagai testimoni".
- **Ajakan otomatis jarang & di momen tenang** - `AppReview::shouldAsk()`, dikirim server hanya di
  route `dashboard` (prop `appReviewPrompt`) dan dirender SEKALI di `AppLayout` sebagai kartu di alur
  halaman (pola Banner #184), bukan pop-up yang menghadang:
  - bukan akun demo (TASK_81), belum mengulas;
  - tidak sedang Meluncur/Tiba (`report_officers`/`report_helpers` en_route|arrived);
  - akun >= 7 hari ATAU punya laporan `resolved`;
  - "Nanti saja" = 30 hari (`SNOOZE_DAYS`), "Jangan tanya lagi" = selamanya (`app_review_prompts`).
  Selalu bisa dibuka sendiri dari **Profil > Ulasan Aplikasi**.
- **Konteks dicatat otomatis**: platform dari token UA (`SisupitDesktop` = desktop; `SisupitApp` +
  iPhone/iPad/iPod/Macintosh = ios, selain itu android; lainnya web), peran SNAPSHOT (urutan
  `ROLE_LABELS`), wilayah = province_code + city_code akun (pola forum_threads).
- **Hasil untuk tim**: `/admin/app-reviews` (admin|superadmin) - rata-rata, sebaran bintang, per
  platform, tab Semua/Menunggu Tinjauan/Testimoni Tampil, saringan bintang/platform/peran/periode,
  Ekspor Excel. Wilayah = Tenantable (admin kabupaten melihat kabupatennya; binding id lain = 404).
  Ringkasan tak menghitung akun demo.
- **Testimoni = dua persetujuan**: pemilik (`allow_public`) + admin (`approved_at`). Komentar diubah
  atau izin dicabut = turun; rating saja berubah = tetap tayang. Nama publik = nama sapaan + inisial
  (`I Wayan Sudarta` -> `Wayan S.`, aturan `lib/first-name.js`). Tampil di **Spotlight** (`/`, wajah
  depan browser & tamu aplikasi; maks 3, sesudah semua tombol darurat) dan **Landing** (`/landing`, maks 6),
  disaring kota tenant subdomain (apex = semua).
- **Privasi**: hapus akun (#157) = bintang tetap, komentar dibuang, testimoni turun, wilayah dikosongkan.
- **Tanpa notifikasi** (keputusan implementasi): plan menyebut notif database untuk bintang 1-2 sebagai
  "boleh"; tidak dipasang supaya tak ada jenis notifikasi baru. Admin melihatnya di halaman ulasan.
- **iOS**: kartunya bergaya Sisupit, bukan tiruan dialog rating sistem (Apple melarang tiruan dialog
  App Store).

## 4. Perubahan

- `database/migrations/2026_11_01_100000_create_app_review_tables.php` - `app_reviews`, `app_review_prompts`.
- `app/Models/AppReview.php` - aturan tunggal (TAGS, PLATFORMS, ROLES, platformFrom, roleOf, ownedBy,
  shouldAsk, formProps, testimonials, publicName). Tenantable.
- `app/Http/Controllers/AppReviewController.php` - `store` (POST /ulasan), `dismiss` (POST /ulasan/tunda), throttle 10/menit.
- `app/Http/Controllers/Admin/AppReviewController.php` - index, togglePublish, export.
- `app/Exports/AppReviewsExport.php`.
- `routes/web.php` - `app-review.store|dismiss`, `admin.app-reviews.index|export|publish`.
- `app/Http/Middleware/HandleInertiaRequests.php` - shared prop `appReviewPrompt` (hanya route dashboard).
- `app/Http/Controllers/ProfileController.php` - prop `appReview`; anonimisasi ulasan di `destroy()`.
- `app/Http/Controllers/HomeController.php` - prop `testimonials` di Spotlight & Landing.
- `resources/js/Components/AppReview/{StarRating,AppReviewDialog,AppReviewPrompt,Testimonials}.jsx`.
- `resources/js/Layouts/AppLayout.jsx` - kartu ajakan di bawah Banner pengumuman.
- `resources/js/Pages/Profile/Edit.jsx` - grup "Ulasan Aplikasi".
- `resources/js/Pages/Spotlight.jsx`, `resources/js/Pages/Landing.jsx` - seksi testimoni.
- `resources/js/Pages/Admin/AppReviews/Index.jsx` - halaman admin.
- `resources/js/Layouts/Partials/navItems.js` - menu "Ulasan Aplikasi" (grup admin, sesudah Moderasi Forum).
- `tests/Feature/Sisupit/AppReviewTest.php` - penjaga (lihat §6).

## 5. Blast radius

- Shared prop baru dievaluasi tiap request Inertia, tapi query-nya hanya jalan di route `dashboard`
  untuk akun login (maks ~5 query kecil ber-indeks user_id).
- Spotlight/Landing: satu query tambahan; seksi tak dirender bila belum ada testimoni (tampilan sama
  seperti sekarang sampai admin menyetujui testimoni pertama).
- Hapus akun: satu UPDATE tambahan di transaksi yang sama.
- Tanpa APK/iOS/desktop baru. ADA MIGRASI: deploy kode + `php artisan migrate` bersamaan, cadangan DB dulu.

## 6. Verifikasi

- Baseline sebelum: lihat STATUS_LOG / laporan job (913 passed).
- `AppReviewTest`: satu ulasan per user + snapshot platform/peran/kota; 5 platform dari UA; semua peran
  boleh, tamu tidak; validasi bintang/tag/panjang komentar; kelayakan ajakan (akun baru, laporan
  selesai, nanti saja/jangan tanya lagi, sudah mengulas, demo); tidak saat Meluncur; prop ajakan hanya
  di dashboard; batas wilayah admin + 404 lintas kabupaten + 403 non-admin; testimoni butuh izin +
  persetujuan, turun saat komentar diubah/izin dicabut; demo tak pernah jadi testimoni; anonimisasi
  saat hapus akun; ekspor tersaring; label peran ekspor = `ROLE_LABELS`; kartu ajakan tanpa fixed/sticky.
- Belum dicek: tampilan di ponsel/APK/iOS/desktop.

## 7. Rollback

Revert commit fitur + `php artisan migrate:rollback --step=1` (membuang kedua tabel; tidak menyentuh
tabel lain).

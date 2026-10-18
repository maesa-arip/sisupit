# TASK_81 — Akun demo: aksi tanpa notifikasi, bisa dinyalakan/dimatikan (FINDINGS #214)

| Field | Isi |
|-------|-----|
| ID | TASK_81 |
| Severity | P3 |
| Tipe | fitur |
| Sumber | permintaan user 2026-10-18 ("buatkan fitur akun demo, jadi jika pakai akun demo tidak akan memicu notifikasi, tapi fitur ini bisa on atau off kan") |
| Branch | `main` |
| Status | DONE - TERDEPLOY PROD @97eccef1 2026-10-18 (konsol user; ADA MIGRASI `2026_10_18_100000_add_is_demo_to_users_and_reports`) |

## 1. Keputusan user (2026-10-18)

- **Saklar:** per akun (superadmin menandai di Kelola Pengguna > Ubah) **+** saklar induk "Mode Akun Demo" di
  Pengaturan (mati = akun demo berperilaku seperti akun biasa).
- **Cakupan:** yang disenyapkan adalah notifikasi yang **DIPICU** akun demo. Akun demo sendiri tetap boleh menerima.
- **Data demo:** laporan akun demo **tetap muncul** di antrean/daftar/peta (live Reverb tetap jalan), diberi lencana **Demo**.

## 2. Rancangan

1. Kolom `users.is_demo` dan `reports.is_demo` (boolean, default false, tanpa backfill). `reports.is_demo` dicap di
   `ReportController::persistReport` dari akun pelapor (tamu tak pernah demo).
2. **Cap pemicu di konstruktor** - trait `App\Notifications\Concerns\DipicuAkunDemo` (`$dipicuAkunDemo`, `catatPemicu()`).
   Alasannya: notifikasi `ShouldQueue` dikirim di worker, tempat `auth()->user()` sudah kosong; properti publik ikut
   terserialisasi ke antrean. Dipasang di 6 kelas (Emergency, Triage, ReportStatusUpdated, AgencyDispatch,
   AgencyConfirmation, Forum). `DeviceTestNotification` (uji bunyi ke HP SENDIRI) sengaja tidak.
3. **Satu titik saring** - `App\Listeners\SenyapkanNotifikasiAkunDemo` (auto-discovery, event `NotificationSending`)
   mengembalikan `false` (= Laravel membatalkan, semua kanal: FCM, database, broadcast) bila saklar induk menyala DAN
   (notifikasi dipicu akun demo ATAU `$notification->report->is_demo`), KECUALI penerimanya juga akun demo.
   - Laporan demo yang disetujui admin ASLI tetap tidak membunyikan sirine petugas asli.
   - Peragaan antar-akun demo (demo admin -> demo petugas, kabar status ke pelapor demo) tetap lengkap.
4. `Setting::KEY_AKUN_DEMO_AKTIF` (`akun_demo_aktif`), `Setting::akunDemoAktif()`, **default MENYALA** (menandai akun
   sudah pilihan sadar; akun demo yang tiba-tiba bersirine ke petugas asli adalah arah gagal yang lebih mahal).
5. Siaran Reverb (ReportFeedChanged dll.) TIDAK disaring - sesuai keputusan "tetap muncul".

## 3. Berkas

- `database/migrations/2026_10_18_100000_add_is_demo_to_users_and_reports.php`
- `app/Notifications/Concerns/DipicuAkunDemo.php`, `app/Listeners/SenyapkanNotifikasiAkunDemo.php`
- `app/Notifications/{EmergencyAlert,TriageDecided,ReportStatusUpdated,AgencyDispatch,AgencyConfirmation,Forum}Notification.php`
- `app/Models/{Setting,User,Report}.php`, `app/Http/Controllers/ReportController.php` (persistReport)
- `app/Http/Controllers/Admin/UserController.php` (`setDemo`, prop `can_set_demo`, kolom `is_demo` di index),
  `app/Http/Resources/Admin/UserResource.php`, `routes/admin.php` (`PUT admin/users/demo/{user}` -> `admin.users.demo`,
  grup role:superadmin + cek eksplisit)
- `app/Http/Controllers/Admin/SettingController.php`, `app/Http/Requests/Admin/NotificationSettingRequest.php`
  (`akun_demo_aktif` opsional - pemanggil lama tak membaliknya)
- `resources/js/Components/DemoBadge.jsx` (baru); `Pages/Admin/Users/{Index,Edit}.jsx`, `Pages/Admin/Settings/Edit.jsx`,
  `Pages/Admin/Reports/Index.jsx`, `Pages/Front/Reports/Show.jsx`
- `tests/Feature/Sisupit/AkunDemoTest.php` (10 test)

## 4. Verifikasi

- `AkunDemoTest` 10/10. Kanal database SUNGGUHAN (bukan `Notification::fake()`, yang melompati event). Sabotase
  listener (`return false` -> `return null`) = 3 merah, dipulihkan byte-exact (`cmp`).
- Penjaga "kelas notifikasi baru lupa memasang trait": test memindai `app/Notifications/*.php`.
- Suite penuh & `npm run build`: lihat STATUS.

## 5. Cara pakai

1. Superadmin: Kelola Pengguna > Ubah akun > kartu "Akun Demo" > geser "Jadikan akun demo" (tersimpan langsung).
2. Pengaturan (superadmin) > "Mode Akun Demo": menyala = senyap; mati = akun demo normal. Menampilkan jumlah akun demo.
3. Akun & laporan demo berlencana "Demo" di Kelola Pengguna, Verifikasi Laporan, dan detail laporan.

## 6. Catatan deploy

- ADA MIGRASI: kode + `php artisan migrate` bersamaan, cadangan DB dulu (deploy-env.sh sudah menjalankan migrate).
- Listener baru ditemukan lewat auto-discovery. Bila prod memakai cache event (`bootstrap/cache/events.php`, belum
  pernah dikonfirmasi), jalankan `php artisan event:cache` ulang atau `event:clear` - tanpanya fitur ini diam-diam tak
  bekerja (gejala sama juga berlaku untuk DeleteInvalidFcmToken).

## 7. Batas yang diketahui

- Hanya notifikasi Laravel yang disaring. Email (MailController, tenant mailer) tidak terpicu oleh alur laporan, jadi
  tidak disentuh.
- Laporan demo ikut terhitung di statistik/dashboard/ekspor (keputusan "tetap muncul"). Bila kelak harus dikecualikan,
  pakai `reports.is_demo`.

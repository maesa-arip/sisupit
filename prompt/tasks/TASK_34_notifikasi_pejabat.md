# TASK_34 — Pejabat ikut menerima siaran insiden (+ mode siaga & channel real-time)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_34 |
| Severity | P2 |
| Tipe | fitur kecil + bugfix |
| Sumber | permintaan user 2026-08-25 ("cek notifikasi broadcast pada pejabat" → "buat agar pejabat juga dapat notif saat admin broadcast, dan buat seperti relawan ada mode stand by untuk mendapat notif serta perbaiki channel real-time nya") |
| Status | DONE (kode) — TERDEPLOY 2026-08-25 @66d4cbca ke prod/staging/dev; sisa verifikasi manual §6 |

---

## 1. Deskripsi masalah / tujuan

Pejabat adalah pemantau berjurisdiksi (peran `pejabat`, akses baca setara admin di
wilayahnya sejak FINDINGS #41). Ia bisa membuka dashboard, daftar laporan, dan halaman
detail insiden — tapi **tidak pernah diberi tahu apa pun**. Tiga hal yang diminta user:

1. pejabat ikut menerima notifikasi saat Pusat Komando menekan Broadcast/Validasi;
2. pejabat punya **mode siaga** seperti relawan, supaya bisa memilih tidak dibangunkan;
3. channel real-time pejabat diperbaiki.

## 2. Reproduce (bukti masalah ada)

- Akun pejabat Kota Denpasar, laporan di Desa Pemogan (Denpasar) divalidasi admin →
  lonceng web pejabat tetap kosong, tak ada push FCM. Sebelum perbaikan **tidak ada satu
  pun** jalur notifikasi yang menyertakan peran ini:

  | Kejadian | Penerima (sebelum) | Pejabat? |
  |---|---|---|
  | Laporan baru masuk (`ReportController:376`) | petugas, admin, superadmin | tidak |
  | Broadcast/validasi (`ReportActionController:68`) | petugas, relawan siaga | tidak |
  | Konfirmasi OPD (`ReportActionController:424`) | admin, petugas, petugas di lokasi | tidak |
  | Perubahan status (`ReportActionController:716`) | pelapor saja | tidak |

- Buka halaman detail insiden sebagai pejabat → halaman tampil (benar, #41), tapi badge
  status & marker responder **tidak pernah bergerak**; DevTools menunjukkan
  `POST /broadcasting/auth` → 403 untuk `private-report-tracking.{id}`.

## 3. Root cause

- `app/Http/Controllers/ReportActionController.php:68-77` — filter peran ada di
  **pemanggil**, bukan di `scopeNotifiableForReport`. Scope-nya sendiri sudah siap melayani
  pejabat (`User::STAFF_ROLES` bahkan sudah memuatnya untuk cabang "wilayah kosong =
  nasional"), tapi cabang itu tak pernah tersentuh karena `User::role('petugas'|'relawan')`
  sudah lebih dulu menyaring pejabat keluar.
- `routes/channels.php` — `$isStaff = hasAnyRole(['admin','superadmin','petugas'])`.
  Gerbang halaman (`ReportController::show`) sudah diperluas ke `pejabat` saat #41, gerbang
  channel tidak ikut. Konsistensi peran bocor persis seperti #41 dulu.

## 4. Perubahan

**Backend**
- `app/Models/User.php` — konstanta baru `STANDBY_ROLES = ['relawan','pejabat']`: peran yang
  boleh mematikan siaganya sendiri. Admin/petugas SENGAJA tidak — mematikan notifikasi Pusat
  Komando berarti laporan warga bisa menganggur tanpa ada yang tahu.
- `app/Models/Setting.php` — kunci baru `KEY_NOTIFY_LEVEL_PEJABAT` (default KABUPATEN).
- `app/Http/Controllers/ReportActionController.php` — blok penerima **ketiga** di `approve()`,
  sebentuk dengan blok petugas & relawan; `EmergencyAlertNotification($report, 'pejabat')`.
- `routes/channels.php` — `pejabat` masuk `$isStaff`, tetap dikunci `withinReportJurisdiction()`.
- `app/Http/Controllers/ProfileController.php` — `toggleStandby()` PINDAH ke sini dari
  `VolunteerController` (route `volunteer.standby` → `profile.standby`), gerbangnya
  `User::STANDBY_ROLES`. Alasan: pejabat mem-POST ke endpoint bernama "volunteer" akan
  terbaca sebagai bug di sesi berikutnya. Hanya ada satu pemanggil, jadi tidak ada nama
  lama yang ditinggalkan hidup (jangan buat alias — itu "dua daftar" lagi).
- `Admin/SettingController` + `NotificationSettingRequest` — dropdown ketiga.

**Frontend**
- `resources/js/Pages/Admin/Settings/Edit.jsx` — "Tingkat Siaran Pejabat".
- `resources/js/Pages/Admin/Dashboard.jsx` — kartu "Mode Kesiapan" saat `isPejabat`, meniru
  persis kartu relawan di `Pages/Dashboard.jsx` (token, ikon, salinan teks, pola toast).
- `resources/js/Pages/Dashboard.jsx` — satu baris: `route('volunteer.standby')` → `route('profile.standby')`.

## 5. Blast radius

- **Volume notifikasi naik.** Tiap validasi laporan kini menyentuh satu kelompok penerima
  lagi. Jangkauannya default KABUPATEN dan pejabat berjumlah sedikit, jadi dampak antrean
  kecil — tapi tingkat siarannya sengaja dibuat terpisah supaya bisa diturunkan tanpa
  mengganggu petugas.
- **`is_standby` dipakai lebih dari satu peran.** Kolomnya sudah ada di semua baris `users`
  (default `true`), jadi tak ada migrasi dan pejabat lama otomatis aktif. Daftar/peta relawan
  (`RelawanController`, `MonitoringMapController`) & kartu "Relawan Standby" di dashboard
  admin semuanya sudah menyaring `User::role('relawan'|'petugas')` lebih dulu, jadi pejabat
  tidak bocor ke sana.
- **Channel** — yang bertambah hanya peran `pejabat` DALAM wilayah laporan; #31 (staf luar
  wilayah tak boleh menyadap GPS/PII) tidak dilonggarkan dan tetap dijaga test.
- **Payload FCM** — `user_role` kini bisa bernilai `'pejabat'`; wrapper Android/iOS yang
  bercabang atas nilai ini akan melihat nilai baru (lihat verifikasi manual).

## 6. Verifikasi

- [x] Baseline sebelum: `php artisan test` → **251 passed (984 assertions)**
- [x] Test regresi baru (9): `ReportNotificationLevelTest` (4 — pejabat disiarkan sesuai
      kabupaten & tidak lintas kota, siaga mati dilewati, tingkat pejabat independen dari
      petugas, tingkat pejabat bisa diturunkan ke desa), `BroadcastingAuthTest` (2 — pejabat
      sewilayah diizinkan, pejabat luar wilayah ditolak), `UserSelfServiceAuthorizationTest`
      (3 — pejabat & relawan boleh menoggle siaga, admin 403)
- [x] Test sesudah: **260 passed (1004 assertions)**
- [x] `npm run build` lulus (client + SSR); Pint & Prettier bersih
- [x] Deploy 2026-08-25 @`66d4cbca` ke prod/staging/dev (`git pull --ff-only`, tanpa migrasi
      karena `users.is_standby` sudah ada). `bootstrap/cache/` ketiga env TIDAK memuat
      `routes-*.php`, jadi route baru `profile.standby` langsung terpakai tanpa `route:cache`
      ulang — **periksa ini tiap kali sebuah deploy mengubah `routes/`**. Ketiga domain 200,
      `reverb.service` aktif, 4 proses `queue:work` jalan (wajib: notifikasinya `ShouldQueue`).
      Produksi punya **3 akun pejabat, ketiganya siaga aktif** → mulai menerima siaran.
- [ ] **Verifikasi manual (SISA):**
  1. Login pejabat kota → dashboard menampilkan kartu "Mode Kesiapan" (merah = siaga aktif);
     admin/superadmin TIDAK melihat kartu ini.
  2. Admin validasi laporan di wilayah pejabat → lonceng web pejabat berisi "Darurat: …";
     push FCM masuk di perangkat pejabat.
  3. Matikan siaga di dashboard pejabat → validasi laporan lagi → tidak ada notifikasi baru;
     nyalakan lagi → notifikasi kembali.
  4. `/admin/settings` → dropdown "Tingkat Siaran Pejabat" tersimpan & terbaca ulang.
  5. Pejabat membuka detail insiden yang sedang ditangani → badge status berubah sendiri &
     marker responder bergerak tanpa refresh (DevTools: `/broadcasting/auth` → 200).
  6. **Wrapper Android/iOS:** pastikan `user_role: 'pejabat'` tidak membuat handler push
     jatuh ke cabang tak dikenal. Payload FCM saat ini identik dengan milik petugas —
     termasuk sirine. Kalau di lapangan pejabat tak ingin dibangunkan sirine, itu keputusan
     berikutnya (kelas notifikasi terpisah), bukan perbaikan diam-diam di sini.

## 7. Rollback

Satu commit fokus → `git revert`. Tidak ada migrasi, tidak ada perubahan skema, tidak ada
data yang ditulis ulang; `Setting` baru hanya dibaca dengan default bila barisnya tak ada.

---

## Acceptance criteria
- [x] Pejabat menerima notifikasi saat broadcast, ter-scope wilayah
- [x] Mode siaga tersedia untuk pejabat & tetap berjalan untuk relawan
- [x] Channel real-time pejabat terbuka, tetap tertutup untuk pejabat luar wilayah
- [x] Tidak ada regresi (251 → 260 passed)
- [x] Dokumen terkait diupdate (`ARCHITECTURE_MAP.md`, `FINDINGS_LOG.md` #77)

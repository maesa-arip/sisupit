# TASK_73 — Sesi login aplikasi & token FCM selalu sejalan

| Field | Isi |
|-------|-----|
| ID | TASK_73 |
| Severity | P1 (pengguna bingung; petugas berisiko kehilangan/menerima sirine di keadaan yang salah) |
| Tipe | bugfix + fitur kecil |
| Sumber | FINDINGS_LOG #181 / permintaan user 2026-10-05 |
| Status | DONE (lokal, belum di-commit/deploy) |

---

## 1. Deskripsi masalah / tujuan

Keluhan user: di APK, sesi bawaan Laravel habis → aplikasi tampak keluar (halaman masuk),
tetapi HP tetap menerima notifikasi/sirine. Pengguna bingung karena kalau Keluar sendiri,
notifikasi berhenti.

User meminta riset praktik baku aplikasi native dulu, lalu memilih butir 1–5 (butir 6 —
status "notifikasi aktif di HP ini" + notifikasi uji — jadi task terpisah, butir 7 kunci
aplikasi ditunda).

Praktik baku yang dipakai (sumber di FINDINGS #181):
- Aplikasi HP = sesi panjang, keluar hanya bila pengguna menekan Keluar (PagerDuty: web 15
  mnt/1 jam, mobile 210 hari/5 tahun). Keamanan HP hilang lewat kunci aplikasi, bukan sesi pendek.
- Token push mengikuti status login: lepas saat keluar; pencabutan dari server (ganti sandi,
  cabut semua perangkat) ikut melepas token.
- Perawatan token Firebase: catat terakhir terlihat; hapus bila FCM membalas
  UNREGISTERED/INVALID_ARGUMENT; Android kedaluwarsa 270 hari.

## 2. Reproduce

Empat jalan menuju "tampak keluar tapi tetap bersirine" (semua dibuktikan dari kode):
1. Login email/daftar akun di APK tanpa "ingat saya" → `SESSION_LIFETIME=120` habis.
2. Keluar di perangkat LAIN (laptop) → `SessionGuard::logout()` mengganti `remember_token`
   (satu per user) → cookie "ingat saya" APK batal → APK terlempar keluar ≤ 120 mnt kemudian.
   Kena juga ke login Google.
3. Tombol Keluar di **Profil**, `VerifyEmail`, `AuthenticatedLayout` tak mengirim `fcm_token`
   → keluar manual pun tidak melepas token (hanya bilah navigasi `navItems.js` yang mengirim).
4. Reset sandi mengganti `remember_token` tanpa menyentuh `fcm_tokens`.

Ditambah: token mati tak pernah dibersihkan (tak ada pendengar `NotificationFailed`,
`updated_at` tak pernah disentuh).

## 3. Root cause

`fcm_tokens` hanya terikat ke USER, bukan ke status login perangkat. Satu-satunya penghapus
token adalah `AuthenticatedSessionController::destroy` dengan `fcm_token` dari body request.
Setiap jalan keluar lain (sesi kedaluwarsa, remember_token berganti, tombol keluar tanpa
body) meninggalkan tokennya.

## 4. Fix (yang dikerjakan)

1. **APK selalu "ingat saya"** — helper `isNativeApp()` (`app/Helpers/helpers.php`, UA ∋
   `SisupitApp`); `LoginRequest::authenticate` & `RegisteredUserController::store`. Kotak
   "Ingat saya" disembunyikan di aplikasi (`Auth/Login.jsx`). Browser tak berubah.
2. **Keluar = perangkat ini saja** — `logoutCurrentDevice()` di `AuthenticatedSessionController::destroy`;
   token dicadangkan di sesi oleh `FcmController::store` (`session('fcm_token')`) sehingga
   SEMUA tombol Keluar melepasnya. Baru: `POST profile/logout-everywhere`
   (`profile.logout-everywhere`, `ProfileController::logoutEverywhere`) + tombol & dialog
   konfirmasi di Profil.
3. **Pencabutan dari server melepas token** — `User::signOutEverywhere($keepToken, $keepSessionId)`
   (hapus token, ganti remember_token, hapus baris `sessions` bila driver database).
   Dipakai: keluar dari semua perangkat, ganti sandi (`PasswordController::update`,
   perangkat ini dikecualikan & cookie "ingat saya"-nya dipasang ulang), reset sandi
   (`NewPasswordController::store`). Hapus akun sudah menghapus token (#157).
4. **Jaring pengaman tamu** — `POST /fcm-token/release` (`fcm.release`, middleware `guest` +
   `throttle:10,1`, `FcmController::release`); `resources/js/lib/release-fcm-token.js`
   dipanggil dari `router.on('navigate')` di `app.jsx`: halaman tamu di aplikasi meminta token
   lewat `AndroidBridge.postToken` lalu melepasnya.
5. **Perawatan token** — `App\Listeners\DeleteInvalidFcmToken` (auto-discovery) menghapus token
   yang ditolak FCM (NotFound / invalid token); galat sementara TIDAK menghapus.
   `FcmController::store` menyentuh `updated_at` (≤ 1×/hari). `FcmToken` `Prunable` 270 hari +
   `Schedule::command('model:prune')->daily()` di `routes/console.php`.

Tanpa migrasi, tanpa perubahan APK.

## 5. Blast radius

- Semua login/logout/ganti sandi/reset sandi. Browser biasa: hanya beda (a) Keluar tak lagi
  mencabut "ingat saya" di perangkat lain, (b) ganti/reset sandi mengeluarkan perangkat lain.
- `routes/web.php` +2 rute. Tidak ada route cache di env (cek `bootstrap/cache/routes-*.php`
  tiap deploy).
- `model:prune` hanya jalan bila cron `schedule:run` ada di VPS — **belum dipastikan**. Tanpa
  cron, pembersih utama (listener) tetap jalan; prune hanya sapu sisa.
- Pengguna yang sekarang "tampak keluar tapi masih dapat notif" baru beres setelah sekali
  membuka aplikasi (jaring pengaman tamu melepas tokennya) atau login ulang.
- Pemutusan sesi perangkat lain butuh `SESSION_DRIVER=database` di server (.env.example
  database; nilai di VPS belum dicek). Driver lain: token tetap dilepas, sesinya habis sendiri.

## 6. Verifikasi

- [x] Baseline: 695 passed / 3560 assertions (CLAUDE.md 2026-10-05; tak ada perubahan kode sejak itu).
- [x] Regression test `tests/Feature/Sisupit/SesiAplikasiTokenFcmTest.php` (16 test).
- [x] Sabotase: tanpa `isNativeApp` di LoginRequest dan dengan `logout()` + tanpa cadangan sesi,
      tepat 3 test merah; berkas dipulihkan byte-exact (`cmp`).
- [x] `vendor/bin/pint --test` lulus (20 berkas); `npm run build` lulus; `event:list` menunjukkan
      listener terpasang sekali.
- [x] Full suite sesudah: 711 passed / 3606 assertions (= baseline + 16 test / 46 assertions).
- [ ] Uji di HP: (a) login email di APK, tutup >2 jam, buka → tetap masuk; (b) keluar di laptop
      → HP tetap masuk; (c) Profil > Keluar → tak ada notif; (d) Keluar dari semua perangkat di
      laptop → HP berikutnya dibuka tampil halaman masuk & tak ada notif.

## 7. Rollback

Revert commit TASK_73. Tanpa migrasi; token yang sempat dihapus akan didaftarkan ulang
otomatis saat aplikasi dibuka dalam keadaan masuk (AppLayout).

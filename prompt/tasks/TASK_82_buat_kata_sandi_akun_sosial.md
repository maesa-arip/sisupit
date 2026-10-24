# TASK_82 — Akun Google/Apple bisa membuat kata sandi (kode 6 angka lewat email)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_82 |
| Severity | P2 |
| Tipe | fitur kecil (+ bugfix: form ganti sandi buntu bagi akun sosial) |
| Sumber | permintaan user 2026-10-24 / FINDINGS_LOG #216 |
| Status | DONE (di-push ke main 2026-10-24, deploy via konsol) |

---

## 1. Deskripsi masalah / tujuan
Permintaan: pengguna yang masuk lewat Google atau Apple bisa (mengganti) kata sandi.
Keputusan user 2026-10-24: bukti kepemilikan email lewat **kode 6 angka di email** (bukan tautan -
tautan di APK/iOS terbuka di browser lain dengan sesi lain), disimpan di **cache** (tanpa migrasi).

## 2. Reproduce
Akun Socialite dibuat `password` NULL (`SocialiteController::findOrCreateUser`). Profil > tab
"Kata sandi" tetap menampilkan `UpdatePasswordForm`, yang mewajibkan `current_password` -
`Hash::check` terhadap NULL selalu gagal, jadi akun sosial **mustahil** mengisi form itu.

## 3. Root cause
Form ganti sandi tak membedakan akun bersandi dan tanpa sandi; prop `hasPassword`
(`ProfileController::edit`) sudah ada tapi hanya dipakai `DeleteUserForm`.

## 4. Fix
- `routes/auth.php` - `POST password/setup-code` (`password.setup-code`), `POST password/setup`
  (`password.setup`), di grup `auth`.
- `Auth\PasswordController`:
  - `sendSetupCode()` - hanya akun TANPA sandi & ber-email; kode `random_int` 6 angka, cache
    `password-setup:code:{id}` = **hash** (10 menit, `SETUP_CODE_TTL`); kirim maks 1x/menit &
    5x/jam (`RateLimiter`, hanya kiriman yang berhasil dihitung); email gagal = kode dibuang +
    pesan di kolom `code`; kode baru me-reset jatah tebakan.
  - `setup()` - `code` digits:6 + `Password::defaults()` confirmed; percobaan dihitung DULU
    (`RateLimiter::hit`, atomik) lalu dicek; > 5 salah = kode dibuang; sukses = sandi dipasang,
    kode dibuang, `signOutOtherDevices()` (sama dengan ganti sandi), email `PasswordCreatedNotification`
    (gagal kirim tak menggagalkan aksi).
  - Logika putus-perangkat-lain `update()` dipindah ke helper privat `signOutOtherDevices()` -
    perilaku `update()` tak berubah.
- `app/Notifications/PasswordSetupCodeNotification.php`, `PasswordCreatedNotification.php` - kanal
  `mail` bawaan (email SISTEM, bukan `Mail::to()`), tidak di-antre, trait `DipicuAkunDemo`.
- `Profile/Partials/CreatePasswordForm.jsx` (baru) - kartu "Buat Kata Sandi": langkah 1 "Kirim Kode"
  (+ "Sudah punya kode"), langkah 2 kode (`inputMode="numeric"`, `autoComplete="one-time-code"`) +
  sandi baru + konfirmasi, "kirim ulang kode". `Profile/Edit.jsx` memilih form dari `props.hasPassword`;
  setelah sukses prop jadi true dan form biasa yang tampil.

## 5. Blast radius
- `PasswordController::update` (refactor helper) - dijaga `PasswordUpdateTest`, `SesiAplikasi*`/TASK_73.
- Cache: **dicek langsung di prod 2026-10-24** (ssh, baca saja): `CACHE_STORE=database`, `config('cache.default')`
  = database, tabel `cache` ada; tanpa `bootstrap/cache/config.php`; `/root/deploy-env.sh` tak menjalankan
  `cache:clear`/`optimize:clear` -> kode tetap ada saat deploy. `SESSION_DRIVER=database` -> `signOutOtherDevices`
  benar-benar menghapus sesi perangkat lain. Email prod: Gmail SMTP, from `tawarinfirst@gmail.com`.
- Email Apple "Hide My Email" (`@privaterelay.appleid.com`): kode hanya sampai bila pengirim
  terdaftar di Apple Developer > Sign in with Apple for Email Communication. Pengirim prod =
  `tawarinfirst@gmail.com` (Gmail SMTP, #191); pendaftarannya di Apple belum dicek - lihat FINDINGS #216.
- Tanpa migrasi, tanpa APK/iOS baru (halaman Profil = web di WebView).

## 6. Verifikasi
- [x] Baseline sebelum: lihat STATUS_LOG.
- [x] `tests/Feature/Auth/PasswordSetupTest.php` (10 test): kode hash + isi email, sukses + sesi lain
  diputus + pemberitahuan + sekali pakai, 5 salah = hangus, kedaluwarsa 10 menit, batas 1/menit &
  5/jam, kode baru menggantikan lama, akun bersandi ditolak, tanpa email ditolak, tamu ditolak,
  Edit.jsx memilih form.
- [x] `AkunDemoTest` (kelas notifikasi baru tercap).
- [x] `npm run build` lulus.
- [ ] Uji di HP (APK & iOS): isi-otomatis kode iOS, email relay Apple.

## 7. Rollback
Revert commit TASK_82. Tak ada data/skema yang perlu dikembalikan (kunci cache kedaluwarsa sendiri).

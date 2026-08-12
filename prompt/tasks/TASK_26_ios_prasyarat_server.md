# TASK 26 — Prasyarat server untuk wrapper iOS (APNs + audiens Google + device_type)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_26 |
| Severity | P1 (memblokir aplikasi iOS; tidak berdampak ke produksi Android saat ini) |
| Tipe | fitur kecil (dukungan platform baru) |
| Sumber | Permintaan user 2026-08-11 — "buat SisupitWebView untuk iOS" |
| Status | **DONE** (kode) 2026-08-12 — sisa: isi `GOOGLE_IOS_CLIENT_ID` di server + verifikasi manual di device Android |

> Task ini **hanya sisi server**. Pembangunan aplikasi iOS-nya sendiri dipandu oleh
> `docs/ios/PROMPT_SISUPIT_IOS.md` dan dikerjakan di macOS (Xcode).
> **Task ini harus selesai & ter-deploy lebih dulu**, kalau tidak Fase 3 & 4 di dokumen
> itu tidak bisa diuji sama sekali.

---

## 1. Deskripsi masalah / tujuan

Aplikasi web sudah punya jalur native yang matang untuk Android (jembatan
`window.AndroidBridge`, FCM data-only, verifikasi Google ID token). Saat wrapper iOS
dibuat, **tiga tempat di server berperilaku Android-saja** dan akan menggagalkan iOS.

Tujuan: membuat ketiganya sadar-platform **tanpa mengubah perilaku Android sedikit pun**.

## 2. Reproduce (bukti masalah ada)

Belum ada app iOS, jadi pembuktian bersifat analitis atas kode + perilaku platform:

1. **APNs.** `toFcm()` mengirim payload tanpa blok `apns`. FCM menerjemahkan pesan
   tanpa `apns.payload.aps.alert` sebagai *background push* di iOS: tidak ada UI,
   dibatasi sistem, dan tidak terkirim saat app tertutup. → notifikasi darurat
   **tidak akan pernah muncul** di iPhone.
2. **Audiens Google.** `SocialiteController.php:75` menuntut `aud` **sama persis**
   dengan satu nilai (Web client ID). `GIDSignIn` iOS menerbitkan `idToken` dengan
   `aud` = iOS client ID → percabangan selalu jatuh ke
   `'Akun Google tidak dapat diverifikasi.'`
3. **device_type.** `resources/js/Layouts/AppLayout.jsx:36` memaku `device_type: 'android'`
   untuk **semua** WebView, termasuk nanti iPhone → isi tabel `fcm_tokens` menyesatkan
   saat mendiagnosis kegagalan kirim per platform.

## 3. Root cause

- `app/Notifications/EmergencyAlertNotification.php:73-77` — `->custom([...])` hanya
  memuat kunci `'android'`. Keputusan data-only (didokumentasikan di komentar baris
  52-59) benar untuk Android, tetapi tidak pernah dipasangkan penyeimbang untuk iOS.
- `app/Http/Controllers/Auth/SocialiteController.php:70-79` — `$expectedAud` bernilai
  tunggal `config('services.google.client_id')`, dibandingkan dengan `!==`. Satu app
  = satu client ID, asumsi yang pecah begitu ada klien native kedua.
- `resources/js/Layouts/AppLayout.jsx:36` — nilai literal, ditulis saat hanya Android
  yang ada.

## 4. Rencana fix (perubahan terkecil yang benar)

- `app/Notifications/EmergencyAlertNotification.php` — tambahkan kunci `'apns'` di
  samping `'android'` yang sudah ada (**jangan sentuh blok `android`, jangan hapus
  `data`**; Android produksi bergantung pada keduanya). Payload perlu:
  - `payload.aps.alert` = `{ title, body }` → agar iOS menampilkan notifikasi
  - `payload.aps.sound` = `'sirine.caf'` → berkas suara di bundle app iOS
  - `payload.aps.interruption-level` = `'time-sensitive'` → menembus Focus/DND
    (naikkan ke `'critical'` + `sound` sebagai objek `{ critical: 1, name: 'sirine.caf', volume: 1.0 }`
    **hanya setelah** entitlement Critical Alerts disetujui Apple)
  - `payload.aps.mutable-content` = 1, `payload.aps.content-available` = 1
    → `onMessageReceived` versi iOS tetap jalan untuk deep-link
  - `payload.aps.thread-id` = `'emergency'`, dan headers `apns-priority: '10'`,
    `apns-push-type: 'alert'`
  - `data` yang sudah ada (`action_url`, `report_id`, dst.) tetap terkirim dan tetap
    terbaca di iOS — **jangan duplikasi `action_url` ke dalam `aps`**.
  > Verifikasi bentuk array `custom()` terhadap versi `laravel-notification-channels/fcm`
  > yang terpasang (`composer show laravel-notification-channels/fcm`) sebelum menulis —
  > bentuk kunci `apns` berbeda antar versi mayor. Jangan menyalin dari ingatan.

- `app/Http/Controllers/Auth/SocialiteController.php` — ubah `$expectedAud` (tunggal)
  menjadi **daftar putih audiens**, mis. dibaca dari `config('services.google.client_id')`
  ditambah `config('services.google.ios_client_id')`, lalu ganti `!==` menjadi
  `! in_array($payload['aud'], $allowedAuds, true)` dengan `array_filter()` agar nilai
  kosong tidak lolos. **Tetap daftar putih** — jangan longgarkan validasi `aud`,
  `iss`, `sub`, atau `email_verified`; empat-empatnya adalah pertahanan agar token
  terbitan aplikasi lain tidak bisa dipakai login.

- `config/services.php` — tambah kunci `ios_client_id` di blok `google`, dibaca dari
  `env('GOOGLE_IOS_CLIENT_ID')` (ikut pola kunci yang sudah ada di blok itu).

- `.env.example` — dokumentasikan `GOOGLE_IOS_CLIENT_ID` (kosong = fitur mati, aman).

- `resources/js/Layouts/AppLayout.jsx:36` — ganti literal `'android'` dengan deteksi
  sederhana dari `navigator.userAgent` (`/iPhone|iPad|iPod/i` → `'ios'`, selain itu
  `'android'`).
  > Sudah diperiksa: `app/Http/Controllers/Api/FcmController.php:16` memvalidasi
  > `device_type` sebagai `nullable|string` **tanpa daftar nilai**, dan baris 29 memakai
  > `?? 'android'` hanya sebagai default. Jadi nilai `'ios'` langsung diterima —
  > **tidak perlu perubahan di controller**. Jangan tambahkan validasi enum baru
  > (di luar scope task ini).

## 5. Blast radius

- **`EmergencyAlertNotification` dipakai untuk SEMUA siaran darurat** dan sudah
  terbukti di produksi Android. Menambah kunci `apns` tidak mengubah pengiriman
  Android, **tapi payload yang salah bentuk bisa membuat FCM menolak SELURUH pesan**
  → Android ikut mati. Ini risiko terbesar task ini. Wajib diuji ke device Android
  nyata sebelum dianggap selesai, bukan hanya lewat test.
- `SocialiteController::handleNativeGoogle` dipakai login **dan** daftar dari Android
  (`Login.jsx`, `Register.jsx`). Perubahan `aud` menyentuh jalur auth → salah sedikit
  = login Android putus. Uji regresi login Google Android **sebelum** rilis.
- `AppLayout.jsx` termuat di setiap halaman terautentikasi → perubahan apa pun di sana
  memerlukan `npm run build`.
- Tabel `fcm_tokens` menerima nilai `device_type` baru; periksa apakah ada kueri/laporan
  yang mengasumsikan hanya `'android'`.

## 6. Rencana verifikasi

- [ ] Baseline test sebelum: `php artisan test` → catat hasil (baseline tercatat
      terakhir: 85 passed, 216 assertions — konfirmasi angka aktual saat mulai)
- [ ] Tambah regression test (Pest, pola `tests/Feature/Sisupit/*`):
  - [ ] `toFcm()` menghasilkan blok `apns` **dan** `android`, serta `data.action_url`
        tetap menunjuk `reports.show` (jaga agar bug 404 lama tidak kembali)
  - [ ] `handleNativeGoogle` menerima token ber-`aud` iOS client ID, **menolak** `aud`
        asing, dan tetap menerima Web client ID (jalur Android)
- [ ] Test sesudah hijau (≥ baseline)
- [ ] `npm run build` lulus
- [ ] **Verifikasi manual WAJIB di device Android nyata sebelum rilis:**
  - [ ] Kirim laporan darurat → notifikasi Android tetap muncul, sirine tetap bunyi,
        tap tetap membuka detail laporan (bukti tidak ada regresi)
  - [ ] Login Google dari APK Android tetap berhasil
- [ ] Verifikasi iOS: menyusul di Fase 3 & 4 `docs/ios/PROMPT_SISUPIT_IOS.md`

## 7. Rollback

Tiga perubahan terpisah dan saling bebas → buat **commit fokus per berkas**
(notifikasi / auth+config / frontend) sehingga bisa `git revert` satu per satu.
`GOOGLE_IOS_CLIENT_ID` yang kosong membuat perubahan auth berperilaku persis
seperti sebelumnya, jadi tersedia jalur mundur lewat konfigurasi tanpa deploy ulang.

---

## Acceptance criteria
- [ ] Tujuan tercapai: payload iOS terkirim, `aud` iOS diterima, `device_type` jujur
- [ ] **Nol regresi Android** — notifikasi & login Google Android terbukti masih jalan
      di device nyata, bukan hanya hijau di test
- [ ] Tidak ada regresi test (≥ baseline)
- [ ] Diff minimal & sesuai konvensi (`prompt/docs/CONVENTIONS.md`)
- [ ] Validasi `aud`/`iss`/`sub`/`email_verified` tetap ketat (daftar putih, bukan longgar)
- [ ] Dokumen terkait diupdate: `prompt/docs/ARCHITECTURE_MAP.md` (payload notifikasi &
      audiens Google), `prompt/docs/FINDINGS_LOG.md` bila dicatat sebagai temuan

---

## LAPORAN PELAKSANAAN — 2026-08-12

### Perubahan
- `app/Notifications/EmergencyAlertNotification.php` — tambah blok `apns` di samping
  `android` yang sudah ada. `custom()` di paket v5.1.0 di-*spread* ke level atas pesan
  (`FcmMessage::toArray()`: `...$this->custom`), jadi bentuknya mengikuti FCM v1 REST API:
  `apns.headers` + `apns.payload.aps`. Blok `data` & `android` **tidak disentuh**.
- `app/Http/Controllers/Auth/SocialiteController.php` — `$expectedAud` (nilai tunggal,
  `!==`) → `$allowedAuds` (daftar putih, `in_array(..., true)`) dengan `array_filter()`.
  Validasi `iss`/`sub`/`email`/`email_verified` tidak diubah.
- `config/services.php` — kunci `google.ios_client_id` dari `GOOGLE_IOS_CLIENT_ID`.
- `.env.example` — blok Google Sign-In terdokumentasi (4 kunci, semua dikomentari).
- `resources/js/Layouts/AppLayout.jsx` — `device_type` dari literal `'android'` menjadi
  deteksi UA (`ios`/`android`).
- Test baru: `tests/Feature/Sisupit/EmergencyAlertApnsPayloadTest.php` (5 test) &
  `tests/Feature/Sisupit/NativeGoogleAudienceTest.php` (4 test).

### Verifikasi
- Baseline sebelum: **193 passed, 752 assertions**. Sesudah: **201 passed, 782 assertions**
  (+8 test baru, nol merah). Catatan: baseline nyata jauh di atas angka 65/85 yang tertulis
  di `CLAUDE.md`/`MASTER_PROMPT.md` — angka di dokumen itu sudah usang.
- `vendor/bin/pint` bersih pada 5 berkas PHP yang disentuh.
- `npm run build` lulus (client + SSR).

### Yang BELUM dikerjakan (butuh tindakan di luar kode)
- `GOOGLE_IOS_CLIENT_ID` belum ada nilainya — iOS OAuth client belum dibuat di project
  `sisupit-c1e5a`. Sampai diisi, jalur iOS tetap ditolak (perilaku aman, bukan galat).
- **Verifikasi manual di device Android nyata belum dilakukan** (tak ada device di sesi
  ini). Ini syarat rilis, bukan opsional: uji kirim laporan darurat → notifikasi muncul,
  sirine bunyi, tap membuka detail; dan login Google dari APK tetap berhasil.
- `public/build` ikut berubah (297 berkas) karena `AppLayout.jsx` disentuh. Deploy produksi
  = `git pull` tanpa build step, jadi hasil build **harus** ikut ter-commit agar perubahan
  `device_type` sampai ke produksi — ikuti pola commit terpisah `chore(build): ...`.

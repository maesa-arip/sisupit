# Kontrak Web ↔ Native (Android & iOS)

Diverifikasi langsung dari kode pada **2026-09-30**: repo web @`0ed89dd5` dan sumber APK
1.1.5/vc7 (`MainActivity.java`, `SisupitFirebaseMessagingService.java`). Rujukan baris
menunjuk repo web kecuali disebut lain.

---

## 1. User-Agent - penanda "ini aplikasi, bukan browser"

UA WebView **wajib mengandung token `SisupitApp`**.

| | Cara |
|---|---|
| Android | UA bawaan, buang `"; wv"` (Google memblokir login dari WebView bertanda itu), lalu tambah `" SisupitApp"` |
| iOS | UA bawaan + `" SisupitApp"` (mis. `configuration.applicationNameForUserAgent = "SisupitApp"`, verifikasi hasilnya lewat `navigator.userAgent`) |

Yang membacanya:

- `app/Http/Controllers/HomeController.php` - `/` me-redirect aplikasi: tamu → `/spotlight`,
  sudah login → `/dashboard` (browser tetap melihat landing).
- `Pages/Landing.jsx` - jaring pengaman sisi klien untuk hal yang sama.
- `Pages/{Home,Spotlight,Auth/Login,Profile/Edit}.jsx` - menyembunyikan tombol
  "Unduh APK" bila UA = `SisupitApp` **atau** WebView iOS
  (`/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/`).
- `Layouts/AppLayout.jsx:34` - `device_type` token FCM: `ios` bila UA memuat
  `iPhone|iPad|iPod`, selain itu `android`.
  **Awas iPad:** iPadOS 13+ ber-UA "Macintosh" → tercatat `android`. Lihat `PARITAS.md` §Celah.

---

## 2. Jembatan JS - `window.AndroidBridge`

Web **hanya** memanggil `window.AndroidBridge.*`. Android menyuntikkannya lewat
`addJavascriptInterface(new WebAppInterface(), "AndroidBridge")`. iOS menyuntikkan **shim
dengan nama yang sama** lewat `WKUserScript` (**atDocumentStart**, `forMainFrameOnly: false`)
di atas `webkit.messageHandlers`:

```js
window.AndroidBridge = {
  postToken: function (t) { webkit.messageHandlers.sisupit.postMessage({ action: 'postToken', value: t || '' }); },
  signInWithGoogle: function () { webkit.messageHandlers.sisupit.postMessage({ action: 'signInWithGoogle' }); },
  setPullToRefreshEnabled: function (on) { webkit.messageHandlers.sisupit.postMessage({ action: 'setPullToRefreshEnabled', value: !!on }); },
  onBackgroundColorDetected: function (color, isLight) { webkit.messageHandlers.sisupit.postMessage({ action: 'onBackgroundColorDetected', value: { color: color, isLight: !!isLight } }); }
};
```

### 2.1 Daftar metode (Web → Native)

| # | Metode | Dipanggil dari | Native harus | Sejak APK |
|---|---|---|---|---|
| 1 | `postToken('')` | `AppLayout.jsx` - di-**poll** tiap 500 ms sampai jembatan terdeteksi, menyerah setelah 15 dtk; hanya saat login | ambil token FCM (retry 4× backoff 2/4/6 dtk), lalu panggil `window.receiveFcmTokenFromNative(token)` | lama |
| 2 | `signInWithGoogle()` | `Auth/Login.jsx`, `Auth/Register.jsx` | buka account picker Google native; hasil lewat callback §2.2 | lama |
| 3 | `setPullToRefreshEnabled(bool)` | `Components/ui/dialog.jsx` - `false` saat dialog pertama terbuka, `true` saat dialog terakhir tertutup (dihitung, dialog bisa bertumpuk) | matikan/nyalakan tarik-untuk-refresh. Android juga **menyalakannya lagi di setiap `onPageFinished`** (halaman yang ditinggal saat dialog terbuka tak sempat menyalakan kembali) | **1.1.4 (TASK_65)** |
| 4 | `onBackgroundColorDetected(rgb, isLight)` | **bukan web** - skrip yang disuntik native sendiri tiap `onPageFinished` (MutationObserver + interval 1 dtk membaca `background-color` body/html) | warnai status bar & navigation bar, ikon terang/gelap menurut `isLight` | lama |

Metode 3 bersifat opsional di web (`typeof … === 'function'`); iOS **wajib** memasangnya
bila iOS punya tarik-untuk-refresh (`UIRefreshControl`), karena masalah yang sama
(menggulir daftar di dalam dialog memicu muat ulang) akan terjadi.

Metode 4 di iOS opsional - padanannya adalah mewarnai area safe-area atas; boleh diganti
cara native lain asal status bar tetap terbaca di mode gelap.

### 2.2 Callback (Native → Web)

Dipanggil lewat `evaluateJavascript`/`evaluateJavaScript` **di main thread**, selalu
dengan guard `if (window.X) { … }`. **Escape string dengan aman** (iOS: `JSONSerialization`;
Android saat ini menyambung string dan meng-escape `\ ' \n \r` untuk pesan galat).

| Callback | Arti | Dipasang di |
|---|---|---|
| `window.receiveFcmTokenFromNative(token)` | token FCM perangkat. Sengaja **tidak** dihapus saat unmount - balasan async bisa datang sesudah pindah halaman | `AppLayout.jsx:60` |
| `window.onGoogleCredential(idToken)` | Google **ID token** (bukan access token). Web mem-POST ke `/auth/google/native` | `Login.jsx`, `Register.jsx` |
| `window.onGoogleSignInCancelled()` | user membatalkan picker | idem |
| `window.onGoogleSignInError(msg)` | gagal (Login menampilkan `msg` sebagai Alert merah). Bila halaman tak punya handler ini, Android jatuh ke `onGoogleSignInCancelled` | idem |

---

## 3. Endpoint yang terlibat

Native **tidak memanggil HTTP sendiri** - native menyerahkan token lewat jembatan, web
yang mengurus sesi, CSRF, dan retry. Jangan buat jalur HTTP native kedua.
(Android masih menyimpan `sendTokenToServer()` ke `/api/fcm-token` - **kode mati**, rutenya
sudah dikomentari di `routes/api.php:11`. Jangan ditiru.)

| Rute | Method | Body | Oleh | Catatan |
|---|---|---|---|---|
| `/fcm-token` (`fcm.store`) | POST | `{ token, device_type }` | web | token per-PERANGKAT: token yang sama dipindah dari akun lain ke akun yang sedang login (`FcmController`) |
| `/auth/google/native` (`google.native`) | POST | `{ credential: <ID token> }` | web | server memverifikasi `aud` terhadap DAFTAR: Web Client ID + `GOOGLE_IOS_CLIENT_ID` (`SocialiteController.php:86`). **iOS Client ID wajib terisi di `.env` server** |
| `/auth/google` | GET | - | browser biasa | redirect OAuth, BUKAN untuk wrapper (Google menolak OAuth di WebView) |
| `/logout` | POST | `{ fcm_token }` | web | melepas token perangkat supaya HP berhenti menerima sirine setelah keluar |
| `/reports/show/{id}` (`reports.show`) | GET | - | deep-link notifikasi | **bukan** `/reports/{id}` (dulu 404) |
| `/profile#hapus-akun` | - | - | halaman web | hapus akun mandiri (#157, syarat Play & App Store). Murni web, tak butuh native |
| `/apk/sisupit.apk` | GET | - | tombol unduh di browser | disembunyikan di dalam aplikasi |

---

## 4. Push notification (FCM)

Semua kiriman adalah **DATA-ONLY** (tanpa blok `notification`) + `android.priority=high`,
supaya `onMessageReceived` Android selalu jalan (suara per-tahap + deep-link). Untuk iOS,
server menambahkan blok `apns` di samping blok `data` - **kecuali satu jenis, lihat 4.3**.

### 4.1 Kunci `data` (dibaca kedua platform)

| Kunci | Selalu ada | Isi |
|---|---|---|
| `title`, `body` | ya | teks notifikasi (Android membangun notifikasinya sendiri dari sini) |
| `report_id` | ya | string angka. Android memakainya sebagai ID notifikasi & requestCode PendingIntent |
| `action_url` | ya | URL lengkap deep-link (`https://<domain>/reports/show/{id}`). Muat **apa adanya**, jangan susun ulang dari `report_id`. Validasi host dulu (`sisupit.com` + subdomain). Fallback lama: `url` |
| `type` | ya | `emergency` \| `agency_dispatch` \| `agency_confirmation` \| `report_status` |
| `alert_stage` | hanya `emergency` | `report_incoming` (laporan baru, belum diverifikasi) \| `dispatch` (sudah diverifikasi → meluncur) |
| `user_role` | hanya `emergency` | peran penerima (`petugas`, `relawan`, `pejabat`, `admin`, …) |
| `event` | hanya `report_status` | `approved`, `en_route`, `arrived`, `resolved`, `merged`, … |
| `agency_id` | agency_* | id instansi |

> Penanda tahap **sengaja tidak bernama `type`**: `BroadcastNotificationCreated` menimpa
> kunci `type` di jalur siaran Reverb (aplikasi desktop), jadi nilai kita hilang di sana.

### 4.2 Empat tingkat suara (TASK_50) - aturan pemetaan

Pembedanya **tindakan yang diminta**, bukan topik. Yang **tak dikenal → DARURAT** (gagal
berisik lebih aman daripada gagal diam; build lama otomatis tetap bersirine).

| Tingkat | Aturan (urut) | Android: channel / suara / getar | Insisten* | iOS: `aps.sound` dari server |
|---|---|---|---|---|
| KOORDINASI | `type` = `agency_confirmation` / `agency_dispatch` | `coordination_v2` "Koordinasi OPD", `konfirmasi.wav`, USAGE_NOTIFICATION, IMPORTANCE_HIGH, getar 120-90-120-90-120 | tidak | **tak ada `sound`** → senyap (celah, lihat PARITAS) |
| STATUS | `type` = `report_status` | `status_update_v2` "Status Laporan", **nada bawaan sistem**, IMPORTANCE_DEFAULT | tidak | **tak ada blok `apns` sama sekali** (celah) |
| MASUK | `alert_stage` = `report_incoming` | `incoming_report_v2` "Laporan Masuk", `masuk.wav`, USAGE_NOTIFICATION, **tanpa bypass DND**, getar 200-150-200 | ya | `masuk.caf` |
| DARURAT | selain itu (`dispatch` / tak dikenal) | `emergency_channel_v5` "Darurat", `sirine.mp3`, **USAGE_ALARM** (tembus mode senyap), bypass DND, getar 500-250-500 | ya | `sirine.caf` |

\* Insisten = `FLAG_INSISTENT`: suara diulang sampai notifikasi disentuh. Jeda antar-ulang
tak bisa diatur di Android, karena itu `masuk.wav` membawa ~2,4 dtk sunyi di ekornya
(berdenting tiap ~3,7 dtk). iOS tak punya padanan pengulangan; suara diputar sekali.

Berkas suara persis milik APK ada di [`aset/suara/`](aset/suara/). iOS hanya menerima
`.caf/.wav/.aiff` **≤ 30 dtk** di main bundle, dengan **nama persis** seperti di kolom
terakhir (nama salah = bunyi bawaan tanpa galat):

```sh
afconvert aset/suara/sirine.mp3     sirine.caf     -d ima4 -f caff -v   # ~24,45 dtk
afconvert aset/suara/masuk.wav      masuk.caf      -d ima4 -f caff -v
afconvert aset/suara/konfirmasi.wav konfirmasi.caf -d ima4 -f caff -v   # untuk kelak, lihat celah #2
```

### 4.3 Blok `apns` per jenis (keadaan server saat ini)

| Jenis | `apns` | `interruption-level` | `sound` | `thread-id` |
|---|---|---|---|---|
| `emergency` / `report_incoming` | ada | `time-sensitive` | `masuk.caf` | `emergency` |
| `emergency` / `dispatch` | ada | `time-sensitive` | `sirine.caf` | `emergency` |
| `agency_dispatch`, `agency_confirmation` | ada | `time-sensitive` | - | `agency` |
| `report_status` (ke pelapor) | **TIDAK ADA** | - | - | - |

Semua yang punya `apns`: `apns-priority: 10`, `apns-push-type: alert`,
`content-available: 1` (emergency juga `mutable-content: 1`).
`critical` (tembus saklar senyap iPhone) baru boleh dinaikkan **di server** setelah Apple
menyetujui entitlement Critical Alerts - app dan server harus naik bersamaan.

### 4.4 Tap notifikasi

Android: PendingIntent ke `MainActivity` (bukan Splash) dengan extra `url` = `action_url`,
`launchMode=singleTop` + `CLEAR_TOP|SINGLE_TOP` → app yang sudah terbuka menerima
`onNewIntent` dan `loadUrl(url)`; app dingin memuat `url` sebagai halaman awal.
iOS: `userNotificationCenter(_:didReceive:)` → baca `action_url` dari `userInfo` →
validasi host → `webView.load`. Bila WebView belum siap (cold start), simpan dulu lalu
muat setelah siap.

### 4.5 Channel Android - kenapa ID-nya sudah v5/v2

Suara melekat pada channel dan setelan channel **permanen** di perangkat. URI suara lama
berbentuk angka (`R.raw.*`) bergeser saat berkas suara ditambah → perangkat yang
meng-update memutar nada salah. Sejak 1.1.3 URI **ber-nama** (`android.resource://pkg/raw/sirine`)
dan ID dinaikkan. Tidak relevan untuk iOS (suara iOS ditentukan payload), tapi relevan bila
iOS kelak memakai `UNNotificationCategory` dengan suara tetap.

---

## 5. Aplikasi desktop (.exe) - bukan FCM

Untuk kelengkapan: SisupitDesktop (Electron, Pusat Komando) **tidak** memakai FCM; ia
mendengar Reverb di channel privat `App.Models.User.{id}` lewat `via()` 'broadcast'.
Perubahan payload FCM tidak memengaruhinya, tapi perubahan `toArray()` notifikasi iya.

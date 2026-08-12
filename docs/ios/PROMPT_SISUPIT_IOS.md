# MASTER PROMPT — SisupitWebView **iOS**
# Versi 1.0 · disusun 2026-08-11 · sumber kebenaran untuk membangun wrapper iOS

> **Cara pakai:** file ini ditulis untuk ditempel utuh sebagai prompt pembuka di sesi
> Claude Code yang berjalan di **macOS + Xcode** (build iOS tidak bisa dari Windows).
> Isinya sengaja *self-contained* — sesi di Mac tidak punya akses ke repo Laravel ini,
> jadi semua kontrak sisi web sudah disalin ke Bagian 2 dan **tidak boleh ditebak ulang**.

---

## 0. IDENTITAS & ATURAN MAIN

Kamu membangun **SisupitWebView untuk iOS**: pembungkus native (WKWebView) untuk
aplikasi web Sisupit DAMKAR (Laravel + Inertia/React) di `https://sisupit.com`.

Padanan Android sudah **berjalan di produksi** selama ~1,5 bulan di
`C:\Users\Admin\AndroidStudioProjects\SisupitWebView` (package `com.sisupit.app`).
Pekerjaan ini adalah **memindahkan perilaku yang sudah terbukti**, bukan mendesain ulang.

Aturan yang diwarisi dari `prompt/MASTER_PROMPT.md` proyek web:

1. **Understand → Change → Verify.** Jangan edit file yang belum dibaca utuh.
2. **Kontrak web adalah HUKUM.** Sisi web sudah dipakai Android; jangan ubah web
   untuk menyenangkan iOS kecuali Bagian 6 menyatakannya wajib.
3. **Match, don't impose.** Tiru keputusan yang sudah dibayar mahal di Android
   (Bagian 4), jangan ulangi eksperimen yang sudah gagal di sana.
4. **Surface, don't surprise.** Temuan di luar scope → catat, jangan kerjakan diam-diam.
5. **Satu fase = satu tujuan.** Kerjakan Bagian 5 berurutan, berhenti & lapor tiap fase.

**Bahasa dokumen & komentar kode: Bahasa Indonesia** (ikut konvensi repo web).

---

## 1. SASARAN TEKNIS

| Item | Nilai |
|------|-------|
| Nama app | Sisupit |
| Bundle ID | `com.sisupit.app` (namespace iOS terpisah dari Android, boleh sama) |
| Deployment target | **iOS 15.0** — di bawah itu `WKWebView` tak punya `navigator.geolocation` |
| Bahasa | Swift 5.9+, UIKit (bukan SwiftUI — lifecycle push & WKWebView lebih lurus di UIKit) |
| Arsitektur | WKWebView full-screen + jembatan JS + FCM + CoreLocation |
| URL awal | `https://sisupit.com/` (root; server yang me-redirect berdasarkan UA) |
| Firebase | project **`sisupit-c1e5a`** (project number 74357247971) — sama dengan Android |
| Repo | **Buat git repo dari commit pertama.** Android tidak punya git dan itu menyakitkan — satu-satunya catatan perubahan selama 1,5 bulan adalah file memori. Jangan ulangi. |

**Bukan tujuan:** menulis ulang UI secara native, mode offline, atau fitur yang tidak
ada di Android. Paritas dulu, baru pertimbangkan tambahan.

---

## 1.1 BERKAS YANG HARUS ADA DI MAC (Mac kosong → siap kerja)

### A. Disalin dari PC Windows — 4 berkas, total ±0,9 MB

Aset biner ini **tidak bisa dibuat ulang dari teks** dan tidak ada di internet.

> **Sudah disiapkan** (2026-08-12) di PC Windows: `C:\Users\Admin\Desktop\bahan-ios\` —
> keempat berkas di bawah sudah ada di sana. Cukup salin **satu folder itu** ke Mac
> lewat USB/AirDrop/cloud. Bila folder itu sudah tidak ada, kumpulkan ulang dari
> kolom "Berkas sumber".

| Di `bahan-ios/` | Berkas sumber (di PC) | Ukuran | Jadi apa di iOS |
|---|---|---|---|
| `PROMPT_SISUPIT_IOS.md` | `sisupit\docs\ios\PROMPT_SISUPIT_IOS.md` | ±31 KB | prompt pembuka sesi |
| `sirine.mp3` | `…\SisupitWebView\app\src\main\res\raw\sirine.mp3` | 782.418 B | `sirine.caf` (konversi, lihat 4.3) |
| `icon_1024.png` | `…\SisupitWebView\icons\icon_1024.png` | 47.050 B | AppIcon 1024 (flatten, lihat 4.4) |
| `petir_launchscreen.png` | `…\SisupitWebView\app\src\main\res\drawable\sisupit_new.png` (**diganti nama**) | 20.917 B | petir LaunchScreen |

Sifat kedua gambar sudah diperiksa (2026-08-12), **jangan tertukar** — keduanya
1024×1024 dan sama-sama bersudut transparan, tapi isinya berbeda jauh:

- `icon_1024.png` — kotak-bulat **merah** + petir putih, **sudut TRANSPARAN**
  (94,6% opaque). AppIcon iOS **haram beralpha**, jadi flatten dulu ke `#E0241B`:
  ```sh
  sips -s format png icon_1024.png --out /tmp/x.png   # (opsional, normalisasi)
  # flatten alpha → latar merah, hasil = kotak penuh; iOS memasang mask-nya sendiri
  magick icon_1024.png -background '#E0241B' -alpha remove -alpha off AppIcon-1024.png
  ```
  Tanpa ImageMagick, gunakan Preview/Pixelmator atau skrip Python PIL
  (`Image.new('RGB', im.size, (224,36,27)).paste(im, mask=im.split()[3])`).
- `petir_launchscreen.png` — **petir putih di atas transparan** (hanya 6,2% opaque,
  tanpa kotak merah). Dipakai apa adanya sebagai gambar di `LaunchScreen.storyboard`
  di atas latar `#E0241B`. **Jangan di-flatten** — transparansinya justru yang dipakai.

**Tidak perlu disalin:** repo Laravel (kontrak sudah disalin ke Bagian 2) dan seluruh
proyek Android (hanya 3 aset di atas yang relevan).

### B. Diambil langsung di Mac dari konsol web — bukan dari PC

| Berkas | Diambil di | Catatan |
|---|---|---|
| `GoogleService-Info.plist` | Firebase console → project **`sisupit-c1e5a`** → tambah app iOS (bundle `com.sisupit.app`) | jangan pakai punya Android (`google-services.json`) |
| APNs Auth Key `.p8` | Apple Developer → Keys → aktifkan APNs | **hanya bisa diunduh SEKALI** — simpan baik-baik; lalu unggah ke Firebase → Cloud Messaging |
| iOS OAuth Client ID | Google Cloud console, project **`sisupit-c1e5a`** | wajib project yang sama (lihat 4.8) |

> ⚠️ **iOS Client ID juga harus dipasang di server**, bukan hanya di app: isi
> `GOOGLE_IOS_CLIENT_ID` di `.env` produksi/staging lalu `php artisan config:clear`.
> Tanpa itu server menolak token iPhone. Lihat Bagian 6.

### C. Penyiapan Mac kosong (urut, sekali saja)

1. **Xcode** dari Mac App Store (±15 GB, unduhan lama — mulai duluan). Buka sekali agar
   komponen tambahan terpasang, lalu setujui lisensinya.
2. `xcode-select --install` — Command Line Tools.
3. Masuk Apple ID di Xcode → Settings → Accounts (akun Apple Developer berbayar).
4. **Dependensi pakai Swift Package Manager**, bukan CocoaPods — di Mac bersih SPM sudah
   built-in, tak ada yang perlu dipasang:
   - `https://github.com/firebase/firebase-ios-sdk` → produk `FirebaseMessaging`
   - `https://github.com/google/GoogleSignIn-iOS` → produk `GoogleSignIn`
5. `afconvert` (untuk sirine) sudah bawaan macOS — tidak perlu instalasi.
6. `git init` di folder proyek pada commit pertama (lihat Bagian 1).
7. Opsional, bila mau dibantu Claude Code di Mac: pasang Node lalu
   `npm install -g @anthropic-ai/claude-code`.

---

## 2. KONTRAK WEB — SALINAN VERBATIM (JANGAN DITEBAK, JANGAN DIUBAH)

Semua di bawah ini sudah diverifikasi langsung dari kode Laravel pada 2026-08-11.
Angka baris merujuk repo web `C:\laragon\www\sisupit`.

### 2.1 User-Agent — penentu apakah app dianggap "aplikasi", bukan browser

Server membaca UA dan me-redirect landing page publik:

```php
// app/Http/Controllers/HomeController.php:24
if (str_contains($request->userAgent() ?? '', 'SisupitApp')) {
    // guest → /spotlight ; login → /dashboard   (browser biasa tetap lihat landing)
}
```

Front-end juga mengecek hal yang sama di `Login.jsx:22`, `Register.jsx`, `Spotlight.jsx:22`,
`Home.jsx:28`, `Profile/Edit.jsx:48`, dan jaring pengaman `Landing.jsx:34`.

**WAJIB:** UA WebView harus **mengandung token `SisupitApp`**. Android memakai UA
default lalu menghapus `"; wv"` dan menambahkan `" SisupitApp"` di ujung.

Di iOS, ambil UA bawaan lalu tambahkan sufiks — jangan karang UA dari nol:

```swift
webView.evaluateJavaScript("navigator.userAgent") { ua, _ in
    guard let ua = ua as? String else { return }
    webView.customUserAgent = ua + " SisupitApp"
}
```

Alternatif lebih ringkas (`webView.configuration.applicationNameForUserAgent = "SisupitApp"`)
boleh dipakai **asal diverifikasi** hasil akhirnya benar-benar memuat `SisupitApp` —
cek dengan membuka halaman uji dan membaca `navigator.userAgent`.

### 2.2 Jembatan JS — nama fungsi TIDAK BOLEH diganti

Web memanggil objek bernama **`window.AndroidBridge`**. Namanya keliru untuk iOS,
tapi **tetap pakai nama itu** — mengganti nama berarti menyentuh 4+ file web yang
sudah stabil di produksi Android (langgar "diff minimal"). Catat sebagai utang nama.

`WKWebView` tidak bisa menyuntik objek sinkron seperti `@JavascriptInterface` Android.
Solusinya: **`WKUserScript` (atDocumentStart, mainFrameOnly=false)** yang mendefinisikan
`window.AndroidBridge` sebagai shim tipis di atas `webkit.messageHandlers`.

Shim minimum yang harus disuntikkan:

```js
window.AndroidBridge = {
  postToken: function (t) { webkit.messageHandlers.sisupit.postMessage({ action: 'postToken', value: t || '' }); },
  signInWithGoogle: function () { webkit.messageHandlers.sisupit.postMessage({ action: 'signInWithGoogle' }); }
};
```

**Empat titik kontrak** (arah panggilan penting — jangan dibalik):

| # | Web → Native | Native → Web (balasan) | Sumber di web |
|---|---|---|---|
| 1 | `window.AndroidBridge.postToken('')` | `window.receiveFcmTokenFromNative(token)` | `AppLayout.jsx:69-74` (di-poll tiap 500 ms, menyerah setelah 15 detik) |
| 2 | `window.AndroidBridge.signInWithGoogle()` | `window.onGoogleCredential(idToken)` | `Login.jsx:80-82`, `Register.jsx:65-67` |
| 3 | — | `window.onGoogleSignInCancelled()` | `Login.jsx:62` (user batal pilih akun) |
| 4 | — | `window.onGoogleSignInError(msg)` | `Login.jsx:65-68` (pesan tampil sebagai Alert merah) |

Catatan penting dari Android:

- **`postToken` di-poll**, bukan dipanggil sekali. `AppLayout.jsx` memasang
  `setInterval` 500 ms sampai `window.AndroidBridge` terdeteksi. Shim harus sudah ada
  **sebelum** JS halaman jalan → `WKUserScriptInjectionTime.atDocumentStart`, wajib.
- **`window.receiveFcmTokenFromNative` sengaja tidak dihapus saat cleanup React**
  (`AppLayout.jsx:52-54`) karena balasan native bersifat async dan bisa datang setelah
  pindah halaman. Native boleh memanggilnya kapan saja setelah halaman siap.
- Balasan native ke web harus lewat `evaluateJavaScript` **di main thread**, dan
  string harus di-escape aman (pakai `JSONSerialization`, jangan sambung string mentah —
  pesan galat Google bisa memuat kutip/petik).

### 2.3 Endpoint server yang disentuh app

| Rute | Method | Body | Dipanggil oleh | Sumber |
|------|--------|------|----------------|--------|
| `/fcm-token` (`fcm.store`) | POST | `{ token, device_type }` | **web**, bukan native (native cukup serahkan token via kontrak #1) | `routes/web.php:38`, `AppLayout.jsx:34-37` |
| `/auth/google/native` (`google.native`) | POST | `{ credential: <Google ID token> }` | **web**, setelah menerima `onGoogleCredential` | `routes/web.php:73` |
| `/logout` | POST | `{ fcm_token }` | web (melepas token device saat keluar) | `AuthenticatedSessionController.php:51` |
| `/reports/show/{id}` | GET | — | target deep-link notifikasi | `EmergencyAlertNotification.php:67` |

> **Konsekuensi desain:** native **tidak perlu** memanggil HTTP endpoint apa pun sendiri.
> Native hanya menyediakan token & ID token lewat jembatan; web yang mengurus sesi,
> CSRF, dan retry. Ini menjaga satu jalur auth. Jangan bikin jalur HTTP native kedua.

### 2.4 Payload notifikasi darurat (sudah siap-iOS sejak TASK_26, 2026-08-12)

`app/Notifications/EmergencyAlertNotification.php` mengirim `data` berikut — dipakai
**kedua** platform, dan inilah sumber deep-link:

```php
FcmMessage::create()->data([
    'title'      => '🚨 DARURAT KEBAKARAN!',
    'body'       => (string) $report->address,
    'report_id'  => (string) $report->id,
    'action_url' => route('reports.show', $report->id),  // https://sisupit.com/reports/show/{id}
    'type'       => 'emergency',
    'user_role'  => $userRole,
])->custom(['android' => ['priority' => 'high']]);
```

Data-only tanpa blok `notification` adalah keputusan sadar untuk Android (agar
`onMessageReceived` selalu jalan → sirine + deep-link akurat). Di iOS pilihan itu
justru mematikan notifikasi (lihat 4.1), jadi **blok `apns` sudah ditambahkan di
server** berdampingan dengan `android`:

```php
'apns' => [
    'headers' => ['apns-priority' => '10', 'apns-push-type' => 'alert'],
    'payload' => ['aps' => [
        'alert'              => ['title' => '🚨 DARURAT KEBAKARAN!', 'body' => <alamat>],
        'sound'              => 'sirine.caf',      // ← nama berkas di bundle app iOS
        'interruption-level' => 'time-sensitive',  // ← naik ke 'critical' setelah Apple setuju
        'content-available'  => 1,
        'mutable-content'    => 1,
        'thread-id'          => 'emergency',
    ]],
],
```

**Konsekuensi yang mengikat sisi app:**

- Berkas suara di bundle **wajib bernama persis `sirine.caf`** — server sudah menyebut
  nama itu. Ganti nama = notifikasi berbunyi default, senyap tanpa galat.
- `interruption-level` masih `time-sensitive`. Naikkan ke `critical` **di server**
  (bukan di app) hanya setelah entitlement Apple disetujui — dan app harus punya
  entitlement itu di saat yang sama, kalau tidak APNs menolak kiriman.
- Kunci data yang harus dibaca native iOS: **`action_url`** (deep-link), `report_id`
  (identitas unik notifikasi), `title`, `body`, `type`.

### 2.5 Geolokasi

Web memakai `navigator.geolocation` di banyak halaman (form lapor, peta, lacak responder,
`CompleteProfile`, daftar fasilitas), dengan **empat preset** di
`resources/js/lib/utils.js:25-37` — semuanya sudah disetel khusus agar tahan di WebView:

| Preset | enableHighAccuracy | timeout | maximumAge | Dipakai untuk |
|--------|--------------------|---------|------------|----------------|
| `oneShot` | true | 20000 | 30000 | cari aset terdekat, lengkapi profil |
| `tracking` | true | 20000 | 5000 | `watchPosition` pelacakan responder |
| `fresh` | true | **12000** | **0** | **Lapor darurat langkah-1** — wajib fix paling segar |
| `lowAccuracy` | false | 8000 | 60000 | **Lapor darurat langkah-2** — fallback lokasi jaringan |

Form darurat memakai **strategi dua fase** (`utils.js:85-86`): coba `fresh` dulu, dan bila
gagal/timeout jatuh ke `lowAccuracy`. Ada pula `GEO_ACCURACY_THRESHOLD = 1000` (meter) —
fix yang lebih kasar dari itu ditolak untuk auto-isi yurisdiksi (gejala lama "lokasi lari
ke kota lain").

⚠️ Konsekuensi untuk shim di 4.7: shim yang mengabaikan `maximumAge` akan **merusak
jaminan kesegaran** langkah-1 (mengembalikan fix cache padahal diminta `maximumAge: 0`),
dan shim yang mengabaikan `timeout` membuat fallback ke `lowAccuracy` tidak pernah
terpicu. Kedua parameter itu wajib dihormati, bukan opsional.

Ini fitur **paling kritis** aplikasi — pelapor darurat harus dapat titik lokasi cepat.
Perlakukan kegagalan geolokasi sebagai bug P0, bukan kosmetik.

---

## 3. ARSITEKTUR TARGET

```
SisupitWebView-iOS/
├── Sisupit.xcodeproj
├── Sisupit/
│   ├── AppDelegate.swift            — Firebase config, UNUserNotificationCenter delegate,
│   │                                  registrasi APNs, penanganan tap notifikasi
│   ├── SceneDelegate.swift          — window root = WebViewController
│   ├── WebViewController.swift      — host WKWebView; UA; pull-to-refresh; error state;
│   │                                  navigationDelegate (tautan eksternal → Safari);
│   │                                  penanganan tel:/mailto:/wa.me
│   ├── Bridge/
│   │   ├── bridge.js                — shim window.AndroidBridge (Bagian 2.2)
│   │   └── BridgeHandler.swift      — WKScriptMessageHandler → rute ke Push/Google
│   ├── Push/
│   │   └── PushService.swift        — token FCM → web; parse action_url; deep-link
│   ├── Auth/
│   │   └── GoogleSignInService.swift— GIDSignIn → idToken → window.onGoogleCredential
│   ├── Location/
│   │   └── LocationPermission.swift — minta izin CoreLocation SEBELUM web memanggil
│   ├── Resources/
│   │   ├── sirine.caf               — hasil konversi dari sirine.mp3 Android (≤30 detik!)
│   │   ├── Assets.xcassets/AppIcon  — TANPA alpha (lihat 4.4)
│   │   └── LaunchScreen.storyboard  — latar merah #E0241B + petir putih (identik Android)
│   ├── Info.plist
│   ├── Sisupit.entitlements
│   └── GoogleService-Info.plist     — dari Firebase project sisupit-c1e5a (JANGAN commit
│                                      ke repo publik; simpan, tapi repo ini privat)
└── README.md                        — catatan build + daftar langkah rilis
```

**Retensi memori antar-sesi:** setiap perubahan dicatat sebagai commit git yang bermakna.
Jika bekerja lewat Claude Code, juga tambahkan entri memori proyek seperti yang dilakukan
untuk Android (`project_sisupit_webview_android`).

---

## 4. DELAPAN JEBAKAN — SUDAH DIBAYAR MAHAL DI ANDROID / KHAS iOS

Bagian ini adalah alasan utama dokumen ini ada. Baca **seluruhnya** sebelum menulis kode.

### 4.1 Data-only FCM = notifikasi TIDAK MUNCUL di iOS ⚠️ PALING KRITIS

Android sengaja memakai data-only agar `onMessageReceived` selalu jalan. Di iOS,
pesan tanpa blok `apns.payload.aps.alert` diperlakukan sebagai **background push**
(`content-available`), yang: (a) tidak menampilkan UI apa pun, (b) **dibatasi
(throttled) agresif oleh iOS**, (c) tidak terkirim saat app di-force-quit.

Akibatnya, **tanpa perubahan server, notifikasi darurat tidak akan muncul sama sekali
di iPhone.** Ini bukan bug iOS yang bisa ditambal dari sisi app.

→ ✅ **Sudah diselesaikan di server** (TASK_26, 2026-08-12): blok `apns` kini terkirim
berdampingan dengan `android` — lihat bentuk persisnya di 2.4 dan status di Bagian 6.
Sisi app tinggal menyediakan `sirine.caf` dengan nama itu persis, dan memastikan
perubahan server sudah **ter-deploy** ke lingkungan yang dipakai menguji Fase 3.

### 4.2 Sirine saat mode senyap — batas keras platform ⚠️ KEPUTUSAN PRODUK

Nilai jual Android: sirine berbunyi walau HP silent (channel `emergency_channel_v4`
dengan `USAGE_ALARM`). **iOS tidak punya padanan yang bisa diambil bebas.**

Tiga tingkatan, dari paling lemah:

| Opsi | Tembus Focus/DND | Tembus saklar senyap | Syarat |
|------|------------------|----------------------|--------|
| Notifikasi biasa + suara custom | ❌ | ❌ | — |
| `interruption-level: time-sensitive` | ✅ | ❌ | entitlement `com.apple.developer.usernotifications.time-sensitive` (otomatis, tanpa persetujuan Apple) |
| `interruption-level: critical` + `sound.critical: 1` | ✅ | ✅ | entitlement **`com.apple.developer.usernotifications.critical-alerts`** — harus **mengajukan permohonan ke Apple** dan disetujui manual |

**Rencana:** ajukan Critical Alerts ke Apple **sejak awal** (proses persetujuan makan
waktu, dan Sisupit adalah layanan darurat kebakaran resmi — kasus penggunaan yang kuat;
sertakan bukti kerja sama dengan Damkar/pemda). Sementara menunggu, kirim
`time-sensitive` agar setidaknya menembus Focus.

**Jangan** mencoba akal-akalan pemutar audio latar belakang untuk meniru sirine —
itu penyalahgunaan `audio` background mode dan alasan penolakan App Store yang umum.
Sampaikan batasan ini ke user sebagai keputusan produk, jangan disembunyikan.

### 4.3 Berkas suara notifikasi: `.mp3` TIDAK didukung, maksimum 30 detik

Android memakai `res/raw/sirine.mp3` berdurasi **~24,45 detik** (hasil sambung 3×
file asli 8,15 detik, lihat catatan 2026-07-12). iOS hanya menerima **`.caf`, `.wav`,
`.aiff`** di *main bundle*, **maksimum 30 detik** — lebih dari itu sistem diam-diam
mengganti dengan suara default.

Konversi (durasi 24,45 s masih aman di bawah 30 s):

```sh
afconvert sirine.mp3 sirine.caf -d ima4 -f caff -v
```

Rujuk sebagai `sound: "sirine.caf"` di payload APNs. Verifikasi di **device fisik** —
Simulator tidak memutar suara notifikasi dengan andal.

### 4.4 Ikon aplikasi iOS TIDAK BOLEH punya kanal alpha

Riwayat ikon Android panjang dan menyakitkan (7 iterasi, 2026-06-26 s/d 2026-07-08),
berakhir di: **petir putih di atas latar merah `#E0241B`**, aset adaptif transparan.

App Store Connect **menolak** ikon 1024×1024 yang memiliki transparansi. Jadi:

- AppIcon iOS = versi **kotak penuh** (merah solid + petir putih), **flatten, tanpa alpha**.
- Sumbernya sudah ada: `SisupitWebView/icons/icon_1024.png` di proyek Android
  (RGBA — buang alpha-nya dengan `composite` di atas `#E0241B`).
- LaunchScreen = latar `#E0241B` penuh + petir putih di tengah (sama seperti
  `activity_splash.xml` Android pasca-2026-07-08), sehingga tidak ada kedipan putih.

### 4.5 Alamat deep-link pernah 404 — jangan karang URL sendiri

Bug nyata Android (2026-06-27): deep-link dibangun sebagai `/reports/{id}`, padahal
rute sebenarnya `reports/show/{id}` → **semua tap notifikasi berujung 404**.

Sekarang server sudah mengirim URL lengkap di `action_url`. **Native cukup memuat
nilai itu apa adanya**; jangan susun ulang path dari `report_id`. Tetap validasi
host-nya (`sisupit.com` / subdomain-nya) sebelum dimuat — jangan muat URL sembarang
dari payload push.

Android juga sempat salah membaca kunci (`url` vs `action_url`). Kunci yang benar:
**`action_url`**, dengan `url` sebagai fallback opsional.

### 4.6 Sesi hilang saat app ditutup (auto-logout)

Bug Android (2026-06-27): cookie sesi Laravel hilang karena `CookieManager.flush()`
tidak pernah dipanggil.

Di iOS, `WKWebsiteDataStore.default()` **sudah persisten** antar-peluncuran — cukup
**jangan** memakai `.nonPersistent()`. Uji eksplisit: login → force-quit app →
buka lagi → harus tetap login. Sesi Laravel berumur 120 menit; uji juga setelah jeda.

### 4.7 Geolokasi WKWebView butuh pancingan izin native

Bug Android (2026-06-27): `GeolocationPermissions.Callback` dibuang saat izin belum
diberikan → permintaan lokasi **pertama menggantung selamanya**, dan "perbaikan"-nya
dulu adalah `reload()` penuh (lambat, percobaan pertama terbuang).

Di iOS 15+, `WKWebView` mendukung `navigator.geolocation`, tetapi prompt izin sistem
hanya muncul jika app punya `NSLocationWhenInUseUsageDescription` **dan** status
otorisasi CoreLocation sudah ditentukan. Pola yang dianjurkan:

1. Panggil `CLLocationManager.requestWhenInUseAuthorization()` **saat halaman pertama
   selesai dimuat**, sebelum web sempat memanggil `navigator.geolocation`.
2. Baru muat/lanjutkan alur normal.

**VERIFIKASI DI DEVICE FISIK PADA FASE 2** — kalau `navigator.geolocation` tetap tidak
terpanggil, jangan menambal dengan reload: pasang shim yang menimpa
`navigator.geolocation.{getCurrentPosition,watchPosition,clearWatch}` lewat `WKUserScript`
dan melayaninya dari CoreLocation, dengan bentuk objek `GeolocationPosition` yang persis
(`coords.latitude/longitude/accuracy`, `timestamp`) dan kode galat W3C yang benar
(1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT). Web mengandalkan `timeout`
dan `maximumAge`; shim harus menghormatinya, bukan mengabaikannya.

### 4.8 Google Sign-In: `aud` token iOS BERBEDA → server akan menolak

Server memverifikasi audiens token secara ketat, **satu nilai saja**:

```php
// app/Http/Controllers/Auth/SocialiteController.php:70-79
$expectedAud = config('services.google.client_id');   // = Web client ID
if (empty($payload['aud']) || $payload['aud'] !== $expectedAud || ...) {
    return back()->withErrors(['email' => 'Akun Google tidak dapat diverifikasi.']);
}
```

`GIDSignIn` di iOS menerbitkan `idToken` dengan `aud` = **iOS client ID**, bukan Web
client ID. Maka login Google dari iPhone akan **selalu gagal** dengan pesan
"Akun Google tidak dapat diverifikasi" sampai server menerima daftar audiens.
→ ✅ **Kode server sudah menerima daftar audiens** (TASK_26). **Tetapi** nilai
`GOOGLE_IOS_CLIENT_ID` masih kosong sampai seseorang mengisinya di `.env` server —
selama kosong, penolakan itu tetap terjadi **secara sengaja**. Jadi bila Fase 4 gagal
dengan pesan tersebut, periksa `.env` server lebih dulu, bukan kode iOS.

Pelajaran Android yang relevan (2026-06-26): sempat 3 hari terbuang karena Web client
dan Android client berada di **project Google Cloud berbeda** → galat `[28444]
Developer console is not set up correctly`. **Buat iOS OAuth client di project yang
sama, `sisupit-c1e5a`.** Jangan buat project baru.

Jangan pula menelan galat sign-in diam-diam — itu bug Android #1 yang bikin picker
"muncul lalu diam". Selalu teruskan pesan galat ke `window.onGoogleSignInError(msg)`.

---

## 5. FASE KERJA (berhenti & lapor di tiap akhir fase)

### Fase 0 — Prasyarat (di luar kode, konfirmasi dulu ke user)
- [ ] Akun Apple Developer aktif (US$99/tahun) — tanpa ini tak bisa uji push di device.
- [ ] Mac + Xcode terpasang, folder `bahan-ios/` sudah disalin (lihat Bagian 1.1).
- [ ] Di Firebase `sisupit-c1e5a`: tambah **iOS app** → unduh `GoogleService-Info.plist`.
- [ ] Buat **APNs Auth Key (.p8)** di Apple Developer → unggah ke Firebase
      (Project Settings → Cloud Messaging). Tanpa ini FCM tak bisa kirim ke iOS.
- [ ] Buat **iOS OAuth client** di project `sisupit-c1e5a` (bundle `com.sisupit.app`);
      catat client ID + reversed client ID.
- [ ] **Isi `GOOGLE_IOS_CLIENT_ID` di `.env` server** + `php artisan config:clear`
      (kode server sudah siap, nilainya yang belum ada — lihat Bagian 6).
- [ ] **Ajukan entitlement Critical Alerts** ke Apple (4.2) — mulai sekarang, lama.
- [ ] Perubahan server TASK_26 sudah **ter-deploy** ke lingkungan uji (minimal staging).

### Fase 1 — Kerangka WebView
Proyek Xcode baru, WKWebView full-screen, UA bersufiks `SisupitApp`, cookie persisten,
pull-to-refresh, layar galat saat offline, tautan eksternal (`http(s)` di luar host
sisupit) dibuka di Safari, `tel:` diserahkan ke sistem (tombol telepon darurat!).

**Terima bila:** app membuka `/spotlight` (bukan landing publik) saat belum login —
ini membuktikan UA dibaca server dengan benar; login email/password berhasil;
force-quit lalu buka lagi tetap login (4.6).

### Fase 2 — Geolokasi
Izin lokasi dipancing native, `Info.plist` diisi, alur "Lapor Darurat" diuji di device.

**Terima bila:** form lapor mendapat koordinat < 10 detik pada percobaan **pertama**
setelah instalasi bersih, dan pin dapat digeser (re-geocode jalan).

### Fase 3 — Notifikasi darurat (butuh Bagian 6 sudah live)
Registrasi APNs, token FCM diteruskan lewat kontrak #1, `sirine.caf`, deep-link `action_url`.

**Terima bila:** kirim laporan darurat dari device lain → iPhone berbunyi & bergetar
(sesuai tingkat entitlement yang disetujui), tap notifikasi → **langsung halaman detail
laporan yang benar**, baik saat app di foreground, background, maupun tertutup.
Verifikasi juga baris baru muncul di tabel `fcm_tokens` dengan `device_type` yang benar.

### Fase 4 — Google Sign-In (butuh Bagian 6 sudah live)
`GIDSignIn` + URL scheme reversed client ID + kontrak #2/#3/#4.

**Terima bila:** tombol "Masuk dengan Google" membuka picker native, memilih akun
menghasilkan sesi login, membatalkan mengembalikan tombol ke normal (tidak menggantung),
dan galat tampil sebagai pesan yang bisa dibaca — bukan diam.

### Fase 5 — Identitas visual
AppIcon tanpa alpha (4.4), LaunchScreen merah + petir, nama app, dukungan mode gelap
(web sudah punya ThemeSwitcher — pastikan latar native tidak berkedip putih).

### Fase 6 — Kesiapan App Store
Lihat Bagian 7.

---

## 6. PERUBAHAN SISI SERVER — ✅ SUDAH DIKERJAKAN (TASK_26, 2026-08-12)

Dikerjakan di repo Laravel (`C:\laragon\www\sisupit`), **bukan** di proyek iOS.
Work order + laporan: **`prompt/tasks/TASK_26_ios_prasyarat_server.md`**.
Test 193 → 201 passed, `npm run build` lulus.

Yang sudah berubah di server:

1. ✅ **Payload `apns`** ditambahkan berdampingan dengan `android` di
   `EmergencyAlertNotification::toFcm()` — notifikasi kini bisa tampil di iOS (2.4).
2. ✅ **Verifikasi `aud` jadi daftar putih** di `SocialiteController::handleNativeGoogle()`:
   Web Client ID **+** `services.google.ios_client_id`. Tetap daftar putih ketat —
   `iss`/`sub`/`email_verified` tidak dilonggarkan.
3. ✅ **`device_type`** di `AppLayout.jsx` kini mendeteksi `ios`/`android` dari UA.

**Yang MASIH harus dilakukan manusia sebelum Fase 3 & 4 bisa diuji:**

- [ ] Isi **`GOOGLE_IOS_CLIENT_ID`** di `.env` server (produksi/staging) dengan iOS OAuth
      Client ID dari project `sisupit-c1e5a`, lalu `php artisan config:clear`.
      Selama kosong, login Google dari iPhone **selalu ditolak** — itu perilaku aman
      yang disengaja, bukan bug; jangan buang waktu men-debug sisi app.
- [ ] Deploy perubahan TASK_26 ke server yang dipakai menguji (produksi/staging), termasuk
      `public/build` — deploy = `git pull` tanpa build step.
- [ ] Verifikasi tidak ada regresi Android setelah deploy (notifikasi + login Google dari APK).

---

## 7. RISIKO REVIEW APP STORE (nyata, siapkan sejak awal)

| Pedoman | Risiko | Mitigasi |
|---------|--------|----------|
| **4.2 Minimum Functionality** | Pembungkus web murni sering **ditolak** sebagai "situs web yang dibungkus" | Tonjolkan kemampuan native: push darurat, lokasi latar, tombol panggil darurat, ikon/splash native. Di catatan review, jelaskan ini alat koordinasi resmi Damkar. Sertakan akun demo + langkah uji. |
| **4.8 Login Services** | Wajib Sign in with Apple **jika** login pihak ketiga satu-satunya jalan | Sisupit punya email+kata sandi sendiri → **kemungkinan besar dikecualikan**. Tapi reviewer bervariasi; siapkan argumen, dan anggarkan Sign in with Apple sebagai rencana cadangan. |
| **5.1.1(v) Penghapusan akun** | Wajib bisa hapus akun **di dalam app** | Sudah ada: `resources/js/Pages/Profile/Partials/DeleteUserForm.jsx`. ⚠️ Tapi form itu meminta **kata sandi** — pengguna yang mendaftar via Google mungkin tak punya. Uji jalur ini; kalau buntu, itu temuan server yang harus diperbaiki sebelum submit. |
| **5.1.1 Izin** | Deskripsi izin kosong/generik = penolakan otomatis | Isi `NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` dengan alasan **spesifik berbahasa Indonesia** (mis. "Lokasi Anda dikirim bersama laporan agar petugas Damkar dapat menemukan titik kejadian"). |
| **Privacy Manifest** | Wajib sejak 2024 untuk app + SDK | Tambah `PrivacyInfo.xcprivacy`; Firebase menyertakan manifesnya sendiri. Isi label App Privacy: lokasi, pengenal, kontak. |
| **Critical Alerts** | Butuh persetujuan manual Apple | Ajukan di Fase 0, jangan di akhir (4.2). |

---

## 8. DAFTAR PERIKSA PENERIMAAN AKHIR

Uji **di iPhone fisik**, bukan Simulator (push & suara tidak andal di Simulator).

- [ ] Belum login → app membuka `/spotlight`, **bukan** landing publik (UA benar)
- [ ] Login email/kata sandi berhasil; force-quit → buka lagi → **tetap login**
- [ ] Login Google: picker muncul → sesi jadi; batal → tombol pulih; galat → pesan tampil
- [ ] Lapor Darurat: GPS terkunci < 10 detik pada percobaan pertama, pin bisa digeser
- [ ] Unggah foto laporan dari kamera **dan** galeri
- [ ] Notifikasi darurat: muncul di foreground, background, dan app tertutup
- [ ] Sirine terdengar (dan saat senyap, bila Critical Alerts sudah disetujui)
- [ ] Tap notifikasi → halaman **detail laporan yang benar**, tidak 404, tidak ke dashboard
- [ ] Baris token muncul di tabel `fcm_tokens`; **hilang setelah logout**
- [ ] Peta & pelacakan responder (Reverb/WebSocket `wss://`) berjalan di jaringan seluler
- [ ] Tombol telepon darurat memicu penelepon sistem
- [ ] Mode gelap tidak menyisakan kedipan putih
- [ ] Rotasi & notch/Dynamic Island aman (safe area dihormati)
- [ ] Hapus akun bisa diselesaikan dari dalam app
- [ ] Android **tidak mengalami regresi** setelah perubahan server Bagian 6

---

## 9. YANG HARUS DILAPORKAN SETIAP FASE

```
## LAPORAN FASE [N] — [JUDUL]
### Yang dibangun
- berkas + alasan
### Verifikasi
- diuji di: [model iPhone, versi iOS] — hasil per butir daftar periksa
### Jebakan yang ditemui
- (bandingkan dengan Bagian 4 — kalau baru, tambahkan ke dokumen ini)
### Diblokir oleh
- (mis. entitlement belum disetujui, perubahan server belum deploy)
### Siap lanjut ke fase berikutnya? [YA/TIDAK — alasan]
```

---

## 10. RUJUKAN SILANG

- Proyek web: `C:\laragon\www\sisupit` — `CLAUDE.md`, `prompt/MASTER_PROMPT.md`,
  `prompt/docs/ARCHITECTURE_MAP.md`, `prompt/docs/FINDINGS_LOG.md`
- Prasyarat server: `prompt/tasks/TASK_26_ios_prasyarat_server.md`
- Proyek Android (acuan perilaku): `C:\Users\Admin\AndroidStudioProjects\SisupitWebView`
  — `MainActivity.java`, `SisupitFirebaseMessagingService.java`, `res/raw/sirine.mp3`,
  `icons/icon_1024.png`
- Riwayat keputusan Android (tak ada di git, hanya di memori):
  `project_sisupit_webview_android`, `project_webview_4bugs_2026-06-25`

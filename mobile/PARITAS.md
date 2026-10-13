# Paritas Android vs iOS

Kolom iOS diisi oleh sisi iOS (`✅` selesai & diuji di perangkat, `🟡` ada tapi belum diuji,
`❌` belum, `n/a` tak berlaku). Perbarui setiap rilis.

Terakhir diperbarui: 2026-10-13 (kolom Android dari APK 1.1.8/vc10 + web prod @`1085a18d`; kolom iOS diisi sesi iOS 2026-10-13 — `🟡` = sudah di-port & diverifikasi di Simulator/log, belum diuji di perangkat fisik).

| Fitur | Android | iOS | Rujukan |
|---|---|---|---|
| UA memuat `SisupitApp` | ✅ | 🟡 (log Simulator: UA memuat `SisupitApp`) | KONTRAK §1 |
| Shim `window.AndroidBridge` (atDocumentStart) | ✅ (native) | 🟡 (log: terdeteksi <15 dtk, 5 metode) | KONTRAK §2 |
| `postToken` → `receiveFcmTokenFromNative` | ✅ | 🟡 (shim + `mintaToken`; token FCM butuh APNs/device) | KONTRAK §2.1 #1 |
| `signInWithGoogle` + 3 callback | ✅ | 🟡 (GIDSignIn; butuh `GOOGLE_IOS_CLIENT_ID` server) | KONTRAK §2.2 |
| `setPullToRefreshEnabled` | ✅ 1.1.4 | 🟡 (shim → `UIRefreshControl`) | KONTRAK §2.1 #3 |
| `getNotificationStatus` + `openNotificationSettings` + `onNativeNotificationStatusChanged` | ✅ 1.1.8 (#196) | 🟡 1.1.8 (shim sinkron via variabel; log `{"enabled":true}`) | KONTRAK §2.1 #5-#6 |
| Kunci tarik-untuk-refresh tak lepas oleh pushState/replaceState | ✅ 1.1.6 (#162) | 🟡 (reset hanya di `didStartProvisionalNavigation`, bukan navigasi SPA) | CHANGELOG 1.1.6 |
| Warna status bar mengikuti halaman | ✅ (Android 15+ sejak 1.1.6: latar root view ikut diwarnai) | 🟡 (Simulator: terbukti termasuk mode gelap-mismatch; `onBackgroundColorDetected`) | PERILAKU #8 |
| Sesi login bertahan | ✅ | 🟡 (`WKWebsiteDataStore.default()`; belum diuji login→tutup→buka) | PERILAKU #1 |
| Geolokasi tanpa kehilangan permintaan pertama | ✅ | 🟡 (GeolocationBridge Fase 2; belum diuji device) | PERILAKU #2 |
| Kamera/galeri di form lapor | ✅ | 🟡 (WKWebView native + `NSCamera`/`NSPhotoLibrary`; belum diuji) | PERILAKU #3 |
| Unduh PDF / Excel dengan sesi | ✅ | 🟡 (WKDownload → share sheet, cookie sesi ikut; belum diuji alur login) | PERILAKU #5 |
| `tel:` / WhatsApp / Maps keluar app | ✅ | 🟡 (`open()` + `LSApplicationQueriesSchemes` whatsapp/comgooglemaps) | PERILAKU #6 |
| Play Store / `market:` / `intent:` keluar app | ✅ 1.1.7 (#185) | 🟡 (`apps.apple.com`/`itms-apps:` → App Store; `market:`/`intent:` n/a di iOS) | PERILAKU #6 |
| Safe area & keyboard (tanpa jarak dobel dengan `env(safe-area-inset-*)` web) | ✅ 1.1.5 | 🟡 (WebView dipatok safe area + `contentInsetAdjustmentBehavior=.never`; keyboard #187 belum diuji device) | PERILAKU #7 |
| Tarik-untuk-refresh | ✅ | 🟡 (`UIRefreshControl`; belum diuji device) | PERILAKU #9 |
| Tombol/gesture Kembali | ✅ | 🟡 (`allowsBackForwardNavigationGestures=true`; celah lapisan sama dgn #192) | PERILAKU #10 |
| Kembali menutup lapisan web (peta layar penuh form lapor, dialog) | ❌ (keluar dari halaman, FINDINGS #192 OPEN - perbaikan di web) | ❌ (sama — #192 OPEN, tunggu solusi web; jangan tambal di native) | PERILAKU #10 |
| Lapor tanpa login: status tamu, Turnstile, lintas subdomain tetap di app | 🟡 (web TASK_77, belum diuji di HP) | 🟡 (iframe pihak ketiga lolos, subdomain `hostInternal`, cookie persisten; belum diuji device) | CHANGELOG web 10-07 s/d 10-13 |
| URL notifikasi/deep link hanya `https` situs sendiri; tanpa akses `file://` | ✅ 1.1.8 (#197) | 🟡 (`PushService` validasi https+host; `javascript:`/`file:` diblokir, #197) | CHANGELOG 1.1.8 |
| Push: DARURAT bersirine | ✅ (tembus senyap, USAGE_ALARM) | 🟡 (`sirine.caf` di bundle; `interruption-level` time-sensitive, tak tembus senyap tanpa Critical Alerts; belum diuji device) | KONTRAK §4 |
| Push: LAPORAN MASUK nada `masuk` | ✅ | 🟡 (`masuk.caf` di bundle; belum diuji device) | KONTRAK §4 |
| Push: KOORDINASI OPD | ✅ nada `konfirmasi` | 🟡 (`konfirmasi.caf` di bundle; belum diuji device) | KONTRAK §4.3 |
| Push: STATUS ke pelapor | ✅ nada bawaan | 🟡 (sound `default`; belum diuji device) | KONTRAK §4.3 |
| Tap notifikasi → detail laporan | ✅ | 🟡 (deep-link `action_url`, host-validated, parkir saat cold start; belum diuji device) | KONTRAK §4.4 |
| Hapus akun (web) terjangkau | ✅ | 🟡 (murni web, terjangkau di WKWebView; belum diuji) | CHANGELOG 1.1.5 |
| Login di aplikasi selalu "ingat saya" (server membaca UA `SisupitApp`) | ✅ (web TASK_73) | 🟡 (UA `SisupitApp` terbukti; logika di server) | KONTRAK §1 |
| Halaman tamu melepas token (`fcm.release`) | ✅ (web TASK_73) | 🟡 (`postToken`/`receiveFcmTokenFromNative`; pelepasan diurus web) | KONTRAK §3 |
| Keluar / Keluar dari semua perangkat → tak ada notifikasi | ✅ (web TASK_73) | 🟡 (web + token; belum diuji) | ATURAN_NOTIFIKASI §5 |
| Profil > "Notifikasi di HP ini" status Aktif + tombol uji berbunyi | ✅ (web TASK_74) | 🟡 (status via #196 kini ada; tombol uji bunyi butuh device) | ATURAN_NOTIFIKASI §5b |
| Splash merah + petir | ✅ | 🟡 (`LaunchScreen` + lanjutan splash; terlihat di Simulator) | PERILAKU #13 |

## Celah di SERVER yang merugikan iOS

1. ~~**`ReportStatusUpdatedNotification::toFcm()` tanpa blok `apns`**~~ - **FIXED 2026-09-30
   (#158).** Kini `aps.alert` + `sound: default` + `interruption-level: active` +
   `thread-id: report-status`.
2. ~~**`AgencyDispatch/AgencyConfirmationNotification` tanpa `aps.sound`**~~ - **FIXED
   2026-09-30 (#158).** Kini `sound: konfirmasi.caf`. **Sisi iOS:** ikutkan `konfirmasi.caf`
   di bundle (sampai itu, iOS memakai bunyi bawaan).
3. **iPad terdeteksi `android`.** `AppLayout.jsx:43` mencocokkan `iPhone|iPad|iPod`, padahal
   iPadOS 13+ ber-UA "Macintosh". Pengaruhnya hanya kolom `fcm_tokens.device_type`
   (diagnosis), bukan pengiriman - FCM memilih jalur APNs dari tokennya sendiri. Fix ringan:
   tambah cek `navigator.maxTouchPoints > 1 && /Macintosh/`.
4. **`GOOGLE_IOS_CLIENT_ID` di `.env` prod/staging/dev** - wajib terisi sebelum login Google
   iOS diuji; tanpa itu server menolak ID token iPhone (`aud` tak dikenal).

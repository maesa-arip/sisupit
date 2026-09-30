# Perilaku Native yang Dipasang Android (WAJIB ditiru iOS)

Setiap butir di bawah lahir dari bug nyata di Android. Rujukan = `MainActivity.java`
APK 1.1.5/vc7. Kolom "iOS" adalah padanan yang disarankan.

| # | Perilaku | Android (cara & alasan) | iOS (padanan) |
|---|---|---|---|
| 1 | **Sesi login bertahan setelah app ditutup** | `CookieManager.setAcceptCookie(true)` + third-party cookie, dan `flush()` di `onPause()`. Tanpa itu `laravel_session` hilang saat proses dimatikan → user ter-logout | `WKWebsiteDataStore.default()` (persisten, JANGAN `.nonPersistent()`); cookie ikut tersimpan sendiri. Uji: login → paksa tutup → buka |
| 2 | **Izin lokasi tidak membuang permintaan pertama** | `onGeolocationPermissionsShowPrompt` menyimpan `callback`+`origin`, lalu memanggilnya di `onRequestPermissionsResult` - **tanpa reload halaman**. Dulu callback dibuang → GPS pertama menggantung | `NSLocationWhenInUseUsageDescription` + minta izin CoreLocation SEBELUM web memanggil (WKWebView tetap bisa menampilkan dialog izin situs sendiri; uji agar user tak ditanya dua kali tiap buka). Bila memakai shim geolokasi native, WAJIB hormati `timeout` & `maximumAge` dari web (form lapor memakai `maximumAge: 0` lalu fallback akurasi rendah) |
| 3 | **Kamera + galeri dari `<input type=file accept="image/*">`** | `onShowFileChooser` → chooser berisi kamera (FileProvider `${applicationId}.fileprovider`), video, dan galeri (multi-pilih bila `multiple`) | WKWebView menangani `<input type=file>` sendiri (menu Kamera/Pustaka). Wajib `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` |
| 4 | **Foto dikompres di perangkat** | JPEG kualitas 80, sisi terpanjang **maks. 1200 px**, rotasi EXIF diluruskan | Tidak wajib di native: web juga mengompres di klien (`lib/compress-image.js`) dan server menolak **> 2 MB per foto** (`max:2048`). Pastikan foto HEIC dari kamera iPhone terkirim sebagai JPEG (WKWebView biasanya mengonversi) |
| 5 | **Unduhan berkas** (Export Excel, PDF Berita Acara/Laporan Kejadian `…/resolution/{id}/pdf`) | `DownloadListener` → `DownloadManager` **dengan header cookie & User-Agent sesi** (tanpa cookie = unduhan berisi halaman login) ke folder Download | `WKDownload` (iOS 14.5+) lewat `navigationAction.shouldPerformDownload` / `navigationResponse.canShowMIMEType == false`, lalu `UIDocumentInteractionController`/share sheet. PDF boleh juga dibuka langsung di WebView |
| 6 | **Tautan keluar aplikasi** | `google.com/maps`, `maps.google.com`, `goo.gl/maps`, `geo:` → app Google Maps (fallback app lain). `tel:`, `whatsapp:`, `mailto:`, `intent:` → Intent sistem. `http(s)` lain tetap di WebView | `decidePolicyFor navigationAction`: `tel:`, `mailto:`, `whatsapp:`, `https://wa.me/…`, `google.com/maps…` → `UIApplication.shared.open` (butuh `LSApplicationQueriesSchemes` untuk `whatsapp`, `comgooglemaps`). Web memakai 17× `tel:`, 3× `wa.me`, 1× `whatsapp:`, 5× `mailto:` (termasuk tombol Telepon/WhatsApp panel verifikasi admin, TASK_65) |
| 7 | **Tepi-ke-tepi / keyboard tak menutup form** | targetSdk 35+ memaksa edge-to-edge → padding dari inset `systemBars | displayCutout | ime` pada root view. Tanpa itu kolom isian form lapor tertutup keyboard | Pasang WebView ke safe area (atau `viewport-fit=cover` + CSS `env(safe-area-inset-*)`). WKWebView sudah menggeser konten saat keyboard muncul; uji tombol Kirim form lapor (menempel di bawah) |
| 8 | **Warna status bar mengikuti halaman** | skrip suntikan membaca `background-color` body → `AndroidBridge.onBackgroundColorDetected` → warna bar + ikon terang/gelap. `FORCE_DARK_OFF` (web punya mode gelap sendiri) | `preferredStatusBarStyle` dari nilai yang sama, atau warnai `view.backgroundColor` di belakang safe area atas |
| 9 | **Tarik-untuk-refresh** | `SwipeRefreshLayout` → `reload()` setelah 2 dtk. Dimatikan web saat dialog terbuka (`setPullToRefreshEnabled`, KONTRAK §2.1 #3) dan dinyalakan lagi tiap `onPageFinished` | `UIRefreshControl` di `webView.scrollView` + dukung `setPullToRefreshEnabled` di shim. Tanpa ini menggulir daftar di dialog "Atur Anggota" (/regu) ke atas = halaman dimuat ulang |
| 10 | **Tombol Kembali** | `OnBackPressedDispatcher` (targetSdk 36): `web.canGoBack()` → `goBack()`, selain itu keluar | `allowsBackForwardNavigationGestures = true` (gesture geser dari tepi) |
| 11 | **Deep-link dari notifikasi** | lihat KONTRAK §4.4 | idem |
| 12 | **Izin notifikasi** | minta `POST_NOTIFICATIONS` saat start (Android 13+) | `UNUserNotificationCenter.requestAuthorization([.alert,.sound,.badge])` + `registerForRemoteNotifications`; tampilkan notifikasi saat app di depan (`willPresent` → `.banner, .sound`) |
| 13 | **Splash** | `SplashActivity` 2000 ms, latar merah `#E0241B` + petir putih; splash sistem Android 12 dibuat polos agar logo tak berkedip dua kali | `LaunchScreen.storyboard` latar `#E0241B` + petir putih |
| 14 | **Login Google native** | Credential Manager, `setFilterByAuthorizedAccounts(false)`, `serverClientId` = Web Client ID (`74357247971-2f2h…`), project Firebase `sisupit-c1e5a`. Galat **tidak ditelan** (Toast + `onGoogleSignInError`) | `GIDSignIn` dengan `clientID` = iOS Client ID dan `serverClientID` = Web Client ID; kirim `user.idToken.tokenString`. Galat → `onGoogleSignInError` |

## Yang TIDAK perlu ditiru

- `sendTokenToServer()` ke `/api/fcm-token` - kode mati di Android.
- `setAllowUniversalAccessFromFileURLs(true)` - sisa template, tidak dibutuhkan web.
- `IntentHandler.java` (`intent://` + `browser_fallback_url`) - khas Android.
- Pemutar sirine manual (MediaPlayer / audio latar) - sudah gagal di Android, dan di iOS
  jadi alasan penolakan App Store. Suara hanya lewat payload `aps.sound`.

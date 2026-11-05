# Perilaku Native yang Dipasang Android (WAJIB ditiru iOS)

Setiap butir di bawah lahir dari bug nyata di Android. Rujukan = `MainActivity.java` +
`ResponderTrackingService.java` APK 1.1.9/vc11. Versi umum (tanpa hal khusus Sisupit) untuk aplikasi WebView lain:
[`CHECKLIST_WEBVIEW_UMUM.md`](CHECKLIST_WEBVIEW_UMUM.md). Kolom "iOS" adalah padanan yang disarankan.

| # | Perilaku | Android (cara & alasan) | iOS (padanan) |
|---|---|---|---|
| 1 | **Sesi login bertahan setelah app ditutup** | `CookieManager.setAcceptCookie(true)` + third-party cookie, dan `flush()` di `onPause()`. Tanpa itu `laravel_session` hilang saat proses dimatikan → user ter-logout | `WKWebsiteDataStore.default()` (persisten, JANGAN `.nonPersistent()`); cookie ikut tersimpan sendiri. Uji: login → paksa tutup → buka |
| 2 | **Izin lokasi tidak membuang permintaan pertama** | `onGeolocationPermissionsShowPrompt` menyimpan `callback`+`origin`, lalu memanggilnya di `onRequestPermissionsResult` - **tanpa reload halaman**. Dulu callback dibuang → GPS pertama menggantung | `NSLocationWhenInUseUsageDescription` + minta izin CoreLocation SEBELUM web memanggil (WKWebView tetap bisa menampilkan dialog izin situs sendiri; uji agar user tak ditanya dua kali tiap buka). Bila memakai shim geolokasi native, WAJIB hormati `timeout` & `maximumAge` dari web (form lapor memakai `maximumAge: 0` lalu fallback akurasi rendah) |
| 3 | **Kamera + galeri dari `<input type=file accept="image/*">`** | `onShowFileChooser` → chooser berisi kamera (FileProvider `${applicationId}.fileprovider`), video, dan galeri (multi-pilih bila `multiple`) | WKWebView menangani `<input type=file>` sendiri (menu Kamera/Pustaka). Wajib `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` |
| 4 | **Foto dikompres di perangkat** | JPEG kualitas 80, sisi terpanjang **maks. 1200 px**, rotasi EXIF diluruskan | Tidak wajib di native: web juga mengompres di klien (`lib/compress-image.js`) dan server menolak **> 2 MB per foto** (`max:2048`). Pastikan foto HEIC dari kamera iPhone terkirim sebagai JPEG (WKWebView biasanya mengonversi) |
| 5 | **Unduhan berkas** (Export Excel, PDF Berita Acara/Laporan Kejadian `…/resolution/{id}/pdf`) | `DownloadListener` → `DownloadManager` **dengan header cookie & User-Agent sesi** (tanpa cookie = unduhan berisi halaman login) ke folder Download. Listener baru menangkap SESUDAH respons datang - navigasi riwayat web di sela itu membatalkannya (#212, diperbaiki di web) | `WKDownload` (iOS 14.5+) lewat `navigationAction.shouldPerformDownload` / `navigationResponse.canShowMIMEType == false`, lalu `UIDocumentInteractionController`/share sheet. PDF boleh juga dibuka langsung di WebView |
| 6 | **Tautan keluar aplikasi** | `google.com/maps`, `maps.google.com`, `goo.gl/maps`, `geo:` → app Google Maps (fallback app lain). `tel:`, `whatsapp:`, `mailto:` → Intent sistem. `play.google.com/store/apps…` & `market:` → app Play Store (1.1.7). `intent:` → `Intent.parseUri` + `browser_fallback_url` (1.1.7). `http(s)` lain tetap di WebView | `decidePolicyFor navigationAction`: `tel:`, `mailto:`, `whatsapp:`, `https://wa.me/…`, `google.com/maps…` → `UIApplication.shared.open` (butuh `LSApplicationQueriesSchemes` untuk `whatsapp`, `comgooglemaps`). Web memakai 17× `tel:`, 3× `wa.me`, 1× `whatsapp:`, 5× `mailto:` (termasuk tombol Telepon/WhatsApp panel verifikasi admin, TASK_65) |
| 7 | **Tepi-ke-tepi / keyboard tak menutup form** | targetSdk 35+ memaksa edge-to-edge → padding dari inset `systemBars | displayCutout | ime` pada root view. Tanpa itu kolom isian form lapor tertutup keyboard | Sejak TASK_69 web memakai `viewport-fit=cover` + `env(safe-area-inset-bottom)` (bilah bawah, ruang konten `AppLayout`, form lapor, toast). Pilih **satu**: WebView dibatasi ke safe area (seperti Android, `env()` = 0), **atau** penuh layar dengan `scrollView.contentInsetAdjustmentBehavior = .never` (web mengisi `env()`). Penuh layar + `.automatic` = jarak bawah dobel. WKWebView sudah menggeser konten saat keyboard muncul; uji tombol Kirim form lapor (menempel di bawah) dan bilah bawah |
| 8 | **Warna status bar mengikuti halaman** | skrip suntikan membaca `background-color` body → `AndroidBridge.onBackgroundColorDetected` → warna bar + ikon terang/gelap. Android 15+ mengabaikan warna bar, jadi sejak 1.1.6 latar root view + decorView ikut diwarnai. `FORCE_DARK_OFF` (web punya mode gelap sendiri) | `preferredStatusBarStyle` dari nilai yang sama, atau warnai `view.backgroundColor` di belakang safe area atas |
| 9 | **Tarik-untuk-refresh** | `SwipeRefreshLayout` → `reload()` setelah 2 dtk. Dimatikan web saat dialog terbuka (`setPullToRefreshEnabled`, KONTRAK §2.1 #3) (bendera + `setOnChildScrollUpCallback`, direset tiap `onPageStarted` sejak 1.1.6 - #162) | `UIRefreshControl` di `webView.scrollView` + dukung `setPullToRefreshEnabled` di shim. Tanpa ini menggulir daftar di dialog "Atur Anggota" (/regu) ke atas = halaman dimuat ulang |
| 10 | **Tombol Kembali** | `OnBackPressedDispatcher` (targetSdk 36): `web.canGoBack()` → `goBack()`, selain itu keluar. Peta layar penuh form lapor (#192) dan dialog/sheet/modal (#205) mendorong entri history sendiri (web), jadi Kembali menutup lapisan teratas dulu. Popover/dropdown belum | `allowsBackForwardNavigationGestures = true` (gesture geser dari tepi); perilakunya mengikuti web, jangan tambal di native |
| 11 | **Deep-link dari notifikasi** | lihat KONTRAK §4.4 | idem |
| 12 | **Izin notifikasi** | minta `POST_NOTIFICATIONS` saat start (Android 13+) | `UNUserNotificationCenter.requestAuthorization([.alert,.sound,.badge])` + `registerForRemoteNotifications`; tampilkan notifikasi saat app di depan (`willPresent` → `.banner, .sound`) |
| 13 | **Splash** | `SplashActivity` 2000 ms, latar merah `#E0241B` + petir putih; splash sistem Android 12 dibuat polos agar logo tak berkedip dua kali | `LaunchScreen.storyboard` latar `#E0241B` + petir putih |
| 14 | **Login Google native** | Credential Manager, `setFilterByAuthorizedAccounts(false)`, `serverClientId` = Web Client ID (`74357247971-2f2h…`), project Firebase `sisupit-c1e5a`. Galat **tidak ditelan** (Toast + `onGoogleSignInError`) | `GIDSignIn` dengan `clientID` = iOS Client ID dan `serverClientID` = Web Client ID; kirim `user.idToken.tokenString`. Galat → `onGoogleSignInError` |
| 15 | **Lokasi tetap terkirim saat layar terkunci** (#210) | `ResponderTrackingService` (FGS tipe `location`, notifikasi tetap, tanpa `ACCESS_BACKGROUND_LOCATION` karena dimulai saat terlihat), POST sendiri dengan cookie sesi + `X-XSRF-TOKEN`, 5 dtk/10 m, berhenti pada `{"status":"stopped"}`/401/403/404/3xx/8 jam. WebView sendiri menghentikan `watchPosition` saat layar mati | `CLLocationManager` + `allowsBackgroundLocationUpdates` + UIBackgroundModes `location`, cookie dari `WKHTTPCookieStore`. **Belum ada (#228)** |

## Bug yang diperbaiki di WEB tapi hanya muncul di WebView

Tak butuh kode native, tapi wajib diuji ulang di app (browser desktop tak pernah memperlihatkannya):

| # | Gejala di app | Akar | Aturan web |
|---|---|---|---|
| #108 | Ketuk jam di Berita Acara = APK force close, isian hilang | `<input type="time">` membuka dialog NATIVE WebView (`TimePickerDialog`) | Jangan pakai `type=date/time/datetime-local`; pakai `Components/DatePicker.jsx` (JS murni) |
| #186 | Riwayat ketikan lama muncul di kolom isian | autofill WebView | `ui/input`/`ui/textarea` bawaan `autoComplete="off"`; kolom data pengguna eksplisit |
| #187 | Keyboard menutup kolom & tombol Kirim | bilah bawah fixed + viewport | `lib/keyboard-open.js` -> `<html data-keyboard>` |
| #212 | Unduhan dari dialog tak jalan | `history.back()` saat dialog ditutup membatalkan navigasi unduhan | tanda `leaving` di `lib/back-closes-layer.js` |
| #223 | Mode gelap HP: teks popup tak terbaca, tema tak ikut sampai muat ulang | CSS pihak ketiga mematok putih; listener tema hanya untuk nilai `'system'` | token di akhir `app.css`; `ThemeProvider` ikut `prefers-color-scheme` langsung. Native jangan memaksa gelap/terang |
| #227 | Marker petugas tersendat; HP panas | POST tiap tik GPS + channel disambung ulang tiap posisi | batas 5 dtk/10 m; langganan channel di effect `[report.id]` |

## Yang TIDAK perlu ditiru

- `sendTokenToServer()` ke `/api/fcm-token` - kode mati di Android.
- `setAllowUniversalAccessFromFileURLs(true)` - sisa template; sejak 1.1.8 (#197) dimatikan
  (`false`, juga `setAllowFileAccess(false)`). iOS: jangan memuat `file://` ke WebView situs.
- `IntentHandler.java` (`intent://` + `browser_fallback_url`) - khas Android.
- Pemutar sirine manual (MediaPlayer / audio latar) - sudah gagal di Android, dan di iOS
  jadi alasan penolakan App Store. Suara hanya lewat payload `aps.sound`.

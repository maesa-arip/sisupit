# Checklist Aplikasi WebView (umum, untuk proyek mana pun)

Disarikan dari bug nyata wrapper Sisupit (Android 1.1.2 s/d 1.1.9, iOS build 1-3, 2026-08 s/d 2026-11).
Berkas ini **tidak** memuat nama, endpoint, atau payload khusus Sisupit - untuk itu lihat `KONTRAK.md`,
`PERILAKU_WEBVIEW.md`, `ATURAN_NOTIFIKASI.md`. Nomor `#` merujuk `prompt/docs/FINDINGS_LOG.md` repo ini
bila butuh cerita lengkapnya.

Cara pakai: salin berkas ini ke proyek baru, centang tiap butir saat sudah dipasang **dan diuji di HP
fisik** (emulator/Simulator dan browser desktop tidak memperlihatkan separuh bug di bawah).

---

## A. Arsitektur & kontrak

- [ ] **Web adalah hukum.** Wrapper menyesuaikan diri ke web. Tulis kontrak web <-> native di SATU
      tempat yang ber-git (proyek Android Sisupit tanpa git - kontrak hilang tanpa folder bersama).
- [ ] **Satu nama jembatan JS untuk semua platform.** iOS menyuntik shim dengan nama yang sama
      (`WKUserScript` atDocumentStart, `forMainFrameOnly: false`) di atas `webkit.messageHandlers`.
      Jangan ganti nama sesudah rilis: APK lama masih beredar.
- [ ] **Setiap metode jembatan baru OPSIONAL di web**: `typeof bridge.x === 'function'`. App lama dan
      browser biasa tidak boleh rusak.
- [ ] **Penanda "ini aplikasi" di User-Agent** (token tetap, mis. `NamaApp`) + **nomor versi**
      (`NamaApp/1.2.3`). Tanpa versi, server tak bisa membedakan app lama, platform tanpa fitur, atau
      layanan yang mati (#228). Android: buang `"; wv"` dari UA (Google memblokir login dari WebView).
- [ ] **Native tidak membuat jalur HTTP kedua** untuk hal yang bisa diurus web (token push diserahkan
      lewat jembatan; web yang mengurus sesi, CSRF, retry). Pengecualian yang sah: layanan latar yang
      harus jalan saat WebView tidur (lihat F) - pakai cookie sesi WebView, jangan login sendiri.
- [ ] **Callback native -> web** dipanggil di main thread, dengan guard `if (window.x)`, argumen di-escape
      lewat serializer JSON (bukan sambung string), dan selalu memanggil fungsi yang terpasang SAAT itu
      (jangan simpan referensinya - halaman bisa sudah berganti).

## B. Sesi, cookie, keamanan

- [ ] Cookie persisten. Android: `CookieManager.setAcceptCookie(true)` + `flush()` di `onPause`.
      iOS: `WKWebsiteDataStore.default()`, jangan `.nonPersistent()`. Uji: login -> paksa tutup -> buka.
- [ ] Sesi di app "selalu ingat saya" (server membaca token UA). Sesi web 120 menit di HP = user
      ter-logout diam-diam lalu berhenti menerima push.
- [ ] Matikan akses `file://` (`setAllowFileAccess(false)`, `setAllowUniversalAccessFromFileURLs(false)`);
      Activity utama `exported=false`; URL dari intent/notifikasi hanya `https` + host sendiri (Play Console
      "Cross-App Scripting", #197). iOS: validasi host yang sama, blokir `javascript:`/`file:`.
- [ ] Login Google lewat SDK native (Credential Manager / GIDSignIn), kirim **ID token** ke server;
      OAuth redirect di WebView ditolak Google. Server menerima `aud` Web Client ID **dan** iOS Client ID.
      Galat jangan ditelan - teruskan ke web.
- [ ] App iOS yang menawarkan login Google/Facebook WAJIB punya "Masuk dengan Apple" (Guideline 4.8).

## C. Izin & perangkat

- [ ] Geolokasi: simpan callback izin dan panggil sesudah user menjawab, **tanpa reload** (callback
      dibuang = permintaan GPS pertama menggantung). iOS: hormati `timeout`/`maximumAge` dari web.
- [ ] Kamera + galeri dari `<input type=file>` (Android: `onShowFileChooser` + FileProvider; iOS:
      `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription`). Kompres foto di klien; server
      tetap membatasi ukuran (nginx `client_max_body_size` 1 MB bawaan pernah memutus upload, #132).
- [ ] Izin notifikasi diminta (Android 13+ `POST_NOTIFICATIONS`) **dan statusnya terbaca web** lewat
      jembatan. Izin mati = OS membuang notifikasi diam-diam sementara server melapor "terkirim" (#196).
      Sediakan tombol ke Setelan notifikasi + callback saat app kembali ke depan.
- [ ] **Jangan pakai input tanggal/jam native** (`type=date|time|datetime-local`): di WebView ia membuka
      dialog native yang bisa menutup aplikasi (#108). Pakai pemilih JS murni.

## D. Tampilan & interaksi

- [ ] Edge-to-edge (Android targetSdk 35+ memaksanya): padding inset `systemBars | displayCutout | ime`,
      **atau** web memakai `viewport-fit=cover` + `env(safe-area-inset-*)`. Pilih SATU; dua-duanya = jarak
      dobel. iOS penuh layar: `contentInsetAdjustmentBehavior = .never`.
- [ ] Keyboard tidak menutup kolom isian & tombol kirim; bilah bawah `fixed` disembunyikan saat keyboard
      terbuka (#187).
- [ ] Warna status bar/bilah navigasi mengikuti latar halaman (Android 15+ mengabaikan warna bar - warnai
      latar root view). Matikan force-dark native (`FORCE_DARK_OFF`) bila web punya mode gelap sendiri,
      dan web harus mengikuti `prefers-color-scheme` LANGSUNG saat tema HP berubah, termasuk CSS pihak
      ketiga (peta, dll.) yang mematok warna putih (#223).
- [ ] Tarik-untuk-refresh bisa dimatikan web (jembatan `setPullToRefreshEnabled`) selama dialog/sheet/
      dropdown terbuka - kalau tidak, menggulir daftar di dalam dialog = halaman dimuat ulang. Reset
      bendera hanya di awal navigasi SUNGGUHAN (Android `onPageStarted`), bukan `onPageFinished` yang ikut
      terpanggil oleh `history.replaceState` (#162).
- [ ] `autocomplete="off"` sebagai bawaan kolom isian; autofill WebView menampilkan riwayat ketikan lama
      (#186). Kolom data pengguna (nama, email, sandi) diatur eksplisit.
- [ ] Peta/komponen yang menghitung ukuran (Leaflet `fitBounds`, chart) jangan diukur saat wadahnya masih
      tersembunyi (0x0) - hasilnya zoom dunia sampai refresh (#183).

## E. Navigasi, tautan, unduhan

- [ ] Tombol/gesture Kembali: `canGoBack()` -> `goBack()`, selain itu keluar (Android
      `OnBackPressedDispatcher`; iOS `allowsBackForwardNavigationGestures`). Dialog/layar penuh di web
      mendorong entri history sendiri supaya Kembali menutup lapisan dulu, bukan meninggalkan halaman
      (#192/#205). Jangan tambal di native.
- [ ] ...tetapi menutup lapisan lewat `history.back()` **membatalkan unduhan** yang sedang menunggu
      respons. Klik tautan unduhan dari dalam dialog: lepas lapisan tanpa `history.back()` (#212).
- [ ] Unduhan berkas memakai **cookie sesi + UA WebView** (tanpa cookie = berkas berisi halaman login).
      Android `DownloadManager`; iOS `WKDownload` -> share sheet.
- [ ] Tautan luar dibuka di app sistem: `tel:`, `mailto:`, `whatsapp:`/`wa.me`, peta, toko aplikasi
      (`play.google.com/store`, `market:`, `apps.apple.com`), `intent:` (+ `browser_fallback_url`, hanya
      http(s)). iOS: `LSApplicationQueriesSchemes`. http(s) pihak ketiga di iframe (captcha dll.) biarkan.
- [ ] Deep link dari notifikasi: muat URL lengkap dari payload apa adanya (jangan susun ulang dari ID),
      validasi host; app yang sudah terbuka menerima URL baru (`singleTop` / `onNewIntent`); cold start
      simpan dulu lalu muat saat WebView siap.

## F. Kerja di latar (layar terkunci)

- [ ] WebView **berhenti** saat layar terkunci/app di latar: `watchPosition`, timer, WebSocket mati.
      Fitur yang harus jalan terus (pelacakan lokasi petugas) butuh layanan native: Android foreground
      service tipe `location` + notifikasi tetap (+ deklarasi & video di Play Console); iOS
      `CLLocationManager` + `allowsBackgroundLocationUpdates` + UIBackgroundModes `location` (#210, #228).
- [ ] Layanan latar: idempoten saat dipanggil berulang, POST dengan cookie WebView + header CSRF, berhenti
      sendiri saat server menjawab "stop"/401/403/404/redirect atau batas waktu, tolak origin asing.
- [ ] Batasi frekuensi kirim di KEDUA jalur (web & native) dengan angka yang sama (mis. 5 dtk / 10 m).
      Tanpa batas, tiap tik GPS = request + siaran (#227).

## G. Push notification

- [ ] Kirim **data-only** + prioritas tinggi supaya handler native selalu jalan (suara, deep link);
      tambahkan blok `apns` (alert, sound, `interruption-level`, `thread-id`) untuk iOS.
- [ ] Bedakan jenis dengan kunci data sendiri, **jangan bernama `type`** bila notifikasi juga lewat siaran
      Laravel (kunci itu ditimpa). Jenis yang **tak dikenal -> tingkat paling berisik** (gagal berisik lebih
      aman daripada gagal diam; app lama tetap berbunyi).
- [ ] Android: suara melekat di CHANNEL dan permanen di perangkat - ganti suara = ID channel baru; URI
      suara ber-NAMA (`android.resource://pkg/raw/nama`), bukan angka `R.raw` yang bergeser.
- [ ] iOS: suara `.caf/.wav/.aiff` <= 30 dtk di main bundle dengan nama PERSIS (salah nama = bunyi bawaan
      tanpa galat). Tembus mode senyap butuh entitlement Critical Alerts.
- [ ] Notifikasi berikutnya untuk objek yang sama **menimpa** (Android: ID notifikasi = ID objek; iOS
      `apns-collapse-id`), dan keputusan admin lain membersihkan notifikasi "menunggu" (#209).
- [ ] Token push mengikuti status login: daftar saat masuk, lepas saat keluar / halaman tamu / ganti sandi;
      token yang sama dipindah ke akun yang sedang login; buang token mati berkala.
- [ ] Sediakan tombol "uji bunyi" yang mengirim ke HP ini saja dengan payload jenis asli.
- [ ] Jangan memutar sirine lewat audio latar/MediaPlayer manual - gagal di Android, alasan penolakan di
      App Store. Suara hanya lewat sistem notifikasi.

## H. Rilis

- [ ] Setiap rilis: catat di changelog bersama + "yang harus dilakukan platform lain", perbarui matriks
      paritas, naikkan versi di UA.
- [ ] Simpan build di folder proyek (bukan Desktop); kunci unggah Play di luar git dengan cadangan.
- [ ] Daftarkan SHA-1 Play App Signing (bukan hanya kunci unggah) ke Firebase/Google Sign-In.
- [ ] Hapus akun bisa dilakukan dari dalam app (syarat Play & App Store).
- [ ] Akun Play pribadi: uji tertutup 12 penguji x 14 hari sebelum Production.

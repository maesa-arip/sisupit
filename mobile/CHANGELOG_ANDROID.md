# Changelog APK Android → yang harus di-port ke iOS

Terbaru di atas. Titik awal iOS = `docs/ios/PROMPT_SISUPIT_IOS.md` (dibekukan 2026-08-11);
semua entri sesudah tanggal itu belum tercermin di prompt tersebut.

Format tiap entri: versi, tanggal, apa yang berubah di Android, lalu **Yang harus dilakukan
iOS** sebagai daftar centang. Sisi iOS mencentang (`[x]`) saat sudah di-port.

---

## (web saja, APK tetap 1.1.7) - 2026-10-07 - keyboard layar: bilah bawah sembunyi, bar Kirim di atas keyboard (#187)

Tak ada perubahan kode APK. Pemicu: di form lapor, mengetuk "Patokan Lokasi" memunculkan keyboard
dan kolomnya tertutup bar Kirim + bilah bawah yang ikut naik (padding inset `ime` di root view).

- `lib/keyboard-open.js` (dipasang `AppLayout`): kolom ketik fokus + tinggi tampak menyusut > 150px
  -> `<html data-keyboard="open">` + `--keyboard-inset` (= `innerHeight - visualViewport.height -
  offsetTop`; 0 di APK karena layout ikut menyusut). Kolom terfokus digulir ke tengah.
- Bilah bawah `MobileBottomNav` disembunyikan selama keyboard terbuka; bar Kirim form lapor turun
  ke `bottom: var(--keyboard-inset)` (tepat di atas keyboard); kotak cari lokasi `enterKeyHint="search"`.

**Yang harus dilakukan iOS**
- [ ] WKWebView TIDAK menyusutkan layout saat keyboard muncul - web mengandalkan `visualViewport`
      (resize + scroll) untuk `--keyboard-inset`. Jangan ubah perilaku keyboard bawaan WKWebView.
- [ ] Uji di perangkat: ketuk Patokan Lokasi -> kolom terlihat, bilah bawah hilang, tombol Kirim
      menempel di atas keyboard (bukan tertutup keyboard), lalu kembali normal saat keyboard ditutup.

## 1.1.7 / versionCode 9 - 2026-10-06 - tautan Play Store & `intent:` keluar aplikasi (#185)

Pemicu: pengumuman sistem berisi tautan Play Store; di APK 1.1.6 mengetuknya membuka halaman web
Play DI DALAM WebView, bukan aplikasi Play Store.

- `MainActivity.shouldOverrideUrlLoading`: `https://play.google.com/store/apps...` dan `market:`
  -> `ACTION_VIEW` `market://details?id=...` ber-`setPackage("com.android.vending")`; tanpa Play
  Store -> browser. Selalu `return true` (tak ada halaman galat).
- `intent:` kini diurai `Intent.parseUri(url, URI_INTENT_SCHEME)` (+ `CATEGORY_BROWSABLE`,
  komponen & selector dibuang); app tujuan tak ada -> `browser_fallback_url`. Dulu ikut cabang
  `tel:` sebagai `new Intent(ACTION_VIEW, Uri.parse(url))` sehingga tak pernah sampai ke app.
- `http(s)` lain tetap di WebView (tak berubah). Build: AAB md5 8df50d67..., APK md5 f9028456...,
  kunci unggah SHA-1 CA:6F:A8...; cadangan sumber `MainActivity.java.bak-v116`.

**Yang harus dilakukan iOS**
- [ ] `decidePolicyFor navigationAction`: `play.google.com/store/apps` tak relevan di iPhone; tautan
      `apps.apple.com` / `itms-apps:` -> `UIApplication.shared.open` (App Store), bukan dimuat di WKWebView.
- [ ] Tautan `target="_blank"` (pengumuman sistem memakainya untuk URL luar) -> tangani di
      `createWebViewWith` (WKWebView mengabaikannya tanpa itu = "tautan tak bisa diklik").

## (web saja, APK tetap 1.1.6) - 2026-10-01 s/d 10-05 - safe area, sesi aplikasi & token FCM (TASK_69/73/74)

Tak ada perubahan kode APK; perubahan web ini mengubah apa yang diharapkan dari wrapper.

- **TASK_69** (prod @3d1e56e3): `viewport-fit=cover` di `app.blade.php`, web memakai
  `env(safe-area-inset-bottom)` (bilah bawah, ruang konten `AppLayout`, form lapor, toast);
  input 16px (iOS tak lagi zoom saat fokus); `dvh`. Android memberi padding inset di root view,
  jadi di APK `env()` = 0.
- **TASK_73/#181** (prod @198d6c0f): UA `SisupitApp` kini juga dibaca SERVER (`isNativeApp()`,
  `app/Helpers/helpers.php`) - login/daftar di aplikasi selalu "ingat saya". Halaman tamu di
  aplikasi memanggil `postToken('')` lalu melepas token lewat `fcm.release`
  (`lib/release-fcm-token.js`, menimpa `window.receiveFcmTokenFromNative`). Keluar =
  `logoutCurrentDevice`; ada "Keluar dari semua perangkat".
- **TASK_74/#182** (prod @198d6c0f): Profil > "Notifikasi di HP ini" - status dari jembatan
  (`lib/fcm-device.js`); jembatan tak terdeteksi dalam 15 dtk = "Belum aktif". Tombol uji
  (`fcm.test`) mengirim payload asli + `is_test: "1"`.

**Yang harus dilakukan iOS**
- [ ] UA WAJIB memuat `SisupitApp` (KONTRAK §1). Tanpa itu sesi iPhone habis 120 menit, halaman
      tamu melepas token, dan HP berhenti menerima sirine tanpa tanda apa pun.
- [ ] Shim `window.AndroidBridge` dipasang `atDocumentStart` (terdeteksi < 15 dtk).
- [ ] Balas `postToken` dengan memanggil `window.receiveFcmTokenFromNative` yang terpasang SAAT
      itu (dievaluasi tiap kali, jangan disimpan) - halaman tamu & AppLayout memasang versi berbeda.
- [ ] Safe area: pilih SATU - WebView dibatasi ke safe area (seperti Android, `env()` = 0), ATAU
      penuh layar dengan `scrollView.contentInsetAdjustmentBehavior = .never` (web yang mengisi
      `env()`). Penuh layar + `.automatic` = jarak bawah dobel (PERILAKU #7).
- [ ] Uji Profil > "Notifikasi di HP ini": status "Aktif" dan tiap tombol uji berbunyi sesuai
      `aps.sound` (KONTRAK §4.3) di perangkat fisik.
- [ ] Uji Keluar → tidak ada notifikasi lagi; login lagi → notifikasi kembali.

## 1.1.6 / versionCode 8 (build Play Store) - 2026-10-04 - minSdk 21 -> 24, alamat produksi

- Play Console menolak AAB: "Play automatic protection requires a minimum SDK version of 24".
  `app/build.gradle` `minSdk 21` -> `24` (cadangan `build.gradle.bak-minsdk21`). Android 5.x-6.x
  (API 21-23) tak lagi didukung. versionCode tetap 8 (unggahan yang ditolak tak memakai kode versi).
- Dibangun `gradlew clean bundleRelease` TANPA `-PsisupitBaseUrl` -> `BASE_URL` = `https://sisupit.com/`
  (diverifikasi di DEX), ditandatangani kunci unggah (SHA-1 `CA:6F:A8:...`).

**Yang harus dilakukan iOS**
- Tidak ada (khusus Android).

## 1.1.6 / versionCode 8 - 2026-10-03 - tarik-untuk-refresh tak lagi menyala di tengah gulir (#162)

- `MainActivity.java`: `setPullToRefreshEnabled(bool)` kini menyetel bendera `pullToRefreshBlocked`
  yang dibaca `SwipeRefreshLayout.setOnChildScrollUpCallback`, bukan `setEnabled()`. Bendera direset
  di `onPageStarted` (dokumen baru), BUKAN `onPageFinished`: WebView memanggil `onPageFinished` juga
  saat Inertia menyimpan posisi gulir (`history.replaceState`), sehingga di 1.1.4/1.1.5 refresh
  menyala lagi di tengah gulir daftar dialog/menu. Terbukti di HP user: dialog "Atur Anggota" tetap
  me-refresh di 1.1.5.
- Web (bersamaan): kunci dipasang juga di popover Menu/Fasilitas bilah bawah, Dropdown, Popover,
  Select, Sheet (`lib/pull-to-refresh-lock.js`), dan diulang di setiap `touchstart` selama terkunci
  (penambal untuk APK <= 1.1.5).

**Yang harus dilakukan iOS**
- [ ] Bila memakai `UIRefreshControl`: kunci jangan dilepas oleh callback navigasi satu dokumen
      (pushState/replaceState) - hanya saat dokumen baru dimuat.

## 1.1.6 / versionCode 8 - 2026-10-01 - warna status bar & bilah navigasi di Android 15+ (ikut rilis 1.1.6)

- **Bug 1.1.5 (targetSdk 36):** Android 15+ memaksa edge-to-edge dan MENGABAIKAN
  `setStatusBarColor`/`setNavigationBarColor`; yang tampil di area bilah adalah latar view akar yang
  diberi padding inset - tak pernah diwarnai, jadi bilah putih di mode gelap (ikon tetap ikut mode).
  1.1.4 (targetSdk 34) tak terdampak.
- **Fix `MainActivity`:** view akar disimpan sebagai `rootView`; `onBackgroundColorDetected` kini juga
  mewarnai `rootView` + decorView dengan warna halaman; `set{Status,Navigation}BarContrastEnforced(false)`
  (API 29+). Cadangan `MainActivity.java.bak-insetbg`.
- **AAB Play Store 1.1.5 yang sudah dibangun (`backup-sisupit-wrapper/playstore/`) MEMBAWA BUG INI** -
  bangun ulang `bundleRelease` sebelum diunggah ke uji tertutup. (Sudah: AAB 1.1.6/vc8 2026-10-04
  dibangun dari sumber yang memuat fix ini.)

**Yang harus dilakukan iOS:**
- [ ] Warnai area di belakang safe area atas & bawah dengan warna latar halaman (padanan PERILAKU #8),
  bukan warna tetap.

## 1.1.5-dev / versionCode 7 - 2026-10-01 (APK uji dev, BUKAN rilis)

- Alamat web kini **parameter build**, bukan string tertulis mati di dua tempat `MainActivity`
  (halaman awal & `api/fcm-token`): `BuildConfig.BASE_URL`, bawaan `https://sisupit.com/`.
  APK uji: `gradlew assembleDebug -PsisupitBaseUrl=https://dev.sisupit.com/ -PsisupitVersionSuffix=-dev`.
  Tanpa properti = build produksi persis seperti sebelumnya.
- Paket TETAP `com.sisupit.app` (`google-services.json` hanya mengenal paket itu), jadi APK dev
  MENGGANTIKAN aplikasi produksi di HP; kembali ke produksi = uninstall lalu pasang `/apk/sisupit.apk`
  (versionCode dev 7 > produksi 6, jadi tak bisa "turun versi" tanpa uninstall).
- Disajikan HANYA di `https://dev.sisupit.com/apk/sisupit-dev.apk` (berkas di luar git di server dev),
  ditandatangani kunci debug yang sama dengan `/apk/sisupit.apk`. Dibangun untuk menguji branch
  `feat/mobile-native-polish` (TASK_69) di HP.

**Yang harus dilakukan iOS:**
- [ ] Jadikan alamat web satu konstanta per skema build (Debug/Dev vs Release), bukan string di
  beberapa tempat.

## 1.1.5 / versionCode 7 - 2026-09-30 (Google Play, uji tertutup)

- targetSdk & compileSdk **34 → 36** (syarat Play).
- Edge-to-edge dipaksa Android 15+: padding inset `systemBars|displayCutout|ime` pada root
  view (tanpa ini form lapor tertutup status bar & keyboard).
- Tombol Kembali pindah ke `OnBackPressedDispatcher` (`onBackPressed()` tak lagi dipanggil
  di Android 16).
- Izin penyimpanan hanya s/d Android 9 (`maxSdkVersion 28`).
- Ditandatangani kunci unggah `sisupit-upload.jks` (Play App Signing). SHA-1 Play App
  Signing **belum** didaftarkan ke Firebase → login Google di build Play belum diuji.
- Web berbarengan: **hapus akun mandiri** di `/profile#hapus-akun` (#157, anonimisasi).

**Yang harus dilakukan iOS**
- [ ] Pastikan WebView mengikuti safe area & keyboard tidak menutup tombol Kirim form lapor.
- [ ] Gesture kembali (`allowsBackForwardNavigationGestures`).
- [ ] App Store juga mewajibkan hapus akun di dalam app → cukup pastikan `/profile#hapus-akun`
      terjangkau di iOS (murni web, nol kode native). Uji juga akun yang masuk lewat Google
      (konfirmasi dengan mengetik "HAPUS").

## 1.1.4 / versionCode 6 - 2026-09-30 (terbit di /apk/sisupit.apk)

- Metode jembatan baru **`AndroidBridge.setPullToRefreshEnabled(bool)`** (TASK_65):
  dipanggil `Components/ui/dialog.jsx` saat dialog buka/tutup, karena tarik-untuk-refresh
  merebut gulir daftar di dalam dialog. `onPageFinished` selalu menyalakannya kembali.
- Web berbarengan (TASK_64..68): tombol **Telepon + WhatsApp** di panel verifikasi admin,
  PDF Berita Acara/Laporan Kejadian (dompdf) - diunduh lewat DownloadListener.

**Yang harus dilakukan iOS**
- [ ] Tambah `setPullToRefreshEnabled` ke shim `window.AndroidBridge` (KONTRAK §2).
- [ ] Bila memakai `UIRefreshControl`: lepas/pasang sesuai nilai, dan pasang lagi di
      `didFinish` navigasi.
- [ ] `tel:` dan `https://wa.me/…` / `whatsapp:` dibuka dengan `UIApplication.shared.open`.
- [ ] Unduhan PDF & Excel dengan sesi (WKDownload) - uji `/reports/{id}/resolution/{id}/pdf`
      dan Export di `/admin/reports`.

## 1.1.3 / versionCode 5 - 2026-09-01

- Bug: dipasang sebagai UPDATE, broadcast berbunyi nada koordinasi alih-alih sirine.
  Akar: URI suara channel ber-ANGKA (`R.raw.*`) bergeser saat `res/raw` bertambah.
  Fix: URI **ber-nama** + ID channel naik: `emergency_channel_v5`, `incoming_report_v2`,
  `coordination_v2`, `status_update_v2` (yang lama dihapus).

**Yang harus dilakukan iOS**
- [ ] Tidak ada (suara iOS dipilih payload, bukan channel). Pastikan nama berkas di bundle
      persis `sirine.caf` / `masuk.caf`.

## 1.1.2 / versionCode 4 - 2026-09-01

- **Suara bertingkat (TASK_50)**: selain channel darurat, tiga channel baru - Laporan Masuk
  (`masuk.wav`), Koordinasi OPD (`konfirmasi.wav`), Status Laporan (nada bawaan).
  Tingkat dipilih dari `type` + `alert_stage` (KONTRAK §4.2); tak dikenal → sirine.
  `FLAG_INSISTENT` untuk darurat & laporan masuk. Pola getar per tingkat.
- Server berbarengan: kunci baru `alert_stage` (`report_incoming`/`dispatch`), judul tahap
  masuk "📥 Laporan baru menunggu verifikasi" (bukan lagi "DARURAT"), `aps.sound` =
  `masuk.caf` untuk tahap masuk.

**Yang harus dilakukan iOS**
- [ ] Ikutkan **`masuk.caf`** di bundle (konversi dari `aset/suara/masuk.wav`).
- [ ] Ikutkan `sirine.caf` (dari `aset/suara/sirine.mp3`, ~24,45 dtk, < 30 dtk).
- [ ] Ikutkan `konfirmasi.caf` (dari `aset/suara/konfirmasi.wav`) - server mengirim
      `sound: konfirmasi.caf` untuk notifikasi OPD sejak #158 (2026-09-30).
- [ ] Uji kabar status ke pelapor (`type: report_status`) tampil dengan bunyi bawaan (#158).
- [ ] Uji ketiga jenis notifikasi di **perangkat fisik** (Simulator tak andal memutar suara).

## Sebelum 1.1.2 (sudah tercakup di PROMPT_SISUPIT_IOS.md)

UA `SisupitApp`, `postToken`/`receiveFcmTokenFromNative`, `signInWithGoogle` + tiga callback,
data-only FCM + blok `apns` (TASK_26), deep-link `action_url` → `/reports/show/{id}`,
cookie flush, callback izin geolokasi, kompresi foto 1200 px, splash merah + petir putih.

---

### Templat entri baru (salin ke atas)

```md
## X.Y.Z / versionCode N - YYYY-MM-DD

- apa yang berubah di APK (berkas + alasan singkat)
- perubahan web/server yang berbarengan (commit)

**Yang harus dilakukan iOS**
- [ ] …
```

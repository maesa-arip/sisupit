# Changelog APK Android → yang harus di-port ke iOS

Terbaru di atas. Titik awal iOS = `docs/ios/PROMPT_SISUPIT_IOS.md` (dibekukan 2026-08-11);
semua entri sesudah tanggal itu belum tercermin di prompt tersebut.

Format tiap entri: versi, tanggal, apa yang berubah di Android, lalu **Yang harus dilakukan
iOS** sebagai daftar centang. Sisi iOS mencentang (`[x]`) saat sudah di-port.

---

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

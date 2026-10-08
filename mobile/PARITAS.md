# Paritas Android vs iOS

Kolom iOS diisi oleh sisi iOS (`✅` selesai & diuji di perangkat, `🟡` ada tapi belum diuji,
`❌` belum, `n/a` tak berlaku). Perbarui setiap rilis.

Terakhir diperbarui: 2026-10-06 (kolom Android dari APK 1.1.6/vc8 + web prod @`f6de6380`; kolom iOS belum diisi).

| Fitur | Android | iOS | Rujukan |
|---|---|---|---|
| UA memuat `SisupitApp` | ✅ | ? | KONTRAK §1 |
| Shim `window.AndroidBridge` (atDocumentStart) | ✅ (native) | ? | KONTRAK §2 |
| `postToken` → `receiveFcmTokenFromNative` | ✅ | ? | KONTRAK §2.1 #1 |
| `signInWithGoogle` + 3 callback | ✅ | ? | KONTRAK §2.2 |
| `setPullToRefreshEnabled` | ✅ 1.1.4 | ? | KONTRAK §2.1 #3 |
| `getNotificationStatus` + `openNotificationSettings` + `onNativeNotificationStatusChanged` | ✅ 1.1.8 (#196) | ? | KONTRAK §2.1 #5-#6 |
| Kunci tarik-untuk-refresh tak lepas oleh pushState/replaceState | ✅ 1.1.6 (#162) | ? | CHANGELOG 1.1.6 |
| Warna status bar mengikuti halaman | ✅ (Android 15+ sejak 1.1.6: latar root view ikut diwarnai) | ? | PERILAKU #8 |
| Sesi login bertahan | ✅ | ? | PERILAKU #1 |
| Geolokasi tanpa kehilangan permintaan pertama | ✅ | ? | PERILAKU #2 |
| Kamera/galeri di form lapor | ✅ | ? | PERILAKU #3 |
| Unduh PDF / Excel dengan sesi | ✅ | ? | PERILAKU #5 |
| `tel:` / WhatsApp / Maps keluar app | ✅ | ? | PERILAKU #6 |
| Play Store / `market:` / `intent:` keluar app | ✅ 1.1.7 (#185) | ? | PERILAKU #6 |
| Safe area & keyboard (tanpa jarak dobel dengan `env(safe-area-inset-*)` web) | ✅ 1.1.5 | ? | PERILAKU #7 |
| Tarik-untuk-refresh | ✅ | ? | PERILAKU #9 |
| Tombol/gesture Kembali | ✅ | ? | PERILAKU #10 |
| Push: DARURAT bersirine | ✅ (tembus senyap, USAGE_ALARM) | ? (time-sensitive: tembus Focus, **tidak** tembus saklar senyap sampai Critical Alerts disetujui Apple) | KONTRAK §4 |
| Push: LAPORAN MASUK nada `masuk` | ✅ | ? | KONTRAK §4 |
| Push: KOORDINASI OPD | ✅ nada `konfirmasi` | ? (server kirim `konfirmasi.caf` sejak #158) | KONTRAK §4.3 |
| Push: STATUS ke pelapor | ✅ nada bawaan | ? (server kirim `apns` sejak #158) | KONTRAK §4.3 |
| Tap notifikasi → detail laporan | ✅ | ? | KONTRAK §4.4 |
| Hapus akun (web) terjangkau | ✅ | ? | CHANGELOG 1.1.5 |
| Login di aplikasi selalu "ingat saya" (server membaca UA `SisupitApp`) | ✅ (web TASK_73) | ? | KONTRAK §1 |
| Halaman tamu melepas token (`fcm.release`) | ✅ (web TASK_73) | ? | KONTRAK §3 |
| Keluar / Keluar dari semua perangkat → tak ada notifikasi | ✅ (web TASK_73) | ? | ATURAN_NOTIFIKASI §5 |
| Profil > "Notifikasi di HP ini" status Aktif + tombol uji berbunyi | ✅ (web TASK_74) | ? | ATURAN_NOTIFIKASI §5b |
| Splash merah + petir | ✅ | ? | PERILAKU #13 |

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

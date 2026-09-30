# Paritas Android vs iOS

Kolom iOS diisi oleh sisi iOS (`✅` selesai & diuji di perangkat, `🟡` ada tapi belum diuji,
`❌` belum, `n/a` tak berlaku). Perbarui setiap rilis.

Terakhir diperbarui: 2026-09-30 (kolom Android dari APK 1.1.5/vc7; kolom iOS belum diisi).

| Fitur | Android | iOS | Rujukan |
|---|---|---|---|
| UA memuat `SisupitApp` | ✅ | ? | KONTRAK §1 |
| Shim `window.AndroidBridge` (atDocumentStart) | ✅ (native) | ? | KONTRAK §2 |
| `postToken` → `receiveFcmTokenFromNative` | ✅ | ? | KONTRAK §2.1 #1 |
| `signInWithGoogle` + 3 callback | ✅ | ? | KONTRAK §2.2 |
| `setPullToRefreshEnabled` | ✅ 1.1.4 | ? | KONTRAK §2.1 #3 |
| Warna status bar mengikuti halaman | ✅ | ? | PERILAKU #8 |
| Sesi login bertahan | ✅ | ? | PERILAKU #1 |
| Geolokasi tanpa kehilangan permintaan pertama | ✅ | ? | PERILAKU #2 |
| Kamera/galeri di form lapor | ✅ | ? | PERILAKU #3 |
| Unduh PDF / Excel dengan sesi | ✅ | ? | PERILAKU #5 |
| `tel:` / WhatsApp / Maps keluar app | ✅ | ? | PERILAKU #6 |
| Safe area & keyboard | ✅ 1.1.5 | ? | PERILAKU #7 |
| Tarik-untuk-refresh | ✅ | ? | PERILAKU #9 |
| Tombol/gesture Kembali | ✅ | ? | PERILAKU #10 |
| Push: DARURAT bersirine | ✅ (tembus senyap, USAGE_ALARM) | ? (time-sensitive: tembus Focus, **tidak** tembus saklar senyap sampai Critical Alerts disetujui Apple) | KONTRAK §4 |
| Push: LAPORAN MASUK nada `masuk` | ✅ | ? | KONTRAK §4 |
| Push: KOORDINASI OPD | ✅ nada `konfirmasi` | ? (server kirim `konfirmasi.caf` sejak #158) | KONTRAK §4.3 |
| Push: STATUS ke pelapor | ✅ nada bawaan | ? (server kirim `apns` sejak #158) | KONTRAK §4.3 |
| Tap notifikasi → detail laporan | ✅ | ? | KONTRAK §4.4 |
| Hapus akun (web) terjangkau | ✅ | ? | CHANGELOG 1.1.5 |
| Splash merah + petir | ✅ | ? | PERILAKU #13 |

## Celah di SERVER yang merugikan iOS

1. ~~**`ReportStatusUpdatedNotification::toFcm()` tanpa blok `apns`**~~ - **FIXED 2026-09-30
   (#158).** Kini `aps.alert` + `sound: default` + `interruption-level: active` +
   `thread-id: report-status`.
2. ~~**`AgencyDispatch/AgencyConfirmationNotification` tanpa `aps.sound`**~~ - **FIXED
   2026-09-30 (#158).** Kini `sound: konfirmasi.caf`. **Sisi iOS:** ikutkan `konfirmasi.caf`
   di bundle (sampai itu, iOS memakai bunyi bawaan).
3. **iPad terdeteksi `android`.** `AppLayout.jsx:34` mencocokkan `iPhone|iPad|iPod`, padahal
   iPadOS 13+ ber-UA "Macintosh". Pengaruhnya hanya kolom `fcm_tokens.device_type`
   (diagnosis), bukan pengiriman - FCM memilih jalur APNs dari tokennya sendiri. Fix ringan:
   tambah cek `navigator.maxTouchPoints > 1 && /Macintosh/`.
4. **`GOOGLE_IOS_CLIENT_ID` di `.env` prod/staging/dev** - wajib terisi sebelum login Google
   iOS diuji; tanpa itu server menolak ID token iPhone (`aud` tak dikenal).

# TASK_80 — Marker petugas membeku saat layar HP terkunci (FINDINGS #210, #211)

| Field | Isi |
|-------|-----|
| ID | TASK_80 |
| Severity | P1 (pelapor & Pusat Komando tak melihat petugas bergerak) |
| Tipe | bugfix + fitur kecil (APK) |
| Sumber | permintaan user 2026-10-15 ("saat petugas klik sampai dilokasi tapi marker di peta masih tidak gerak"; "hp petugas pasti dikunci") |
| Status | Web TERDEPLOY PROD & STAGING @42ef296b 2026-10-15 (HTTPS terverifikasi); AAB 1.1.9/vc11 DIUNGGAH ke draf Closed testing - Alpha (rilis 11, belum dikirim review) + deklarasi Foreground service = User-initiated location sharing + video TERSIMPAN 2026-10-15; video demo Play di SisupitWebView/app/release/play-console/ = YouTube Unlisted https://www.youtube.com/watch?v=LH5SEHRkJyI; belum diuji di HP |

## 1. Masalah

Petugas menekan "Sampai di Lokasi", marker di peta (pelapor, admin) tetap di titik lama. Dikonfirmasi user: HP
petugas selalu dikunci selama perjalanan.

## 2. Root cause

1. `ReportActionController::arrive()` hanya mengubah status; `Show.jsx handleArrive` mengirim `{}` (tanpa posisi,
   beda dengan Meluncur/Jaga di Kantor yang membawa `getClickLocation()` sejak TASK_66).
2. Satu-satunya pengirim posisi = `navigator.geolocation.watchPosition` di `Pages/Front/Reports/Show.jsx` (efek
   `isCurrentlyResponding`). Hanya hidup selama halaman detail terbuka DAN layar menyala; WebView Android
   menghentikan JS saat layar terkunci/latar. APK (`SisupitWebView`) tak punya layanan lokasi native sama sekali.
3. (#211, ditemukan saat B) `updateLocation()` tak memeriksa keanggotaan: petugas/relawan mana pun bisa
   menulis posisi + TrackingLog + siaran ke laporan mana pun, termasuk sesudah misinya selesai.

## 3. Rencana

**A (web, kecil):** Tiba membawa `getClickLocation()`; server (`clickLocation()`) menulisnya sebagai posisi
terkini PENEKAN saja (rekan seregu tak mengirim koordinat sendiri) + TrackingLog + `ResponderLocationUpdated`.
Lokasi kosong/rusak tak menggagalkan tombol.

**B (APK 1.1.9/vc11 + web):**
- `ResponderTrackingService` (foreground service `location`, notifikasi tetap "Lokasi Anda sedang dibagikan"):
  LocationManager GPS+jaringan, 5 dtk / 10 m, POST `{origin}/reports/{id}/update-location` dengan cookie WebView
  + `X-XSRF-TOKEN`; berhenti sendiri pada `{"status":"stopped"}`, 401/403/404, `stopResponderTracking()`, atau 8 jam.
  Dimulai saat aplikasi terlihat -> tanpa ACCESS_BACKGROUND_LOCATION.
- Jembatan baru `AndroidBridge.startResponderTracking(reportId, origin)` / `stopResponderTracking()`.
- Web `Show.jsx`: panggil start selama `isCurrentlyResponding` (bila metode ada); stop saat transisi
  responding -> tidak (batal/selesai) DI HALAMAN INSIDEN ITU. APK lama / iOS / browser = perilaku lama.
- Server `updateLocation()`: hanya baris `en_route`/`arrived` milik pemanggil; selain itu 200
  `{"status":"stopped"}` tanpa menulis apa pun (#211).

## 4. Blast radius

- `arrive()` dipanggil hanya dari `Show.jsx handleArrive`. Test regu (TASK_66, #154) tetap.
- `updateLocation()` dipanggil `Show.jsx` (watchPosition) & `sisupit:simulate-responders` (broadcast langsung,
  tak lewat endpoint). Penjaga #139 (retry deadlock) dibaca dari sumber - bentuk transaksi dipertahankan.
- APK: manifest + service baru + 2 metode jembatan. Play Console WAJIB deklarasi "Foreground service: location"
  (+ video) sebelum review lolos.

## 5. Verifikasi

- Baseline sebelum: 843 passed, 4488 assertions (2026-10-15).
- Penjaga A: `ReguAttendanceTest` "moves the presser to where they pressed tiba..." - dibuktikan merah dengan
  sabotase (`if (false)`), dipulihkan byte-exact (`cmp`).
- Sesudah A: 844 passed, 4500 assertions. Sesudah B: **846 passed, 4512 assertions**. Penjaga #211 dibuktikan merah
  dengan sabotase gerbang, dipulihkan byte-exact. `npm run build`, Pint, `gradlew clean bundleRelease assembleRelease` OK;
  APK: versionCode 11 / 1.1.9, targetSdk 36, izin FOREGROUND_SERVICE(_LOCATION), sertifikat unggah SHA-1 CA:6F:A8.
- Manual (HP, belum): Meluncur -> kunci layar -> berkendara -> peta pelapor bergerak; notifikasi tetap tampil;
  insiden ditutup -> notifikasi hilang sendiri dalam satu ping.

## 6. Rollback

- Web: revert commit TASK_80.
- APK: cadangan `MainActivity.java.bak-v118`, `AndroidManifest.xml.bak-v118`, `build.gradle.bak-v118`; hapus
  `ResponderTrackingService.java`.

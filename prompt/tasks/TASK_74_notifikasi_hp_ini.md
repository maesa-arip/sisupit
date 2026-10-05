# TASK_74 — "Notifikasi di HP ini" + notifikasi uji + banner dashboard

| Field | Isi |
|-------|-----|
| ID | TASK_74 |
| Severity | P2 |
| Tipe | fitur kecil |
| Sumber | FINDINGS_LOG #182 (butir 6 riset TASK_73) / permintaan user 2026-10-05 |
| Status | DONE (lokal, belum di-commit/deploy) |

---

## 1. Tujuan

Petugas/relawan tak bisa memastikan HP-nya terdaftar & sirinenya benar-benar berbunyi (pola
Active911 "Connected" + tes paging). User memilih butir **1** (kartu di Profil, semua peran)
dan **2** (banner dashboard petugas & relawan siaga). Butir **3** (kolom kesiapan HP di
Kelola Pengguna admin) belum diminta.

## 2. Kondisi awal

Tak ada tempat mana pun yang menunjukkan apakah HP terdaftar FCM; satu-satunya cara tahu
sirine berbunyi adalah menunggu kejadian sungguhan. `FLAG_INSISTENT` belum pernah diuji di HP.

## 3. Yang dikerjakan

- **Server**
  - `app/Notifications/DeviceTestNotification.php` — `TIERS` (sirine/masuk/koordinasi/status),
    `tiersFor(User)` per peran (cermin `mobile/ATURAN_NOTIFIKASI.md` §3), `toFcm()` MENIRU
    penanda asli (`type`/`alert_stage`) supaya APK memilih channel yang sama + blok `apns`.
  - `FcmController::test` — `POST /fcm-token/test` (`fcm.test`, auth + `throttle:6,1`): token
    wajib milik akun ini, tier wajib milik perannya; dikirim langsung lewat `Messaging::send`
    supaya galat sampai ke layar (NotFound → token dihapus + 422; galat lain → 503, token tetap).
  - `ProfileController::edit` prop `notificationTests`; `DashboardController` prop
    `fcm_device_count` (petugas; relawan di Beranda).
- **Frontend**
  - `lib/fcm-device.js` — status perangkat ini (`checking/active/inactive/browser`) di modul,
    `useFcmDevice()` (useSyncExternalStore). Diisi `AppLayout` saat mendaftarkan token (balasan
    harus `status: success` — akun berprofil belum lengkap dibelokkan jadi 200 HTML).
  - `Components/NotificationDeviceCard.jsx` — baris status + tombol uji per bunyi, toast sonner.
    Dipasang di Profil dalam `Group` "Notifikasi di HP ini", `id="notifikasi-hp"` (jangan ganti:
    dipakai banner & `action_url` notifikasi uji). Footer = tips (optimasi baterai, volume
    alarm, Jangan Ganggu).
  - `Components/NotificationDeviceBanner.jsx` — hanya saat bermasalah: aplikasi tapi `inactive`,
    atau browser dan `fcm_device_count === 0`. Dipasang di `Petugas/Dashboard.jsx` dan
    `Dashboard.jsx` (relawan siaga saja). Kartu biasa, bukan sticky/fixed.

## 4. Batasan yang disengaja

- "Aktif" = TERDAFTAR, bukan pasti berbunyi: izin notifikasi Android yang dimatikan tak
  terlihat dari web (APK membuang notifikasinya diam-diam). Itulah fungsi tombol uji.
- Uji tak masuk lonceng web / Reverb (.exe), dan tak pernah ke HP orang lain.

## 5. Verifikasi

- [x] Baseline 711 / 3606 (TASK_73).
- [x] `tests/Feature/Sisupit/NotifikasiHpIniTest.php` (10 test).
- [x] Sabotase: cek kepemilikan token dimatikan → tepat 1 test merah; dipulihkan byte-exact (`cmp`).
- [x] Pint, `npm run build` lulus. Full suite 721 passed / 3683 assertions.
- [ ] Uji di HP: Profil > tiap tombol uji → bunyi & getar sesuai channel; sirine & nada masuk
      BERULANG sampai disentuh (FLAG_INSISTENT); ketuk notifikasi → kembali ke kartu.
      Banner: matikan internet saat buka aplikasi/hapus token → banner muncul di dashboard.

## 6. Rollback

Revert commit TASK_74. Tanpa migrasi.

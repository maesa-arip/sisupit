# TASK_89 — Kabar warga sekitar sesudah verifikasi (notifikasi biasa, bukan sirine)

| Field | Isi |
|-------|-----|
| ID | TASK_89 |
| Severity | P2 |
| Tipe | fitur kecil |
| Sumber | permintaan user 2026-11-11 / FINDINGS_LOG #240 |
| Status | DONE - TERDEPLOY PROD @794924c1 (2026-11-11) |

---

## 1. Tujuan
Saat admin memverifikasi laporan (Validasi & Broadcast), warga di wilayah kejadian mendapat notifikasi BIASA di
aplikasi (nada bawaan HP, bukan sirine). Keputusan user: jangkauan bisa diatur (bawaan Desa), penerima warga saja,
ketuk = detail versi terbatas, semua jenis kejadian, foto tidak ditampilkan.

## 2. Kondisi awal
`ReportActionController::approve()` hanya mengirim EmergencyAlertNotification ke petugas, relawan siaga, pejabat siaga,
plus OPD dan pelapor. Tidak ada jalur notifikasi warga berbasis wilayah. Warga lain 403 di `reports.show`.

## 3. Catatan desain
- `type` WAJIB `report_status`: APK memilih channel dari `type`; jenis tak dikenal = SIRINE. Tanpa APK baru.
- Rumus wilayah sendiri (`User::scopeWargaNearReport`), bukan `scopeNotifiableForReport` (yang hanya naik ke akun
  bertingkat lebih tinggi; Kecamatan tak akan menjangkau desa tetangga). Rumus yang SAMA menggerbang halaman tujuan.
- Halaman terbatas terpisah (`/kejadian/{id}`), bukan cabang di `ReportController::show` yang memuat PII/foto/jejak GPS.

## 4. Perubahan
- `app/Models/Setting.php` — `KEY_NOTIFY_LEVEL_WARGA`, `wargaNotifyLevel()` (bawaan DESA).
- `app/Models/User.php` — `NEARBY_INCIDENT_STATUSES`, `scopeWargaNearReport`, `canViewNearbyIncident`.
- `app/Notifications/NearbyIncidentNotification.php` — baru (FCM + database).
- `app/Http/Controllers/ReportActionController.php` — `notifyNearbyWarga()` di approve().
- `app/Http/Controllers/Front/NearbyIncidentController.php` + `resources/js/Pages/Front/Incidents/Show.jsx` — baru.
- `routes/web.php` — `GET kejadian/{report}` (`front.incidents.show`, auth+verified).
- `app/Http/Controllers/NotificationController.php` — lonceng memakai `data.url` (path relatif) bila ada.
- `Admin/SettingController`, `NotificationSettingRequest`, `Admin/Settings/Edit.jsx` — setelan "Kabar Warga Sekitar".

## 5. Blast radius
approve() (siaran lain tak berubah, kiriman tambahan sesudah transaksi), lonceng web semua notifikasi (hanya bila
`data.url` ada - notifikasi lama tak punya), halaman Pengaturan (isian opsional, pemanggil lama aman).

## 6. Verifikasi
- [x] `NearbyIncidentNotificationTest` 9 passed; sabotase `type`/rumus wilayah = 3 merah, dipulihkan (cmp).
- [x] Suite penuh sesudah (lihat STATUS_LOG).
- [ ] Uji di HP: verifikasi laporan di desa akun warga uji -> notifikasi bernada bawaan (bukan sirine) -> ketuk membuka
      /kejadian/{id} tanpa nama/HP/foto; akun warga desa lain tidak menerima.

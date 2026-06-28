# TASK 06 — Notifikasi balik ke pelapor saat status laporannya berubah
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_06 |
| Severity | P2 |
| Tipe | fitur kecil |
| Sumber | permintaan user (analisis fitur kurang 2026-06-28, #1) |
| Status | FIXED (2026-06-28) — dikerjakan bareng TASK_11 (lonceng web). `php artisan test` 96 passed (256 assertions); `npm run build` lulus |

---

## 1. Deskripsi masalah / tujuan
Setelah warga membuat laporan darurat, alurnya "senyap" dari sisi pelapor: tidak ada
notifikasi apa pun saat Pusat Komando **memvalidasi (approve)**, responder **meluncur
(takeAction)**, **tiba (arrive)**, atau insiden **selesai (resolve)**. Semua notifikasi
yang ada (`EmergencyAlertNotification`) hanya mengalir KE petugas/relawan, tidak pernah
kembali ke `report->user`.

Tujuan: pelapor menerima notifikasi (FCM + database/lonceng web) di setiap transisi status
laporan miliknya, sehingga ada loop-balik kepercayaan ("laporanmu sedang ditangani").

## 2. Reproduce (bukti masalah ada)
Kondisi awal:
1. Login sebagai `masyarakat`, buat laporan via `POST /reports/create`.
2. Login sebagai `petugas`, lakukan `approve` → `takeAction` → `arrive` → `resolve` atas
   laporan itu.
3. Cek tabel `notifications` dan FCM untuk user pelapor.

Hasil saat ini (bug): TIDAK ada satu pun baris `notifications` untuk pelapor; FCM hanya
terkirim ke petugas/relawan. Sumber: `ReportActionController` (semua method) tidak pernah
memanggil `notify()`/`Notification::send()` ke `$report->user`. `Notification::send` hanya
ada di `approve()` baris 51 & 54 — keduanya menarget responder, bukan pelapor.

Hasil yang diharapkan: pelapor menerima 1 notifikasi per transisi status (approve, en_route
pertama, arrive pertama, resolved), masing-masing dengan judul/isi yang sesuai.

## 3. Root cause
`app/Http/Controllers/ReportActionController.php` — tidak ada jalur notifikasi ke pelapor di
method `approve()` (l.26), `takeAction()` (l.62), `arrive()` (l.100), `resolve()` (l.123).
Notifikasi yang ada (`EmergencyAlertNotification`, l.51/54) by-design hanya menyiarkan ke
responder. Ini gap fitur, bukan regresi.

## 4. Rencana fix (perubahan terkecil yang benar)
- `app/Notifications/ReportStatusUpdatedNotification.php` — **baru**. Tiru struktur
  `EmergencyAlertNotification` (implements `ShouldQueue`, `via()` = `[FcmChannel::class,
  'database']` — TANPA `broadcast` karena pelapor tidak ada di map command center).
  Konstruktor terima `(Report $report, string $event)` di mana `$event ∈
  {approved, en_route, arrived, resolved}`. `toFcm()` data-only mengikuti pola yang sudah
  ada di `EmergencyAlertNotification::toFcm()` (priority high, `action_url` =
  `route('reports.show', $report->id)`, `type` => `report_status`). `toArray()` simpan
  `report_id`, `title`, `status` untuk lonceng web.
- `app/Http/Controllers/ReportActionController.php` — di akhir `DB::transaction`/method
  pada `approve`, `arrive`, `resolve`, dan pada `takeAction` HANYA saat status report baru
  berubah jadi `handling` (responder pertama), kirim:
  `$report->user->notify(new ReportStatusUpdatedNotification($report, $event))`.
  Pelapor sudah `Notifiable` + punya `routeNotificationForFcm()` (User.php:14,123).
  - Guard: lewati jika `$report->user` null (laporan lama) — pakai `$report->user?->notify(...)`.
  - Untuk `takeAction`, panggil notifikasi DI LUAR pengecekan `!$exists` tapi hanya jika
    transisi `pending → handling` benar terjadi, agar tidak spam tiap responder bergabung.

## 5. Blast radius
- `ReportActionController` dipakai semua rute `reports.{approve,take-action,arrive,resolve}`
  (`routes/web.php`). Menambah `notify()` tidak mengubah status/transaksi yang sudah ada,
  hanya menambah efek samping notifikasi → risiko regresi rendah.
- Notifikasi `ShouldQueue` → butuh worker queue (`composer dev` sudah jalankan
  `queue:listen`; di prod pastikan worker aktif — sama seperti `EmergencyAlertNotification`).
- Volume FCM bertambah (≤4 pesan per laporan ke 1 device pelapor) — dapat diabaikan.
- Tidak menyentuh skema DB (pakai tabel `notifications` yang sudah ada).

## 6. Rencana verifikasi
- [ ] Baseline test sebelum: `php artisan test` → catat hasil (baseline lokal ~84 passed)
- [ ] Test baru `tests/Feature/Sisupit/ReportReporterNotificationTest.php`:
      `Notification::fake()`, jalankan approve→takeAction→arrive→resolve, assert pelapor
      menerima `ReportStatusUpdatedNotification` 1x per transisi; assert responder TIDAK
      menerima notif status (mereka tetap hanya `EmergencyAlertNotification`).
- [ ] Test sesudah hijau
- [ ] Verifikasi manual: buat laporan sebagai warga (HP/Android), proses di command center,
      pastikan HP pelapor berbunyi/menerima 4 notifikasi sesuai urutan + deep-link benar.
- [ ] `npm run build` — tidak relevan (PHP-only); UI lonceng web sudah baca tabel notifications.

## 7. Rollback
Commit fokus → `git revert`. Karena hanya menambah file notifikasi baru + panggilan
`notify()`, revert tidak menyentuh logika status inti.

---

## Acceptance criteria
- [ ] Pelapor menerima notifikasi di 4 transisi (terbukti via test)
- [ ] Responder TIDAK menerima notifikasi status pelapor (tidak ada cross-talk)
- [ ] Tidak ada regresi (test ≥ baseline)
- [ ] Diff minimal & sesuai konvensi (tiru `EmergencyAlertNotification`, data-only FCM)
- [ ] `prompt/docs/ARCHITECTURE_MAP.md` baris modul Push Notification diupdate menyebut
      notifikasi balik ke pelapor

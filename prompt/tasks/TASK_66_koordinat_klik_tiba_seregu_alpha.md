# TASK_66 — Koordinat saat Meluncur/Jaga di Kantor, Tiba seregu, Alpha

| Field | Isi |
|-------|-----|
| ID | TASK_66 |
| Severity | P2 |
| Tipe | fitur kecil (skema aditif) |
| Sumber | permintaan user 2026-09-29 (dipecah TASK_64-68) |
| Status | DONE (kode); migrasi DONE di MySQL dev LOKAL (up/rollback/up), BELUM di VPS |

---

## 1. Tujuan & keputusan user
1. "Klik meluncur dan jaga dikantor catat koordinat saat klik".
2. "Tiba di lokasi hanya 1 orang klik tiba maka semua anggota regu tiba" - keputusan user:
   **hanya anggota regu yang sudah menekan Meluncur** (bukan yang Jaga di Kantor / belum memilih).
3. "Jika tidak klik meluncur atau jaga dikantor dianggap alpha tapi hanya masuk di data
   internal" - keputusan user: **dicatat saat kejadian DITUTUP, dilihat admin/superadmin saja**.

## 2. Kondisi awal
- `takeAction()`/`stayAtBase()` tak menerima koordinat; frontend mengirim `{}`. Posisi baru
  tercatat lewat `updateLocation()` (ping `watchPosition` sesudah meluncur) dan terus ditimpa.
- `arrive()` hanya memperbarui baris pemanggil.
- Tak ada konsep alpha; "Belum memilih" di manifes hanya tampil selama kejadian terbuka.

## 3. Perubahan
- Migrasi ADITIF `2026_09_29_100000`: `start_lat/lng/accuracy_m` di `report_officers` &
  `report_helpers` (titik berangkat, TERPISAH dari `location_lat/lng` yang terus ditimpa),
  `lat/lng/accuracy_m` di `report_jaga_kantor`, tabel `report_alpha` (snapshot regu & nama,
  UNIQUE(report_id, user_id)).
- `ReportActionController::clickLocation()` - koordinat dibersihkan manual, BUKAN `validate()`:
  lokasi pelengkap tak boleh menggagalkan tombol darurat; nilai rusak = kosong.
- `arrive()`: baris `en_route` dengan `regu_id` SNAPSHOT yang sama ikut `arrived`. Petugas tanpa
  regu & relawan tetap perorangan.
- `resolve()`: `ReportAlpha::recordFor()` sebelum responder ditimpa `finished`. **Regu yang tak
  satu pun anggotanya menanggapi TIDAK dihitung** (tanpa tanda regu itu sedang bertugas, menuduh
  seluruh anggotanya alpha bisa salah - regu lepas jaga). Keanggotaan dibaca saat ditutup.
- `ReportController::show` prop `alphaMembers` (hanya `$isVerifier` = admin/superadmin), ikut
  daftar `reloadIncident`. `Show.jsx`: blok "Alpha (tidak memilih)" di Manifes Responden;
  `getClickLocation()` menunggu GPS maks. ~3-4 dtk lalu tombol tetap jalan tanpa lokasi.
- Export: kolom AM "Alpha (Tidak Memilih)" (`LAST_COLUMN` AL -> AM).

## 4. Blast radius / risiko sisa
- Tombol Meluncur kini menunggu GPS maksimal ~4 detik (dengan `maximumAge` 30 dtk biasanya
  seketika). Bila terasa lambat di lapangan, turunkan `timeout`.
- Tiba seregu mempercayai satu ketukan: anggota yang sebenarnya tertinggal ikut tercatat tiba.
  Tidak ada kolom "ditandai oleh siapa" - bila dibutuhkan, itu migrasi kecil tersendiri.
- `start_lat/lng` ikut terkirim bersama `report.officers` ke semua penonton halaman detail
  (sama seperti `location_lat/lng` yang sudah terkirim).

## 5. Verifikasi
- [x] `ReguAttendanceTest` BARU (7); sabotase tiba-perorangan & resolve-tanpa-alpha MERAH, pulih `cmp`.
- [x] `ReportDetailRealtimeTest` (+`alphaMembers`), `ReportClosureActorTest` (AM).
- [x] Suite 598 passed (2787), Pint & prettier bersih.
- [ ] Manual: petugas beregu menekan Meluncur di ponsel -> `report_officers.start_lat` terisi;
  GPS ditolak -> tetap meluncur. Satu anggota Tiba -> rekan seregu yang meluncur ikut Tiba.
  Tutup kejadian -> admin melihat blok Alpha, petugas tidak.

## 6. Deploy
Kode + `php artisan migrate` BERSAMAAN (kode tanpa migrasi = takeAction 500 karena kolom belum ada).

## 7. Rollback
`php artisan migrate:rollback --step=1` (dibuktikan di MySQL dev) + revert commit.

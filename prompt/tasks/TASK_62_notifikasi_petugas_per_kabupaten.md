# TASK_62 - Tingkat siaran notifikasi PETUGAS per kabupaten, diatur admin kabupaten
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_62 |
| Severity | P2 |
| Tipe | fitur kecil |
| Sumber | permintaan user 2026-09-27 |
| Status | DONE (kode) - branch `feat/notif-petugas-kabupaten` dari main lokal @03527f12 |

---

## 1. Tujuan
User: "buat setting untuk mengatur sampai level apa notif petugas, sekarang secara default masih
sampai level desa".

Diperiksa lebih dulu, dua hal yang meluruskan premisnya:
- Setelan itu SUDAH ADA (/admin/settings, "Tingkat Siaran Petugas", bawaan KABUPATEN; di prod
  PROVINSI) - tapi GLOBAL satu nilai & superadmin saja, jadi admin kabupaten tak bisa melihatnya.
- Setelan itu tidak melebarkan jangkauan akun berlevel DESA (User::scopeNotifiableForReport):
  akun desa selalu hanya menerima laporan desanya sendiri. 8 petugas prod masih berlevel
  desa/kecamatan - kemungkinan besar itulah "masih sampai level desa" yang terlihat.

Keputusan user (ditanya lebih dulu): admin kabupaten bisa mengatur; PETUGAS SAJA (relawan &
pejabat tetap global); pilihan DESA s/d KABUPATEN (provinsi tetap global superadmin); worktree
terpisah dari perubahan #130 sesi lain.

## 2. Fix
- Migrasi aditif `tenants.notify_level_petugas` nullable. NULL = ikut global; tanpa backfill.
- `Tenant::petugasNotifyLevel($cityCode)` = SATU-SATUNYA penentu batas petugas: pilihan
  kabupaten laporan -> global -> Kabupaten. Nilai tersimpan di luar NOTIFY_LEVELS_PETUGAS
  diabaikan. Query langsung (bukan forCity() yang di-cache selamanya).
- Ketiga titik siaran petugas memakainya: laporan masuk (ReportController::store), broadcast
  (ReportActionController::approve), konfirmasi OPD (notifyConfirmation).
- `Tenant::notifyLevelEditableBy($user)` = gerbang halaman DAN menu: admin/superadmin dengan
  city_code terisi, kecamatan & desa kosong. Kabupaten dari akun, tak pernah dari request.
- Halaman baru `/admin/notifikasi-petugas` (Admin/NotificationLevel/Edit.jsx), menu
  "Notifikasi Petugas" lewat `auth.user.notify_level_editable`. Pilihan "Ikut setelan pusat
  (X)" memakai penanda karena Radix Select menolak nilai string kosong; dikirim sebagai null.
- Halaman global superadmin: satu kalimat bahwa nilai petugasnya kini BAWAAN.

## 3. Blast radius
- Kabupaten tanpa pilihan: perilaku identik dengan sebelumnya (dikunci test fallback).
- Relawan & pejabat tak tersentuh.
- Deploy: migrasi aditif `php artisan migrate` bersamaan dengan kode (tanpa kolom, halaman
  admin & setiap siaran petugas galat karena kolom tak ada).

## 4. Verifikasi
- [x] TenantNotifyLevelPetugasTest (8) - tiga sabotase MERAH, pulih byte-exact
- [x] Suite penuh, Pint, prettier, build
- [ ] Manual: login admin kabupaten -> menu Notifikasi Petugas -> pilih Desa -> verifikasi
      laporan di desa X hanya membangunkan petugas berlevel desa X. Admin kecamatan: menu tak
      tampil & URL 404.

## 5. Rollback
Revert commit + `php artisan migrate:rollback --step=1` (kolom nullable, aman dibuang).

# TASK_63 - Wilayah efektif petugas: setelan jangkauan mengatur notifikasi DAN data
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_63 |
| Severity | P1 (notifikasi & data petugas tak sejalan) |
| Tipe | perubahan yurisdiksi terbatas |
| Sumber | permintaan user 2026-09-28 |
| Status | DONE (kode) - branch `feat/wilayah-efektif-petugas` dari main lokal @fe78cdc5 |

---

## 1. Tujuan
User: "setting ini bukan hanya mengatur notifikasi tapi mengatur data yang tampil karena percuma
notif kota/kabupaten tapi waktu di klik di dashboard list data yang muncul beda".

Keputusan user: perluasan BOLEH sampai PROVINSI (setelan global prod saat ini Provinsi - lihat
§4), dan berlaku untuk SEMUA data ber-wilayah (laporan, dashboard, detail, aksi, fasilitas/OPD).

## 2. Root cause
Wilayah akun dibaca di empat titik sentral - `Tenantable`, `User::withinReportJurisdiction`,
`User::narrowestJurisdictionColumn`/`reportFeedChannel`, `User::scopeNotifiableForReport` - dan
tak ada yang mengenal setelan tingkat petugas selain yang terakhir, itupun dengan makna "akun
tingkat mana yang ikut", bukan "seberapa jauh akun petugas menjangkau".

## 3. Fix
- `User::effectiveJurisdictionCodes()` - sumber tunggal. Petugas murni (bukan admin/pejabat/opd/
  superadmin) diperluas sampai `Tenant::petugasNotifyLevel($user->city_code)`: kolom lebih sempit
  dikosongkan. Hanya memperluas; akun lebih luas tetap; akun tanpa kode di tingkat tujuan TIDAK
  dipotong (ditemukan saat test: akun hanya-village_code sempat jadi TANPA wilayah sama sekali).
  Di-cache per objek (Tenantable memanggilnya tiap query).
- Tenantable, withinReportJurisdiction, narrowestJurisdictionColumn, reportFeedChannel, kartu
  Profil (TASK_61) membacanya. DashboardController tak diubah: kolomnya dari
  narrowestJurisdictionColumn dan nilai kolom yang lebih luas tak pernah berubah oleh perluasan.
- `User::petugasRecipientsFor($report)` menggantikan query petugas di laporan masuk, broadcast
  verifikasi, dan konfirmasi OPD: laporan di wilayah efektif petugas DAN wilayah efektif tak lebih
  luas dari tingkat setelannya (mempertahankan perilaku lama akun yang lebih luas dari setelan).
  Admin tetap scopeNotifiableForReport lama.
- Teks: halaman "Notifikasi Petugas" -> "Jangkauan Petugas" (route tetap), penjelasan kini
  menyebut data; halaman global superadmin ikut diluruskan.

## 4. Blast radius - WAJIB DIBACA SEBELUM DEPLOY
- **PROD setelan global petugas = PROVINSI.** Begitu kode ini naik, SETIAP petugas di kabupaten
  yang belum menyimpan pilihan di Jangkauan Petugas akan MELIHAT dan DIBANGUNKAN untuk seluruh
  Bali. Keputusan user, tapi pastikan admin kabupaten/superadmin menyetel nilainya lebih dulu bila
  itu tak dikehendaki.
- Petugas yang diperluas kini bisa menekan Meluncur/aksi lapangan di seluruh wilayah efektifnya
  (withinReportJurisdiction).
- TenantableHierarchyTest satu test disebut tingkatnya eksplisit (KECAMATAN) - maksudnya (aturan
  baris-NULL tak melebarkan laporan) tetap dijaga.

## 5. Verifikasi
- [x] PetugasWilayahEfektifTest (12) - empat sabotase MERAH, pulih byte-exact
- [x] Suite penuh, Pint, prettier, build
- [ ] Manual: admin kabupaten pilih Kota -> login petugas berakun desa -> dashboard & daftar
      memuat laporan desa lain sekota, detail terbuka, notifikasi masuk; pilih Desa -> kebalikannya.

## 6. Rollback
Revert commit (tanpa migrasi).

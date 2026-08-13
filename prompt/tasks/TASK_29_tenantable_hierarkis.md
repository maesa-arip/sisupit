# TASK 29 — `Tenantable` hierarkis: baris wilayah yang lebih luas terlihat oleh yang lebih sempit

| Field | Isi |
|-------|-----|
| ID | TASK_29 |
| Severity | P2 |
| Tipe | bugfix |
| Sumber | FINDINGS_LOG #60 (temuan sendiri saat mengisi master OPD Denpasar 2026-08-13) |
| Status | DONE |

---

## 1. Deskripsi masalah / tujuan

Master OPD Denpasar disimpan oleh admin tingkat kota, sehingga barisnya ber-`district_code`
dan `village_code` NULL. `Tenantable` memfilter dengan **satu** kolom — yang tersempit milik
user — dan menuntut kecocokan persis, sehingga baris itu tidak pernah cocok bagi staf yang
akunnya terikat kecamatan/desa. Fitur "OPD terkait" (TASK_27) hilang tanpa pesan galat bagi
mereka.

Tujuan: baris yang wilayahnya **lebih luas** (kolom NULL) ikut terlihat oleh user yang
wilayahnya lebih sempit, tanpa memperluas wewenang siapa pun.

## 2. Reproduce (bukti masalah ada)

Diukur di PRODUKSI 2026-08-13 dengan menjalankan query sebagai tiap akun sungguhan:

| Akun | Wilayah akun | Melihat OPD |
|------|--------------|-------------|
| 12 akun (Admin Damkar Denpasar, dst.) | Kota Denpasar | 3 OPD |
| Admin Damkar Densel, Petugas Damkar 3 & 5 | Kec. Denpasar Selatan | **KOSONG** |
| Admin Damkar Pemogan, Petugas Damkar 1 & 2 | Desa | **KOSONG** |

`Agency::recommendedIdsFor('rumah')` → 2 OPD bagi admin kota, **0** bagi petugas kecamatan/desa.
Total **6 dari 18** staf Denpasar. Tabel `units` juga ber-`district_code` NULL, jadi armada pun
tak terlihat oleh keenamnya.

Skenario nyata: kebakaran rumah di Sanur Kauh, yang piket Petugas Damkar 2 (akun tingkat desa).
Ia tekan "Broadcast Misi" → bagian OPD kosong melompong, tanpa galat → **PLN tidak pernah
diberi tahu** untuk memadamkan listrik. Bila admin kota yang membuka laporan yang sama, BPBD
dan PLN sudah tercentang otomatis.

## 3. Root cause

`app/Traits/Tenantable.php:14-52`. Scope memilih SATU kolom lalu `return`:

```
if ($user->village_code)  { where('village_code',  $user->village_code);  return; }
if ($user->district_code) { where('district_code', $user->district_code); return; }
...
```

Baris OPD punya `district_code = NULL`; di SQL `NULL = '517101'` menghasilkan *unknown*,
bukan true, jadi baris itu tak pernah terambil. Tidak ada gagasan "NULL berarti berlaku untuk
seluruh wilayah di bawahnya".

Yang menegaskan ini memang cacat, bukan desain: `User::scopeNotifiableForReport`
(`app/Models/User.php:263-276`) **sudah** memakai prinsip "NULL = lebih luas" secara eksplisit
untuk memilih penerima notifikasi darurat. Aturan yang benar sudah ada di repo, hanya belum
diterapkan di `Tenantable`.

## 4. Rencana fix (perubahan terkecil yang benar)

- `app/Traits/Tenantable.php` — ganti rantai "pilih satu kolom lalu return" dengan: untuk
  **tiap tingkat yang dimiliki user**, baris harus `NULL` **atau** sama. Cabang superadmin
  (bypass) dan cabang "tanpa kode wilayah sama sekali → `whereRaw('1 = 0')`" (#44) TIDAK
  disentuh.

Tidak ada perubahan frontend, jadi `public/build` tidak perlu di-build ulang.

## 5. Blast radius

Trait dipakai 6 model: `Agency`, `Hydrant`, `Pompa`, `PosPemadam`, `Report`, `Unit`.

Diukur di data produksi sebelum mengubah — aturan baru hanya menambah baris yang kolomnya NULL:

| Tabel | Baris | `district_code` NULL |
|-------|-------|----------------------|
| reports (Denpasar) | 131 | **0** |
| hydrants | 51 | **0** |
| pompas | 6 | **0** |
| pos_pemadams | 7 | **0** |
| agencies | 3 | 3 |
| units | 2 | 2 |

Jadi visibilitas laporan & fasilitas **tidak bergeser sama sekali**; yang terbuka persis 5 baris
data master (3 OPD + 2 armada) — memang data yang dimaksudkan berlaku se-kabupaten.

**TIDAK terpengaruh: siapa yang menerima notifikasi darurat.** Penerima dipilih
`User::scopeNotifiableForReport` dan `User` **tidak memakai** trait `Tenantable` (trait-nya
`HasFactory, HasPushSubscriptions, HasRoles, Notifiable`). Relawan tetap dipilih lewat
`notify_level_relawan` + `is_standby` seperti sebelumnya.

Efek samping yang menguntungkan: user ber-`district_code` sebelumnya difilter **hanya** dengan
`district_code`, tanpa memeriksa provinsi/kota sama sekali. Aturan baru ikut memeriksa keduanya,
jadi cakupannya justru lebih rapat.

## 6. Rencana verifikasi

- [x] Baseline test sebelum: 215 passed (850 assertions)
- [x] Regression test baru: `tests/Feature/Sisupit/TenantableHierarchyTest.php`
- [x] Test sesudah hijau, tidak ada yang turun
- [x] Verifikasi di produksi: jalankan ulang pengukuran §2 — keenam staf harus melihat 3 OPD,
      dan jumlah laporan yang terlihat tiap tingkat TIDAK berubah (131 / 77 / 20)
- [x] `npm run build` tidak diperlukan (tak ada perubahan frontend)

## 7. Rollback

Satu commit fokus pada `app/Traits/Tenantable.php` + satu file test baru → `git revert`.
Tidak ada migrasi, tidak ada perubahan data, jadi rollback tidak meninggalkan jejak.

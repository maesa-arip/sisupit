# TASK 23 — Kolom wilayah kosong: pisahkan "sengaja luas" dari "belum lengkap"

| Field | Isi |
|-------|-----|
| ID | TASK_23 |
| Severity | P1 |
| Tipe | bugfix |
| Sumber | FINDINGS_LOG #56 (laporan user 2026-08-10) |
| Status | DONE (2026-08-11) |

---

## 1. Deskripsi masalah / tujuan

Kolom `province_code`/`city_code`/`district_code`/`village_code` yang kosong punya **dua makna
yang berlawanan** dan tidak ada apa pun di kode yang membedakannya:

1. **Sengaja luas** — staf kabupaten/provinsi. `Admin\UserController::trimRegionToLevel()`
   meng-NULL-kan kolom di bawah tingkat yang diberikan; ini benar dan disengaja.
2. **Belum lengkap** — warga/relawan yang belum menuntaskan onboarding.

Tujuan task: menuliskan pembeda itu sebagai aturan eksplisit di kode, lalu menutup satu-satunya
tempat di mana ketiadaan aturan itu benar-benar menyebabkan kerusakan (siaran notifikasi).

## 2. Reproduce (bukti masalah ada)

Relawan berprofil kosong dibanjiri laporan **se-Indonesia**:

```php
$relawan = User::factory()->create();   // keempat kode wilayah NULL, is_standby default true
$relawan->assignRole('relawan');
// approve laporan di desa mana pun → EmergencyAlertNotification TERKIRIM ke $relawan
```

Cabang jaring pengaman `User.php:194-199` cocok untuk siapa pun yang keempat kolomnya NULL,
tanpa memandang peran. Karena `is_standby` default `true`
(`2026_06_24_152050_add_is_standby_to_users_table.php:15`) dan `ReportActionController:59`
hanya memfilter peran + siaga, relawan yang belum melengkapi profil menerima sirine untuk
kebakaran di provinsi lain — sementara `EnsureProfileComplete` sama sekali tidak menghalanginya
karena push FCM tidak melewati middleware HTTP.

## 3. Root cause

`User::scopeNotifiableForReport()` (`app/Models/User.php:194-199`) memperlakukan "keempat kolom
NULL" sebagai **yurisdiksi nasional**, padahal itu hanya benar untuk staf. Ini justru
kebalikan dari konvensi yang sudah ditegakkan di dua tempat lain setelah temuan #44:

- `User::withinReportJurisdiction()` (`User.php:111-114`) — tanpa kode wilayah → `false`.
- `User::scopeIsAdmin()` (`User.php:82-87`) — tanpa kode wilayah → `whereRaw('1 = 0')`.

Jalur notifikasi adalah satu-satunya yang tertinggal memakai aturan lama.

## 4. Koreksi terhadap FINDINGS_LOG #56 (surface, don't surprise)

Dua dari empat "zona mati" yang saya catat di #56 ternyata **perilaku yang disengaja dan
sudah punya test hijau** — bukan bug, dan sengaja TIDAK diubah di task ini:

- *Kasus 2* (staf provinsi tak dapat notif pada ceiling KABUPATEN) di-assert eksplisit di
  `ReportNotificationLevelTest.php:75` dan bisa diubah admin lewat Setting (test baris 94-105).
- *Kasus 1 bagian kedua* (relawan tingkat kecamatan/kabupaten tak dapat notif pada ceiling DESA)
  di-assert di `ReportNotificationLevelTest.php:91`. Itu memang arti setting
  `KEY_NOTIFY_LEVEL_RELAWAN`.

Karena itu **arah fix "ceiling jangan menggugurkan user yang lebih luas" yang saya tulis di #56
ditolak sendiri di sini** — menerapkannya berarti membatalkan keputusan produk yang sudah
dikunci test. Ceiling tetap berarti "sampai tingkat mana siaran boleh naik".

*Kasus 4* (laporan tanpa `village_code`) tidak dapat terjadi dari form: `ReportRequest:64-67`
mewajibkan `village_code` saat create. Disisakan sebagai risiko data impor/seeder saja.

Yang benar-benar rusak dan diperbaiki di sini tinggal **satu**: cabang jaring pengaman tidak
memandang peran.

## 5. Rencana fix (perubahan terkecil yang benar)

- `app/Enums/TenantLevel.php` — tambah `TenantLevel::forCodes()`: turunkan tingkat yurisdiksi
  dari **kolom terdalam yang terisi**, `null` bila tak ada. Satu sumber kebenaran untuk
  penurunan tingkat, plus tempat mendokumentasikan dua makna "kosong".
- `app/Models/User.php` —
  - tambah konstanta `User::STAFF_ROLES` (peran yang kolom wilayah kosongnya berarti
    "sengaja luas"), sebagai aturan bernama, bukan lagi tersirat;
  - tambah `User::jurisdictionLevel()` yang memakai `TenantLevel::forCodes()`;
  - batasi cabang jaring pengaman di `scopeNotifiableForReport()` ke `STAFF_ROLES`.
- `app/Http/Middleware/EnsureProfileComplete.php` — `EXEMPT_ROLES` menunjuk ke
  `User::STAFF_ROLES` agar kedua tempat tidak bisa lagi berbeda diam-diam.
- `app/Http/Controllers/Admin/UserController.php` — `regionRank()` memakai
  `TenantLevel::forCodes()` (menghapus duplikat logika penurunan tingkat).
- `tests/Feature/Sisupit/ReportNotificationLevelTest.php` — dua test baru untuk kedua makna.

**Sengaja TIDAK dilakukan** (sesuai perangkap yang dicatat di #56):
- tidak mewajibkan `village_code` terisi untuk menerima notifikasi;
- tidak memaksa staf lewat onboarding `EnsureProfileComplete`;
- tidak menghapus cabang jaring pengaman (hanya dipersempit ke staf);
- tidak menormalisasi `'0'`/`''` → `NULL` di DB (belum terverifikasi ada di produksi;
  query pengeceknya ada di #56 dan tetap perlu dijalankan). `TenantLevel::forCodes()` sudah
  memakai truthiness `(bool)` sehingga `'0'`/`''` diperlakukan sebagai kosong — sama dengan
  `withinReportJurisdiction()` dan `regionRank()` yang sudah ada.

## 6. Blast radius

- `scopeNotifiableForReport` dipakai di `ReportController.php:307` (siaran awal ke pusat
  komando: peran petugas/admin/superadmin) dan `ReportActionController.php:57,59` (siaran
  lapangan: petugas & relawan siaga). Ketiganya memakai cabang jaring pengaman ini.
- **Perubahan perilaku yang disengaja:** relawan/masyarakat berprofil kosong yang sebelumnya
  menerima SEMUA laporan nasional kini tidak menerima apa pun sampai profilnya lengkap.
  Staf berprofil kosong (petugas/admin nasional) TIDAK terpengaruh.
- `EnsureProfileComplete::EXEMPT_ROLES` isinya identik dengan sebelumnya — hanya sumbernya
  yang dipindah. Diuji ulang lewat `ProfileOnboardingTest`.
- `Admin\UserController::regionRank()` dipakai `assignableLevels()` (pembatas tingkat yang
  boleh diberikan admin). Hasil `forCodes()` identik dengan `match` yang digantikannya.

## 7. Rencana verifikasi

- [x] Baseline test sebelum: 182 passed, 726 assertions
- [x] Test regresi baru (dua makna kolom kosong)
- [x] Test sesudah hijau: 190 passed, 743 assertions; tidak ada test lama yang berubah/dihapus
- [ ] Verifikasi manual di produksi: jalankan query verifikasi #56 untuk memastikan tidak ada
      baris `'0'`/`''`; baris relawan dengan wilayah kosong = kandidat yang perlu diminta
      melengkapi profil (bukan data rusak bila perannya admin/petugas/pejabat).
- [x] `npm run build` tidak diperlukan (tidak ada perubahan JS)

## 8. Rollback

Revert commit task ini. Perilaku kembali: relawan berprofil kosong dibanjiri notifikasi
nasional. Tidak ada perubahan skema DB, jadi rollback tidak meninggalkan jejak data.

---

## Acceptance criteria

- [x] Aturan "kosong = luas (staf) vs belum lengkap (non-staf)" tertulis eksplisit di kode
- [x] Relawan berprofil kosong tidak lagi menerima siaran nasional
- [x] Staf nasional & staf kabupaten tetap menerima siaran seperti sebelumnya
- [x] Tidak ada regresi (test ≥ baseline 182 passed)
- [x] `FINDINGS_LOG.md` #56 → FIXED + koreksi bagian yang ternyata by-design

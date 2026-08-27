# TASK_45 — Sumber informasi & tim atensi otomatis, plus tiga perbaikan akun OPD
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_45 |
| Severity | P2 |
| Tipe | fitur kecil (A, B) + bugfix (C, D, E) |
| Sumber | permintaan user 2026-08-27 (satu pesan, lima permintaan) → FINDINGS #89, #90, #91 |
| Status | DONE (kode) — sisa verifikasi manual §6 |

---

## 1. Deskripsi masalah / tujuan

Satu pesan user, lima permintaan:

> "Dilaporan kegiatan penyelamatan sumber informasi otomatis jika warga lapor lewat aplikasi,
> kecuali petugas/admin input manual, Opd masuk ke tim atensi di laporan, Di profil masih bug
> untuk role nya seharusnya opd tapi masih muncul sebagai anggota masyarakat, Di opd riwayatnya
> masih bug belum muncul, Di manajemen pengguna harus ada untuk ubah jadi opd"

- **(A)** Berita Acara: kolom "Sumber Informasi" terisi sendiri untuk laporan yang masuk lewat
  aplikasi; laporan yang diketik petugas/admin tidak.
- **(B)** OPD yang dilibatkan ikut tercatat di "Tim yang atensi di TKP".
- **(C)** Profil akun OPD berbunyi "Anggota Masyarakat" (FINDINGS #90).
- **(D)** "Arsip & Riwayat" akun OPD selalu kosong (FINDINGS #91).
- **(E)** Peran `opd` tak bisa dipilih di Manajemen Pengguna (FINDINGS #89).

Dua keputusan ditanyakan lebih dulu dan dijawab user:
1. Laporan yang diketik operator → kolom Sumber Informasi **DIKOSONGKAN**, operator mengisi
   sendiri (bukan diisi kalimat umum "Laporan diterima Pusat Komando").
2. OPD di tim atensi ditulis **dengan penanda `(OPD)`** di belakang namanya.

## 2. Reproduce

**(A)** Buka `/reports/{id}/resolution/create` untuk laporan mana pun yang belum punya berita
acara → kolom "Sumber Informasi" kosong, apa pun asal laporannya.

**(B)** Insiden dengan OPD terlibat → tombol "Gunakan saran" pada Tim Atensi hanya menawarkan
armada + petugas + relawan; instansi yang diminta membantu tidak pernah ikut.

**(C)** Login akun berperan `opd` → `/profile` menampilkan lencana "ANGGOTA MASYARAKAT".
Berlaku juga untuk `pejabat` dan `superadmin`.

**(D)** Login akun `opd` → menu "Arsip & Riwayat" → daftar kosong, kedua tab, selalu.

**(E)** Login admin kabupaten → `/admin/users` → dialog "Tetapkan Peran" → pilihan `opd` tidak
ada di dropdown.

Sepuluh dari sebelas test baru **dibuktikan merah** lebih dulu terhadap kode lama. Satu
(`shows nothing to an OPD account that is not linked to any agency`) memang sudah hijau — ia
penjaga regresi, bukan reproduksi bug: kode lama pun memulangkan kosong, tapi karena alasan
yang keliru (Tenantable), bukan karena re-check ownership.

## 3. Root cause

**(A) `ReportResolutionController::create()`** — cabang prefill untuk berita acara PERTAMA
(`$latest` null) tidak menyertakan `sumber_informasi` sama sekali. Sinyal pembeda yang
tersimpan cuma satu: peran pemilik `reports.user_id`, karena `ReportController::store()` selalu
menulis `auth()->id()` — laporan yang diketik operator (alur telepon TASK_28) ber-`user_id`
operator itu sendiri.

**(B)** `$timAtensi` dirakit dari `reportUnits` + `officers` + `helpers`; `reportAgencies`
tidak ikut.

**(C) `resources/js/Pages/Profile/Edit.jsx`** — tangga tiga cabang
`relawan → admin/petugas → 'Anggota Masyarakat'`. Cabang terakhir bukan "tidak dikenal"
melainkan sebuah KLAIM, jadi setiap peran yang lahir setelahnya salah nama tanpa gejala.

**(D) `ReportController::index()`** — dua jalurnya sama-sama buntu bagi OPD: `filter=mine`
menyaring `user_id` (OPD tak pernah membuat laporan) dan jalur "Semua Laporan" ber-`Tenantable`
sedangkan akun OPD sengaja tanpa kode wilayah (#44) → `whereRaw('1 = 0')`.

**(E) `Admin\UserController::assignableRoleNames()`** — daftar untuk admin non-superadmin tidak
memuat `opd`. Sisa alurnya sudah lengkap sejak TASK_27.

## 4. Perubahan

### Backend
- `app/Models/ReportResolution.php` — konstanta `SUMBER_APLIKASI` (sumber tunggal kalimatnya).
- `app/Console/Commands/SeedDemoIncident.php` — membaca konstanta itu, tak lagi menulis
  kalimatnya sendiri.
- `app/Http/Controllers/ReportResolutionController.php` — prefill `sumber_informasi` menurut
  peran pemilik laporan; `reportAgencies` ikut dimuat & masuk `$timAtensi` bertanda `(OPD)`.
- `app/Http/Controllers/ReportController.php` — cabang `opd` + method `agencyIndex()`.
- `app/Http/Controllers/Admin/UserController.php` — `opd` masuk `assignableRoleNames()`.

### Frontend
- `resources/js/lib/utils.js` — `ROLE_LABELS` + `roleLabel()` + `roleTone()`.
- `resources/js/Pages/Profile/Edit.jsx` — memakai kamus itu; lencana perisai jadi
  "bukan warga biasa".
- `resources/js/Pages/Front/Reports/Index.jsx` — kedua tab disembunyikan saat
  `scope === 'agency'`.

### Test
- `tests/Feature/Sisupit/RoleLabelParityTest.php` — **BARU**, 2 test.
- `ReportResolutionTest.php` +3, `OpdDashboardTest.php` +3, `UserAssignRoleTest.php` +3.

## 5. Blast radius & hal yang mengikat

1. **Kalimat "Laporan warga melalui aplikasi Sisupit" hanya boleh ditulis di
   `ReportResolution::SUMBER_APLIKASI`.** Sebelumnya ia hidup di seeder saja; begitu pemakainya
   dua, kalimat yang ditulis dua kali akan menyimpang tanpa gejala (pelajaran #80).
2. **Nama OPD di tim atensi dibaca dari kolom SNAPSHOT `report_agencies.agency_name`**, bukan
   master `agencies` — berita acara dokumen historis, isinya tak boleh ikut berubah saat master
   OPD di-rename. Aturan yang sama sudah berlaku di `ReportsExport`. Dikunci test.
3. **`ROLE_LABELS` berurut, dan urutannya berarti**: satu akun bisa berperan ganda, yang tampil
   adalah yang paling menentukan wewenangnya. Peran tak dikenal berbunyi "Peran belum
   ditetapkan" — JANGAN dikembalikan jadi "Anggota Masyarakat", klaim itulah bugnya.
4. **`agencyIndex()` memakai `withoutGlobalScopes()`**, jadi re-check ownership-nya adalah
   `agency_id` akun itu sendiri (ATURAN EMAS #7). Akun OPD tanpa instansi melihat KOSONG, bukan
   semuanya — `whereRaw('1 = 0')` eksplisit, bukan mengandalkan efek samping.
5. **`opd` di `assignableRoleNames()` bukan eskalasi**: peran itu di luar `User::STAFF_ROLES`
   (tak menerima siaran wilayah), dan pemilihan instansinya sudah dijaga `Agency::whereKey()`
   yang ber-`Tenantable`. JANGAN memasukkan `admin`/`superadmin` ke daftar itu.
6. **Tanpa migrasi, tanpa route baru, tanpa perubahan skema.** Deploy = pull + build.

## 6. Verifikasi

- [x] Baseline `php artisan test` sebelum: **329 passed (1253 assertions)**
- [x] 10 dari 11 test baru dibuktikan **merah** dulu (yang ke-11 penjaga regresi, lihat §2)
- [x] Test sesudah: **340 passed**
- [x] `npm run build` lulus
- [x] `vendor/bin/pint` PASS
- [ ] **Manual (A):** buka Berita Acara untuk laporan warga → "Sumber Informasi" terisi
      "Laporan warga melalui aplikasi Sisupit"; buka untuk laporan yang diketik operator →
      kolomnya kosong.
- [ ] **Manual (B):** insiden dengan OPD terlibat → tombol "Gunakan saran" pada Tim Atensi
      memuat "<Nama Instansi> (OPD)".
- [ ] **Manual (C):** login akun `opd` → `/profile` berbunyi "OPD / INSTANSI TERKAIT". Periksa
      juga `pejabat` & `superadmin` (keduanya ikut salah sebelum ini).
- [ ] **Manual (D):** login akun `opd` → "Arsip & Riwayat" berisi insiden yang instansinya
      diminta membantu; kedua tab tidak muncul; klik salah satu baris → detail terbuka.
- [ ] **Manual (E):** login admin kabupaten → `/admin/users` → "Tetapkan Peran" → `opd` ada di
      dropdown, memilihnya memunculkan pemilih instansi, dan instansi yang tampil hanya milik
      wilayahnya.
- [ ] **Deploy:** pull + `npm run build` (atau commit `public/build`). **Tidak ada migrasi.**
      Route tidak berubah → route cache tak wajib dibangun ulang.

## 7. Rollback

Satu rentang commit fokus → `git revert`. Tak ada perubahan skema, jadi revert kode sudah cukup
dan tak ada data yang perlu dipulihkan.

---

## Acceptance criteria
- [x] Kelima permintaan user terpenuhi
- [x] Tidak ada regresi (329 → 340 passed)
- [x] Diff minimal & sesuai konvensi
- [x] `FINDINGS_LOG.md` #89 / #90 / #91 dicatat FIXED

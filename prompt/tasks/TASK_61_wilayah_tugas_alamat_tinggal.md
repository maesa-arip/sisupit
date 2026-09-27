# TASK_61 - Wilayah akun = wilayah TUGAS bagi petugas + isian Alamat Tinggal
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_61 |
| Severity | P2 |
| Tipe | fitur kecil (teks + satu isian) |
| Sumber | permintaan user 2026-09-27 |
| Status | DONE (kode) - branch `worktree-alamat-tinggal` dari origin/main @8dc43af6 |

---

## 1. Deskripsi masalah / tujuan
Ada petugas yang TINGGAL di Badung tapi BERTUGAS di Damkar Denpasar. Karena satu-satunya
isian wilayah di akun berbunyi "domisili", ia memilih Badung - lalu seluruh laporan, dashboard,
notifikasi & aksi lapangan Denpasar tertutup baginya (kode wilayah akun adalah SATU-SATUNYA
dasar yurisdiksi: Tenantable, notifiableForReport, channel real-time, withinReportJurisdiction).
Permintaan user: "rubah teks setiap isi alamat, seperti saat pertama daftar dan di profil,
jelaskan kalau itu wilayah tugas untuk petugas dan buatkan kolom alamat tinggal".

Keputusan user (ditanya lebih dulu):
- Alamat tinggal = kolom `users.address` yang SUDAH ADA (teks bebas), TANPA migrasi.
- Diisi pemilik akun (Profil) DAN admin (/admin/users).
- Branch baru dari main, terpisah dari feat/regu-danru.

## 2. Reproduce
Data prod 2026-09-27 (baca saja): 8 dari 76 petugas belum berlevel kota; #9/#10 berwilayah
Badung. Profil menyebut kartunya "Yurisdiksi Akun" untuk semua peran tanpa penjelasan;
Lengkapi Profil menyebutnya "wilayah domisili".

## 3. Root cause
- Kode wilayah akun memikul dua makna (domisili warga vs wilayah tugas staf) tanpa satu pun
  kalimat di layar yang membedakannya.
- `users.address` ada sejak migrasi awal & dipakai detail relawan, tapi TAK ADA layar yang
  merender isiannya: form admin menyimpan `address` di state (Create.jsx/Edit.jsx:40) tanpa
  `<Input>`, profil tak memuatnya, `UserSingleResource` tak membawanya, dan
  `ProfileController::update` tak memvalidasinya.

## 4. Fix
- `app/Http/Resources/UserSingleResource.php` - `address` ikut `auth.user`.
- `app/Http/Controllers/ProfileController.php` - `update()` menerima `address`
  (nullable|string|max:255); `resolveJurisdiction()` mengirim `kind` = `tugas` untuk
  `User::CENTRALLY_MANAGED_ROLES` (daftar yang SAMA yang dikecualikan dari Lengkapi Profil),
  `domisili` untuk lainnya. Dari server, bukan daftar peran di JSX (#101).
- `Pages/Profile/Edit.jsx` - kartu berjudul "Wilayah Tugas" / "Wilayah Domisili" + kalimat
  penjelas.
- `Pages/Profile/Partials/UpdateProfileInformationForm.jsx` - isian "Alamat Tinggal".
- `Pages/Profile/CompleteProfile.jsx` - satu kalimat UMUM (pendaftar selalu warga; petugas
  tak pernah melihat layar ini).
- `Pages/Admin/Users/{Create,Edit}.jsx` - isian "Alamat Tinggal" + judul blok "Wilayah
  Penugasan" -> "Wilayah Akun" dengan penjelasan petugas vs warga.

## 5. Blast radius
- `update()` profil memakai `$user->update($data)` dari hasil validate() - kode wilayah TIDAK
  ada di aturannya, jadi alamat tinggal mustahil menggeser wilayah tugas (dikunci test).
- `address` kini tampil di detail relawan bila diisi pemiliknya (sudah begitu desainnya).
- Tanpa migrasi, route, channel, notifikasi. Deploy = `git pull` + build aset.

## 6. Verifikasi
- [x] Test penjaga BARU `ProfileAlamatTinggalTest` (lihat laporan sesi)
- [x] Suite penuh, Pint, prettier, `npm run build`
- [ ] Manual: login petugas -> Profil: kartu "Wilayah Tugas" + isi Alamat Tinggal, simpan,
      muat ulang (tetap terisi, wilayah tak berubah). Login warga -> "Wilayah Domisili".
      /admin/users/{id}/edit: isian Alamat Tinggal + blok "Wilayah Akun".

## 7. Rollback
Revert satu commit; tanpa migrasi.

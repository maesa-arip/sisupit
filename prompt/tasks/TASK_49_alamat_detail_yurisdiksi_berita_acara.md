# TASK 49 — Alamat detail laporan, yurisdiksi petugas, notif konfirmasi OPD, & tiga isian Berita Acara
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_49 |
| Severity | P2 (satu kolom berdua makna + tiga permintaan fitur kecil) |
| Tipe | bugfix + fitur kecil |
| Sumber | permintaan user 2026-08-28 (satu pesan, tujuh butir) |
| Status | DONE — terdeploy @09cbf9fd |

---

## 1. Deskripsi masalah / tujuan

Satu pesan user, tujuh butir. **Dua di antaranya sudah selesai** sejak TASK_45 dan
diverifikasi ulang di sesi ini (tidak dikerjakan lagi):

- *"sumber informasi otomatis jika warga lapor lewat aplikasi, kecuali petugas/admin input
  manual"* — sudah ada di `ReportResolutionController::create()`, dikunci
  `ReportResolutionTest` (2 test).
- *"OPD masuk ke tim atensi"* — sudah ada, bertanda `(OPD)`, dibaca dari kolom snapshot
  `report_agencies.agency_name`, dikunci `ReportResolutionTest`.

Lima butir yang dikerjakan:

- **(A)** *"Di report/show alamat presisi itu bisa jadi bug, buat alamatnya sesuai lokasi,
  dibawahnya isi detail lokasi (seperti form inputnya)"*
- **(B)** *"jika memberikan role Petugas, yurisdiksi auto ke kota"*
- **(C)** *"pln mematikan listrik notif ke admin, petugas, relawan semua dan pelapor"*
- **(D)** *"Laporan Kegiatan Penyelamatan isikan volume air yang digunakan"* +
  *"pada bagian korban isikan Kondisi Korban"*
- **(E)** *"laporan sementara boleh diisi petugas dan admin, laporan final wajib admin"*

## 2. Reproduce (bukti masalah ada)

**(A)** Buka detail laporan mana pun. Panel berjudul **"Alamat Presisi"** menampilkan
`report.address`. Buat laporan kebakaran tanpa mengisi Patokan Lokasi (sah — darurat-first,
`ReportRequest` membuatnya opsional untuk kebakaran): panelnya **kosong**, padahal titiknya
diketahui persis. Lalu suruh responder yang sudah `arrived` menggeser pin & menekan
Konfirmasi: isi panel itu **berganti** jadi `display_name` mesin, dan patokan yang diketik
warga **hilang tanpa jejak** — tanpa galat, tanpa konfirmasi.

**(B)** `/admin/users` → dialog "Ubah Peran" → pilih **Petugas** pada akun ber-`village_code`
lengkap: dropdown "Tingkat Yurisdiksi" otomatis terisi **Desa**, bukan Kabupaten/Kota.

**(C)** Insiden dengan PLN dilibatkan, lalu akun PLN menekan konfirmasi: relawan sewilayah,
relawan yang sedang di lokasi, dan **pelapor** tak menerima apa pun.

**(D)** Form Laporan Kegiatan Penyelamatan: tidak ada isian volume air; baris korban hanya
nama / tanggal lahir / alamat / KTP.

**(E)** Akun petugas bisa menekan **"Simpan sebagai Final"** dan entri final tersimpan.

## 3. Root cause

**(A) — kolom `reports.address` memikul DUA makna yang bertabrakan.**
Saat laporan dibuat, `ReportController::store():419` menulis patokan yang **diketik manusia**
(`ReportRequest` menamainya "Alamat"). Saat pin dikoreksi,
`ReportActionController::correctLocation():706` **menimpa kolom yang sama** dengan
`display_name` hasil reverse-geocode yang dikirim `Show.jsx:516`. Jadi judul "Alamat Presisi"
(`Show.jsx:996`) adalah **KLAIM yang tak dijamin siapa pun**: isinya bisa kalimat manusia yang
menunjuk tempat lain dari pinnya, bisa kosong, bisa alamat mesin — dan mana yang berlaku tak
bisa dibedakan dari datanya. Bentuk yang sama dengan #90/#94 (sebuah nilai mengaku jadi
sesuatu yang bukan dirinya).

Yang membuatnya tak bisa diperbaiki di layar saja: alamat hasil geocode **tidak pernah sampai
ke server**. `Create.jsx` sudah menghitungnya (state `fullAddress`, tampil di panel
"Alamat Lengkap (otomatis)" sejak TASK_28, disaring `alamatTerbaca()` sejak TASK_43) tapi
`useForm` tidak pernah mengirimkannya dan tak ada kolom yang menampungnya.

**(B)** `resources/js/Pages/Admin/Users/Index.jsx:145` — `defaultLevelFor()` memilih tingkat
**terdalam** yang dimiliki pengguna (`rankToLevel[user.region_level]`), untuk semua peran
yurisdiksional sekaligus. Tidak ada tempat untuk membedakan default per peran.

**(C)** `ReportActionController::notifyCommandCenterOfConfirmation():440` hanya menyusun dua
himpunan: admin+petugas lewat `notifiableForReport`, dan `report_officers`. **Relawan tak
disebut sama sekali** — termasuk relawan yang sedang di lokasi (`report_helpers`), yang
keselamatan kerjanya sama persis bergantung pada kabar "listrik sudah padam". **Pelapor** juga
tidak, padahal ia yang menunggu di TKP.

**(D)** Kolomnya memang belum ada: `report_resolutions` (migrasi `2026_07_12_100000`) dan
`report_victims` (`2026_07_12_100100`).

**(E)** `ReportResolutionController::store():120` memakai `authorizeStaff()` yang sama untuk
kedua status — gerbangnya `petugas|admin|superadmin` tanpa membedakan `sementara` dari `final`.

## 4. Rencana fix (perubahan terkecil yang benar)

Empat keputusan ditanyakan ke user lebih dulu (2026-08-28) dan dijawab:

1. **Alamat DISIMPAN** sebagai kolom baru, bukan di-geocode ulang tiap kali halaman dibuka.
2. **Penerima notif konfirmasi OPD mengikuti aturan siaran yang sudah ada**
   (`KEY_NOTIFY_LEVEL_*` + saklar siaga), bukan angka baru.
3. **Antrian petugas** berubah jadi "belum ada berita acara sama sekali".
4. Patokan tetap bernama **"Patokan Lokasi"** di kedua layar — satu konsep, satu nama.

### (A) Alamat & patokan
- `database/migrations/2026_08_28_100000_add_geo_address_to_reports_table.php` — **BARU**,
  aditif: `reports.geo_address` (string 500, nullable, setelah `address`).
- `app/Http/Requests/ReportRequest.php` — validasi `geo_address` (nullable, max 500).
- `app/Http/Controllers/ReportController.php` — `store()` menyimpannya; `show()` tak berubah
  (model dikirim utuh).
- `resources/js/Pages/Front/Reports/Create.jsx` — `fullAddress` ikut terkirim lewat
  `useForm`; panel "Alamat Lengkap (otomatis)" tetap read-only seperti sekarang.
- `app/Http/Controllers/ReportActionController.php` — `correctLocation()` menulis
  `geo_address`, **berhenti menimpa `address`**.
- `app/Events/IncidentLocationCorrected.php` — payload membawa `geoAddress`.
- `app/Models/Report.php` — helper `alamatTampil()` (`geo_address ?: address`) + kembarannya
  `alamatLaporan()` di `resources/js/lib/utils.js`. **Ikutan yang wajib**: SEMBILAN layar
  meringkas laporan jadi satu baris "di mana" dengan membaca `address` langsung (5×
  `DashboardController`, `MonitoringMapController`, prefill berita acara, `Admin/Reports/Index`,
  `ReportCard`, `Front/Reports/Index`) — begitu kolom itu berhenti ditimpa alamat mesin,
  sebagian akan menampilkan baris KOSONG tanpa ada yang sadar.
- `resources/js/Pages/Front/Reports/Show.jsx` — panel jadi dua baris: **"Alamat"**
  (`geo_address`) di atas, **"Patokan Lokasi"** (`address`) di bawah. Laporan LAMA
  (`geo_address` kosong) di-reverse-geocode **sekali** saat halaman dibuka sebagai cadangan
  tampilan; hasilnya tidak ditulis balik ke DB.

### (B) Default yurisdiksi per peran
- `resources/js/Pages/Admin/Users/Index.jsx` — kamus `ROLE_DEFAULT_LEVEL` (data, bukan `if`):
  `petugas → kabupaten`. Tetap tunduk `levelOptionsFor()` (admin tak boleh memberi lebih luas
  dari dirinya; pengguna harus punya kode wilayah sampai tingkat itu). Tak tersedia → jatuh
  ke perilaku lama.

### (C) Penerima kabar konfirmasi OPD
- `ReportActionController::notifyCommandCenterOfConfirmation()` → dinamai ulang
  `notifyConfirmation()`; empat himpunan: Pusat Komando (ceiling petugas), relawan siaga
  (ceiling relawan), responder di lokasi dari **kedua** tabel, dan **pelapor**.

### (D) Volume air & kondisi korban
- `database/migrations/2026_08_28_100100_add_water_volume_and_victim_condition.php` — **BARU**,
  aditif: `report_resolutions.volume_air` (string, nullable) + `report_victims.kondisi`
  (string, nullable).
- Model `ReportResolution`/`ReportVictim` (`$fillable`), controller (validasi + create),
  `ReportController::show()` (kirim ke layar), `Resolution/Create.jsx` (isian),
  `Show.jsx` (tampilkan).
- `volume_air` **teks bebas**, bukan angka — mengikuti preseden `kerugian` ("±1jt"): yang
  ditulis petugas di lapangan sering "±3 tangki", bukan bilangan bersatuan tetap.

### (E) Final = admin
- `ReportResolutionController` — `authorizeStaff()` dipecah: `store()` menuntut
  `admin|superadmin` bila `status === 'final'`.
- `ReportController::show()` mengirim `canFinalizeResolution`; `create()` mengirimnya ke form.
- `Resolution/Create.jsx` — tombol "Simpan sebagai Final" hanya untuk yang berhak.
- `DashboardController` — antrian petugas jadi `whereDoesntHave('resolutions')`.

## 5. Blast radius

- **`reports.address` berhenti ditimpa** → satu-satunya penulisnya kini `store()`/`update()`.
  Pembaca lain kolom itu: `ReportResolutionController::create()` (prefill `lokasi_alamat` &
  `reporter_address`), `DashboardController` (`location`), `ReportsExport`, `ReportCard`.
  Semuanya tetap benar — justru lebih benar, sebab patokan tak lagi bisa berubah jadi alamat
  mesin di belakang mereka.
- **Migrasi ADITIF**, nullable, tanpa backfill: laporan lama `geo_address` kosong dan jatuh ke
  cadangan reverse-geocode di layar.
- **Antrian petugas menyempit** — item yang sudah punya entri `sementara` hilang dari kartu
  petugas. Disengaja (jawaban user): antrian yang tak bisa dibereskan sendiri terbaca sebagai
  bug (pelajaran TASK_45/#94). Admin menemukannya lewat `/admin/reports`.
- **Notif konfirmasi melebar** ke relawan siaga sewilayah + pelapor. `ReportAgencyTest` yang
  sudah ada menuntut petugas LUAR wilayah tetap tak dikabari — tetap hijau karena ceiling
  wilayahnya tidak disentuh.

## 6. Rencana verifikasi

- [x] Baseline sebelum: **348 passed, 1350 assertions**
- [x] Test baru dibuktikan MERAH dulu, lalu hijau
- [x] Test sesudah: **363 passed, 1415 assertions**
- [x] `vendor/bin/pint` PASS
- [x] `npm run build` lulus
- [ ] Verifikasi manual (daftar di bawah)
- [x] Migrasi dijalankan di DB dev LOKAL (laragon) — dua-duanya DONE
- [x] TERDEPLOY 2026-08-28 @09cbf9fd ke prod/staging/dev (ff dari ead12f76), urutan dev →
      staging → prod. Dua commit: `ed47bebe` kode, `09cbf9fd` aset. Naik SEKALIGUS dengan
      TASK_46/47/48 yang belum pernah ter-commit. Dua migrasi DONE di ketiga env, 0 pending;
      cadangan mysqldump di `/root/backup-predeploy-20260827-232724`. Data prod utuh
      (72 users / 22 reports / 51 hydrants / 320 banjars). `composer install` dilewati &
      route cache TIDAK dibangun ulang (routes/ & composer.lock tak berubah di rentang ini)

### Daftar periksa manual

1. **Alamat & patokan.** Buat laporan kebakaran **tanpa** mengisi Patokan Lokasi → buka
   detailnya: baris **"Alamat"** terisi alamat jalan dari titiknya; baris "Patokan Lokasi"
   berbunyi "Tidak diisi pelapor". Buat laporan lain **dengan** patokan → keduanya tampil
   berdampingan.
2. **Koreksi pin tidak menghapus patokan.** Sebagai responder yang sudah *Tiba*, geser pin →
   Konfirmasi. Baris "Alamat" berubah mengikuti titik baru; baris "Patokan Lokasi" **tetap**
   berisi kalimat warga. Buka di browser kedua: keduanya ikut berubah tanpa refresh.
3. **Laporan lama.** Buka laporan yang dibuat sebelum deploy ini → baris "Alamat" terisi hasil
   reverse-geocode (butuh Nominatim hidup), bukan kosong.
4. **Yurisdiksi petugas.** `/admin/users` → Ubah Peran → **Petugas** pada akun berdesa lengkap:
   dropdown terisi **Kabupaten/Kota**. Ganti ke Pejabat → kembali ke tingkat terdalam.
   Sebagai admin **tingkat kecamatan**, pilih Petugas → terisi Kecamatan (bukan Kabupaten),
   sebab admin tak boleh memberi lebih luas dari dirinya.
5. **Notif PLN.** Insiden dengan PLN dilibatkan; siapkan relawan siaga sewilayah, relawan
   non-siaga, dan relawan yang sedang meluncur. Akun PLN menekan konfirmasi → lonceng web
   berisi di: admin, petugas sewilayah, relawan siaga, relawan di lokasi, **dan pelapor**.
   Relawan non-siaga & petugas luar wilayah tetap kosong.
6. **Berita acara.** Isi "Volume Air Digunakan" (mis. `±3 tangki`) & "Kondisi Korban" (mis.
   `Luka bakar ringan`) → simpan Sementara → keduanya tampil di kartu berita acara di detail.
7. **Final = admin.** Login **petugas** → form berita acara: tombol "Simpan sebagai Final"
   TIDAK ADA, ada keterangan bahwa final ditutup admin. Login **admin** → tombolnya ada.
   Petugas yang memaksa `status=final` lewat request langsung → 403.
8. **Antrian petugas.** Sebagai petugas, tutup sebuah insiden lalu isi berita acara
   *Sementara* → insiden itu **hilang** dari kartu "Menunggu Berita Acara".

## 7. Rollback

Dua migrasi punya `down()` (drop kolom). Revert commit kode → perilaku lama kembali; kolom
yang tertinggal tidak dibaca siapa pun.

---

## Acceptance criteria
- [x] Kelima butir dikerjakan; dua butir yang sudah selesai di TASK_45 diverifikasi, bukan
      dikerjakan ulang
- [x] Tidak ada regresi (348 → 363 passed)
- [x] Diff minimal & sesuai konvensi
- [x] Dokumen terkait diperbarui (ARCHITECTURE_MAP, CONVENTIONS, FINDINGS_LOG, CLAUDE.md)

# TASK_55 — Laporan ganda untuk satu kejadian: server mengusulkan, admin menggabungkan (lapis 1 & 2)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_55 |
| Severity | P2 |
| Tipe | fitur kecil (menyentuh skema + alur verifikasi) |
| Sumber | permintaan user 2026-09-14 |
| Status | DONE (kode) 2026-09-14 — sisa: verifikasi manual §6 di browser, commit, deploy (migrasi aditif) |

---

## 0. Keputusan yang WAJIB dijawab user sebelum mulai

**DIKONFIRMASI user 2026-09-14: "setuju semua"** - kelima usulan di bawah berlaku apa adanya.

| # | Pertanyaan | Usulan | Kenapa usulan itu |
|---|-----------|--------|-------------------|
| K1 | Radius & jendela waktu kandidat | **500 m, 120 menit**, disimpan sebagai setting (`Setting::KEY_DUPLIKAT_RADIUS_M`, `KEY_DUPLIKAT_JENDELA_MENIT`), BUKAN konstanta | Asap kebakaran terlihat dari ratusan meter dan pelapor sering menandai titik dari tempatnya berdiri; 300 m (`JARAK_PELAPOR_MAKS_M`) terlalu sempit untuk itu. Angka ini tebakan awal - harus bisa disetel setelah melihat data nyata tanpa deploy. |
| K2 | Jenis kejadian yang dideteksi | **Kebakaran saja** (`Report::FIRE_INCIDENT_TYPES`) + laporan ber-`incident_type` NULL | Keluhan user tentang kebakaran. `lainnya` (pohon tumbang, banjir, hewan) punya pola sebaran yang berbeda dan dua laporan berdekatan lebih mungkin memang dua kejadian. NULL diikutkan karena laporan telepon/klien lama bisa tak berjenis. |
| K3 | Siapa boleh menggabungkan | **Admin saja** (sama dengan approve/reject, TASK_51) | Menggabungkan = memutuskan "ini bukan kejadian terpisah", sisi lain keputusan verifikasi. Daftar peran dibaca dari satu tempat yang sama dengan `$isVerifier`. |
| K4 | Notifikasi untuk laporan yang terdeteksi kandidat | **Nada triase TIDAK diulang**; daftar & dashboard tetap berubah live lewat `ReportFeedChanged` yang sudah ada | Ini inti keluhan (15 pelapor = 15 bunyi). Risiko: bila deteksinya keliru (dua kebakaran berdekatan), laporan kedua masuk tanpa bunyi - peredamnya: ia TETAP tampil di antrean, berlabel "Kemungkinan sama dengan …" + jaraknya, dan banner "X laporan menunggu verifikasi" tetap menghitungnya. Alternatif yang lebih hati-hati: senyap HANYA bila induknya sudah diverifikasi (`pending`/`handling`). |
| K5 | Bentuk penanda "sudah digabung" | **Status baru `digabung`** + kolom `merged_into_id` | Lihat §3.3. Ini MENGOREKSI saran awal di percakapan ("kolom saja, bukan status baru"): penelusuran kode membuktikan kolom saja lebih rawan. |

---

## 1. Deskripsi masalah / tujuan

Satu kebakaran dilihat banyak orang, dan setiap orang yang melapor melahirkan satu baris
`reports` berstatus `TERLAPOR`. Akibatnya:

- Pusat Komando menerima **satu nada triase per pelapor** (`ReportController::store()`
  `app/Http/Controllers/ReportController.php:486-492`), jadi satu kejadian bisa berbunyi belasan kali
  dalam beberapa menit, sehingga orang terbiasa mengabaikan bunyinya (alasan yang sama dengan TASK_50).
- Antrean Verifikasi Laporan berisi belasan baris untuk satu kejadian. Admin harus membuka
  masing-masing, dan tidak ada cara menandai "ini sama dengan yang tadi" selain **menolak**,
  yang mengirim pesan keliru ke pelapor jujur dan tercatat sebagai "Ditolak" di rekap.
- Kartu "Darurat Aktif", misi petugas, peta pemantauan, dan Export Excel menghitung per LAPORAN,
  jadi satu kebakaran tercatat sebagai banyak kejadian.

**Tujuan lapis 1 & 2:**
1. **Lapis 1, server:** saat laporan dibuat, server mencari laporan aktif yang berdekatan dalam ruang
   & waktu, lalu MENYIMPAN usulan "kemungkinan sama dengan #X". Laporan yang punya usulan tidak
   membunyikan nada triase lagi (K4).
2. **Lapis 2, admin:** di Verifikasi Laporan & halaman detail, admin melihat usulan itu dan memilih
   **Gabungkan** atau **Bukan kejadian yang sama**. Gabungan bisa **dipisahkan** lagi. Pelapor yang
   laporannya digabung tetap dikabari perkembangan kejadiannya.

**Prinsip yang mengikat seluruh task:**
- **Tidak ada penggabungan otomatis.** Mesin mengusulkan, manusia memutuskan. Dua kebakaran
  berdekatan yang keliru digabung berarti unit kedua tidak pernah berangkat, jauh lebih mahal
  daripada duplikat yang dibiarkan.
- **Tidak ada laporan yang diblokir atau dihapus.** Laporan tambahan adalah bukti (foto lain, info
  korban, dan konfirmasi bahwa kejadiannya nyata).
- **Form lapor warga TIDAK disentuh** (itu lapis 3, ditunda). Klien lama (APK/.exe) tidak butuh rilis.

**DI LUAR SCOPE (catat, jangan kerjakan diam-diam):** lapis 3 (pemberitahuan di form warga),
menggabungkan galeri foto anak ke induk, rekap Export per-insiden-induk (kolom "Jumlah laporan
tergabung" boleh; mengubah baris jadi per-induk tidak), penggabungan oleh petugas.

## 2. Reproduce (bukti masalah ada)

Kondisi awal (dibuktikan dari kode, 2026-09-14):
- `grep -ri "duplica|duplikat|merged_into" app/` → **nol** mekanisme deteksi laporan ganda.
- Kirim dua laporan kebakaran dari dua akun warga dengan pin berjarak 50 m, selang 1 menit:
  - kedua laporan tersimpan `TERLAPOR`, tanpa relasi;
  - `EmergencyAlertNotification(STAGE_REPORT_INCOMING)` terkirim **dua kali** ke admin/petugas yang sama;
  - `/admin/reports` menampilkan dua baris lepas; `menunggu_verifikasi` = 2;
  - satu-satunya aksi untuk laporan kedua selain broadcast adalah `reject()` → pelapor kedua
    berstatus "Ditolak".

Test yang harus MERAH lebih dulu (ditulis sebelum fix, lihat §6).

## 3. Root cause / temuan investigasi

### 3.1 Tidak ada konsep insiden di atas laporan
Satu baris `reports` = satu kejadian, tanpa kolom yang bisa menunjuk laporan lain. Seluruh alur
(notifikasi, antrean, dashboard, ekspor) membaca per baris.

### 3.2 Notifikasi triase tak bersyarat
`ReportController::store()` `:479-492` mengirim `STAGE_REPORT_INCOMING` ke semua Pusat Komando
sewilayah untuk SETIAP laporan baru, tanpa melihat laporan lain.

### 3.3 Kenapa status `digabung`, bukan kolom saja (K5)
Laporan aktif disaring dengan DUA gaya berbeda di kode:

**Daftar PUTIH** (menyebut status yang diikutkan). Status baru OTOMATIS keluar, dan itu benar:
- `Admin\ReportController.php:35` (filter `aktif`) & `:49` (`menunggu_verifikasi`)
- `Exports\ReportsExport.php:118` (filter `aktif`)
- `DashboardController.php:26` (Darurat Aktif), `:81` (misi petugas), `:201` (darurat terdekat)

**Daftar HITAM** (menyebut status yang dikecualikan). Status baru OTOMATIS MASUK, jadi WAJIB ditambah:
- `DashboardController.php:227` & `:237` (`!= 'ditolak'`: tugas saya & radar/feed publik)
- `ReportController.php:72` & `:105` (`whereNotIn(['TERLAPOR','ditolak'])`: daftar relawan/pejabat)
- `Front\MonitoringMapController.php:28` (semua status, disaring di KLIEN lewat `reportHidden`)
- `Console\Commands\SimulateResponders.php:102` (`whereNotIn(['resolved'])`, alat dev)

Dengan **kolom saja**, KESEBELAS tempat itu harus ingat `whereNull('merged_into_id')`, dan yang
terlupa menghitung satu kebakaran dua kali tanpa galat (bentuk #60/#94). Dengan **status baru**,
yang wajib diingat tinggal daftar hitam (6 tempat, tercantum di atas), dan kamus status di layar
sudah DIJAGA `ReportStatusDictionaryTest` (TASK_48): status yang benar-benar tertulis ke kolom tapi
tak dikenal kamus layar akan MERAH. Kolom `merged_into_id` tetap dibutuhkan untuk MENUNJUK induknya.

Status `digabung` BUKAN tahap alur (seperti `ditolak`, ia jalan keluar dari alur), jadi
`STEP_STATUS` di Thanks.jsx tidak mendapat tahap baru, melainkan keterangan tersendiri.

### 3.4 Hal-hal yang ditemukan dan membatasi bentuk solusi
- **Jarak wajib dihitung di PHP.** `acos()/radians()` tak ada di SQLite testing (#64). Pola:
  saring kotak lat/lng kasar di SQL, lalu haversine di PHP. `Report::jarakMeter()` sudah ada tapi
  `private` (`app/Models/Report.php:239`). Naikkan jadi `public static`, jangan disalin.
- **Tenantable.** `store()` dijalankan warga; scope-nya milik pelapor, bukan wilayah kejadian. Pencarian
  kandidat WAJIB `withoutGlobalScopes()` + dibatasi `city_code` laporan baru. Ia tidak memulangkan data ke
  pengguna, tapi ATURAN EMAS #7 tetap dicatat di komentar. Aksi gabung (lapis 2) memanggil
  `ensureWithinJurisdiction()` untuk KEDUA laporan (jangan ulangi #102).
- **`notifyReporter()`** (`ReportActionController.php:820`) hanya mengabari satu pelapor. Tanpa
  perubahan, pelapor yang laporannya digabung tak pernah tahu kejadiannya diverifikasi/selesai, dan
  keadaan yang tak dijelaskan terbaca sebagai laporan diabaikan (pelajaran TASK_45/#94).
- **`ReportStatusUpdatedNotification::via()`** = FCM + database, payload `type: report_status` sudah
  dikenal wrapper. Event baru `merged` cukup menambah cabang `match`, bukan kelas baru. JANGAN
  menambah `broadcast` (#114 / sirine TASK_50).
- **Pelapor anak tidak boleh diberi akses ke halaman induk.** `authorizeReportAccess` hanya pelapor
  sendiri + staf; membukanya untuk pelapor lain akan memperlihatkan nama & telepon pelapor induk.
  Layar anak menampilkan status induk yang DIKIRIM server, tanpa tautan ke induk.

## 4. Rencana fix

### 4.1 Skema, SATU migrasi aditif & nullable, tanpa backfill
`database/migrations/2026_09_xx_000000_add_duplicate_merge_to_reports.php`
- `duplicate_candidate_of_id` FK→reports nullable, `nullOnDelete`: **ditulis MESIN** (lapis 1)
- `merged_into_id` FK→reports nullable, `nullOnDelete`: **ditulis MANUSIA** (lapis 2)
- `merged_by` FK→users nullable `nullOnDelete`, `merged_at` timestamp nullable (jejak pelaku, pola #88)
- indeks `(city_code, status, created_at)` untuk kueri kandidat

Dua kolom terpisah, pola TASK_49 (`address` vs `geo_address`): usulan mesin tidak boleh terbaca
sebagai keputusan manusia. Nama relasi `candidateOf()` / `mergedInto()` / `mergedChildren()` /
`merger()`, BUKAN `mergedBy()`, karena akan menimpa kolom `merged_by` di JSON (gotcha #88).
`Report::STATUS_DIGABUNG = 'digabung'`.

### 4.2 Lapis 1: deteksi kandidat (`app/Models/Report.php` + `ReportController::store`)
- `Report::cariKandidatDuplikat(Report $baru): ?Report`
  - hanya bila `incident_type` ∈ `FIRE_INCIDENT_TYPES` atau NULL (K2)
  - `withoutGlobalScopes()`, `city_code` sama, `id != baru`, `status IN (TERLAPOR, pending, handling)`,
    `merged_into_id IS NULL` (selalu tunjuk INDUK, tak pernah anak, supaya tak ada rantai),
    `created_at >= now - jendela` (K1), kotak lat/lng kasar
  - haversine PHP ≤ radius (K1); pilih yang **terdekat**, bila seri yang **terlama** (induk alami)
- Di `store()`, SETELAH `Report::create`:
  - simpan `duplicate_candidate_of_id`
  - bila ada kandidat, lewati `Notification::send(... STAGE_REPORT_INCOMING)` (K4)
  - `broadcast(ReportFeedChanged::for(...))` TETAP jalan (antrean & dashboard admin berubah live)
  - SELURUH deteksi dibungkus sehingga galatnya TIDAK menggagalkan laporan: tangkap, log, anggap
    tanpa kandidat. Pelajaran `$akurasi` TASK_52: tak satu pun bagian fitur ini boleh menghilangkan laporan darurat.

### 4.3 Lapis 2: aksi admin (`ReportActionController` + `routes/web.php`)
Tiga endpoint baru, gerbang peran = `approve()` (K3), masing-masing `ensureWithinJurisdiction()`:
- `POST reports/{id}/merge` body `into_id`
  - anak: `TERLAPOR`, belum digabung, dan TIDAK punya anak sendiri (tolak, supaya tak ada rantai)
  - induk: `TERLAPOR|pending|handling`, bukan dirinya, bukan anak
  - tulis `status=digabung`, `merged_into_id`, `merged_by`, `merged_at`, kosongkan `duplicate_candidate_of_id`
  - `notifyReporter(anak, 'merged')`; broadcast `ReportStatusChanged(anak,'digabung')` +
    `ReportFeedChanged` anak & `ReportRecordChanged(induk)` (panel "laporan terkait" di induk)
  - boleh memilih induk SELAIN kandidat (admin tahu lebih banyak), jadi `into_id` wajib, bukan diambil dari kolom kandidat
- `POST reports/{id}/unmerge`: kembali `TERLAPOR`, kosongkan keempat kolom; broadcast yang sama.
  Nada triase TIDAK dikirim ulang (yang memisahkan adalah admin yang sedang melihatnya).
- `POST reports/{id}/dismiss-duplicate`: kosongkan `duplicate_candidate_of_id` saja ("Bukan kejadian yang sama").

`notifyReporter()` diperluas: untuk event `approved`/`en_route`/`arrived`/`resolved` pada INDUK,
kabari juga pelapor anak (unik per user, kecuali aktor). Satu helper, bukan salinan di tiap aksi.

### 4.4 Lapis 2: layar
- **`Admin/Reports/Index.jsx`**
  - baris ber-`duplicate_candidate_of_id`: label "Kemungkinan sama dengan LP-… · ±180 m" (jarak dari server)
  - baris induk: lencana "N laporan terkait"
  - kamus lokal `STATUS_META` + `STATUS_OPTIONS` + `LEGEND_STATUSES` mengenal `digabung`;
    `MONITOR_HIDDEN_STATUSES` memuat `digabung`
  - `Admin\ReportController::index` eager-load `candidateOf:id,title,lat,lng,status` + `withCount('mergedChildren')`
- **`Front/Reports/Show.jsx`**
  - staf/verifier pada laporan KANDIDAT: kartu "Kemungkinan laporan ganda" berisi ringkas induk + tombol
    **Gabungkan** / **Bukan kejadian yang sama**, digerbangi prop SERVER `canMerge` (pola `canVerify`,
    JANGAN daftar peran di JSX), ditaruh DI ATAS tombol Broadcast (gerbang terakhir sebelum sirine)
  - induk: panel "Laporan terkait (N)" untuk staf, dengan tautan ke tiap anak + jumlah foto + tombol **Pisahkan**
  - anak (semua penonton): kartu "Laporan ini digabung dengan kejadian yang sama" + status induk
    (prop `mergedIncident: {status, reportNumber}` dari server), tanpa tautan ke induk bagi non-staf (§3.4)
  - `reloadIncident()` `only:` ikut memuat prop baru (satu daftar, aturan #113)
- **`Components/StatusBadge.jsx`**, **`Monitoring/Map.jsx`** (`REPORT_STATUS` + tersembunyi bawaan),
  **`Front/Reports/Thanks.jsx`** (keterangan tersendiri seperti `STATUS_DITOLAK`),
  **`ReportsExport::STATUS_LABELS`** (`'digabung' => 'Digabung'` + kolom "Digabung ke" berisi nomor LP induk).
  Jumlah heading = nilai `map()` = `columnWidths` (dikunci test TASK_44).
- Label kanonik (usulan): **"Digabung"**. Warna netral seperti `ditolak` tapi BUKAN abu yang sama:
  pelapornya tidak salah.

### 4.5 Daftar hitam §3.3: keenam tempat ditambah `digabung`
`DashboardController:227,237`, `ReportController:72,105`, `MonitoringMapController:28` (disembunyikan di
klien), `SimulateResponders:102`.

### 4.6 Setting (K1)
`Setting::KEY_DUPLIKAT_RADIUS_M` (default 500) & `KEY_DUPLIKAT_JENDELA_MENIT` (default 120), dua
isian angka di `/admin/settings` di samping setelan jangkauan notifikasi. Nilai 0 = deteksi mati
(saklar darurat tanpa deploy bila deteksinya ternyata mengganggu).

### 4.7 Dokumen
`ARCHITECTURE_MAP` (kolom, status, 3 route), `CONVENTIONS` (daftar SEMUA peta status + aturan
"penyaring daftar hitam wajib mengenal `digabung`"), `FINDINGS_LOG` entri baru, CLAUDE.md STATUS.

## 5. Blast radius

| Area | Dampak | Tindakan |
|------|--------|----------|
| Notifikasi triase | Laporan kandidat senyap (K4) | Test: kandidat TIDAK mengirim, non-kandidat TETAP mengirim |
| Sirine / broadcast | Nol: `approve()` hanya bisa atas `TERLAPOR`; `digabung` tak bisa di-approve | Test gerbang status |
| Dashboard/misi/peta/ekspor | Anak keluar dari hitungan aktif | Test hitungan `active_reports` dengan satu anak |
| Kamus status layar | `digabung` wajib dikenal 4 kamus + ekspor | `ReportStatusDictionaryTest` diperluas: MENGGABUNGKAN lewat endpoint sungguhan lalu membaca status dari kolom (pola TASK_48, bukan kamus lawan kamus) |
| Pelapor anak | Dapat notif `merged` + perkembangan induk | Test fan-out & tak ada duplikat notif bila pelapor anak = pelapor induk |
| Edit laporan (#30) | Anak `digabung` tak lagi `TERLAPOR` → otomatis terkunci | Benar; dicatat |
| Tenantable / yurisdiksi | Deteksi lintas desa sekabupaten; aksi gabung dicek dua sisi | Test admin desa A tak bisa menggabung ke induk di luar wilayahnya |
| APK/.exe | Nol perubahan payload baru di jalur siaran | Event `merged` lewat `report_status` yang sudah dikenal |
| Laporan lama | Tanpa backfill; semua kolom NULL | Tak ada perubahan perilaku |
| Berita acara | Hanya untuk induk; anak `digabung` tak pernah `resolved` | Antrean BA petugas menyaring `resolved`, jadi aman |

## 6. Rencana verifikasi

- [ ] Baseline sebelum: `php artisan test` → catat (baseline CLAUDE.md: 433 passed, 1753 assertions)
- [ ] `ReportDuplicateMergeTest` BARU, ditulis dulu & dibuktikan MERAH:
  1. laporan kebakaran kedua ≤ radius & jendela → `duplicate_candidate_of_id` = laporan pertama
  2. di luar radius / di luar jendela / beda kabupaten / induk `resolved`/`ditolak` → NULL
  3. jenis `lainnya` tidak dideteksi (K2)
  4. kandidat menunjuk INDUK, bukan anak (tiga laporan berurutan)
  5. kandidat TIDAK mengirim `STAGE_REPORT_INCOMING`; non-kandidat TETAP (dua sisi dalam satu test)
  6. galat di deteksi TIDAK menggagalkan laporan (sabotase: lempar exception)
  7. merge oleh admin: status/kolom/jejak benar; petugas & relawan 403; di luar yurisdiksi 403
  8. merge ditolak: anak bukan TERLAPOR, induk ditolak/selesai, rantai, merge ke diri sendiri
  9. unmerge & dismiss
  10. approve atas laporan `digabung` → 403
  11. pelapor anak menerima `merged` lalu `approved` saat INDUK diverifikasi; tanpa notif ganda
  12. `active_reports` & `menunggu_verifikasi` tidak menghitung anak
  13. JSX: panel gabung digerbangi prop server `canMerge`, bukan daftar peran (pola TASK_51)
  14. radius 0 = deteksi mati
- [ ] `ReportStatusDictionaryTest` + `ReportClosureActorTest` (panjang kolom ekspor) diperluas
- [ ] Sabotase tiap penjaga → merah → pulihkan byte-exact (md5)
- [ ] Test sesudah hijau; Pint; prettier; `npm run build`
- [ ] Manual (butuh browser + Reverb, dua akun warga + satu admin):
  1. warga A lapor kebakaran; admin mendengar nada triase
  2. warga B lapor 100 m dari A → admin TIDAK mendengar nada; antrean berubah live, baris B berlabel "Kemungkinan sama …"
  3. buka B → kartu kandidat di atas Broadcast → Gabungkan → B "Digabung", A "1 laporan terkait"
  4. Thanks & detail milik warga B: berbunyi "digabung", tanpa nama/telepon warga A
  5. broadcast A → warga B menerima notifikasi "Laporan Anda divalidasi"
  6. Pisahkan B → kembali ke antrean sebagai "Laporan Masuk"
  7. warga C lapor 2 km dari A → nada triase berbunyi (bukan kandidat)
  8. Export Excel: B berstatus "Digabung", kolom "Digabung ke" = nomor A

## 7. Rollback

Commit fokus → `git revert`. Migrasi aditif: `down()` membuang empat kolom SESUDAH mengembalikan
anak ke `TERLAPOR` (tanpa itu baris berstatus `digabung` akan jadi status yatim di kode lama =
tampil sebagai "tidak dikenal", bentuk #94). Saklar cepat tanpa deploy: radius 0 di `/admin/settings`.
Deploy: kode & migrasi naik BERSAMAAN (status baru ditulis kode baru; kode lama tak mengenalnya).

---

## Acceptance criteria
- [ ] Keputusan K1-K5 dikonfirmasi user & dicatat di §8
- [ ] Laporan kebakaran berdekatan terusul sebagai kandidat; tidak ada penggabungan otomatis
- [ ] Kandidat tidak membunyikan nada triase ulang; laporan tak berdekatan tetap berbunyi
- [ ] Admin bisa Gabungkan / Bukan sama / Pisahkan; peran lain & luar yurisdiksi 403
- [ ] Anak keluar dari hitungan aktif di dashboard, antrean, peta, ekspor
- [ ] Pelapor anak dikabari penggabungan & perkembangan induk, tanpa melihat identitas pelapor induk
- [ ] Tak ada laporan yang gagal tersimpan karena deteksi
- [ ] Test ≥ baseline + penjaga baru terbukti merah lewat sabotase; Pint/prettier/build lulus
- [ ] ARCHITECTURE_MAP, CONVENTIONS, FINDINGS_LOG, CLAUDE.md diperbarui

## 8. HASIL (2026-09-14)

Dikerjakan sesuai §4 dengan penyimpangan berikut, semuanya ditemukan saat mengerjakan:

1. **Kotak koordinat SQL dibuang.** `reports.lat`/`lng` bertipe `string`; `whereBetween` di SQLite
   membandingkan TEKS dan tak pernah menemukan kandidat (5 test merah tanpa galat apa pun). Saringan
   kabupaten + status + jendela waktu di SQL, jarak di PHP. Indeks `(city_code, status, created_at)`
   tetap dipasang.
2. **Gerbang `digabung` lebih luas dari daftar §3.3.** Selain penyaring daftar hitam, aksi insiden
   berbentuk `in_array(..., ['resolved','ditolak'])` (takeAction, dispatchUnit, notifyAgencies, arrive)
   ikut disebut, plus `reject()` & `resolve()`. `resolve()` ternyata tanpa gerbang status sama sekali -
   hanya `digabung` yang ditutup di sini, sisanya dicatat #128. Di JSX: panel tindakan responder,
   panel OPD, dan panel armada (tersembunyi) ikut mengecualikan `digabung`; `Show.jsx` mendapat satu
   konstanta `isInResponseFlow` supaya prettier tak mengindentasi ulang seluruh blok.
3. **`$isRelawanInArea`** (`ReportController::show`) ikut menolak `digabung`, sama dengan `ditolak`.
4. **Pelapor anak tak diberi `merged_into_id` di prop `report`** (`makeHidden` untuk non-staf), sejalan
   dengan `mergedIncident.id = null`.
5. **Test lama yang disesuaikan, bukan dilonggarkan:** `ReportClosureActorTest` (kolom terakhir AI -> AJ),
   `ReportDetailRealtimeTest` (daftar reload dibaca isinya & kini juga menuntut tiga prop baru),
   `ReportStatusDictionaryTest` (aktor penolakan jadi admin - penjaganya kosong sejak TASK_51, #126 -
   plus test baru untuk `digabung` di kelima kamus).

**Penjaga:** `ReportDuplicateMergeTest` BARU (38 test). Dibuktikan MERAH lewat sabotase, masing-masing
karena alasan yang benar, berkas dipulihkan byte-exact (md5): nada triase kandidat (S1), cek wilayah
induk (S2), notifikasi ganda (S3), gerbang tolak (S4 - hanya kasus `reject` yang merah), `canMerge`
dari peran di JSX (S5), kamus StatusBadge (S6), feed publik (S7), saringan status induk (S8b), guard
setting pemanggil lama, dan daftar reload. `whereNull('merged_into_id')` di pencarian kandidat terbukti
REDUNDAN terhadap saringan status (sabotasenya tetap hijau) dan dibiarkan sebagai lapis pertahanan.

**GOTCHA verifikasi:** skrip sabotase pertama menjalankan `php` di subshell `bash script.sh`, yang
memanggil PHP 8.3 TANPA ekstensi SQLite (di shell interaktif `php` adalah alias `php.bat`). Semua test
"merah" di putaran itu merah karena `QueryException` koneksi, bukan karena penjaganya - putaran itu
dibuang dan diulang dengan `php.bat`. Selalu baca PESAN kegagalan sabotase, bukan cuma tanda ⨯.

**Angka:** test 433 -> **472 passed (1753 -> 1930 assertions)**; Pint PASS; prettier PASS (Thanks.jsx: tiga baris lama ikut
dirapikan prettier karena memang belum terformat); `npm run build` lulus (client + SSR). Migrasi aditif
DONE di DB dev LOKAL (142 laporan, tak berubah; 0 kandidat, 0 digabung - tanpa backfill).

**Temuan baru (dicatat, tidak dikerjakan):** #127 `ReportCard.jsx` hanya mengenal dua status; #128
`resolve()` tanpa gerbang status. #126 FIXED di sini (penjaga test).

**SISA:** verifikasi manual §6 (dua akun warga + admin, Reverb hidup), commit terpisah dari pekerjaan
sesi lain di working tree, deploy (`php artisan migrate` WAJIB bersamaan dengan kode - status `digabung`
ditulis kode baru, dan `down()` mengembalikannya ke TERLAPOR sebelum membuang kolom).

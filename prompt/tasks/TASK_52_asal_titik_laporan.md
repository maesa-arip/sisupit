# TASK_52 — Asal-usul titik laporan tampil di layar Pusat Komando (lapis 3)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_52 |
| Severity | P2 |
| Tipe | fitur kecil |
| Sumber | permintaan user 2026-08-31 + FINDINGS #104 |
| Status | DONE (kode) 2026-08-31 — sisa: verifikasi visual + deploy |

---

## 1. Deskripsi masalah / tujuan

Laporan user: **ada warga yang melapor TIDAK dari lokasi kejadian**, pinnya tertinggal di
posisi pelapor, dan pelapor tidak memperhatikan — sehingga **petugas berangkat ke tempat
yang salah**.

User mengusulkan popup "apakah Anda di lokasi?" saat melapor. Setelah dibahas (2026-08-31),
usulan itu **dipecah tiga lapis** dan user memilih **hanya LAPIS 3** dikerjakan sekarang:

| Lapis | Isi | Status |
|-------|-----|--------|
| 1 | Deteksi jarak GPS↔pin, tanpa bertanya | DITUNDA |
| 2 | Menyela hanya saat jaraknya jauh; cabang "dari jauh" mewajibkan patokan | DITUNDA |
| 3 | **Catat asal-usul titik & tampilkan ke Pusat Komando** | **TASK INI** |

**Kenapa lapis 3 lebih dulu (alasan user + alasan teknis):** ia menghentikan petugas salah
berangkat **tanpa menyentuh form darurat warga sama sekali** (nol popup, nol field wajib
baru), dan diff-nya jauh lebih kecil. Popup ya/tidak ditolak sebagai perbaikan tunggal
karena: (a) orang yang jadi masalah justru yang tak memperhatikan — ia akan mengetuk tombol
besar secara refleks, deklarasi diri adalah sinyal TERLEMAH yang tersedia; (b) ia jadi pajak
bagi semua orang demi segelintir kasus, membatalkan sebagian kerja darurat-first Kluster A;
(c) **jawaban "tidak di lokasi" pun tidak memberi tahu petugas di mana apinya** — pinnya
tetap salah, yang berubah cuma labelnya.

**Keputusan user (2026-08-31), keempatnya sudah dijawab:**
1. Ambang jarak **300 m**.
2. Cabang "melapor dari jauh" **mewajibkan patokan saja** (bukan + telepon) — berlaku di
   lapis 2, dicatat di sini supaya tidak ditanyakan ulang.
3. **Simpan jaraknya saja**, koordinat pelapor TIDAK disimpan.
4. **Lapis 3 saja** dulu.

## 2. Reproduce (bukti masalah ada)

Buka detail sebuah laporan sebagai petugas/admin. Kartu "Alamat / Patokan Lokasi"
(`Front/Reports/Show.jsx:1076-1105`) menampilkan alamat + tombol **"Navigasi ke Lokasi"**
yang menyuntik `lat,lng` ke Google Maps — **tanpa satu pun keterangan seberapa boleh titik
itu dipercaya**. Pin yang berasal dari fix GPS presisi ±10 m dan pin yang digeser 8 km oleh
pelapor yang sedang di rumah **terlihat persis sama**, dan keduanya sama-sama menawarkan
tombol navigasi yang sama tegasnya.

Buktinya ada di data: `ReportController::store()` (`app/Http/Controllers/ReportController.php:421-445`)
menyimpan `lat`, `lng`, `address`, `geo_address` — **tak satu pun kolom mencatat titik itu
datang dari mana**. Jadi pertanyaan "boleh saya percaya pin ini?" tidak bisa dijawab dari
data mana pun, bukan sekadar tidak ditampilkan.

## 3. Root cause

Dua lapis, dan yang kedua baru ketahuan setelah menelusuri kode:

**(a) Sinyal kepercayaan yang sudah dihitung, DIBUANG.** `Front/Reports/Create.jsx:414`
membaca `coords.accuracy`, memakainya sekali untuk ambang `GEO_ACCURACY_THRESHOLD` (1000 m,
`lib/utils.js:48`), lalu **melupakannya**. Angka itu tak pernah dikirim ke server. Begitu
pula posisi GPS mentah pelapor: ia ada di layar saat submit, lalu hilang bersama komponennya.

**(b) `userLocation` BUKAN posisi pengguna.** Jebakan yang harus disadari sebelum menulis
kode apa pun di sini: state `userLocation` (`Create.jsx:147`) terbaca seolah "di mana
pelapor berada", tapi ia ditulis di **TIGA** tempat dan dua di antaranya mengikuti PIN,
bukan orangnya:

- `getUserLocation()` sukses (`:412`) — ini yang benar, fix GPS asli.
- `resolveLocation()` (`:267`) — dipanggil `handleMarkerDrag()`, jadi **setiap kali pin
  digeser, `userLocation` ikut pindah ke posisi pin**.
- `selectRegion()` saat pin melompat ke centroid wilayah (`:532`).

Ia sebenarnya berarti "titik yang terakhir dipakai", dan satu-satunya pembacanya adalah
`locState` (`:781`) untuk lencana status lokasi. **Kalau jarak dihitung dari state ini,
hasilnya nyaris selalu ~0 meter** — lencana akan menyatakan SETIAP laporan berasal dari
lokasi, termasuk yang pinnya digeser 8 km. Lencana yang selalu hijau lebih buruk daripada
tidak ada lencana: ia memberi jaminan palsu pada layar yang tadinya jujur-jujur saja diam.

Karena itu fix ini **tidak boleh memakai ulang `userLocation`** dan **tidak boleh mengubah
maknanya** (`locState` bergantung padanya). Yang dibutuhkan ref BARU yang ditulis HANYA di
callback sukses `getUserLocation()`.

## 4. Rencana fix (perubahan terkecil yang benar)

### 4.1 Data

- `database/migrations/2026_08_31_100000_add_location_source_to_reports_table.php` — **BARU**,
  aditif & nullable, **tanpa backfill**:
  - `location_source` (string 32, nullable, index) — asal titik.
  - `location_accuracy_m` (unsignedInteger, nullable) — akurasi fix GPS saat submit.
  - `reporter_distance_m` (unsignedInteger, nullable) — jarak pelapor ↔ pin.
- `app/Models/Report.php` — tiga kolom masuk `$fillable`; konstanta **sumber tunggal**
  `Report::LOCATION_SOURCES` (empat nilai di bawah) dan `Report::JARAK_PELAPOR_MAKS_M = 300`.

**Kamusnya empat nilai, dan tiap nilai diturunkan dari BUKTI, bukan dari peran:**

| Nilai | Artinya | Ditulis oleh |
|-------|---------|--------------|
| `gps_pelapor` | pin ≤ 300 m dari posisi pelapor saat mengirim | `store()` |
| `ditandai_manual` | pin > 300 m dari posisi pelapor | `store()` |
| `tanpa_referensi` | posisi pelapor tak diketahui (izin ditolak/GPS gagal) | `store()` |
| `dikoreksi_petugas` | pin dibetulkan responder yang sudah TIBA di TKP | `correctLocation()` |

**SENGAJA TIDAK ADA nilai `pemilih_wilayah`** untuk alur telepon Pusat Komando (TASK_28).
Di pembahasan awal nilai itu diusulkan, lalu dibuang: menurunkannya dari PERAN pengirim
akan mengklaim "titik dipilih operator" pada petugas yang kebetulan melapor dari TKP
sungguhan — sebuah klaim yang bisa salah (bentuk #90). Laporan telepon jatuh sendiri ke
`ditandai_manual`, dan itu **memang benar apa adanya**: operator memang menandainya manual.
Yang menyesuaikan cukup kalimat lencananya, bukan kamusnya.

### 4.2 Server

- `app/Http/Requests/ReportRequest.php` — tiga field masuk, **semuanya `nullable`**:
  `reporter_lat`, `reporter_lng` (numeric, batas ±90/±180), `gps_accuracy_m` (numeric, min 0).
  Tidak ada satu pun aturan baru yang bisa MENOLAK laporan.
- `app/Http/Controllers/ReportController.php::store()` — hitung jarak (haversine, salin pola
  `Front\PompaController::haversineKm()` yang sudah ada — **jangan** `selectRaw` acos/radians,
  SQLite tak punya, #64), tetapkan `location_source`, simpan **jarak + akurasi saja**.
  `reporter_lat/lng` dipakai sekali lalu **dibuang**.
- `app/Http/Controllers/ReportActionController.php::correctLocation()` — ikut menulis
  `location_source = 'dikoreksi_petugas'` dan **mengosongkan** `reporter_distance_m` +
  `location_accuracy_m`.
- `app/Events/IncidentLocationCorrected.php` — bawa `locationSource` supaya lencana di layar
  yang sedang terbuka ikut berubah tanpa refresh (Show.jsx sudah mendengar event ini).

### 4.3 Frontend

- `resources/js/Pages/Front/Reports/Create.jsx` — ref BARU (mis. `gpsFixRef`) diisi HANYA di
  callback sukses `getUserLocation()` (`:412`), ikut terkirim saat submit.
  **NOL perubahan tampilan** — tak ada popup, tak ada field baru yang terlihat warga.
- `resources/js/lib/utils.js` — kamus `LOCATION_SOURCE_META` + `asalTitikLaporan()`
  (pola `ROLE_LABELS`/`facilityStatusLabel()`), memulangkan label + nada + kalimat saran.
- `resources/js/Pages/Front/Reports/Show.jsx` — lencana di kartu Alamat (`:1076`), tepat di
  atas baris Alamat & tombol "Navigasi ke Lokasi"; plus **satu baris peringatan di panel
  verifikasi** (`:935`, `reportStatus === 'TERLAPOR' && canVerify`) yang muncul hanya bila
  sumbernya bukan `gps_pelapor` — gerbang terakhir sebelum sirine berbunyi.

### YANG MENGIKAT (jangan "dirapikan" di sesi berikutnya)

- **(a) `userLocation` TIDAK BOLEH dipakai sebagai posisi pelapor** — lihat §3(b). Ia
  mengikuti pin. Memakainya = lencana yang selalu hijau.
- **(b) `correctLocation()` WAJIB menimpa `location_source`.** Tanpa itu lencana "±8 km dari
  pelapor" tetap menempel pada pin yang sudah dibetulkan responder di TKP — persis bentuk #95
  (kolom yang tak lagi dijamin penulisnya).
- **(c) Kamus di `lib/utils.js` TIDAK BOLEH bercadangan ke nilai lain.** Sumber tak dikenal &
  NULL (laporan lama, klien lama) berbunyi **"Asal titik tidak tercatat"**, bukan jatuh ke
  `gps_pelapor`. Cadangan sebuah kamus adalah KLAIM, bukan "tidak dikenal" — #94/#90.
- **(d) Ambang 300 m ditulis SEKALI, di SERVER** (`Report::JARAK_PELAPOR_MAKS_M`). Klien
  mengirim koordinat & akurasi MENTAH, tidak menghitung dan tidak menyimpulkan apa pun —
  klien yang ikut memutuskan = dua rumus yang bisa menyimpang (#79/#84) sekaligus vonis
  yang bisa dipalsukan.
- **(e) Koordinat pelapor TIDAK DISIMPAN** (keputusan user). Dipakai sekali di `store()` lalu
  dibuang. Jangan "sekalian simpan biar bisa diaudit" — itu membalik keputusan privasi tanpa
  bertanya; pelapor bisa sedang di rumahnya sendiri.
- **(f) BUKAN status baru.** `StatusBadge` & kamus status tidak disentuh sama sekali — ini
  atribut kepercayaan lokasi (pelajaran TASK_51 poin b: kamus status tidak difork).
- **(g) NOL yang memblokir.** Ketiga kolom nullable, ketiga field request nullable. Klien lama
  (APK WebView & .exe yang belum diperbarui) tidak mengirimnya → `location_source` NULL →
  lencana "tidak tercatat". Tak ada yang pecah, tak ada rilis wrapper yang dibutuhkan.

## 5. Blast radius

**Disentuh:** migrasi (1, aditif), `Report`, `ReportRequest`, `ReportController::store`,
`ReportActionController::correctLocation`, `IncidentLocationCorrected`,
`Front/Reports/Create.jsx`, `Front/Reports/Show.jsx`, `lib/utils.js`.

**TIDAK disentuh & sengaja di luar scope:** status laporan, route, channel, notifikasi,
`Tenantable`, `ReportsExport` (menambah kolom di sana menuntut heading/`LAST_COLUMN`/
`columnWidths` bergerak serempak & ada test yang mengunci panjang ketiganya — keputusan
tersendiri), kartu misi dashboard petugas, popup Peta Pemantauan.

**Yang perlu diuji ulang:** alur lapor warga (GPS bagus / GPS ditolak / pin digeser), alur
telepon Pusat Komando (`region_picker`), koreksi pin oleh responder yang sudah tiba,
laporan LAMA (kolom NULL) — keempat layar harus tetap normal.

**Catatan .exe:** geolokasi Chromium di Electron sudah lama mati di wrapper desktop, jadi
laporan yang dibuat dari sana akan wajar-wajar saja jatuh ke `tanpa_referensi`. Itu jujur,
bukan bug.

## 6. Rencana verifikasi

- [ ] Baseline: `php artisan test` → **375 passed, 1470 assertions**
- [ ] `tests/Feature/Sisupit/ReportLocationSourceTest.php` **BARU** (~7 test, buktikan MERAH dulu):
  1. pin ≈ posisi pelapor → `gps_pelapor` + jarak kecil tersimpan
  2. pin > 300 m → `ditandai_manual` + jarak tersimpan
  3. tanpa koordinat pelapor → `tanpa_referensi`, jarak NULL, **laporan TETAP tersimpan**
  4. koordinat pelapor **tidak tersimpan di kolom mana pun** (kunci keputusan privasi)
  5. `correctLocation()` → `dikoreksi_petugas` + jarak/akurasi dikosongkan
  6. parity: tiap `Report::LOCATION_SOURCES` punya entri di kamus `lib/utils.js`
     (pola `RoleLabelParityTest`; baca berkasnya, **jangan** kamus lawan kamus — #79).
     Catatan: `lib/utils.js` memuat byte NUL (#93) → baca binary-safe.
  7. kamus tidak bercadangan: sumber tak dikenal ≠ label `gps_pelapor`
- [ ] Test sesudah hijau (target ~382 passed)
- [ ] `vendor/bin/pint` PASS, `npm run format` PASS
- [ ] `npm run build` lulus
- [ ] Verifikasi manual (daftar di bawah)
- [ ] Migrasi dijalankan di dev lokal; prod/staging/dev VPS menyusul saat deploy

### Verifikasi manual
- [ ] Lapor dari HP dengan GPS hidup, pin tidak digeser → detail berlencana **hijau** "GPS pelapor (±N m)"
- [ ] Lapor lalu **geser pin > 300 m** → detail berlencana **kuning** + jaraknya benar
- [ ] Tolak izin lokasi lalu lapor → lencana **netral** "posisi pelapor tak diketahui"
- [ ] Laporan lama (sebelum migrasi) → "Asal titik tidak tercatat", bukan klaim hijau
- [ ] Admin buka laporan TERLAPOR bersumber `ditandai_manual` → peringatan tampil di atas tombol Broadcast
- [ ] Responder `arrived` mengoreksi pin → lencana berubah jadi "dikoreksi petugas" **tanpa refresh**

## 7. Rollback

Satu commit fokus → `git revert`. Migrasi aditif & nullable, jadi `down()` cukup
`dropColumn` ketiganya; tidak ada data lain yang bergantung padanya.

---

## Acceptance criteria
- [ ] Petugas/admin bisa menjawab "boleh saya percaya pin ini?" dari layar detail
- [ ] Admin melihat peringatan sebelum menyiarkan laporan yang titiknya belum terverifikasi
- [ ] Form lapor warga **tidak berubah sama sekali** dari sisi pengguna
- [ ] Tidak ada regresi (test ≥ 375 passed)
- [ ] Diff minimal & sesuai `prompt/docs/CONVENTIONS.md`
- [ ] `FINDINGS_LOG.md` #104 → FIXED; `ARCHITECTURE_MAP.md` (baris Report) & `CONVENTIONS.md` diperbarui

---

## 8. HASIL (2026-08-31)

**Selesai sesuai rencana, tanpa penyimpangan.** Yang berubah:

| Berkas | Perubahan |
|--------|-----------|
| `database/migrations/2026_08_31_100000_add_location_source_to_reports_table.php` | BARU — 3 kolom aditif & nullable |
| `app/Models/Report.php` | `LOCATION_SOURCES`, `JARAK_PELAPOR_MAKS_M`, `asalTitikDari()`, `jarakMeter()`, +3 fillable |
| `app/Http/Requests/ReportRequest.php` | `reporter_lat`/`reporter_lng`/`gps_accuracy_m`, ketiganya nullable |
| `app/Http/Controllers/ReportController.php` | `store()` menetapkan sumber + menyimpan jarak & akurasi |
| `app/Http/Controllers/ReportActionController.php` | `correctLocation()` menimpa sumber, mengosongkan jarak/akurasi |
| `app/Events/IncidentLocationCorrected.php` | properti `locationSource` (default null — pemanggil lama tak pecah) |
| `resources/js/Pages/Front/Reports/Create.jsx` | `gpsFixRef` + `transform()`; NOL perubahan tampilan |
| `resources/js/lib/utils.js` | `LOCATION_SOURCE_META` + `asalTitikLaporan()` |
| `resources/js/Pages/Front/Reports/Show.jsx` | lencana di kartu Alamat + peringatan di panel verifikasi |
| `tests/Feature/Sisupit/ReportLocationSourceTest.php` | BARU, 7 penjaga |

**Test 375 → 382 passed.** Pint PASS (7 berkas), prettier "unchanged" untuk ketiga berkas JS
(kode sudah sesuai format), `npm run build` lulus. Migrasi DONE di DB dev lokal
(`sisupit_dev`, MySQL): 141 laporan tidak berubah, 0 baris ter-backfill — persis desainnya.

**KETUJUH penjaga dibuktikan MERAH lebih dulu lewat sabotase sengaja**, keempat berkas yang
disabotase dipulihkan byte-exact (checksum md5 dicocokkan sesudahnya):

| Sabotase | Yang memerah |
|----------|--------------|
| ambang jarak diabaikan (semua jadi `gps_pelapor`) | pin jauh |
| `store()` tak menulis ketiga kolom | GPS pelapor, pin jauh, tanpa referensi, privasi |
| `correctLocation()` tak menimpa sumber | serah-terima ke responder |
| satu nilai server tanpa entri di kamus layar | parity kamus |
| kamus bercadangan `?? LOCATION_SOURCE_META.gps_pelapor` | larangan cadangan |
| `reporter_lng` ikut ditulis ke kolom laporan | privasi |

**Catatan jujur soal sabotase privasi:** percobaan pertamanya TIDAK memerahkan test, dan itu
bukan karena penjaganya lemah — sisipannya ditaruh sebelum kunci `'address'` yang asli di
array `Report::create()`, sehingga nilai aslinya (null) menang sebagai kunci duplikat
terakhir. Diulang di kolom yang tidak tertimpa (`geo_address`) dan langsung merah dengan
pesan `Expecting '{"id":1,...}' not to contain '115.2900'`.

**Ikutan yang TIDAK dikerjakan (sengaja, aturan emas #6):** `ReportsExport` (kolom asal titik
di rekap Excel), kartu misi dashboard petugas, popup Peta Pemantauan. Ketiganya bisa membaca
kolom yang sekarang sudah ada tanpa migrasi tambahan.

**SISA:**
1. Verifikasi visual §6 di browser (6 langkah) — repo tak punya browser automation.
2. Deploy + jalankan migrasi di prod/staging/dev VPS. Aditif & nullable, tanpa backfill;
   `routes/` & `composer.lock` tidak berubah di rentang ini, jadi route cache &
   `composer install` tak wajib. Frontend BERUBAH → `npm run build` harus ikut.
3. Laporan LAMA di ketiga env akan berlencana "Asal titik tidak tercatat" — itu benar dan
   disengaja, jangan di-backfill dengan tebakan.

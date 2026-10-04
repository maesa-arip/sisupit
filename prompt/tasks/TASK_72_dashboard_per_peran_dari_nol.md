# TASK_72 — Dashboard per peran dirancang ulang dari nol (best practice + apple-design)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_72 |
| Severity | P2 |
| Tipe | fitur / desain ulang UI (tujuh dashboard) |
| Sumber | permintaan user 2026-10-04: "saya beri kamu kebebasan, pakai skill apple-design ... tentukan apa saja yang best practice ditampilkan di dashboard masing2 role, jangan pakai tampilan saat ini sebagai referensi, mulai dari 0" |
| Branch | `feat/mobile-native-polish` (PENGECUALIAN #5 berlaku di sini) |
| Status | DONE 2026-10-04 - keenam fase selesai; DEV @5b7482f6 (dashboard baru), STAGING @6d1dc8ea (dashboard sebelumnya); belum cek visual ponsel |

---

## 1. Tujuan

Merancang isi & hierarki dashboard tiap peran dari pertanyaan "apa yang orang ini butuhkan
saat membuka aplikasi", bukan dari tampilan yang ada. Tampilan lama hanya dibaca untuk
mengetahui DATA yang sudah tersedia di server (`DashboardController`), bukan sebagai rujukan rupa.

## 2. Prinsip (berlaku untuk semua peran)

1. **Satu pertanyaan utama per peran, dijawab di layar pertama tanpa gulir (390px).** Itu
   menentukan apa yang paling atas & paling besar. Sisanya turun berurutan menurut urgensi.
2. **Dashboard berubah menurut keadaan (mode tenang vs mode darurat).** Aplikasi darurat
   99% waktunya tenang. Saat tenang, layar menenangkan & mengajak bersiap; saat ada kejadian
   yang menyangkut peran itu, kartu kejadian MENGAMBIL ALIH puncak layar. Bukan banner
   tambahan di atas tata letak yang sama.
3. **Aksi dulu, informasi kemudian, arsip terakhir.** Urutan tetap: (a) yang menunggu SAYA,
   (b) yang sedang berjalan, (c) konteks/sumber daya, (d) riwayat.
4. **Setiap angka bisa diketuk dan membuka daftar yang hitungannya PERSIS sama** (pelajaran
   #133). Setiap angka berlabel periode ("hari ini", "7 hari", "sepanjang waktu"). Tidak ada
   angka hiasan.
5. **Merah hanya untuk yang menuntut tindakan sekarang.** Warna status tetap dari kamus
   `StatusBadge`. Tombol utama merah brand (PENGECUALIAN #4). Ukuran & posisi membedakan
   tombol darurat.
6. **Waktu berjalan, bukan stempel.** Kejadian aktif menampilkan durasi yang terus bertambah
   ("menunggu 4 mnt"). Ambang usia mewarnai baris antrian.
7. **Realtime jujur.** Indikator koneksi dari `use-realtime-status` di semua dashboard staf.
   Item baru masuk dengan pegas + sorot singkat; reduced motion = cross-fade (apple-design §3, §14).
8. **Ponsel = satu kolom berurutan prioritas; desktop = dua kolom** (kiri: kerja, kanan:
   peta & konteks). Peta TIDAK PERNAH jadi blok pertama di ponsel. Di ponsel peta dilipat/ringkas.
9. **Keadaan kosong menenangkan dan informatif** ("Tidak ada laporan menunggu - semua sudah
   diproses 3 mnt lalu"), tetap lewat `AppEmpty`.
10. **Tidak ada PII warga di permukaan yang tak membutuhkannya** (feed publik tanpa nama/nomor pelapor).

## 3. Rancangan per peran

### 3.1 Warga - "Kalau terjadi sesuatu, saya tahu harus apa, dan laporan saya diurus"

Urutan (ponsel):
1. **Kartu "Laporan Anda" (hanya bila ada laporan aktif)** - mengambil alih puncak. Langkah
   Masuk -> Diverifikasi -> Petugas meluncur -> Tiba -> Selesai, durasi sejak lapor, regu yang
   menuju (sudah ada `ReportProgress`). Ketuk = detail.
2. **Dua aksi darurat besar**: `Lapor Darurat` (primer, merah) + `Telepon 113` (sekunder). Di zona
   jempol. Saat ada laporan aktif, tombol Lapor mengecil jadi sekunder (tetap ada).
3. **Pengumuman aktif** (shared prop `announcemet`) bila ada - satu kartu, bisa ditutup.
4. **"Terdekat dari Anda"**: Pos Pemadam terdekat (jarak + tombol telepon/arah) & hydrant
   terdekat. Butuh lokasi; tanpa izin lokasi -> berbasis kecamatan akun + ajakan izinkan lokasi.
5. **Kejadian di wilayah Anda** (keputusan produk TASK_71 §6): HANYA yang sudah diverifikasi
   (`pending`/`handling`) di kecamatan akun, maks 3, tanpa nama pelapor - kesadaran situasi,
   bukan feed media sosial. `TERLAPOR` tidak tampil (belum tentu benar).
6. **Riwayat laporan** 3 terakhir + "Lihat semua".
7. **Forum Warga** (bila `forum_enabled`) - satu baris pintasan dengan jumlah utas baru.

Dibuang: feed paginasi semua laporan wilayah ("load more") - bising, dan menampilkan laporan orang lain.

### 3.2 Relawan - "Apakah saya dibutuhkan sekarang, dan apakah saya sedang siaga?"

1. **Sakelar Siaga** sebagai kontrol utama di kepala layar, dengan konsekuensinya tertulis
   ("Siaga - Anda menerima panggilan darurat di Kec. Denpasar Barat"). Mati = abu tenang.
2. **"Tugas Berjalan" (bila ada baris `report_helpers` en_route/arrived)** - mengambil alih puncak:
   alamat, durasi, tombol `Navigasi` (Google Maps), `Tiba` / `Batal` (hanya saat en_route), ke detail.
3. **"Butuh Bantuan Sekarang"**: kejadian terverifikasi (`pending`/`handling`) di wilayahnya,
   urut JARAK dari posisi relawan, jumlah responder yang sudah menuju. Query SERVER (menutup
   TASK_71 §6 - tab "Butuh Respons" yang hanya menyaring halaman termuat).
4. **Kontribusi**: jumlah tugas selesai (sepanjang waktu) + keahlian (chip, sunting).
5. Bagian warga yang tetap relevan, ringkas: Laporan Anda (aktif), Lapor/113, riwayat.

### 3.3 Petugas - "Ke mana saya harus pergi, dan apa yang belum beres?"

Mode darurat (ada misi):
1. **"Misi Saya" (petugas tercatat en_route/arrived)** - kartu terbesar: jenis kejadian, alamat,
   durasi berjalan, `Navigasi`, `Tiba`, anggota regu yang ikut meluncur / jaga kantor, OPD yang
   dilibatkan, dan **sumber air terdekat ke TKP** (3 hydrant/SKKL terdekat + tekanan air) -
   informasi yang paling dicari di jalan.
2. **"Butuh Unit" (`pending` tanpa satu pun petugas meluncur)** - merah, durasi berjalan, aksi
   cepat `Meluncur` / `Jaga di Kantor` (bila beregu) langsung di baris.
3. **"Sedang Ditangani" (`handling`)** - netral: regu di lokasi, jumlah petugas & relawan.
4. **"Menunggu verifikasi admin" (`TERLAPOR`)** - satu baris ringkas terlipat (info untuk
   bersiap, tanpa aksi - sejak TASK_51 bukan wewenang petugas).

Mode tenang: kepala "Siaga - tidak ada misi aktif" (hijau tenang) + kartu regu.

Selalu:
5. **Regu Saya**: nama regu, danru, anggota. Untuk DANRU: per kejadian aktif, siapa sudah
   Meluncur / Jaga Kantor / belum memilih (calon "alpha", TASK_66).
6. **Tugas Administrasi**: antrian Laporan Kejadian sementara yang belum dibuat (sudah ada),
   dengan jumlah di kepala seksi.
7. **Peta taktis**: desktop kolom kanan, ponsel terlipat di bawah (buka = layar penuh).

### 3.4 Admin (Pusat Komando) - "Laporan mana yang harus saya putuskan sekarang?"

1. **Antrian Triase (`TERLAPOR`)** - blok utama. Tiap baris: jenis, lokasi, umur laporan
   (kuning >= 2 mnt, merah >= 5 mnt), jumlah foto, tanda **calon laporan ganda**
   (`duplicate_candidate_of_id`), aksi `Verifikasi` / `Tolak` / `Gabung` (yang terakhir ke detail).
   Kosong = "Tidak ada laporan menunggu".
2. **Papan Kejadian Aktif**: `pending` tanpa responder diberi tanda "Belum ada yang meluncur"
   (eskalasi), `handling` dengan jumlah petugas/relawan di lokasi, OPD yang belum konfirmasi.
3. **Angka kunci (4, berperiode, bisa diketuk)**: Masuk hari ini - Aktif sekarang - Median
   waktu respons 7 hari (lapor -> petugas pertama meluncur, `report_officers.dispatched_at`) -
   Selesai 7 hari.
4. **Pekerjaan Tertunda**: Laporan Kejadian belum final (ada sementara, belum final), OPD
   menunggu konfirmasi, hydrant berstatus `Perbaikan`.
5. **Sumber daya siaga**: relawan siaga, regu terdaftar, hydrant aktif / perbaikan.
6. **Peta operasional**: desktop kolom kanan (sticky), ponsel ringkas/terlipat.
7. Indikator realtime di kepala.

### 3.5 Pejabat - "Apakah layanan berjalan baik, dan di mana masalahnya?"

Strategis, tanpa tombol aksi. Pemilih periode (7 hari / 30 hari / 90 hari / tahun ini).
1. **Ringkasan situasi dalam satu kalimat** ("Saat ini 2 kejadian aktif di Kota Denpasar,
   keduanya sedang ditangani.") + jumlah aktif bisa diketuk.
2. **Angka kinerja periode**: total kejadian, median waktu respons (lapor -> meluncur), median
   waktu tiba (lapor -> tiba, `arrived_at`), % selesai, jumlah korban (baris `report_victims`).
   Kerugian TIDAK dijumlahkan: kolomnya teks bebas ("±50 juta") - menjumlahkannya = angka palsu.
3. **Tren kejadian per minggu** per jenis (recharts sudah terpasang; ikuti skill dataviz).
4. **Sebaran per kecamatan** (daftar berperingkat dengan batang) - titik rawan.
5. **Kesiapan sarana**: hydrant aktif vs perbaikan, SKKL, pos, relawan terdaftar vs siaga.
6. **Laporan Kejadian final terbaru** dengan unduh PDF (sudah ada route pdf).

### 3.6 OPD - "Apakah instansi saya diminta membantu, dan perlu saya konfirmasi?"

1. Kepala: nama instansi + indikator realtime.
2. **"Menunggu Konfirmasi Anda"** (`requires_confirmation` && belum `confirmed_at`, insiden belum
   selesai) - aksi `Konfirmasi` langsung di baris (endpoint `reports.agencies.confirm` sudah ada).
3. **Permintaan Aktif**: insiden belum selesai yang melibatkan instansinya - status, lokasi,
   durasi, tombol arah (Google Maps), telepon Pusat Komando.
4. **Riwayat** (selesai) terlipat, 10 terakhir.

### 3.7 Superadmin - "Apakah semua wilayah & sistem sehat?"

Dashboard admin (3.4) lintas wilayah PLUS:
- **Per tenant/kabupaten**: baris per wilayah dengan kejadian aktif, antrian triase, umur laporan tertua.
- **Kesehatan sistem** (hanya yang bisa dibuktikan): status realtime, jumlah `failed_jobs`, antrian queue tertunda.

## 4. Kebutuhan server (data yang belum ada)

| Kebutuhan | Peran | Catatan |
|---|---|---|
| Kolom `reports.approved_at` + `approved_by` (migrasi, nullable, tanpa backfill) | admin/pejabat | Tanpa ini "waktu verifikasi" tak bisa diukur. OPSIONAL fase 1 - angka respons memakai `dispatched_at` |
| Query "Butuh Bantuan" relawan urut jarak | relawan | butuh lat/lng posisi relawan (dari klien) atau pusat wilayah |
| Fasilitas air terdekat ke TKP | petugas | haversine di PHP atas hydrant/pompa ber-Tenantable, maks 3 |
| Pos/hydrant terdekat ke warga | warga | idem, posisi dari klien |
| Agregat kinerja & tren per periode | pejabat (admin sebagian) | query agregat, di-cache singkat |
| Status responder per anggota regu per kejadian | petugas (danru) | dari `report_officers` + `report_jaga_kantor` |
| Menghapus feed paginasi warga | warga/relawan | `page_data.reports` dibuang dari jalur 3 |
| Pecah jalur admin vs pejabat di `DashboardController` | pejabat | halaman sendiri `Pejabat/Dashboard` |

Semua ber-scope sama dengan sekarang (`narrowestJurisdictionColumn`, Tenantable;
`withoutGlobalScopes()` hanya dengan re-check kepemilikan - ATURAN EMAS #7).

## 5. Fase (usulan urutan pengerjaan, satu commit per fase)

1. **Admin** (triase + papan aktif + angka kunci) - dampak operasional terbesar.
2. **Petugas** (Misi Saya + Butuh Unit + air terdekat + status regu).
3. **Warga & Relawan** (state-adaptive, buang feed, Butuh Bantuan server-side).
4. **OPD** (konfirmasi inline).
5. **Pejabat** (halaman baru, agregat + recharts).
6. **Superadmin** (per tenant + kesehatan sistem).

## 6. Blast radius

`DashboardController`, empat halaman dashboard + satu baru (`Pejabat/Dashboard`), `AppSection`
(dipakai juga di luar dashboard? - cek sebelum mengubah), `use-report-feed`/`ReportFeedChanged`
(prop reload harus ikut daftar prop baru), test penjaga yang mengunci dashboard lama:
`DashboardPerPeranTest`, `NavigasiInstanTest`, `AppleDesignMaterialTest`, `LeafletPopupEscapeTest`,
`ButtonBrandColorTest`, `MobileNavParityTest` - penyesuaiannya dijelaskan per fase, bukan dilemahkan.

## 7. Rencana verifikasi (per fase)

- [ ] Baseline: 694 passed / 3556 assertions (branch ini)
- [ ] Test Pest per fase: isi prop per peran, scope wilayah, tak ada PII di prop warga
- [ ] Sabotase penjaga baru terhadap HEAD -> MERAH, pulihkan byte-exact (`cmp`)
- [ ] `npm run build` (client & SSR)
- [ ] Cek visual 390px & desktop tiap peran (akun seeder), mode tenang & mode darurat

## 8. Rollback

Satu commit per fase -> `git revert <commit>`; migrasi `approved_at` (jika disetujui) punya `down()`.

## 9. Keputusan yang diminta dari user

1. Setuju dengan urutan fase (Admin dulu)?
2. Tambah kolom `approved_at`/`approved_by` sekarang (angka "waktu verifikasi") atau tunda?
3. Warga melihat kejadian terverifikasi di kecamatannya (tanpa PII) - ya/tidak?
4. Pejabat dapat halaman sendiri (dipisah dari admin) - ya/tidak?

---

## 10. Keputusan user (2026-10-04)

"setuju semua, kerjakan mulai dari admin" - keempat butir bagian 9 disetujui: urutan fase (Admin dulu),
kolom `approved_at`/`approved_by` ditambah sekarang, warga melihat kejadian terverifikasi di kecamatannya
(tanpa PII), pejabat dapat halaman sendiri.

## 11. Fase 1 - Admin (Pusat Komando) - SELESAI 2026-10-04

### Perubahan
- `database/migrations/2026_10_04_100000_add_approval_actor_to_reports_table.php` (baru) - `approved_by`
  (FK users, nullOnDelete) + `approved_at`, nullable tanpa backfill (pola `resolved_by`, #88).
- `app/Models/Report.php` - fillable + cast `approved_at`, relasi `approver()` (bukan `approvedBy`, alasan `resolver`).
- `ReportActionController::approve()` - menulis `approved_at`/`approved_by` bersama status `pending`.
- `DashboardController` - jalur admin/superadmin kini `commandCenter()`; pejabat jalur sendiri ->
  `Pejabat/Dashboard` dengan prop lama apa adanya (`isPejabat` selalu true).
- `resources/js/Pages/Pejabat/Dashboard.jsx` - `git mv` dari `Admin/Dashboard.jsx`, hanya ganti nama komponen + komentar.
- `resources/js/Pages/Admin/Dashboard.jsx` - ditulis ulang: Menunggu Verifikasi (foto, umur berwarna 2/5 mnt,
  calon ganda, tanpa titik) -> Kejadian Aktif (tanpa responder di atas, petugas/tiba/relawan, OPD belum
  konfirmasi) -> Angka Kunci -> Perlu Ditindaklanjuti -> Siaga di Wilayah -> Peta Pemantauan. Umur berdetak
  tiap 30 dtk; item baru dari realtime masuk dengan pegas (reduced motion = fade); indikator realtime juga di ponsel.

### Penyimpangan dari rancangan (dan alasannya)
- **Verifikasi tidak satu ketuk dari dashboard.** `approve()` membunyikan sirine se-wilayah dan dialognya memilih OPD;
  keputusan itu harus diambil sambil melihat foto & peta. Baris antrian membawa pratinjau foto + "Tinjau & verifikasi"
  yang membuka detail. Dijaga test (tak ada `route('reports.approve'` di dashboard).
- **Angka "Selesai 7 hari" tidak dipasang.** Daftar `/admin/reports` tak punya saringan tanggal, jadi angkanya tak bisa
  membuka daftar yang hitungannya sama (#133). Yang bisa diketuk hanya "Aktif sekarang" (= `?status=aktif`), antrian
  (= `?status=TERLAPOR`), hydrant perbaikan (= `?status=Perbaikan`), relawan siaga (= `?status=siaga`).
- **Peta operasional tetap berupa tautan ke Peta Pemantauan**, bukan peta tertanam - Peta Pemantauan sudah ber-5 lapis &
  ter-scope; menanam peta kedua = wiring Leaflet ulang (anti-pola CONVENTIONS).
- Laporan Kejadian belum final dihitung untuk insiden 30 hari terakhir (insiden pra-#39 tak pernah punya entri).

### Test
- Baru: `tests/Feature/Sisupit/AdminCommandCenterTest.php` (10 test). Sabotase: dijalankan terhadap HEAD keempat berkas
  yang diubah -> 10/10 MERAH; dipulihkan & `cmp` byte-exact.
- Disesuaikan (bukan dilemahkan - asersinya ikut berkas yang dipindah): `AppleDesignMaterialTest` (StandbyCard &
  petak statistik -> `Pejabat/Dashboard.jsx`), `DashboardPerPeranTest` #176 (-> Pejabat), `DashboardMobileShellTest`
  (Pejabat ditambahkan ke daftar dashboard), `DashboardStandbyCountTest` (prop `resources.standby_volunteers`).
  `ReportDuplicateMergeTest` (laporan digabung tak ikut terhitung: kini `kpis.active_now` + `triageTotal`).
- Gotcha: halaman Inertia BARU baru bisa dirender test setelah `npm run build` (blade memuat `Pages/{komponen}.jsx`
  dari manifest Vite) - tanpa build, pejabat 500 "Unable to locate file in Vite manifest".
- Suite: **704 passed, 3610 assertions** (baseline 694/3556 + 10 test baru). `npm run build` (client & SSR) lulus. Pint & Prettier hanya berkas yang disentuh.

### Belum
- Cek visual 390px & desktop di browser/APK.
- `php artisan migrate` di VPS WAJIB naik bersama kode (kolom baru dibaca dashboard & ditulis approve()). Lokal sudah
  dijalankan 2026-10-04 setelah user melaporkan `Unknown column 'approved_at'` di /dashboard admin; diverifikasi
  /dashboard admin Denpasar = 200 `Admin/Dashboard` terhadap MySQL lokal (10 antrian, 21 aktif).

## 12. Fase 2 - Petugas - SELESAI 2026-10-04

Permintaan user: "lanjutkan fase 2 petugas, tapi jika saya minta kembalikan ke tampilan sebelumnya kamu sudah paham
kembalikan semua tampilan dashboard ke sebelumnya" -> lihat bagian 13.

### Perubahan
- `DashboardController` jalur petugas - prop LAMA tetap utuh (`activeMissions` termasuk TERLAPOR, `pendingResolutions`,
  `myRegu`, `tenant_location`; dipakai ReguTest, PetugasDashboardPendingResolutionTest, ReportFeedRealtimeTest). Tambahan:
  - per misi: `officers_count`/`helpers_count` (responder en_route/arrived), `i_responded`, `i_stay`;
  - `myMissions`: insiden pending/handling yang petugas INI tuju/sudah tiba - `withoutGlobalScopes()` dengan re-check baris
    `report_officers` miliknya sendiri (ATURAN EMAS #7, pola `myTasks` relawan), berisi `my_status`, `dispatched_at`,
    `arrived_at`, OPD (+ belum konfirmasi), `water` (3 sumber air terdekat: hydrant bukan `Perbaikan` + SKKL, kotak ±0,02°,
    jarak haversine, ber-Tenantable), `regu` (manifes anggota: tiba/meluncur/jaga/belum);
  - `reguBoard` (DANRU saja): per insiden terverifikasi yang sudah menyentuh regunya, siapa yang belum memilih (calon alpha).
- `resources/js/lib/click-location.js` (baru) - `getClickLocation` dipindah dari `Show.jsx` (isi sama), dipakai detail & dashboard.
- `resources/js/Pages/Petugas/Dashboard.jsx` ditulis ulang: Misi Saya (Tiba, Navigasi Google Maps, Detail, sumber air,
  regu, OPD) atau kartu tenang hijau -> Butuh Unit (aksi Meluncur / Jaga di Kantor di bawah baris, bukan di dalam tautan)
  -> Sedang Ditangani -> satu baris "N laporan menunggu verifikasi admin" -> Laporan Kejadian Belum Dibuat; kolom kanan
  desktop: papan regu danru + Peta Taktis (kode peta lama dipertahankan apa adanya, dijaga #175 & NavigasiInstanTest).
- **Meluncur dari dashboard langsung membuka halaman detail** sesudah berhasil: pelacakan GPS (watchPosition ->
  update-location) hanya hidup di Show.jsx. Tanpa itu petugas meluncur tanpa terlihat di peta siapa pun.

### Test
- Baru: `tests/Feature/Sisupit/PetugasDashboardTest.php` (7 test). Sabotase terhadap versi pra-fase-2 (controller fase 1,
  Petugas/Dashboard.jsx & Show.jsx HEAD) -> 7/7 MERAH; dipulihkan & `cmp`.
- Disesuaikan: `DashboardPerPeranTest` #171 (banner "Ada N Insiden Aktif!" diganti seksi - aturan TERLAPOR bukan misi tetap dijaga).
- Suite: **711 passed, 3640 assertions**; `npm run build` lulus. MySQL lokal: /dashboard petugas1 = 200 (31 misi, 5 Misi Saya,
  papan regu 14 baris - perlu dilihat di ponsel apakah terlalu panjang).

## 13. Cara mengembalikan SEMUA dashboard ke tampilan sebelum TASK_72

Titik pulih: tag git lokal `pra-task72-dashboard` (= commit 6d1dc8ea). JANGAN `git checkout <file>` - pulihkan per berkas:
```
git show pra-task72-dashboard:<path> > <path>
```
untuk: `app/Http/Controllers/DashboardController.php`, `resources/js/Pages/Admin/Dashboard.jsx`,
`resources/js/Pages/Petugas/Dashboard.jsx`, `resources/js/Pages/Front/Reports/Show.jsx`, (fase berikut: `Pages/Dashboard.jsx`,
`Pages/Opd/Dashboard.jsx`) dan test yang disesuaikan: `AppleDesignMaterialTest`, `DashboardMobileShellTest`,
`DashboardPerPeranTest`, `DashboardStandbyCountTest`, `ReportDuplicateMergeTest`, `DashboardReportFeedTenantScopeTest`. Hapus:
`Pages/Pejabat/Dashboard.jsx`, `lib/click-location.js`, `AdminCommandCenterTest` (kecuali test approved_at bila kolomnya
dipertahankan), `PetugasDashboardTest`, `WargaRelawanDashboardTest`, `OpdDashboardConfirmTest`, `PejabatDashboardTest`, `SuperadminDashboardTest`; kembalikan token `--chart-2` gelap
ke `160 60% 45%` di `resources/css/app.css`.
Kolom `reports.approved_at/approved_by` + penulisannya di `approve()` adalah DATA, bukan tampilan - dibiarkan kecuali user minta.
Lalu `npm run build` + suite penuh.

## 14. Fase 3 - Warga & Relawan - SELESAI 2026-10-04

### Perubahan
- `DashboardController` jalur 3: DIBUANG `page_data.reports` (feed paginasi + muat lebih), `nearbyEmergencies`, `myTasks`.
  `myReports`/`activeReports` tetap. Baru:
  - `areaIncidents` + `areaLevel`: maks 3 kejadian `pending`/`handling` di KECAMATAN akun (cadangan: kabupaten), lepas
    Tenantable (scope warga berhenti di desa) dengan pembatas kolom wilayah akun + kolom dipetakan eksplisit tanpa data pelapor;
  - `facilities`: pos pemadam & hydrant `Aktif` di kabupaten akun (data publik, sama dengan /fire-stations & /hydrants untuk
    tamu), urut jarak ke `regionCenter`, hydrant maks 300; klien mengurutkan ulang dengan GPS;
  - relawan: `needHelp` (terverifikasi & berjalan di wilayahnya, yang belum ia ikuti - query server, menutup TASK_71 §6),
    `activeTasks` (lepas Tenantable, gerbang baris report_helpers miliknya sendiri), `tasksDone`.
- `resources/js/Pages/Dashboard.jsx` ditulis ulang: tugas relawan berjalan (Saya Tiba / Navigasi / Detail / Batal) & Laporan
  Anda mengambil alih puncak -> Lapor Darurat + Telepon 113 (Lapor jadi garis saat ada keadaan berjalan) -> sakelar siaga ->
  Butuh Bantuan Sekarang (urut jarak, "Bantu - Meluncur" lalu ke detail untuk GPS) / Kejadian di Kecamatan Anda (warga) ->
  Riwayat; kolom kanan: Terdekat dari Anda (pos + telepon + arah, hydrant + arah), Kontribusi (relawan), Forum Warga.
- Pengumuman TIDAK diulang di Beranda: `AppLayout` sudah merendernya global.

### Temuan saat mengerjakan
- **Detail laporan orang lain tertutup bagi warga** (`ReportController::show` -> 403 kecuali pelapor/staf/pejabat/relawan
  di wilayah/helper/OPD). Karena itu baris "Kejadian di Kecamatan Anda" SENGAJA bukan tautan (dijaga test). Feed lama memakai
  ReportCard yang menautkan ke detail - kemungkinan warga dulu mendarat di 403 dari sana; tak lagi relevan karena feed dibuang.

### Test
- Baru: `WargaRelawanDashboardTest` (5). Ditulis ulang: `DashboardReportFeedTenantScopeTest` (feed dibuang -> 4 test untuk
  `areaIncidents`: wilayah sendiri, hanya terverifikasi, tanpa data pelapor, feed paginasi tak dikirim lagi).
  Disesuaikan: `ReportDuplicateMergeTest` (kini menuntut induk TAMPIL dan anak digabung TIDAK, di `areaIncidents`).
  Sabotase terhadap versi pra-fase-3 -> 9/9 MERAH; dipulihkan & `cmp`.
- MySQL lokal: warga2 = 200 (3 kejadian kecamatan, 3 Laporan Anda), relawan1 = 200 (7 tugas berjalan).
- Suite: **719 passed, 3666 assertions**; `npm run build` (client & SSR) lulus.

## 15. Fase 4 - OPD - SELESAI 2026-10-04

### Perubahan
- `DashboardController` jalur OPD: bentuk `requests` & `agencyName` TETAP (dijaga OpdDashboardTest); tiap baris ditambah
  `agency_id`, `lat`/`lng`, `created_at` (ISO), `notified_at`. Gerbangnya tetap keanggotaan `agency_id` akun sendiri.
- `resources/js/Pages/Opd/Dashboard.jsx` ditulis ulang: Menunggu Konfirmasi Anda (kartu per insiden: "Diminta: <label>",
  **Konfirmasi sudah dilakukan** -> dialog catatan opsional -> `reports.agencies.confirm` = endpoint & gerbang yang sama
  dengan halaman detail; Arah; Detail) -> Permintaan Aktif -> kolom kanan: Pusat Komando (`tenant.telepon_darurat` dari prop
  bersama, tampil hanya bila diisi) + Riwayat (10 terakhir). Peringatan "belum ditautkan" dipertahankan.
- Rancangan awal menyebut aksi OPD dikerjakan di detail "supaya konteks lokasinya terbaca"; kini kartu membawa lokasi &
  tombol Arah, dan konfirmasi di dashboard memangkas langkah saat petugas menunggu kabar listrik padam.

### Test
- Baru: `OpdDashboardConfirmTest` (3) - ujung ke ujung: agency_id dari prop dashboard diterima endpoint, dashboard berikutnya
  membaca terkonfirmasi + catatan tersimpan; OPD instansi lain 403; pembagian menunggu/aktif/riwayat. Sabotase terhadap
  pra-fase-4 -> 2/3 MERAH; test ke-3 (403 instansi lain) memang hijau di kode lama - ia mengunci otorisasi server yang
  TIDAK diubah, bukan membuktikan kode baru.
- MySQL lokal tak punya akun OPD -> tak bisa diperiksa di sana; jalur dicakup test.
- Suite: **722 passed, 3680 assertions**; `npm run build` (client & SSR) lulus.

## 16. Fase 5 - Pejabat - SELESAI 2026-10-04

### Perubahan
- `DashboardController::officialOverview()` (jalur pejabat, tanpa prop lama `stats`/`recentReports`/`isPejabat`): pemilih
  `?periode=7|30|90|tahun` (bawaan 30, nilai asing -> 30) di kalender WITA; `situation` (SAAT INI: menunggu verifikasi /
  menunggu petugas / ditangani); `performance` (total tanpa ditolak & digabung, % selesai, median respons & tiba dari
  `report_officers` dispatched_at/arrived_at pertama, korban dari entri Laporan Kejadian FINAL saja - sementara & final menyalin
  korban yang sama); `trend` (harian/mingguan/bulanan sesuai periode, ember kosong tetap ada); `districts` (8 kecamatan teratas,
  nama dari laravolt); `readiness` (hydrant aktif/total, SKKL, pos, relawan siaga/terdaftar); `finalReports` (5 terbaru + PDF).
  Kerugian TIDAK dijumlahkan (teks bebas). Kolom kueri ber-awalan `reports.` - kueri median menggabung report_officers.
- `resources/js/Pages/Pejabat/Dashboard.jsx` ditulis ulang: kalimat situasi + tautan kejadian aktif & Peta Pemantauan ->
  StandbyCard -> pemilih periode -> Kinerja (5 angka berlabel sumber) -> grafik batang tren (recharts lewat `ui/chart`, satu seri
  tanpa legenda, tooltip per batang, "Lihat sebagai tabel") -> Titik Rawan (batang berperingkat HTML) ; kolom kanan Kesiapan
  Sarana + Laporan Kejadian Final (PDF; gerbang `authorizeView` memang membolehkan pejabat di wilayahnya). Tanpa tombol aksi.
  Baris "Relawan siaga" bukan tautan (daftar /relawan milik staf).
- Skill dataviz: warna seri `--chart-2` divalidasi `validate_palette.js` - terang LULUS, gelap GAGAL pita lightness (L 0.699 >
  0.67) -> token gelap `--chart-2` diturunkan `160 60% 45%` -> `160 60% 40%` (lulus). Pemakai lain token itu hanya
  `ChartCustom.jsx` & `chart-area-interactive.jsx` yang tak dirender halaman mana pun.

### Test
- Baru: `PejabatDashboardTest` (6). Disesuaikan (maksudnya dipertahankan): `AppleDesignMaterialTest` (esensial ponsel pejabat =
  kalimat situasi + pemilih periode), `DashboardPerPeranTest` #176 (angka jujur: berlabel periode/sumber, tanpa "bulan ini"
  palsu, tanpa kerugian), `AdminCommandCenterTest` (pejabat menerima `performance`, bukan `triage`).
  Sabotase terhadap pra-fase-5 -> 6/6 MERAH; dipulihkan & `cmp`.
- MySQL lokal tak punya akun pejabat; `officialOverview()` dijalankan lewat refleksi dengan User TAK tersimpan (Denpasar) untuk
  membuktikan kueri agregat jalan di MySQL (ONLY_FULL_GROUP_BY): tahun ini 44 kejadian, 30% selesai, median respons 1 mnt (31),
  tiba 8 mnt (22), Densel teratas (31).
- Suite: **728 passed, 3702 assertions**; `npm run build` (client & SSR) lulus.

## 17. Fase 6 - Superadmin - SELESAI 2026-10-04

### Perubahan
- `DashboardController` jalur admin/superadmin: superadmin menerima tambahan `regions` (`regionBoard()`: satu baris per
  kabupaten dengan tenant aktif ATAU kejadian berjalan - antrian verifikasi, ditangani, umur laporan menunggu tertua; urut yang
  paling lama menunggu dulu) dan `systemHealth` (`systemHealth()`: job queue menunggu + umur tertua, job gagal 24 jam & total;
  tabel yang tak ada = null, bukan nol). Admin wilayah TIDAK menerima keduanya.
- `resources/js/Pages/Admin/Dashboard.jsx`: seksi "Per Wilayah" di puncak kolom kiri & "Kesehatan Sistem" (realtime klien +
  queue + job gagal) di puncak kolom kanan, keduanya hanya bila prop dikirim. Baris wilayah BUKAN tautan: daftar laporan admin
  belum bisa disaring per kabupaten, jadi tautan akan membuka daftar yang hitungannya beda (#133).
- Bug yang tertangkap test: `city_code` keluar sebagai int (kunci koleksi string-angka diubah PHP) -> di-cast ke string.

### Test
- Baru: `SuperadminDashboardTest` (4). Sabotase terhadap pra-fase-6 -> 3/4 MERAH; test ke-4 (admin wilayah tak menerima papan)
  memang hijau di kode lama karena prop belum ada - ia penjaga kebocoran ke depan. Dipulihkan & `cmp`.
- MySQL lokal: pusat@sisupit.com = 200 (Denpasar 10 menunggu/21 aktif di atas, Badung tenang; queue kosong, 0 gagal 24 jam).
- Suite: **732 passed, 3731 assertions** (baseline pra-TASK_72 694/3556); `npm run build` (client & SSR) lulus.

## 18. Ringkasan TASK_72 (keenam fase)

| Peran | Halaman | Pertanyaan utama yang kini dijawab di layar pertama |
|---|---|---|
| Admin | `Admin/Dashboard` | Laporan mana yang harus saya putuskan sekarang? (antrian triase berumur) |
| Superadmin | `Admin/Dashboard` + papan wilayah | Apakah semua wilayah & sistem sehat? |
| Petugas | `Petugas/Dashboard` | Ke mana saya harus pergi? (Misi Saya + air terdekat, Butuh Unit) |
| Warga | `Dashboard` | Laporan saya diurus? Apa yang harus saya lakukan? (Lapor/113, terdekat) |
| Relawan | `Dashboard` | Apakah saya dibutuhkan sekarang? (tugas berjalan, Butuh Bantuan) |
| OPD | `Opd/Dashboard` | Perlu saya konfirmasi? (konfirmasi langsung) |
| Pejabat | `Pejabat/Dashboard` (baru) | Apakah layanan berjalan baik, di mana masalahnya? |

Sisa sebelum rilis: cek visual 390px & desktop tiap peran (mode tenang & darurat), keputusan commit/deploy (migrasi `approved_at`
WAJIB bersama kode + cadangan DB), papan regu danru yang bisa panjang (14 baris di data lokal).

## 19. Deploy 2026-10-04

Permintaan user: "deploy tampilan dashboard sebelumnya ke staging dan tampilan dashboard ini ke dev" (perbandingan berdampingan).
- Commit `0aa89b63` (kode+test+docs) + `5b7482f6` (build) di `feat/mobile-native-polish`.
- Push GitHub (semua fast-forward, tanpa force): `dev` & `feat/mobile-native-polish` 6d1dc8ea -> 5b7482f6; `staging` 9988587e ->
  6d1dc8ea (= tag `pra-task72-dashboard`, kini juga ada di GitHub). Staging ikut menerima 84 commit branch ini (#159-#176,
  TASK_69-71) - tanpa perubahan composer.lock/.env.example/config/routes/migrasi.
- User menjalankan `deploy-env.sh` di konsol Hostinger (dev lalu staging). Migrasi `approved_at` jalan di dev.
- Verifikasi HTTPS (tanpa SSH): /login 200 di keduanya; bundel app sesuai manifest commit masing-masing (dev app-qXQqK8K2.js,
  staging app-CUzoOKeo.js, 200); chunk Pejabat/Dashboard 200 di dev & 404 di staging; isi chunk Admin/Dashboard dev memuat
  "Menunggu Verifikasi" (baru), staging memuat "Laporan Insiden Terbaru" (lama).

## 20. Lanjutan - papan regu danru dibatasi (2026-10-04)

Permintaan user: "papan regu danru dibatasi saja, terlalu panjang di HP" (14 kartu di data lokal).
- Server: `reguBoard` diurutkan - insiden yang masih punya anggota "belum memilih" di atas (sort PHP 8 stabil, terbaru-dulu tetap
  di dalam kelompok). Isi prop tidak berubah.
- `Petugas/Dashboard.jsx`: maks `REGU_BOARD_LIMIT = 3` kartu + tombol "Tampilkan semua (N)" / "Tampilkan lebih sedikit"; kartu
  diringkas jadi satu baris hitungan ("4 meluncur, 1 jaga kantor") dan HANYA anggota yang belum memilih disebut namanya
  (yang perlu dihubungi danru), atau "Semua anggota sudah memilih".
- Test: `PetugasDashboardTest` +2 (urutan: insiden lama berangota belum-memilih mendahului insiden baru yang tuntas; batas 3 +
  kartu ringkas). Sabotase terhadap HEAD -> 2/2 MERAH, dipulihkan & `cmp`. Suite **734 passed, 3736 assertions**; build lulus.
- Deploy dev @672b6a10 (user via konsol Hostinger). Verifikasi HTTPS: /login 200, bundel app-CnBjJK7H.js sesuai manifest,
  chunk Petugas/Dashboard memuat "Tampilkan semua" & "belum memilih"; staging tetap @6d1dc8ea (app-CUzoOKeo.js).

## 21. Salin data produksi ke dev & staging (2026-10-04)

Permintaan user: "copy data di production ke dev dan staging, saya mau lihat tampilannya dengan data yang sama". Pertama kali
ditahan pemeriksa keamanan (menimpa DB + menyebar data pribadi); user lalu menyetujui tegas: "ya, izinkan salin data produksi
ke dev dan staging".
- `deploy/copy-prod-data.sh` (commit `4f339c89`): tolak target produksi / DB sama dengan produksi, cek alat sebelum langkah
  merusak, cadangkan DB target, dump produksi, kosongkan & impor, `migrate` target, kosongkan `fcm_tokens`/`push_subscriptions`/
  `sessions`/`jobs`/`failed_jobs`/`cache`/`cache_locks` (notifikasi dev/staging tak boleh sampai ke ponsel pengguna sungguhan;
  job produksi tak boleh dijalankan ulang), salin `storage/app/public` tanpa menghapus. TIDAK menyalin `storage/app/private` (KTP).
- Diambil ke `/root` lewat `git fetch` + `git show FETCH_HEAD:...` (CR dibuang `sed`: blob di repo ber-CRLF meski .gitattributes eol=lf).
- User menjalankan untuk dev lalu staging. Verifikasi HTTPS tanpa SSH: /hydrants, /pumps, /fire-stations identik di
  produksi/dev/staging (51/6/7; sidik isi id+nama+status+tekanan sama persis); kode tak berubah (dev app-CnBjJK7H.js, staging
  app-CUzoOKeo.js). Laporan, pengguna & foto TIDAK bisa diperiksa tanpa login - angka `produksi` = `target pasca` di keluaran
  skrip yang menjadi buktinya.

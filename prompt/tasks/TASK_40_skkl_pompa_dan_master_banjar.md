# TASK_40 — SKKL kembali murni pompa, rekap air pindah, dan master banjar
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_40 |
| Severity | P2 |
| Tipe | fitur + bugfix |
| Sumber | permintaan user 2026-08-26 (enam poin dalam satu pesan) |
| Status | DONE (kode) — sisa verifikasi manual §7 |

---

## 1. Enam permintaan

1. Kolom **kapasitas** dihilangkan dari Manajemen SKKL.
2. Chip status **"Terdaftar Belum/Sudah Dimodifikasi"** dihilangkan dari Manajemen SKKL.
3. **Ringkasan Air Desa pindah** ke Manajemen Hydrant Warga, dan yang dijumlahkan **hanya
   hydrant warga**.
4. **Bug:** tombol Hydrant Warga tidak menyala di sidebar.
5. Tambahkan data **banjar** di area yurisdiksi hydrant warga.
6. Saat mendaftar, **wajib mengisi nama banjar**.

## 2. Keputusan yang ditanyakan lebih dulu

| Pertanyaan | Jawaban user |
|---|---|
| Hydrant warga keluar dari SKKL — ikut keluar dari `/pumps` publik & layer peta? | **Tidak — hanya di menu admin** |
| Bentuk data banjar | Master + importir; kolom `jenis` disiapkan sejak awal, diisi belakangan |
| Banjar ditanyakan di layar mana | **Lengkapi Profil**, bukan form Daftar |

Poin 1 & 2 lahir sebagai konsekuensi otomatis begitu hydrant warga keluar dari daftar admin —
tidak ada aturan yang perlu ditekuk, dan **tidak ada filter yang lumpuh**. Chip status di
halaman publik `/pumps` TETAP memuat keempat status karena di sana daftarnya memang masih
gabungan; jangan "seragamkan" dengan halaman admin.

## 3. Perubahan poin 1–4

- `Admin\PompaController::index()` — hanya `Pompa`, dan karena sumbernya tinggal satu ia
  kembali memakai paginasi Eloquent biasa (`paginate()->through(toSkklRow)`); paginator manual
  + `waterSummary()` + `villageLabel()` dihapus dari sana.
- `Admin\HydrantWargaController::index()` — mengirim `summary` baru: **satu satuan saja**
  (liter). Versi lamanya harus membawa dua satuan berdampingan karena halamannya memuat pompa
  (liter/menit, aliran) sekaligus tandon (liter, simpanan) — dua angka yang tak boleh
  dijumlahkan. Rekap dihitung dari SELURUH baris yang lolos filter, bukan satu halaman.
- `Admin/Pumps/Index.jsx` — kartu rekap, kolom kapasitas, badge "Warga", percabangan
  ikon/edit/hapus per `source`, dan dua chip status hydrant warga dibuang.
- `Admin/Hydrants/Index.jsx` — kartu "Ringkasan Air Desa". Kartunya muncul karena controller
  **mengirim prop `summary`**, bukan karena komponen memeriksa `variant === 'warga'` —
  percabangan itu memang dihindari modul ini (PENGECUALIAN_ATURAN #1).
- `navItems.js` — entri hydrant kini juga aktif di `/admin/hydrant-warga` (**poin 4**). Kedua
  jenis hydrant tampil sebagai satu menu bertab, jadi sidebar hanya punya satu entri; tanpa ini
  membuka tab Hydrant Warga membuat sidebar tak menyorot apa pun.

## 4. Perubahan poin 5–6 (banjar)

**Kenapa tabel, bukan kolom teks:** banjar akan diisi setiap warga yang mendaftar. Teks bebas +
wajib menghasilkan "Br. Tegal"/"Banjar Tegal"/"tegal" untuk banjar yang sama, dan sesudahnya tak
satu pun rekap per banjar bisa dipercaya. Repo ini baru membayar kelas masalah yang sama di #78.

- Migrasi `create_banjars_table`: `name`, `code` (kode resmi bila ada), `jenis` (dinas/adat,
  **nullable**), `is_active`, 4 kolom wilayah, SoftDeletes.
- Migrasi `add_banjar_id_to_hydrant_wargas_and_users`: keduanya **nullable + nullOnDelete**.
- `App\Models\Banjar` + `Banjar::optionsForVillage()`.
- `Admin\BanjarController` + `/admin/banjars` (Index + Form) + entri sidebar "Manajemen Banjar".
- `GET /api/banjars/{villageCode}` — sumber dropdown.
- Form hydrant warga: dropdown banjar, muncul lewat `showBanjar` di `variants.jsx` (DATA,
  bukan `if (variant === 'warga')`).
- Layar Lengkapi Profil: dropdown banjar + `Setting::KEY_REQUIRE_BANJAR`.
- Perintah `php artisan sisupit:import-banjar berkas.csv [--apply]`.

### Empat keputusan yang mengikat sesi berikutnya

1. **Kolomnya nullable meski "wajib".** 71 akun produksi & seluruh akun staf/OPD tak punya
   banjar; `NOT NULL` memaksa migrasi mengarang nilai. Staf kabupaten/kecamatan memang tidak
   berbanjar — sejalan dengan makna kolom wilayah kosong pada staf (#56/#23). "Wajib"
   ditegakkan di validasi form, bukan di skema.
2. **Kewajiban adalah SAKLAR yang default MATI**, dan server **menolak** menyalakannya selama
   master kosong. Dropdown kosong yang diwajibkan = pendaftaran warga terkunci (gema #61).
3. **Banjar BUKAN tingkat kelima `Tenantable`.** Trait itu alat kontrol akses di empat kolom
   BPS; banjar lebih halus dari desa dan sifatnya deskriptif.
4. **`/api/banjars` dikecualikan dari `EnsureProfileComplete`.** Layar lengkapi-profil sendiri
   yang memanggilnya; tanpa pengecualian, middleware memantulkannya balik ke halaman itu dan
   dropdown-nya kosong selamanya tanpa galat apa pun. **Ditemukan test, bukan mata.**

### Dari mana data banjarnya (hasil penelusuran 2026-08-26)

**Tidak ada unduhan resmi berisi NAMA seluruh banjar.** Yang dipublikasikan hanya rekapitulasi
JUMLAH: PDF "Data Banjar Adat 2025" milik DPMA Bali (diunduh & diperiksa — **4 halaman**, rekap
per kecamatan), Satu Data Bali, dan Pusat Data Denpasar. OSM juga tidak bisa dipakai: query ke
Nominatim Bali yang kita self-host hanya menemukan **105 objek** bernama "Banjar …" — 49 balai
banjar, 13 halte, 12 kantor, dan hanya 6 batas administratif.

Sumber nama yang sah: **BPS Kota** (banjar = SLS, master-nya bernama *dan* berkode),
**Bagian Pemerintahan/Dinas PMD Pemkot** (banjar dinas), **MDA/DPMA** (banjar adat). Rekap
publik tetap berguna sebagai **penguji kelengkapan**: jumlah hasil impor per kecamatan harus
sama dengan angka resminya.

**Keputusan domain yang masih terbuka:** banjar dinas vs banjar adat adalah dua daftar berbeda
dengan jumlah berbeda. Kolom `jenis` sudah disiapkan supaya keduanya bisa hidup berdampingan.

### Hasil impor berkas user (`docs/List Nama Banjar Denpasar.xlsx`, 138 baris)

Dijalankan ke DB dev: **123 banjar tersimpan**, dan itu hanya menutupi **18 dari 43
desa/kelurahan Denpasar** — 25 desa (Sesetan, Pedungan, Panjer, Renon, Sanur, Pemogan, Ubung,
Sumerta, …) masih tanpa satu pun banjar. **Karena itu kewajiban banjar BELUM boleh dinyalakan**:
warga di 25 desa itu akan menghadapi dropdown kosong dan tak bisa menyelesaikan pendaftaran.

Dua temuan lain dari berkas itu:
- **11 baris bukan Denpasar** — CATUR (3) & BLAHKIUH (7) di Kecamatan Petang/Abiansemal, KUTA (1)
  di Kecamatan Kuta; ketiganya milik **Kabupaten Badung**. Ditolak dengan benar oleh `--city=5171`.
- **27 baris beda ejaan vokal** — "DAUH PURI KLOD"/"PEMECUTAN KLOD"/"DANGIN PURI KLOD" vs ejaan
  BPS "…KELOD". Diterima lewat `--fuzzy`, yang menerima **hanya** bila rangka konsonannya sama
  persis dan calonnya tunggal. Kriteria "jarak huruf" biasa sempat dicoba dan langsung
  mengusulkan **"CATUR" → "SANUR"** — dua desa yang sama sekali berbeda. Jangan pernah
  menggantinya dengan levenshtein.
- 4 baris kembar (nama banjar sama di kelurahan sama) tergabung jadi satu, bukan digandakan.

## 5. Blast radius

- `/pumps` publik & layer SKKL Peta Pemantauan **tidak tersentuh** — masih menggabungkan dua
  sumber (dikunci test).
- Tak ada data yang berpindah/terhapus; dua migrasi hanya menambah tabel & kolom nullable.
- `users.banjar_id` masuk `$fillable`; tak ada alur lain yang mengisinya selain layar profil.

## 6. Penjaga

- `HydrantWargaSkklTest` — hydrant warga keluar dari daftar admin **tapi tetap di daftar
  publik**; rekap pindah & hanya menghitung hydrant warga; entri sidebar menyala di tab warga.
- `FacilityVillageCodeRepairTest` — dua test judul baris rekap ikut pindah ke sumber barunya.
- `BanjarMasterTest` (9 test) — rantai wilayah diturunkan dari desa; desa luar yurisdiksi
  ditolak; dropdown hanya berisi banjar desa itu & yang aktif; endpoint melayani user yang
  belum punya kode wilayah; banjar tersimpan di hydrant warga; kewajiban mati→hidup; menyalakan
  saat master kosong ditolak; daftar ter-scope kota.

## 7. Verifikasi

- [x] `php artisan test` → 282 → **295 passed (1104 assertions)**
- [x] `npm run build` lulus; Pint & Prettier bersih
- [ ] **Manual (SISA):**
  1. `/admin/pumps` — tak ada kolom kapasitas, chip tinggal Semua/Berfungsi/Tidak Berfungsi,
     tak ada baris hydrant warga, tak ada kartu rekap.
  2. `/admin/hydrant-warga` — kartu "Ringkasan Air Desa" muncul & angkanya hanya dari tandon;
     sidebar menyorot menu Hydrant saat tab ini dibuka.
  3. `/pumps` publik masih menampilkan hydrant warga (keempat chip status utuh).
  4. `/admin/banjars` — tambah satu banjar, lalu buka form Tambah Hydrant Warga: dropdown
     banjar terisi setelah desa dipilih.
  5. Nyalakan kewajiban saat master kosong → ditolak; setelah ada isinya → warga baru tak bisa
     lanjut tanpa memilih banjar.
  6. `php artisan sisupit:import-banjar contoh.csv` (tanpa `--apply`) → hanya laporan.

## 8. Rollback

Satu commit fokus → `git revert`. Dua migrasi baru bersifat menambah; `migrate:rollback`
membuang tabel `banjars` dan kedua kolom `banjar_id` tanpa menyentuh data lain.

## 9. ADENDUM 2026-08-26 — banjar bisa nyangkut di desa yang salah (temuan #82, FIXED)

Pemeriksaan atas permintaan user sesudah task ini dinyatakan selesai. Dibuktikan lebih dulu
dengan test sementara: tandon berkode desa `5171022009` tersimpan menunjuk banjar milik desa
`5171012001` — redirect sukses, nol galat.

Dua lapis, keduanya perlu diperbaiki:

| Lapis | Sebelum | Sesudah |
|---|---|---|
| Server | `exists:banjars,id` — membuktikan barisnya ADA saja | `Banjar::assertBelongsToVillage()` dipanggil `HydrantWargaController::preparedData()` & `ProfileController::storeCompleteProfile()` |
| Form | effect hanya me-refetch pilihan; `data.banjar_id` desa lama tetap terkirim | pengosongan lewat **ref** saat desa berganti, di `Admin/Hydrants/{Create,Edit}.jsx` |

Tiga hal yang mengikat sesi berikutnya:

1. **Urutan di `preparedData()` bukan selera.** Banjar diadu dengan `village_code` HASIL
   `withJurisdictionCodes()`, bukan isi request — untuk admin yang desanya terkunci, kode dari
   akunnya yang tersimpan, jadi memeriksa request berarti memeriksa kode yang tak jadi dipakai.
   Dikunci test tersendiri.
2. **Pengosongan `banjar_id` HARUS pakai ref, jangan tanpa syarat.** Di layar Edit render
   pertama membawa desa DAN banjar yang sudah tersimpan; pengosongan tanpa syarat menghapus
   banjar yang sedang dibuka.
3. **`is_active` sengaja TIDAK ikut diperiksa** di `assertBelongsToVillage()`. Status itu
   mengatur apa yang DITAWARKAN, bukan apa yang sah — menonaktifkan sebuah banjar tak boleh
   membuat tandon lama gagal disimpan ulang saat catatannya disunting.

Penjaga: tiga test baru di `BanjarMasterTest`, ketiganya **dibuktikan merah** dengan mematikan
`assertBelongsToVillage()` lebih dulu. Test 295 → **298 passed (1113 assertions)**,
`npm run build` lulus, Pint bersih. Tanpa migrasi, tanpa perubahan route/kontrak.

**SISA dari pemeriksaan yang sama, BELUM dikerjakan (menunggu keputusan user):**
- **T2** — penjaga saklar wajib-banjar masih `Banjar::count() === 0`, yaitu global, bukan
  per-desa. Denpasar baru tertutupi 18 dari 43 desa, jadi menyalakannya sekarang akan mengunci
  pendaftaran warga di 25 desa sisanya (gema #61 dalam bentuk per-desa).
- **T3** — banjar tak bisa diubah setelah diisi: `ProfileController::update` tak memvalidasinya,
  `Profile/Edit` tak punya kolomnya, dan `Admin\UserController` juga tidak.
- **T4** — banjar tak ditampilkan kembali di daftar `/admin/hydrant-warga`.
- **Minor** — `fetch`/`axios` pengisi dropdown banjar di ketiga layar tanpa `.catch`: kegagalan
  endpoint = dropdown kosong tanpa pesan (bentuk #74).

## 10. ADENDUM 2026-08-26 — warga boleh mengusulkan banjar yang belum terdaftar

Permintaan user setelah melihat 11 desa Denpasar tetap nihil meski situs desa sudah dipanen.

**Keputusan desain yang ditanyakan lebih dulu.** User mengusulkan usulan warga disimpan di
**tabel terpisah** lalu "dinormalisasi kedepannya". Disodori dua bentuk berikut konsekuensinya,
user memilih **satu tabel + kolom status**. Alasannya, dan ini yang mengikat sesi berikutnya:

1. `users.banjar_id` dan `hydrant_wargas.banjar_id` sudah menunjuk `banjars`. Tabel terpisah
   menuntut FK KEDUA di dua tabel; satu pembaca yang lupa bertanya dua kali = banjar seseorang
   lenyap tanpa gejala (bentuk #60/#71).
2. Banjar usulan dan banjar terverifikasi adalah **konsep yang sama pada tingkat keyakinan
   berbeda** — tidak seperti hydrant resmi vs hydrant warga (PENGECUALIAN #1), yang memang dua
   konsep dengan pengelola & kosakata berbeda. Itu kolom, bukan tabel.
3. Menyetujui usulan = **membalik kolom**, id tetap, semua penunjuk utuh. Dengan tabel terpisah,
   promosi = pindah baris = id baru = penunjuk lama yatim — biaya yang persis sudah tercatat di
   PENGECUALIAN #1 poin 4 ("hapus lalu buat ulang; id dan riwayatnya tidak ikut").

**Yang dibangun:**
- Migrasi `2026_08_26_140000`: `banjars.status` (default `terverifikasi`, ber-index) +
  `created_by` (jejak pengusul, nullOnDelete).
- `POST /api/banjars` (`Api\BanjarUsulanController`) — wajib login, `throttle:10,1`, dan
  **dikecualikan dari EnsureProfileComplete**; tanpa itu tombolnya mati tanpa gejala bagi orang
  yang justru sedang melengkapi profil (jebakan yang sama sudah kena sekali di GET-nya).
- `Banjar::normalkanNama()` — semua nama masuk sebagai `Banjar <Nama>`, awalan apa pun yang
  diketik warga (`Br.`, `banjar`, `Bj.`) dilucuti dulu. Konvensi ini bukan selera: seluruh 123
  baris impor Pemkot memakainya.
- `Banjar::rangkaNama()` + `cariSerupa()` — pendeteksi duplikat: vokal dibuang (Klod=Kelod)
  DITAMBAH th=t, dh=d, kh=k, varian Bali yang terbukti nyata di data ini (DB "Kertha Dharma"
  vs situs desa "Kerta Dharma"). **JANGAN diganti Levenshtein** — sudah ditolak di importir
  karena mengusulkan CATUR → SANUR.
- `Admin\BanjarController::verify()` + penyaring status berlencana jumlah di `/admin/banjars`.

**`resources/js/Components/BanjarField.jsx` — SATU komponen untuk ketiga layar** (Lengkapi
Profil, Tambah & Ubah Hydrant Warga). Dibuat justru karena tiga salinan sudah terbukti
menyimpang: itulah #82. Logika pengosongan-saat-desa-berganti kini hidup di satu tempat saja;
**jangan dipecah lagi**. `ui/combobox.jsx` dapat dua prop OPSIONAL (`emptyAction`, `itemBadge`)
supaya puluhan dropdown lain tak berubah perilakunya.

**Tiga sifat yang disengaja:**
- Usulan **tetap muncul** di dropdown (bertanda "usulan"). Menyembunyikannya berarti warga
  berikutnya di desa yang sama mengetik ulang nama yang sama → duplikat.
- Nama mirip **ditawarkan**, tidak digabung sendiri maupun dibuat begitu saja; pengguna bisa
  memaksa (`paksa: true`) karena Tegal Kaja & Tegal Kelod memang dua banjar.
- `jenis` **tidak ditebak** untuk usulan warga — dibiarkan null.

Test 298 → **305 passed (1151 assertions)**, `npm run build` lulus, Pint bersih.

**AKIBAT untuk T2:** perhitungannya berubah. Dropdown kosong bukan lagi jalan buntu — warga di
desa yang masternya nihil kini bisa mengisi sendiri. Penjaga per-desa jadi jauh kurang mendesak,
tapi `Banjar::count() === 0` yang global tetap perlu ditinjau sebelum saklarnya dinyalakan.

## 11. ADENDUM 2026-08-26 (lanjutan) — T2/T3/T4 tuntas + master terisi

**Data diterapkan ke DB dev.** 216 baris (`docs/banjar_denpasar_final.csv`) → 195 baru,
21 diperbarui, 0 ditolak. **123 → 319 banjar, 18 → 33 dari 43 desa, 0 duplikat nama per desa.**
Cadangan sebelum impor: `banjars_sebelum.sql` (mysqldump tabel `banjars`).
PRODUKSI & STAGING BELUM DISENTUH.

Empat bentrokan ejaan diselesaikan dengan **membuang salinan hasil panen, mempertahankan ejaan
DB** (Wangaya Kelod, Kertha Dharma, Mertha Jaya, Kertha Pura). Alasannya: salinan itu tidak
membawa informasi baru — banjar yang sama, ejaan berbeda — jadi membuangnya tak menghilangkan
apa pun sekaligus tak menimpa data yang ada. Daftarnya di `docs/banjar_denpasar_konflik_ejaan.csv`.

**T4 — banjar terlihat kembali di `/admin/hydrant-warga`.** Ikut sebagai anggota array meta yang
sudah tersaring (`.filter(Boolean)`), jadi pada hydrant resmi ia `undefined` dan hilang sendiri —
tanpa `if (variant === 'warga')`. Controller memuat `with('banjar:id,name')`. Kolom yang bisa
diisi tapi tak pernah terlihat lagi akan dianggap tidak tersimpan, lalu berhenti diisi.

**T3 — banjar bisa diubah setelah profil lengkap.** `PATCH /profile/banjar`
(`ProfileController::updateBanjar`) + kartu tersendiri di `Profile/Edit`, memakai `BanjarField`
yang sama sehingga "usulkan yang belum terdaftar" ikut tanpa satu baris pun disalin.
**Desa TIDAK ikut dikirim** — yang berlaku adalah `village_code` yang tersimpan di akun; menerima
desa dari form di sini akan menjadikan layar penukar banjar sebagai jalan memindahkan diri ke
desa lain, dan kolom wilayah menentukan apa yang dilihat serta notifikasi apa yang diterima.
Dikunci test. Kartunya tidak muncul bagi akun tanpa desa (staf kabupaten/kecamatan, #56).

**T2 — penjaga per-desa DIBATALKAN, diganti penampil kelengkapan.** Rencana semula (server
menolak menyalakan kewajiban selama ada desa kosong) **tidak lagi tepat** setelah fitur usulan
ada: dropdown kosong bukan jalan buntu, ia menawarkan tombol tambah. Menuntut kelengkapan 100%
berarti kewajiban itu tak akan pernah bisa dinyalakan — 11 desa Denpasar tak punya sumber data
resmi mana pun. Penjaga server TETAP sekadar "master tak boleh kosong"; yang ditambahkan adalah
`cakupanDesa()` yang mencetak "33 dari 43 desa sudah punya daftar banjar · 10 belum" tepat di
sebelah saklarnya, supaya keputusannya diambil sambil melihat angkanya. Kalimat kartunya juga
dibetulkan: dulu berbunyi "pastikan seluruh desa sudah lengkap", yang kini menyesatkan.

Test 305 → **310 passed (1182 assertions)**, `npm run build` lulus, Pint bersih.

**Bukti fitur usulan bekerja di aplikasi nyata:** satu baris berstatus `usulan` sudah lahir dari
browser — "Banjar Kaja" di **RENON**, salah satu dari 11 desa yang tak punya sumber data apa pun.

**SISA:** verifikasi visual per layar, dan deploy (migrasi `2026_08_26_140000` + impor master)
ke staging/produksi.

## 12. ADENDUM 2026-08-26 — data contoh hydrant warga (`HydrantWargaSeeder`)

Permintaan user setelah membuka /admin/hydrant-warga dan mendapati kartu "Ringkasan Air Desa"
tidak muncul. Sebabnya bukan kerusakan: tabel `hydrant_wargas` KOSONG sejak dibuat di TASK_30,
jadi tak ada yang bisa dijumlahkan. (Laporan kedua — "belum memilih banjar" — juga bukan bug:
akun admin yang dipakai hanya terkunci di PROVINSI, sehingga dropdown Banjar menunggu desa
diisi lebih dulu, persis rancangannya.)

Seeder baru berisi **12 tandon/groundtank di 12 desa, tersebar di keempat kecamatan Denpasar**.

**Tiga aturan yang dipatuhi, semuanya buah #78** (seeder fasilitas pernah mengarang kode desa):
1. **TITIK yang menentukan desa**, bukan sebaliknya. Koordinat = centroid desa dari
   `indonesia_villages.meta` + geseran TETAP (bukan acak, supaya jalan ulang tak memindahkan
   pin). Pin dan `village_code` karena itu mustahil berselisih.
2. **Banjar dirujuk lewat NAMA, bukan id.** Id `banjars` berbeda antar environment — dev diisi
   lewat impor, produksi belum. Id yang dipaku akan menempel ke banjar yang salah, bahkan ke
   desa lain. Nama yang tak ketemu menghasilkan `banjar_id` NULL + peringatan, bukan tebakan.
3. Rantai kode wilayah **diturunkan** dari kode desa (awalan BPS), tidak diketik ulang.

Sengaja beragam supaya layar yang membacanya benar-benar teruji: dua jenis sumber air, kedua
status modifikasi, kapasitas 2.000–25.000 liter, dan **satu baris berkapasitas NULL** agar kolom
`unknown_capacity` di rekap desa ikut terbukti (SANUR KAUH tampil "0 L · 1 tanpa angka").

IDEMPOTEN lewat `updateOrCreate` berkunci (name + village_code). Terdaftar di `DatabaseSeeder`
sesudah `PosPemadamSeeder`; master banjar TIDAK diseed dari sini — daftarnya harus diminta ke
BPS/Pemkot dan berbeda per kabupaten, jadi tetap lewat `sisupit:import-banjar`.

**Hasil di DB dev, diverifikasi lewat request HTTP sungguhan:** 12 baris, `counts.warga` 12,
Ringkasan Air Desa berisi 12 baris terurut kapasitas (SIDAKARYA 25.000 L teratas), banjar tampil
di baris daftar ("Banjar Dalem"), dan `/pumps` publik jadi 18 (6 pompa + 12 tandon) — pembuktian
bahwa penggabungan dua sumber SKKL masih utuh.

**Pemeriksaan integritas — nol pelanggaran di kelimanya:** tanpa banjar 0 · desa tak dikenal 0 ·
banjar milik desa lain 0 · rantai kode tak konsisten 0 · pin di luar Bali 0.

Test tetap **310 passed**, Pint bersih. PRODUKSI & STAGING tidak disentuh.

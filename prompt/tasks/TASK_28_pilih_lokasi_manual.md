# TASK 28 — Pilih lokasi manual (Provinsi → Desa) saat Pusat Komando input kejadian

| Field | Isi |
|-------|-----|
| ID | TASK_28 |
| Severity | P2 |
| Tipe | fitur kecil |
| Sumber | permintaan user (2026-08-13) |
| Status | DONE (kode) — sisa verifikasi manual |

---

## 1. Deskripsi masalah / tujuan

Petugas/admin sering menerima laporan lewat **telepon**, lalu mengetiknya sendiri di
`/reports/create`. Di form itu satu-satunya cara menentukan lokasi adalah **menggeser pin
peta**: operator harus mencari desa tujuan dengan mata di peta, dari titik GPS kantornya,
sering puluhan kilometer jauhnya. Wilayah administratif (provinsi..desa) hanya terisi
sebagai efek samping reverse-geocode titik itu.

Yang diminta: operator bisa **memilih wilayah** (Provinsi → Kabupaten/Kota → Kecamatan →
Desa) sehingga peta langsung melompat ke sana dan pin tinggal digeser sedikit. Karena
seluruh layanan berjalan di Bali, provinsi (dan kabupaten, untuk akun ber-yurisdiksi
kabupaten) harus sudah terisi otomatis.

Keputusan user 2026-08-13 (3 pertanyaan, semua ambil rekomendasi):
1. Pemilih wilayah **hanya untuk petugas/admin/superadmin** — alur warga tetap
   darurat-first (GPS + geser pin), tidak ditambahi langkah apa pun.
2. Provinsi/kabupaten **prefilled tapi tetap bisa diganti** (bukan dikunci seperti
   `Admin/Hydrants/Create`), supaya laporan telepon dari kabupaten sebelah tetap bisa
   diinput.
3. Deteksi GPS otomatis untuk staf **tetap jalan** (mengisi titik awal), tidak dimatikan.

## 2. Reproduce (kondisi awal)

1. Login sebagai petugas/admin, buka `/reports/create`.
2. Form memberi pin di lokasi GPS operator (kantor). Tidak ada satu pun dropdown wilayah.
3. Satu-satunya cara memindahkan titik ke desa kejadian = geser/zoom peta manual sampai
   ketemu. Kode wilayah hanya terisi bila reverse-geocode berhasil mencocokkan nama OSM
   ke tabel `indonesia_*` (`matchRegionName`, "omni-search"), yang bisa gagal sebagian
   (mis. provinsi..kecamatan cocok, desa tidak) → validasi server menolak dengan
   "Desa wajib diisi" tanpa field yang terlihat di layar.

## 3. Root cause

Bukan bug, melainkan **fitur yang belum ada**: `resources/js/Pages/Front/Reports/Create.jsx`
menetapkan wilayah HANYA lewat `resolveLocation()` (baris ~143-244), yaitu hasil
reverse-geocode dari pin. Empat kode wilayah dikirim sebagai `<input type="hidden">`
(baris ~507-510) dan sengaja disembunyikan dari pengguna — cocok untuk warga, tidak cocok
untuk operator Pusat Komando yang tahu persis nama desanya tapi tidak tahu titik petanya.

Bahan pendukung sudah lengkap di repo, tidak perlu skema/endpoint baru:
- `/api/regions/{cities,districts,villages}` (routes/web.php:122-134) mengembalikan baris
  penuh tabel laravolt, **termasuk kolom `meta`** berisi `{"lat":..,"long":..}`.
- Kolom `meta` terisi 100% di keempat tingkat (dicek di DB dev 2026-08-13: 38 provinsi /
  514 kab-kota / 7.285 kecamatan / 83.762 desa) → centroid desa selalu tersedia.
- Komponen `Components/ui/combobox.jsx` (dropdown + pencarian, item `{code,name}`) sudah
  dipakai untuk cascading wilayah di `Admin/Hydrants/Create.jsx`.

## 4. Rencana fix (perubahan terkecil yang benar)

- `app/Http/Controllers/ReportController.php` — `create()` mengirim prop baru
  `region_picker`: objek berisi keempat kode wilayah operator bila ia
  petugas/admin/superadmin, `null` untuk peran lain. Prop inilah gerbang fiturnya
  (server-side), bukan pengecekan peran di frontend.
- `resources/js/Pages/Front/Reports/Create.jsx` —
  - seksi "Wilayah Kejadian" berisi 4 `Combobox` (Provinsi/Kabupaten/Kecamatan/Desa),
    hanya dirender saat `region_picker` ada;
  - dua mode eksplisit: **Pilih manual** (default untuk staf) vs **Ikuti pin peta**
    (perilaku lama). Warga selalu mode pin, tanpa UI tambahan;
  - memilih wilayah memindahkan pin ke centroid tingkat terdalam yang dipilih
    (desa → kecamatan → kabupaten, dari `meta`) + zoom bertingkat (12/14/16);
  - di mode manual, menggeser pin **tidak** menimpa kode wilayah (hanya lat/lng, nama
    jalan, dan teks alamat) — pilihan operator adalah sumber kebenaran;
  - guard submit: mode manual wajib lengkap sampai desa (pesan jelas, bukan gagal di
    server dengan field tersembunyi);
  - balapan yang ditutup: deteksi GPS awal berjalan asinkron sejak halaman dibuka, jadi
    bila operator memilih wilayah lebih dulu, balasan GPS yang datang belakangan TIDAK
    boleh menarik pin kembali ke posisi operator (`regionTouchedRef`). Memilih wilayah
    juga melepas `locationLoading` agar tombol Kirim tidak terkunci menunggu GPS.
- `resources/js/Components/UserLeafletMap.jsx` — prop opsional `zoom` (default `null` =
  perilaku lama persis). Zoom hanya diterapkan saat nilainya BERUBAH, sehingga zoom
  manual operator tidak dipaksa kembali setiap pin digeser.

## 5. Blast radius

- `UserLeafletMap` dipakai 4 halaman (`Front/Reports/Create`, `Front/Pumps/Index`,
  `Front/FireStations/Index`, `Front/Hydrants/Index`). Prop `zoom` opsional & default
  `null` → tiga pemakai lain tidak berubah perilaku.
- `Front/Reports/Create.jsx` juga dipakai warga: bila `region_picker` null, seluruh state
  & UI baru tidak aktif dan jalur GPS lama berjalan apa adanya.
- `ReportRequest` (validasi provinsi..desa saat POST) & `ReportController::store` TIDAK
  diubah — kolom yang dikirim tetap sama.
- Risiko sisa: operator boleh memilih wilayah di luar yurisdiksinya (keputusan user #2),
  dan laporan yang jatuh di luar yurisdiksi tidak akan terlihat olehnya lagi karena
  global scope `Tenantable`. Notice "laporan akan diarahkan ke Damkar X" (TASK_17) yang
  sudah ada di form ikut memberi tanda ke mana laporan itu pergi.

## 6. Verifikasi

- [x] Baseline test sebelum: **212 passed, 815 assertions**
- [x] Regression test baru: `tests/Feature/Sisupit/ReportManualRegionPickerTest.php`
      (staf dapat `region_picker` + kode yurisdiksinya; warga dapat `null`;
      laporan yang diinput operator memakai wilayah pilihan manual, bukan wilayah operator)
- [x] Test sesudah: **215 passed, 850 assertions**
- [x] `npm run build` lulus (build tidak di-commit)
- [ ] **Verifikasi manual (SISA):**
  1. Login petugas/admin Denpasar → `/reports/create`. Seksi "Wilayah Kejadian" tampil,
     Provinsi = Bali & Kabupaten = Kota Denpasar sudah terisi, mode "Pilih manual" aktif.
  2. Pilih Kecamatan → peta melompat & zoom ke kecamatan; pilih Desa → melompat ke desa
     (zoom lebih dekat), teks lokasi berubah jadi "Desa X, Kec. Y".
  3. Geser pin sedikit → lat/lng berubah, keempat dropdown TIDAK berubah.
  4. Ganti Kabupaten ke Badung → Kecamatan/Desa ikut kosong, daftar kecamatan Badung muncul.
  5. Klik "Ikuti pin peta" → wilayah kembali diisi dari reverse-geocode pin (perilaku lama).
  6. Submit tanpa memilih desa → toast "Lengkapi wilayah kejadian sampai desa/kelurahan",
     form tidak terkirim. Setelah desa dipilih → laporan tersimpan dgn wilayah yang benar.
  7. Login warga → `/reports/create` tidak menampilkan seksi wilayah sama sekali (alur lama).

## 7. Rollback

Perubahan terisolasi di 3 file + 1 file test. Revert commit fitur ini mengembalikan form
ke perilaku lama; tidak ada migrasi/skema/route yang perlu dibatalkan.

---

## Acceptance criteria
- [x] Operator bisa menetapkan lokasi lewat pilihan wilayah, bukan hanya menggeser pin
- [x] Provinsi (dan kabupaten) terisi otomatis dari yurisdiksi akun, tetap bisa diganti
- [x] Alur pelaporan warga tidak berubah sama sekali
- [x] Tidak ada regresi (212 → 215 passed)
- [x] Diff minimal & mengikuti konvensi (Combobox + pola cascading Admin/Hydrants)
- [x] Dokumen terkait diupdate (ARCHITECTURE_MAP + CLAUDE.md STATUS)

---

## ADENDUM 2026-08-13 — Pencarian tempat ala `admin/hydrants/create`

**Permintaan user:** "untuk laporan manual sekarang memilih lokasinya masih manual isi
kabupaten, kecamatan dan desa, buat untuk pemilihan lokasinya seperti admin/hydrants/create".

Empat dropdown bertingkat ternyata masih lambat untuk operator yang sedang mengangkat
telepon: ia tahu **nama tempatnya** ("Jalan Gatot Subroto", "Pasar Badung"), bukan
rangkaian kecamatan→desa-nya. `Admin/Hydrants/Create` sudah lama punya jawabannya
(kotak cari + auto-fill yurisdiksi), jadi polanya disalin ke form lapor — bukan pola baru.

### Perubahan
- `resources/js/Pages/Front/Reports/Create.jsx`
  - Kotak **"Cari Lokasi Kejadian"** di atas keempat dropdown (hanya saat `region_picker`
    ada). Debounce 1 detik + `skipSearchRef` anti-loop, lewat `route('api.geocode.search')`
    (proxy `GeocodeController`, cache 24 jam + lock ~1 req/detik) — **sama persis** dengan
    `Admin/Hydrants/Create`, tidak ada panggilan langsung ke Nominatim.
  - `selectSearchResult()`: pin melompat ke titik hasil (zoom 17), mode dialihkan ke
    `'pin'` sehingga `resolveLocation()` **mengisi ulang provinsi..desa** lewat
    omni-search yang sudah ada. `regionTouchedRef` diset agar GPS awal yang masih berjalan
    tidak menarik pin kembali ke lokasi operator.
  - Dropdown TETAP ADA sebagai koreksi: memilih salah satunya mengembalikan mode `'manual'`
    (aturan TASK_28 tidak dicabut — pilihan operator tetap sumber kebenaran di mode itu).
  - Peta kini bisa **diklik** untuk menaruh titik (`clickToPlace`), melengkapi geser-pin.
  - Guard submit "lengkapi sampai desa" tidak lagi hanya untuk mode manual, tapi untuk
    SEMUA Pusat Komando: pencarian/pin kerap hanya cocok sampai kecamatan, sementara
    `ReportRequest` mewajibkan desa saat POST. Dropdown-nya terlihat, jadi operator
    dimintai kelengkapan di klien, bukan gagal di server dengan field tersembunyi.
  - `locState`/`locTitle`: untuk Pusat Komando "siap" = desa terisi (bukan sekadar
    provinsi), badge kuning berbunyi "Lengkapi wilayah kejadian". Jalur warga tak berubah.
- `resources/js/Components/UserLeafletMap.jsx` — prop baru `clickToPlace` (default
  **false**). Sengaja opt-in: form lapor warga tidak boleh memindahkan pin darurat karena
  sentuhan tak sengaja. Tiga pemakai lain (Edit, Pumps, FireStations) tidak berubah.

### Verifikasi
- Test: **224 passed (883 assertions)** sebelum & sesudah — perubahan murni frontend,
  kontrak prop (`region_picker`) & validasi server tidak disentuh, jadi
  `ReportManualRegionPickerTest` tetap berlaku apa adanya.
- `npm run build` lulus (klien + SSR).
- [ ] **SISA — verifikasi manual di browser:**
  1. Login petugas/admin → `/reports/create`. Ketik min. 3 huruf nama tempat → daftar
     hasil muncul (spinner saat mencari).
  2. Pilih satu hasil → peta melompat & zoom ke titik itu, Provinsi/Kabupaten/Kecamatan/
     Desa terisi sendiri, label mode pindah ke "Ikuti pin peta".
  3. Desa tidak ikut terisi (nama OSM tak cocok) → dropdown Desa dipakai manual, submit
     diblokir dengan toast sampai desa diisi.
  4. Klik peta di titik lain → pin pindah & wilayah ikut menyesuaikan.
  5. Pilih dropdown mana pun → kembali ke mode "Pilih manual", geser pin TIDAK menimpa
     pilihan itu (aturan inti TASK_28 masih berlaku).
  6. Login warga → tidak ada kotak cari, tidak ada dropdown, klik peta tidak memindahkan
     pin; alur GPS lama utuh.

### Adendum lanjutan — "geser pin tapi alamat tidak muncul"

**Gejala (dilaporkan user):** operator menggeser pin, tidak ada apa pun yang berubah di layar.

**Akar masalah (bukan sekadar kurang fitur):** `resolveLocation()` MENGHITUNG alamat lalu
MEMBUANGnya saat mode manual. Baris penyajiannya berbunyi
`locSubtitle = regionMode === 'manual' ? manualRegionLabel : friendlyAddress` — di mode
manual (default Pusat Komando) yang tampil hanya label wilayah, yang tidak berubah saat pin
digeser. Jadi hasil reverse-geocode masuk ke state yang tidak dirender oleh siapa pun.
Selain itu `display_name` (alamat lengkap sebenarnya) memang tidak pernah ditampilkan di
form ini, di mode mana pun.

**Perbaikan (`Front/Reports/Create.jsx`):**
- State baru `fullAddress` = `display_name` apa adanya, diisi di KEDUA mode setiap kali
  reverse-geocode berhasil.
- Panel read-only **"Alamat Lengkap (otomatis)"** di bawah peta (Pusat Komando) dengan TIGA
  keadaan yang selalu terlihat: `Mencari alamat titik ini...` / alamatnya / `Belum ada -
  klik peta atau geser pin ke titik kejadian.` Tidak ada lagi keadaan diam.
- `fullAddress` DIBERSIHKAN saat pin berpindah tanpa geocode (`applyUntrustedPoint`,
  `fallbackLocation`, dan lompatan centroid di `selectRegion`) supaya tidak menampilkan
  alamat basi milik titik sebelumnya. Centroid sengaja TIDAK di-reverse-geocode: alamat
  titik tengah desa bukan alamat kejadian, menampilkannya justru menyesatkan.
- Tombol **"Salin ke patokan"** (satu klik) mengisi field Patokan Lokasi. Auto-fill sengaja
  DIHINDARI: `address` adalah patokan yang diketik manusia ("samping warung cat biru"),
  beda makna dengan alamat administratif mesin — mengisinya otomatis akan menimpa ketikan
  operator dan mengubah arti data yang dibaca halaman Show.

**Aturan yang dipetik untuk form ini:** setiap kali sebuah nilai dihitung dari jaringan,
pastikan ada satu tempat yang MERENDER-nya, dan tiga keadaannya (menunggu / ada / tidak ada)
punya teks sendiri. Jalur warga tidak disentuh — badge GPS mereka sudah memberi umpan balik.

### Adendum lanjutan 2 — "cari `gema merdeka` nihil, cari `gema` muncul Radio Gema Merdeka"

**Reproduksi langsung ke instance Nominatim lokal (`127.0.0.1:8080`):**

```
q=gema            -> ada hasil (PT Percetakan Gema, dst.)
q=gema merdeka    -> 1 hasil, BENAR: "Radio Gema Merdeka, Jalan WR Supratman, ..."
q=radio gema merdeka -> 1 hasil, benar
q=gema m / gema mer / gema merd -> 0 hasil
```

Jadi **mesinnya tidak salah** — query lengkapnya justru cocok. Yang salah lapisan klien.

**Akar masalah (dua, dua-duanya nyata di kode yang saya tulis sebelumnya):**
1. **Balapan balasan.** `GeocodeController` sengaja men-serialisasi panggilan Nominatim
   (`Cache::lock` + jeda 1,1 detik) demi kebijakan ~1 req/detik. Akibatnya balasan bisa
   datang TIDAK berurutan. Mengetik pelan melahirkan query antara yang wajar kosong
   (`gema mer` = 0 hasil); bila balasan kosong itu mendarat SESUDAH balasan
   `gema merdeka`, ia menimpa hasil yang benar → daftar jadi kosong. Tidak ada penjaga
   urutan sama sekali di versi sebelumnya.
2. **Gagal & kosong sama-sama senyap.** `.catch(() => setSearchResults([]))` menelan galat,
   dan daftar kosong tidak merender apa pun — operator tak bisa membedakan "tidak ketemu",
   "masih mencari", dan "permintaan gagal".

**Perbaikan (`Front/Reports/Create.jsx`):**
- `searchSeqRef` — tiap permintaan dapat nomor urut; balasan yang bukan milik permintaan
  terakhir DIABAIKAN. Nomor juga dinaikkan saat sebuah hasil dipilih, supaya balasan yang
  masih di jalan tidak memunculkan lagi dropdown setelah operator memilih.
- `searchStatus` (`idle|loading|done|error`) + panel status: "Tidak ada hasil untuk X —
  coba nama yang lebih utuh (Nominatim mencocokkan kata penuh)" vs "Pencarian gagal.
  Tekan Enter untuk mencoba lagi". Tidak ada lagi keadaan diam.
- **Enter = cari sekarang** (melewati debounce). Sekalian menambal jebakan: kotak cari ada
  DI DALAM `<form>` laporan, jadi tanpa `preventDefault()` menekan Enter di situ berarti
  MENGIRIM laporan darurat.

**Catatan perilaku Nominatim yang perlu diketahui operator:** pencocokan berbasis kata utuh;
kata terakhir yang belum selesai diketik sering bernilai 0 hasil (`gema mer` → 0, padahal
`gema merdeka` → 1). Itu wajar, bukan kerusakan — teks kosong di UI sekarang menjelaskannya.

### Adendum lanjutan 3 — pencocokan awalan kata (agar terasa seperti Google Maps)

**Keberatan user (sah):** "kalau mengetik `gema mer` hasilnya 0, petugas akan bingung karena
di Google Maps data itu muncul." Betul — Google Maps mencocokkan AWALAN kata, Nominatim
mencocokkan KATA UTUH. Menjelaskan keterbatasan lewat teks UI bukan solusi; yang salah
perilakunya, bukan pemahaman operator.

**Perbaikan di `app/Http/Controllers/Api/GeocodeController.php`** (bukan di frontend, supaya
seluruh pemakai proxy ikut membaik & disiplin cache/rate-limit tetap di satu tempat):
- `search()` mencari apa adanya dulu. Bila NIHIL dan query punya lebih dari satu kata,
  `searchByPrefixOfLastWord()` mengulang pencarian **tanpa kata terakhir** (yang diasumsikan
  belum selesai diketik), mengambil `CANDIDATE_LIMIT`=10 kandidat, lalu menyaringnya:
  yang lolos hanya baris yang `display_name`-nya punya kata **berawalan** kata terakhir itu.
- Bila tak ada yang cocok dengan awalannya, kandidat dikembalikan apa adanya — hasil yang
  relevan sebagian lebih berguna bagi operator yang sedang mengangkat telepon daripada nol.
- Query satu kata TIDAK memicu panggilan kedua (tidak ada kata yang bisa dipotong).
- Biaya panggilan: query yang dipendekkan hampir selalu SUDAH ADA di cache karena dilewati
  saat mengetik, jadi umumnya nol panggilan tambahan ke Nominatim.
- `searchNominatim()` menyatukan cache+panggilan; kunci cache kini menyertakan `limit`.

**Bukti terhadap Nominatim lokal sungguhan (bukan mock):**

```
gema mer       -> 1 hasil | teratas: Radio Gema Merdeka
gema merd      -> 1 hasil | teratas: Radio Gema Merdeka
radio gema mer -> 1 hasil | teratas: Radio Gema Merdeka
gema merdeka   -> 1 hasil | teratas: Radio Gema Merdeka
```

**Test baru** di `tests/Feature/Sisupit/GeocodeControllerTest.php` (3): fallback awalan
menyaring dengan benar; kandidat tetap ditampilkan saat awalan tak cocok; query satu kata
tidak memicu panggilan kedua.

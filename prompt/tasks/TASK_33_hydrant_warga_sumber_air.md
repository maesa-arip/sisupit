# TASK 33 — Hydrant warga berhenti jadi kembaran hydrant resmi: Sumber Air, status modifikasi, kapasitas liter

| Field | Isi |
|-------|-----|
| ID | TASK_33 |
| Severity | P2 (kosakata data + UX) — dengan satu konsekuensi P1 yang dicegah, lihat §5 |
| Tipe | perubahan skema + UI atas permintaan user |
| Sumber | permintaan user 2026-08-21 (satu pesan, empat permintaan) |
| Status | **TERDEPLOY** 2026-08-21 @1acb0e20 (prod/staging/dev) — sisa verifikasi visual manual |

---

## 1. Deskripsi masalah / tujuan

Permintaan user, dikutip apa adanya:

> "pada hydrant warga, konstruksi ganti dengan Sumber Air pilihannya Tandon dan Grountank,
> untuk status pilihannya Terdaftar Belum dimodif dan terdaftar sudah dimodif, kondisi air
> hilangkan, debit air ganti menjadi kapasitas volume(liter saja)"

Empat perubahan, semuanya **hanya di hydrant warga** (`hydrant_wargas`); hydrant resmi
(`hydrants`) tidak disentuh sama sekali.

Yang mendasarinya: sejak TASK_30 hydrant warga mewarisi kosakata hydrant PDAM karena tabelnya
memang dibuat sebagai kembaran. Padahal yang didata petugas di lapangan bukan hydrant jalanan
bertekanan, melainkan **tandon/groundtank swadaya banjar**. Akibatnya tiga kolom bertanya hal
yang tidak punya jawaban di sana: konstruksi Stick/Jongkok (bentuk hydrant PDAM), kondisi
tekanan air (tandon berisi air diam — tak ada tekanan), dan status Berfungsi/Tidak Berfungsi
(tandon berisi air tidak "rusak"). Yang benar-benar ingin diketahui Damkar adalah: bentuk
sumber airnya apa, apakah mulutnya **sudah dimodifikasi** supaya bisa dihisap mobil pemadam,
dan **berapa liter** air yang tersimpan di sana.

## 2. Keputusan user yang diminta lebih dulu

Tiga hal disodorkan ke user sebelum kode disentuh, karena ketiganya tidak bisa disimpulkan
dari permintaan:

1. **Satuan rekap desa.** Kartu "Ringkasan Debit Air" per desa di `/admin/pumps` menjumlahkan
   `pompas.capacity_lpm` + `hydrant_wargas.debit_lpm`; TASK_30 sengaja menyamakan satuannya
   supaya bisa dijumlahkan. Liter (simpanan) **tidak bisa** dijumlahkan dengan liter/menit
   (aliran). → **Keputusan user: pecah jadi dua angka per desa.**
2. **Ejaan.** User menulis "Grountank". → **Keputusan user: simpan sebagai `Groundtank`.**
3. **Data lama.** Baris hydrant warga yang sudah terlanjur masuk (fitur ini baru berumur dua
   hari). → **Keputusan user: kosongkan & data ulang** — `type` jadi NULL supaya petugas
   memilih ulang, `status` turun ke "Belum Modifikasi", angka lama dibuang karena satuannya
   berubah arti.

## 3. Perubahan

### Data

`database/migrations/2026_08_21_100000_reshape_hydrant_warga_water_fields.php` (BARU):

| Kolom | Sebelum | Sesudah |
|-------|---------|---------|
| `type` | Stick / Jongkok, default `'Stick'` | Tandon / Groundtank, nullable tanpa default |
| `status` | Aktif / Perbaikan, default `'Aktif'` | Belum Modifikasi / Sudah Modifikasi, default `'Belum Modifikasi'` |
| `water_pressure` | Keras / Sedang / Kecil | **dibuang** |
| `debit_lpm` | liter per menit | **dibuang**, digantikan `capacity_liter` (liter) |

`capacity_liter` sengaja **kolom baru**, bukan `renameColumn`: satuannya berubah arti, jadi
memindahkan angkanya berarti mengubah 500 lpm jadi 500 liter diam-diam.

### Kosakata (satu sumber per lapis)

- `App\Models\HydrantWarga::WATER_SOURCES` & `::STATUSES` — daftar nilai sisi server;
  `HydrantWargaController::validateData()` memakai `Rule::in()` atas keduanya.
- `resources/js/lib/utils.js` → `FACILITY_STATUS_LABELS` bertambah dua entri:
  `'Belum Modifikasi' → 'Terdaftar Belum Dimodifikasi'`, `'Sudah Modifikasi' → 'Terdaftar Sudah
  Dimodifikasi'`. Kata "Terdaftar" hidup **hanya di label**; nilai simpanannya dua kata.
- `resources/js/Pages/Admin/Hydrants/variants.jsx` → tiap varian kini membawa `typeLabel`,
  `typeOptions`, `typeDefault`, `statusOptions`, `statusDefault`, `showWaterPressure`,
  `waterField`/`waterLabel`/`waterUnit`/`waterRequired`/`waterPlaceholder`. Prop lama
  `debitRequired` diganti `waterRequired`. Form Create/Edit **tetap satu berkas untuk dua
  route** — yang berubah hanya sumber isinya, sesuai mitigasi PENGECUALIAN #1.

### Helper baru di `lib/utils.js`

- `capacityLabel(liter)` — "5.000 liter". **Sengaja terpisah** dari `debitLabel` walau bentuknya
  mirip: satu helper bersama mengundang kedua angka dijumlahkan lagi.
- `facilityStatusIsFaulty(status)` — hanya `'Perbaikan'` yang merah. Menggantikan pemeriksaan
  `status === 'Aktif'` yang tersebar di kartu & marker; lihat §5.

### Perbaikan ikutan: Select Sumber Air & Status jadi terkendali

Kedua `Select` itu memakai `defaultValue`, jadi tombol **Reset** di form mengosongkan `data`
tapi meninggalkan pilihan lama tetap terlihat. Cacat lama yang tak terasa (`reset()` memulihkan
`'Stick'`, yang biasanya memang yang tampil), tapi hydrant warga tak punya nilai awal — sesudah
Reset, Select berbunyi "Tandon" sementara form akan terkirim tanpa Sumber Air sama sekali.
Keduanya kini `value={...}` seperti Select Kondisi Air di sebelahnya.

### Rekap air per desa

`Admin\PompaController::debitSummary()` → **`waterSummary()`**, mengirim dua pasang angka per
desa: `debit_lpm`/`debit_points`/`unknown_debit` (pompa) dan
`capacity_liter`/`capacity_points`/`unknown_capacity` (hydrant warga). Pemisahnya kunci baru
`water_metric` (`'debit'` | `'capacity'`) dari `toSkklRow()` — **bukan** `source`, karena yang
menentukan sebuah angka boleh dijumlahkan adalah satuannya, dan menuliskan nama tabel di
logika perhitungan akan pecah begitu ada sumber SKKL ketiga.

Kartunya jadi "Ringkasan Air Desa" dengan dua baris berlabel per desa ("Debit pompa" /
"Kapasitas warga"); baris tetap ditampilkan walau nihil, berisi "—", supaya "belum ada"
terbaca sebagai jawaban dan bukan sebagai angka yang lupa dihitung.

### Chip filter status

`/admin/hydrants` (tab warga) memakai `v.statusOptions`. Daftar SKKL — `/admin/pumps` dan
`/pumps` publik — memakai **gabungan empat status** (`STATUS_FILTERS`), lihat §5.

## 4. Berkas yang disentuh

```
database/migrations/2026_08_21_100000_reshape_hydrant_warga_water_fields.php  BARU
app/Models/HydrantWarga.php                       konstanta + casts + toSkklRow
app/Models/Pompa.php                              toSkklRow: capacity_liter=null, water_metric='debit'
app/Http/Controllers/Admin/HydrantWargaController.php   validasi + pesan galat
app/Http/Controllers/Admin/PompaController.php    debitSummary() → waterSummary()
app/Http/Controllers/Front/MonitoringMapController.php  fallback status hydrant warga
resources/js/lib/utils.js                         2 label + capacityLabel + facilityStatusIsFaulty
resources/js/Pages/Admin/Hydrants/variants.jsx    konfigurasi kolom per varian
resources/js/Pages/Admin/Hydrants/Create.jsx      form digerakkan variants
resources/js/Pages/Admin/Hydrants/Edit.jsx        idem
resources/js/Pages/Admin/Hydrants/Index.jsx       chip per varian + badge kapasitas + warna
resources/js/Pages/Admin/Pumps/Index.jsx          STATUS_FILTERS + kartu rekap dua angka + warna
resources/js/Pages/Pumps/Index.jsx                STATUS_FILTERS + badge kapasitas + warna
resources/js/Components/UserLeafletMap.jsx        warna marker + label status di popup
tests/Feature/Sisupit/HydrantWargaSkklTest.php    payload & asersi kosakata baru + 1 test baru
tests/Feature/Sisupit/FacilityJurisdictionTest.php  payload per-modul (facilityPayload())
```

## 5. Blast radius — dua hal yang nyaris jebol tanpa gejala

**(a) Warna merah palsu.** Enam tempat menghitung warna fasilitas sebagai
`status === 'Aktif' ? biru : merah`. Dengan status keempat & kelima, bentuk itu menggambar
**seluruh hydrant warga merah** — di kartu daftar, marker peta admin, marker `UserLeafletMap`,
dan badge halaman publik — hanya karena statusnya bukan `'Aktif'`, padahal tak ada yang rusak.
Diperbaiki dengan `facilityStatusIsFaulty()`: yang merah hanya `'Perbaikan'`.
`Monitoring/Map.jsx` sudah memakai bentuk `=== 'Perbaikan'` sejak awal, jadi aman.

**(b) Filter yang membuang separuh daftar.** Filter status di `/admin/pumps` & `/pumps`
berjalan di level query (`where('status', …)`) atas **dua tabel sekaligus**. Kalau chipnya
tetap hanya Semua/Berfungsi/Tidak Berfungsi, memilih "Berfungsi" akan mengembalikan nol
hydrant warga — tanpa galat, tanpa pesan, daftar hanya menyusut. Karena itu chipnya kini
gabungan empat status dan wadahnya `flex-wrap`.

**Yang TIDAK berubah:** tabel `hydrants` dan ketiga modul fasilitas lain; `Hydrant::WATER_PRESSURES`
(masih dipakai hydrant resmi); `Tenantable`; `ResolvesFacilityJurisdiction`; halaman publik
`/hydrants` (hydrant warga memang tak pernah muncul di sana).

## 6. Verifikasi

- `php artisan test`: **250 → 251 passed** (972 → 984 assertions). Test bertambah satu
  (`it refuses the official-hydrant vocabulary on a citizen hydrant` — penjaga arah sebaliknya:
  kalau controller warga suatu saat disalin ulang dari hydrant resmi, nilai lama akan lolos
  dan datanya rusak tanpa gejala).
- `npm run build` lulus (client + SSR). Pint & Prettier bersih.

### SISA: verifikasi manual di browser

1. `/admin/hydrant-warga/create` — kolomnya berbunyi **Sumber Air** (Tandon, Groundtank,
   kosong saat dibuka), **Status** (Terdaftar Belum/Sudah Dimodifikasi), **tidak ada** Kondisi
   Air, dan **Kapasitas Volume (liter)** bertanda `*` selebar kolom.
2. `/admin/hydrants/create` — tidak berubah sama sekali: Konstruksi, Berfungsi/Tidak Berfungsi,
   Kondisi Air, Debit Air (liter/menit) tanpa tanda wajib.
3. Simpan tanpa Sumber Air / tanpa Kapasitas → galat muncul di kolomnya, bukan toast umum.
4. `/admin/hydrant-warga` — chip filter berbunyi Semua / Terdaftar Belum Dimodifikasi /
   Terdaftar Sudah Dimodifikasi, dan menyaring dengan benar. Ikon kartu **biru**, bukan merah.
5. `/admin/pumps` — kartu "Ringkasan Air Desa" menampilkan dua baris per desa dengan satuan
   masing-masing; desa tanpa salah satu jenis menampilkan "—". Chip status berisi empat status
   dan membungkus rapi di layar sempit.
6. `/pumps` (publik, dan sebagai tamu) — badge hydrant warga menampilkan kapasitas dalam liter;
   popup marker peta berbunyi "Terdaftar Belum Dimodifikasi", bukan "Belum Modifikasi".
7. `/peta-pemantauan` layer SKKL — marker hydrant warga biru.
8. Edit satu baris hydrant warga **lama** (kalau ada di staging): Sumber Air kosong menunggu
   dipilih, status "Terdaftar Belum Dimodifikasi", Kapasitas kosong.

### Deploy — SELESAI 2026-08-21

Ketiga env @`1acb0e20`, urutan dev → staging → prod. **Sebelum menyentuh apa pun**, isi
`hydrant_wargas` dihitung dulu di ketiga env karena migrasinya MENGHAPUS kolom: **0 baris di
semua env** (`hydrants` 51 baris, tak disentuh), jadi tak ada data yang musnah. DB di-backup per
env ke `/root/db-backup/` (dev/staging 17 MB, prod 18 MB). Data prod utuh pasca-migrasi:
71 users / 145 reports / 51 hydrants / 6 pompas, sama persis pra-migrasi. 0 migrasi pending,
bundel baru tersaji (lama 404) di ketiga host, 0 ERROR baru, 0 berkas root-owned.

## 7. Rollback

`php artisan migrate:rollback --step=1` mengembalikan `water_pressure` & `debit_lpm` (kosong)
dan memulihkan default lama; nilai `type`/`status` lama **tidak** kembali karena memang sudah
dibuang di `up()` sesuai keputusan user. Sisi kode: `git revert` commit ini.

## Acceptance criteria

- [x] Konstruksi → Sumber Air (Tandon/Groundtank) di hydrant warga saja
- [x] Status hydrant warga → Terdaftar Belum/Sudah Dimodifikasi
- [x] Kondisi Air hilang dari hydrant warga (kolom & form)
- [x] Debit Air → Kapasitas Volume (liter) dan rekap desa memisahkan satuannya
- [x] Hydrant resmi tidak berubah sedikit pun
- [x] Test hijau (251) + build lulus
- [ ] Verifikasi visual manual (§6)
- [x] `php artisan migrate` di staging & produksi (2026-08-21, data prod terbukti utuh)

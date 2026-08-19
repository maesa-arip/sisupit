# TASK 30 — Hydrant warga, SKKL, & perbaikan sistem
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_30 |
| Severity | P2 |
| Tipe | fitur kecil (6 permintaan sekaligus) + 1 bugfix notifikasi |
| Sumber | permintaan user 2026-08-18 |
| Status | DONE (kode) — sisa verifikasi manual di browser, lihat §6. **REVISI 2026-08-19**: hydrant warga dipindah ke tabel sendiri (§8) |

---

## 1. Deskripsi masalah / tujuan

Enam permintaan user, dikerjakan sebagai satu paket karena empat di antaranya menyentuh
modul fasilitas yang sama:

1. **Status hydrant** jadi "Berfungsi / Tidak Berfungsi", **tambah kondisi air** Tekanan
   Keras/Sedang/Kecil.
2. **Manajemen Pompa → Manajemen SKKL** (Sistem Ketahanan Kebakaran Lingkungan).
3. **Admin bisa input Hydrant Warga**, datanya masuk ke menu SKKL.
4. **Saat input manual muncul pop up** "pakai lokasi saat ini".
5. **Notif listrik padam masuk ke admin dll.**
6. **Ikon relawan & damkar di peta komando dispatcher diperbesar.**

Keputusan user saat klarifikasi (penting, jangan dibalik diam-diam):
- Status: **ubah LABEL saja**, nilai DB tetap `Aktif`/`Perbaikan`.
- Rename SKKL: **teks UI saja**, route `admin.pumps.*` / model `Pompa` / tabel `pompas` TETAP.
- Hydrant warga: awalnya **satu tabel berkolom `ownership`**; **direvisi 2026-08-19 jadi tabel
  terpisah** atas permintaan user — lihat §8 & `prompt/docs/PENGECUALIAN_ATURAN.md` #1. Wajib
  isi debit air karena dipakai mengecek "berapa debit air di desa tersebut".
- Satuan debit: **liter/menit (LPM)**, sama dengan `pompas.capacity_lpm` agar bisa dijumlahkan.
- Muncul di: menu SKKL (admin+publik) & Peta Pemantauan. **TIDAK** di halaman publik
  `/hydrants` (khusus hydrant resmi). Sejak revisi §8 ia punya menunya sendiri (tab di
  `/admin/hydrants`), bukan lagi baris bertanda di daftar hydrant resmi.
- Rekap debit per desa: **dibuat sekarang**, versi ringkas.
- Popup lokasi: **ketiga form fasilitas admin** (Hydrant, SKKL, Pos Pemadam).
- Kosakata status: **diseragamkan** untuk semua fasilitas.
- Ikon diperbesar: **hanya peta detail insiden** (`Reports/Show.jsx`), bukan Peta Pemantauan.

## 2. Reproduce (kondisi awal)

- `hydrants` tak punya kolom kepemilikan, kondisi air, maupun debit
  (`2026_05_15_103805_create_hydrants_table.php`) — tak ada cara mendata hydrant warga.
- Menu admin masih "Manajemen Pompa" (`navItems.js:211`) padahal sisi publik SUDAH bernama
  SKKL sejak lama (`navItems.js:154`, `Pages/Pumps/Index.jsx`) — kosakata terbelah.
- Form fasilitas menembak GPS diam-diam lewat `UserLeafletMap autoLocate` — ternyata ketiga
  form admin justru merangkai Leaflet sendiri, jadi GPS-nya malah TIDAK pernah ditawarkan.
- **Bug nyata:** `ReportActionController::confirmAgency` (lama: baris 355-396) hanya meng-update
  pivot lalu `back()->with('success')`. Tak ada satu pun `Notification::send`. Artinya ketika
  PLN mengonfirmasi "listrik sudah dipadamkan" dari akun OPD-nya, Pusat Komando & petugas di
  lokasi TIDAK PERNAH diberi tahu — padahal merekalah yang menunggu kabar itu untuk boleh
  menyemprot air.
- Marker responder di peta dispatcher 28×28 px dengan emoji 12 px (`Show.jsx:573`).

## 3. Root cause

Bukan satu akar; empat permintaan pertama adalah fitur yang belum ada. Yang benar-benar bug:

- `app/Http/Controllers/ReportActionController.php` — `confirmAgency()` menutup alur tanpa
  memberi tahu siapa pun. Arah notifikasi hanya dibangun satu arah saat TASK_27
  (Damkar → OPD, `AgencyDispatchNotification`); arah baliknya tak pernah dibuat.

## 4. Perubahan

**Data**
- `database/migrations/2026_08_18_100000_add_water_details_to_hydrants_table.php` — kolom
  `water_pressure` & `debit_lpm` pada `hydrants`. Aman untuk data lama: keduanya NULL
  (= belum disurvei, bukan nol).
- `database/migrations/2026_08_19_100000_create_hydrant_wargas_table.php` — tabel hydrant
  warga (revisi §8).
- `app/Models/Hydrant.php` — konstanta `WATER_PRESSURES` + cast `debit_lpm`.
- `app/Models/HydrantWarga.php` (BARU) — kembaran `Hydrant` + `toSkklRow()`.
- `app/Models/Pompa.php` — `toSkklRow()` dengan bentuk yang SAMA PERSIS (`capacity_lpm`
  dipetakan ke `debit_lpm` karena satuannya memang sama).

**Backend**
- `Admin/HydrantController` — validasi dua kolom baru + ekstraksi `validateData()` mengikuti
  pola `PompaController` (dua blok validasi yang identik sebelumnya) + prop `variant`.
- `Admin/HydrantWargaController` (BARU) — CRUD hydrant warga; satu-satunya beda perilaku dari
  kembarannya: `debit_lpm` WAJIB.
- `Admin/PompaController` — daftar SKKL menggabungkan pompa + hydrant warga, paginator manual,
  dan `debitSummary()` (rekap per desa + `unknown_debit`). Pesan flash jadi "aset SKKL".
- `Front/PompaController` — halaman publik SKKL ikut gabungan; jarak "terdekat" dihitung di PHP.
- `Front/HydrantController` — tetap membaca `hydrants` saja; hydrant warga hidup di tabel lain
  sehingga tak mungkin bocor ke halaman publik hydrant.
- `Front/MonitoringMapController` — hydrant warga pindah dari layer hydrant ke layer SKKL
  (kalau tidak, satu titik tergambar dua kali).
- `app/Notifications/AgencyConfirmationNotification.php` (BARU) + `confirmAgency()` memanggil
  `notifyCommandCenterOfConfirmation()`.

**Frontend**
- `lib/utils.js` — `FACILITY_STATUS_LABELS`/`facilityStatusLabel`, `waterPressureLabel`,
  `debitLabel` sebagai satu sumber kosakata.
- `Components/UseCurrentLocationDialog.jsx` (BARU) — dipakai 3 form Tambah fasilitas.
- `Admin/Hydrants/{Create,Edit,Index}.jsx` — 2 field baru (kondisi air & debit) + prop
  `variant` sehingga ketiganya melayani DUA route sekaligus.
- `Admin/Hydrants/variants.jsx` (BARU) — satu-satunya tempat nama route & label kedua jenis
  hydrant hidup, plus komponen `HydrantTabs`.
- `Admin/Pumps/Index.jsx` — judul SKKL, daftar gabungan (`source` menentukan route edit/hapus),
  kartu Ringkasan Debit Air, tombol pintas "Hydrant Warga".
- `Admin/{Pumps,FireStations}/Create.jsx` — popup lokasi.
- Label status diseragamkan di: `Admin/{Hydrants,Pumps,FireStations}/*`, `Pages/{Hydrants,
  Pumps,FireStations}/Index.jsx`, `Monitoring/Map.jsx`.
- `navItems.js` — "Manajemen Pompa" → "Manajemen SKKL".
- `Front/Reports/Show.jsx` — marker responder 28→40 px, emoji `text-xs`→`text-lg`.

## 5. Blast radius

- **Nilai status di DB tidak berubah** → hukum warna peta ("Perbaikan = merah"), filter, seeder,
  dan `Pompa::scopeReady()` tidak tersentuh. Yang berubah hanya kata yang dibaca manusia.
- **Id baris tidak lagi unik di daftar SKKL** (pompa #3 & hydrant #3 bisa berdampingan) →
  semua state per-baris di `Admin/Pumps/Index.jsx` memakai kunci `source-id`. Halaman publik
  SKKL juga memakai `key={source-id}`.
- **Paginasi SKKL kini manual** (`LengthAwarePaginator`) karena dua sumber sudah disatukan
  sebagai koleksi. Query string ikut dibawa (`->query()`), jadi filter tak hilang saat pindah
  halaman.
- **Penggabungan dilakukan di PHP, BUKAN UNION SQL** — disengaja: query Eloquent biasa dijamin
  membawa global scope `Tenantable`, sub-query union gampang lolos darinya (pelajaran #32).
- **Notifikasi baru menambah penerima**, tidak mengubah yang lama. Lebar "Pusat Komando"
  memakai `Setting::KEY_NOTIFY_LEVEL_PETUGAS` yang sama dengan `approve()` — bukan angka baru.
- Jarak "SKKL terdekat" pindah dari SQL haversine ke PHP. Efek samping baik: versi SQL memakai
  `acos()/radians()` yang TIDAK ada di SQLite bawaan PHP, jadi fitur itu sebelumnya hanya jalan
  di MySQL produksi.

## 6. Verifikasi

- [x] Baseline sebelum: **227 passed, 891 assertions**
- [x] Test baru: `tests/Feature/Sisupit/HydrantWargaSkklTest.php` (8 test setelah revisi §8) +
      1 test notifikasi konfirmasi di `ReportAgencyTest.php`
- [x] Test sesudah: **236 passed, 924 assertions** — hijau, tidak ada yang turun
- [x] `npm run build` lulus (client + SSR)
- [ ] **Verifikasi manual di browser (SISA):**
  - [ ] `/admin/hydrants/create` → popup "Pakai Lokasi Saat Ini?" muncul; "Nanti Saja" menutup
        tanpa efek, "Pakai Lokasi Saya" memindahkan pin + mengisi yurisdiksi otomatis
  - [ ] Tab **Hydrant Resmi | Hydrant Warga** di `/admin/hydrants` berpindah halaman & route
        tapi terasa seperti berganti tab
  - [ ] Simpan hydrant warga tanpa debit → galat wajib isi muncul; hydrant resmi tanpa debit
        tetap boleh tersimpan
  - [ ] Hydrant warga tersimpan → tampil di `/admin/pumps` dengan badge "Warga", tombol edit
        membuka form hydrant warga, tombol hapus benar-benar menghapus hydrant warga
        (bukan pompa ber-id sama)
  - [ ] Kartu "Ringkasan Debit Air" menampilkan desa + total lpm yang benar
  - [ ] `/hydrants` (publik) tidak memuat hydrant warga; `/pumps` (publik) memuatnya
  - [ ] Peta Pemantauan: hydrant warga muncul SEKALI, di layer SKKL
  - [ ] Semua halaman fasilitas berbunyi "Berfungsi"/"Tidak Berfungsi", tak ada sisa "Aktif"
  - [ ] Popup lokasi juga muncul di `/admin/pumps/create` & `/admin/fire-stations/create`
  - [ ] Akun OPD (PLN) menekan konfirmasi → lonceng admin/petugas berbunyi & isi pesannya
        memuat kalimat `confirmation_label`
  - [ ] Peta detail insiden: marker 🚒/🏃 jelas lebih besar, tidak menutupi pin TKP
- [ ] `php artisan migrate` di staging/produksi (kolom baru) sebelum deploy frontend

## 7. Rollback

Satu commit fokus → `git revert`. Migrasi punya `down()` yang membuang ketiga kolom.
Karena nilai status DB tidak diubah, rollback tidak meninggalkan data setengah jadi.

---

## Acceptance criteria
- [x] Enam permintaan user terpenuhi sesuai keputusan klarifikasi
- [x] Tidak ada regresi (234 ≥ baseline 227)
- [x] Diff sesuai konvensi; tidak ada rename route/model/tabel
- [x] Dokumen terkait diupdate (ARCHITECTURE_MAP, FINDINGS_LOG, CLAUDE.md)


---

## 8. REVISI 2026-08-19 — hydrant warga dipindah ke tabel sendiri

**Permintaan user:** "untuk sekarang hydrant dan hydrant warga dipisahkan saja tabelnya,
kemudian untuk edit dan tambah buatkan 1 tombol baru di admin/hydrants ada tombol hydrant
warga, jika klik itu halaman akan berubah dan route berubah tapi user akan mengira itu satu
kesatuan."

**Yang berubah dari implementasi 2026-08-18:**
- Kolom `hydrants.ownership` **dibatalkan** (migrasi 2026_08_18 ditulis ulang jadi hanya
  `water_pressure` + `debit_lpm`; belum pernah di-commit/di-deploy, jadi tak ada data yang
  perlu dipindahkan).
- Tabel BARU `hydrant_wargas` + `HydrantWarga` + `Admin\HydrantWargaController` + resource
  route `admin.hydrant-warga.*`.
- `Hydrant::scopeResmi()/scopeWarga()` dihapus — pemisahannya kini di level tabel.
- Pembaca SKKL (`Admin\PompaController`, `Front\PompaController`,
  `Front\MonitoringMapController`) menunjuk `HydrantWarga`; `source` baris berubah dari
  `hydrant` menjadi `hydrant_warga`.
- UI "satu kesatuan": `Admin/Hydrants/{Index,Create,Edit}.jsx` menerima prop `variant`
  (`resmi`/`warga`) dan menampilkan tab **Hydrant Resmi | Hydrant Warga** di bawah judul.
  Klik tab = pindah route, tapi terbaca sebagai berganti tab.

**Aturan yang ditekuk & konsekuensinya** dicatat sebagai pengecualian resmi di
`prompt/docs/PENGECUALIAN_ATURAN.md` #1 (disetujui user setelah disodori harganya). Ringkas:
skema & controller kembar → **menambah kolom hydrant = dua migrasi**; memindahkan hydrant
resmi↔warga = hapus lalu buat ulang.

**Verifikasi revisi:** `HydrantWargaSkklTest` ditulis ulang jadi 8 kasus (termasuk
`it keeps the two hydrant lists apart`), suite penuh & `npm run build` hijau.

---

## 9. REVISI UI 2026-08-19 — pemisah dua jenis hydrant dibuat jauh lebih tegas

**Laporan user:** "tampilan tombol hydrant resmi dan hydrant warga kurang jelas, user pertama
lihat tidak langsung tau kalau itu 2 menu yang berbeda."

**Akar masalahnya** bukan penempatan, tapi BOBOT VISUAL: versi pertama `HydrantTabs` dirender
`text-xs` + `px-3 py-1.5` dan menempel di bawah judul — persis setara chip filter status yang
ada tepat di bawahnya. Dua kontrol dengan bobot sama padahal fungsinya beda jauh: yang satu
menyaring baris, yang satu mengganti seluruh dataset DAN route.

**Perbaikan:**
- Tab dibuat **selebar konten, dua kolom sama besar** (`grid grid-cols-2` di dalam kotak
  `bg-muted`) — meniru `/syarat-ketentuan`, satu-satunya pola "dua isi dalam satu halaman"
  yang sudah ada di repo, jadi bukan gaya baru.
- **Jumlah data ditampilkan di tiap sisi** ("51 titik" vs "0 titik"). Ini bagian yang paling
  menentukan: dua angka berbeda menyatakan "ini dua kumpulan data" bahkan sebelum labelnya
  dibaca. Controller kedua sisi mengirim `counts` (ter-scope Tenantable).
- **Kalimat penjelas** di bawah tab untuk sisi yang sedang dibuka ("Hydrant swadaya banjar/desa.
  Dibaca di menu SKKL ... bukan di halaman Lokasi Hydrant").
- Halaman **Create** memakai tab yang menunjuk ke form sejenis (`target="create"`), bukan ke
  daftar — supaya "salah jenis" bisa dikoreksi tanpa memutar lewat index.
- Halaman **Edit** TIDAK lagi memakai tab, diganti `HydrantVariantBadge` statis: di sana
  pengguna sedang menyunting satu baris tertentu, jadi "pindah jenis" tak punya arti dan satu
  klik tak sengaja akan membuang perubahan yang belum disimpan.

Sidebar sengaja TIDAK ditambah entri kedua (keputusan user) — pemisahan cukup terlihat setelah
halaman dibuka.

**Verifikasi:** `it keeps the two hydrant lists apart` diperluas untuk menjaga `counts` benar
di kedua sisi (8 test, 30 assertion).

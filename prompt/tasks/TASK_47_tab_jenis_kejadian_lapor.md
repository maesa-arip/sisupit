# TASK 47 — Dua tab jenis kejadian di form Lapor Darurat (Kebakaran / Non Kebakaran)

| Field | Isi |
|-------|-----|
| ID | TASK_47 |
| Severity | P3 |
| Tipe | fitur kecil |
| Sumber | permintaan user 2026-08-27 |
| Status | DONE (kode) — sisa verifikasi visual §6 + langkah pasca-deploy §7 |

---

## 1. Deskripsi / tujuan

Permintaan user, satu pesan:

> "di report create, buat jadi 2 tab, kebakaran dan non kebakaran, auto tab kebakaran
> dibawahnya pilihan seperti sekarang dan free text lainnya, tab bukan kebakaran langsung
> free text, tab isi icon, kebakaran iconnya mobil damkar, non kebakaran icon mobil rescue"

Yang diminta: pemilih jenis kejadian di `/reports/create` dipecah jadi dua tab berikon —
**Kebakaran** (aktif otomatis, berisi tombol pilihan seperti sekarang + isian teks bebas
"Lainnya") dan **Non Kebakaran** (langsung isian teks bebas).

## 2. Keadaan sebelumnya

Satu baris berisi LIMA tombol setara: Rumah, Toko, Kendaraan, Lahan, dan "Bukan Kebakaran".
Tombol kelima itu `incident_type = 'lainnya'` dan membuka isian judul bebas. Jadi kebakaran
dan non-kebakaran dipilih dari deretan yang sama, dan **kebakaran yang jenisnya tak terdaftar
(gudang, tumpukan sampah, tiang listrik) tak punya tempat** — warga terpaksa memilih jenis
yang salah atau memakai "Bukan Kebakaran" yang artinya berbeda bagi server.

## 3. Keputusan yang menentukan bentuk pekerjaannya

Tombol "Lainnya" DI DALAM tab kebakaran butuh nilai `incident_type` **baru**
(`kebakaran_lainnya`), tidak bisa memakai `lainnya` yang sudah ada. Sebab nilai `lainnya`
mengikat TIGA perilaku sekaligus:

1. `ReportRequest` mewajibkan foto + deskripsi + patokan untuknya (darurat non-kebakaran
   butuh konteks lebih);
2. `ReportsExport` mencetak labelnya "Bukan Kebakaran" di rekap Excel untuk pimpinan;
3. `Agency::recommendedIdsFor()` sengaja tidak merekomendasikan OPD untuknya.

Memakai ulang `lainnya` berarti kebakaran gudang tercetak "Bukan Kebakaran" di rekap resmi
dan warganya diwajibkan memotret api. Ditanyakan ke user lebih dulu; **disetujui memakai
`kebakaran_lainnya`** (2026-08-27).

## 4. Perubahan

**Server (jenis baru + labelnya)**

- `app/Models/Report.php` — `INCIDENT_TYPES` bertambah `kebakaran_lainnya`, dan konstanta BARU
  `FIRE_INCIDENT_TYPES` (semua jenis kebakaran, tanpa `lainnya`). Konstanta kedua ini ada
  supaya "jenis kebakaran mana saja" ditulis SATU tempat — sebelumnya daftar itu disalin
  tangan di `AgencySeeder`.
- `app/Http/Requests/ReportRequest.php` — **aturan validasinya TIDAK diubah**, hanya
  komentarnya. Pembanding sengaja tetap satu nilai (`=== 'lainnya'`), bukan "bukan salah satu
  jenis kebakaran": `incident_type` nullable, dan kosong tidak boleh mendadak berarti "wajib
  foto" bagi laporan lama/klien lama. `kebakaran_lainnya` otomatis jatuh ke aturan kebakaran.
- `app/Exports/ReportsExport.php` — label `kebakaran_lainnya` => "Kebakaran Lainnya".
- `database/seeders/AgencySeeder.php` — `$kebakaran` dibaca dari `Report::FIRE_INCIDENT_TYPES`,
  bukan array yang ditulis tangan.
- `resources/js/Pages/Admin/Agencies/incidentLabels.js` — label layar OPD.

**Form (dua tab)**

- `resources/js/Pages/Front/Reports/Create.jsx`:
  - `INCIDENT_TYPES` dipecah jadi `FIRE_INCIDENT_TYPES` (5 tombol, yang kelima
    `kebakaran_lainnya` berlabel "Lainnya") + `NON_FIRE_INCIDENT_TYPE` (`lainnya`).
  - `Tabs` dari `Components/ui/tabs.jsx` dengan `TabsList grid grid-cols-2` — bentuk & kelas
    trigger disalin dari `Pages/Info/Terms.jsx`, satu-satunya pemakai Tabs yang sudah ada,
    supaya tab di sini tidak jadi dialek kedua. Ikon `IconFiretruck` (kebakaran, ikon yang
    sudah dipakai modul Pos Pemadam) & `IconAmbulance` (non kebakaran).
  - Berpindah tab MENGGANTI jenis kejadian: tab non-kebakaran langsung memilihkan `lainnya`
    (tab itu hanya punya satu jenis), tab kebakaran mengosongkannya kembali supaya warga
    menekan tombol. Judul ikut dikosongkan agar judul dari tab sebelumnya tidak terkirim
    bersama jenis yang baru.
  - `isOther` (aturan ketat non-kebakaran) dipisah dari `needsFreeTitle` (isian judul bebas).
    Isian judulnya ditulis SEKALI di luar `TabsContent` supaya kedua tab tidak memelihara
    isian kembar; placeholder-nya yang berbeda per tab.

## 5. Blast radius

- **Aturan wajib/opsional tidak berubah untuk jenis mana pun yang sudah ada.**
  `kebakaran_lainnya` mengikuti kebakaran (foto/deskripsi/patokan opsional).
- **Tanpa migrasi** — `reports.incident_type` sudah `string` nullable, yang bertambah nilainya.
- Layar yang membaca jenis kejadian: rekap Excel (label baru ditambahkan), layar OPD
  (label baru ditambahkan), rekomendasi OPD (§7).
- `Front/Reports/Edit.jsx` tidak tersentuh — halaman edit memang tidak menyunting jenis
  kejadian (keputusan #30: edit konten + foto saja).

## 6. Verifikasi

- [x] Baseline sebelum: **340 passed (1284 assertions)**.
- [x] Penjaga baru `tests/Feature/Sisupit/ReportIncidentTypeTabTest.php` (4 test), KEEMPATNYA
      dibuktikan merah dulu dengan mengembalikan `INCIDENT_TYPES` ke bentuk lama.
- [x] Sesudah: **344 passed (1306 assertions)**.
- [x] `vendor/bin/pint` PASS, `npx prettier --check` PASS, `npm run build` lulus.
- [ ] **Verifikasi visual (belum dikerjakan — butuh browser):**
  1. `/reports/create` terbuka pada tab **Kebakaran**, keempat tombol lama tampil.
  2. Tekan **Lainnya** → muncul isian "Jelaskan jenis kejadian"; kirim tanpa foto & tanpa
     deskripsi → laporan **berhasil** dibuat.
  3. Pindah ke tab **Non Kebakaran** → tak ada tombol pilihan, isian teks langsung tampil,
     label Patokan & Detail berbunyi "(Wajib)", foto wajib.
  4. Pindah tab bolak-balik → judul yang sudah diketik ikut kosong, tidak tertinggal.
  5. Kirim dari tab Kebakaran tanpa menekan tombol apa pun → toast "Pilih dulu jenis
     kejadian di atas."
  6. Ikon tab tampil: mobil damkar (kebakaran) & ambulans/rescue (non kebakaran).

## 7. Langkah PASCA-DEPLOY yang tidak bisa dikerjakan dari kode

`agencies.default_incident_types` adalah **DATA di DB**, bukan kode. Baris OPD yang sudah ada
di prod/staging/dev tidak memuat `kebakaran_lainnya`, sehingga laporan berjenis itu
**tidak akan meng-auto-centang OPD mana pun** sampai tiap OPD dicentang ulang lewat
`/admin/agencies`. Seeder hanya menolong DB yang di-seed ulang.

Ini SENGAJA tidak ditambal dengan cabang kode yang mengenali nama jenis — aturan TASK_27:
perilaku OPD adalah data, bukan `if`. Yang benar: centang "Kebakaran Lainnya" di tiap OPD
kebakaran lewat layar admin, satu kali per environment.

## 8. Aman di-merge?

YA. Tanpa migrasi, tanpa route baru, tanpa perubahan permukaan otorisasi, dan tanpa mengubah
aturan validasi jenis kejadian yang sudah ada. Satu ekor manual di §7.

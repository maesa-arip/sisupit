# TASK 37 — Kode desa (bukan nama) di Ringkasan Air Desa /admin/pumps

| Field | Isi |
|-------|-----|
| ID | TASK_37 |
| Severity | P2 |
| Tipe | bugfix (tampilan + data) |
| Sumber | laporan user 2026-08-25 → FINDINGS_LOG #78 (temuan ikutan: #79) |
| Status | DONE (kode) — sisa: jalankan perintah perbaikan di staging & produksi |

---

## 1. Deskripsi masalah

User: *"cek pada manajemen skkl pada ringkasan air di desa, untuk hydrant warga sudah diganti
kapasitas volumenya dan masih ada kode bukan nama desa yang muncul di ringkasan"*.

Di kartu **Ringkasan Air Desa** (`/admin/pumps`) ada baris yang judulnya angka 10 digit
(mis. `5171012001 (1 titik)`) alih-alih nama desa. Bagian kapasitas volume hydrant warga
(TASK_33) sendiri sudah benar — yang dikeluhkan hanya judul barisnya.

## 2. Reproduce

DB dev, `/admin/pumps`: dari 6 aset pompa, 2 barisnya berjudul `5171012001` dan `5171012003`.
Query pembuktian: kedua kode itu tidak punya satu pun baris di `indonesia_villages`
(kecamatan 517101 hanya memiliki `5171011001`–`5171011006` dan `5171012007`–`5171012010`).

## 3. Root cause

Dua lapis — lapis kedua yang sebenarnya (uraian lengkap di FINDINGS_LOG #78):

1. `Admin\PompaController::waterSummary()` (dulu baris 114):
   `'village' => $code ? ($names[$code] ?? $code) : 'Tanpa data desa'`.
   Kode wilayah dipakai sebagai **judul cadangan**, jadi ia menyamar sebagai nama desa.
2. Kodenya memang tak pernah ada. Seeder fasilitas menuliskan kode desa hasil tebakan:
   `HydrantSeeder::getWilayahCodes()` menebak dari KATA di alamat (33 dari 51 hydrant berkode
   fiktif), `PompaSeeder` & `PosPemadamSeeder` menulis kode + komentar yang tidak cocok
   (mis. `5171012001 // Sanur Kaja`, padahal Sanur Kaja = `5171012009`). Baris yang kodenya
   kebetulan sah pun sebagian besar menunjuk desa yang salah (Pos "Kuta" → TUBAN, Pos
   "Mengwi" → MUNGGU, pompa ITDC Nusa Dua → PECATU).

## 4. Perubahan

- `app/Http/Controllers/Admin/PompaController.php` — `waterSummary()` tidak pernah lagi
  menampilkan kode; desa tak dikenal berjudul `Desa tidak dikenal · Kec. <nama>` lewat helper
  baru `villageLabel()`. Nama kecamatan diturunkan dari awalan kode desa (konstanta
  `DISTRICT_CODE_LENGTH = 6`, lihat #79).
- `app/Console/Commands/FixFacilityVillageCodes.php` (BARU) —
  `php artisan sisupit:fix-facility-village-codes`. Default **tinjau saja**; menulis hanya
  dengan `--apply`. Menentukan ulang desa dari TITIK fasilitas:
  1. reverse-geocode lewat `Api\GeocodeController` (jalur Nominatim satu-satunya di repo ini,
     jadi cache 24 jam & kunci ~1 req/detik ikut terpakai), nama desa dari peta dicocokkan ke
     `indonesia_villages` sekabupaten (perbandingan dinormalkan: "PADANG SAMBIAN KAJA" =
     "Padangsambian Kaja");
  2. cadangan: desa dengan centroid terdekat (`--offline`, atau saat peta tak menjawab).
  Kode desa yang SAH tidak pernah ditimpa — hanya dilaporkan — kecuali diminta
  `--include-mismatch`, dan centroid tidak pernah dipakai di jalur itu.
- `database/seeders/HydrantSeeder.php` — `getWilayahCodes()` (penebak kata kunci) DIHAPUS,
  diganti `hydrantRegions()`: kode kecamatan+desa per hydrant, pasangan tetap dari
  `hydrantCoordinates()`, ditentukan sekali lewat reverse-geocode lalu di-hardcode.
- `database/seeders/PompaSeeder.php`, `database/seeders/PosPemadamSeeder.php` — 6 + 7 entri
  kode kecamatan/desanya dibetulkan dengan cara yang sama.
- `tests/Feature/Sisupit/FacilityVillageCodeRepairTest.php` (BARU, 7 test).
- `prompt/docs/FINDINGS_LOG.md` — #78 (FIXED) & #79 (OPEN).

Keputusan yang perlu diketahui: untuk data contoh, **titik yang menentukan desa**, bukan teks
alamatnya. Karena itu "Pos Pemadam Sektor Juanda (Renon)" tersimpan di SUMERTA KELOD — titik
seeder-nya memang berada di sisi utara kawasan Renon. Pin-nya tidak digeser: yang dipakai peta,
yurisdiksi, dan rekap adalah titik itu, jadi kodenya harus mengikuti pin, bukan sebaliknya.

## 5. Blast radius

- `waterSummary()` hanya dipakai `/admin/pumps`. Bentuk datanya tidak berubah (kunci `village`
  tetap string) → `Admin/Pumps/Index.jsx` tidak disentuh, **tidak perlu `npm run build`**.
- Perintah baru menulis ke 4 tabel fasilitas lewat `DB::table` (lepas dari `Tenantable`, memang
  disengaja untuk perintah server). Kolom yang disentuh hanya `province/city/district/village_code`.
- Mengubah `village_code` mengubah siapa yang melihat baris itu bagi staf ber-kecamatan/desa —
  ke arah yang benar, tapi tetap perlu disadari saat menjalankan `--apply` di produksi.
- Seeder hanya berpengaruh pada `db:seed` (lingkungan baru/dev), bukan data yang sudah ada.

## 6. Verifikasi

- [x] Baseline sebelum: `php artisan test` → **263 passed (1012 assertions)**
- [x] Test baru: `FacilityVillageCodeRepairTest` (7)
- [x] Test sesudah: **270 passed** — lihat catatan hasil di bawah
- [x] Pint bersih untuk berkas yang disentuh
- [x] DB dev dibersihkan: `sisupit:fix-facility-village-codes --include-mismatch --apply`
      → 64 baris diperbarui; jalankan ulang tanpa opsi = "Tidak ada kode desa tak dikenal"
- [ ] **Verifikasi manual**: buka `/admin/pumps`, pastikan tiap baris Ringkasan Air Desa
      berjudul nama desa (dev sekarang: PEMECUTAN, SANUR KAJA, TEGAL KERTHA, SESETAN, BENOA,
      PETANG)
- [ ] **Staging & produksi**: jalankan `php artisan sisupit:fix-facility-village-codes` (tinjau
      dulu), lalu ulangi dengan `--apply`. Tambahkan `--include-mismatch` hanya bila daftar
      "kode terdaftar tapi titiknya menunjuk desa lain" memang ingin diserahkan ke peta.
      Prasyarat: Nominatim di server (`/opt/geo`, port 8088) hidup — kalau tidak, perintah
      jatuh ke centroid dan usulannya bertanda `centroid` (periksa dulu sebelum `--apply`).

## 7. Rollback

Satu commit fokus → `git revert`. Untuk data: perintah ini tidak menyimpan nilai lama, jadi
cadangkan dulu di produksi (`mysqldump` tabel `hydrants`, `hydrant_wargas`, `pompas`,
`pos_pemadams`) sebelum `--apply`.

---

## Acceptance criteria
- [x] Ringkasan Air Desa tidak pernah lagi menampilkan kode wilayah
- [x] Kode desa rusak bisa diperbaiki tanpa menyunting satu per satu, dengan tinjauan lebih dulu
- [x] Seeder tidak lagi melahirkan kode desa karangan
- [x] Tidak ada regresi (test ≥ baseline 263)
- [x] Temuan di luar scope dicatat (#79), tidak dikerjakan diam-diam

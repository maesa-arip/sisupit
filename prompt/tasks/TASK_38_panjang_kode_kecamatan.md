# TASK 38 — Panjang kode kecamatan: 7 digit yang tidak dimiliki kecamatan mana pun

| Field | Isi |
|-------|-----|
| ID | TASK_38 |
| Severity | P2 |
| Tipe | bugfix |
| Sumber | FINDINGS_LOG #79 (ditemukan saat TASK_37), diminta user 2026-08-25 |
| Status | DONE — terdeploy @76cfccd8; pemeriksaan produksi bersih (0 baris) |

---

## 1. Deskripsi masalah

`App\Traits\ResolvesFacilityJurisdiction::CODE_LENGTHS` menyatakan kode kecamatan sepanjang
**7** karakter. Isi tabel wilayah tidak begitu: seluruh **7.285** baris `indonesia_districts`
berkode **6** digit (`517101` = DENPASAR SELATAN), desa 10 digit (`5171012008`).

Akibatnya `parentCode($village, 'district')` — satu-satunya jalan mengisi `district_code` bila
form hanya mengirim desa — menghasilkan `5171012`, kode yang tidak dimiliki kecamatan mana pun.

## 2. Reproduce

```
indonesia_districts : SEMUA 7.285 baris length(code) = 6
indonesia_villages  : SEMUA 83.762 baris length(code) = 10
desa yang 6 digit awalnya != district_code : 0
```

Test yang membuktikannya (baru, gagal sebelum fix — sudah diverifikasi dengan mengembalikan
konstanta ke 7 lalu menjalankan filternya):
`FacilityJurisdictionTest` → *"it derives a district code that a real kecamatan actually has"*.

## 3. Root cause

Dua hal terpisah yang saling menutupi:

1. `CODE_LENGTHS['district'] = 7` di trait, berikut komentar yang mencontohkan rantai
   `51 → 5171 → 5171012 → 5171012006`. Angka itu tampaknya diambil dari **lebar kolom**
   `char('district_code', 7)` (migrasi `add_hierarchical_tenant_columns_to_sisupit_tables`,
   dan kolom `char('code', 7)` milik paket laravolt) — bukan dari isi datanya. Lebar kolom
   yang longgar tidak berarti kodenya sepanjang itu.
2. `tests/Feature/Sisupit/FacilityJurisdictionTest.php` mematok asumsi yang sama
   (`toBe('5171012')`, admin ber-`district_code` `'5171012'`, kecamatan asing `'5103010'`).
   Test-test itu hanya mengadu **kode dengan kode**, tidak pernah dengan tabel wilayah, jadi
   semuanya hijau selama semua pihak salah bersama-sama.

Pemeriksaan `str_starts_with()` di trait tetap benar apa pun angkanya (`5171012008` memang
diawali `517101`), jadi tidak ada yang menolak/menyalahkan apa pun — bug ini hanya bisa
terlihat saat kode turunannya dicocokkan ke `indonesia_districts`.

## 4. Perubahan

- `app/Traits/ResolvesFacilityJurisdiction.php`
  - `CODE_LENGTHS['district']` 7 → **6**; docblock diperbaiki (contoh rantai jadi
    `51 → 5171 → 517101 → 5171012008`) + catatan bahwa panjang diambil dari ISI tabel wilayah,
    bukan lebar kolom;
  - helper baru `districtCodeFromVillage()` supaya panjang kode wilayah cuma ditulis satu tempat.
- `app/Http/Controllers/Admin/PompaController.php` — konstanta sementara
  `DISTRICT_CODE_LENGTH = 6` (dibuat di TASK_37 karena trait belum bisa dipercaya) DIHAPUS,
  diganti pemanggilan `districtCodeFromVillage()`.
- `tests/Feature/Sisupit/FacilityJurisdictionTest.php` — semua kode kecamatan jadi 6 digit
  (`5171012` → `517101`, `5103010` → `510301`) + **test baru** yang mengadu kode turunan dengan
  tabel `indonesia_districts`. Ini penjaga sebenarnya: tanpa dia, angka panjang yang salah
  tetap bisa hijau.

## 5. Blast radius

- Trait dipakai empat controller fasilitas (hydrant, hydrant warga, SKKL/pompa, pos pemadam)
  + `Admin\PompaController::villageLabel()`. Yang berubah HANYA nilai `district_code` yang
  DITURUNKAN saat form tidak mengirim kecamatan; nilai yang dikirim form/dikunci akun tidak
  disentuh, dan aturan "yurisdiksi admin menang" tidak berubah.
- Tidak ada perubahan skema. Kolom `char(7)` dibiarkan: 7 ≥ 6, jadi ia sekadar lebih longgar —
  menyempitkannya berarti migrasi ALTER di banyak tabel tanpa manfaat.
- Tidak ada perubahan frontend → `npm run build` tidak perlu.
- Data: di DB dev **tidak ada satu pun** baris `district_code` berpanjang ≠ 6 di delapan tabel
  yang punya kolom itu (hydrants, hydrant_wargas, pompas, pos_pemadams, reports, users,
  agencies, units) — jalur turunan ini memang jarang tersentuh karena keempat form fasilitas
  selalu mengirim `district_code` dari dropdown.

## 6. Verifikasi

- [x] Baseline sebelum: `php artisan test` → **270 passed (1027 assertions)** (hasil TASK_37)
- [x] Test baru gagal dengan konstanta lama, hijau dengan yang baru (dibuktikan bolak-balik)
- [x] Test sesudah: **271 passed** (270 + 1 penjaga baru)
- [x] Pint bersih
- [x] **Produksi (2026-08-25)** — pemeriksaan di bawah dijalankan: **0 di kedelapan tabel**,
      jadi tidak ada data yang perlu dibetulkan; fix ini murni mencegah. Query yang dipakai:

```sql
SELECT 'hydrants' t, COUNT(*) n FROM hydrants WHERE district_code IS NOT NULL AND LENGTH(district_code) <> 6
UNION ALL SELECT 'hydrant_wargas', COUNT(*) FROM hydrant_wargas WHERE district_code IS NOT NULL AND LENGTH(district_code) <> 6
UNION ALL SELECT 'pompas', COUNT(*) FROM pompas WHERE district_code IS NOT NULL AND LENGTH(district_code) <> 6
UNION ALL SELECT 'pos_pemadams', COUNT(*) FROM pos_pemadams WHERE district_code IS NOT NULL AND LENGTH(district_code) <> 6
UNION ALL SELECT 'reports', COUNT(*) FROM reports WHERE district_code IS NOT NULL AND LENGTH(district_code) <> 6
UNION ALL SELECT 'users', COUNT(*) FROM users WHERE district_code IS NOT NULL AND LENGTH(district_code) <> 6
UNION ALL SELECT 'agencies', COUNT(*) FROM agencies WHERE district_code IS NOT NULL AND LENGTH(district_code) <> 6
UNION ALL SELECT 'units', COUNT(*) FROM units WHERE district_code IS NOT NULL AND LENGTH(district_code) <> 6;
```

Kalau ada yang bukan 0: baris itu berkode 7 digit hasil turunan lama. Perbaikannya
`UPDATE <tabel> SET district_code = SUBSTRING(district_code, 1, 6) WHERE LENGTH(district_code) = 7`
— aman karena 6 digit pertamanya memang kode kecamatan yang benar (kode desa 10 digit dipotong
di posisi yang salah). Cadangkan tabelnya dulu.

## 7. Rollback

Satu commit fokus → `git revert`. Tidak ada perubahan data maupun skema yang perlu dibalik.

---

## Acceptance criteria
- [x] Kode kecamatan turunan selalu berupa kode yang benar-benar dimiliki sebuah kecamatan
- [x] Panjang kode wilayah hanya ditulis di satu tempat (`CODE_LENGTHS` + helper trait)
- [x] Ada test yang mengadu kode turunan dengan tabel wilayah, bukan dengan angka lain
- [x] Tidak ada regresi (test ≥ baseline 270)

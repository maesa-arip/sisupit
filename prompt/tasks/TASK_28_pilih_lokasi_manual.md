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

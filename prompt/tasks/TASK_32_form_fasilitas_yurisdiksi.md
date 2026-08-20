# TASK 32 — Form fasilitas: tombol jenis hydrant, chip peta yang menabrak popup, dan yurisdiksi pin

| Field | Isi |
|-------|-----|
| ID | TASK_32 |
| Severity | P1 (bagian #75 — integritas data) / P2 (sisanya — UX) |
| Tipe | bugfix + fitur kecil |
| Sumber | permintaan user 2026-08-20 → FINDINGS_LOG #73, #74, #75 |
| Status | DONE (kode) 2026-08-20 — sisa verifikasi visual manual |

---

## 1. Deskripsi masalah / tujuan

Satu pesan user, enam permintaan, semuanya di sekitar form pendataan fasilitas admin:

| # | Permintaan user | Jadi |
|---|-----------------|------|
| a | "tombol hydrant resmi ganti menjadi hydrant" | label tab |
| b | "tombolnya buat seperti pada admin/pumps … jangan rounded full" | bentuk tombol |
| c | "pop up gunakan lokasi saat ini bertabrakan dengan klik area peta, geser pin" | #73 |
| d | "saat pin geser area yuridiksi tidak terisi otomatis" | #74 bagian 1 |
| e | "dan tidak cek apakah sudah sesuai dengan yuridiksinya" | #74 bagian 2 + #75 |
| f | "perbaiki pada admin/hydrants, admin/pumps, admin/fire-stations" | cakupan |

Catatan cakupan: `Admin/Hydrants/*` melayani **dua** route (hydrant resmi & hydrant warga) lewat
prop `variant`, jadi tiga modul yang disebut user = empat modul di sisi server.

## 2. Reproduce

- **(c)** Buka `/admin/hydrants/create` di layar sempit → klik "Tambah Hydrant" → dialog
  "Pakai Lokasi Saat Ini?" muncul, tapi chip "1. Klik Area Peta" / "2. Geser Pin" tetap melayang
  **di atas** overlay dialog. Hal yang sama terjadi pada header sticky saat halaman digulir.
- **(d)** Geser pin di peta → tak ada perubahan terlihat selama 1–3 detik; badge tetap berbunyi
  "Auto-detected". Bila Nominatim gagal (502/rate-limit), wilayah **tidak pernah** terisi dan
  tidak ada pesan apa pun — hanya `console.error`, dan di halaman Edit bahkan itu pun tidak ada.
- **(e)** Sebagai admin kota Denpasar (`city_code=5171`, kecamatan/desa NULL): geser pin ke
  Badung → kolom kunci tetap menampilkan Denpasar (memang by design), tapi `village_code` yang
  terkirim ikut berpindah ke desa Badung. `POST /admin/pumps` dengan `village_code=5103010001`
  **berhasil** dan barisnya tetap terlihat oleh admin itu (Tenantable menyaring per kota).

## 3. Root cause

- **#73** — chip memakai `z-[400]`, angka dari skala z-index internal **Leaflet** (pane marker 600,
  popup 700). Tapi chip bukan anak peta; ia saudara `div` peta di wadah halaman biasa dan tidak ada
  leluhur yang membuat stacking context, jadi 400 diadu langsung dengan lapisan aplikasi: header
  sticky `z-40`, `AlertDialog` Radix `z-50`. Enam berkas: `Admin/{Hydrants,Pumps,FireStations}/{Create,Edit}.jsx`.
- **#74** — `updateLocationData()` **memang** mengisi Area Yurisdiksi, tapi lewat reverse-geocode
  ber-rate-limit ~1 req/detik + 1–3 fetch `/api/regions/*`, tanpa satu pun indikator; `catch` hanya
  `console.error`. Dan level yang dikunci akun sengaja tidak ikut berpindah saat pin digeser
  (benar, dipertahankan) — konsekuensinya form terlihat wajar walau pin sudah di kabupaten lain.
- **#75** — keempat controller menyalin `$validated['x_code'] = $user->x_code ?? $request->x_code`.
  Aturan itu hanya menjaga level yang **dikunci**; level terbuka diterima apa adanya tanpa diadu
  dengan induknya.

## 4. Perubahan

**Server**
- `app/Traits/ResolvesFacilityJurisdiction.php` **(baru)** — `resolveJurisdictionCodes()` /
  `withJurisdictionCodes()`. Konsistensi rantai diperiksa lewat **awalan kode BPS**
  (51 → 5171 → 5171012 → 5171012006), jadi **tanpa query `indonesia_*`** — tabel referensi itu
  kosong di test. Tidak cocok → `ValidationException` berbahasa Indonesia di kolom terkait.
  Level atas yang kosong diturunkan dari kode desa. Kolom user berisi `''` = sama dengan NULL
  (= tidak mengunci), selaras dengan makna NULL di `Tenantable`/#56.
- `Admin/{HydrantController,HydrantWargaController,PompaController,PosPemadamController}.php` —
  `use ResolvesFacilityJurisdiction`; store & update memanggilnya. `PompaController` &
  `PosPemadamController` mempertahankan nama `withTenantCodes()` sebagai pemanggil (diff kecil).

**Klien**
- `resources/js/lib/utils.js` — `normalizeRegionName()` + `jurisdictionMismatch()` (sumber tunggal;
  tanpa ini logikanya akan disalin ke enam berkas).
- `Admin/{Hydrants,Pumps,FireStations}/{Create,Edit}.jsx` (6 berkas) — `isDetecting` (badge
  "Mendeteksi wilayah…"), `jurisdictionWarning` (kotak merah + `toast.warning`), `toast.error`
  saat reverse-geocode gagal, `finally` yang selalu mematikan indikator, chip `z-[400]` → `z-10`.
- `Admin/Hydrants/variants.jsx` — tab "Hydrant Resmi" → **"Hydrant"**; dua pill `rounded-full`
  → `<Button size="sm">` yang sama persis dengan tombol di `/admin/pumps` (riwayat v1–v4 dicatat
  di komentar berkas agar bentuk yang sudah ditolak tidak dihidupkan lagi).

**Test**
- `tests/Feature/Sisupit/FacilityJurisdictionTest.php` **(baru, 11 test)**.

## 5. Blast radius

- Trait dipakai **keempat** controller fasilitas → semua penyimpanan aset lewat jalurnya. Aturan
  lama "yurisdiksi akun menang" dipertahankan dan **dikunci test** agar tidak hilang.
- `province_code` kini ikut tersimpan pada hydrant (form-nya tak pernah mengirimnya; sekarang
  diturunkan dari kode desa). Baris lama tidak di-backfill — sengaja, di luar scope.
- `jurisdictionMismatch()` murni klien & hanya memperingatkan; tidak ada perubahan alur simpan.
- Peta lain (Peta Pemantauan, form lapor warga) **tidak disentuh**.

## 6. Verifikasi

- [x] Baseline sebelum: `php artisan test` → **239 passed (943 assertions)**
- [x] Test baru: `tests/Feature/Sisupit/FacilityJurisdictionTest.php` — 11 passed
- [x] Sesudah: **250 passed (972 assertions)**
- [x] `npm run build` lulus (client + SSR)
- [x] `vendor/bin/pint` & Prettier bersih
- [ ] **Verifikasi manual di browser** (belum dilakukan — repo tanpa browser automation):
  1. `/admin/hydrants` → tombol berbunyi "Hydrant" & "Hydrant Warga", bentuknya sama dengan
     tombol di `/admin/pumps` (sudut `rounded-md`, bukan pil bundar), yang aktif berwarna teal.
  2. `/admin/hydrants/create` → dialog "Pakai Lokasi Saat Ini?" menutupi chip langkah peta
     sepenuhnya; gulir halaman → chip tidak lagi menembus header.
  3. Geser pin → badge berubah jadi "Mendeteksi wilayah…" lalu kembali "Auto-detected", dan
     kolom wilayah yang tidak dikunci ikut terisi.
  4. Geser pin ke luar kabupaten → toast peringatan + kotak merah; simpan tetap bisa (peringatan,
     bukan pemblokir) **tapi** bila `village_code` yang terkirim milik kabupaten lain, server
     menolak dengan pesan di kolom Desa/Kelurahan.
  5. Matikan jaringan sebentar lalu geser pin → toast "Gagal mendeteksi wilayah dari titik ini".
  6. Ulangi 2–5 pada `/admin/hydrant-warga`, `/admin/pumps`, `/admin/fire-stations`, termasuk
     halaman **Edit** masing-masing.

## 7. Rollback

Satu commit fokus → `git revert`. Trait baru & test baru berdiri sendiri (tak ada migrasi, tak ada
perubahan skema), jadi pembalikan tidak meninggalkan sisa di database.

---

## Acceptance criteria
- [x] Enam permintaan user terpenuhi
- [x] Tidak ada regresi (250 ≥ baseline 239)
- [x] Diff minimal & sesuai konvensi
- [x] `FINDINGS_LOG.md` (#73/#74/#75) + `ARCHITECTURE_MAP.md` diupdate
- [ ] Verifikasi visual manual (§6)

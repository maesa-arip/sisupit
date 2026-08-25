# TASK_36 — Keterangan dua jenis hidran di menu admin
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_36 |
| Severity | P3 |
| Tipe | fitur kecil (copy UI) |
| Sumber | permintaan user 2026-08-25 |
| Status | DONE (kode) — TERDEPLOY 2026-08-25 @410697e2 ke prod/staging/dev; sisa verifikasi visual §5 |

---

## 1. Permintaan

Ganti keterangan kedua jenis hidran di `/admin/hydrants` & `/admin/hydrant-warga`:

- **Hidran:** "Hidran yang dimiliki oleh pemerintah kota denpasar dibawah pengelolaan PDAM dan Damkar"
- **Hidran warga:** "potensi sumber air yang terdata di suatu wilayah yang bersumber dari perorangan/swasta"

## 2. Keputusan yang diambil sebelum menulis

**Nama kota TIDAK dipaku.** Aplikasi ini multi-tenant (Denpasar `5171` & Badung `5103` punya
subdomain masing-masing) dan `Admin/Hydrants/variants.jsx` adalah SATU berkas untuk semua
tenant — menulis "Kota Denpasar" apa adanya membuat admin Badung membaca kota tetangganya di
halamannya sendiri, keliru yang tak pernah melempar galat. Ditanyakan ke user, **user memilih
"ikut nama instansi tenant"**.

Tabel `tenants` tidak punya kolom nama wilayah; yang ada `nama_instansi` (sudah dibagikan
`HandleInertiaRequests` sebagai prop `tenant`) dan `city_code` (butuh query `indonesia_cities`).
Karena itu nama wilayah diambil dari EKOR nama instansi:

| tenant | `nama_instansi` | hasil |
|---|---|---|
| Denpasar | Dinas Pemadam Kebakaran dan Penyelamatan **Kota Denpasar** | Kota Denpasar |
| Badung | Dinas Pemadam Kebakaran dan Penyelamatan **Kabupaten Badung** | Kabupaten Badung |

Nama instansi bisa disunting admin lewat `/admin/tenants`, jadi kegagalan pencocokan **tidak
boleh** menghasilkan kalimat rusak — fallback-nya "daerah setempat", sehingga kalimatnya tetap
utuh: "…dimiliki oleh pemerintah daerah setempat di bawah pengelolaan PDAM dan Damkar."

Ejaan dirapikan ke bentuk baku: "denpasar" → "Denpasar", "dibawah" → "di bawah".

## 3. Perubahan

- `resources/js/Pages/Admin/Hydrants/variants.jsx`
  - helper baru `tenantWilayah(namaInstansi)` (diekspor, ada fallback).
  - `subtitle` kedua varian jadi **fungsi**, bukan string. Sengaja fungsi di KEDUA varian meski
    warga tak memakai argumennya: bentuk seragam membuat pemanggil tak perlu tahu varian mana
    yang dinamis, sehingga tak lahir `if (variant === 'warga')` — percabangan yang memang
    dihindari berkas ini (lihat PENGECUALIAN_ATURAN #1).
  - `blurb` (baris kecil di bawah tombol tab) dirampingkan jadi **"di mana datanya muncul"**
    saja, karena definisi jenisnya kini sudah dibawa `subtitle` — tanpa itu satu halaman
    memuat dua kalimat yang mengatakan hal sama.
- `resources/js/Pages/Admin/Hydrants/Index.jsx` — `usePage().props.tenant?.nama_instansi`
  → `tenantWilayah()` → `v.subtitle({ wilayah })`.

**Tidak disentuh:** subtitle halaman publik `/hydrants` ("Temukan titik hidran pemadam terdekat
dari lokasi Anda.") — itu kalimat pencarian untuk warga, bukan definisi kepemilikan, dan hidran
warga memang tidak muncul di sana.

## 4. Penjaga

`tests/Feature/Sisupit/TenantBrandingTest.php` — nama kota tidak boleh muncul lagi sebagai
teks mati di dalam `HYDRANT_VARIANTS`.

## 5. Verifikasi

- [x] `php artisan test` → **263 passed (1012 assertions)**
- [x] `npm run build` lulus, Prettier & Pint bersih
- [x] Deploy 2026-08-25 @`410697e2` ke prod/staging/dev. Dibuktikan di chunk yang disajikan
      produksi (`assets/variants-DKwqc7nK.js`): memuat "dimiliki oleh pemerintah" dan "Potensi
      sumber air yang terdata", dan **nol** kemunculan "Kota Denpasar" — bukti namanya memang
      dirangkai runtime dari tenant, bukan ikut ter-bake saat build. Ketiga domain 200.
- [ ] **Visual (SISA):** buka `/admin/hydrants` → keterangan berbunyi "Hidran yang dimiliki oleh
      pemerintah Kota Denpasar di bawah pengelolaan PDAM dan Damkar."; tab "Hydrant Warga" →
      "Potensi sumber air yang terdata di suatu wilayah, bersumber dari perorangan/swasta.".
      Bila ada akun Badung, pastikan yang terbaca "Kabupaten Badung".

# TASK 19 — Halaman legal, Pusat Bantuan, & Paket/Lisensi (production-ready + sewa/beli)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_19 |
| Severity | P2 (kelengkapan produksi & kepatuhan) + P3 (link mati #48) |
| Tipe | fitur (halaman publik) + dokumentasi legal |
| Sumber | permintaan user 2026-08-04 ("menu syarat & ketentuan, pusat bantuan, menu tambahan lain untuk aplikasi production ready dan untuk konsep sewa/beli") |
| Status | SELESAI (2026-08-04) — belum di-commit |
| Terkait | TASK_17 (tenant subdomain), TASK_18 (edition sewa/beli — kolom `edition` dibuat di sini) |

---

## 0. Keputusan user (2026-08-04, lewat pilihan eksplisit)

| Pertanyaan | Jawaban |
|-----------|---------|
| Cakupan halaman | 4 inti (S&K, Privasi, Pusat Bantuan, Tentang) **+ Paket & Lisensi** **+ persetujuan S&K saat daftar**. Halaman `/hapus-akun` TIDAK dipilih |
| Sumber konten | **Statis di kode** (pola `/guideline`), bukan CRUD DB |
| Data kontak legal | **Tambah 3 kolom** ke `tenants`: `email_kontak`, `alamat_instansi`, `penanggung_jawab_data` |

---

## 1. Masalah

1. **Tidak ada dokumen legal sama sekali.** Aplikasi menerima PII (nama, telepon, GPS presisi,
   foto, KTP korban) dan sudah punya APK, tetapi tak punya Syarat & Ketentuan maupun Kebijakan
   Privasi. Google OAuth dan Play Store mensyaratkan URL kebijakan privasi yang bisa dibuka publik.
2. **Menu "Pusat Bantuan" sudah ada tapi mati** — `Sidebar.jsx:64` mengarah ke `/` (landing),
   bukan halaman bantuan. Dicatat sebagai FINDINGS **#48**.
3. **Model bisnis sewa/beli tak punya wajah publik.** TASK_18 mendefinisikan dua paket, tapi tidak
   ada halaman yang menjelaskannya ke calon kabupaten, dan tak ada tempat di mana klausul lisensi
   ditulis sesuai paket tiap pelanggan.
4. **Pendaftaran tanpa persetujuan.** Tidak ada titik di mana pengguna menyetujui apa pun.

## 2. Perubahan

### Lapisan data (dipakai dokumen legal)
- `2026_08_04_100000_add_edition_and_legal_contact_to_tenants_table.php` — `edition`
  (string, default `sewa`, ter-index), `features` (json nullable), `email_kontak`,
  `alamat_instansi`, `penanggung_jawab_data`.
  > `edition`/`features` adalah kolom yang direncanakan **TASK_18 slice 1**. Dibuat di sini karena
  > halaman S&K tidak boleh menulis klausul lisensi secara hardcode. **Guard #45
  > (`EnsureTenantHostMatchesStaff`) tetap milik TASK_18 dan belum dikerjakan.**
- `2026_08_04_100100_add_terms_accepted_at_to_users_table.php` — bukti persetujuan (nullable,
  tanpa backfill akun lama).
- `app/Enums/TenantEdition.php` — `SEWA`/`BELI` + `label()`, `description()`, `options()`.
  Nama sengaja bukan `TenantLevel`/`TenantType` (lihat peringatan tabrakan nama di TASK_18).
- `app/Models/Tenant.php` — cast `features` → array; `edition()`, `isBeli()`, `hasFeature()`.
  Ketiganya membaca lewat `getAttributes()` karena mode strict Eloquent melempar error untuk
  atribut yang belum dimuat (model hasil `create()` belum memuat nilai default kolom dari DB).
- `app/Models/User.php` — `terms_accepted_at` di `$fillable` + cast datetime.
- `TenantRequest`, `Admin\TenantController` (kirim `editions`), `Admin/Tenants/Form.jsx`
  (select Paket Layanan + 3 field kontak), `TenantSeeder` (Denpasar sewa, Badung beli).

### Halaman & rute publik
- `app/Http/Controllers/InfoController.php` + 5 rute publik di `routes/web.php`:
  `/syarat-ketentuan`, `/kebijakan-privasi`, `/pusat-bantuan`, `/tentang`, `/paket-lisensi`.
- `resources/js/Pages/Info/{Terms,Privacy,Help,About,Pricing}.jsx` +
  `Info/Partials/InfoShell.jsx` (hero, Section, Bullets, Callout, DefinitionRow, layout adaptif).
- `config/legal.php` — identitas penyedia sistem, jam dukungan, versi & tanggal berlaku dokumen,
  retensi. Semua bisa di-override lewat `.env` (pola `config/pejabat.php`).

### Penempatan menu
- `PublicLayout.jsx` — kolom footer **Informasi** (4 tautan), grid 4→5 kolom.
- `Sidebar.jsx` — seksi **Bantuan & Legal**; link "Pusat Bantuan" yang tadinya `/` diperbaiki
  (#48 FIXED).
- `Auth/Register.jsx` — checkbox persetujuan + tautan; `Auth/Login.jsx` & `Register.jsx` diberi
  keterangan di bawah tombol Google (masuk dengan Google = mendaftar).
- `RegisteredUserController` — validasi `terms` `accepted` + isi `terms_accepted_at`;
  `SocialiteController` mengisi `terms_accepted_at` untuk user baru dari Google.

### Prinsip isi dokumen
- Pihak yang disebut datang dari **data**, bukan teks mati: instansi dari tenant hasil subdomain,
  klausul lisensi dari `edition`. Kabupaten baru (mis. Klungkung) cukup diisi lewat
  `/admin/tenants` — dokumen legalnya ikut benar tanpa sentuh kode.
- Bagian keselamatan ditegaskan di S&K dan Pusat Bantuan: SISUPIT **bukan pengganti** panggilan
  darurat; nomor yang ditampilkan selalu `telepon_darurat` tenant + 112.
- Kebijakan Privasi menjelaskan praktik yang benar-benar berjalan (scope wilayah di data-layer,
  KTP di disk privat, tracking hanya selama misi, Nominatim/OSRM self-host, tile pihak ketiga).

## 3. Verifikasi

- Baseline sebelum: `php artisan test` → **169 passed, 604 assertions** (2026-08-04).
- Test baru `tests/Feature/Sisupit/InfoPagesTest.php` (12 pass): 5 rute publik tanpa login,
  isi mengikuti tenant subdomain + edition, default `sewa` untuk tenant tanpa paket,
  `hasFeature()` aman saat null & saat tenant transien, 2 paket di halaman lisensi,
  registrasi tanpa centang ditolak, `terms_accepted_at` terisi.
- Dua test lama disesuaikan (kirim `terms`): `Auth/RegistrationTest.php`,
  `Sisupit/RoleAccessTest.php`.
- `vendor/bin/pint` bersih; `npx prettier --write` pada berkas yang disentuh; `npm run build` lulus.

## 4. Blast radius

- **Rute baru semuanya publik & read-only** — tidak menyentuh alur lapor, `Tenantable`, atau
  otorisasi mana pun.
- **Perubahan berperilaku satu-satunya:** pendaftaran email/kata sandi kini menolak permintaan
  tanpa `terms`. Klien lama yang mem-POST `/register` tanpa field itu akan gagal validasi.
- `Tenant` mendapat kolom baru dengan default `sewa` → tenant lama nol perubahan perilaku.
- Shared prop Inertia `tenant` **tidak diubah**; `edition` hanya dikirim ke halaman Info
  (informasi komersial tidak dibocorkan ke seluruh halaman).

## 5. Sisa & catatan terbuka

- **`/hapus-akun` belum ada** (tidak dipilih user) — FINDINGS **#49**. Wajib bila APK
  dipublikasikan ke Google Play.
- **`config/legal.php` masih memuat nilai default** `Maesa` / `support@sisupit.com` — verifikasi
  dan sesuaikan lewat `.env` sebelum produksi.
- **Kontak legal tenant masih kosong** di seeder Badung/Denpasar — diisi lewat `/admin/tenants`.
- **Video panduan** (`docs/video/*.mp4`) tidak tersaji dari `public/`, jadi Pusat Bantuan
  memakai panduan teks. Menyajikan video = keputusan tersendiri (ukuran berkas di git).
- **UI `features`** belum dibuat (kolomnya sudah ada) — menyusul saat TASK_18 slice 2/3.

---

## 6. Adendum 2026-08-07 — penggabungan draf legal PT Tawarin Dimana Aja

**Sumber:** dua berkas yang ditambahkan user ke `docs/`:
`Draft term of service.docx` (ToS pengguna umum) dan
`term of service kontrak license.docx` (ToS Pengguna Berkontrak / B2B).

### Keputusan user (dikonfirmasi sebelum mengedit)
1. **Penyedia sistem = PT Tawarin Dimana Aja** (bukan `Maesa`). Berkas PKS **tidak** diubah
   pada sesi ini → ketidaksesuaian dicatat sebagai FINDINGS **#51**.
2. **Satu halaman `/syarat-ketentuan`, dipisah dengan tab** — bukan halaman terpisah:
   tab *Pengguna Umum* dan tab *Pengguna Berkontrak*.
3. **Klausul keras dimasukkan apa adanya** sesuai draf: biaya hangus (non-refundable),
   pengesampingan Pasal 1266 KUHPerdata, dan batas ganti rugi = biaya langganan bulan berjalan.
4. **Larangan resell/white-label berlaku penuh untuk semua paket** — tidak ada pengecualian
   untuk `edition = beli`; hak perpetual + salinan kode sumber ditegaskan sebagai hak pakai
   internal instansi saja.

### Perubahan
- `config/legal.php` — `penyedia.nama` → `PT Tawarin Dimana Aja`; kunci baru
  `penyedia.email_legal`, `penyedia.alamat`, `penyedia.telepon`; versi dokumen S&K
  dinaikkan **1.0 → 2.0** (berlaku 2026-08-07) karena isinya berubah material.
- `.env.example` — blok `LEGAL_*` didokumentasikan; `LEGAL_PENYEDIA_ALAMAT` ditandai wajib
  diisi sebelum dokumen dipakai untuk tanda tangan (menentukan yurisdiksi PN).
- `resources/js/Pages/Info/Terms.jsx` — ditulis ulang menjadi dua tab
  (`Components/ui/tabs`, pola sama dengan `Pages/Profile/Edit.jsx`). Tab umum 16 bagian,
  tab berkontrak 10 bagian. Penafian darurat (112) tetap di luar tab agar selalu terlihat.
- `resources/js/Pages/Info/About.jsx` — label baris identitas
  "Pengembang sistem" → "Pemilik & pengelola sistem" (PT = pemilik, bukan sekadar pengembang).
- `app/Http/Controllers/InfoController.php` — komentar kepala menjelaskan struktur dua dokumen.
  Tidak ada perubahan perilaku: `legal()` sudah meneruskan `config('legal.penyedia')` utuh.
- `tests/Feature/Sisupit/InfoPagesTest.php` — test baru: identitas penyedia & kanal legal
  ikut terkirim ke halaman S&K (menjaga kunci config tidak hilang diam-diam).

### Yang DIPERTAHANKAN dari versi 1.0 (tidak ada di kedua draf docx)
Penafian "bukan pengganti 112", aturan pemakaian PII oleh petugas/relawan, perekaman lokasi
selama misi, kepemilikan **data kejadian** oleh instansi + hak ekspor, serta pemisahan peran
pengendali data (instansi) vs pemroses data (penyedia). Draf docx menempatkan penyedia sebagai
pemilik segalanya; pemisahan ini sengaja tidak dilebur agar tidak bertabrakan dengan PKS.

### Verifikasi
- `php artisan test` → baseline sebelum **181 passed, 711 assertions**; sesudah lihat §7.
- `InfoPagesTest` → 13 pass, 122 assertions.
- `npm run build` lulus (client + SSR).

### Sisa terbuka
- **#51** identitas PIHAK PERTAMA di PKS masih `MAESA` perorangan — wajib diselaraskan.
- **#52** `LEGAL_PENYEDIA_ALAMAT` masih kosong; baris alamat disembunyikan bila kosong.
- Kedua berkas `docs/*.docx` dibiarkan apa adanya sebagai arsip draf; sumber kebenaran isi
  dokumen kini halaman `/syarat-ketentuan`.

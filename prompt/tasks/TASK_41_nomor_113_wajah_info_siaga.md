# TASK_41 — Nomor darurat 113, wajah halaman info, dan label mode kesiapan

- **Tanggal:** 2026-08-26
- **Sumber:** satu pesan user berisi TIGA permintaan sekaligus.
- **Status:** SELESAI (kode). SISA: verifikasi visual manual (§5).

---

## 1. Permintaan user (kutipan)

> "Nomor damkar 112 diganti jadi 113, Ganti semua tampilan pusat bantuan dan lain lain
> konsepnya seperti fasilitas fontnya spacingnya dan lainnya, Di dashboard status
> 'mode kesiapan' dirubah jadi siaga dan non aktif"

---

## 2. Permintaan (1) — 112 → 113

**Kenapa benar:** 113 adalah nomor pemadam kebakaran nasional Indonesia; 112 adalah nomor
panggilan darurat umum. Aplikasi ini memakai angka itu di satu peran saja — **cadangan** saat
`tenants.telepon_darurat` belum diisi — jadi penggantiannya seragam, termasuk baris yang dulu
berbunyi "Alternatif nasional: 112".

**Yang ditemukan saat mengerjakan (FINDINGS #80):** angkanya dipaku di **14 tempat** tanpa
sumber bersama. Mengganti nomor darurat karena itu adalah operasi yang harus tepat empat belas
kali, dan satu berkas yang terlewat tidak menimbulkan galat apa pun — aplikasi hanya akan
menyebut dua nomor darurat yang berbeda di dua halaman.

**Fix:** konstanta tunggal `NOMOR_DARURAT_NASIONAL` di `resources/js/lib/utils.js` (rumah yang
sudah dipakai `MAP_TILE_URL`, `GEO_OPTIONS`, `FACILITY_STATUS_LABELS`); kesembilan berkas
frontend membacanya dari sana.

| Berkas | Perubahan |
|---|---|
| `resources/js/lib/utils.js` | **BARU** `export const NOMOR_DARURAT_NASIONAL = '113'` |
| `Layouts/PublicLayout.jsx` | `tel:` + label footer |
| `Pages/Front/Reports/Create.jsx` | notice "kabupaten belum terdaftar" |
| `Pages/Front/Reports/Thanks.jsx` | pesan non-partner |
| `Pages/Info/Help.jsx` | cadangan `telepon`, callout darurat, kartu kontak |
| `Pages/Info/Terms.jsx` | cadangan `telepon`, penafian ×2 |
| `Pages/Monitoring/Map.jsx` | popup pos pemadam |
| `Pages/Admin/Tenants/Form.jsx` | placeholder input |
| `app/Http/Controllers/ReportController.php` | `teleponDarurat` fallback + komentar |
| `app/Http/Controllers/Front/MonitoringMapController.php` | `phone` fallback |
| `app/Http/Controllers/Front/PosPemadamController.php` | `phone` fallback |
| `database/seeders/TenantSeeder.php` | `telepon_darurat` Badung |
| `tests/.../TenantBrandingTest.php`, `TenantManagementTest.php` | patokan ikut 113 |

**Ikutan yang ikut dibetulkan:** kalimat "telepon {nomor instansi} **atau** {nomor nasional}"
di Help & Terms. Karena cadangan nomor instansi ADALAH nomor nasional, tenant yang belum
mengisi nomornya membaca "113 atau 113". Bagian "atau …" kini hanya muncul bila kedua nomor
memang berbeda.

**SISA yang disengaja:** sisi server tetap memakai literal `'113'` di empat tempat. Menyatukannya
menuntut kunci config baru + pengirimannya lewat `HandleInertiaRequests` — keputusan tersendiri,
di luar permintaan ini. Komentar di atas konstanta menyebut keempat berkas itu supaya keduanya
berubah bersamaan.

---

## 3. Permintaan (2) — wajah halaman info mengikuti halaman fasilitas

**Gejala yang dilihat user:** kelima halaman info/legal (Pusat Bantuan, S&K, Privasi, Tentang,
Paket & Lisensi) punya bahasa visualnya sendiri yang tidak dipakai halaman lain mana pun.

**Akar:** `Info/Partials/InfoShell.jsx` memakai hero gradient `PublicPageHeader` (judul
`text-3xl font-black`) DAN pembungkusnya sendiri `mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10`
— padahal `AppLayout` sudah memberi `mx-auto max-w-7xl` + `p-4 lg:p-8`. Jadi paddingnya
**bertumpuk**, dan judulnya dua tingkat lebih besar dari judul halaman lain.

**Fix — semuanya di `InfoShell.jsx` sehingga kelimanya ikut sekaligus:**

| Bagian | Sebelum | Sesudah (= halaman fasilitas) |
|---|---|---|
| Pembungkus | `mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10` | `relative flex w-full flex-col space-y-6 pb-32` |
| Kepala | hero `PublicPageHeader` (`text-2xl`/`sm:text-3xl font-black`) | `HeaderTitle` (`text-lg lg:text-2xl font-bold`) di baris `sm:flex-row sm:items-center` |
| `eyebrow` | baris kecil merah di atas judul | chip di slot KANAN baris kepala (`rounded-md border bg-muted text-[11px]`) |
| Jarak antar-blok | `space-y-4` | `gap-5` |
| `Section` | `Card` + `p-5 sm:p-6`, judul `text-base sm:text-lg font-bold`, badge `size-6` | `Card rounded-xl border-border shadow-sm` + `p-5`, judul `text-sm font-bold`, badge `size-5` |
| `Callout` | `rounded-lg p-4` | `rounded-xl p-5 shadow-sm` (sejajar dengan kartu `Section`) |
| `DefinitionRow` | label tebal foreground, isi muted | **dibalik**: label `text-[10px]` muted, isi `text-sm` foreground |
| `InfoNav` | pil `rounded-full`, judul `uppercase tracking-widest` | chip `rounded-md` (bentuk chip filter fasilitas) + kepala kolom berikon `text-sm font-semibold` |

Penyesuaian kecil per halaman supaya skalanya ikut: tombol CTA Help `h-11 text-sm font-bold`
→ `h-10 text-sm font-medium`; angka telepon Help `text-lg font-black` → `text-base font-bold`;
judul kartu paket Pricing `text-lg font-black` → `text-sm font-bold`, badge "Paket wilayah ini"
`rounded-full` solid → chip `rounded-md` bertint (bentuk chip status fasilitas).

**ISI dokumen tidak disentuh sama sekali** — hanya rupa.

**Akibat yang dicatat, bukan dikerjakan (FINDINGS #81):** `PublicPageHeader` kini tanpa pemakai.
Halaman fasilitas berhenti memakainya 2026-08-25, dan `CLAUDE.md` menyimpan instruksi eksplisit
"jangan dihapus" yang lahir dari konteks itu. Penghapusannya keputusan user, bukan efek samping.
Komentar di ketiga berkas fasilitas yang menyebut "PublicPageHeader tetap hidup" sudah dibetulkan
supaya tidak menyesatkan sesi berikutnya.

---

## 4. Permintaan (3) — label status "Mode Kesiapan"

`{isStandby ? 'Siaga Aktif' : 'Mulai Siaga'}` → `{isStandby ? 'Siaga' : 'Non Aktif'}` di
`Pages/Dashboard.jsx` (relawan) dan `Pages/Admin/Dashboard.jsx` (pejabat) — dua kartu kembar,
harus selalu berubah bersamaan.

**Kenapa ini perbaikan, bukan sekadar ganti kata:** bentuk lama tidak simetris — "Siaga Aktif"
adalah **keadaan**, "Mulai Siaga" adalah **ajakan**. Satu tombol yang kadang melaporkan status
dan kadang memerintah membuat pembacanya tak yakin mana yang sedang berlaku. Sekarang keduanya
keadaan. Judul kartu "Mode Kesiapan" TETAP.

---

## 5. Verifikasi

- `php artisan test` — **295 passed (1104 assertions)**, sama persis dengan baseline TASK_40.
- `npm run build` — lulus (client + SSR).
- `vendor/bin/pint` pada 6 berkas PHP yang disentuh — PASS.
- Prettier pada berkas JS yang disentuh; **reformat drive-by yang tidak berkaitan dikembalikan**
  (satu ternary di `Admin/Dashboard.jsx`, tiga blok JSX di `Reports/Thanks.jsx`) sesuai aturan
  "diff minimal".
- Tidak ada migrasi, tidak ada route baru, tidak ada perubahan kontrak API.

### SISA — verifikasi visual manual

- [ ] `/pusat-bantuan`, `/syarat-ketentuan`, `/kebijakan-privasi`, `/tentang`, `/paket-lisensi`
      — bandingkan berdampingan dengan `/hydrants`: ukuran judul, tebal huruf, jarak antar-kartu,
      dan padding tepi harus sama. Periksa sebagai TAMU dan sebagai pengguna yang sudah login.
- [ ] Chip kanan kepala halaman: di Privacy/Terms isinya panjang ("Versi 2.0 — berlaku sejak
      7 Agustus 2026") — pastikan membungkus rapi di lebar ponsel, tidak memotong judul.
- [ ] Mode gelap kelima halaman.
- [ ] Kalimat darurat di `/pusat-bantuan` & `/syarat-ketentuan` pada tenant **tanpa**
      `telepon_darurat` — harus berbunyi "113", **bukan** "113 atau 113".
- [ ] Popup pos pemadam di Peta Pemantauan & `/fire-stations` untuk pos tanpa nomor telepon.
- [ ] Kartu "Mode Kesiapan" di dashboard relawan **dan** pejabat: menyala = "Siaga",
      mati = "Non Aktif", dan tombolnya tetap bisa ditekan bolak-balik.

# TASK_35 — Slot ke-5 bilah bawah jadi tombol "Masuk" saat belum login
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_35 |
| Severity | P3 |
| Tipe | fitur kecil (UI) |
| Sumber | permintaan user 2026-08-25 ("perbaiki mobile nav, saat belum login menu jadi tombol login, jika sudah login baru jadi menu") |
| Status | DONE (kode) — TERDEPLOY 2026-08-25 @208c0e26 ke prod/staging/dev; sisa verifikasi visual §6 |

---

## 1. Tujuan

Di bawah `md`, slot ke-5 bilah bawah selalu berupa popover **"Menu"**. Bagi tamu isinya
nyaris seluruhnya bukan tujuan yang ia cari — empat tautan legal + "Masuk Akun" + "Daftar
Baru" — sehingga satu-satunya hal yang biasanya ingin dilakukan tamu, yaitu masuk, terkubur
satu ketukan di dalam panel. Diminta: **belum login → slot itu jadi tombol Masuk; sudah
login → tetap popover Menu.**

## 2. Kondisi awal

Tamu melihat bilah bawah di halaman ber-`AppLayout` yang terbuka untuk publik (terutama
`/` → `Spotlight.jsx`). Slot 1/3/4 (Beranda, Lapor, Riwayat) semuanya menuju route
ber-middleware `auth`, jadi bagi tamu ketiganya memang berujung di halaman login; slot 5
membuka popover berisi 6 tautan.

## 3. Perubahan

- `resources/js/Layouts/Partials/MobileBottomNav.jsx`
  - `resolveAbilities(auth)` (sudah diekspor `navItems.js`, dipakai juga oleh Sidebar)
    memberi `isLoggedIn`; `itemByKey('login')` memberi tujuan + ikon + judulnya.
  - `showLoginSlot = !isLoggedIn && Boolean(loginItem)` → slot ke-5 merender `<NavItem>`
    berlabel **"Masuk"** (aria-label memakai judul panjang "Masuk Akun" dari navItems),
    aktif saat `url.startsWith('/login')`. Kalau item `login` suatu saat hilang dari
    navItems, slotnya **jatuh kembali ke popover "Menu"**, bukan jadi tombol mati.
  - Tujuan TIDAK dipaku: tak ada `route('login')` di berkas ini — aturan #71.
  - `login` SENGAJA tidak dimasukkan ke `BAR_ITEM_KEYS`: daftar itu hanya menyaring isi
    popover, dan bagi tamu popovernya tidak dirender sama sekali. (Menambahkannya juga akan
    memerahkan `MobileNavParityTest` yang mematok jumlah kunci = 8.)
- `tests/Feature/Sisupit/MobileNavParityTest.php` — test keempat: slot login harus dibaca
  dari navItems (`itemByKey('login')`) dan berkas ini tidak boleh memuat `route('login'`.
- Dokumen: `prompt/docs/ARCHITECTURE_MAP.md`, `.claude/skills/sisupit-ui/SKILL.md`.

## 4. Harga yang disetujui user

Ditawarkan dua bentuk lewat pratinjau; user memilih **hanya mengganti slot Menu** (bukan
menggeser Menu ke slot "Riwayat" yang bagi tamu toh cuma melempar ke login). Konsekuensinya,
bagi TAMU di ponsel:

| Tautan yang hilang dari bilah | Masih terjangkau lewat |
|---|---|
| Pusat Bantuan, S&K, Kebijakan Privasi, Tentang | footer `AppLayout` (`AppLayout.jsx:310-313`) |
| Daftar Baru | tautan "Daftar Sekarang" di halaman login (`Auth/Login.jsx:278`) |

**Peringatan untuk sesi berikutnya:** keduanya adalah satu-satunya jalan tersisa. Begitu
footer legal atau tautan daftar di halaman login dihapus/dipindah, menu-menu itu hilang dari
ponsel tanpa gejala apa pun — persis mekanisme #71. Periksa tabel ini sebelum menyentuh
salah satunya.

## 5. Blast radius

Hanya render bilah bawah di bawah `md`. Bagi pengguna yang sudah login **tidak ada satu pun
perubahan** (bentuk, isi, dan penanda aktif slot ke-5 sama persis). Sidebar desktop tidak
tersentuh — di sana "Masuk Akun"/"Daftar Baru" tetap sebagai baris seksi Akun.

## 6. Verifikasi

- [x] `MobileNavParityTest` 3 → **4 passed**
- [x] `php artisan test` → **261 passed (1006 assertions)**
- [x] `npm run build` lulus (client + SSR), Prettier & Pint bersih
- [x] Deploy 2026-08-25 @`208c0e26` ke prod/staging/dev (`git pull --ff-only`). Frontend-only,
      tanpa migrasi & tanpa perubahan route. Dipastikan bundel yang DISAJIKAN produksi memang
      hasil build baru: `curl https://sisupit.com/` menunjuk `AppLayout-DwoxbydR.js`, berkas
      yang sama yang ada di disk dan memuat label "Masuk". Ketiga domain 200.
- [ ] **Verifikasi visual (SISA):**
  1. Logout, buka `/` di lebar < md → slot ke-5 berbunyi "Masuk" berikon login, bukan "Menu".
  2. Ketuk → mendarat di halaman login; saat di `/login` slot itu tampil aktif (kotak merah).
  3. Login → slot ke-5 kembali jadi "Menu" dan popovernya berisi seluruh seksi seperti biasa.
  4. Lebar ≥ md: sidebar/rail tidak berubah untuk kedua keadaan.

## 7. Rollback

Satu commit fokus → `git revert`.

---

## Acceptance criteria
- [x] Tamu mendapat tombol Masuk di slot ke-5; pengguna login tetap mendapat Menu
- [x] Tujuan tombol dibaca dari `navItems.js`, dijaga test
- [x] Tidak ada regresi (260 → 261 passed)
- [x] Dokumen terkait diupdate

---

## 8. ADENDUM 2026-08-25 — halaman publik dikembalikan ke AppLayout

**Permintaan user (lanjutan, hari yang sama):** "saat belum login ketika klik fasilitas agar
mobile nav nya tetap seperti default, karena sebelumnya sempat buat landing page sehingga
tidak pakai mobile nav tetapi landing page itu tidak jadi dipakai".

**Gejalanya:** tamu mengetuk "Fasilitas" di bilah bawah → mendarat di `/hydrants` → **bilah
bawahnya hilang**. Penyebabnya bukan bilah itu, melainkan LAYOUT halaman tujuannya: tiga
halaman fasilitas memakai layout adaptif `tamu → PublicLayout, login → AppLayout`, dan
`PublicLayout` (chrome navbar+footer milik landing page) memang tidak merender
`MobileBottomNav`. Jadi bilah mengantar tamu ke tempat yang membuang bilah itu sendiri.

**Cakupan (ditanyakan lebih dulu, user memilih yang luas):** pola adaptif yang sama ternyata
hidup di DUA tempat, bukan satu — tiga halaman fasilitas **dan** `Info/Partials/InfoShell.jsx`
yang melayani kelima halaman info/legal. Membiarkan yang kedua akan menyisakan lubang yang
persis sama, dan justru di jalur yang baru saja jadi satu-satunya jalan tamu ke halaman legal
(§4 di atas): footer AppLayout → Pusat Bantuan → bilah hilang.

**Perubahan:** percabangan dihapus di keempat berkas — `Pages/{Hydrants,Pumps,FireStations}/Index.jsx`
dan `Pages/Info/Partials/InfoShell.jsx` kini selalu `AppLayout`. Konten halamannya tidak
disentuh sama sekali; bagi pengguna yang sudah login tak ada yang berubah karena mereka memang
sudah mendapat AppLayout.

**`PublicLayout` TIDAK dihapus** — pemakainya tinggal `Pages/Landing.jsx` (route `/landing`).
Docblock-nya diperbarui agar menyebut dirinya "pemakai tunggal" berikut alasannya, supaya tak
ada yang memakainya ulang untuk halaman yang bisa dicapai dari bilah bawah.

**Penjaga:** test kelima di `MobileNavParityTest` — keempat berkas di atas tidak boleh
mengimpor `@/Layouts/PublicLayout` lagi. `Landing.jsx` sengaja tidak diperiksa.

**Verifikasi tambahan:** `php artisan test` → **262 passed (1010 assertions)**, `npm run build`
lulus, Prettier bersih.

**TERDEPLOY 2026-08-25 @`6e75dd4e`** ke prod/staging/dev. Dibuktikan di level manifest yang
BENAR-BENAR disajikan produksi (bukan sekadar "sudah ter-commit"): `Pages/Hydrants/Index.jsx`
dan `Pages/Info/Help.jsx` kini mengimpor chunk AppLayout dan TIDAK lagi PublicLayout.
`/hydrants`, `/pumps`, `/fire-stations`, `/pusat-bantuan` → 200 sebagai tamu. `/landing` tetap
200 dan chunk-nya masih memuat navbar PublicLayout — Rollup meleburkan layout itu ke dalam
chunk Landing karena kini pemakainya tinggal satu, jadi ia hilang dari daftar `imports`
manifest; itu normal, bukan tanda ia ikut terhapus.

Penyeragaman itu **TERDEPLOY 2026-08-25 @`020c4021`** ke prod/staging/dev. Dibuktikan di
manifest yang disajikan produksi: ketiga chunk fasilitas kini mengimpor `HeaderTitle` dan
TIDAK lagi `PublicPageHeader`. Test tetap **262 passed (1010 assertions)** — penyeragaman ini
murni presentasi, tak ada test yang menyentuhnya.

**Visual (SISA):** sebagai tamu, ketuk Fasilitas → Hidran/SKKL/Pos Pemadam dan footer → Pusat
Bantuan/S&K/Privasi/Tentang — bilah bawah harus tetap ada di semuanya, dan ketiga halaman
fasilitas harus tampak sama persis dengan tampilan setelah login.

**Lanjutan yang diminta user setelah melihat hasilnya** ("samakan tampilannya seperti sudah
login supaya tidak 2 tampilan fasilitas"): percabangan `isGuest` di BADAN ketiga halaman
fasilitas ikut dibuang. Dulu tamu mendapat hero `PublicPageHeader` + pembungkus
`max-w-6xl px-4 py-8 pb-24`, yang sudah login mendapat `HeaderTitle` + `w-full pb-32` —
satu halaman dengan dua wajah tergantung status login, dan sejak layoutnya disatukan
pembungkus tamu itu bahkan bertumpuk dengan container `max-w-7xl p-4 lg:p-8` milik AppLayout.
Sekarang **satu wajah untuk semua**, yaitu wajah yang sudah login.

Ikutannya di ketiga berkas: `PublicPageHeader`, `usePage`, `auth`, dan `isGuest` tak lagi
dipakai sehingga importnya ikut dibuang. `PublicPageHeader` **tetap hidup** — kelima halaman
info/legal memakainya untuk SEMUA peran lewat `InfoShell`, jadi jangan dihapus. Subjudul SKKL
yang dulu berbeda antara tamu ("Temukan Sistem Ketahanan…") dan yang login ("Sistem Ketahanan…
terdekat.") kini memakai versi yang sudah login.

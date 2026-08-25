# TASK_35 — Slot ke-5 bilah bawah jadi tombol "Masuk" saat belum login
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_35 |
| Severity | P3 |
| Tipe | fitur kecil (UI) |
| Sumber | permintaan user 2026-08-25 ("perbaiki mobile nav, saat belum login menu jadi tombol login, jika sudah login baru jadi menu") |
| Status | DONE (kode) — sisa verifikasi visual §6 |

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

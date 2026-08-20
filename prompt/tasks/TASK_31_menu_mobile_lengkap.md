# TASK_31 — Semua menu desktop harus terjangkau di ponsel (bottom-nav satu sumber)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_31 |
| Severity | P2 |
| Tipe | bugfix (navigasi) + refactor terbatas |
| Sumber | permintaan user 2026-08-19 ("cek menu di mobile, pastikan semua menu di desktop muncul di mobile, ingat mobile first design") — sekaligus menutup #53/#54 & mencatat #71 |
| Status | DONE (kode) |

---

## 1. Deskripsi masalah / tujuan

Sejak bottom-nav dikembalikan ke bentuk pra-TASK_20 (2026-08-13), daftar menu ponsel
dipelihara terpisah di `MobileBottomNav.jsx`. Konsekuensi yang saat itu diterima
("menu baru wajib ditulis DUA KALI") sudah benar-benar terjadi: **sembilan entri menu
desktop tidak ada di ponsel**, tiga di antaranya menu yang lahir dari TASK_27 & TASK_30.

Tujuan: seluruh menu yang tampil di sidebar desktop harus terjangkau di ponsel, dan
kejadian "menu baru lupa ditulis" tidak boleh bisa terulang.

## 2. Reproduce (bukti masalah ada)

Bandingkan `resources/js/Layouts/Partials/navItems.js` (dipakai `Sidebar.jsx`) dengan
daftar hardcoded di `MobileBottomNav.jsx`, per peran:

| Menu desktop | Peran | Ada di ponsel? |
|---|---|---|
| Manajemen SKKL (`admin.pumps`) | admin/superadmin | TIDAK |
| Manajemen Pos Pemadam (`admin.fire-stations`) | admin/superadmin | TIDAK |
| Manajemen OPD Terkait (`admin.agencies`) | admin/superadmin | TIDAK |
| Instansi / Kabupaten (`admin.tenants`) | superadmin | TIDAK |
| Pusat Bantuan / S&K / Kebijakan Privasi / Tentang | semua peran | TIDAK (hanya footer) |
| Daftar Baru (`register`) | tamu | TIDAK |

Tambahan yang ditemukan saat audit:
- Popover "Menu" hanya dirender untuk admin/superadmin. **Petugas, pejabat, relawan, dan
  warga tidak punya pintu menu apa pun di ponsel** — bagi mereka satu-satunya jalan ke
  Keluar (Logout) adalah lewat tombol di dalam halaman `Profile/Edit.jsx:125`.
- Label ponsel menyimpang dari desktop ("Kelola Fasilitas" untuk `admin.hydrants`,
  "Kelola Pengguna" untuk Manajemen Pengguna) — dua kosakata untuk satu menu.

## 3. Root cause

`resources/js/Layouts/Partials/MobileBottomNav.jsx` menuliskan ulang seluruh daftar menu
sebagai JSX statis (`<FloatingLink href={route(...)} label="..."/>`, baris 122–372) plus
menyalin detektor peran (baris 53–62) dari `navItems.js`. Tidak ada mekanisme apa pun yang
memaksa kedua daftar sinkron — jadi setiap menu baru hilang **tanpa gejala** di ponsel.

## 4. Perubahan

- `resources/js/Layouts/Partials/MobileBottomNav.jsx` — ditulis ulang: isi kedua popover
  kini dibangun dari `buildNavSections()` (`navItems.js`), bukan JSX statis.
  - **Bentuk visual tidak berubah**: tetap dua popover melayang buatan tangan di atas
    tombol pemicunya (`absolute bottom-[72px]` + panah `rotate-45`, tutup lewat listener
    `mousedown`), sesuai keputusan user 2026-08-13 yang membalikkan TASK_21. Pola drawer
    TIDAK dihidupkan kembali.
  - Empat jangkar bilah (Beranda, Fasilitas, SOS, Riwayat) tetap tetap; kuncinya
    didaftar di `BAR_ITEM_KEYS`/`FASILITAS_ITEM_KEYS`.
  - Slot ke-5 kini popover **"Menu" untuk SEMUA peran** (dulu admin saja) berisi
    *semua seksi navItems yang belum terwakili di bilah* — administrasi, kontrol akses,
    sistem, Bantuan & Legal, akun. Tamu mendapat Masuk + Daftar Baru.
  - Detektor peran lokal (duplikat `resolveRoles`) dihapus — peran kini diputuskan sekali
    di `navItems.js`.
- `resources/js/Layouts/Partials/navItems.js` — komentar kepala diperbarui: pengecualian
  "dua daftar" 2026-08-13 dicabut (atas persetujuan user 2026-08-19); `flattenNavItems`
  punya pemakai lagi. Tidak ada perubahan data menu.
- `.claude/skills/sisupit-ui/SKILL.md` — dua baris tabel navigasi disesuaikan.
- `prompt/docs/FINDINGS_LOG.md` — #71 dicatat & langsung FIXED; #53/#54 kembali FIXED.
- `prompt/docs/ARCHITECTURE_MAP.md` — bagian navigasi disesuaikan.
- `tests/Feature/Sisupit/MobileNavParityTest.php` — **penjaga baru**: membaca
  `navItems.js` + `MobileBottomNav.jsx` dan gagal bila bottom-nav kembali menulis daftar
  menu sendiri (mis. memanggil `route('admin.…')` langsung).

## 5. Blast radius

- `MobileBottomNav` hanya dipakai `AppLayout.jsx:329`; tak ada pemakai lain.
- Peran non-admin: bilah slot ke-5 berubah dari tautan langsung "Profil"/"Masuk" menjadi
  popover "Menu". Profil jadi satu ketukan lebih dalam — **disetujui user 2026-08-19**
  sebagai harga untuk tautan legal + Keluar yang akhirnya terjangkau.
- Backend, route, dan gating peran tidak disentuh sama sekali. Item yang muncul persis
  item yang sudah dipakai sidebar desktop, jadi tak ada menu baru yang bocor ke peran
  yang tidak berhak.
- `buildQuickActions` masih tanpa pemakai (dibiarkan, di luar scope — lihat catatan
  pembalikan #53/#54).

## 6. Verifikasi

- [x] Baseline test sebelum: `php artisan test` → **236 passed (926 assertions)**
- [x] Regression test baru: `tests/Feature/Sisupit/MobileNavParityTest.php`
- [x] Test sesudah hijau: **239 passed (943 assertions)**
- [x] `npm run build` lulus (client + SSR)
- [ ] **Verifikasi manual di browser (belum dilakukan — repo tanpa browser automation):**
  1. Lebar < 768px, login sebagai **superadmin**: ketuk "Menu" → harus ada seksi
     Administrasi (Pengguna, Verifikasi Laporan, Hydrant, SKKL, Pos Pemadam, OPD Terkait,
     Pengumuman), Kontrol Akses (4), Sistem (Instansi/Kabupaten, Pengaturan Notifikasi),
     Bantuan & Legal (4), Akun (Profil, Keluar). Panel bisa digulir, tidak tertimpa
     gesture bar.
  2. Login **admin** (bukan superadmin): seksi Kontrol Akses & Sistem TIDAK muncul,
     Pengumuman Sistem TIDAK muncul.
  3. Login **petugas**: "Menu" berisi Bantuan & Legal + Profil/Keluar; panel Fasilitas
     memuat Daftar Relawan & Peta Pemantauan.
  4. Login **relawan/warga**: "Menu" berisi Bantuan & Legal + Profil/Keluar; TIDAK ada
     seksi Administrasi.
  5. **Tamu (belum login)**: "Menu" berisi Bantuan & Legal + Masuk + Daftar Baru.
  6. Ketuk "Keluar" dari dalam panel → benar-benar logout (token FCM ikut terlepas).
  7. Tap di luar panel / tombol Back → panel tertutup; buka Fasilitas saat Menu terbuka
     → Menu ikut tertutup (dan sebaliknya).
  8. Tablet (≥768px): bilah bawah tetap TIDAK muncul (rail sidebar yang dipakai).

## 7. Rollback

Satu commit fokus pada `MobileBottomNav.jsx` + dokumen. `git revert` mengembalikan bentuk
popover admin-only apa adanya; `navItems.js` tidak berubah datanya sehingga sidebar
desktop aman dari rollback ini.

---

## 8. ADENDUM 2026-08-19 — pass rupa bilah bawah (FINDINGS #72)

Permintaan lanjutan user: *"perbaiki icon di mobile-nya, tombol-tombol di mobile-nya tidak
menyatu terlihat dengan keseluruhan sistem, bagaimana agar clean dan minimalis dan modern,
diskusi dulu"*. Didiskusikan lebih dulu: delapan penyimpangan terukur dipaparkan (lihat
#72), lalu tiga arah visual disodorkan berpratinjau. Pilihan user:

1. **Bilah = "sebahasa sidebar"** — aktif jadi kotak `rounded-xl bg-destructive` berikon
   putih, persis `NavLink`. Ikon 20px, `stroke` tetap 1.75, label 12px.
2. **SOS = ikon brand di dalam lingkaran solid merah** — diwujudkan sebagai vektor
   (`IconBoltFilled` putih di atas `bg-destructive`) karena `/icon.png` sendiri sudah
   kotak merah berpetir putih; menumpuknya di atas merah = dua nuansa merah. `/icon.png`
   tidak disentuh (tetap favicon/logo/launcher APK).
3. **Popover disamakan dengan dropdown sistem** — panah dibuang, `rounded-xl bg-popover
   shadow-md`, baris `min-h-[48px]`, judul seksi 11px.

Ikonografi ikut diselaraskan (tidak ditanyakan, murni menyamakan): Beranda
`IconHome` → `IconDashboard` (sama dengan sidebar), Fasilitas `IconFiretruck` →
`IconMapPin` agar `IconFiretruck` kembali berarti Pos Pemadam saja, dan warna ikon
relawan `text-info` → `text-volunteer` selaras peta.

### Revisi setelah user melihat hasilnya (masih 2026-08-19)

Tiga koreksi dari user, semuanya diterapkan:

1. ~~Penanda aktif → garis minimalis~~ — dicoba, lalu **ditolak pada iterasi berikutnya**
   ("garis tipis tidak bagus, gunakan seperti sebelumnya yang rekomendasi seperti desktop").
   **Final: kotak `rounded-xl bg-destructive` berikon putih**, dialek `NavLink` sidebar.
2. **Slot "Lapor"** — empat percobaan: lingkaran vektor (ditolak), `/icon.png` 40px
   mengambang (ditolak), `/icon.png` 24px di DALAM kotak slot (ditolak), glyph
   `IconBoltFilled`. Koreksi terakhir user menunjukkan yang salah bukan asetnya melainkan
   cara pasangnya: *"gunakan icon.png, ikonnya sebenarnya petir putih dalam kotaknya"*.
   **Final: `/icon.png` MENGGANTIKAN kotak ikon slot** (32px, setinggi kotak slot lain),
   bukan diletakkan di dalamnya — penumpukan itulah yang tadi memunculkan dua merah.
   Aturan turunan: slot ini **tak boleh** diberi latar merah saat aktif; penandanya cincin
   `ring-2 ring-destructive/50`. Prop `imageSrc` ditambahkan ke `NavItem`/`SlotContent`
   supaya slot ini tetap memakai komponen yang sama dengan slot lain.
3. **"Seolah ada 2 yang sedang aktif"** — cacat nyata: `active={isFasilitasActive ||
   showFasilitas}` membuat panel yang terbuka memerahkan tombolnya dengan warna yang sama
   dengan penanda halaman aktif. **Aturan baru:** merah = LOKASI (satu slot saja); panel
   terbuka = keadaan sesaat, ditandai `bg-accent` netral + `aria-expanded`. Hover ikut
   netral, tautan aktif dapat `aria-current="page"`.

4. **Urutan "Fasilitas Publik" disamakan dengan seksi Administrasi** (permintaan user):
   dulu SKKL → Pos Pemadam → Hydrant, kini **Hydrant → SKKL → Pos Pemadam** → Daftar
   Relawan, sama dengan urutan Manajemen Hydrant → Manajemen SKKL → Manajemen Pos Pemadam.
   `FASILITAS_ITEM_KEYS` di bottom-nav ikut diurutkan ulang supaya ponsel tak berbeda dari
   desktop (Peta Pemantauan tetap paling bawah di panel ponsel).

**Verifikasi manual tambahan (belum dilakukan):**
9. Buka `/dashboard` lalu ketuk "Fasilitas": **hanya Beranda** yang boleh merah; tombol
   Fasilitas cuma berlatar abu. Ini inti keluhan "dua yang aktif".
10. Buka `/pumps` lalu ketuk "Fasilitas": slot Fasilitas boleh menampilkan garis merah DAN
    latar abu sekaligus — pastikan keduanya terbaca sebagai dua hal berbeda, bukan rancu.
11. Mode gelap: kotak aktif & petir "Lapor" tetap kontras di atas `bg-card` gelap.
12. Pindah halaman beberapa kali — ikon tidak menebal/bergetar; tinggi slot tetap.
12b. Buka `/reports/create`: slot "Lapor" mendapat **cincin** di sekeliling tile brand —
    pastikan TIDAK muncul kotak merah kedua di belakangnya.
12c. Bandingkan tinggi: tile "Lapor" (32px) harus sejajar dengan kotak ikon empat slot
    lain, tidak menonjol naik/turun.
13. Buka popover "Menu" sebagai superadmin: baris cukup tinggi untuk jempol (48px), tidak
    ada panah segitiga, bayangan sekelas dropdown lonceng di header.
14. Pembaca layar / keyboard: tombol Fasilitas & Menu mengumumkan status buka-tutup
    (`aria-expanded`), slot halaman aktif mengumumkan `aria-current="page"`.

---

## Acceptance criteria
- [x] Seluruh item `buildNavSections()` terjangkau di < 768px untuk setiap peran
- [x] Tidak mungkin lagi ada menu yang hanya hidup di satu permukaan (satu sumber + test penjaga)
- [x] Tidak ada regresi (239 ≥ baseline 236)
- [x] Bentuk popover melayang dipertahankan (tak menghidupkan drawer TASK_21)
- [x] Dokumen terkait diupdate

# TASK_21 — Panel menu mobile: dari sidebar-dalam-Sheet ke bottom drawer yang layak

**Temuan:** FINDINGS #54 · **Tanggal:** 2026-08-08 · **Status:** SELESAI (verifikasi visual manual masih tersisa)
**Branch:** `worktree-mobile-menu-drawer`

---

## 1. Masalah & akar penyebab

Laporan user: *"menu yang muncul sheet jika ditekan di mobile itu terlalu primitif"*.

TASK_20/#53 menyelesaikan masalah yang benar (dua daftar menu terpisah → satu sumber), tapi
menyelesaikannya dengan menyamakan **sumber** dan **penyajian**: slot "Menu" di bottom-nav
membuka `<SheetContent side="right">` yang isinya komponen `<Sidebar/>` desktop apa adanya.

Akibatnya di ponsel:

| # | Gejala | Lokasi (pra-perubahan) |
|---|--------|------------------------|
| 1 | Panel meluncur dari **kanan** padahal pemicunya di kanan-**bawah** | `MobileBottomNav.jsx:232-243` |
| 2 | 26 baris datar berbobot sama untuk superadmin | `Sidebar.jsx` di-mount penuh |
| 3 | Identitas pengguna (nama/peran/instansi) tak ada di mana pun pada mobile | `AppLayout.jsx:213-273` dikomentari |
| 4 | Tanpa titik henti, tanpa tombol tutup, tanpa pencarian, tanpa safe-area | `MobileBottomNav.jsx:232` |
| 5 | Back perangkat menutup **halaman**, bukan panel | tak ada penanganan |
| 6 | Popover "Fasilitas" pakai wadah & klik-luar buatan tangan sendiri | `MobileBottomNav.jsx:53-61, 94-147` |

## 2. Riset yang mendasari keputusan

- **Material** — bottom nav dibatasi 3–5 destinasi; overflow-nya memakai **bottom sheet** di
  mobile (inline menu hanya untuk desktop). Struktur 5 slot yang ada sudah benar; wadah
  overflow-nya yang salah.
- **NN/g (Bottom Sheets)** — wajib ada tombol Close (✕) yang terlihat, grab handle saja
  ambigu secara gestur dan tak terbaca pembaca layar; wajib menghormati tombol Back
  perangkat; jangan menumpuk sheet.
- **iOS `presentationDetents`** — sheet punya titik henti (medium → large) yang bisa ditarik;
  indikator seret hanya muncul kalau titik hentinya lebih dari satu.
- **Zona jempol** — tab bar bawah + bottom sheet unggul karena keduanya duduk di area jempol.
- **Menu aplikasi kompleks** — kurangi beban kognitif lewat submenu yang bisa dilipat,
  pengelompokan fungsional, dan akses cepat/pencarian; bukan satu daftar panjang.

## 3. Keputusan user (dikonfirmasi sebelum mengedit)

User memilih **Tier 1 + 2 + 3** (cakupan penuh) dari tiga pilihan yang diajukan: struktural
(arah + pemisahan data/presentasi), isi panel (identitas, aksi cepat, seksi terlipat), dan
pemolesan (pencarian, safe-area, penyatuan popover Fasilitas, Back perangkat).

## 4. Perubahan

**Baru**

- `resources/js/Layouts/Partials/navItems.js` — **satu-satunya** sumber daftar navigasi.
  `resolveRoles`, `resolveAbilities`, `buildNavSections`, `flattenNavItems`, `findNavItem`,
  `buildQuickActions`. Tiap seksi membawa penanda `mobile` (`list` / `collapsible` / `legal` /
  `account`) yang memberi tahu panel mobile cara menyajikannya; `Sidebar` mengabaikannya.
- `resources/js/Layouts/Partials/MobileMenuPanel.jsx` — panel "Menu" baru.
- `resources/js/hooks/use-sheet-history.js` — Back perangkat menutup panel.

**Diubah**

- `Sidebar.jsx` — tinggal jadi *renderer*; daftar menunya dari `navItems.js`. Keluaran DOM
  desktop/rail sengaja dipertahankan sama persis (25 `<a>` + 1 `<button>`, 7 heading seksi).
- `MobileBottomNav.jsx` — Sheet-kanan → `<MobileMenuPanel/>`; popover Fasilitas → drawer yang
  sama; `NavItem`/`NavButton` berbagi `NavItemBody`; `env(safe-area-inset-bottom)` di bar.
- `AppLayout.jsx` — `pb-20` → `pb-[calc(5rem+env(safe-area-inset-bottom))]`.
- `resources/views/app.blade.php` — `viewport-fit=cover` (syarat agar `env(safe-area-inset-*)`
  berisi nilai nyata).
- `Components/ui/drawer.jsx` — grab handle `h-2 w-[100px]` → proporsi Material ±32×4dp,
  `aria-hidden`. Komponen ini sebelumnya tak dipakai satu halaman pun.

**Anatomi panel baru (atas → bawah)**

1. Grab handle + kepala identitas (avatar/inisial, nama, peran · instansi, chevron ke Profil)
   atau ajakan masuk untuk tamu — plus tombol ✕.
2. Kolom cari (muncul kalau tujuan yang dapat dinavigasi > 12 → hanya admin/superadmin).
   Menyentuh kolom menaikkan panel ke titik henti penuh.
3. Petak aksi cepat 2 kolom — 4 tujuan teratas yang tersedia bagi peran itu, diambil dari
   satu daftar prioritas (`QUICK_ACTION_PRIORITY`), bukan tabel per-peran.
4. Daftar bergrup; Administrasi / Kontrol Akses / Sistem **terlipat** (default tertutup,
   otomatis terbuka kalau halaman yang sedang dibuka ada di dalamnya).
5. Akun & Sistem (Profil / Keluar, atau Masuk / Daftar).
6. Kaki: Bantuan & Legal sebagai teks kecil, dengan padding `safe-area-inset-bottom`.

## 5. Verifikasi

### Otomatis

- `php artisan test` → **182 passed (726 assertions)** — identik dengan baseline. Dijalankan
  di checkout utama; seluruh perubahan bersifat frontend + satu meta tag blade.
- `npm run build` → lulus, client **dan** SSR.
- Prettier bersih pada semua file yang disentuh.

### Terverifikasi lewat render SSR sungguhan

`node bootstrap/ssr/ssr.js` + `artisan serve --port=8124`, login `pusat@sisupit.com` lewat
HTTP (cookie jar + header `X-XSRF-TOKEN`), lalu memeriksa markup `/dashboard`:

- Bar bawah ter-render tanpa error SSR: `aria-label="Buka menu"`,
  `aria-label="Buka daftar fasilitas publik"`, slot Beranda & Riwayat.
- `env(safe-area-inset-bottom)` hadir di markup; `viewport-fit=cover` hadir di `<head>`.
- Sidebar desktop utuh pasca-refactor: ketujuh judul seksi (Menu Utama, Operasional,
  Fasilitas Publik, Administrasi, Kontrol Akses, Bantuan & Legal, Akun & Sistem) dan
  26 entri navigasi (25 cocok pola kelas + 1 entri aktif yang kehilangan `font-medium`
  karena `twMerge` menggantinya dengan `font-bold`).

> Catatan: SSR hanya bisa membuktikan panel **tertutup** — vaul/Radix mem-portal isinya dan
> tak merender apa pun saat tertutup. Isi panel wajib dicek mata manusia.

### BELUM diverifikasi — perlu mata manusia (repo tak punya browser automation)

Buka di ponsel / DevTools mode perangkat, lebar < 768px:

- [ ] Tap "Menu" → panel naik dari bawah dan berhenti di ~62% tinggi layar.
- [ ] Seret ke atas → membesar ke penuh; seret ke bawah dari penuh → kembali ke 62%; seret
      lagi → tertutup.
- [ ] Di titik henti 62% daftar **tidak** ikut scroll (seretan menggerakkan panel);
      di titik penuh daftar bisa di-scroll.
- [ ] Tombol ✕ menutup panel; klik overlay menutup panel.
- [ ] **Tombol Back perangkat menutup panel, bukan keluar halaman** (uji di APK, bukan hanya
      browser desktop).
- [ ] Tap item menu → panel langsung tertutup dan navigasi berjalan; tekan Back sesudahnya →
      kembali ke halaman sebelumnya (bukan reload penuh).
- [ ] Login superadmin: seksi Administrasi/Kontrol Akses/Sistem tertutup saat panel dibuka;
      saat sedang berada di `/admin/users`, seksi Administrasi terbuka sendiri.
- [ ] Kolom cari muncul untuk admin/superadmin, **tidak** muncul untuk warga/petugas.
      Ketik "priv" → "Kebijakan Privasi" muncul. Menyentuh kolom menaikkan panel ke penuh dan
      keyboard tidak menutupi hasil.
- [ ] Tamu (belum login): kepala panel berbunyi "Menu & Informasi", petak aksi cepat berisi
      fasilitas + Masuk, tautan legal tetap ada di kaki panel.
- [ ] Tap "Fasilitas" → drawer pendek dari bawah berisi SKKL/Pos Damkar/Hydrant
      (+ Relawan & Peta Pemantauan sesuai peran).
- [ ] Ponsel berponi/gesture bar: bar bawah dan kaki drawer tidak tertimpa indikator sistem.
- [ ] Mode gelap & terang: kontras kepala identitas, petak aksi cepat, dan baris aktif.
- [ ] Tablet (768–1023px) & desktop (≥1024px) tidak berubah dari sebelumnya.

## 6. Blast radius / risiko sisa

- `Sidebar.jsx` dipakai `AppLayout` di dua mode (rail md + penuh lg). Refactor-nya murni
  memindahkan sumber daftar; keluaran DOM diperiksa sama lewat SSR.
- `drawer.jsx` disentuh, tapi sebelum ini tak ada satu pun halaman yang memakainya — tak ada
  konsumen lain yang bisa terpengaruh.
- `viewport-fit=cover` berlaku untuk seluruh aplikasi. Efeknya hanya mengaktifkan nilai
  `env(safe-area-inset-*)`; halaman yang tak memakainya tidak berubah.
- **Hutang yang dicatat, bukan dikerjakan:** blok profil di header `AppLayout.jsx:213-273`
  masih dikomentari. Identitas kini ada di panel mobile, tapi di desktop tetap tak tampil.
- Ambang pencarian (12) dan titik henti (0.62) adalah angka pilihan; sesuaikan setelah
  verifikasi visual kalau terasa meleset.

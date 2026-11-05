# TASK_87 - Terapkan desain clean minimalis (FigCraft) ke lingkungan DEV
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_87 |
| Severity | P2 |
| Tipe | fitur (perombakan tampilan) |
| Sumber | permintaan user 2026-11-04 |
| Status | TODO - menunggu konfirmasi rencana |

---

## 1. Deskripsi / tujuan
Menerapkan desain FigCraft yang sudah disetujui user (`C:\Users\Admin\Documents\Sisupit Desain\sisupit-desain.figcraft`,
90 papan + halaman Ikon + Sistem desain) ke aplikasi, **hanya untuk lingkungan DEV** (dev.sisupit.com, branch `dev`).

Batasan dari user:
- **JANGAN mengubah production dan branch `main`.** Tidak ada commit ke `main`, tidak ada deploy ke production/staging.
- Semua perubahan wajib patuh `Documents\Sisupit Desain\KESEPAKATAN-DESAIN.md` (clean minimalis, anti vibe-coded).
  Kesepakatan itu sampai sekarang hanya berlaku untuk desain FigCraft; task ini yang pertama membawanya ke kode,
  khusus di branch kerja + dev. Aturan kode (CONVENTIONS/PENGECUALIAN_ATURAN) untuk `main` tidak diubah.

## 2. Kondisi awal & hasil yang diharapkan
Awal: tampilan aplikasi = desain lama (Inter, kartu shadow-sm, StatusBadge tint 10%, bilah bawah material-chrome/kaca,
dashboard & form versi lama).
Diharapkan di dev: tampilan mengikuti papan FigCraft (lihat daftar layar di bagian 4), fungsi & data tidak berubah.

## 3. Root cause
Bukan bug. Perubahan desain atas permintaan user.

## 4. Rencana (bertahap, satu tahap = satu commit fokus)

**Tahap 0 - Branch kerja**
- Buat branch `feat/desain-clean-minimalis` dari `main` @640f0831 (tanpa mengubah `main`).
- Working tree `main` saat ini punya perubahan belum ter-commit (a.l. `public/build` terhapus, beberapa dokumen) -
  diperiksa dulu & ditanyakan ke user; JANGAN `git checkout <file>` (peringatan CLAUDE.md).

**Tahap 1 - Fondasi (token & tipografi)**
- `resources/css/app.css`: latar `#FBFBF9` (bukan putih murni), kartu `#FFFFFF`, garis `#E7E7E3`, muted `#F2F2EF`,
  teks `#111214`/`#6B6E75`; merah brand tetap `#E0241A`; mode gelap disesuaikan setara.
- Font **Plus Jakarta Sans** menggantikan Inter (`app.css` @import + `tailwind.config.js` fontFamily).
- Radius TETAP (kartu 16-20 / rounded-2xl, tombol 10). Buang `shadow-*` dari kartu/tombol/bilah (garis 1 px).
- Tanpa gradien, tanpa latar tint pastel (tint 8-15% warna status/merah -> netral).

**Tahap 2 - Komponen bersama**
- `Components/StatusBadge.jsx` -> pil netral + titik warna status (label & kamus status tetap satu sumber).
- Pil lain (status unit/regu/hydrant) -> pola titik yang sama.
- `Components/ReportProgress.jsx` (stepper) -> hitam (lewat) / merah (aktif) / abu (berikutnya), label baku
  Masuk/Terverifikasi/Penanganan/Selesai, jam di bawah titik; versi tegak untuk Thanks.
- `Layouts/Partials/MobileBottomNav.jsx` -> bilah putih solid bergaris dengan cekungan, bulatan Lapor merah solid
  + petir brand (BrandBoltIcon); slot aktif = ikon terisi; tamu = slot Masuk; buang efek kaca (material-chrome).
- Ikon khas Sisupit sebagai komponen React baru (`Components/icons/` - hydrant, SKKL, pos, helm/regu, relawan,
  sirine, pohon tumbang, APAR, siaran) dari `ikon.py`; Kebakaran & Armada TETAP Tabler IconFlame/IconFiretruck
  (sesuai production). Ikon antarmuka lain tetap `@tabler/icons-react`.

**Tahap 3 - Layar (mengikuti papan FigCraft)**
- Warga: Beranda (`Pages/Dashboard.jsx`: kartu darurat + telepon, Laporan Anda + stepper, Kejadian sekitar,
  Fasilitas terdekat; tanpa petak pintasan), Form lapor & Ubah laporan (`Front/Reports/Create.jsx`, `Edit.jsx`:
  peta + lembar isian menyatu), Thanks, Detail laporan (`Show.jsx` sisi pelapor), Riwayat, Profil, popover Menu/Fasilitas.
- Publik: `Spotlight.jsx` (route `/`), Login/Daftar/sandi, Bantuan (`Info/Help.jsx` kartu putih), legal.
- Relawan/petugas/OPD/pejabat: header tanpa blok warna, dashboard per peran, detail insiden petugas.
- Admin/superadmin: sidebar terang, kartu statistik tanpa garis tren, banner antrean netral, tabel ganti 3 kartu sejajar.

**Tahap 4 - Deploy DEV**
- Gabungkan `feat/desain-clean-minimalis` ke branch `dev` (bukan `main`), push.
- Deploy dev lewat konsol user: `/root/deploy-env.sh /var/www/sisupit-dev dev <backupdir>` (sesuai memori
  "deploy via konsol user"). Production & staging TIDAK disentuh.

## 5. Blast radius
- Hampir semua halaman Inertia (token & komponen global). Tidak ada perubahan controller, route, migrasi, atau data.
- APK/iOS/desktop memuat web dev bila diarahkan ke dev.sisupit.com saja; aplikasi production tidak terpengaruh.
- Penjaga tes yang membaca markup/kelas (mis. LaporRaisedCircleTest, MobileNavTapAnimationTest, StatusBadge,
  ThemeRippleTest, BrandNameTest) kemungkinan perlu disesuaikan - diperbarui bersama perubahannya, tidak dimatikan.

## 6. Rencana verifikasi
- [ ] Baseline test sebelum: `php -d memory_limit=1G -d extension=php_sqlite3.dll -d extension=pdo_sqlite vendor/bin/pest`
      (baseline CLAUDE.md: 932 passed, 7068 assertions)
- [ ] Test sesudah tiap tahap hijau (penjaga yang berubah ikut diperbarui)
- [ ] `npm run build` lulus
- [ ] Tangkapan layar 390 px & 1440 px tiap layar utama dibandingkan dengan papan FigCraft
- [ ] Cek kepatuhan KESEPAKATAN-DESAIN.md (daftar 31 butir) sebelum serah
- [ ] Setelah deploy dev: cek HTTPS dev.sisupit.com (tamu, warga, petugas, admin), mode terang & gelap

## 7. Rollback
- Branch terpisah: `dev` dikembalikan ke commit sebelum merge (`git revert -m 1 <merge>` di branch `dev`) lalu
  deploy ulang dev. `main`/production tidak pernah tersentuh.

---

## Acceptance criteria
- [ ] Tampilan dev sesuai papan FigCraft dan KESEPAKATAN-DESAIN.md
- [ ] Tidak ada regresi fungsi (test >= baseline, penjaga diperbarui dengan alasan)
- [ ] Tidak ada commit ke `main`, tidak ada deploy production/staging
- [ ] Dokumen diperbarui di branch kerja (STATUS_LOG, task ini; CONVENTIONS hanya catatan "berlaku di branch ini")

---

## 8. Laporan pengerjaan (2026-11-04, putaran 1 - siap dilihat di dev)

Dikerjakan di worktree `.claude/worktrees/desain-clean`, branch `feat/desain-clean-minimalis` (dari main @640f0831).

**Fondasi (global, menjangkau semua halaman & peran):**
- `resources/css/app.css`: token terang baru (latar #FBFBF9 = `60 20% 98%`, teks `220 8% 7%`, garis `60 7% 90%`,
  abu muda `60 9% 94%`); font Plus Jakarta Sans menggantikan Inter; `.material-chrome`/`.material-thick` jadi
  permukaan PADAT tanpa blur; blok penetral di akhir berkas: latar tint `bg-{destructive,primary,info,success,
  warning,teal,volunteer}/{5,10,15,20}` -> `hsl(var(--muted))` dan `backdrop-blur-*` -> none (tanpa !important,
  menang urutan). Token mode gelap BELUM disentuh.
- `tailwind.config.js`: font sans + `boxShadow` semua ukuran = none.
- Sisa bayangan/gradien arbitrer dicabut: `ui/sonner.jsx`, `section-cards.jsx`, overlay foto Login/Register
  (gradien -> `bg-black/55`), lembar Kirim di `Front/Reports/Create.jsx`.

**Komponen bersama:** `StatusBadge` = pil putih bertitik warna status; `ReportProgress` (stepper) = hitam
(lewat, centang) / merah (aktif, cincin + titik) / abu (berikutnya); `NavLink` sidebar aktif = abu muda + teks
gelap tebal; `InfoShell` Callout darurat = kartu putih bergaris; bilah bawah tanpa bayangan/cahaya, slot aktif
teks gelap, label Lapor selalu merah (tebal saat aktif).

**Layar:** Beranda warga (kartu darurat putih: judul + tombol merah "Lapor Darurat" + tombol garis "Telepon
Damkar <nomor tenant>", lencana relawan jadi pil bertitik); Spotlight `/` (lingkaran latar, kemiringan &
hover dicabut, ikon pendamping netral); form lapor (jenis kejadian = chip pil, aktif garis merah tanpa tint;
judul seksi kalimat biasa, bukan huruf kapital kecil).

**Penjaga tes diperbarui (bukan dimatikan):**
- `AppleDesignMaterialTest`: dibalik - material wajib padat tanpa blur (kesepakatan desain melarang kaca).
- `MobileNavIconGlyphTest`: label Lapor `'font-bold text-destructive' : 'font-semibold text-destructive'`.
- `LaporRaisedCircleTest`: lolos dengan `shadow-none` di cincin (pola `ring-destructive/30 ` tetap).
- `ButtonBrandColorTest`: titik stepper memakai `text-card` (bukan `text-background`) - bukan tombol hitam.

**Verifikasi:** Pest penuh **914 passed, 6856 assertions, 0 gagal** (914 = baseline commit 640f0831; angka 932
di CLAUDE.md memuat `AppReviewTest.php` TASK_86 yang belum di-commit di working tree utama). `npm run build`
lulus. Tangkapan layar lokal desktop: Spotlight & form lapor sesuai.

**Belum (putaran berikutnya, menunggu tanggapan user setelah melihat dev):** token mode gelap, ikon khas Sisupit
sebagai komponen React, cekungan bilah bawah, perombakan per layar dashboard petugas/relawan/OPD/pejabat/admin
(saat ini hanya mewarisi fondasi), halaman Thanks/Show, uji visual 390 px di HP.

## 9. Laporan pengerjaan putaran 2 (2026-11-04)

Dev terverifikasi HTTPS memakai build putaran 1 (app-B13TWWPP.js / app-Cevpsh2J.css, Plus Jakarta Sans termuat).

- **Satu aksen merah:** tombol pekat biru/hijau/kuning -> `primary` (merah brand): Show.jsx (Meluncur, Tiba,
  Selesai, gabung, centang), Resolution/Create (kedua varian), Volunteers/Show, VolunteerAction, avatar Profil.
  Lencana dekoratif -> netral: avatar relawan di Show (`bg-muted`), "Buat Laporan" di dashboard petugas (pil
  bertitik kuning), NavLinkResponsive (legacy).
- **Tanpa animasi hover / denyut:** 17 kelas `hover:scale|translate|rotate|shadow` dicabut di 13 berkas (termasuk
  string HTML marker Leaflet); `animate-pulse` dicabut dari tombol Show, ikon misi petugas, langkah form fasilitas,
  titik Realtime dashboard admin.
- **Tanpa ungu:** `--volunteer` terang 271 76% 53% -> 215 19% 35% (#475569, sama dengan desain), gelap 215 16% 65%.
  `/guideline` tetap mendokumentasikan palet lama (halaman panduan, tidak diubah).
- **Ikon khas Sisupit:** `Components/SisupitIcons.jsx` dibangkitkan dari `ikon.py` (Hydrant, SKKL, Pos, Regu,
  Relawan, Sirine, Pohon, APAR, Siaran; stroke currentColor, kontrak props Tabler). Dipakai di navItems (sidebar +
  popover bilah bawah: Hydrant, SKKL, Pos Pemadam, Daftar Relawan, Manajemen Hydrant) dan 6 halaman fasilitas lewat
  impor alias (`IconSisupitHydrant as IconFireHydrant` dst.). `IconDroplet` di Admin/Hydrants (= tandon) sengaja tetap.
  Kebakaran & Armada tetap Tabler IconFlame/IconFiretruck.
- **Pil status fasilitas:** komponen baru `Components/DotPill.jsx` (pil putih bergaris + titik) di Hydrants,
  Pumps, FireStations publik dan Admin/Hydrants.
- **Chip filter aktif = garis merah** (sama dengan chip form lapor) di 8 berkas: Hydrants, Pumps, Admin
  FireStations/Hydrants/Pumps/Reports/Units, ReportFilterFields.
- Token gelap lain sudah netral (0 0% 6-15%) - tidak diubah.
- Penjaga `AppleDesignMaterialTest` "imports every tabler icon": kedua sisi impor alias (`X as Y`) kini dihitung
  sebagai nama dikenal. Pest penuh 914 passed, 6866 assertions; `npm run build` lulus.

**Sengaja TIDAK dikerjakan (butuh keputusan user):**
- (DIKOREKSI user 2026-11-04, lihat bagian 10) Butir "tanpa skeleton / S&K / Kebijakan Privasi" sempat dibaca
  sebagai larangan. Maknanya terbalik: ketiadaannya ciri vibe-coded, jadi keduanya WAJIB ada - sudah ada di kode.
- Cekungan bilah bawah: geometri bilah dikunci LaporRaisedCircleTest (#189) - menunggu konfirmasi.

## 10. Putaran 3 (2026-11-04) - keputusan user "skeleton pertahankan, cekungan terapkan"

Dev terverifikasi HTTPS memakai build putaran 2 (app-BCXIjJER.js / app-B8rzDiuR.css).

- **Skeleton = WAJIB ADA, bukan pengecualian** (koreksi user): di daftar vibe-coded, "tidak ada skeleton
  loading", "tidak ada S&K/Kebijakan Privasi", dan "tidak ada demo produk asli" adalah CIRI aplikasi vibe-coded -
  ketiadaannya yang ketahuan. Kerangka navigasi TASK_70 dan halaman legal karena itu SESUAI kesepakatan.
  KESEPAKATAN-DESAIN.md diperbaiki (bagian baru "Wajib ada"). Jangan pernah cabut kerangka atau halaman legal
  atas nama kesepakatan ini.
- **Cekungan bilah bawah DITERAPKAN** (`MobileBottomNav.jsx`, komponen `NavNotchBackground`):
  - bentuk dari `bottom_nav` generator desain, diskalakan ke bilah 56px: tepi atas melengkung turun 10px sampai
    garis tengah lingkaran Lapor, celah 4px dari cincin, SVG tengah 120px + dua sisi datar `material-chrome`;
  - lengkung sengaja TAK membungkus bawah lingkaran (label "Lapor" mulai y 30px);
  - ceruk diisi `--background` supaya konten yang tergulir tak mengintip lewat celah (uji 390px);
  - kontainer `fixed bottom-0` tak lagi dicat (persegi menutup cekungan); geometri lingkaran/label TIDAK berubah.
- Penjaga disesuaikan: `AppleDesignMaterialTest` (material bilah dibaca dari potongan sisi datar),
  `KeyboardOpenLayoutTest` (regex kontainer tanpa awalan material-chrome; perilaku sembunyi saat keyboard tetap).
- Verifikasi visual: chrome-headless-shell 390x844 @2x, /hydrants (diam) & /reports/create (aktif + halo).
- Pest penuh: 913 passed + 1 gagal ACAK (`ForumTest` "refuses cross-regency moderation": UNIQUE users.username -
  `UserFactory` membangkitkan username faker tanpa `unique()`); file itu lulus 5x berturut-turut (18/18). Di luar
  cakupan TASK_87 - temuan untuk FINDINGS_LOG di main (factory username pakai `fake()->unique()`).

## 11. Putaran 4 (2026-11-04) - dashboard per peran & sisa gradien

Dev terverifikasi HTTPS memakai build putaran 3 (app-C7rQ8Y4Y.js / app-0DXkTEWK.css) sebelum putaran ini dimulai.
Acuan: papan R02 (petugas), R09 (OPD), A01 (admin) di generator desain (`gen-sisupit-semua.py`).

- **Ikon jenis kejadian** (`lib/report-icon.js`, sumber tunggal 5 daftar): non-kebakaran kini kotak netral
  (`bg-muted`, ikon abu gelap); kebakaran tetap merah aksen.
- **Dashboard petugas:** lencana peran merah pekat -> `DotPill` bertitik merah; banner "menunggu verifikasi admin"
  & "Wilayah Aman" -> kartu putih bergaris, teks gelap (dulu kuning/hijau); banner insiden aktif TETAP bergaris
  merah (satu-satunya keadaan darurat); pil "Menunggu Admin" netral; antrean Berita Acara tanpa garis/ikon kuning.
  Teks "Ada {actionableCount} Insiden Aktif!" utuh (DashboardPerPeranTest).
- **Dashboard OPD:** callout "belum ditautkan" netral; "N insiden menunggu konfirmasi" bergaris merah + ikon merah
  (aksi yang diminta); ikon baris & teks konfirmasi tanpa kuning/hijau.
- **Dashboard admin/pejabat:** lencana peran -> `DotPill`; kartu "Darurat Aktif" saat > 0 = kartu putih bergaris
  merah + angka merah (dulu blok merah pekat berbayang + animasi zoom-in); tiga kartu lain ikon netral (dulu
  biru/teal); status Realtime teks abu + titik warna (terputus tetap merah); lencana "Penanganan" tanpa penimpa
  teal; legenda kartu Peta Pemantauan -> `DotPill` (tone `teal` baru di DotPill); pintasan Pos Armada netral;
  keadaan Laporan Kejadian pejabat -> `DotPill`.
- **Gradien terakhir dicabut:** `PublicPageHeader` & hero `Landing` (sisa `ui/table` hanyalah isi warna tunggal
  header lengket, bukan gradien - dibiarkan).

Verifikasi: `npm run build` lulus; Pest penuh 914 passed, 6866 assertions, 0 gagal (= putaran 3).

## 12. Putaran 5 (2026-11-04) - detail laporan & Thanks

Dev terverifikasi HTTPS memakai build putaran 4 (app-woOK0Q71.js / app-5IvUFyZA.css) sebelum putaran ini.

- **Detail laporan (`Front/Reports/Show.jsx`):**
  - kamus status milik halaman ini (`getReportStatus`/`getResponderStatus`) -> pil putih bergaris + titik `dot`
    berwarna sama dengan `StatusBadge`; dipasang di 5 tempat (judul, insiden gabungan, kandidat ganda, manifes
    petugas, daftar relawan). Ditolak/Selesai Tugas/Bersiap tetap abu tanpa titik.
  - callout kuning/biru/hijau (laporan ganda, panel tindakan, OPD terkait, Laporan Kejadian, dialog) -> garis abu,
    latar muted, teks gelap; lingkaran ikon dialog sukses netral (dialog berbahaya tetap merah).
  - tombol teal "Pengerahan Armada" -> merah primer (satu aksen), fokus `ring-ring`; ikon judul kartu abu;
    tautan biru -> `text-primary`; pilihan OPD tercentang = garis gelap + muted.
- **Thanks:** banner keselamatan bergaris merah dengan teks gelap + ikon merah (pola callout OPD); lingkaran centang
  hijau -> netral; ikon info kuning -> abu.
- Show.jsx asli belum bersih prettier, jadi prettier TIDAK dijalankan (diff minimal).
- Penjaga diperbarui (bukan dimatikan): `AppleDesignMaterialTest` "reworks the remaining front pages" dulu mewajibkan
  `rounded-full bg-success/10` di Thanks; kini mewajibkan lingkaran `rounded-full bg-muted` dan melarang `bg-success/10`.
- Verifikasi: `npm run build` lulus; Pest penuh 913 passed + 1 gagal (penjaga di atas, sebelum diperbarui);
  sesudahnya AppleDesignMaterialTest 32/32 lulus -> 914 passed (= putaran 4).

## 13. Putaran 6 (2026-11-04) - layar admin selain dashboard

Dev saat putaran ini dimulai masih memakai build putaran 4 (putaran 5 belum dideploy).

- **Verifikasi laporan (`Admin/Reports/Index.jsx`):** `STATUS_META.badge` netral + titik `dot` di pil status
  lokal; `pin` (marker peta) tetap berwarna. Chip triase `ok`/`warn` netral, `danger` tetap merah.
  Field `ring` di kamus memang tak dipakai di mana pun - dibiarkan (di luar cakupan).
- **Armada (`Units/Index`):** pil Siap/Dikerahkan netral + titik; kotak ikon teal -> netral.
- **Fasilitas (Pos, Hydrant, Pompa admin):** kotak ikon biru -> netral (rusak tetap merah); ikon Ringkasan Air
  Desa abu; lencana varian hydrant (teal) -> pil netral. Warna marker peta (`iconColor`) tidak diubah.
- **Pil status sederhana:** Pengumuman (Aktif), Banjar (Usulan Warga), Tenant (Aktif/Nonaktif) -> pil bertitik.
- **Callout form biru/kuning -> netral:** Instansi Create/Edit, Kontak Email Create, Pengaturan Email, Ubah Armada.
- Hover ikon aksi `hover:text-info|success` -> `hover:text-foreground` (7 tombol); teks kuning di daftar Instansi,
  Pengguna ("Belum ada HP"), dan paginasi Tenant -> gelap; ikon HP hijau di Pengguna -> abu.
- Verifikasi: `npm run build` lulus; Pest penuh 914 passed, 6867 assertions, 0 gagal.

## 14. Putaran 7 (2026-11-05) - mode gelap

Dev terverifikasi HTTPS memakai build putaran 6 (app-NO3FOaeu.js / app-yzrcfytH.css) sebelum putaran ini.
Desain FigCraft belum punya papan gelap; acuan = kesepakatan desain (bukan hitam/putih murni, tanpa ungu, satu aksen).

- **Token `.dark` di `app.css`:** abu netral dingin (`0 0% 6/8/12/15%`) -> gelap HANGAT senada sisi terang (hue 60):
  latar #121211 (`60 3% 7%`), kartu `60 3% 10%`, muted `60 3% 14%`, garis `60 3% 18%`, teks #F5F5F3 (`60 9% 96%`,
  bukan putih murni), teks redup `60 3% 64%`, `--ring` = teks. Grafik `--chart-*` = palet sisi terang (dulu biru/ungu
  khusus gelap - ungu dilarang). Sidebar mengikuti; `--sidebar-primary` biru -> teks terang. Merah brand tidak diubah.
- **`theme-color` (status bar HP) di `app.blade.php`:** #fafafa -> #fbfbf9, #0f0f0f -> #121211 (= latar baru).
- **Sisa warna mentah Tailwind:** label "Aktif" hijau di Pengaturan, ikon judul peta teal di Hydrant publik, centang
  emerald di Tenant -> netral.
- **Kotak ikon fasilitas publik** (Pos, Hydrant, Pompa) biru -> netral (rusak tetap merah), sama dengan versi admin;
  hover hijau di Pos publik -> netral; ikon baris Profil (biru/teal) -> netral.
- Sengaja TIDAK diubah: indikator keakuratan GPS di form lapor (area peta yang disetujui user); Peta Pemantauan
  (warna peta boleh); `Home.jsx` (/home dialihkan 301, #218).
- Verifikasi visual: chrome-headless-shell 390x844 @2x, `php artisan serve` dari worktree, skema gelap & terang
  dipaksa (`--blink-settings=preferredColorScheme`): /hydrants & /reports/create terbaca, latar hangat, satu aksen merah.
- Temuan di luar cakupan: header masih menampilkan tagline merah kapital "SISTEM UNTUK PELAPORAN DINI TERINTEGRASI"
  (bawaan main; #217 menyebut tagline dibuang dari judul/meta - perlu dicek user apakah header juga dimaksud).
- Verifikasi: `npm run build` lulus; Pest penuh 914 passed, 6867 assertions, 0 gagal.

## 15. Putaran 8 (2026-11-05) - audit kepatuhan KESEPAKATAN-DESAIN.md

Dev terverifikasi HTTPS memakai build putaran 7 (app-DGA8hLH6.js) sebelum putaran ini.
Sapuan `resources/js` per kategori larangan; yang masih tersisa di kode yang DIPAKAI dibereskan:

- **Ikon Lucide -> Tabler** di 17 berkas hidup (DialogRelawanDetail/List, MultiSelect, ReportCard, ThemeSwitcher,
  ui/calendar, toast, carousel, radio-group, sheet, command, dropdown-menu, sidebar, dialog, checkbox, combobox,
  select): impor alias `IconX as X` (pola putaran 2), pemakaian JSX tak berubah. `WandSparkles` (ikon kilau,
  dilarang) -> `IconWand`; `ShieldAlert` -> `IconShieldExclamation`; `PanelLeft` -> `IconLayoutSidebar`.
  ReportCard `strokeWidth` -> `stroke` (nama prop Tabler).
- **Animasi hover/denyut:** titik "Laporan Masuk" ReportCard tak lagi berdenyut; foto ReportCard tak membesar saat
  hover, label "Perbesar" selalu tampil di pojok (ponsel tak punya hover). Landing (`/landing`): ping, kotak api
  miring + putar saat hover + bayangan merah, dan dua lingkaran tint konsentris (orb radial) dibuang.
- **Efek kaca (backdrop-blur):** header PublicLayout & pil peta admin (Pos/Hydrant/Pompa Edit) jadi solid;
  overlay Dialog/AlertDialog/filter Peta Pemantauan/peta misi petugas tanpa blur; tombol hapus foto tanpa blur.
- Sengaja TIDAK diubah: berkas mati (app-sidebar, nav-*, data-table, section-cards, breadcrumb, calendar1,
  navigation-menu, pagination, HelpConfirmAlertDialog, AuthenticatedLayout + ResponsiveNavLink ber-border-l-4,
  Home.jsx - /home 301); `Guideline.jsx` (dokumen gaya lama, menyebut Inter - halaman /guideline); `lucide-react`
  tetap di package.json karena berkas mati masih mengimpornya; skeleton `animate-pulse` (umpan muat, WAJIB ada);
  MultiSelect `animate-bounce` (hanya bila prop `animation`, tak ada pemakai). Em dash tersisa = komentar kode saja.
- Bayangan & tint: sudah dinetralkan global sejak putaran 1 (boxShadow none + blok penetral app.css).
- Verifikasi: `npm run build` lulus; Pest penuh 914 passed, 6867 assertions, 0 gagal (= putaran 7).

## 16. Putaran 9 (2026-11-05) - cek HTTPS dev + sisa warna status

Dev terverifikasi HTTPS memakai build putaran 8 (app-DdN30nMo.js) sebelum putaran ini. Playwright (playwright-core
1.64 di folder tmp job, di luar repo) 390x844 @2x + 1440x900, skema terang & gelap: tamu (/, /login, /hydrants,
/reports/create), petugas1 (/dashboard), admin@denpasar.go.id (/dashboard, /admin/reports, ponsel & desktop).
Semua 200, tanpa error JS (satu-satunya error konsol = izin lokasi ditolak di headless). Akun seeder warga3 tidak
ada di salinan data prod dev -> layar warga belum dicek (sengaja tidak memakai akun warga asli).

Temuan & perbaikan (garis/ikon/teks berwarna status lolos dari penetral latar tint putaran 1):
- **Banner "Belum ada HP yang menerima sirine"** (NotificationDeviceBanner, dashboard petugas/relawan): garis &
  ikon kuning -> pola banner keselamatan Thanks (garis merah tipis, kartu putih, ikon merah, teks gelap), hover
  tanpa transisi.
- **Kartu "Notifikasi di HP ini"** (NotificationDeviceCard): chip ikon hijau -> netral gelap, kuning -> merah.
- **Popover Fasilitas bilah bawah:** ikon biru/teal/slate per jenis -> `FASILITAS_ITEM_TONE = {}` (netral seperti
  popover Menu: ikon abu, baris aktif merah).
- **Pil status relawan** (Volunteers/Show & Index) -> `DotPill` (Siaga = titik hijau).
- Ikon Android hijau di Login & Profil, alert "tersimpan" hijau di Profil, callout kuning form email, ikon pin
  biru daftar pompa publik -> netral.
- Sengaja TIDAK diubah: warna pin misi petugas (marker peta), Peta Pemantauan, indikator GPS form lapor,
  teks "Tersimpan." hijau kecil (umpan balik form).
- Verifikasi: `npm run build` lulus; Pest penuh 914 passed, 6867 assertions, 0 gagal (= putaran 8).

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

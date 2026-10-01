# TASK_69 — Lapisan platform ponsel (skill mobile-native, ask-sonner, apple-design)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_69 |
| Severity | P2 |
| Tipe | bugfix (rupa/rasa sentuh) |
| Sumber | permintaan user 2026-10-01 + FINDINGS_LOG #159 |
| Status | DONE (kode) - branch `feat/mobile-native-polish`, belum di-merge/deploy |

---

## 1. Deskripsi masalah / tujuan

User memasang tiga skill dari `github.com/emilkowalski/skills` (`mobile-native`, `ask-sonner`,
`apple-design`) ke `.claude/skills/`, lalu meminta: "buatkan 1 branch yang menggunakan ketiga skill
baru ini dan audit serta perbaiki tampilannya sesuai skill ini". Rencana disetujui user ("setuju,
lanjutkan"); dua keputusan yang belum dijawab diambil ke arah paling hati-hati dan bisa diubah:
**A(1)** `theme-color` tetap merah brand, **B(1)** reduced motion hanya di primitif.

## 2. Reproduce

Tak satu pun gejalanya muncul di emulasi perangkat Chrome desktop (Hard Rule 5 skill `mobile-native`),
jadi buktinya statis: `MobileNativeBaselineTest` (10 kasus) MERAH terhadap kode `main` @3aa3fb00.
Audit: `hover:` 461 pemakaian vs `active:` 16; `tailwind.config.js` tanpa `future`; `app.css` tanpa
tap-highlight/touch-action; `button.jsx` tanpa `active:`; `CommandInput` `text-sm`; `Show.jsx:1944`
`<select>` `text-xs`; `ui/sonner.jsx` `import { useTheme } from 'next-themes'` padahal `app.jsx`
memasang `Components/ThemeProvider`; `Monitoring/Map.jsx` `h-[calc(100vh-8rem)]`/`h-screen` tanpa
`lg:`; nol aturan `prefers-reduced-motion` di luar `Guideline.jsx`.

## 3. Root cause

Lihat FINDINGS_LOG #159 - delapan butir. Yang sudah BENAR dan tidak disentuh: `viewport-fit=cover`,
safe-area bilah bawah & tombol Kirim, `Input`/`Textarea` sudah `text-base md:text-sm`, satu `Toaster`
di AppLayout, area status bar & poni ditangani wrapper APK (`mobile/PERILAKU_WEBVIEW.md` #7/#8).

## 4. Perubahan

- `tailwind.config.js` — `future.hoverOnlyWhenSupported: true`.
- `resources/css/app.css` — `html` tap-highlight transparan + text-size-adjust; `button, [role=button]`
  `touch-action: manipulation` + `user-select: none`.
- `Components/ui/button.jsx` — `active:scale-[0.97]`, transisi 100ms ease-out (warna + transform),
  `motion-reduce:active:scale-100`.
- `Components/ui/{dialog,alert-dialog}.jsx` — `motion-reduce:animate-none` di Content.
- `Components/ui/command.jsx` — `CommandInput` `text-base md:text-sm`; `CommandList` `overscroll-contain`.
- `Components/ui/sonner.jsx` — `useTheme` dari `@/Components/ThemeProvider`.
- `Pages/Front/Reports/Show.jsx` — `<select>` armada `text-base md:text-xs`.
- `Layouts/AppLayout.jsx` (daftar lonceng), `Layouts/Partials/MobileBottomNav.jsx` (`FloatingPanel`),
  `Components/TimePicker.jsx` — `overscroll-contain`.
- `Pages/Monitoring/Map.jsx` — `h-dvh` / `h-[calc(100dvh-8rem)]` (desktop `lg:` tetap `vh`).
- `tests/Feature/Sisupit/MobileNativeBaselineTest.php` — BARU, 12 test.

**Sengaja TIDAK** (bertentangan keputusan user / aturan repo): bilah tembus pandang & blur
(`apple-design` §12 - liquid glass dibatalkan #106), sheet/drawer bergestur (popover 2026-08-13),
pegas Motion (dependensi baru), `overscroll-behavior: none` di root (APK #150), `theme-color` per
skema (keputusan A, ditunda), `user-select: none` di `a`/`body`.

## 5. Blast radius

- `hoverOnlyWhenSupported` mengubah SEMUA `hover:` (desktop tetap sama; layar sentuh kehilangan hover
  yang memang tak semestinya ada). Umpan balik sentuh kini dari `active:` - yang sudah ada 16 tempat
  (AppListRow dll.) + seluruh `<Button>`.
- `Button` dipakai di hampir semua halaman - kini mengecil 3% saat ditekan. `disabled` tetap
  `pointer-events-none` sehingga tombol mati tak bereaksi.
- `user-select: none` pada `button`: teks di DALAM tombol tak bisa diblok. Kalau ada konten yang
  perlu disalin tapi dibungkus `<button>`, keluarkan dari tombolnya.
- Toast kini ikut ThemeSwitcher; yang tak pernah memakai switcher (tema `system`) tak melihat beda.

## 6. Verifikasi

- [x] Baseline sebelum: 621 passed (3003) - `memory_limit=1G` wajib, 128 MB habis di test ekspor zip.
- [x] Penjaga: 10 kasus MERAH terhadap kode lama; 2 kasus dialog MERAH lewat sabotase (`cmp`, pulih).
- [x] Sesudah: lihat laporan di bawah.
- [x] `npm run build` lulus; CSS produksi memuat 8 blok `@media (hover: hover)`, tap-highlight,
  `touch-action:manipulation`, `.h-dvh`, `100dvh - 8rem`, `active:scale-[0.97]`,
  `prefers-reduced-motion`, `overscroll-behavior:contain`.
- [ ] **Butuh ponsel sungguhan** (tak bisa dibuktikan dari kode): hover tak menempel di APK, tak ada
  kilatan saat mengetuk, tombol mengecil saat ditekan, kolom cari combobox tak me-zoom di iPhone/iOS
  wrapper, gulir daftar lonceng/combobox tak menyeret halaman, Peta Pemantauan pas di Chrome Android
  dengan bilah URL, toast gelap saat ThemeSwitcher = gelap sementara OS terang.

---

## 7. Bagian 2 — apple-design penuh (permintaan user 2026-10-01, PENGECUALIAN_ATURAN #5)

User: "lanjutkan sampai selesai dan khusus branch baru ini gunakan apple-design dan pengecualian desain
sebelumnya boleh diabaikan, khusus branch ini saja". Yang diterapkan (nomor bagian = skill apple-design):

- **§12 Material:** `.material-chrome` (latar 72% + blur 20px saturate 180%) di header AppLayout & bilah
  bawah; `.material-thick` (82% + blur 28px) di PopoverContent, DropdownMenuContent/SubContent,
  SelectContent, FloatingPanel bilah bawah. Pemisah header jadi garis rambut `border-border/60`.
  `Command` kini `bg-transparent` supaya lapisan padatnya tak menutup material popover yang memuatnya.
  Fallback padat: `@supports not (backdrop-filter)`, `prefers-reduced-transparency`, `prefers-contrast`.
- **§4 Pegas:** token `ease-spring` = `cubic-bezier(0.32, 0.72, 0, 1)` (teredam kritis, response
  ~0,3 dtk), dipakai dialog (300ms), popover/menu/select (200ms), panel bilah bawah (300ms).
- **§7 Konsistensi ruang:** permukaan melayang tumbuh dari pemicunya (`origin-[--radix-*-transform-origin]`,
  panel Menu `origin-bottom-right`, Fasilitas `origin-bottom`). Dialog masuk & keluar di jalur yang sama
  (fade + skala 95%) - geser serong `slide-*-top-[48%]` bawaan shadcn dicabut, diganti `1/2` simetris.
  Scrim `bg-black/40 backdrop-blur-[2px]` (dulu `/80`) - "redupkan untuk fokus".
- **§14 Reduced motion = cross-fade global** (menggantikan `motion-reduce:animate-none` di dialog):
  variabel skala/rotasi/geser tailwindcss-animate dinolkan sehingga SEMUA animasi masuk/keluar tinggal
  fade; `animate-bounce`/`animate-ping` berhenti. Tanpa `!important` - spesifisitas `html:root`.
- **§1 Respons:** slot bilah bawah `active:scale-[0.92]`.
- **§15 Tipografi:** `h1/h2/h3` tracking -0.022/-0.017/-0.01em, `font-optical-sizing: auto` (Inter
  dimuat bersumbu `opsz`).
- **Warna status bar:** `theme-color` per skema = latar header (#fafafa / #0f0f0f); APK tak terpengaruh.

**Bug lama yang ikut terbetulkan:** panel Fasilitas bilah bawah dipusatkan `-translate-x-1/2` tetapi
bingkai pertama keyframe `enter` menimpa `transform`, sehingga panel meluncur menyamping setengah
lebarnya setiap dibuka. Kini `slide-in-from-left-1/2` menjaga pemusatan selama animasi.

**Jebakan yang dihindari:** menolkan `--tw-enter-translate-*` untuk reduced motion akan MENCABUT
pemusatan dialog & panel Fasilitas selama animasi (melompat setengah layar) - karena itu elemen
ber-`translate-x-[-50%]` / `-translate-x-1/2` dikecualikan. `<meta name="color-scheme">` sengaja TIDAK
dipasang: ThemeSwitcher bisa memaksa terang saat OS gelap, dan meta itu akan menggelapkan kontrol &
batang gulir bawaan di halaman terang.

**Sengaja TIDAK dikerjakan:** pustaka pegas/gestur (dependensi baru), sheet bergestur dengan proyeksi
momentum (§5-§6 - bilah bawah memakai popover, bukan drawer), mengubah tombol merah brand / ikon bilah /
kerangka dashboard (apple-design tidak menuntutnya).

**Verifikasi bagian 2:** `AppleDesignMaterialTest` 12 test - 12 kasus MERAH terhadap HEAD (11 berkas
diganti versi HEAD, dipulihkan byte-exact), sabotase `bg-card` di bilah bawah MERAH. Build lulus; CSS
produksi memuat `.material-chrome`/`.material-thick`, `prefers-reduced-transparency`, kurva pegas,
origin Radix, tracking judul, dan pengecualian pemusatan.
**Butuh ponsel:** keterbacaan teks di atas header/bilah kaca di mode terang & gelap, kinerja blur di
ponsel lama (backdrop-filter mahal di GPU lemah), rasa pegas dialog/popover.

## 8. Bagian 3 — /admin/users (Index, Create, Edit) ke rupa apple-design (permintaan user 2026-10-01)

User: "cek pada tampilan /admin/users masih tampilan lama, perbaiki sampai ke semua isiannya, tombol card
warna dan semuanya". LOGIKA TIDAK DISENTUH (filter, urut, dialog peran, gerbang tingkat/OPD, submit) -
hanya rupa.
- **Form Tambah & Edit:** isian dikelompokkan "inset grouped" lewat komponen BERSAMA BARU
  `Pages/Admin/Users/Partials/UserFormParts.jsx` (`FormSection`, `FormField`, `LockedField`,
  `SegmentedControl`) - grup Identitas / Kata sandi / Wilayah akun / Peran. Jenis kelamin jadi segmented
  control (2 pilihan, satu ketukan). Isian h-11 rounded-xl + `type`/`inputMode`/`autoComplete` yang benar
  (email, tel, new-password). Edit menampilkan avatar + nama di kepala, kata sandi bertanda "kosongkan
  bila tidak diubah". Tombol: "Simpan pengguna"/"Simpan perubahan" (primer), "Atur ulang" (ghost),
  "Kembali" (outline bulat) - tak ada lagi varian gradien `orange`, teks "Save"/"Reset", maupun
  placeholder "Masukan ...".
- **Daftar:** peran tampil dengan `roleLabel`/`roleTone` (dulu nama mentah `petugas`); aksi baris =
  tombol ikon netral (Peran, Ubah) + Hapus merah - dulu tiga tombol gradien hijau/biru/merah; kolom cari
  berikon `type="search"`; "Atur ulang" ghost (dulu tombol MERAH untuk aksi yang tak berbahaya); kepala
  kolom menampilkan arah urut kolom aktif (+`aria-sort`); kartu ponsel dengan baris aksi bergaris rambut;
  keadaan kosong; "Menampilkan X-Y dari Z pengguna" (dulu salah ketik "Menamplikan"). Dialog Hapus &
  Peran berbahasa Indonesia ("Batal"/"Hapus", "Simpan peran"; dulu "Cancel"/"Continue"); pilihan peran
  jadi daftar bergaris dengan baris terpilih bertint.
- **Penjaga:** kasus baru di `AppleDesignMaterialTest` - ketiga halaman tanpa varian gradien & teks
  Inggris, Create/Edit memakai FormSection + SegmentedControl, Index memakai roleLabel. MERAH terhadap
  ketiga berkas lama (pulih byte-exact). Suite 643 -> 644 passed (3100).

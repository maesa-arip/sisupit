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

## 9. Bagian 4 — seluruh halaman admin (permintaan user 2026-10-01: "perbaiki juga halaman admin lainnya")

Sekitar 50 halaman di `Pages/Admin` memakai templat CRUD yang SAMA, jadi perbaikannya dua lapis:
1. **Primitif bersama** (berlaku ke semua halaman sekaligus, juga di luar admin):
   - `Button`: varian gradien lama dibuang. `default`/`orange` = merah brand padat + bayangan halus;
     `red`/`blue`/`green` = isian TINTED ala iOS (`bg-*/10 text-*`), `purple` = sekunder; radius
     `rounded-lg`. `destructive` TETAP merah padat.
   - `Card` `rounded-2xl border-border/70 shadow-sm`; `Table` kepala kolom huruf kecil kapital bertracking
     di atas latar `bg-muted/40`, baris bergaris rambut; `Badge` jadi pil; `Input`/`Textarea`/`SelectTrigger`
     `rounded-lg`.
   - **Jebakan yang dihindari:** dua tombol "Lapor Darurat" di Forum (`ForumParts.jsx`) memakai varian
     `red`; men-tint `red` akan memudarkan ajakan darurat. Keduanya dipindah ke `destructive` (merah padat)
     LEBIH DULU, dan dijaga test.
2. **Sapuan teks** (58 penggantian di 21 berkas): "Apakah anda benar benar yakin ?" -> "Hapus data ini?",
   kalimat "menghapus data anda ... dari server kami" diluruskan, Cancel/Continue/Reset/Save ->
   Batal/Hapus/Atur ulang/Simpan, "Menamplikan" -> "Menampilkan" (angka tak lagi kuning), "Search" ->
   "Cari...", "Masukan" -> "Masukkan", tombol "Bersihkan" merah -> ghost.

Penjaga: dua kasus baru di `AppleDesignMaterialTest` (teks lama di seluruh `Pages/Admin`; varian tinted +
Lapor Darurat Forum tetap padat) - keduanya MERAH terhadap 26 berkas versi HEAD, pulih byte-exact.
Suite 644 -> 646 passed (3108). Halaman yang belum disentuh per berkas (Hydrants/Pumps/FireStations dll.)
ikut berubah lewat primitif; rombak tata letak per halaman seperti /admin/users belum dilakukan.

## 10. Bagian 5 — Hydrant & SKKL dirombak seperti Pengguna (permintaan user 2026-10-01)

User: "rombak juga halaman hydrants dan pumps seperti users". Logika peta, geocode, filter, banjar, dan
hapus TIDAK disentuh.
- **Komponen bersama dipindah:** `Pages/Admin/Users/Partials/UserFormParts.jsx` -> `Components/GroupedForm.jsx`
  (git mv), karena kini dipakai lebih dari satu modul; Users mengimpornya dari sana.
- **Index (Hydrants & Pumps):** modal hapus buatan sendiri `fixed z-[9999]` -> `AlertDialog`; kartu per
  aset -> SATU kartu bergrup berbaris garis rambut (baris `role="button"` + Enter/Spasi); cari
  `type="search"` h-11; tombol tambah pil primer (dulu teal/info padat); chip & paginasi aktif primer;
  status pill `rounded-full`; ringkasan air desa & wadah peta sebentuk kartu lain; "Lihat di peta".
- **Form Tambah/Ubah (4 berkas, satu skrip berpenjaga jumlah-cocok):** kartu tunggal dipecah jadi kartu
  bergrup - keterangan wewenang, Cari lokasi, Area yurisdiksi, **Detail fasilitas** (baru, membungkus
  nama..catatan), Koordinat. Isian h-11 rounded-xl tanpa cincin teal; Kembali outline-pil, Atur ulang
  ghost, Simpan primer; chip langkah di peta primer / material; "Auto-detected" -> "Terdeteksi otomatis".
- **Penjaga:** kasus baru di `AppleDesignMaterialTest` (Index: AlertDialog, tanpa z-[9999], daftar
  bergrup, search; form: grup Detail fasilitas, tanpa kartu `p-6` lama, tanpa teal, Simpan primer) +
  Users wajib mengimpor `@/Components/GroupedForm`. Keduanya MERAH terhadap 8 berkas versi HEAD, pulih
  byte-exact. Suite 646 -> 647 passed (3134).

## 11. Bagian 6 — Pos Pemadam dirombak seperti Pengguna (permintaan user 2026-10-01)

`Pages/Admin/FireStations/{Index,Create,Edit}.jsx` salinan templat yang sama dengan Hydrant/SKKL, jadi
skrip transformasi yang sama dipakai ulang (berpenjaga jumlah-cocok, cadangan + pulih otomatis):
modal `z-[9999]` -> `AlertDialog`, daftar satu kartu bergrup (+Enter/Spasi), cari `type="search"`, chip
status kini `flex-wrap` & primer (dulu aksen merah destructive untuk SEMUA keadaan aktif), tombol tambah
pil primer; form dipecah jadi kartu bergrup (Detail fasilitas dst.). Penjaga hydrant/SKKL di
`AppleDesignMaterialTest` diperluas ke FireStations - MERAH terhadap 3 berkas HEAD, pulih byte-exact.
Suite 647 passed (3146 assertions).

## 12. Bagian 7 — semua halaman (permintaan user 2026-10-01: "rombak semua halaman")

91 berkas halaman; 19 sudah dirombak penuh (Users, Hydrant, SKKL, Pos Pemadam + komponen bersama).
Sisanya dikerjakan BERTINGKAT menurut templat, bukan ditulis ulang satu per satu:
- **7a, form & daftar CRUD admin** (Roles, Permissions, RouteAccesses, Announcements, AssignPermissions,
  Agencies, MailContacts, Units, Mail, Settings, NotificationLevel, Tenants, Banjars): skrip berpengurai
  tag `<Button>` (atribut `onClick={() => ...}` memuat '>' yang mematahkan regex) - Kembali outline-pil,
  Simpan primer h-11, Atur ulang ghost, "Uji koneksi" outline, kartu form `max-w-2xl` di tengah. Modal hapus
  `z-[9999]` di 4 Index -> `AlertDialog`; rujukan `state.x` di keterangannya diubah ke `state?.x` karena
  Radix tetap merender konten selama animasi tutup saat state sudah null (tanpa itu: TypeError tepat saat
  dialog ditutup). Aksen teal dekoratif Units & aksen SELEKSI Verifikasi Laporan -> primer; teal status
  "Penanganan" (keputusan produk) TETAP.
- **7b, radius seluruh halaman:** `rounded-md` dihapus dari semua halaman (kecuali Guideline & dead code
  Front/Settings) - kotak berbingkai & tombol merah besar `rounded-xl`, sisanya `rounded-lg` (272 baris).
  Tombol "Lihat Detail" popup Peta Pemantauan ikut `rounded-lg` karena penjaganya
  (`LeafletPopupLinkContrastTest`) mengunci bentuknya = Button `destructive`, dan Button kini `rounded-lg` -
  test itu diperbarui, niatnya tetap.
- **Sengaja TIDAK:** tombol submit halaman depan sempat ikut tersapu skrip 7a lalu DIKEMBALIKAN dari
  cadangan - kelasnya buatan tangan sehingga tambahan kelas menumpuk & bertentangan; halaman itu cukup lewat
  primitif + radius. Struktur Form Lapor (1.437 baris) & Detail Insiden (2.903 baris) TIDAK dirombak
  (jalur darurat, banyak penjaga) - keduanya ikut lewat primitif & radius saja. Gradien di Login/Register
  (scrim foto) & Landing (hero) bukan sisa gaya lama, dibiarkan.
- Penjaga: `AppleDesignMaterialTest` + kasus radius (MERAH terhadap Login HEAD). Suite 648 passed (3147).

## 13. Koreksi user 2026-10-01 - menu terlalu transparan & bilah sistem APK tak ikut mode

- **Menu tembus:** "menu yang dibuka terlalu transparan, masih tabrakan terlihat dengan data dibelakangnya".
  `material-thick` 82% -> 96%, `material-chrome` 72% -> 85%. Penjaga kini mengunci BATAS MINIMUM
  (thick >= 0,95, chrome >= 0,85), MERAH terhadap CSS lama.
- **Status bar & navigation bar APK tak ikut mode gelap/terang** (di prod benar). AKARNYA DI WRAPPER, bukan
  web: prod memakai APK 1.1.4 (targetSdk 34), APK uji dev = 1.1.5 (targetSdk 36). Sejak targetSdk 35,
  Android 15+ memaksa edge-to-edge dan MENGABAIKAN `setStatusBarColor`/`setNavigationBarColor` - yang tampil
  di area bilah adalah LATAR view akar yang diberi padding inset (dipasang 1.1.5), yang tak pernah diwarnai.
  Ikon bilah tetap ikut mode lewat `setAppearanceLight*`, jadi di mode gelap: bilah putih + ikon terang.
  Fix di `MainActivity.java` (cadangan `.bak-insetbg`): view akar jadi field `rootView`, warnanya + decorView
  ikut warna halaman di `onBackgroundColorDetected`, dan `set{Status,Navigation}BarContrastEnforced(false)`
  (API 29+, tanpa itu bilah 3-tombol dilapisi scrim abu). **AAB Play Store 1.1.5 yang sudah dibangun
  MEMBAWA BUG YANG SAMA** - wajib dibangun ulang sebelum diunggah.

## 14. Bagian 8 - kebebasan penuh (user 2026-10-01: "khusus branch ini kamu bebas semua ... terapkan apple-design")

Isian yang DIWAJIBKAN server tidak dihapus (form tetap harus tersimpan); selebihnya bebas.
- **8a kerangka & tipografi:** `HeaderTitle` (60 halaman) jadi judul besar iOS (26-30px, petak ikon
  bertint hanya di layar lebar); `NavLink` aktif = sorotan bertint primer (dulu blok merah padat -
  menekuk #72 khusus branch ini); sidebar abu tipis + nama aplikasi; lonceng bulat; AppSection/AppList/
  AppListRow, ReportCard, StatCard bergaya apple; `StatusBadge` jadi pil. Sapuan seluruh JSX:
  `font-black`->bold, `tracking-wider/widest`->wide, `text-[10px]`->11px (197 token, 44 berkas).
- **8b halaman:** Profil ditata ulang ala Settings iOS (kepala identitas di tengah, grup bergaris rambut,
  "Keluar" baris merah di bawah; `roleLabel(`, `jurisdiction.kind === 'tugas'`, `#hapus-akun` tetap);
  partial profil & 6 halaman Auth (isian h-11, fokus primer lembut, judul besar); /hydrants, /pumps,
  /fire-stations jadi daftar bergrup.
- **8c kartu & judul:** kelas penimpa bentuk lama dicabut dari 39 `<Card>` di 19 berkas (kembali ke
  primitif 2xl/border tipis/bayangan halus; warna bermakna & className dinamis dibiarkan); skala judul
  seksi diseragamkan (38 judul, 14 berkas - headline 17px, label seksi 13px abu).
- Suite 648 passed (3153). Form Lapor & Detail Insiden: hanya lewat primitif, sapuan, & skala judul.

## 15. Bagian 9 - Form Lapor & Detail Insiden dirombak (user 2026-10-01: "rombak juga form lapor dan detail insiden")

LOGIKA TIDAK DISENTUH - hanya pembungkus & kelas; seluruh isi (handler, gerbang, teks yang dijaga test,
input tersembunyi, bilah Kirim sticky `bottom-[calc(4rem+...)]`) dipindah utuh. 12 berkas test yang membaca
kedua layar (120 test) hijau sebelum & sesudah.
- **Form Lapor (`Front/Reports/Create.jsx`):** kartu tunggal dicabut. Kini "Batal" bertint + judul besar,
  lalu LIMA kartu bergrup berjudul kecil di luar kartu: Lokasi kejadian (status GPS, peta lebih tinggi,
  alamat otomatis, catatan tujuan laporan) -> Wilayah kejadian (cari + 4 dropdown; DIPINDAH ke bawah peta
  karena ia koreksi atas titik) -> Jenis kejadian (tab = segmented control) -> Keterangan -> Foto.
  JEBAKAN yang dihindari: kartu seksi ditulis sebagai MARKUP, bukan komponen yang didefinisikan di dalam
  fungsi render - komponen seperti itu dipasang ulang tiap render dan peta Leaflet akan dibangun ulang tiap
  ketikan.
- **Detail Insiden (`Front/Reports/Show.jsx`):** bilah atas ala navigasi iOS ("Kembali" & "Ubah" bertint,
  judul besar tanpa huruf kapital semua, status pil + nomor laporan); 6 modal tanpa penimpa kotak lama;
  kepala kartu tanpa pita abu; 11 label medan mikro -> 13px; tombol/tautan kapital tebal -> normal; kepala
  tabel kehadiran regu normal-case; garis pemisah tipis. Tombol "Edit" pelapor kini berbunyi "Ubah".
- Penjaga baru di `AppleDesignMaterialTest` (5 judul seksi, tanpa <Card>, bilah sticky utuh; navigasi
  Kembali, judul tanpa uppercase, modal tanpa kotak lama) - MERAH terhadap HEAD. Suite 649 passed (3163).

## 16. Bagian 10 - Dashboard & Peta Pemantauan dirombak (user 2026-10-01)

- **Mode Kesiapan = satu komponen `Components/StandbyCard.jsx`** (baris ala iOS + SAKELAR, label keadaan
  "Siaga"/"Non Aktif" tetap di sampingnya). Dulu dua kartu kembar disalin tangan di dashboard relawan &
  pejabat - TASK_41 sampai mencatat "selalu ubah keduanya"; kini mustahil menyimpang.
- **Admin/pejabat:** sapaan tanpa bingkai (judul besar), statistik ala widget (angka 3xl-4xl tabular-nums,
  subjudul tanpa kapital, tekan mengecil), varian teal lama -> token `teal`, "Sistem Online" warna sukses,
  lencana pil, Pos Armada jadi baris.
- **Warga/relawan:** tab = segmented control, keadaan kosong kartu biasa, tombol/lencana tanpa kapital,
  kartu "Lapor Darurat" TETAP merah padat (ajakan darurat). **Petugas:** kartu aman teal -> token sukses,
  kepala peta taktis `material-chrome`, pil tanpa kapital. **OPD:** kotak peringatan 2xl.
- **Peta Pemantauan ala Apple Maps:** pita judul & tombol mengambang memakai material standar (dulu
  `bg-card/90` + blur buatan sendiri yang tak ikut koreksi opasitas), panel "Lapisan" jadi sheet kaca 2xl
  bergerak pegas, popup marker semibold + lencana pil (tombol "Lihat Detail" yang dijaga test tak disentuh).
- Penjaga baru (StandbyCard dipakai kedua dashboard tanpa salinan; peta tanpa blur buatan sendiri) - MERAH
  terhadap HEAD. `DashboardMobileShellTest` tetap hijau. Suite 650 passed (3171).

## 17. Bagian 11 - dashboard ponsel disederhanakan (user 2026-10-01: "dashboard terlalu rame dan susah di
baca ... sesuaikan dengan kaidah desain mobile")

Prinsip: satu hal terpenting di atas, satu aksi utama, yang sekunder baru muncul mulai `md`
(progressive disclosure). DESKTOP TIDAK BERUBAH - semua lewat `md:`/`max-md:`.
- **Petugas:** baris misi di ponsel hanya waktu (merah bila mendesak) + jarak; nomor laporan, lokasi, regu
  baru mulai `md` (dulu sampai 5 metadata per baris). Teks "Wilayah Yurisdiksi Anda" (tanpa informasi)
  DICABUT; lencana "Petugas Damkar" tanpa kapital; keterangan kartu status disembunyikan di ponsel.
- **Admin/pejabat:** statistik ponsel = angka + label saja (petak ikon mulai `md`); daftar insiden ponsel
  tanpa lokasi & maks 5 baris; yurisdiksi hanya desktop.
- **Warga/relawan:** riwayat ponsel = waktu relatif (`timeAgo`), tanpa lokasi, maks 3 baris + "Lihat semua";
  meta sapaan dirampingkan. ReportCard di ponsel: deskripsi disembunyikan, foto lebih pendek.
- **Bug ikutan diperbaiki:** kelas tekan kartu "Lapor Darurat" tertulis `active:scale-\[0.98\]` (backslash
  terbawa regex bagian 10) - kelas tak sah, efek tekan tak pernah jalan. Pemeriksaan di seluruh JSX: tak ada
  kelas rusak serupa.
- Penjaga baru (MERAH terhadap HEAD). Suite 651 passed (3180).

## 18. Bagian 12 - halaman berstatus B & C dirombak (user 2026-10-01/02: "rombak semua yang statusnya B dan C")

Dikerjakan per keluarga templat (skrip berpenjaga jumlah-cocok, cadangan + pulih otomatis):
- **Daftar:** OPD, Penerima Email, Armada, Banjar, Kotak Email, Riwayat Laporan, Forum, Regu, Verifikasi
  Laporan -> satu daftar bergrup; Roles/Permissions/Akses Rute/Hak Akses -> kartu ponsel ala /admin/users.
  JEBAKAN: membungkus ekspresi `.map()` di dalam ternary dengan `<div>` tanpa `{}` membuat sebagian JSX jadi
  TEKS mentah - sintaksnya sah sehingga prettier diam; diperiksa & dibungkus `{...}`.
- **Form (25):** tiap ANAK LANGSUNG <form> jadi baris bergaris rambut
  (`divide-y [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0`) - satu pola untuk form berisian tunggal
  maupun berkolom; garis atas baris tombol dicabut. Primitif Input/Select/Combobox/Button default h-10.
- **Layar tunggal:** Terima kasih = layar konfirmasi iOS; Relawan = baris kontak di ponsel + profil kartu kontak;
  Forum = pil & tipografi baca; Info (InfoShell) = lebar baca max-w-3xl, teks 15px; Galat = layar iOS tanpa
  kartu; Spotlight/Landing = warna dekorasi ditulis mati (`bg-white`, `border-neutral-200`) -> token (dulu putih
  menyala di mode gelap); Auth = ikon aplikasi; fasilitas publik = kolom cari iOS tanpa kartu; OPD ringkas.
- Rekap (`prompt/docs/REKAP_TAMPILAN_APPLE_DESIGN.md`) diperbarui: 73 dirombak penuh, 10 sebagian (Auth, Landing,
  Home, 2 tabel superadmin), 0 gaya umum saja, 5 sengaja tak disentuh. Suite 652 passed (3191).

## 19. Bagian 13 - sisa status B dirombak (user 2026-10-02: "rombak juga sisa yang statusnya B")

- **Auth (Masuk, Daftar, Lupa/Atur Ulang/Konfirmasi Kata Sandi):** isian digabung jadi SATU kartu bergaris rambut
  ala layar masuk iOS (label 13px di dalam baris, isian tanpa bingkai 17px, bingkai kartu menyala saat fokus);
  "Lupa kata sandi?" pindah sejajar "Ingat saya"; tombol 48px/17px. Konfirmasi Kata Sandi jadi layar iOS
  (ikon aplikasi, judul besar). Galat tetap per isian di bawah kartu. id/name/autocomplete TIDAK berubah.
- **Landing/Home:** kartu bergaris tipis + bayangan, teks baca 15/17px, `<hr>` dibuang, petak pintasan bertint.
  Ikon api di atas merah kini `text-destructive-foreground` (token), bukan `text-white`.
- **Pengumuman & Kabupaten (superadmin):** daftar bergrup khusus ponsel (ketuk baris = ubah, pil status);
  dialog hapus dijadikan SATU komponen per berkas yang dipakai tabel & daftar ponsel.
- Temuan kecil di luar scope (TIDAK diubah, sisi server): `AnnouncementResource` mengirim teks "TIdak Aktif"
  (salah ketik huruf besar).
- Rekap: 83 dirombak penuh, 0 sebagian, 5 sengaja tak disentuh. Suite 654 passed (3218). Penjaga baru di
  AppleDesignMaterialTest (grup isian Auth, token warna halaman pemasaran, daftar ponsel superadmin) dibuktikan
  MERAH terhadap HEAD, berkas dipulihkan byte-exact.

## 20. Baris dashboard & kartu laporan dirombak (user 2026-10-02: "teks terpotong diganti ... tombol pill di kanan desak-desakan, rombak total")

- Akar: primitif bersama `AppListRow` (Components/AppSection.jsx) memaksa judul `truncate`, dan ketiga dashboard
  menjejalkan StatusBadge + pil aksi ("Tanggapi"/"Menunggu Admin"/"Buat Laporan") ke kolom kanan di samping
  panah - judul makin terjepit.
- `AppListRow` kini ala baris Mail iOS: judul & meta MEMBUNGKUS (tanpa "..."), prop BARU `aside` (waktu, pojok
  kanan atas) & `badges` (status + ajakan, baris sendiri rata kiri). Kolom kanan tinggal panah; `trailing` tetap
  diterima untuk pemanggil lama tapi dashboard tak lagi memakainya. Lokasi kini tampil di ponsel juga.
- Pil "Tanggapi" merah TETAP ada di ponsel (sinyal urgensi TASK_51), kini h-7/13px di baris lencana.
- `ReportCard`: status naik ke baris sendiri di atas judul; judul, nama pelapor, alamat penuh; deskripsi sengaja
  tetap pratinjau 3 baris (isi lengkap di detail); tombol bawah 44px huruf normal (dulu 11px kapital).
- Penjaga baru di AppleDesignMaterialTest dibuktikan MERAH terhadap HEAD, 5 berkas pulih byte-exact.
  Satu asersi lama disesuaikan (deskripsi line-clamp-2 -> 3, disengaja). Suite 655 passed (3231).

## 21. Bagian 15 - peta disembunyikan di ponsel + /admin/reports dirombak ulang (user 2026-10-02)

Permintaan: "pada tampilan mobile hydrants, pumps, fire-stations, admin/reports, /admin/hydrants, /admin/pumps,
admin/fire-stations jangan tampilkan mapsnya, sekalian ubah tampilan /admin/reports". Rencana dikonfirmasi user.
- **Peta desktop saja (batas `lg`, sama dengan tata letak dua kolom):** kolom peta `hidden ... lg:flex`. Tablet
  tegak ikut tanpa peta. Petunjuk "Lihat di peta" & gulir otomatis ke peta (`innerWidth < 1024` +
  `scrollIntoView`) dibuang; kotak gulir daftar `h-[500px] overflow-y-auto` kini hanya `lg:` - di ponsel daftar
  mengalir bersama halaman. Ketuk baris fasilitas admin di ponsel = tak ada aksi peta (Ubah/Hapus/Rute tetap).
- **Leaflet admin + ResizeObserver:** keempat halaman admin membuat peta sendiri tanpa `invalidateSize`; peta
  yang dibuat saat tersembunyi lalu layar melebar (tablet diputar) akan berubin rusak - kini diamati
  `ResizeObserver` (pola `UserLeafletMap`, yang sudah punya). Halaman publik sudah aman lewat UserLeafletMap.
- **/admin/reports (juga /reports mode pemantau):** baris ala Mail iOS - judul utuh + umur laporan di kanan
  (merah untuk Laporan Masuk), nomor & alamat, pelapor (+telepon >= sm, penutup untuk Selesai), lencana status
  PIL + tanda triase di baris sendiri, tombol Tinjau & Verifikasi tetap (lebar penuh di ponsel); ponsel: ketuk
  baris = buka detail (`router.visit`), panah iOS; desktop: ketuk = pusatkan peta, tombol Detail. Banner
  "menunggu verifikasi" bertint 2xl, chip status satu baris digeser di ponsel, keadaan kosong `AppEmpty`.
  LOGIKA TIDAK DISENTUH: STATUS_META, MONITOR_HIDDEN_STATUSES, ExportDialog, filter, mode pemantau.
- Penjaga baru `AppleDesignMaterialTest` "hides the map on phones..." dibuktikan MERAH terhadap HEAD (7 berkas),
  dipulihkan byte-exact (`cmp`). Build lulus. Suite 655 -> 656 passed (3257).
- Belum dicek: tampilan di HP/APK.

## 22. Bagian 16 - audit visual ulang & rombakan isi sungguhan (user 2026-10-02: "/admin/reports statusnya sudah rombak tapi ternyata belum, cek ulang semuanya" -> "lanjut kerjakan")

Audit: setiap halaman yang bisa dibuka di lokal dipotret 390x844 per peran (tamu, relawan, petugas, admin,
superadmin) memakai puppeteer-core di tmp job + Chrome lokal; label rekap terbukti terlalu optimis (FINDINGS
#160). Cara memotret ada di memori #159 (waitUntil domcontentloaded; login Inertia = XHR).
- **Byte 0x01** (jejak `\1` skrip pengganti) dibuang dari 9 berkas - tampil sebagai kotak hitam.
- **Form (31 + 4):** `GroupedForm.jsx` kini mengekspor `filledFieldsClass` (varian keturunan: input/textarea/
  pemicu select & combobox tanpa bingkai, latar `bg-muted/60`, `rounded-xl`; checkbox/radio/berkas
  dikecualikan) dan `groupedRowsClass` (pola baris bagian 12 + isian terisi). 25 form `divide-y [&>*]:py-4`
  memakai `className={groupedRowsClass}`; `FormSection` (Pengguna) ikut; 6 form fasilitas, Form Lapor,
  2 partial Profil & balasan Forum memakai `${filledFieldsClass}`. Input berkas Tenant & Pengguna: tombol
  pil bertint (`file:`), bukan "Choose File" mentah.
- **Detail Insiden:** "Informasi insiden" jadi grup iOS (judul grup di luar kartu, baris label-nilai
  Pelapor/Telepon, wilayah satu baris, alamat/patokan/asal titik tetap, Navigasi tombol tint); baris
  "Judul Insiden:" dibuang karena mengulang judul besar halaman; peta berlabel pil material; 6 judul panel
  kapital -> judul kartu 17px; 25 teks 11px -> 12px; `font-bold` -> `font-semibold` (kecuali h1).
- **Daftar Relawan:** cari iOS + tombol "Filter" (5 ComboBox terlipat, terbuka sendiri bila ada filter
  aktif, penghitung), daftar bergrup bertanda panah. Logika useForm/reset tidak disentuh.
- **RBAC (Peran, Izin, Akses Rute, Sinkronisasi Izin):** kontrol keluar dari kartu (isian terisi, reset
  ikon), tabel & daftar ponsel satu kartu, ponsel = baris bergaris rambut (bukan kartu dalam kartu),
  tombol `blue`/`red` -> ikon polos. Skrip `rbac.py` di tmp job.
- **Halaman setengah jadi:** 6 daftar fasilitas judul & alamat utuh (tanpa `truncate`), pemisah garis tegak
  dibuang, pil status tanpa bingkai; daftar Pengguna ponsel = satu grup (ketuk = Ubah, Peran & Hapus ikon);
  lencana Banjar tanpa kapital tebal; keadaan kosong putus-putus -> kartu (11 halaman); pop-up "Pakai
  Lokasi Saat Ini" merah brand ala alert iOS; Forum: waktu di baris sendiri, tombol balas 44px; Info:
  Callout & kotak langkah tint tanpa bingkai.
- **Rekap** `REKAP_TAMPILAN_APPLE_DESIGN.md` dikoreksi dari foto: A 80, B 3 (Detail Insiden panel kanan,
  Profil, Profil Relawan), D 5; daftar halaman yang BELUM diverifikasi visual dicatat.
- **Verifikasi:** foto ulang 390px (Detail Insiden, Peran, Relawan, Pengguna, SKKL, form hydrant +
  pop-up); 2 penjaga baru `AppleDesignMaterialTest` MERAH terhadap HEAD (62 berkas ditukar, pulih `cmp`);
  satu asersi lama disesuaikan (pola baris kini di GroupedForm). Build lulus.
- **Belum dicek:** di HP/APK sungguhan; dark mode isian terisi.
- **Susulan 2026-10-02 (dilaporkan user di dev):** `/admin/assign-permissions` layar putih "IconChevronRight is
  not defined" - `rbac.py` menyisipkan impor dengan asumsi impor ikon multi-baris, padahal berkas itu satu
  baris; `/admin/permissions` sama (ikon `IconLock` dari konfigurasi skrip, tak diimpor). Fix: impor
  ditambah, Izin kembali ke ikon aslinya `IconVersions`. Penjaga baru "imports every tabler icon a page
  renders" (MERAH terhadap HEAD, 2 berkas pulih `cmp`). Pelajaran: foto 844px setelah rombakan = layar
  galat - foto WAJIB dibuka, bukan hanya status 200. Suite 659 passed (3299).

## 23. Lebar desktop (user 2026-10-02: "banyak yang diisi max-w ... /admin/users ... harus scroll ke kanan untuk cari tombol editnya")

Diukur dengan puppeteer di 1366/1440/1920: `<main className="mx-auto w-full max-w-7xl">` (sejak April, juga
di main) memusatkan SEMUA halaman di 1280px - di 1920 isi hanya 1280 dari ~1660px yang tersedia; tabel
Pengguna butuh 1304px tapi dapat 1118-1214px, jadi kolom Aksi (Ubah/Hapus) terpotong di kanan.
Keputusan user (rekomendasi): (1) batas global dibuang -> `<main className="w-full flex-1">`; tabel, daftar,
peta & dashboard kini selebar layar, form & teks bacaan tetap sempit lewat `max-w-*` halamannya;
(2) `stickyActionsClass` di `ui/table.jsx` dipasang di 7 tabel admin (Pengguna, Pengumuman, Peran, Izin,
Akses Rute, Tetapkan Izin, Tenant) - kolom terakhir lengket kanan, kepala mengulang tint thead;
(3) kolom Jenis kelamin & Dibuat di tabel Pengguna hanya `2xl:`; (4) efek samping yang ikut dibereskan:
21 form admin ber-`mx-auto` kini sejajar judul halaman (dulu melayang di tengah layar lebar). Form Lapor,
Profil & Info tetap di tengah karena judulnya ikut di kolom itu.
Hasil: 1440 & 1920 tabel Pengguna tak meluap; 1366 meluap 33px tapi Aksi tetap terlihat. Penjaga baru
"lets desktop pages use the full width..." MERAH terhadap HEAD (30 berkas, pulih `cmp`). Suite 660 (3309).

# TASK_70 — Navigasi instan: pindah dulu, skeleton di halaman tujuan
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_70 |
| Severity | P2 |
| Tipe | perf / fitur kecil (rasa navigasi) |
| Sumber | permintaan user 2026-10-04 ("setiap klik halaman langsung pindah dan loading skeleton di halaman tersebut, bukan loading saat kliknya") |
| Branch | `feat/mobile-native-polish` |
| Status | DONE 2026-10-04 (A dikerjakan; B dibatalkan karena bug Inertia 2.0.3, FINDINGS #166; C ditunda) |

---

## 1. Deskripsi masalah / tujuan

Saat link diklik, Inertia menunggu respons server LENGKAP baru mengganti layar; selama itu
yang terlihat hanya progress bar oranye (`resources/js/app.jsx` `progress`). Di ponsel/APK
rasanya "web biasa". Tujuan: ketukan langsung mengganti layar (menu bawah/sidebar ikut
pindah aktif), halaman tujuan menampilkan skeleton sampai datanya tiba.

## 2. Reproduce / kondisi awal (diukur 2026-10-04, lokal Laragon, request Inertia XHR, median 3x)

| Akun | Halaman | Waktu server | Ukuran |
|---|---|---|---|
| admin | /dashboard, /admin/reports, /reports, /forum, /profile, fasilitas | 0,35-0,43 s | 24-47 KB |
| admin | /admin/users | 0,49 s | 28 KB |
| petugas | /dashboard | **0,75 s** | 34 KB |
| petugas | /peta-pemantauan | **0,63 s** | 46 KB |
| petugas | /regu | 0,51 s | 24 KB |
| relawan | /dashboard | 0,50 s | 58 KB |

Pengamatan: **lantai ~0,35 s berlaku untuk SEMUA halaman** (boot + shared props), selisih
antarhalaman kecil. Jadi menunda data per halaman (deferred props) hanya memangkas sedikit;
yang membuat terasa native adalah layar yang berganti SEBELUM respons tiba.

## 3. Root cause / kendala teknis

- Inertia (semua versi) baru merender halaman baru setelah respons tiba - tak ada
  "halaman sementara" bawaan.
- `@inertiajs/core` terpasang **2.0.3** (sumber dibaca dari sourcemap):
  - `prefetch="hover"` tak berguna di layar sentuh; `prefetch="click"` memakai `onMouseDown`,
    yang di ponsel baru menyala saat jari diangkat -> praktis nol keuntungan. Satu-satunya
    mode yang berguna di ponsel = `mount`.
  - `router.prefetch()` memanggil `asyncRequestStream.interruptInFlight()` -> prefetch
    **membatalkan** `router.reload({ only })` yang sedang jalan (dipakai listener Reverb
    di AppLayout & halaman realtime #84/#113) dan pemuatan deferred props.
  - Cache prefetch **tidak** dibuang otomatis setelah POST/PUT/DELETE, dan `get()` tidak
    memeriksa `staleTimestamp` (dipakai sampai timer kedaluwarsa).
- Status "aktif" menu (`navItems.js` `buildNavSections({ url })`) membaca `usePage().url`,
  yang baru berubah setelah respons tiba -> menu bawah ikut terlambat.
- Fondasi yang sudah ada: 85/94 halaman memakai persistent layout (`Page.layout = ...`),
  jadi `AppLayout` tidak di-remount saat pindah halaman; `Components/ui/skeleton.jsx` ada.

## 4. Rencana fix

**A. Layar sementara global (inti, mengenai SEMUA halaman ber-AppLayout)**
- `resources/js/lib/` hook kecil `usePendingVisit()` (berkas baru): dengar `router.on('start')`
  untuk kunjungan GET non-partial non-prefetch (`visit.only.length === 0`, bukan `prefetch`,
  bukan `preserveState` milik filter/paginasi daftar), simpan URL tujuan; bersihkan pada
  `finish`/`navigate`/`cancel`. Ambang ~120 ms sebelum skeleton tampil supaya kunjungan dari
  cache prefetch tidak berkedip.
- `Layouts/AppLayout.jsx`: selama ada kunjungan tertunda, ganti `{children}` di `<main>`
  dengan `<PageSkeleton url={tujuan} />` (berkas baru `Components/PageSkeleton.jsx`):
  3-4 varian dipilih dari pola URL - dashboard (sapaan + kartu + daftar), daftar
  (judul besar + baris AppListRow), detail (judul + blok), form (grup isian) - memakai
  `ui/skeleton.jsx` dan kelas material/apple-design yang sudah ada. Gulir ke atas saat
  skeleton tampil (tujuan memang halaman baru).
- `navItems.js` dipanggil dengan URL tujuan bila ada (`pendingUrl ?? url`) di Sidebar &
  MobileBottomNav -> slot aktif pindah pada ketukan, bukan setelah respons.
- Progress bar oranye: tetap ada tapi `delay` dinaikkan (skeleton sudah jadi penanda);
  untuk halaman tanpa AppLayout (Auth, Landing) progress bar tetap satu-satunya penanda.

**B. Prefetch terbatas - DIBATALKAN saat verifikasi (lihat bagian 8 & FINDINGS #166)**
- `prefetch="mount"` + `cacheFor` pendek (usul 20 s) HANYA pada slot `NavItem` bilah bawah
  (maks 3-4 tujuan GET) dan `prefetch` (hover) pada `NavLink` sidebar desktop.
  Tidak pada `AppListRow`/daftar (terlalu banyak request) dan tidak pada link POST
  (logout - `linkProps` method) maupun halaman yang wajib segar (antrian triase admin).
- `app.jsx`: `router.flushAll()` setelah kunjungan non-GET sukses, dan saat event realtime
  memicu reload (supaya prefetch tak menyajikan laporan basi).
- Mitigasi `interruptInFlight`: prefetch mount ditunda sampai halaman tenang
  (`requestIdleCallback`/setTimeout setelah deferred & reload awal selesai) - perlu dibuktikan
  di browser, kalau tetap bertabrakan dengan reload Reverb, B dibatasi ke sidebar desktop saja.

**C. Deferred props - OPSIONAL, hanya halaman yang terukur berat**
- Kandidat: dashboard petugas (0,75 s) dan peta pemantauan petugas (0,63 s). Diputuskan
  setelah A+B diuji; manfaatnya kecil karena lantai 0,35 s.

**Tidak dikerjakan:** SPA/API penuh; upgrade `@inertiajs/*` 2.0.3 -> 2.x terbaru (prefetch
lebih matang: cache tags, dsb.) = task tersendiri sesuai MASTER_PROMPT (upgrade dependency).

## 5. Blast radius

- `AppLayout` dipakai hampir semua halaman -> skeleton tak boleh muncul pada: reload parsial
  (Reverb, `only`), filter/paginasi daftar (`preserveState`), submit form (non-GET), polling.
- Halaman yang menyimpan state lokal saat pindah (form Lapor, peta Leaflet) - skeleton
  menggantikan children hanya SETELAH kunjungan dimulai, jadi tak mengubah perilaku "tinggalkan
  halaman"; tapi cek konfirmasi keluar form (onBefore) tetap menang (skeleton dipasang di `start`,
  bukan `before`).
- Pull-to-refresh APK (#162) memakai reload - pastikan tak memicu skeleton.
- Prefetch menambah request GET ke server (bilah bawah: maks ~4 per kunjungan, di-cache 20 s).

## 6. Rencana verifikasi

- [ ] Baseline `php -d memory_limit=1G ... vendor/bin/pest` (673/3429)
- [ ] Penjaga Pest (pola test file-scan yang ada, mis. AppleDesignMaterialTest): AppLayout
      merender skeleton dari kunjungan tertunda; prefetch tidak dipasang di link non-GET;
      `flushAll` terpasang setelah non-GET.
- [ ] Manual (puppeteer 390px + desktop, akun seeder): ketuk menu bawah -> skeleton/halaman
      dalam <150 ms, slot aktif langsung pindah; reload Reverb & filter daftar tanpa skeleton;
      form Lapor & BA tetap jalan; logout tetap POST.
- [ ] `npm run build` lulus; uji di APK dev.

## 7. Rollback

Commit A, B, (C) terpisah -> `git revert` per bagian. A cukup dilepas dari AppLayout.

---

## Acceptance criteria
- [ ] Ketukan link GET di halaman ber-AppLayout langsung mengganti isi dengan skeleton
- [ ] Menu aktif pindah saat diketuk
- [ ] Tak ada skeleton pada reload parsial/filter/submit
- [ ] Test >= baseline, build lulus
- [ ] ARCHITECTURE_MAP/CONVENTIONS/SKILL diperbarui (pola navigasi & skeleton baru)

---

## 8. Hasil (2026-10-04)

**Dikerjakan (A):**
- `resources/js/lib/navigation.js` (baru) - `installNavigationTracking()` (dipanggil sekali dari `app.jsx`, blok
  browser), `usePendingVisit()`, `useNavUrl()`. Kunjungan dicatat di `before` (+ cek `defaultPrevented` satu
  microtask kemudian), kerangka tampil setelah 80 ms, dibersihkan oleh `finish` kunjungan itu (selalu menyala:
  sukses/galat/batal/disela) atau `navigate` (dibatasi path tujuan selama reload async berjalan).
- `resources/js/Components/PageSkeleton.jsx` (baru) - 5 bentuk (dashboard, map, form, detail, list) dari path.
- `Layouts/AppLayout.jsx` - kerangka di `<main>`, halaman lama dibungkus `hidden`/`contents` (tidak dilepas);
  `url` = `useNavUrl()` untuk Sidebar.
- `Layouts/Partials/MobileBottomNav.jsx` - `useNavUrl()` menggantikan `usePage().url`.
- Progress bar oranye: **lanjutan 2026-10-04 (permintaan user)** - "jika halaman sudah isi loading skeleton maka
  hilangkan loading bawaan inertianya, jika tidak tetap munculkan". `AppLayout` memanggil `useSkeletonHost()`; di
  listener `before` kunjungan halaman diberi `visit.showProgress = false` bila ada host (router.visit menyalin objek
  visit sesudah event itu, jadi harus sinkron). Uji Chrome satu sesi tanpa reload: AppLayout->AppLayout dan
  AppLayout->/login = kerangka tanpa progress bar; /login<->/register = progress bar tampil (tak ada status bocor).
  Penjaga: test ke-7 `NavigasiInstanTest`, sabotase 2x MERAH (tanpa syarat host; host tak didaftarkan).
  Suite 680 passed, 3459 assertions; build lulus.
- **Lanjutan 2 (2026-10-04) - "animasinya tidak smooth seperti patah2" setelah deploy dev.** Skill emilkowalski
  diarsipkan lengkap di `.claude/skills-archive/emilkowalski/` (14 skill + cheatsheet, MIT); `animate` &
  `improve-animations` diaktifkan di `.claude/skills/`. Diagnosis (Chrome, CPU 4x, jaringan lambat):
  - perpindahan = TIGA potongan keras (halaman lama -> kerangka di 80 ms -> halaman baru), tanpa transisi;
  - frame pertama halaman baru berat (render + layout awal + peta, 0,5-1 dtk di CPU 4x) - fade yang dimulai saat
    commit habis di dalamnya (sampler rAF: 0 -> 0,99);
  - peta mini dashboard petugas melakukan zoom beranimasi (`fitBounds`) tepat di frame itu (`_tryAnimatedZoom` di
    profil; 34 animasi transform marker/tile, 3 gagal composite).
  Perbaikan: `usePageTransition` (lib/navigation.js) - halaman lama memudar keluar selama jeda kerangka, kerangka
  memudar masuk (`animate-in fade-in-0 duration-150 ease-spring`), halaman baru memudar masuk 200 ms setelah DUA
  frame; jeda kerangka 80 -> 120 ms; `fitBounds(..., { animate: false })`. Trace: fade WAAPI ter-composite (tanpa
  `compositeFailed`). Screencast compositor (kecerahan area isi per frame): sebelum = 227 -> 250 dalam satu
  frame; sesudah = 228 -> 237 -> 246 -> 248 -> 249 -> 250 (bertahap). Kunjungan gagal sebelum/sesudah kerangka:
  opacity kembali 1, tanpa gaya inline tersisa, isian form utuh. Penjaga: 2 test baru, sabotase 3x MERAH.
  Temuan di luar scope: #167 (denyut marker di dalam drop-shadow). Suite 682 passed, 3477 assertions; build lulus.
- **#167 (2026-10-04, keputusan user "matikan saja denyut di semuanya"):** denyut dilepas dari marker ketiga peta
  (dashboard petugas, detail insiden, Peta Pemantauan) - rincian di FINDINGS #167. Suite 683 passed, 3485 assertions.
- **Lanjutan 3 (2026-10-04) - "jika halaman bisa muncul cepat tanpa skeleton, skeleton tidak harus tampil".**
  Kajian dulu (disetujui user): batas respons 0,1/1/10 dtk (Nielsen Norman Group); React mempertahankan tampilan
  lama selama transisi (useTransition) & menahan Suspense ~300 ms; pola "delay + durasi minimum" (spin-delay).
  Bentuk lama salah di tiga hal: halaman lama dipudarkan begitu diketuk (halaman cepat pun tampak memuat),
  kerangka di 120 ms (berkedip untuk respons 150-300 ms), tanpa durasi minimum.
  Kini: menu aktif seketika, halaman lama UTUH; respons < 300 ms -> ganti langsung tanpa kerangka/fade; 300 ms ->
  kerangka memudar masuk; kerangka ditahan min. 300 ms (`holdTimer`), lalu halaman baru memudar masuk; ketukan
  beruntun saat kerangka tampil -> kerangka dipertahankan; `resize` dikirim saat isi dimunculkan (peta Leaflet yang
  terpasang selagi tersembunyi menghitung ulang ukurannya).
  Uji Chrome dengan respons direkam & disajikan ulang pada jeda terkendali: 100 ms -> tanpa kerangka, halaman baru
  ~160 ms, opasitas halaman lama tetap 1; 320 ms -> kerangka ~300 ms tanpa kedip; 1000 ms -> kerangka selama
  menunggu; ketukan beruntun Riwayat->Lapor -> kerangka tanpa celah 320..1653 ms; peta Beranda lewat kerangka =
  356x298, 9 tile, cakupan 100% (sama dengan muat penuh). Regresi offline/filter/kembali/progress bar/gagal hijau.
  Penjaga: 2 test ditulis ulang, sabotase 3x MERAH. Suite 684 passed, 3488 assertions; build lulus.

**B dibatalkan:** prefetch sempat dipasang (sentuh di bilah bawah, hover di sidebar) lalu uji Chrome offline
membuktikan bug Inertia 2.0.3: prefetch gagal/disela meninggalkan entri in-flight yang ditolak, klik berikutnya
ke link itu tak melakukan apa pun (FINDINGS #166). Seluruh kode prefetch dibuang; penjaga melarangnya selama
versi core 2.0.3.

**C ditunda:** lantai server ~0,35 s di semua halaman; perlu ukuran di VPS dulu.

**Verifikasi:**
- Pest: baseline 673/3429 -> **679 passed, 3454 assertions** (ditambah `NavigasiInstanTest`, 6 test / 25 assertion). Sabotase 3x (halaman dilepas,
  `!visit.async` dibuang, `<Link prefetch` dipasang) -> masing-masing MERAH, dipulihkan byte-exact (`cmp`).
- `npm run build` lulus (client + SSR).
- Chrome nyata via puppeteer (skrip di tmp job), akun petugas1/admin/relawan1, 390px & 1280px:
  | Skenario | Hasil |
  |---|---|
  | Ketuk Riwayat, jaringan lambat (600 ms) | menu aktif ~20 ms setelah klik, kerangka 80 ms kemudian, tiba 0,8-1,4 s |
  | Ketuk Riwayat, jaringan normal | 1 request saja, tiba ~0,3-0,4 s |
  | Tombol kembali | kembali ke /dashboard, tak ada kerangka tersisa |
  | Offline saat pindah dari form Lapor | kerangka hilang, form tampil lagi, isian "UJI ISIAN TASK70" utuh |
  | Filter /admin/reports (router.get preserveState+only) | 3 request, kerangka tak pernah tampil |
  | Desktop klik sidebar | menu tujuan aktif + kerangka form pada 300 ms |
  | Mode gelap | kerangka terbaca, slot Riwayat aktif |
- Galat konsol yang tersisa = Reverb lokal mati (ERR_CONNECTION_REFUSED) dan `pageerror` bawaan Inertia saat
  request offline (tak ditangani Inertia, ada sebelum TASK_70).

**Belum:** uji di HP/APK sungguhan; deploy.


# TASK_20 — Navigasi mobile & tablet: Bantuan/Legal terjangkau, menu tak menumpuk

Temuan: `prompt/docs/FINDINGS_LOG.md` **#53**
Sumber: laporan user 2026-08-07 — "menu bantuan dan legal hanya muncul di tampilan desktop,
di mobile tidak muncul dan di mobile saat klik menu pilihannya terlalu panjang".

## 1. Masalah & akar penyebab

**Gejala:** seksi "Bantuan & Legal" tak pernah tampil di ponsel; menu admin di ponsel
terlalu panjang; tablet tak punya navigasi samping.

**Root cause — duplikasi daftar menu.** Ada DUA daftar navigasi terpisah:

| Berkas | Tampil pada | Isi |
|---|---|---|
| `resources/js/Layouts/Partials/Sidebar.jsx` | `hidden lg:block` (`AppLayout.jsx:107`) → ≥1024px | lengkap, termasuk seksi "Bantuan & Legal" (TASK_19) |
| `resources/js/Layouts/Partials/MobileBottomNav.jsx` | `lg:hidden` → <1024px | salinan terpisah, **tanpa** Bantuan & Legal |

TASK_19 menambahkan menu legal hanya di daftar pertama. `MobileBottomNav.jsx:32` bahkan
sudah memuat komentar "Sinkronisasi dengan Sidebar" — duplikasi ini disadari, tetapi
sinkronisasinya manual dan terlewat.

Tiga akibat turunan:
1. **Non-admin di ponsel tak punya tombol menu sama sekali** (`MobileBottomNav.jsx:386-392`
   langsung merender ikon Profil), jadi warga/petugas/relawan tak punya jalan apa pun ke
   `/pusat-bantuan`, `/syarat-ketentuan`, `/kebijakan-privasi`. APK sudah dibagikan dan
   Google mensyaratkan Kebijakan Privasi terjangkau dari dalam aplikasi.
2. **Popover admin salah wadah**: s.d. 13 item (superadmin) dalam panel `w-52` (208px)
   ber-`max-h-[70vh]` yang harus di-scroll.
3. **Tablet 768–1023px zona mati**: sidebar belum muncul (`lg` = 1024px), bottom-nav
   dibatasi `max-w-md` (448px) sehingga jadi pulau kecil di tengah layar lebar.

## 2. Keputusan user (dikonfirmasi sebelum mengedit)

1. **Sheet berisi `<Sidebar/>` yang sama** — slot ke-5 bottom-nav jadi tombol "Menu" untuk
   SEMUA peran; duplikasi dua daftar menu dihapus.
2. **Rail ikon di `md`, penuh di `lg`** untuk tablet.
3. **Tambahkan baris tautan legal di footer `AppLayout`.**
4. **Perbaiki nama PT di footer dan tarik dari config** (bukan hardcode).

## 3. Perubahan

- `resources/js/Layouts/Partials/Sidebar.jsx` — prop baru `compact`. Mode rail
  menyembunyikan label & judul seksi lewat arbitrary variant Tailwind
  (`[&_span]:hidden lg:[&_span]:inline`, dst.) alih-alih cabang render terpisah, sehingga
  tetap SATU daftar menu. Judul seksi diganti garis pemisah tipis saat rail.
- `resources/js/Components/NavLink.jsx` — prop `labelClassName` (kait untuk mode rail) dan
  atribut `title` native sebagai tooltip saat label tersembunyi.
- `resources/js/Layouts/Partials/MobileBottomNav.jsx` — popover admin 13 item **dihapus**;
  slot ke-5 jadi tombol "Menu" untuk semua peran yang membuka `Sheet` berisi `<Sidebar/>`.
  Sheet ditutup lewat `useEffect` pada perubahan `url` (item di dalam `Sidebar` tak perlu
  tahu apa-apa soal Sheet). Bar disembunyikan mulai `md` (sebelumnya `lg`).
- `resources/js/Layouts/AppLayout.jsx` — sidebar `md:block w-20 lg:w-64` (rail → penuh);
  padding konten `pb-20 md:pb-0`; footer mendapat baris tautan Pusat Bantuan · S&K ·
  Privasi · Tentang, dan nama penyedia dari shared prop.
- `app/Http/Middleware/HandleInertiaRequests.php` — shared prop `penyedia_nama` dari
  `config('legal.penyedia.nama')`.

## 4. Verifikasi

- `php artisan test` → **182 passed, 726 assertions** (sama dengan baseline sebelum
  perubahan — tak ada regresi).
- `npm run build` lulus (client + SSR).
- `vendor/bin/pint` bersih; `npx prettier --write` pada berkas yang disentuh.

### Terverifikasi lewat render SSR sungguhan

`php artisan inertia:start-ssr` + `artisan serve`, login sebagai `pusat@sisupit.com`
(superadmin), lalu memeriksa markup `/dashboard` yang benar-benar dirender React:

- [x] Sidebar rail: `class="z-20 hidden w-20 shrink-0 … md:block lg:w-64"`
- [x] Bar bawah: `class="fixed bottom-0 … md:hidden"` → komplementer dengan sidebar,
      tak ada celah maupun tumpang tindih di 768px.
- [x] Tombol `aria-label="Buka menu"` ter-render (kini untuk semua peran).
- [x] Seksi "Bantuan & Legal" ter-render di dalam nav, lengkap dengan tooltip
      `title="Syarat &amp; Ketentuan"` dari `NavLink`.
- [x] `<nav>` rail membawa seluruh arbitrary variant
      (`[&_span]:hidden lg:[&_span]:inline`, `[&>a]:justify-center`, dst.).
- [x] Ketujuh kelas kritis itu **ada di CSS terkompilasi** (`app-*.css`) dalam bentuk
      ter-escape Tailwind (`.md\:block`, `.\[\&_span\]\:hidden`, …) — bukan sekadar
      tertulis di atribut class.
- [x] Footer: "Dikembangkan oleh PT Tawarin Dimana Aja." (dari shared prop, bukan hardcode)
      + keempat tautan legal dengan href yang benar.

### BELUM diverifikasi — perlu mata manusia

Perilaku interaktif & rupa visual tak bisa dibuktikan dari markup (repo tak punya browser
automation). Cek di browser (`composer dev`, DevTools device mode):

- [ ] **<768px** — Sheet benar-benar terbuka saat "Menu" diketuk, isinya bisa di-scroll
      penuh, dan tertutup sendiri setelah memilih menu (dipicu `useEffect` pada `url`).
- [ ] **768–1023px** — rail terbaca sebagai navigasi: ikon tak berdesakan, tooltip muncul
      saat hover, garis pemisah antar seksi cukup terlihat.
- [ ] **Peran superadmin** — seluruh seksi Administrasi/Kontrol Akses/Sistem muat di dalam
      Sheet tanpa terpotong.
- [ ] **Tamu (belum login)** — tombol "Menu" tetap muncul dan Sheet memuat Masuk/Daftar
      serta seksi legal.

## 5. Blast radius / risiko sisa

- `NavLink` punya dua pemakai: `Sidebar.jsx` dan `AuthenticatedLayout.jsx` (legacy Breeze).
  Yang kedua memanggilnya dengan pola lama `<NavLink href=… active=…>Dashboard</NavLink>` —
  tanpa prop `title`, sehingga atribut tooltip baru bernilai `undefined` (dijaga oleh
  `typeof title === 'string'`) dan `labelClassName` tak dipakai. Aman. Catatan terpisah:
  pemakaian di `AuthenticatedLayout` memang sudah rusak SEBELUM perubahan ini — `href`-nya
  tertimpa `href={url}` yang default `'#'` dan children-nya diabaikan; tidak diperbaiki di
  sini karena di luar scope (layout itu legacy, semua halaman aktif memakai `AppLayout`).
- Slot Profil/Masuk di bar bawah **dihapus** — kedua tautan itu kini di dalam Sheet
  (seksi "Akun & Sistem" milik `Sidebar`). Perlu dipastikan pengguna terbiasa, karena
  Profil sebelumnya satu ketukan dan sekarang dua.
- Breakpoint bar bawah turun `lg` → `md`: perangkat 768–1023px kehilangan bar bawah dan
  menerima rail. Ini memang tujuannya, tapi mengubah tampilan yang selama ini dilihat
  pengguna tablet.
- Perubahan murni presentasi — tidak menyentuh otorisasi, `Tenantable`, maupun route.
  Gating peran di dalam `Sidebar` tidak diubah sama sekali.

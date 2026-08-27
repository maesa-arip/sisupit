---
name: sisupit-ui
description: >-
  Existing UI/UX conventions for the Sisupit frontend, reverse-engineered from the code
  already in `resources/js/`. Use this skill WHENEVER editing, fixing, or reviewing any
  Sisupit frontend screen, component, form, layout, or list — including when the user
  only says "fix this page", "match the existing style", "make it consistent", or names
  a file under resources/js/. The point is to MATCH what is already there (tokens, status
  primitives, form pattern, toast pattern, error handling) so fixes blend in, not
  introduce a new style.
---

# Sisupit Frontend Conventions (existing app)

This skill captures **how the Sisupit frontend is already built**, so any edit matches
it. The rule for an existing app is **conform, don't reinvent**: copy the dominant
pattern in the same folder; only introduce something new when nothing fits, and say so.

> Diturunkan dari kode nyata saat onboarding (2026-06-25). Setiap pola di bawah merujuk
> file yang benar-benar ada di repo ini.

## Stack terdeteksi

```
Framework      : React 18 + @inertiajs/react ^2.0 (Inertia, bukan SPA murni/REST client)
Build          : Vite 6 (laravel-vite-plugin), build SSR terpisah (vite build --ssr)
Styling        : Tailwind CSS v3 + @tailwindcss/forms, tailwindcss-animate
Komponen       : shadcn-style di resources/js/Components/ui/* (Radix UI + cva + clsx/tailwind-merge)
Form           : Inertia useForm() (data/setData/post/put/processing/errors) — TIDAK pakai react-hook-form
Validasi       : 100% server-side (Laravel Form Request / inline validate()) — zod ada di
                 package.json tapi cuma dipakai untuk skema internal data-table, bukan form
Toast          : sonner (Toaster di AppLayout)
Icon           : @tabler/icons-react, lucide-react (dua icon set sekaligus — lihat anti-pola)
Map            : Leaflet (akses window.L langsung, tidak ada wrapper resmi)
State          : useState lokal + props Inertia (server-driven), tidak ada redux/react-query
```

## Pola yang HARUS ditiru

| Kebutuhan | Pola repo ini | File patokan |
|-----------|---------------|--------------|
| Pemanggilan API | `useForm()` dari `@inertiajs/react` di komponen halaman; `axios` ad-hoc untuk endpoint non-Inertia (region dropdown, geocode proxy) | `resources/js/Pages/Front/Reports/Create.jsx` |
| Loading state | `useForm().processing` → `disabled={processing}` di tombol submit | `resources/js/Pages/Admin/Users/Create.jsx:314` |
| Empty state | Teks fallback ad-hoc per halaman (mis. "Data tidak ditemukan.", "Tidak ada deskripsi rinci.") — tidak ada komponen `<EmptyState/>` global | `resources/js/Components/ui/combobox.jsx` (`CommandEmpty`) |
| Error state | `<InputError message={errors.fieldname} />` membaca `useForm().errors` | `resources/js/Components/InputError.jsx`, dipakai di `Admin/Users/Create.jsx:134` |
| Toast/flash | Di `onSuccess` callback `post()/put()/delete()`: `const flash = flashMessage(success); if (flash) toast[flash.type](flash.message);` — **wajib ditambahkan manual di setiap form baru**, bukan otomatis | `resources/js/Pages/Admin/Announcements/Create.jsx:31-34`; helper di `resources/js/lib/utils.js:14-16` |
| Warna/token | CSS variable HSL di `:root` (`resources/css/app.css:6-49`, dark mode 50-91), dipetakan ke Tailwind theme. **Jangan masukkan hex mentah baru** | `resources/css/app.css`; `tailwind.config.js:27-93` |
| Konfirmasi destruktif | `AlertDialog` (`Components/ui/alert-dialog`) sebelum `router.delete()` | `resources/js/Pages/Admin/Users/Index.jsx:207-245` |
| Notifikasi | `sonner`, `<Toaster position="top-center" richColors />` di-mount sekali di `AppLayout`, jangan mount ulang di halaman lain | `resources/js/Layouts/AppLayout.jsx:5,100` |
| Layout & navigasi | `AppLayout` untuk semua halaman Admin & Front baru (bukan `AuthenticatedLayout`, itu legacy Breeze) **dan juga untuk halaman publik yang bisa dibuka tamu** — `PublicLayout` (chrome landing) kini hanya dipakai `Pages/Landing.jsx`; memakainya di halaman lain membuang bilah navigasi bawah sehingga tamu kehilangan jalan pulang (permintaan user 2026-08-25, dijaga `MobileNavParityTest`). **Menu ditulis SEKALI** di `Layouts/Partials/navItems.js` dan dipakai dua permukaan: `Sidebar.jsx` (desktop/tablet) dan `MobileBottomNav.jsx` (popover "Fasilitas" & "Menu" di bawah md). Pengecualian "dua daftar" 2026-08-13 sudah DICABUT 2026-08-19 (TASK_31) setelah sembilan menu terbukti hilang di ponsel — lihat #71. Menu baru: cukup tambah entri di `navItems.js`, ia otomatis mendarat di popover "Menu". Bagi TAMU slot ke-5 bukan popover "Menu" melainkan tombol **Masuk** (keputusan user 2026-08-25) — tujuannya tetap diambil dari item `login` milik `navItems.js`, jangan dipaku `route('login')` | `resources/js/Layouts/Partials/navItems.js`, `resources/js/Layouts/Partials/MobileBottomNav.jsx` |
| Halaman info/legal | Kelima halaman (`Pages/Info/*`) memakai kerangka bersama `Info/Partials/InfoShell.jsx`, dan sejak 2026-08-26 (permintaan user, TASK_41) rupanya SAMA dengan halaman fasilitas: `HeaderTitle` (bukan hero), pembungkus `relative flex w-full flex-col space-y-6 pb-32` **tanpa max-width/padding sendiri** (AppLayout sudah memberi `max-w-7xl` + `p-4 lg:p-8` — menambah pembungkus kedua membuat paddingnya bertumpuk), kartu `rounded-xl border-border bg-card shadow-sm` + `CardContent p-5`, judul seksi `text-sm font-bold`, chip `rounded-md`. `eyebrow` (versi/kategori dokumen) tampil sebagai chip di slot KANAN baris kepala. Ubah rupanya di InfoShell saja — kelima halaman ikut sekaligus. `PublicPageHeader` kini tanpa pemakai (FINDINGS #81); jangan hidupkan lagi tanpa menanyakan user | `resources/js/Pages/Info/Partials/InfoShell.jsx`, `resources/js/Pages/Hydrants/Index.jsx` |
| Penanda "aktif" navigasi | Blok solid `bg-destructive` + `text-destructive-foreground` + `rounded-xl` (FINDINGS #72) — sidebar (`NavLink.jsx`) dan kotak ikon bilah bawah. Varian "garis tipis" pernah dicoba 2026-08-19 dan **ditolak user** — jangan dihidupkan lagi. **PENGECUALIAN (user 2026-08-20, PENGECUALIAN_ATURAN #2): baris di DALAM popover bottom-nav TIDAK memakai blok solid** — di sana aktif = tint 10% + teks sewarna jenis fasilitasnya (`bg-teal/10 text-teal` dst.), bentuk yang berjalan di production; blok solid terbaca seperti tombol darurat di dalam panel. Jangan "seragamkan" lagi tanpa menanyakan user. Ikon navigasi 20px (`h-5 w-5`), ketebalan garis TETAP saat aktif, label 12px (`text-xs`); ikon di dalam `Button` 16px, di baris popover 18px | `resources/js/Components/NavLink.jsx`, `resources/js/Layouts/Partials/MobileBottomNav.jsx` |
| Ikon di dalam navigasi | Umumnya **glyph monokrom yang mewarisi warna** (`currentColor`) di dalam kotak `h-8 w-12 rounded-xl`. Pengecualian tunggal: slot "Lapor" di bilah bawah memakai ikon brand `/icon.png` (keputusan user 2026-08-19). Karena berkas itu **sudah** petir putih di dalam kotak merah, ia **menggantikan** kotak ikon, tidak ditaruh di dalamnya — menumpuknya membuat dua nuansa merah & dua sudut membulat bertabrakan (FINDINGS #72). Konsekuensinya slot itu tak boleh diberi latar merah saat aktif; penandanya cincin | `resources/js/Layouts/Partials/MobileBottomNav.jsx` (`SlotContent`, prop `imageSrc`) |
| "Aktif" vs "terbuka" | **Warna aksen (merah) hanya menandai LOKASI** — halaman yang sedang dibuka, satu saja pada satu waktu. Tombol yang membuka panel/popover TIDAK boleh memakai warna itu untuk keadaan terbukanya; pakai latar netral `bg-accent` + `aria-expanded`/`aria-haspopup`. Melanggar ini persis keluhan user 2026-08-19 ("seolah ada 2 yang sedang aktif"). Ikutannya: hover di navigasi juga netral, dan tautan aktif memakai `aria-current="page"` | `resources/js/Layouts/Partials/MobileBottomNav.jsx` (`slotClass`, `SlotContent`) |
| Panel melayang di mobile | Panel yang dipicu dari bar bawah = popover melayang buatan tangan tepat di atas tombolnya (`absolute bottom-[72px]`, tutup lewat listener `mousedown` di luar), bertoken sama dengan `DropdownMenuContent` (`rounded-xl border bg-popover shadow-md`, TANPA panah — panah `rotate-45` dibuang di #72) dan baris `min-h-[48px]`. Ini keputusan user 2026-08-13 yang membalikkan TASK_21 dan **masih berlaku** (TASK_31 hanya mengganti sumber isinya, bukan bentuknya); `MobileMenuPanel.jsx` & `use-sheet-history.js` sudah DIHAPUS (ada di commit `2a1e2b6` bila perlu dipulihkan) — jangan hidupkan lagi pola drawer tanpa menanyakan user. `Components/ui/drawer.jsx` masih ada tapi kini tanpa pemakai. Padding `env(safe-area-inset-bottom)` pada bilah tetap wajib | `resources/js/Layouts/Partials/MobileBottomNav.jsx` |
| Format tanggal | `Intl.DateTimeFormat('id-ID', {...})` manual — **jangan** tambah `date-fns` baru, dependency-nya sudah ada tapi tidak dipakai (pakai pola `Intl` yang sudah ada) | `resources/js/Pages/Admin/Dashboard.jsx:19` |

## Aturan saat mengedit UI di repo ini

1. **Tiru file patokan** di tabel atas, bukan pola dari project lain.
2. **Jangan introduksi library/komponen baru** untuk perbaikan kecil — 38 komponen
   shadcn-style sudah ada di `Components/ui/*`, cek dulu sebelum menambah dependency.
3. **Setiap form submit yang berhasil harus tetap memicu toast** lewat pola
   `flashMessage(success)` + `toast[flash.type](...)` — kalau halaman yang diperbaiki
   belum punya ini, tambahkan mengikuti file patokan, jangan buat mekanisme toast baru.
4. **Konsisten warna/token** — repo pakai CSS variable, jangan masukkan warna mentah baru.
5. **Diff minimal** — perbaiki yang diminta, jangan reformat seluruh file.
6. **Sebelum selesai:** jalankan `npm run build` (harus tetap lulus). **Jangan commit hasil
   build** (`public/build`) kecuali memang itu tujuan task — lihat catatan git di
   `prompt/docs/CONVENTIONS.md`. Bersihkan `console.log`/debug yang ditambahkan.

## Anti-pola UI yang sudah ada di repo (jangan diperluas)

- **Dua icon library sekaligus** (`@tabler/icons-react` dan `lucide-react`) — saat
  menambah icon baru di halaman yang sudah pakai salah satu, ikuti yang sudah dipakai di
  halaman itu; jangan campur dua di satu komponen.
- **Leaflet diwire ulang manual per halaman** (akses `window.L` langsung via `useRef`) —
  `UserLeafletMap.jsx` ada sebagai komponen generik tapi `Admin/Dashboard.jsx` punya
  implementasi sendiri yang terpisah. Kalau menambah peta baru, cek dulu apakah
  `UserLeafletMap` bisa dipakai sebelum menulis ulang wiring Leaflet dari nol.
  (`resources/js/Components/UserLeafletMap.jsx`, `resources/js/Pages/Admin/Dashboard.jsx:14-89`)
- **`zod` terpasang tapi tidak dipakai untuk validasi form** — jangan mulai menambah
  skema zod ke satu form saja, itu akan membuat satu halaman beda pola dari semua form
  lain di repo ini (yang 100% mengandalkan validasi server Inertia).
- **`resources/js/Pages/Front/Settings/*` adalah dead code** (halaman lama, tidak
  terpasang ke controller/route manapun) — JANGAN dibingungkan dengan
  `resources/js/Pages/Admin/Settings/Edit.jsx` (halaman aktif untuk `Setting` model,
  superadmin-only, terpasang ke `admin.settings.edit`).
- **File "copy" yang masih ada** (`resources/js/hooks/UseFilter copy.js`, dll.) — sisa
  eksplorasi, jangan diedit/dijadikan rujukan pola.

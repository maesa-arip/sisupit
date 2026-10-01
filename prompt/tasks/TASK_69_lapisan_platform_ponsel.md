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

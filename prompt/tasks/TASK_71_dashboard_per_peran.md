# TASK_71 — Dashboard per peran: perbaikan hasil "roasting" (Prioritas 1 + butir 7a)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_71 |
| Severity | P2 |
| Tipe | bug UI / kejujuran tampilan |
| Sumber | permintaan user 2026-10-04 ("roasting tampilan dashboard masing2 role" lalu "kerjakan prioritas dulu, dan butir 7 a") |
| Branch | `feat/mobile-native-polish` |
| Status | DONE 2026-10-04 (butir 1-14, kecuali 2 keputusan produk di bagian 6) |

---

## 1. Deskripsi masalah / tujuan

Review keempat dashboard (`Pages/Dashboard.jsx` warga/relawan, `Admin/Dashboard.jsx` admin/pejabat,
`Petugas/Dashboard.jsx`, `Opd/Dashboard.jsx`) menghasilkan 14 butir. Yang dikerjakan di sini:

| Butir | Temuan | FINDINGS |
|---|---|---|
| 1 | Petugas disapa "Siaga, I!" - `split(' ')[0]` pada nama Bali (I Wayan, Ni Luh) | #168 |
| 2 | Lencana relawan selalu "Relawan Siaga" walau saklar siaga dimatikan | #169 |
| 3 | OPD: lokasi disembunyikan di ponsel, status insiden tak ditampilkan (padahal dikirim server) | #170 |
| 4 | Banner merah berdenyut petugas ikut menghitung `TERLAPOR` (menunggu admin sejak TASK_51) | #171 |
| 5 | `RenderMyHistory`/`RenderRadarFeed` = komponen di dalam render -> remount tiap ganti tab/siaran | #172 |
| 7a | Admin: "Sistem Online" ditulis mati, tetap hijau walau Reverb putus | #173 |

## 2. Root cause

- #168 `Petugas/Dashboard.jsx:50` `user.name.split(' ')[0]`; aturan benar (kata >= 3 huruf) hanya ada di beranda warga.
- #169 `Dashboard.jsx` lencana `isRelawan ? 'Relawan Siaga' : ...` tak membaca `isStandby`.
- #170 `Opd/Dashboard.jsx` lokasi `hidden ... md:flex`; `status` di payload `DashboardController` jalur OPD tak dirender.
- #171 `Petugas/Dashboard.jsx` banner memakai `activeMissions.length` (pending + handling + TERLAPOR).
- #172 `Dashboard.jsx` `const RenderX = () => (...)` dipakai sebagai `<RenderX />` -> tipe baru tiap render.
- #173 `Admin/Dashboard.jsx` teks statis "Sistem Online" + titik hijau.

## 3. Fix

- `resources/js/lib/first-name.js` (baru) - `firstName(name, fallback)`; dipakai petugas & warga.
- Lencana relawan: "Relawan Siaga" / "Relawan - Tidak Siaga" (warna redup) mengikuti `isStandby`.
- OPD: lokasi tampil di semua ukuran, waktu pindah ke slot `aside` (sama dgn daftar admin/petugas),
  `<StatusBadge status={item.status} />` di slot `badges`. Tanpa perubahan server.
- Petugas: `actionableCount` (pending/handling) -> banner merah; `awaitingCount` (TERLAPOR) -> baris
  "+N laporan menunggu verifikasi admin" di banner merah, atau banner kuning tenang (tanpa denyut)
  bila hanya ada TERLAPOR; hijau bila kosong.
- Warga: `renderMyHistory()`/`renderRadarFeed()` dipanggil sebagai fungsi.
- `resources/js/hooks/use-realtime-status.js` (baru) - baca `window.Echo.connector.pusher.connection`
  (`state` + event `state_change`), dipetakan ke connected / connecting / offline / disabled. Admin
  menampilkan "Realtime aktif" (hijau, berdenyut) / "Menyambung ulang..." (kuning) / "Realtime
  terputus" (merah) / "Realtime nonaktif" (abu, REVERB_APP_KEY kosong). Masih hanya tampil mulai `lg`.

## 4. Blast radius

Hanya keempat halaman dashboard + 2 berkas baru. `StatusBadge`, `AppListRow`, `echo.js`,
`use-report-feed` tidak diubah. Tidak ada perubahan server, rute, atau skema.

## 5. Verifikasi

- Penjaga: `tests/Feature/Sisupit/DashboardPerPeranTest.php` (6 test). Sabotase: dijalankan terhadap
  versi HEAD keempat dashboard -> 6/6 MERAH; dipulihkan & diverifikasi `cmp`.
- Suite penuh + `npm run build` (client & SSR) - lihat bagian Hasil.
- BELUM: cek visual di ponsel/APK (390px) keempat dashboard; status "Realtime terputus" dengan
  menghentikan Reverb lokal.

## 5b. Lanjutan (user: "lanjutkan", 2026-10-04) - butir 6 & 8-14

- Butir 6 -> FINDINGS #175 (peta taktis petugas), butir 8-14 -> #176. Temuan sampingan #174 (OPEN):
  `getTenantDefaultLocation()` di 5 controller fasilitas selalu Denpasar karena `users` tak punya lat/lng.
- Penyimpangan dari rencana: (a) butir 8 TIDAK menampilkan ikon kartu di ponsel - penyembunyiannya keputusan #159
  bagian 16 yang dikunci AppleDesignMaterialTest; hanya komentar yang dibenarkan (opsi kedua di rencana).
  (b) Butir 9: `resolved_this_month` ternyata total sepanjang waktu, jadi judul kartu diganti "Total Selesai"
  (bukan query diubah ke bulan ini). (c) Warna pin mengikuti kamus Peta Pemantauan (pending kuning, handling
  hijau), bukan usulan awal. (d) Pusat peta dari meta laravolt, bukan pola getTenantDefaultLocation (rusak, #174).
- Penjaga lama disesuaikan: NavigasiInstanTest (fitBounds kini lewat `fitMissionsAndMe`, tetap animate:false);
  LeafletPopupEscapeTest lulus tanpa ubah daftar aman (variabel `statusClass` yang sudah terdaftar).
- Sabotase: 4 test baru dijalankan terhadap HEAD -> 4/4 MERAH; dipulihkan & `cmp`.
- Suite: **694 passed, 3556 assertions**; `npm run build` lulus.

## 6. Sisa (menunggu keputusan user)

Perlu keputusan produk: feed "Kejadian di Sekitar" warga; tab "Butuh Respons" relawan yang
hanya menyaring halaman termuat (butuh query server).

## 7. Hasil (2026-10-04)

- Suite penuh: **690 passed, 3507 assertions** (baseline 684/3488 + 6 test / 19 assertion baru) - tanpa regresi.
- `npm run build` (client & SSR) lulus. Prettier & Pint: berkas yang disentuh tak berubah.
- Belum di-commit / belum deploy; cek visual ponsel masih tertunda.

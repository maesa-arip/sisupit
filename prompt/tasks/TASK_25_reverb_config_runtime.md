# TASK 25 — Konfigurasi Reverb untuk browser dibaca runtime, bukan dipaku saat build

| Field | Isi |
|-------|-----|
| ID | TASK_25 |
| Severity | P1 |
| Tipe | bugfix |
| Sumber | FINDINGS_LOG #58 |
| Status | DONE (2026-08-11) |

---

## 1. Deskripsi masalah / tujuan

`window.Echo` tidak pernah dibuat di browser — di **semua** environment — sehingga seluruh
fitur real-time mati tanpa gejala. Perbaikan #55 di sisi server karena itu belum bisa
terlihat lewat browser sama sekali.

## 2. Reproduce (bukti masalah ada)

Pada aset yang ter-commit (`public/build/assets/app-*.js`) sebelum perbaikan:

- `grep 'broadcaster:"reverb"'` → **tidak ada**
- `grep 'VITE_REVERB_APP_KEY tidak di-set'` (string cabang `else`) → **ada**
- `pusher-js` tetap ikut ter-bundle, jadi ukuran aset tidak mencurigakan

Artinya `import.meta.env.VITE_REVERB_APP_KEY` diganti nilai kosong saat build, blok
`new Echo({...})` dibuang sebagai kode mati, dan aplikasi hanya menulis peringatan ke
console. Semua pemakai dijaga `if (window.Echo)` sehingga tidak ada error yang terlihat.

## 3. Root cause

`resources/js/echo.js:6` membaca konfigurasi dari `import.meta.env` — nilai yang **dipaku
Vite saat build**, bukan saat aplikasi berjalan. Dua akibat sekaligus:

1. Sekali `npm run build` berjalan tanpa `VITE_REVERB_*` (dugaan kuat: dari git worktree
   TASK_21 yang tidak punya `.env`/`.env.production`), aset hasilnya permanen tanpa Echo.
   Build commit terakhir `1403441` persis sesudah TASK_21.
2. Bahkan saat env terisi, `wsHost` ikut terpaku ke satu domain (`sisupit.com`) sehingga
   staging/dev menyambung ke Reverb **produksi** — backend-nya menyiarkan ke Reverb sendiri
   di port 8081/8082, jadi event tak pernah sampai walau koneksi tampak berhasil.

## 4. Perubahan

Mengikuti pola yang sudah ada di repo untuk `MAP_TILE_URL` (nilai sisi-browser di-inject
server, bukan di-build):

- `config/services.php` — blok `reverb` berisi `key/host/port/scheme` dari env server.
  `secret` sengaja TIDAK ada di sini dan diberi peringatan eksplisit.
- `resources/views/app.blade.php` — `window.REVERB_CONFIG = @json(config('services.reverb'))`,
  skrip biasa (bukan module) tepat di sebelah `window.MAP_TILE_URL` supaya jalan sebelum
  bundel `@vite` yang deferred.
- `resources/js/echo.js` — membaca `window.REVERB_CONFIG`; degradasi mulus + peringatan
  console bila `key` kosong tetap dipertahankan.
- `.env.example` — catatan bahwa `VITE_REVERB_*` tidak dipakai lagi dan pindah domain tidak
  lagi memerlukan rebuild frontend.
- `tests/Feature/Sisupit/ReverbClientConfigTest.php` — 3 test regresi.

**Catatan Blade:** `@json([...])` multi-baris membuat Blade gagal parse
("Unclosed '[' does not match ')'"). Itu sebabnya nilainya dikumpulkan di `config/services.php`
lalu blade cukup memanggil `@json(config('services.reverb'))` — argumen tunggal & sederhana.

## 5. Blast radius

- Satu-satunya root view adalah `app.blade.php` (`HandleInertiaRequests::$rootView = 'app'`),
  jadi injeksi ini mencakup seluruh halaman.
- `echo.js` hanya diimpor `Front/Reports/Show.jsx`; SSR aman karena pembacaan dijaga
  `typeof window !== 'undefined'`.
- Aplikasi desktop Electron **tidak terpengaruh** — ia memakai WebSocket sendiri di main
  process dengan konfigurasi terpisah, bukan `window.Echo`.
- Pindah domain/environment kini cukup lewat env server; `public/build` tidak lagi menjadi
  artefak per-environment.

## 6. Verifikasi

- [x] Aset baru memuat `broadcaster:"reverb"` DAN `REVERB_CONFIG`, tanpa `wsHost:"..."` harfiah
- [x] 3 test baru hijau: injeksi ada; app secret tidak pernah ikut; host mengikuti env server
- [x] `php artisan test` 193 passed (752 assertions), naik dari 190 — tidak ada test lama berubah
- [x] Pint & Prettier bersih
- [ ] Verifikasi manual di browser: buka detail laporan aktif di staging, pastikan
      `window.Echo` ada dan DevTools→Network→WS menyambung ke `staging.sisupit.com`,
      bukan `sisupit.com`

## 7. Rollback

Revert commit task ini (kode) + commit `chore(build)` yang menyertainya (aset). Perilaku
kembali ke kondisi lama: realtime browser mati total.

---

## Acceptance criteria

- [x] `window.Echo` dibuat kembali di browser
- [x] Nilai untuk browser mengikuti env server, satu bundel untuk semua environment
- [x] App secret tidak pernah dikirim ke browser (dijaga test)
- [x] `FINDINGS_LOG.md` #58 → FIXED

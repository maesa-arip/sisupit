# TASK 04 — Batch P2/P3: route debug, helper nested, dead code, CI lint, naming
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_04 |
| Severity | P2/P3 (campuran) |
| Tipe | bugfix kecil + dead code + CI |
| Sumber | FINDINGS_LOG #3, #4, #5, #7, #8, #9, #10 |
| Status | **DONE** (2026-06-25), kecuali catatan parsial di #7 dan #9 |

---

## 1. Deskripsi masalah / tujuan
Lanjutan dari TASK_02/TASK_03 (yang menutup #1 P0 dan #2 P1) — menuntaskan sisa temuan
P2/P3 yang berdiri sendiri (tidak butuh keputusan desain besar), berdasarkan
`prompt/docs/FINDINGS_LOG.md`.

## 2. Reproduce & 3. Root cause
Lihat masing-masing entri detail di `FINDINGS_LOG.md` #3, #4, #5, #7, #8, #9, #10 — sudah
diisi root cause per file:line sebelumnya saat audit. Tidak diulang di sini.

## 4. Rencana fix yang diterapkan
- `routes/web.php:110-112` — hapus route `/openssl-test` (#3).
- `routes/web.php:100` — bungkus `/webpush/subscribe` dengan `Route::middleware('auth')` (#4).
- `app/Helpers/helpers.php` — pindahkan `signatureMidtrans()` jadi blok
  `function_exists` top-level sendiri, terpisah dari `usernameGenerator()` (#5).
- `app/Models/Unit.php` — hapus (dead code, diverifikasi 0 referensi) (#8).
- `resources/js/lib/utils.js` — hapus `formatToRupiah()` dan `FINEPAYMENTSTATUS`
  (dead code, diverifikasi 0 referensi); **`date-fns` di `package.json` SENGAJA TIDAK
  dihapus** — itu perubahan dependency yang butuh konfirmasi user (#7, parsial).
- `app/Http/Controllers/Admin/UserController.php` + `routes/web.php:136-137` —
  rename `store_relawan`→`storeRelawan`, `store_detail_user`→`storeDetailUser` (#10).
- `.github/workflows/tests.yml` — tambah step `vendor/bin/pint --test` dan
  `npx prettier --check .` dengan `continue-on-error: true` (informational, bukan
  blocking) (#9, parsial — lihat Blast Radius).

## 5. Blast radius
- **Ditemukan saat eksekusi**: `vendor/bin/pint --test` gagal di **35+ file
  pre-existing** (termasuk `config/*.php` bawaan Laravel yang tidak pernah disentuh,
  beberapa migrasi, seeder, `routes/*.php`), dan `npx prettier --check .` gagal di
  **144 file**. Membuat keduanya blocking sekarang akan membuat CI merah permanen
  karena utang gaya kode lama yang tidak terkait task ini — jadi step ditambahkan
  sebagai **informational only** (`continue-on-error: true`), bukan gate. Mass-reformat
  144+35 file adalah keputusan/task tersendiri (PR besar khusus formatting, atau
  bertahap) — **menunggu keputusan user**, lihat FINDINGS_LOG #9.
- Rename method (`store_relawan`→`storeRelawan`) memverifikasi nol caller frontend yang
  memanggil nama method secara langsung (hanya nama route yang dipakai) — aman.
- `npm run build` dijalankan untuk verifikasi perubahan `utils.js`, lalu `public/build`
  hasil build di-revert (`git checkout -- public/build && git clean -fd public/build`)
  agar tidak menambah diff aset ~240 file yang tidak terkait task (lihat CONVENTIONS.md).
- `date-fns` di `package.json` dibiarkan terpasang tapi tidak dipakai — flag ke user,
  bukan dihapus diam-diam, karena ada kemungkinan disiapkan untuk fitur mendatang.

## 6. Verifikasi
- [x] Baseline sebelum batch ini: 70 passed (setelah TASK_02/03)
- [x] Test baru per temuan:
      `tests/Feature/Sisupit/OpensslTestRouteRemovedTest.php` (#3),
      `tests/Feature/Sisupit/WebPushSubscribeAuthTest.php` (#4),
      `tests/Unit/Sisupit/HelpersFunctionExistenceTest.php` (#5)
- [x] Test sesudah hijau: **74 passed, 181 assertions**, 0 merah/skip
- [x] Build frontend (`npm run build`) lulus setelah hapus `formatToRupiah`/`FINEPAYMENTSTATUS`
- [x] `public/build` hasil build di-revert, tidak ikut commit

## 7. Rollback
Setiap perubahan independen & kecil — `git diff`/`git checkout --` per file jika ada
masalah. Tidak ada migrasi/skema yang berubah.

---

## Acceptance criteria
- [x] #3, #4, #5, #8, #10 — selesai tuntas, terbukti via test baru
- [x] #7 — helper/konstanta dead code terhapus; dependency `date-fns` di `package.json`
      sengaja dibiarkan, dicatat sebagai keputusan terbuka di FINDINGS_LOG
- [x] #9 — gate informational aktif di CI; mass-reformat dicatat sebagai keputusan
      terbuka, BUKAN dikerjakan diam-diam (utang 35+/144 file terlalu besar untuk
      "diff minimal")
- [x] Tidak ada regresi (74 passed ≥ baseline 70)
- [x] `prompt/docs/FINDINGS_LOG.md` diupdate untuk #3,#4,#5,#7,#8,#9,#10
- [ ] **#6 sengaja TIDAK dikerjakan** — keputusan arsitektur, menunggu user (lihat
      `FINDINGS_LOG.md` #6 dan pertanyaan di laporan akhir sesi)

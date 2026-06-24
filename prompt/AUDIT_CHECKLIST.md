# AUDIT CHECKLIST — Sisupit

Daftar periksa untuk audit aplikasi existing. Hasil setiap temuan dicatat ke
`docs/FINDINGS_LOG.md` (severity P0–P3 + lokasi `file:line` + dampak). **Audit =
membaca & mencatat, bukan memperbaiki.** Perbaikan jadi task terpisah.

Severity: **P0** keamanan/uang/kehilangan data · **P1** bug fungsional ·
**P2** inkonsistensi/teknis-debt · **P3** kosmetik/minor.

Status per 2026-06-25 (hasil audit onboarding pertama — lihat FINDINGS_LOG.md untuk detail):

---

## 1. Keamanan (P0/P1)

- [x] Endpoint sensitif punya authentication + authorization — **mayoritas ya, KECUALI**
      `UserController::store_relawan`/`store_detail_user` (FINDINGS_LOG #1, P0)
- [x] Tidak ada IDOR pada `ReportController` (sudah diperbaiki sesi sebelumnya, terverifikasi
      via `authorizeReportAccess`) — **TAPI IDOR baru ditemukan** di #1 di atas
- [x] Input divalidasi server-side (Form Request + inline validate) — konsisten
- [x] Tidak ada SQL/command injection ditemukan (query builder/Eloquent dipakai konsisten,
      tidak ada string-concat SQL)
- [x] Rahasia tidak ter-commit — `.env`/`.env.testing` ada nilai test/dummy, bukan kredensial asli
- [x] Password di-hash (Laravel default), token tidak terlihat bocor di response yang dicek
- [ ] CORS/header keamanan — **tidak diperiksa mendalam saat onboarding ini** (`?`)
- [x] Rate limit ada untuk `report-create` (5/10menit) — hanya 1 limiter terdaftar
- [x] Upload file lewat trait `HasFile`, validasi tipe/ukuran via Form Request
- [x] Tidak ada alur finansial aktif (Midtrans terpasang tapi tidak terhubung) — N/A

## 2. Korektness / Bug (P1)

- [x] Error ditangani via try/catch di controller, TAPI menampilkan `$e->getMessage()`
      mentah ke user (lihat CONVENTIONS anti-pola) — tidak fatal, tapi tidak ideal
- [ ] Edge case null/empty/race condition — **tidak diaudit lengkap, lihat #6 (dua jalur
      akses report_officers/helpers) sebagai contoh konkret risiko race**
- [x] State machine `Report::status` konsisten secara penggunaan, TAPI berupa string mentah
      bukan enum (CONVENTIONS) — risiko typo status di masa depan
- [x] Race condition pada `report_officers`/`report_helpers` ditangani via `lockForUpdate()`
      di `ReportActionController::takeAction` — baik
- [ ] Timezone/rounding — **tidak diaudit khusus saat onboarding ini** (`?`)

## 3. Konsistensi (P2)

- [ ] Format response API **tidak seragam** — Inertia render untuk halaman, JSON polos
      tanpa envelope untuk endpoint AJAX (bukan masalah besar untuk app Inertia, tapi catat)
- [ ] Penamaan method **tidak konsisten** (snake_case vs camelCase, FINDINGS_LOG #10)
- [ ] Frontend: loading/empty/error state **ada tapi ad-hoc per halaman**, tidak ada
      komponen reusable terpusat (SKILL.md)
- [x] UI pakai design token (CSS variable), bukan warna mentah — baik
- [ ] Pesan error ke user kadang dump `$e->getMessage()` mentah — lihat di atas

## 4. Kualitas & Teknis-Debt (P2/P3)

- [x] Kode mati ditemukan: `app/Models/Unit.php`, `formatToRupiah()`, `date-fns`
      (terpasang tidak dipakai), file-file `* copy.*` (sudah diketahui sebelumnya)
- [ ] `console.log`/debug tertinggal — **tidak digrep menyeluruh saat onboarding ini** (`?`)
- [x] Status laporan pakai string magic, bukan enum (CONVENTIONS)
- [ ] Fungsi besar/logika bisnis di controller — **DashboardController & ReportActionController
      cukup besar**, belum diukur kuantitatif
- [ ] `npm audit`/`composer audit` — **belum dijalankan saat onboarding ini** (`?`, rekomendasi
      jalankan sebagai task terpisah read-only)

## 5. Test & Build (P1/P2)

- [x] `npm run build` — **tidak dijalankan saat onboarding ini** untuk menghindari menulis
      ulang `public/build` yang ter-track git (lihat CONVENTIONS catatan git) — hanya
      diverifikasi via CI config bahwa step ini ada dan dipakai
- [x] `php artisan test` lulus: **65 passed, 164 assertions, ~44.5s**, 0 merah/skip
- [x] Cakupan test untuk alur kritis (auth, IDOR, tenant scope, role workflow) baik —
      tapi **tidak ada test untuk temuan #1 dan #2** (area yang belum pernah jadi insiden)
- [ ] Lint bersih — **tidak ada lint check di CI sama sekali** (FINDINGS_LOG #9)

## 6. Performa (P2/P3)

- [ ] Query N+1 — **tidak diaudit mendalam**, `DashboardController` reportsFeed sudah
      eager-load `helpers.user` (baik), tapi cakupan lain belum diperiksa (`?`)
- [ ] Index DB — ada migrasi khusus `add_status_index_to_reports_table` (baik, menunjukkan
      kesadaran soal index), cakupan kolom lain belum diaudit
- [ ] Payload API/pagination — `reportsFeed` sudah pakai `paginate()` (baik)
- [ ] Bundle frontend besar/render ulang — **tidak diaudit**

---

> Item bertanda `?`/tidak dicentang di atas belum diaudit tuntas saat onboarding ini
> (read-only, waktu terbatas) — jadikan task audit susulan jika diperlukan, jangan
> diasumsikan aman begitu saja.

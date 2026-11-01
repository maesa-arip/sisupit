# TASK_84 — Live tracking: kirim posisi web dibatasi + langganan channel stabil (#227)

| Field | Isi |
|-------|-----|
| ID | TASK_84 |
| Severity | P2 |
| Tipe | bugfix / perf |
| Sumber | FINDINGS_LOG #227 (keluhan user 2026-11-01), temuan ikutan #228 (OPEN) |
| Status | DONE (lokal, belum di-push/deploy) |

---

## 1. Deskripsi masalah / tujuan
User: mobil Damkar di peta live tracking produksi tidak bergerak. Setelah cek prod, user memilih
poin B saja: batasi kiriman posisi dari web + perbaiki sambung-ulang channel. Poin A (layar tetap
menyala di web) ditolak: semua petugas memakai APK/aplikasi iOS.

## 2. Reproduce (bukti masalah ada)
Cek prod read-only lewat konsol user (rincian FINDINGS #227): server & Reverb sehat; halaman detail
yang terbuka mengirim ~1 ping/dtk (2.280 baris tracking_logs untuk satu petugas dalam 57 menit).
Dari kode: effect peta `Show.jsx` bergantung pada `officerList`, dan di dalamnya ada
`Echo.private`/`Echo.leave` -> tiap posisi masuk = langganan ulang + `/broadcasting/auth`.

## 3. Root cause
- `resources/js/Pages/Front/Reports/Show.jsx` effect watchPosition: POST tiap tik GPS tanpa batas.
- Effect peta yang sama dengan langganan channel `report-tracking.{id}`; dependensinya memuat
  `officerList`/`helperList` yang berubah oleh setiap `ResponderLocationUpdated`.

## 4. Rencana fix (perubahan terkecil yang benar)
- `Show.jsx` — konstanta `TRACKING_MIN_INTERVAL_MS = 5000`, `TRACKING_MIN_DISTANCE_M = 10` (sama
  dengan `ResponderTrackingService` APK); callback watchPosition keluar lebih awal bila belum
  5 dtk ATAU belum pindah 10 m sejak kiriman terakhir (fix pertama selalu jalan).
- `Show.jsx` — seluruh blok `channel.listen(...)` dipindah apa adanya ke `useEffect` baru
  ber-dependensi `[report.id]`; effect peta tak lagi menyentuh Echo.

## 5. Blast radius
Hanya halaman detail insiden (`front.reports.show`). Server, APK, iOS, Thanks.jsx tak berubah.
Petugas diam (< 10 m) tidak lagi mengirim ping berulang - sama dengan layanan APK; `arrive()`
tetap mengirim posisi sendiri (TASK_80). Penangan channel memakai setter fungsional &
`router.reload`, jadi tak ada state basi walau effect hanya jalan sekali per laporan.

## 6. Rencana verifikasi
- [x] Baseline test sebelum: 911 passed (lihat STATUS_LOG)
- [x] Regression test: `tests/Feature/Sisupit/ResponderTrackingClientTest.php` (2 test)
- [x] Test sesudah hijau (angka di STATUS_LOG)
- [x] Sabotase penjaga: `Show.jsx` versi HEAD -> kedua test merah; file dipulihkan byte-exact (cmp)
- [x] `npm run build` lulus
- [ ] Verifikasi manual di HP: petugas Meluncur dengan halaman detail terbuka; di layar admin
      marker bergerak tiap ~5 dtk; Network admin tidak memuat `/broadcasting/auth` berulang.

## 7. Rollback
Revert commit TASK_84 (web saja, tanpa migrasi).

---

## Acceptance criteria
- [x] Kiriman web dibatasi 5 dtk / 10 m; channel tak lagi disambung ulang tiap posisi
- [x] Tidak ada regresi
- [x] Diff minimal (hunk prettier yang tak terkait dikembalikan)
- [x] FINDINGS_LOG #227 (FIXED) + #228 (OPEN) dicatat

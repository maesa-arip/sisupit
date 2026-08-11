# TASK 22 — `routes/channels.php` dimuat & `/broadcasting/auth` hidup

| Field | Isi |
|-------|-----|
| ID | TASK_22 |
| Severity | P1 |
| Tipe | bugfix |
| Sumber | FINDINGS_LOG #55 |
| Status | DONE (2026-08-11) |

---

## 1. Deskripsi masalah / tujuan

Semua channel privat mati. `Echo.private(...)` selalu gagal di tahap otorisasi karena
endpoint `POST /broadcasting/auth` tidak pernah terdaftar, sehingga `routes/channels.php`
efektif kode mati. Tujuan: mendaftarkan endpoint itu tanpa mengubah aturan otorisasi yang
sudah ditulis di `routes/channels.php`.

## 2. Reproduce (bukti masalah ada)

1. `php artisan route:list --path=broadcasting` → "Your application doesn't have any routes
   matching the given criteria" (total 120 route terdaftar).
2. Produksi: `curl -X POST https://sisupit.com/broadcasting/auth -d "socket_id=1.1&channel_name=private-App.Models.User.1"`
   → **HTTP 404**.
3. Server Reverb sendiri sehat — handshake `wss://sisupit.com/app/<key>?protocol=7` membalas
   `pusher:connection_established`. Jadi yang rusak murni lapisan otorisasi HTTP.

## 3. Root cause

`bootstrap/app.php:11-15` memanggil `withRouting(web:, commands:, health:)` **tanpa** argumen
`channels:`. Tidak ada `App\Providers\BroadcastServiceProvider` (`app/Providers/` hanya berisi
`AppServiceProvider.php`) dan tidak ada panggilan `Broadcast::routes()` di mana pun. Di Laravel 11
argumen `channels:` itulah satu-satunya yang memuat `routes/channels.php` **sekaligus**
mendaftarkan `POST /broadcasting/auth` pada middleware group `web`.

## 4. Rencana fix (perubahan terkecil yang benar)

- `bootstrap/app.php` — tambahkan satu baris `channels: __DIR__.'/../routes/channels.php',`
  pada `withRouting(...)`. Tidak ada perubahan lain; callback otorisasi dibiarkan apa adanya.
- `tests/Feature/Sisupit/BroadcastingAuthTest.php` — test regresi baru: endpoint ada,
  membalas 200 untuk yang berhak dan 403 untuk yang tidak (termasuk uji lintas-yurisdiksi #31).

## 5. Blast radius

Perubahan ini **mengaktifkan otorisasi yang selama ini mati** — callback di
`routes/channels.php` baru pertama kali benar-benar dieksekusi di produksi:

- `App.Models.User.{id}` — perbandingan id, tanpa query. Aman.
- `report-tracking.{reportId}` — `Report::find()` + `withinReportJurisdiction()` +
  satu query `report_helpers` per percobaan langganan. Beban ringan dan hanya saat subscribe,
  bukan per event. `Report::find()` memakai global scope `Tenantable`; laporan di luar tenant
  host akan `null` → `false` (menolak), perilaku aman-secara-default.
- Konsumen yang langsung hidup setelah fix: `Front/Reports/Show.jsx:619` (pelacakan responder,
  badge status reaktif #28, roster #33) dan aplikasi desktop Electron.
- **Bukan** perbaikan #46 — lonceng header masih belum punya listener; #55 hanya menghapus
  penghalangnya.

## 6. Rencana verifikasi

- [x] Baseline test sebelum: 182 passed, 726 assertions
- [x] Tambah regression test `tests/Feature/Sisupit/BroadcastingAuthTest.php`
- [x] Test sesudah hijau: 190 passed, 743 assertions
- [x] `php artisan route:list --path=broadcasting` → route muncul
- [ ] Verifikasi manual di produksi setelah deploy:
      `curl -i -X POST https://sisupit.com/broadcasting/auth` → **419/302 (CSRF), bukan 404**
      lalu buka detail laporan aktif di dua browser dan pastikan marker responder bergerak.
- [x] `npm run build` tidak diperlukan (tidak ada perubahan JS)

## 7. Rollback

Hapus baris `channels:` dari `bootstrap/app.php` — kembali ke perilaku lama (channel privat
mati, tanpa error yang terlihat pengguna). Commit sengaja dipisah agar bisa di-revert sendiri.

---

## Acceptance criteria

- [x] `POST /broadcasting/auth` terdaftar
- [x] 200 untuk pemilik channel, 403 untuk pihak lain (termasuk staf luar yurisdiksi)
- [x] Tidak ada regresi (test ≥ baseline 182 passed)
- [x] Diff minimal (satu baris produksi + satu file test)
- [x] `FINDINGS_LOG.md` #55 → FIXED, `ARCHITECTURE_MAP.md` bagian route diperbarui

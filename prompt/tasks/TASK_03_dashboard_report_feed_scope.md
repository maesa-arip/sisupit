# TASK 03 — Feed "Semua Laporan" bocorkan PII nasional tanpa filter wilayah
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_03 |
| Severity | P1 |
| Tipe | security (bugfix) |
| Sumber | FINDINGS_LOG #2 |
| Status | **DONE** (2026-06-25) |

---

## 1. Deskripsi masalah / tujuan
`DashboardController::index()` tab "Semua Laporan" (`$reportsFeed`) mengirim laporan dari
SELURUH Indonesia ke setiap warga yang login, tanpa filter wilayah — berbeda dengan
`$nearbyEmergencies` di fungsi yang sama yang justru benar memfilter per wilayah relawan.

Konfirmasi user: feed ini **seharusnya per-wilayah sesuai tenant** (bukan papan
transparansi nasional).

## 2. Reproduce (bukti masalah ada)
Sebelum fix: warga di Desa A bisa melihat laporan dari Desa B (provinsi berbeda) di tab
"Semua Laporan" — dibuktikan via test baru `DashboardReportFeedTenantScopeTest` yang
gagal sebelum fix (assertion `not->toContain` laporan luar wilayah gagal).

## 3. Root cause
`app/Http/Controllers/DashboardController.php:140` — query `$reportsFeed` memanggil
`Report::withoutGlobalScopes()`, sengaja membypass global scope `Tenantable` milik model
`Report`, tanpa filter pengganti apa pun.

## 4. Rencana fix (perubahan terkecil yang benar)
- `app/Http/Controllers/DashboardController.php` — hapus `->withoutGlobalScopes()` dari
  query `$reportsFeed`. Tanpa bypass, scope `Tenantable` otomatis berlaku berdasarkan
  kolom wilayah USER YANG LOGIN (lihat `app/Traits/Tenantable.php`) — pola yang sama
  dipakai model `Report`/`Hydrant` lain di seluruh aplikasi, jadi tidak menambah logika
  cascading manual baru (konsisten dengan instruksi user "sesuai tenant").

## 5. Blast radius
- `$myReports` (baris 110, query terpisah) **tidak disentuh** — bypass-nya disengaja
  ("agar terlihat walau melapor di luar kota", sesuai komentar di kode) dan sudah
  difilter `user_id` sendiri, jadi aman dipertahankan.
- `$nearbyEmergencies` (khusus relawan) **tidak disentuh** — sudah benar memfilter manual.
- Halaman `Admin/Dashboard.jsx` (JALUR 1, admin/superadmin/pejabat) **tidak terdampak**
  — query terpisah (`$queryRecentList` dkk.) yang sudah punya isolasi yurisdiksi sendiri.
- Resiko sisa: warga TANPA kolom wilayah sama sekali (mis. data lama yang belum
  dilengkapi) akan melihat feed kosong (tidak match filter apa pun) — ini konsisten
  dengan perilaku `Tenantable` di tempat lain, bukan regresi baru, tapi dicatat di sini
  sebagai potensi UX yang perlu diperhatikan terpisah.

## 6. Verifikasi
- [x] Baseline test sebelum: `php artisan test` → 65 passed
- [x] Test baru: `tests/Feature/Sisupit/DashboardReportFeedTenantScopeTest.php`
- [x] Test sesudah hijau: 70 passed total
- [x] Verifikasi manual: dibuktikan via test (membuat laporan di 2 desa berbeda, login
      sebagai warga salah satu desa, pastikan feed hanya berisi laporan desanya)
- [x] Build: tidak relevan (perubahan PHP-only)

## 7. Rollback
`git diff app/Http/Controllers/DashboardController.php` — kembalikan
`->withoutGlobalScopes()` jika ternyata user menginginkan perilaku nasional setelah
melihat hasilnya di UI.

---

## Acceptance criteria
- [x] Masalah hilang (terbukti via test baru yang sebelumnya gagal, sekarang lulus)
- [x] Tidak ada regresi (70 passed ≥ baseline 65)
- [x] Diff minimal (hapus 1 panggilan method) & sesuai konvensi (memakai mekanisme
      `Tenantable` yang sudah ada, bukan menulis filter cascading baru)
- [x] `prompt/docs/FINDINGS_LOG.md` #2 diupdate jadi FIXED dengan referensi task ini

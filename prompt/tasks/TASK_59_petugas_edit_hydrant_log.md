# TASK_59 — Petugas boleh tambah & edit hydrant + riwayat suntingan
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_59 |
| Severity | P2 |
| Tipe | fitur kecil |
| Sumber | permintaan user 2026-09-22 |
| Status | DONE (kode) 2026-09-22 — branch `feat/hydrant-log-petugas`, BELUM dideploy |

---

## 1. Deskripsi masalah / tujuan
Permintaan user: "role petugas bisa edit hydrant, tambahkan log edit, siapa yang edit, kapan
terakhir di edit, dan isikan bagian mana yang diedit, termasuk admin juga tambahkan log ini".

Keputusan user (ditanya lebih dulu):
- A. Petugas boleh **tambah & edit**; **hapus tetap admin**.
- B. **Hydrant resmi saja** (`hydrants`) — hydrant warga TIDAK dibuka untuk petugas & tanpa log.
- C. "Dibuat oleh" ikut dicatat, bukan hanya edit.
- D. Branch baru (`feat/hydrant-log-petugas`, bercabang dari `feat/laporan-ganda-atas-forum`
  @c181b7d0 — ikut membawa TASK_54/55/56 yang juga belum di `main`).

## 2. Reproduce (kondisi awal)
- `routes/web.php`: seluruh `/admin/hydrants` di grup `role:admin|superadmin` → petugas 403,
  menu "Manajemen Hydrant" hanya untuk admin di `navItems.js`.
- `Admin\HydrantController::update()` langsung `$hydrant->update()` — tak ada jejak siapa/kapan/apa.

## 3. Root cause
Bukan bug — fitur belum ada.

## 4. Perubahan
- `database/migrations/2026_09_22_110000_create_hydrant_logs_table.php` BARU (aditif):
  `hydrant_id` (cascadeOnDelete), `user_id` nullOnDelete + `user_name`/`user_role` SNAPSHOT,
  `action` (`dibuat`/`diubah`), `changes` JSON `[{field,label,old,new}]`, `created_at`. Append-only.
- `app/Models/HydrantLog.php` BARU: `record()`, `diff()`, `FIELD_LABELS` (= label form).
  - Wilayah dicatat sebagai NAMA desa/kecamatan/kota, bukan kode (#78).
  - lat+lng digabung jadi satu entri "Titik Lokasi".
  - `diff()` menyaring nilai yang SAMA SECARA ANGKA: Eloquent membandingkan kolom tanpa cast
    sebagai string, jadi "-8.69" (DB) vs "-8.6900" (form) tercatat "berubah" dan setiap simpan
    akan menulis "Titik Lokasi" palsu. Ditemukan lewat test.
  - Simpan tanpa perubahan = tanpa baris log.
- `app/Models/Hydrant.php`: relasi `logs()` & `latestLog()` (JSON `latest_log`).
- `Admin\HydrantController`: store/update menulis log dalam `DB::transaction`; prop `can`
  (`delete`, `warga`) dari `abilities()`; `counts.warga` tak dikirim ke petugas; `destroy()`
  re-check peran admin (defense in depth — resource kini terbelah dua grup route).
- `routes/web.php`: grup BARU `role:petugas|admin|superadmin` untuk
  index/create/store/edit/update; `destroy` tetap di grup admin. Nama route tetap `admin.hydrants.*`.
- `navItems.js`: entri hydrant jadi satu konstanta `hydrantAdminItem`, dipakai admin DAN petugas
  (`isStaff`) — bukan salinan kedua (#53/#71). Bilah bawah ponsel otomatis memuatnya di "Menu".
- `Admin/Hydrants/Index.jsx`: tombol hapus digerbangi `can.delete`; baris "Terakhir diedit oleh
  X (Peran) · waktu" per kartu. `variants.jsx` `HydrantTabs` prop `showWarga` (dari `can.warga`)
  — tab hydrant warga tak dirender untuk petugas (tab yang selalu 403 = fitur terbaca rusak).
- `Admin/Hydrants/Edit.jsx`: panel "Riwayat Perubahan" (50 terakhir) di bawah form.

Yang TIDAK diubah: `HydrantWargaController` & route-nya, halaman publik `/hydrants`,
perintah `sisupit:fix-facility-village-codes` (sengaja tidak tercatat — log ditulis dari
controller, bukan model event, supaya seeder/artisan tak muncul sebagai penyunting tanpa nama).

## 5. Blast radius
- Petugas kini melihat seksi "Administrasi" berisi satu menu. Ter-scope `Tenantable` (route
  binding 404 untuk hydrant di luar wilayah) + `ResolvesFacilityJurisdiction` saat simpan.
- Hydrant lama tak punya riwayat (tanpa backfill); panel Edit menyatakannya terang-terangan.
- Menghapus hydrant menghapus riwayatnya (cascade) — hapus memang tidak diminta dicatat.

## 6. Verifikasi
- [x] Baseline: 487 passed (1991) — termasuk test sesi lain yang belum ter-commit.
- [x] `HydrantEditLogTest` BARU, 12 test (14 kasus dataset). EMPAT sabotase dibuktikan MERAH
      (penyaring angka dicabut, grup route petugas dicabut, `can.delete` dipaksa true, `record()`
      di update dicabut), tiap sabotase dicek `cmp` terpasang lalu dipulihkan byte-exact.
- [x] Suite penuh sesudah, Pint, prettier, `npm run build`.
- [x] Migrasi DONE di DB dev LOKAL (sisupit_dev). BELUM di VPS.
- [ ] Manual (browser):
  1. Login petugas → sidebar/Menu ponsel memuat "Manajemen Hydrant"; tab "Hydrant Warga" TIDAK
     ada; tombol hapus tidak ada; tombol Tambah ada.
  2. Petugas ubah status + geser pin → kartu berbunyi "Terakhir diedit oleh <nama> (Petugas)";
     halaman Edit menampilkan "Status: Berfungsi… -> …" dan "Titik Lokasi".
  3. Simpan tanpa mengubah apa pun → tidak ada baris riwayat baru.
  4. Login admin → hapus & tab Hydrant Warga tetap ada; suntingan admin tercatat "(Admin)".

## 7. Deploy
Kode + `php artisan migrate` (satu tabel baru, aditif). Tanpa composer install; routes/ berubah
→ periksa `bootstrap/cache/routes-*.php` (route cache tidak aktif di server per TASK_34).

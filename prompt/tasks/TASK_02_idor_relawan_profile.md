# TASK 02 — IDOR: assign role & timpa profil user lain tanpa authorize
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_02 |
| Severity | P0 |
| Tipe | security (bugfix) |
| Sumber | FINDINGS_LOG #1 |
| Status | **DONE** (2026-06-25) |

---

## 1. Deskripsi masalah / tujuan
`UserController::store_relawan` (`PUT /users/relawan/{user}`) dan `store_detail_user`
(`PUT /users/detail/{user}`) menerima `User $user` dari route-model-binding tanpa
authorize sama sekali — user mana pun bisa menjadikan SIAPA PUN relawan, atau menimpa
nama/email/phone/KTP siapa pun, hanya dengan mengganti ID di URL.

Konfirmasi user: kedua endpoint ini **self-service** by design (warga mendaftar jadi
relawan/melengkapi profilnya sendiri) — bukan fitur admin-assign-untuk-user-lain.

## 2. Reproduce (bukti masalah ada)
Sebelum fix: `PUT /users/relawan/{victim->id}` sebagai user lain (`$attacker`) berhasil
(redirect 302) dan menambahkan role `relawan` ke `$victim` — dibuktikan via test baru
`UserSelfServiceAuthorizationTest` (lihat di bawah) yang gagal sebelum fix.

## 3. Root cause
`app/Http/Controllers/Admin/UserController.php:213` (`store_relawan`) dan `:230`
(`store_detail_user`) — tidak ada `$this->authorize()` atau pengecekan kepemilikan,
berbeda dari `edit()/update()/destroy()` di controller yang sama yang benar memanggil
`$this->authorize('view'|'update'|'delete', $user)`.

## 4. Rencana fix (perubahan terkecil yang benar)
- `app/Http/Controllers/Admin/UserController.php` — tambah
  `abort_unless($user->id === auth()->id(), 403);` di awal kedua method, sebelum blok
  `try`. Dipilih dibanding mengganti `User $user` jadi `$request->user()` karena
  frontend (`resources/js/Pages/Profile/Edit.jsx:50`) sudah selalu mengirim ID milik
  sendiri — diff ini menutup IDOR tanpa mengubah signature/route/frontend.

## 5. Blast radius
- `resources/js/Pages/Profile/Edit.jsx:50` — satu-satunya caller `admin.relawan.update`
  yang ditemukan, selalu mengirim `user.id` milik sendiri → tidak terdampak (tetap 302).
- `admin.detail.update` — tidak ditemukan caller di frontend saat ini (dead dari sisi UI,
  tapi tetap perlu ditutup karena route-nya routable langsung via HTTP).
- Tidak menyentuh `VolunteerController::register`/`toggleStandby` (sudah benar
  self-service sejak awal) — duplikasi fungsi antara `store_relawan` dan
  `VolunteerController::register` TIDAK dikonsolidasi di task ini (di luar scope,
  tetap tercatat sebagai catatan, bukan temuan baru karena bukan bug).

## 6. Verifikasi
- [x] Baseline test sebelum: `php artisan test` → 65 passed
- [x] Test baru: `tests/Feature/Sisupit/UserSelfServiceAuthorizationTest.php` (4 test:
      blocks assign-to-other, allows self-assign, blocks overwrite-other, allows self-update)
- [x] Test sesudah hijau: 70 passed (65 baseline + 4 baru dari task ini + 1 dari TASK_03)
- [x] Verifikasi manual: dibuktikan via test (tidak ada UI manual karena dua route ini
      bukan rute yang dieksplorasi browser secara terpisah, hanya dipanggil dari tombol
      "Daftar Relawan" di Profile/Edit.jsx yang perilakunya tidak berubah untuk kasus self)
- [x] Build: tidak relevan (perubahan PHP-only, tidak menyentuh aset frontend)

## 7. Rollback
`git diff app/Http/Controllers/Admin/UserController.php` — revert 2 baris `abort_unless`
jika ada masalah; tidak ada perubahan skema/migrasi.

---

## Acceptance criteria
- [x] Masalah hilang (terbukti via test baru yang sebelumnya gagal, sekarang lulus)
- [x] Tidak ada regresi (70 passed ≥ baseline 65)
- [x] Diff minimal (2 baris per method) & sesuai konvensi
- [x] `prompt/docs/FINDINGS_LOG.md` #1 diupdate jadi FIXED dengan referensi task ini

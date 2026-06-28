# TASK 09 — Manajemen armada/Unit + dispatch kendaraan ke insiden
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_09 |
| Severity | P3 (fitur besar — butuh perencanaan & kemungkinan dipecah) |
| Tipe | fitur |
| Sumber | permintaan user (analisis fitur kurang 2026-06-28, #3) |
| Status | TODO (BLOCKED — butuh keputusan scope user sebelum koding) |

---

## 1. Deskripsi masalah / tujuan
Aplikasi mengoordinasikan ORANG (petugas/relawan) tapi tidak ada konsep ARMADA/KENDARAAN:
truk pemadam, mobil tangki, unit rescue. Tidak ada katalog unit, status ketersediaan, atau
pencatatan unit mana yang di-*dispatch* ke insiden mana. Untuk sistem DAMKAR ini fondasi
yang hilang. Tujuan: katalog unit + status + relasi dispatch ke `Report`.

## 2. Reproduce (bukti masalah ada)
- Peta arsitektur lama menyebut model `Unit` sebagai "stub kosong", TAPI verifikasi
  2026-06-28: `grep "class Unit"` di `app/` → **tidak ada file `app/Models/Unit.php` sama
  sekali**. Jadi fitur ini greenfield penuh (peta arsitektur perlu dikoreksi — catat).
- Tidak ada tabel `units`/`report_unit`, tidak ada UI armada di `Admin/`.

Hasil yang diharapkan: admin/command center dapat mengelola daftar unit, melihat status
(tersedia/dalam-perjalanan/di-lokasi/maintenance), dan menugaskan unit ke laporan aktif.

## 3. Root cause
Fitur belum pernah dibuat (bukan regresi). `app/Models/Unit.php` tidak ada (peta arsitektur
basi di poin ini).

## 4. Rencana fix (bertahap — JANGAN kerjakan sekaligus tanpa konfirmasi scope)
**Keputusan scope yang harus dikonfirmasi user dulu (lihat AskUserQuestion saat eksekusi):**
- (a) Apakah Unit ter-scope wilayah (`Tenantable`/kolom wilayah) atau global per pos?
- (b) Apakah Unit terikat ke `PosPemadam` (homebase) sebagai relasi?
- (c) Apakah dispatch unit menggantikan atau melengkapi alur responder-orang yang ada?
- (d) Apakah butuh tracking lokasi unit real-time (re-use `TrackingLog`) atau cukup status?

**Fase 1 — Katalog (MVP):**
- `database/migrations/XXXX_create_units_table.php` — `id`, `code`/`name`, `type`
  (truk/tangki/rescue/ambulans), `status` (available/dispatched/on_scene/maintenance),
  `pos_pemadam_id` (nullable FK, bila (b) ya), kolom wilayah bila (a) ya, `SoftDeletes`
  (konsisten dgn `Pompa`/`PosPemadam`). 
- `app/Models/Unit.php` — model + (opsional) trait `Tenantable` sesuai keputusan (a). Bila
  pakai `Tenantable`, INGAT ATURAN EMAS #7 (re-check ownership saat `withoutGlobalScopes`).
- `app/Http/Controllers/Admin/UnitController.php` — resource CRUD, daftarkan di
  `routes/admin.php` di grup `role:admin|superadmin` (tiru `HydrantController`).
- Frontend `resources/js/Pages/Admin/Units/*` — tiru struktur halaman `Admin/Hydrants`
  (ikuti `.claude/skills/sisupit-ui/SKILL.md`).
- Seeder contoh (tiru `HydrantSeeder`/`PompaSeeder`).

**Fase 2 — Dispatch (sub-task terpisah):**
- `database/migrations/XXXX_create_report_units_table.php` — pivot `report_id`,`unit_id`,
  `dispatched_at`,`arrived_at`,`released_at`,`status`. Tiru bentuk `report_officers`.
- Relasi `Report::units()` / `Unit::reports()`.
- Endpoint dispatch/release di controller aksi (guard role petugas/admin, pola
  `ReportActionController`). Saat dispatch → set `unit.status=dispatched`; saat resolve
  laporan → release unit kembali `available` (sejajar dgn `resolve()` yang sudah menutup
  `report_officers`/`report_helpers`).

## 5. Blast radius
- Fitur baru, low blast ke kode existing PADA Fase 1 (CRUD terisolasi). Fase 2 menyentuh
  `ReportActionController::resolve()` (perlu release unit) → uji ulang alur tutup insiden.
- Jika Unit `Tenantable`, masuk ke jalur isolasi wilayah yang sama dgn `Report`/`Hydrant` —
  pastikan tidak bocor lintas wilayah (test).
- Dashboard command center mungkin perlu menampilkan unit aktif → perubahan
  `DashboardController` (opsional, fase lanjutan).

## 6. Rencana verifikasi
- [ ] Baseline test sebelum: `php artisan test`
- [ ] Fase 1: test CRUD unit + (bila Tenantable) test isolasi wilayah (tiru
      `AdminTenantScope`).
- [ ] Fase 2: test dispatch→arrive→release mengubah `unit.status` & pivot dengan benar;
      resolve laporan me-release semua unit.
- [ ] Test sesudah hijau di tiap fase
- [ ] Verifikasi manual: admin buat unit, dispatch ke laporan aktif, tutup laporan → unit
      kembali available.
- [ ] `npm run build` lulus.

## 7. Rollback
Tiap fase = migrasi dengan `down()` + commit fokus → `git revert`. Fase 1 dan 2 dipisah
agar bisa di-roll back independen.

---

## Acceptance criteria
- [ ] Keputusan scope (a)-(d) dikonfirmasi user SEBELUM koding
- [ ] Fase 1: katalog unit CRUD berfungsi + terisolasi sesuai keputusan wilayah
- [ ] Fase 2: dispatch/release unit konsisten dengan siklus status laporan
- [ ] Tidak ada regresi (test ≥ baseline)
- [ ] Diff sesuai konvensi (tiru Hydrant CRUD, report_officers pivot, SKILL.md untuk UI)
- [ ] `prompt/docs/ARCHITECTURE_MAP.md` dikoreksi (Unit bukan stub — fitur baru) + entitas
      Unit/dispatch ditambahkan

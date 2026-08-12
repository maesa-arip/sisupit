# TASK_27 — OPD Terkait: siaran ke instansi lain saat verifikasi + konfirmasi berkondisi
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_27 |
| Severity | P2 |
| Tipe | fitur |
| Sumber | permintaan user 2026-08-12 |
| Status | DONE (kode) 2026-08-12 — sisa verifikasi manual |

---

## 1. Deskripsi masalah / tujuan

Saat Pusat Komando memvalidasi laporan ("Broadcast Misi"), siaran hanya menjangkau
**petugas & relawan internal**. Insiden nyata hampir selalu menuntut instansi lain:
kebakaran rumah butuh **PLN** memadamkan aliran listrik di lokasi sebelum penyemprotan,
dan **BPBD** untuk dukungan logistik/evakuasi. Hari ini koordinasi itu terjadi di luar
sistem (telepon/WA pribadi) sehingga tidak ada jejak siapa yang dihubungi, kapan, dan
apakah instansi itu sudah bertindak.

Yang diminta user:
1. Saat verifikasi & broadcast, ada **pilihan OPD terkait** (checkbox).
2. Kejadian **kebakaran → BPBD & PLN tercentang otomatis**, tapi **masih bisa di-uncentang**.
3. Daftar OPD **dinamis** — bisa bertambah, bukan dua instansi itu saja.
4. Khusus **PLN ada konfirmasi "listrik sudah dipadamkan di lokasi kejadian"**.

## 2. Keputusan desain (dikonfirmasi user 2026-08-12)

| Pertanyaan | Keputusan |
|-----------|-----------|
| Kanal notifikasi OPD | **Akun in-app peran `opd`** — FCM + lonceng web, sama seperti petugas. Bukan WA/email/gateway. |
| Pencatat konfirmasi | **Keduanya, sumber dicatat** — OPD bisa konfirmasi sendiri, operator Pusat Komando juga bisa mencatatkan; kolom `confirmed_source` membedakan. |
| Dasar auto-centang | **Kolom `reports.incident_type` + `agencies.default_incident_types`** — dinamis penuh, diatur admin. |
| Konfirmasi memblokir "Selesai"? | **Tidak** — hanya peringatan di dialog penutupan. Insiden tak boleh tersandera pihak eksternal. |

**Anti-hardcode (inti permintaan "dinamis"):** tidak ada satu pun `if ($agency->code === 'pln')`
di kode. "Butuh konfirmasi" adalah **kolom data** (`requires_confirmation` +
`confirmation_label`), jadi OPD baru yang butuh konfirmasi (mis. Pertamina "pasokan gas
ditutup") cukup ditambah lewat admin tanpa menyentuh kode.

## 3. Root cause / kondisi awal (file:line)

- `ReportActionController::approve()` (app/Http/Controllers/ReportActionController.php:31)
  menyiarkan **hanya** ke `User::role('petugas')` & `role('relawan')`. Tidak ada konsep
  instansi eksternal di seluruh codebase.
- `incident_type` **tidak tersimpan**: `app/Http/Requests/ReportRequest.php:36-42` memakainya
  sebagai sinyal validasi saja ("wajib foto atau tidak"), jenis kejadian hanya menempel di
  `title` sebagai teks bebas. Auto-centang tak punya pijakan tanpa kolom ini.
- Dialog broadcast (`resources/js/Pages/Front/Reports/Show.jsx:1397`) hanya "Batal / Ya, Siarkan".

## 4. Rencana perubahan

**Data**
- `database/migrations/*_create_agencies_table.php` — master OPD. Kolom wilayah + `Tenantable`
  (pola `units`), `default_incident_types` (json), `requires_confirmation` + `confirmation_label`.
- `database/migrations/*_create_report_agencies_table.php` — pivot per insiden, pola `report_units`.
  Menyimpan **snapshot** nama OPD + `requires_confirmation`/`confirmation_label` supaya riwayat
  insiden lama tidak ikut berubah saat master diedit.
- `database/migrations/*_add_incident_type_to_reports_table.php` — nullable; laporan lama NULL
  → tidak ada rekomendasi otomatis, pemilihan manual tetap bisa.
- `database/migrations/*_add_agency_id_to_users_table.php` — akun peran `opd` menempel ke satu OPD.

**Model**
- `app/Models/Agency.php`, `app/Models/ReportAgency.php` (`$guarded = []`, pola Unit/ReportUnit).
- `app/Models/Report.php` — `INCIDENT_TYPES` (sumber tunggal, dipakai ReportRequest & admin),
  `incident_type` di `$fillable`, relasi `reportAgencies()`.
- `app/Models/User.php` — `CENTRALLY_MANAGED_ROLES` (= STAFF_ROLES + `opd`), relasi `agency()`.

**Alur**
- `ReportActionController::approve()` menerima `agency_ids[]` **opsional** (test lama tetap hijau).
- `notifyAgencies()` / `removeAgency()` / `confirmAgency()` — ditaruh di controller yang sama,
  mengikuti preseden `dispatchUnit`/`releaseUnit` yang persis analog.
- `app/Notifications/AgencyDispatchNotification.php` — FCM (android+apns, aturan TASK_26) +
  database + broadcast.

**UI**
- Dialog "Broadcast Misi" + panel "OPD Terkait" di `Front/Reports/Show.jsx` (tambah/lepas/konfirmasi
  setelah broadcast — eskalasi menyusul itu normal di lapangan).
- CRUD `Admin/Agencies/{Index,Create,Edit}.jsx` + `Admin\AgencyController` (pola UnitController).
- Dashboard peran `opd`: daftar permintaan bantuan untuk instansinya.

## 5. Blast radius

- `approve()` dipakai test `ReportActionAuthorizationTest` & `ReportNotificationLevelTest` →
  parameter baru harus opsional.
- `ReportController::show()` gating akses bertambah satu jalur (akun OPD yang instansinya
  diminta bantuan) — **wajib** re-check manual karena `withoutGlobalScopes()` (ATURAN EMAS #7).
- `EnsureProfileComplete` — peran `opd` harus dikecualikan, TAPI **bukan** dengan memasukkannya
  ke `User::STAFF_ROLES` (itu akan memberi mereka siaran nasional lewat
  `scopeNotifiableForReport`, regresi #56). Karena itu konstanta baru yang terpisah.
- `Agency` ter-`Tenantable` → validasi `agency_ids` harus lewat query ber-scope, bukan
  `withoutGlobalScopes`, agar OPD kabupaten lain tak bisa disuntik lewat request (pelajaran #32).

## 6. Verifikasi

- [x] Baseline test sebelum: **201 passed, 782 assertions**
- [x] Test baru `tests/Feature/Sisupit/ReportAgencyTest.php` — 11 test, mencakup:
      rekomendasi per jenis kejadian (termasuk `null` → tak ada tebakan); uncentang benar-benar
      berlaku; approve tanpa OPD tetap jalan (kompatibilitas pemanggil lama); notifikasi terkirim
      + snapshot tak berubah saat master disunting; **id OPD kabupaten lain yang disuntik gugur**;
      konfirmasi oleh OPD vs operator terekam berbeda; OPD lain tak bisa mengonfirmasi atas nama
      instansi lain; detail insiden terbuka hanya bagi instansi yang dilibatkan; lepas OPD;
      pelibatan ganda tak mengirim permintaan dua kali
- [x] Test sesudah: **212 passed, 815 assertions** (nol regresi)
- [x] `npm run build` lulus (client + SSR)
- [x] `vendor/bin/pint` bersih pada 22 berkas yang disentuh
- [ ] **SISA — verifikasi manual** (repo tak punya browser automation):
      1. `/admin/agencies` → tambah BPBD (auto-centang: 4 jenis kebakaran) & PLN (auto-centang
         sama + konfirmasi "Listrik sudah dipadamkan di lokasi kejadian")
      2. `/admin/users` → tetapkan peran **OPD / Instansi Terkait** ke satu akun, pilih PLN
      3. Buat laporan dengan pilihan cepat **Rumah** → login petugas → buka detail →
         **Broadcast Misi** → pastikan BPBD & PLN sudah tercentang + berlabel "Disarankan"
      4. Uncentang BPBD → Siarkan → panel "OPD Terkait" hanya berisi PLN
      5. Login akun PLN → beranda memuat permintaan → buka insiden → **Catat Konfirmasi**
      6. Dialog **Tutup Insiden** saat konfirmasi belum diisi → muncul blok "Masih ditunggu"
         tapi tombol Selesai TETAP bisa ditekan

## 7. Rollback

Fitur aditif: revert commit + `php artisan migrate:rollback` (4 migrasi). Tidak ada kolom
lama yang diubah/dihapus, jadi rollback tidak menyentuh data existing.

---

## Acceptance criteria
- [ ] OPD bisa ditambah/diubah lewat admin tanpa menyentuh kode
- [ ] Kebakaran → OPD default tercentang otomatis, tetap bisa di-uncentang
- [ ] Konfirmasi berkondisi jalan untuk PLN **tanpa** special-case PLN di kode
- [ ] Akun OPD lintas kabupaten tidak bisa dilibatkan lewat request buatan
- [ ] Tidak ada regresi (test ≥ 201 passed)

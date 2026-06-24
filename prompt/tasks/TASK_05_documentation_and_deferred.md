# TASK 05 — Dokumentasi keputusan #6 + penjadwalan mass-reformat #9
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_05 |
| Severity | P2 (#6, didokumentasikan) / P3 (#9, dijadwalkan, belum dikerjakan) |
| Tipe | dokumentasi + perencanaan |
| Sumber | FINDINGS_LOG #6, #9 — keputusan user 2026-06-25 setelah TASK_04 |
| Status | #6 **DONE**, #9 **TODO** (sengaja dijadwalkan, bukan dikerjakan sekarang) |

---

## Bagian A — FINDINGS_LOG #6 (selesai)

### Deskripsi
User memutuskan: dual access pattern `report_officers`/`report_helpers` (Eloquent di
`ReportHelperController` vs `DB::table()` mentah di `ReportActionController`) **tidak
direfactor** — cukup didokumentasikan sebagai keputusan sadar.

### Fix
- `app/Http/Controllers/ReportActionController.php` — komentar di atas deklarasi class,
  menjelaskan `DB::table()` dipilih demi `lockForUpdate()` di `takeAction()` untuk cegah
  double-insert saat banyak relawan/petugas merespons satu insiden bersamaan.
- `app/Models/ReportOfficer.php`, `app/Models/ReportHelper.php` — komentar pendek di atas
  class, menyilangkan rujukan ke catatan di `ReportActionController` supaya yang baca
  model duluan juga tahu.
- `prompt/docs/CONVENTIONS.md` — entri anti-pola terkait diupdate jadi "keputusan
  disengaja, jangan diubah tanpa task khusus" (lihat di bawah).

### Verifikasi
- [x] Tidak ada perubahan perilaku/logika — hanya komentar. `php artisan test` tetap
      74 passed tanpa perubahan jumlah.
- [x] Tidak ada test baru diperlukan (tidak ada perilaku baru untuk diuji).

---

## Bagian B — FINDINGS_LOG #9 (dijadwalkan, BELUM dikerjakan)

### Deskripsi
User memutuskan mass-reformat **35+ file PHP** (gagal `vendor/bin/pint --test`) dan
**144 file JS/CSS** (gagal `npx prettier --check .`) dijadikan **task/PR terpisah**,
bukan dikerjakan dalam sesi ini — supaya diff-nya terisolasi dari perubahan fungsional
dan mudah di-review/rollback sendiri.

### Yang perlu dilakukan saat task ini dieksekusi (belum dilakukan)
1. Baseline: `php artisan test` harus tetap hijau sebelum & sesudah (reformat seharusnya
   tidak mengubah perilaku, tapi WAJIB diverifikasi, terutama untuk Prettier yang bisa
   mengubah JSX secara halus).
2. Jalankan `vendor/bin/pint` (tanpa `--test`, auto-fix) di **branch/PR terpisah** dari
   pekerjaan fungsional apa pun yang sedang berjalan.
3. Jalankan `npm run format` (`prettier --write .`) di branch yang sama.
4. Diff akan besar (179 file) — review per kategori (config/, migrations/, seeders/,
   routes/, resources/js/Pages/) bukan sekaligus, untuk menangkap kalau ada
   auto-fix yang ternyata mengubah perilaku (jarang tapi mungkin, terutama untuk Pint
   pada file dengan struktur kontrol kompleks).
5. Setelah PR reformat ini merge, ubah `continue-on-error: true` di
   `.github/workflows/tests.yml` step Pint & Prettier menjadi blocking (hapus baris itu)
   supaya drift baru benar-benar digerbang ke depannya.
6. Update `prompt/docs/FINDINGS_LOG.md` #9 jadi FIXED setelah ini selesai.

### Catatan
- **Belum ada file yang diubah untuk bagian B** — ini murni rencana yang dicatat
  sesuai keputusan user, sesuai prinsip "mencatat ≠ memperbaiki" dari
  `prompt/AUDIT_CHECKLIST.md`.
- `.github/workflows/tests.yml` step informational (dari TASK_04) tetap aktif sampai
  task ini dikerjakan — itu satu-satunya bagian dari #9 yang sudah live.

---

## Acceptance criteria
- [x] #6: didokumentasikan di kode + `FINDINGS_LOG.md`, tidak ada regresi
- [ ] #9: PR reformat terisolasi (belum dibuat — jadwalkan terpisah kapan user siap)

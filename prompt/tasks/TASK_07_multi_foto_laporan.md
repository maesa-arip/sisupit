# TASK 07 — Multi-foto pada laporan (+ foto progres dari responder)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_07 |
| Severity | P2 |
| Tipe | fitur |
| Sumber | permintaan user (analisis fitur kurang 2026-06-28, #4) |
| Status | FIXED (2026-06-28) — `php artisan test` 106 passed (297 assertions); `npm run build` lulus |

> **Implementasi (2026-06-28):** migrasi `report_photos` + model `ReportPhoto` + `Report::photos()`;
> kolom `photo` lama = sampul (foto pertama). `ReportRequest` `photos[]` wajib saat create
> (POST), opsional saat update (PUT). `ReportController::store` simpan banyak foto + sampul;
> `show()` load `photos`. `Reports/Show.jsx` galeri+modal per-foto; `Reports/Create.jsx`
> multi-file (maks 6). Test `ReportMultiPhotoTest` (2); `ReportCreationTest` diubah ke `photos[]`.
> **Foto progres responder di TKP belum** (kemungkinan follow-up). **Temuan baru #30**:
> `Reports/Edit.jsx` ternyata form Publisher yang salah → edit laporan non-fungsional (OPEN).

---

## 1. Deskripsi masalah / tujuan
Sebuah laporan hanya bisa membawa **satu** foto. Insiden nyata (kebakaran, rescue) butuh
beberapa foto dari berbagai sudut, dan idealnya foto progres/penutupan dari responder di
TKP. Tujuan: dukung banyak foto per laporan, baik saat warga membuat laporan maupun saat
responder menambah bukti di lokasi.

## 2. Reproduce (bukti masalah ada)
- Skema: `database/migrations/2025_07_19_091844_create_reports_table.php:25` —
  `$table->string('photo')->nullable();` → satu kolom string, satu file.
- Model: `app/Models/Report.php:28` — `'photo'` di `$fillable`, tidak ada relasi
  `hasMany` foto.
- Akibat: tidak ada cara menyimpan >1 foto tanpa menimpa yang lama. Kirim 3 foto saat lapor
  → hanya 1 tersimpan.

Hasil yang diharapkan: 1 laporan dapat punya N foto (mis. 1–5), masing-masing dengan
pengunggah & waktu; ditampilkan sebagai galeri di `Reports/Show`.

## 3. Root cause
Desain awal one-to-one (`reports.photo`). Tidak ada tabel `report_photos`. Tidak ada
mekanisme galeri di sisi model maupun UI.

## 4. Rencana fix (perubahan terkecil yang benar)
- `database/migrations/XXXX_create_report_photos_table.php` — **baru**: `id`,
  `report_id` (foreignId constrained, cascade), `user_id` (nullable — pengunggah),
  `path` (string), `phase` (string nullable: `initial`/`progress`/`closing`), timestamps.
- `app/Models/ReportPhoto.php` — **baru**: `belongsTo(Report)`, `belongsTo(User)`,
  `$fillable = ['report_id','user_id','path','phase']`. (Tidak pakai `Tenantable` —
  isolasi wilayah sudah diwariskan dari `Report` induknya saat di-query lewat relasi.)
- `app/Models/Report.php` — tambah `public function photos(): HasMany { return
  $this->hasMany(ReportPhoto::class); }`. **Pertahankan** kolom `photo` lama (jangan hapus,
  lihat ATURAN EMAS #5) — perlakukan sebagai foto utama/legacy; backfill opsional terpisah.
- `app/Http/Controllers/ReportController.php` (store) — terima `photos[]` (array file),
  validasi `image|max:...` per item, simpan tiap file via trait `HasFile`
  (`app/Traits/HasFile.php` — pola upload yang sudah dipakai di codebase) lalu
  `ReportPhoto::create(...)`. Jaga kompatibel: jika hanya `photo` tunggal yang dikirim,
  tetap jalan.
- `app/Http/Controllers/ReportActionController.php` — opsional (fase 2): endpoint
  `addPhoto` agar responder yang sudah `arrived` bisa unggah foto progres (re-gunakan guard
  `hasArrived` yang sudah ada di `correctLocation`, l.214). Bisa dipisah jadi sub-task bila
  scope membengkak.
- Frontend `resources/js/Pages/Front/Reports/*` & `Reports/Show` — input multi-file +
  galeri. WAJIB ikuti `.claude/skills/sisupit-ui/SKILL.md` (token, pola form, toast).

## 5. Blast radius
- `reports.photo` masih dibaca di beberapa tampilan (cek `Reports/Show`, dashboard card,
  resource). Karena kolom lama dipertahankan, pembacaan existing tidak rusak.
- `UserSingleResource`/resource laporan mungkin perlu ekspos `photos` — cek sebelum ubah.
- Disk `public` (`HasFile` pakai disk 'public') — pastikan `storage:link` aktif di prod.
- Validasi ukuran/jumlah file → batasi (mis. maks 5, maks 2–4 MB/file) agar tidak jadi
  vektor abuse upload.

## 6. Rencana verifikasi
- [ ] Baseline test sebelum: `php artisan test`
- [ ] Test baru: store laporan dengan 3 foto → assert 3 baris `report_photos` + file ada
      (`Storage::fake('public')`); store dengan 1 `photo` legacy → tetap jalan.
- [ ] Test sesudah hijau
- [ ] Verifikasi manual: lapor dengan beberapa foto via UI → galeri tampil di `Reports/Show`.
- [ ] `npm run build` lulus (ada perubahan React).

## 7. Rollback
Migrasi punya `down()` (drop `report_photos`). Commit fokus → `git revert`. Kolom `photo`
lama tak tersentuh sehingga rollback tidak kehilangan data laporan existing.

---

## Acceptance criteria
- [ ] 1 laporan dapat menyimpan & menampilkan banyak foto (terbukti via test + UI)
- [ ] Jalur `photo` tunggal lama tetap berfungsi (kompatibilitas mundur)
- [ ] Batas jumlah/ukuran file ditegakkan
- [ ] Tidak ada regresi (test ≥ baseline)
- [ ] Diff sesuai konvensi (pakai `HasFile`, ikuti SKILL.md untuk UI)
- [ ] `prompt/docs/ARCHITECTURE_MAP.md` (entitas Report) diupdate dengan relasi `photos`

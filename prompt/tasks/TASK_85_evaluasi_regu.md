# TASK_85 — Evaluasi Regu & Penggunaan Aplikasi (halaman admin + Ekspor Excel)

| Field | Isi |
|-------|-----|
| ID | TASK_85 |
| Severity | P3 |
| Tipe | fitur kecil |
| Sumber | permintaan user 2026-11-01 |
| Status | TODO - sementara dikerjakan sebagai LAPORAN SEKALI JADI dari data prod (lihat bagian 8) |

---

## 1. Deskripsi masalah / tujuan
User: "buatkan data penilaian regu, regu siapa yang paling aktif, regu siapa yang paling tidak
aktif, di regu itu siapa saja yang tidak klik meluncur, buatkan semua data yang bisa didapat untuk
evaluasi regu dan penggunaan aplikasi."

Keputusan user 2026-11-01:
- Sementara = laporan sekali jadi (Excel dari data prod, read-only, tanpa ubah kode). Rencana
  halaman di aplikasi dicatat di task ini untuk dikerjakan nanti.
- Peringkat "paling aktif" = **persentase kehadiran anggota** saja (bukan gabungan dengan
  kecepatan). Kecepatan tetap ditampilkan sebagai kolom informasi.

## 2. Data yang tersedia (tanpa migrasi)
| Sumber | Dipakai untuk |
|--------|---------------|
| `regus`, `regu_members` | daftar regu, danru (`leader_id`), anggota SAAT INI |
| `report_officers` (`regu_id`, `regu_name` snapshot, `dispatched_at`, `arrived_at`, `arrived_by`, `start_lat/lng`) | siapa Meluncur, kapan, tiba ditandai siapa, titik berangkat |
| `report_jaga_kantor` | siapa Jaga di Kantor |
| `report_alpha` (sejak 2026-09-29, ditulis saat kejadian DITUTUP) | anggota yang tidak memilih apa pun |
| `reports.approved_at/approved_by` (sejak TASK_72) | awal hitungan waktu tanggap, waktu verifikasi admin |
| `sessions.last_activity` | terakhir aktif (hanya sesi yang masih hidup) |
| `fcm_tokens.device_type` | HP siap notifikasi per platform |
| `notifications.read_at` | notifikasi di aplikasi yang dibaca |
| `site_visitors_daily`, `site_page_views_daily` (TASK_79) | kunjungan anonim per hari/kanal, halaman terpopuler |
| `report_helpers` | relawan yang merespons |

## 3. Definisi metrik (satu rumus, dipakai halaman & Excel)
- **Kejadian ditanggapi regu** = kejadian (tidak demo, tidak dihapus) dengan minimal satu baris
  `report_officers` ATAU `report_jaga_kantor` ber-`regu_id` regu itu.
- **Kehadiran anggota** = meluncur / (meluncur + jaga kantor + alpha) pada kejadian yang ditanggapi
  regunya. "Hadir respons" = meluncur + jaga kantor (keduanya menekan tombol).
- **Alpha** = baris `report_alpha` (bukan dihitung ulang dari keanggotaan sekarang - anggota bisa
  sudah pindah).
- **Waktu klik Meluncur** = `dispatched_at - reports.approved_at` (median). **Waktu tempuh** =
  `arrived_at - dispatched_at` hanya bila `arrived_by = user_id` (ditandai rekan = waktu rekan).
- **Tiba ditandai rekan** = `arrived_by IS NOT NULL AND arrived_by <> user_id`.
- Regu yang TAK SATU PUN anggotanya menanggapi = "tidak menanggapi", BUKAN alpha (tidak ada jadwal
  jaga, keputusan desain TASK_66).
- Akun demo (`users.is_demo`, `reports.is_demo`) dikecualikan.
- Waktu ditampilkan WITA (DB = UTC, konversi di tepi seperti #134).

## 4. Rencana (halaman aplikasi - DITUNDA)
- `app/Support/ReguEvaluation.php` (atau pola query-class yang sudah ada) - satu kelas query,
  ter-scope Tenantable, dipakai halaman + Export.
- Route `admin.regu-evaluation.index` + `.export` di `routes/admin.php` (admin|superadmin).
- `resources/js/Pages/Admin/ReguEvaluation/Index.jsx` - filter periode WITA, kartu angka kunci,
  tabel peringkat regu, anggota per regu (bisa dibuka), bagian Penggunaan Aplikasi.
- `app/Exports/ReguEvaluationExport.php` - sheet Regu, Anggota, Daftar Alpha, Penggunaan.
- Test `tests/Feature/Sisupit/ReguEvaluationTest.php` - hitungan, batas wilayah, akses peran,
  demo dikecualikan.
- Update ARCHITECTURE_MAP (route + halaman), navItems admin.

## 5. Blast radius
Hanya baca. Tanpa migrasi, tanpa perubahan alur Meluncur/Jaga/Tiba.

## 6. Rencana verifikasi
- [ ] Baseline pest sebelum (913 passed)
- [ ] ReguEvaluationTest
- [ ] Angka halaman = angka laporan sekali jadi untuk periode yang sama (prod)
- [ ] `npm run build` lulus

## 7. Rollback
Commit fokus -> revert. Tanpa migrasi.

## 8. Laporan sekali jadi (2026-11-01)
Skrip ekstraksi read-only (di luar repo, tidak di-commit) dijalankan di prod lewat SATU koneksi SSH,
keluaran JSON diolah lokal menjadi Excel. Lokasi berkas & ringkasan hasil: lihat catatan di bawah.

- `extract_regu.php` (14 SELECT, dijalankan sebagai www-data) + `gen_report.py` (openpyxl, 13 sheet:
  Ringkasan, Peringkat Regu, Anggota Regu, Daftar Alpha, Respons per Kejadian, Kejadian Tanpa Regu,
  Petugas Tanpa Regu, Penggunaan per Peran, Pengguna Staf, Laporan per Bulan, Verifikasi Admin,
  Kunjungan Harian, Halaman Terpopuler). Diuji dengan DB lokal 2026-11-01.
- SSH ke prod dari sesi Claude DITOLAK pengaman otomatis (Production Reads) -> user menjalankan
  `ambil-data-prod.cmd` sendiri, lalu Excel dibuat dari `prod.json`.
- `gen_report.py` = acuan rumus untuk halaman aplikasi nanti (bagian 3 & 4).
- 2026-11-01 DIJALANKAN: user menjalankan `ambil-data-prod.cmd` (prod.json 391 KB, kode 0). Excel:
  `C:\Users\Admin\Documents\Sisupit Laporan\Evaluasi-Regu-2026-11-01.xlsx` (berisi nama = PII, tidak di repo).
  Ringkas: 16 regu / 128 anggota; 181 laporan disiarkan; 283 Meluncur regu, 37 Jaga, 970 alpha.
  Kehadiran tertinggi Walet 3 37,5% & PAKSI 2 33,3%; terendah Paksi 1 9,4%; Camar 1 nol respons
  (0/130). 57/128 anggota regu TANPA token FCM (tak pernah dapat push) - pola alpha terberat ada
  di kelompok ini. 40 akun petugas belum masuk regu.
- 2026-11-01 keputusan user: status HP/token notifikasi TIDAK dipakai sebagai alasan di evaluasi regu (notifikasi
  di kantor pasti ada); itu laporan terpisah bila diminta. Halaman nanti: jangan tampilkan kolom HP di evaluasi regu.
  Ringkasan visual: `C:\Users\Admin\Documents\Sisupit Laporan\Evaluasi-Regu-Ringkasan-2026-11-01.html`.
- 2026-11-06 DIJALANKAN ULANG (permintaan user "buatkan lagi rekapan dari regu"): skrip sama (disalin ke folder job), data prod
  diambil user lewat `! ssh ... sisupit-vps "runuser -u www-data -- php" < extract_regu.php > prod.json` (467 KB, kode 0;
  catatan: `! C:\...\x.cmd` gagal - bash `!` membuang backslash, pakai jalur /c/...). Berkas:
  `Evaluasi-Regu-2026-11-06.xlsx` + `Evaluasi-Regu-Ringkasan-2026-11-06.html` di folder yang sama (PII, tidak di repo).
  Ringkas: 16 regu / 132 anggota; 236 laporan, 216 disiarkan, 213 selesai; 360 Meluncur regu, 50 Meluncur perorangan,
  49 Jaga, 1187 alpha; kehadiran keseluruhan 22,4%. Tertinggi Camar 1 44,4% (hanya 2 kejadian berdata lengkap),
  Walet 4 38,5% (4), PAKSI 2 35,1% (19), Walet 3 34,9% (19); terendah Paksi 1 12,2%, Paksi 3 15,1%, Elang 2 15,7%.
- 2026-11-06 PERBAIKAN SALAH PERSEPSI (permintaan user): (1) regu baru DIPERINGKAT bila kejadian berdata lengkap >= 10
  (MIN_KEJ); regu di bawahnya = kelompok "Belum bisa dinilai" tanpa persentase (Camar 1 dulu "paling aktif" dari 2 kejadian).
  Hasil: 8 regu diperingkat - teratas PAKSI 2 35,1% (19), Walet 3 34,9% (19); terbawah Paksi 1 12,2% (16). (2) persentase per
  orang hanya bila dasar >= 5 kejadian (MIN_KEJ_ORANG). (3) "belum pernah Meluncur" hanya anggota yang PERNAH dipanggil
  (Meluncur+Jaga+alpha > 0): 43 orang; Nandika Prasetya (masuk Walet 4 2026-11-03, sesudah kejadian terakhir regu) dikeluarkan
  dengan keterangan. Excel: kolom Keterangan di Peringkat Regu, kolom Dasar kehadiran + Masuk regu di Anggota Regu.
  Skrip terbaru (tanpa PII): `C:\Users\Admin\Documents\Sisupit Laporan\skrip\` - acuan rumus halaman nanti (ambang yang sama).

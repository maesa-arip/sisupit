# TASK_44 — Pin koreksi lokasi, jalan ke detail dari Peta Pemantauan, & jejak penutup insiden
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_44 |
| Severity | P2 |
| Tipe | bugfix (A) + fitur kecil (B, C) |
| Sumber | permintaan user 2026-08-27 (satu pesan, tiga permintaan) → FINDINGS #86, #87, #88 |
| Status | DONE (kode) — sisa verifikasi manual §6 |

---

## 1. Deskripsi masalah / tujuan

Satu pesan user, tiga permintaan:

> "Saat tiba dilokasi dan perbaiki geser titik lokasi bug kembali ke titik asli, Di peta
> pemantauan saat klik kejadian mengarah ke detail, Siapa yang klik selesai kejadian muncul
> dan tercatat"

- **(A)** Responder yang sudah tiba menekan "Koreksi Lokasi Insiden", menggeser pin merah —
  pin kembali sendiri ke titik asal sebelum sempat dikonfirmasi.
- **(B)** Di Peta Pemantauan, klik marker kejadian harus bisa membawa operator ke halaman
  detail insiden.
- **(C)** Siapa yang menekan "Tandai Insiden Selesai" harus tercatat dan terlihat.

Dua keputusan cakupan ditanyakan lebih dulu dan dijawab user:
1. Klik marker kejadian → **popup TETAP, ditambah tombol "Lihat Detail"** (alternatif
   "langsung pindah halaman tanpa popup" DITOLAK).
2. Penutup insiden tampil di **ketiganya**: halaman detail, Export Excel, dan daftar
   `/admin/reports`. Sekaligus **penolak laporan ikut dicatat** — kolom `rejected_at` /
   `rejected_reason` sudah lama ada, pelakunya belum.

## 2. Reproduce (bukti masalah ada)

**(A)** Buka `/reports/show/{id}` sebagai petugas yang sudah `arrived` di insiden itu →
"Koreksi Lokasi Insiden" → geser pin. Dalam hitungan detik (satu tik GPS) pin melompat balik.
Syarat munculnya: GPS perangkat aktif — dan responder yang mengoreksi PASTI memenuhinya,
karena `watchPosition` menyala selama ia belum `finished`.

**(B)** Buka `/peta-pemantauan` → klik marker kejadian → popup muncul tanpa satu pun tautan.

**(C)** Kolom `reports.resolved_by` tidak ada sama sekali. Pertanyaan "siapa yang menutup
insiden ini?" tak bisa dijawab dari data mana pun. Enam test di
`tests/Feature/Sisupit/ReportClosureActorTest.php` **dibuktikan merah** lebih dulu terhadap
kode lama.

## 3. Root cause

**(A) `resources/js/Pages/Front/Reports/Show.jsx`** — dua lapis:
1. Effect peta memulai dengan `incidentMarkerRef.current.remove()` lalu membangun marker BARU
   dari `incidentLocation` (koordinat dari server).
2. `dragend` hanya menulis `pendingPosition`, state yang tak pernah ikut menggambar marker —
   ia baru dibaca saat tombol "Konfirmasi Lokasi" ditekan.

Pemicunya `officerList` / `helperList` di dependensi effect: `watchPosition` responder
memanggil `setOfficerList` tiap tik GPS → effect jalan ulang → marker dibangun ulang di titik
asal. Tidak ada galat; pin sekadar "menolak" digeser.

**(B) `resources/js/Pages/Monitoring/Map.jsx`** — marker kejadian hanya `bindPopup()`. Bukan
kekurangan data: `MonitoringMapController` SUDAH mengirim `id` tiap laporan.

**(C) `app/Http/Controllers/ReportActionController.php`** — `resolve()` hanya menulis
status `resolved`; tak ada kolom pelaku sama sekali. `reject()` setengah jalan sejak #24:
menyimpan KAPAN & KENAPA, tidak SIAPA.

## 4. Perubahan

### Backend
- `database/migrations/2026_08_27_100000_add_closure_actor_to_reports_table.php` — **BARU**,
  aditif: `resolved_by`, `resolved_at`, `rejected_by` (nullable, `nullOnDelete`).
- `app/Models/Report.php` — `$fillable` + cast `resolved_at`, relasi `resolver()` &
  `rejector()`.
- `app/Http/Controllers/ReportActionController.php` — `resolve()` mengisi `resolved_by` +
  `resolved_at`; `reject()` mengisi `rejected_by`.
- `app/Http/Controllers/ReportController.php` — `show()` memuat `resolver:id,name`,
  `rejector:id,name`.
- `app/Http/Controllers/Admin/ReportController.php` — daftar memuat `resolver:id,name`.
- `app/Exports/ReportsExport.php` — 32 → **35 kolom**; `LAST_COLUMN` `AF` → `AI`; kolom baru
  "Ditolak Oleh" (S), "Ditutup Oleh" (W), "Waktu Ditutup" (X).

### Frontend
- `resources/js/Pages/Front/Reports/Show.jsx` — marker TKP dipakai ulang + posisi dari
  `pendingPosition ?? incidentLocation`; `isDraggingIncidentRef` & `incidentPulseRef`; baris
  `closureActorLine()` di kartu "Laporan Ditolak" dan blok "INSIDEN SELESAI DITANGANI".
- `resources/js/Pages/Monitoring/Map.jsx` — tombol "Lihat Detail" di popup kejadian.
- `resources/js/Pages/Admin/Reports/Index.jsx` — baris "Ditutup oleh …" pada laporan Selesai.

### Test
- `tests/Feature/Sisupit/ReportClosureActorTest.php` — **BARU**, 6 test.

## 5. Blast radius & hal yang mengikat

1. **Nama relasi `resolver` / `rejector` BUKAN `resolvedBy` / `rejectedBy`.** Model `Report`
   dikirim UTUH ke halaman detail; relasi diserialisasi ter-snake_case, sehingga `resolvedBy`
   akan MENIMPA kolom `resolved_by` di JSON — atributnya berubah dari angka jadi objek tanpa
   galat apa pun. Pola yang diikuti: `ReportResolution::creator()` untuk `created_by`.
2. **`resolved_at` bukan kembaran kolom "Jam Selesai".** Yang itu diturunkan dari
   `finished_at` responder terakhir; `resolved_at` adalah saat Pusat Komando menyatakan
   insiden ditutup. Keduanya diekspor berdampingan; jangan digabung.
3. **Tiga daftar di berkas ekspor harus sepanjang** (heading, nilai `map()`, `columnWidths`)
   dan `LAST_COLUMN` mengikuti. Sudah dikunci test — kolom yang bergeser membuat SELURUH
   rekap terbaca salah tanpa satu pun galat.
4. **Audiens jejak penutupan = staf/pejabat/relawan**, satu gerbang `canSeeClosureActor`.
   Kartu "Laporan Ditolak" sendiri terbuka untuk pelapor; menampilkan nama petugas penolak
   ke pelapor adalah keputusan tersendiri — ubah di satu tempat itu bila dikehendaki.
5. **`pendingPosition` sengaja di luar dependensi effect peta** — effect itu melepas &
   menyambung ulang channel Echo dan menggambar ulang rute OSRM.
6. **Tombol popup memakai tautan `<a href>` asli**, bukan hanya handler: popup Leaflet adalah
   HTML mentah sehingga `<Link>` Inertia tak bisa dipakai; bila handler gagal terpasang
   tautannya tetap berfungsi lewat muat ulang penuh.
7. **Tanpa backfill.** Laporan lama berbunyi "tidak tercatat" di layar dan "-" di ekspor.

## 6. Verifikasi

- [x] Baseline `php artisan test` sebelum: **323 passed (1234 assertions)**
- [x] Test baru dibuktikan **merah** dulu (6/6) terhadap kode lama, lalu hijau
- [x] Test sesudah: **329 passed (1253 assertions)**
- [x] `npm run build` lulus
- [x] `vendor/bin/pint` PASS
- [ ] **Manual (A):** login petugas → insiden yang sedang ditangani → "Meluncur" → "Tiba di
      Lokasi" → "Koreksi Lokasi Insiden" → geser pin, **tunggu 15 detik atau lebih dengan GPS
      aktif**, pin harus DIAM di posisi baru → "Konfirmasi Lokasi" → alamat & titik berubah,
      dan viewer lain ikut bergeser lewat `IncidentLocationCorrected`.
- [ ] **Manual (A2):** tekan "Batal" saat mode koreksi → pin kembali ke titik asal (memang
      perilaku yang benar, bukan gejala bug lama).
- [ ] **Manual (B):** `/peta-pemantauan` → klik marker kejadian → popup punya tombol
      "Lihat Detail" → membuka `/reports/show/{id}` tanpa muat ulang penuh.
- [ ] **Manual (C):** tutup sebuah insiden → halaman detail menampilkan "Ditutup oleh
      <nama> · <waktu>"; `/admin/reports?status=resolved` menampilkan baris "Ditutup oleh …";
      Export Excel punya kolom "Ditutup Oleh" / "Waktu Ditutup" / "Ditolak Oleh" — **buka
      berkasnya di Excel**, 35 kolom, tak ada isi yang bergeser kolom.
- [ ] **Deploy:** `php artisan migrate --force` di dev → staging → prod. Migrasi ADITIF (hanya
      menambah 3 kolom nullable), tak ada risiko kehilangan data; tetap ambil cadangan
      `mysqldump` tabel `reports` lebih dulu. Route & channel TIDAK berubah, jadi route cache
      tak wajib dibangun ulang.

## 7. Rollback

Satu rentang commit fokus → `git revert`. Migrasinya punya `down()` yang membuang ketiga
kolom (`dropConstrainedForeignId` untuk kedua FK). Karena aditif, membiarkan kolomnya tetap
ada sementara kodenya di-revert juga aman.

---

## Acceptance criteria
- [x] Ketiga permintaan user terpenuhi
- [x] Tidak ada regresi (323 → 329 passed)
- [x] Diff minimal & sesuai konvensi
- [x] `FINDINGS_LOG.md` #86 / #87 / #88 dicatat FIXED

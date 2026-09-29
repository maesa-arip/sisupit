# TASK_67 — Laporan Kejadian: satu entri sementara + satu final, bisa disunting, berriwayat

| Field | Isi |
|-------|-----|
| ID | TASK_67 |
| Severity | P2 |
| Tipe | perubahan perilaku (membalik append-only FINDINGS #39) + skema aditif |
| Sumber | permintaan user 2026-09-29 (dipecah TASK_64-68) |
| Status | DONE (kode); migrasi DONE di MySQL dev LOKAL, BELUM di VPS |

---

## 1. Tujuan & keputusan user
"Laporan Kejadian sementara cuma ada 1 dan bisa di edit petugas lain, cuma catat apa apa yg
berubah". Ditanyakan lebih dulu; user memilih **1 sementara + 1 final terpisah**: satu entri
sementara (petugas mana pun di wilayahnya boleh menyunting, tercatat) dan satu entri final dari
admin.

## 2. Kondisi awal
`ReportResolutionController::store()` APPEND-ONLY: tiap simpan = baris baru, tanpa batas per
laporan, tanpa route edit. Form punya dua tombol (Simpan Sementara / Simpan Final) dan prefill
dari entri terbaru, TANPA membawa KTP & foto - entri final baru kehilangan KTP kecuali diunggah
ulang.

## 3. Perubahan
- **Entri aktif = yang TERBARU per status** (`activeEntry()`). Entri ganda sisa masa append-only
  TIDAK dihapus/dimigrasi - tampil sebagai "Arsip". Tanpa backfill.
- `store()` = upsert: menyunting entri aktif status itu, membuatnya bila belum ada. Laporan
  dikunci `lockForUpdate()` supaya dua petugas yang menyimpan bersamaan tak membuat dua entri.
  `created_by` tetap pembuat pertama; penyunting di riwayat.
- Korban ber-`id`: milik entri ini = disunting (KTP tetap kecuali diganti/`remove_ktp`); milik
  entri LAIN laporan yang sama = DISALIN berikut SALINAN berkas KTP (bukan path bersama -
  menghapus satu entri tak boleh menghapus KTP entri lain); tanpa `id` = baru; tak dikirim lagi =
  dihapus. Foto: `keep_photo_ids` (milik sendiri dipertahankan, milik entri lain disalin), batas
  8 berlaku untuk TOTAL. Berkas dihapus SESUDAH transaksi berhasil.
- Riwayat: tabel BARU `report_resolution_logs` (pola `hydrant_logs` TASK_59) - append-only,
  penyunting di-snapshot, `changes` = [{field,label,old,new}] dari `ReportResolution::snapshot()`
  (teks siap baca: waktu WITA, korban diringkas "Nama (kondisi) [KTP]"). Penggantian KTP & foto
  ditambah/dihapus dicatat eksplisit oleh controller (jumlah sama != isi sama). Simpan tanpa
  perubahan = tanpa baris.
- **Hapus entri FINAL = admin saja** (ikutan wajib: tanpa itu petugas bisa menghilangkan entri
  final beserta riwayatnya).
- Form: `?status=sementara|final` (final 403 bagi non-admin), SATU tombol simpan, KTP & foto
  tersimpan tampil dan bisa dilepas. Detail: tombol "Isi/Ubah Sementara" & "Isi/Ubah Final"
  (prop server `canFinalizeResolution`), lencana "Arsip", blok "Riwayat perubahan".

## 4. Blast radius
- `ReportsExport` (entri wakil = final, kalau tidak terbaru) & antrean "Menunggu Berita Acara"
  (belum ada entri sama sekali) tidak berubah maknanya.
- Tautan lama `reports.resolution.create` tanpa `status` = form sementara (bawaan).
- TASK_68 (PDF) membaca entri aktif.

## 5. Verifikasi
- [x] `ReportResolutionSingleEntryTest` BARU (8); sabotase kembali-append-only (5 merah) &
  KTP-berbagi-path (merah), pulih `cmp`. Judul test append-only lama diluruskan (asersinya tetap
  benar: final & sementara berdampingan).
- [x] Suite 606 passed (2883), Pint & prettier bersih, build lulus.
- [ ] Manual: petugas A isi sementara, petugas B ubah kerugian -> satu entri, riwayat
  "Estimasi Kerugian: ±1jt -> ±3jt". Admin "Isi Final" -> korban & KTP & foto terbawa.

## 6. Deploy
Kode + `php artisan migrate` BERSAMAAN (tanpa migrasi, halaman detail 500 karena relasi `logs`).

## 7. Rollback
`php artisan migrate:rollback --step=1` + revert commit. Entri yang sempat disunting tetap
satu baris (tak ada data yang hilang, hanya riwayatnya).

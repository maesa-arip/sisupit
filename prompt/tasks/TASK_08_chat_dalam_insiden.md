# TASK 08 — Chat/koordinasi dalam-insiden (responder ↔ command center)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_08 |
| Severity | P2 |
| Tipe | fitur |
| Sumber | permintaan user (analisis fitur kurang 2026-06-28, #2) |
| Status | TODO |

---

## 1. Deskripsi masalah / tujuan
Tidak ada kanal pesan antar pihak yang menangani satu insiden. Pusat Komando dan responder
(petugas/relawan) di lapangan tidak bisa bertukar info teks per laporan (mis. "akses jalan
ditutup", "butuh unit tambahan", "korban terjebak lantai 2"). Koordinasi sekarang hanya
lewat perubahan status + tracking lokasi. Tujuan: kanal chat ringan, real-time, ter-scope
per laporan, hanya untuk pihak yang berwenang atas laporan itu.

## 2. Reproduce (bukti masalah ada)
Kondisi awal: buka `Reports/Show` sebuah laporan yang sedang `handling` sebagai petugas dan
sebagai admin command center secara bersamaan. Tidak ada elemen UI maupun endpoint untuk
mengirim/menerima pesan. Tidak ada model/tabel pesan: `grep` `message`/`chat` di
`app/Models` & `routes/` tidak menemukan kanal percakapan per-laporan (hanya
`Enums/MessageType` untuk flash message, tidak terkait).

Hasil yang diharapkan: pesan yang dikirim satu pihak muncul real-time di pihak lain pada
laporan yang sama, dan tersimpan sebagai riwayat.

## 3. Root cause
Fitur belum pernah dibuat. Infrastruktur real-time SUDAH ada (Reverb + pola
`broadcast(new Event)` di `ReportActionController::updateLocation` l.185 dan
`Events/ResponderLocationUpdated`), jadi ini penambahan di atas fondasi yang ada, bukan
infrastruktur baru.

## 4. Rencana fix (perubahan terkecil yang benar)
- `database/migrations/XXXX_create_report_messages_table.php` — **baru**: `id`,
  `report_id` (constrained, cascade), `user_id` (constrained), `body` (text), timestamps.
- `app/Models/ReportMessage.php` — **baru**: `belongsTo(Report)`, `belongsTo(User)`,
  `$fillable=['report_id','user_id','body']`.
- `app/Events/ReportMessageSent.php` — **baru**, `implements ShouldBroadcast`. Tiru
  `app/Events/ResponderLocationUpdated.php` (channel privat per laporan, mis.
  `PrivateChannel("report.{$reportId}")`). Payload: id pesan, user_id, nama, body, waktu.
- `routes/channels.php` — daftarkan otorisasi channel `report.{reportId}`: izinkan HANYA
  pelapor pemilik, ATAU user dengan `hasAnyRole(['petugas','admin','superadmin'])` yang
  berwenang atas laporan (re-gunakan pola `authorizeReportAccess` milik `ReportController`
  agar konsisten dengan aturan IDOR yang sudah ada — ATURAN EMAS #7). **Keputusan scope
  yang harus dikonfirmasi:** apakah pelapor warga boleh ikut chat, atau chat khusus
  internal responder+command center? Default rencana: internal responder + command center
  saja (lebih aman); pelapor tetap pakai jalur notifikasi status (TASK_06).
- `app/Http/Controllers/ReportMessageController.php` — **baru**: `index($reportId)` (load
  riwayat dengan guard akses) + `store($reportId)` (validasi `body` required|string|max,
  buat `ReportMessage`, `broadcast(new ReportMessageSent(...))`). Daftarkan di
  `routes/web.php` di grup `auth+verified` dengan guard role/ownership eksplisit (jangan
  andalkan middleware route saja — codebase mencampur 3 mekanisme, lihat ARCHITECTURE_MAP
  catatan risiko #4).
- Frontend `resources/js/Pages/.../Reports/Show.jsx` — panel chat: subscribe channel privat
  via Echo/Reverb (pola yang sama dengan listener tracking yang sudah ada di halaman ini),
  daftar pesan + input kirim. Ikuti `.claude/skills/sisupit-ui/SKILL.md`.

## 5. Blast radius
- `Reports/Show` sudah berlangganan Reverb untuk tracking — tambah satu channel lagi,
  pastikan tidak bentrok dengan listener `ResponderLocationUpdated`/`IncidentLocationCorrected`.
- Reverb prod: channel privat butuh auth endpoint `/broadcasting/auth` aktif (cek setup
  Reverb prod di memori `project_sisupit_reverb_ws_prod_2026-06-27`).
- Otorisasi channel = permukaan IDOR baru → WAJIB test khusus (user wilayah/role lain tidak
  bisa subscribe maupun `store`).
- Volume pesan & retensi: tidak ada hapus otomatis; untuk MVP biarkan append-only.

## 6. Rencana verifikasi
- [ ] Baseline test sebelum: `php artisan test`
- [ ] Test baru `tests/Feature/Sisupit/ReportMessageAuthorizationTest.php`: responder/admin
      berwenang bisa `store` & `index`; user role/wilayah lain → 403; channel auth ditolak
      untuk non-peserta.
- [ ] Test sesudah hijau
- [ ] Verifikasi manual: dua browser (petugas + admin), kirim pesan, muncul real-time di
      kedua sisi; user tak berwenang tak bisa akses.
- [ ] `npm run build` lulus.

## 7. Rollback
Migrasi `down()` drop `report_messages`. Commit fokus → `git revert`. Tidak ada perubahan
pada alur status/tracking inti.

---

## Acceptance criteria
- [ ] Pesan terkirim real-time antar peserta laporan yang sama (terbukti manual + test)
- [ ] Hanya peserta berwenang (ownership/role) bisa baca/kirim/subscribe — tidak ada IDOR
- [ ] Scope peserta (warga ikut atau internal saja) dikonfirmasi user sebelum implementasi
- [ ] Tidak ada regresi (test ≥ baseline) & tidak bentrok dengan listener Reverb existing
- [ ] Diff sesuai konvensi (tiru Event/broadcast & guard akses yang sudah ada)
- [ ] `prompt/docs/ARCHITECTURE_MAP.md` ditambah modul "Chat insiden" + channel baru

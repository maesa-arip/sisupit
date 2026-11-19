# TASK_91 — Pengajuan pembatalan laporan oleh petugas (FINDINGS #248)

| Field | Isi |
|-------|-----|
| ID | TASK_91 |
| Severity | P2 |
| Tipe | fitur kecil (ADA MIGRASI) |
| Sumber | permintaan user 2026-11-19: "ajukan pembatalan dari petugas, ada laporan petugas sudah otw tapi ternyata batal dari pelapor, harus ada alasan" |
| Status | DONE (lokal, belum commit/deploy) |

## 1. Tujuan
Petugas sudah Meluncur, lalu pelapor mengabari kejadiannya batal (api padam sendiri, salah lapor).
Tak ada cara menutupnya dengan benar: `cancelResponse` hanya memundurkan SATU petugas (laporan tetap
aktif), `reject` = "tidak valid/hoaks" (admin saja, pelapornya jujur), `resolve` = tercatat "Selesai
Ditangani" + alpha regu. Dibutuhkan pembatalan BERALASAN.

## 2. Keputusan user (2026-11-19, AskUserQuestion)
- **Wewenang: "Ajukan, admin setujui"** - petugas mengajukan, laporan tetap berjalan sampai admin
  menyetujui. Sejalan TASK_51 (keputusan status = admin).
- **Status: baru `dibatalkan`** - terpisah dari Ditolak & Selesai.

## 3. Bentuk solusi
- Tabel `report_cancellations` (migrasi `2026_11_19_100000`): report_id, requested_by +
  `requester_name` (snapshot), `reason` (wajib, 5-500), `status` menunggu/disetujui/ditolak,
  decided_by + `decider_name`, `decision_note`, `decided_at`. Tabel, bukan kolom `reports`: satu
  laporan bisa diajukan lagi sesudah ditolak, riwayatnya tetap.
- Model `ReportCancellation`: `canRequest()` (petugas, wilayah laporan, status pending|handling,
  belum ada yang menunggu) & `canDecide()` (admin|superadmin, wilayah, ada yang menunggu) - SATU
  rumus untuk endpoint DAN prop tombol (`canRequestCancellation`/`canDecideCancellation`).
  `toDetail($withActors)` - nama pengaju/pemutus hanya untuk audiens jejak penutupan (#88).
- `ReportActionController::requestCancellation / approveCancellation / declineCancellation`,
  route `reports.cancellation.{request,approve,decline}` (`POST reports/{id}/pembatalan[/setujui|/tolak]`).
  - Ajukan: kunci baris laporan (pengajuan ganda), `ReportRecordChanged`, notif admin
    (`User::triageAdminsFor`).
  - Setujui: status `dibatalkan`; report_officers/helpers en_route|arrived -> `finished`; unit
    dikerahkan -> released/available; **TANPA ReportAlpha**; notif pelapor (`ReportStatusUpdatedNotification`
    event `cancelled`, ikut anak gabungan lewat `notifyReporter`); notif responder yang masih
    bergerak + pengaju; `ReportStatusChanged` + `ReportFeedChanged` + `ResponderRosterChanged`.
  - Tolak: catatan opsional, notif pengaju, `ReportRecordChanged`; boleh diajukan lagi.
- `ReportCancellationNotification` (FCM `type: report_status` + database, TANPA broadcast - pola
  #209; `report_id` menimpa sirine dispatch di HP petugas), `DipicuAkunDemo`.
- Status `dibatalkan` = daftar hitam (pelajaran TASK_55): takeAction, stayAtBase, dispatchUnit,
  notifyAgencies, arrive, updateLocation (balas `stopped` -> layanan lokasi APK berhenti), reject &
  resolve (403), `reguManifest $isOpen`, SimulateResponders. TIDAK disembunyikan dari pemantau
  (pejabat/relawan) & feed - ia kejadian terverifikasi yang ditutup, seperti `resolved`.
- Kamus layar: StatusBadge, Admin/Reports/Index (STATUS_META/OPTIONS/FILTER_LABEL/LEGEND -> ikut
  pilihan Export), Monitoring/Map (REPORT_STATUS + tersembunyi bawaan), Show `getReportStatus`,
  ReportProgress (`STATUS_DIBATALKAN`, `isClosedStatus`, keterangan), ReportCard (dulu laporan
  ber-responder mengaku "Penanganan"). Export: label "Dibatalkan", kolom R jadi
  "Alasan Ditolak/Dibatalkan" berisi "Dibatalkan: alasan (disetujui X, waktu)".
- Show.jsx: tombol "Ajukan Pembatalan Laporan" di Panel Tindakan, kartu "Pengajuan Pembatalan"
  (menunggu/ditolak, staf saja; admin: Tolak/Setujui), kartu "Laporan Dibatalkan" + alasan, satu
  dialog tiga mode (pilihan cepat alasan mengisi textarea). `reloadIncident` + 3 prop.

## 4. Blast radius
Semua penyaring status (lihat §3). Notifikasi baru memakai `type` yang sudah dikenal APK lama.
Tak ada APK/iOS baru. MIGRASI: kode & `php artisan migrate` wajib naik bersamaan.

## 5. Verifikasi
- Baseline (berjalan BERSAMAAN dengan suntingan, jadi bukan murni pra-perubahan): 991 passed,
  1 failed (`ReportExportTest` export choices - tertangkap di antara dua suntingan).
- `ReportCancellationTest` 9 test / 119 assertion hijau. Sabotase: `dibatalkan` dibuang dari
  daftar hitam takeAction -> test "closed for every field action" MERAH (302 vs 403); dipulihkan (cmp).
- Suite penuh sesudah: lihat STATUS_LOG.
- `npm run build` lulus. Pint --test lulus untuk berkas baru. Prettier: ReportCard & Admin/Reports/Index
  dirapikan (bersih di HEAD); Show.jsx & Map.jsx sudah tak rapi sejak HEAD - selisihnya tetap 51 baris.

### Langkah uji manual (belum dilakukan)
1. Login petugas, buka laporan `handling` tempat ia Meluncur -> "Ajukan Pembatalan Laporan" -> tanpa
   alasan tombol Ajukan mati -> pilih "Dibatalkan oleh pelapor" -> Ajukan.
2. Login admin wilayah sama: notif "Pengajuan pembatalan laporan"; detail memuat kartu dengan
   Tolak/Setujui -> Setujui -> status "Dibatalkan", kartu alasan, HP petugas "Misi dibatalkan",
   pelapor "Laporan Anda dibatalkan".
3. Peta Pemantauan: chip "Dibatalkan" (mati bawaan). /admin/reports chip & Export.

## 6. Tidak dikerjakan (catatan)
- Admin tak bisa langsung membatalkan tanpa pengajuan petugas (mis. pelapor menelepon Pusat Komando).
- Pengajuan yang menunggu tak tampil di dashboard admin (hanya notif + detail laporan).
- Laporan Kejadian tak bisa diisi untuk laporan dibatalkan (`abortUnlessResolved`).

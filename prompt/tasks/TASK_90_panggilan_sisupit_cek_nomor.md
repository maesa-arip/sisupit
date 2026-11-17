# TASK_90 — Panggilan suara lewat Sisupit (tahap 1, web) + cek nomor sebelum kirim

| Field | Isi |
|-------|-----|
| ID | TASK_90 |
| Severity | P1 |
| Tipe | fitur |
| Sumber | permintaan user 2026-11-15 (FINDINGS #245, #246) |
| Status | DONE (lokal, belum deploy, ADA MIGRASI) |

---

## 1. Tujuan

Kejadian nyata: ada laporan, nomor pelapor tak bisa ditelepon, ternyata kejadiannya benar. Percakapan
2026-11-15: OTP via WhatsApp dibahas, lalu DITUNDA (berbayar / risiko blokir, dan OTP tak menjamin nomor
diangkat; lapor tamu tetap tanpa OTP, keputusan TASK_77). User menyetujui:

1. **Tahap 1 panggilan Sisupit** - Pusat Komando menelepon pelapor lewat internet (WebRTC) dari halaman
   detail laporan; berdering di aplikasi/halaman status pelapor yang sedang terbuka; pelapor ber-akun yang
   aplikasinya tertutup mendapat push biasa "Damkar sedang menelepon Anda".
2. **Cek nomor sebelum kirim** - nomor yang akan ditelepon ditampilkan dan dikonfirmasi pelapor.

Tahap 2 (dering layar penuh saat HP terkunci, APK 1.2.0) & tahap 3 (iOS CallKit) = task terpisah.

## 2. Kondisi awal

- Tak ada jalur kontak selain `tel:` dan `wa.me` (TASK_65) - dua-duanya bergantung pada nomor.
- Pelapor ber-akun: nomor profil terkirim diam-diam (`phone: auth?.phone`), tak pernah terlihat di form.
- Tamu: nomor wajib berformat 08..., tapi tak pernah ditampilkan ulang sebelum kirim.

## 3. Rancangan

**Sinyal lewat server, siaran = aba-aba** (pola #113 / ReportRecordChanged):
- Tabel `reporter_calls` (MIGRASI `2026_11_15_110000`): satu baris per panggilan, `offer_sdp`/`answer_sdp`,
  status `ringing -> answered -> ended`, `end_reason` (completed/declined/no_answer/cancelled/no_mic/failed),
  `caller_name` snapshot, `callee_user_id` NULL = tamu.
- Pemanggil membuat offer LENGKAP di depan (ICE dikumpulkan dulu, tanpa trickle, batas 3 dtk) -> `POST
  reports/{report}/panggilan`. Pelapor Terima -> answer lengkap -> `POST panggilan/{call}/jawab`. Pemanggil
  memasang answer -> tersambung -> `POST .../tersambung` (awal durasi). Akhiri dari sisi mana pun.
- `ReporterCallChanged` (ShouldBroadcastNow, `broadcastAs` `reporter-call.changed`, payload `callId`+`status`
  saja) ke channel pribadi pemanggil & pelapor ber-akun, atau channel PUBLIK bernama rahasia
  (`ReporterCall::guestChannel` = HMAC id laporan dengan APP_KEY) milik halaman status tamu. SDP diambil lewat
  HTTP bergerbang peserta. Aman bagi exe desktop: ia hanya membunyikan `BroadcastNotificationCreated`.
- Polling cadangan 2 dtk selama panggilan aktif (5 dtk saat tersambung): AppLayout melepas channel pribadi
  tiap pindah halaman. Panggilan tak terjawab ditutup sendiri saat baris dibaca (`expireIfStale`, 60 dtk).
- Status panggilan dipegang di tingkat MODUL (`resources/js/lib/reporter-call.js`), bukan state komponen,
  supaya pindah halaman tak memutus koneksi. Layar: `Components/ReporterCall/CallOverlay.jsx` (kartu melayang
  di ATAS, sekali di AppLayout), tombol `CallReporterButton.jsx`.
- Gerbang: pemanggil = `ReporterCall::canCall` (Pusat Komando `COMMAND_CENTER_ROLES` di wilayah laporan;
  pelapor = tamu ber-`guest_check` atau akun yang BUKAN Pusat Komando - laporan telepon ber-user_id operator).
  Satu rumus untuk prop `canCallReporter` dan `start()`. Satu panggilan aktif per laporan (409).
- Push ke pelapor ber-akun: `ReporterCallNotification` FCM `type: report_status` + database, TANPA broadcast.
  Shared prop `incomingCall` ({id}) membuka layar dering saat aplikasi dibuka dari push.
- ICE: STUN `WEBRTC_STUN_URLS` + TURN coturn `use-auth-secret` (`TURN_URLS`, `TURN_SECRET`, kredensial
  sementara HMAC-SHA1, rahasia tak pernah ke browser). Panduan pasang: `deploy/coturn.md`.
- Mikrofon tak tersedia (APK 1.1.9 TANPA izin `RECORD_AUDIO`/`onPermissionRequest`, atau izin ditolak):
  pelapor tetap melihat "Damkar sedang memanggil", Terima -> `end(no_mic)` -> kartu "Telepon Balik Damkar"
  ke nomor darurat tenant; pemanggil melihat "Mikrofon pelapor tidak tersedia".

**Cek nomor:** prop `confirm_phone` (tamu & akun selain Pusat Komando). `lib/phone.js` (penormalan = server
tamu, `formatPhone`, `phoneProblem` error/peringatan; awalan seluler yang tak dikenal hanya PERINGATAN). Form:
gema nomor "Petugas akan menelepon 0812-3456-7890", kartu "Kontak Anda" untuk akun (nomor profil tampil +
Ubah, hanya untuk laporan ini), dialog `PhoneConfirmDialog` sekali sebelum kirim (tamu dengan nomor tak valid
tak bisa lanjut; akun boleh "Kirim tanpa nomor"). Server tidak diperketat untuk akun.

## 4. File

- Baru: migrasi `2026_11_15_110000_create_reporter_calls_table.php`, `app/Models/ReporterCall.php`,
  `app/Events/ReporterCallChanged.php`, `app/Notifications/ReporterCallNotification.php`,
  `app/Http/Controllers/ReporterCallController.php`, `resources/js/lib/reporter-call.js`, `resources/js/lib/phone.js`,
  `resources/js/Components/ReporterCall/{CallOverlay,CallReporterButton}.jsx`, `deploy/coturn.md`,
  `tests/Feature/Sisupit/ReporterCallTest.php`.
- Diubah: `routes/web.php`, `config/services.php` (`webrtc`), `.env.example`, `HandleInertiaRequests` (`incomingCall`),
  `ReportController` (`canCallReporter`, `reporterCalls`, `guestView.call`, `confirm_phone`),
  `AppLayout.jsx`, `Reports/Show.jsx` (tombol + riwayat, `reloadIncident` + 2 prop), `Reports/Thanks.jsx` (tamu),
  `Reports/Create.jsx` (cek nomor).

## 5. Blast radius

- Channel `App.Models.User.{id}` kini membawa event kedua (`.reporter-call.changed`). Exe desktop: diabaikan
  (dicek di `SisupitDesktop/src/realtime.js`). APK tidak memakai Reverb.
- Shared prop baru `incomingCall` = satu query berindeks per request penuh berlogin.
- `reloadIncident` + `reporterCalls`, `canCallReporter` (daftar tetap satu, ReportDetailRealtimeTest).
- Form lapor: satu ketukan tambahan (dialog) bagi non-Pusat Komando; operator tidak terpengaruh.

## 6. Verifikasi

- [x] Baseline: 976 passed / 7504 assertions (2026-11-15, sebelum perubahan).
- [x] `ReporterCallTest` 12 test (gerbang pemanggil & peserta, operator, satu panggilan, offer/answer, kedaluwarsa,
      no_mic + riwayat, tamu bertanda tangan + channel rahasia + klaim, TURN tanpa rahasia, push report_status,
      confirm_phone, kabel AppLayout).
- [x] Suite penuh sesudah: lihat STATUS (CLAUDE.md).
- [x] `npm run build` lulus.
- [ ] **Manual (belum):** dua perangkat nyata - admin di komputer (Chrome/exe) menelepon warga di HP browser
      (data seluler) -> dering, Terima, suara dua arah, Bisukan, Akhiri; tamu di halaman status; warga di APK
      1.1.9 -> kartu "Telepon Balik Damkar"; push saat aplikasi tertutup. coturn belum terpasang = sebagian
      panggilan seluler bisa gagal.

## 6b. Uji staging 2026-11-17

Deploy staging @300047db (7 migrasi). Uji Chrome laptop -> Chrome HP (Wi-Fi sama): dering & bunyi OK, Jawab = "Gagal
tersambung" langsung. Root cause: `TrimStrings` memotong CRLF ujung SDP (Chrome menolak). Fix di `bootstrap/app.php` +
helper `sdp()` klien; test baru merah sebelum fix, hijau sesudah.

Sesudah fix + coturn Docker di VPS (2026-11-17): uji ulang Chrome laptop -> Chrome HP BERHASIL, baik Wi-Fi sama maupun
HP memakai data seluler (konfirmasi user). Sisa: APK (#246), uji tamu, rilis prod (merge main + deploy + coturn-setup.sh prod).

## 7. Rollback

Revert commit TASK_90; migrasi `reporter_calls` boleh dibiarkan (tak dibaca kode lama) atau `migrate:rollback --step=1`.
Tombol bisa dimatikan cepat tanpa revert: `canCallReporter` => false di `ReportController::show`.

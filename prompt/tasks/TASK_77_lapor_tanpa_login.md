# TASK_77 — Lapor tanpa login (FINDINGS #201)

| Field | Isi |
|-------|-----|
| ID | TASK_77 |
| Severity | P2 |
| Tipe | fitur |
| Sumber | permintaan user 2026-10-11 ("buat fitur lapor tanpa login, bagaimana best practicenya?") |
| Status | DONE - lokal, belum dideploy (ADA MIGRASI) |

## 1. Tujuan & keputusan user

Warga tanpa akun bisa mengirim laporan darurat. Keputusan user 2026-10-11 (setelah disodori praktik terbaik):
- **TANPA OTP** (WA/SMS) - ditolak tegas. Nomor HP wajib tapi tidak diverifikasi; telepon balik Pusat Komando
  itulah verifikasinya.
- **Dua lapis pelindung**: lapis 1 selalu aktif tanpa pihak ketiga (honeypot + jeda isi minimal + batas kirim
  berlapis); lapis 2 Cloudflare Turnstile yang bisa dinyalakan lewat `.env`, dan laporan TETAP diterima bila
  Cloudflare tak terjangkau (bertanda `tanpa_captcha`).
- **Semua jenis kejadian** (aturan isian sama persis dengan laporan akun).
- Disetujui juga: laporan tamu masuk antrean admin berlencana "Tamu - belum terverifikasi" (tak pernah disiarkan
  sebelum admin memverifikasi, #101), status lewat **tautan bertanda tangan** (membalik keputusan 07-12 "Thanks
  wajib login", FINDINGS #38), data minimal, ajakan klaim akun, tombol 113 tetap.

## 2. Kondisi awal

- Semua route lapor di grup `auth,verified`; tamu yang mengetuk "Lapor" dilempar ke login.
- `reports.user_id` NOT NULL; batas kirim `ReportController::store` per user.
- Form `Create.jsx` tak punya kolom nama/HP - diisi diam-diam dari profil akun.
- Proxy `/api/geocode/*` (peta form) wajib login.
- Halaman Thanks berlangganan channel privat `report-tracking.{id}` (tamu tak bisa diotorisasi).

## 3. Rancangan & perubahan

- **URL form SAMA** (`GET /reports/create`, keluar dari grup auth): semua tombol Lapor yang sudah ada (landing,
  spotlight, bantuan, bilah bawah) langsung bekerja untuk tamu. `create()` menegakkan sendiri `verified` untuk akun
  (akun belum verifikasi tetap ke `verification.notice`) dan bercabang ke `guestCreate()` untuk tamu.
- **Kirim tamu** = `POST /lapor-darurat` (`front.reports.guest.store`, middleware `guest`) - `store()` akun tetap
  di belakang `auth,verified`.
- **Satu jalur simpan**: inti `store()` dipindah ke `persistReport()` (foto, asal titik, deteksi ganda, nada triase
  Pusat Komando, ReportFeedChanged) dan dipakai `store()` & `guestStore()`. Isinya byte-identik, hanya dipindah.
- **Migrasi** `2026_10_11_100000_allow_guest_reports`: `user_id` nullable (laporan tamu = NULL, BUKAN akun bayangan
  "Tamu" - akun bersama membuat tiap tamu jadi "pelapor" laporan tamu lain), kolom `guest_check`
  (`turnstile`/`tanpa_captcha`/`nonaktif`; NULL = dari akun). Diuji di MySQL 8 lokal: FK `reports_user_id_foreign`
  tetap ada.
- **Lapis 1** (`GuestReportRequest` extends `ReportRequest` - aturan isian diwarisi utuh):
  - `phone` wajib, diseragamkan ke `08...` (spasi/strip/+62/62), regex seluler `^08\d{8,11}$`.
  - honeypot `website` (`prohibited`), di luar layar, `tabIndex=-1`, `aria-hidden`.
  - jeda isi >= 3 dtk sejak form dibuka (`session('guest_report_form_opened_at')`, ditulis `guestCreate`; tanpa jejak
    sesi = ditolak).
  - Penolakan BERSUARA (bukan sukses palsu): manusia yang salah tertangkap tak boleh mengira laporannya terkirim.
- **Batas kirim tamu** (`ReportController::GUEST_LIMITS`, jendela 30 menit, hanya laporan TERSIMPAN dihitung):
  IP 10 (longgar - CGNAT seluler), nomor HP 3, cookie perangkat `sisupit_lapor` 3. Salah satu penuh = 429 (pesan
  Indonesia dari bootstrap/app.php).
- **Lapis 2** `verifyTurnstile()`: kunci kosong = `nonaktif`; token sah = `turnstile`; token palsu/kedaluwarsa =
  galat validasi `turnstile_token`; tanpa token + klien melapor widget gagal (`turnstile_status=error`) atau
  siteverify tak terjangkau/5xx = `tanpa_captcha` (diterima). Komponen `Components/TurnstileWidget.jsx`
  (`render=explicit`, batas muat 12 dtk, reset saat token ditolak).
- **Status tamu** `GET /lapor-darurat/status/{report}` (`signed:relative`, 48 jam) - halaman `Front/Reports/Thanks`
  yang sama (props dari `thanksProps()`), prop `guestView`: tanpa WebSocket (muat ulang tiap 30 dtk selama belum
  selesai), tanpa tautan ke detail. Tanda tangan RELATIF supaya sah setelah `crossSubdomainRedirect()` ke subdomain
  kabupaten (helper lama `crossSubdomainThanksRedirect` kini menerima path).
- **Klaim akun** (bukan lewat nomor HP - nomor tak diverifikasi, jadi menautkan lewat nomor = siapa pun bisa
  mengambil laporan nomor orang lain): `GET .../masuk` (tamu -> login, intended = tautan status), lalu
  `POST .../klaim` (auth+verified+signed, hanya bila `user_id` masih NULL) + `ReportRecordChanged` (#113).
- **Geocode** `/api/geocode/{reverse,search}` keluar dari grup auth, limiter `geocode`: tamu 60/menit per IP, akun
  tanpa batas.
- **Layar**: `Create.jsx` kartu "Kontak Anda" (HP wajib `type=tel autoComplete=tel`, nama opsional) + honeypot +
  Turnstile, Batal tamu -> `home.landing`; `navItems.js` entri `reportCreateItem` dipakai akun & tamu (sidebar tamu
  kini punya "Lapor Darurat!"); `Components/GuestReporterBadge.jsx` di `Admin/Reports/Index.jsx` (nomor HP tamu
  bisa diketuk, tampil juga di ponsel) & `Front/Reports/Show.jsx`.

## 4. Blast radius (diperiksa)

Semua pembaca `$report->user` sudah null-safe (`notifyReporter`, ReportResource, Export, Berita Acara
`sumberInformasi` -> tamu = "laporan lewat aplikasi", benar). `$user->id === $report->user_id` tak pernah benar untuk
NULL. Notifikasi Pusat Komando tak membaca akun pelapor.

## 5. Verifikasi

- Baseline: 795 passed / 4033 assertions.
- `GuestReportTest` (21 test) + `GeocodeControllerTest` test "wajib login" DIGANTI (perilakunya sengaja dibalik)
  jadi "tamu boleh, 60/menit per IP, akun tak dibatasi".
- Sabotase: batas per nomor 3 -> 99 dan honeypot `prohibited` -> `nullable` memerahkan penjaganya; dipulihkan,
  `cmp` sama.
- `npm run build` lulus. Playwright headless 390px (Chrome lokal): form tamu (tanpa galat konsol, tanpa gulir
  mendatar, action `/lapor-darurat`, honeypot x=-9983) & halaman status bertanda tangan. Kiriman sungguhan dari
  browser SENGAJA tidak dilakukan di lokal (FCM ke akun Pusat Komando di DB lokal).

## 6. Deploy & rollback

- Deploy: kode + `php artisan migrate` BERSAMAAN, cadangan DB dulu. Isi `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`
  (opsional; kosong = lapis 1 saja). Domain Turnstile: sisupit.com + subdomain tenant.
- Rollback kode: revert commit. Rollback migrasi GAGAL bila sudah ada laporan tamu - sengaja (putuskan dulu nasib
  laporan itu).

## 7. Sisa / belum

- Belum diuji di HP/APK (WebView: Turnstile & `tel:`).
- Pendaftaran akun baru (Breeze register) tidak kembali ke tautan status; tamu yang mendaftar perlu membuka lagi
  tautannya dari riwayat browser untuk mengklaim.
- APK: halaman tamu memanggil `fcm.release` - laporan tamu memang tak mendapat push; kabarnya lewat telepon/tautan.

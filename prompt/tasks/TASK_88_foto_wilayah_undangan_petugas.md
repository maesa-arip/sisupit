# TASK_88 — Penampil foto (zoom/unduh), tanda Sisupit di PDF, ubah wilayah, Undang Petugas, Jaga di Kantor tanpa batas

| Field | Isi |
|-------|-----|
| ID | TASK_88 (FINDINGS #231-#235) |
| Severity | P2 (wilayah petugas salah) / P3 (lainnya) |
| Tipe | fitur + perbaikan (ADA MIGRASI x2) |
| Sumber | permintaan user 2026-11-06 (bekerja di `main`) |
| Status | DONE - TERDEPLOY PROD @8bae8d95 (2026-11-06, migrasi Ran, /login 200) |

---

## 1. Permintaan & keputusan user

1. Bisa **mengunduh foto** (contoh: saat membuat Laporan Kejadian) dan **zoom** foto; tampilan foto saat diklik
   "tidak bagus, aneh animasinya, terlihat berat" -> #232.
2. PDF Laporan Kejadian **ada Sisupit-nya tapi tidak mencolok** -> #233.
3. Pendaftar dari Bangli/Badung terdeteksi otomatis di sana; petugas salah baca isian (dikira lokasi tugas) ->
   fitur **ubah lokasi di Profil** + kalimat lebih jelas -> #234. Keputusan: **petugas (dan peran terpusat lain) TIDAK
   bisa mengubah wilayah sendiri** - hanya admin.
4. **Undang sebagai petugas** lewat email -> #235. Keputusan: **tabel** (bisa dilihat & dibatalkan), bukan tautan bertanda tangan.
5. "Tombol diam di kantor banyak tidak muncul, ada batas?" -> ya, 1 orang per regu (TASK_60). Keputusan: **tanpa batas** -> #231.

## 2. Perubahan

| Berkas | Isi |
|--------|-----|
| `database/migrations/2026_11_06_100000_allow_many_jaga_kantor_per_regu.php` | lepas UNIQUE(report_id, regu_id) |
| `database/migrations/2026_11_06_100100_create_user_invitations_table.php` | tabel `user_invitations` |
| `app/Http/Controllers/ReportActionController.php` (`stayAtBase`) | tolak hanya orang yang sama |
| `app/Http/Controllers/ReportController.php` (`reguManifest`) | `stays` daftar nama, `canStayAtBase` tanpa syarat kursi regu |
| `resources/js/Pages/Front/Reports/Show.jsx` | daftar Jaga di Kantor per regu; kalimat "X sudah Jaga di Kantor" dibuang |
| `resources/js/Components/PhotoViewer.jsx` | ditulis ulang: pudar 200 ms, zoom, geser, Unduh |
| `app/Http/Controllers/PhotoDownloadController.php` + route `photos.download` | unduhan attachment (reports/, resolutions/) |
| `app/Http/Controllers/ReportResolutionController.php` | prop `report.photos` di form; logo footer PDF |
| `resources/views/pdf/laporan-kejadian.blade.php` | footer "Dibuat dengan Sisupit" |
| `resources/js/Pages/Front/Reports/Resolution/Create.jsx` | kartu foto laporan warga + penampil |
| `resources/js/Components/RegionFields.jsx` (baru) | isian wilayah + deteksi (luar kota tenant tak diisikan) |
| `resources/js/Pages/Profile/CompleteProfile.jsx` | pakai RegionFields + kotak "Petugas Damkar?" |
| `app/Http/Controllers/ProfileController.php` | `regionForm` + `updateRegion` (route `profile.region`) |
| `resources/js/Pages/Profile/Edit.jsx` | kartu "Ubah Wilayah Tempat Tinggal" |
| `app/Models/UserInvitation.php`, `app/Notifications/PetugasInvitationNotification.php` | baru |
| `app/Http/Controllers/Admin/UserController.php` | `invitations`, `storeInvitation`, `destroyInvitation` |
| `app/Http/Controllers/InvitationController.php` + `Pages/Auth/Invitation.jsx` | halaman penerima |
| `resources/js/Pages/Admin/Users/Invite.jsx`, `Index.jsx` | halaman admin + tombol |
| `app/Http/Middleware/EnsureProfileComplete.php` | kecualikan `invitations.*` |

## 3. Verifikasi

- Test: baseline 932 passed (7068) -> lihat STATUS (angka akhir dicatat di CLAUDE.md).
- Test baru: `PetugasInvitationTest` (7), `ProfileRegionTest` (4), `PhotoDownloadTest` (3); diubah: `ReguTest`,
  `LaporanKejadianPdfTest`, `PhotoViewerSwipeTest`.
- `npm run build` lulus.
- Manual (Chrome desktop, https://sisupit.test, admin uji): penampil terbuka pudar di latar hitam; klik ganda/ketuk ganda
  memperbesar & kembali; ketuk ganda sentuh + dblclick susulan tidak membatalkan zoom; Unduh = 200 `attachment`.
  PDF dirender dompdf -> PNG: footer kanan logo kecil + teks abu.
- **Belum**: uji di HP/APK (cubit-zoom, unduhan lewat DownloadListener, kartu ubah wilayah 390px), kirim email undangan sungguhan.

## 4. Deploy

ADA MIGRASI (2). Kode + `php artisan migrate` wajib naik bersamaan, cadangan DB lebih dulu. Email undangan butuh SMTP prod (#191).

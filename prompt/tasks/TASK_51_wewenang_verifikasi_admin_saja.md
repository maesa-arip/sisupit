# TASK 51 — Verifikasi laporan (broadcast & tolak) dicabut dari petugas
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_51 |
| Severity | P2 |
| Tipe | perubahan wewenang (keputusan desain) + ikutan UI |
| Sumber | permintaan user 2026-08-31 -> FINDINGS_LOG #101 |
| Status | DONE (kode) — sisa verifikasi visual §6 + deploy |

---

## 1. Deskripsi masalah / tujuan

User menyodorkan pembagian peran yang dikehendakinya, lalu meminta diperiksa:

> admin -> verif dan broadcast
> petugas -> meluncur, selesaikan laporan, input laporan penanganan, rubah posisi
> petugas dapat notif tapi tidak bisa broadcast atau tolak, cek hal tersebut apakah sudah
> atau ada yang beda?

Hasil audit: **enam dari delapan sudah sesuai, dua justru kebalikannya.** Petugas BISA
broadcast dan BISA menolak, di server maupun di layar. Setelah dilaporkan, user memutuskan:
**cabut**, ditambah tiga hal: petugas **tidak boleh mencabut OPD**, di layar petugas ada
**status menunggu konfirmasi admin**, dan **notifikasi petugas tidak diubah** (hanya notif
saja, karena sekarang notif masuk sudah beda — nada tahap masuk memang sudah dibedakan
TASK_50). User juga menegaskan ceiling yurisdiksi petugas sudah diatur lewat
`/admin/settings` sehingga berbeda dari relawan; itu TIDAK disentuh di sini.

## 2. Reproduce (bukti keadaan lama)

1. Masuk sebagai **petugas** berwilayah sama dengan sebuah laporan berstatus `TERLAPOR`.
2. Dashboard petugas -> kartu misi laporan itu, CTA merah **Tanggapi**.
3. Buka detailnya -> panel **Verifikasi Laporan Masuk** lengkap dengan tombol
   **Broadcast Misi** dan **Tolak laporan**.
4. Tekan salah satunya — berhasil. Tak ada 403.

Test yang mengunci perilaku lama (dan karena itu harus DIBALIK, bukan dihapus):
`ReportActionAuthorizationTest` -> *it lets petugas approve a report*.

## 3. Root cause

Bukan bug — **keputusan desain lama yang tak lagi sesuai kehendak pemilik sistem.** Repo ini
konsisten menempatkan petugas sebagai bagian Pusat Komando, termasuk di kalimat pembuka
`CLAUDE.md` (Pusat Komando (petugas/admin) memvalidasi). Wujudnya di dua lapis:

- `app/Http/Controllers/ReportActionController.php` — `approve()` & `reject()` memakai
  `hasAnyRole([petugas, admin, superadmin])`; `removeAgency()` sama.
- `resources/js/Pages/Front/Reports/Show.jsx` — panel verifikasi dirender dari
  `isStaffOrAdmin`, daftar peran yang **disusun di dalam berkas JSX itu sendiri** dan memuat
  `petugas`.

**Kenapa tak pernah tampak sebagai masalah:** halaman `/admin/reports` (Verifikasi Laporan)
memang tertutup untuk petugas (`role:admin|superadmin`), jadi dari sisi MENU petugas tampak
tak punya wewenang itu. Yang membocorkannya adalah HALAMAN DETAIL, yang dicapai petugas lewat
tiga jalan lain: kartu misi dashboard (`DashboardController` memasukkan `TERLAPOR` ke misi
aktif), tab Semua Laporan (`ReportController::index` sengaja tak menyembunyikan `TERLAPOR`
dari petugas), dan notifikasi laporan masuk yang memang menyasar petugas.

## 4. Perubahan

### Server
- `ReportActionController::approve()` & `reject()` -> hanya admin & superadmin.
- `ReportActionController::removeAgency()` -> hanya admin & superadmin.
  **`notifyAgencies()` SENGAJA dibiarkan terbuka untuk petugas** — asimetri yang disengaja;
  lihat bagian 5.
- `ReportController::show()` -> variabel `$isVerifier` (diturunkan dari `$isStaff`, bukan
  daftar peran kedua, supaya batas wilayahnya sama persis) + dua prop baru:
  `canVerify` dan `canRemoveAgencies`.

### Frontend
- `Front/Reports/Show.jsx` — panel verifikasi bergerbang `canVerify` (prop server), tombol
  cabut OPD bergerbang `canRemoveAgencies`, dan panel baru **Menunggu Konfirmasi Admin**
  untuk staf yang bukan pemverifikasi.
- `Petugas/Dashboard.jsx` — `isUrgent` pindah dari `TERLAPOR` ke `pending`; `TERLAPOR` jadi
  `isAwaitingAdmin` dengan CTA **Menunggu Admin** berwarna warning.

## 5. Yang mengikat (jangan dibalik tanpa membaca ini)

1. **Prop, bukan daftar peran di JSX.** Panel verifikasi TIDAK boleh kembali menghitung
   perannya sendiri dari `auth.user.role`. Daftar peran yang ditulis dua kali akan menyimpang,
   dan yang menyimpang di sisi layar melahirkan tombol yang selalu berakhir 403 — bentuk yang
   sama dengan #94. Dijaga test *it ships verification affordances to admin only, matching
   the endpoint gate* yang mengadu prop layar dengan endpoint SUNGGUHAN, bukan kamus lawan
   kamus (pelajaran #79).
2. **Minta OPD bukan sama dengan cabut OPD.** `notifyAgencies` tetap milik petugas: eskalasi
   lahir di lapangan (ada kabel jatuh, panggil PLN) — komentar di method itu sudah lama
   mengatakannya. `removeAgency` dicabut: membatalkan permintaan yang sudah dikirim ke
   instansi luar adalah pencabutan koordinasi, dan instansi yang sudah bergerak tak boleh
   dilepas oleh satu orang di lokasi. Keduanya diuji dalam SATU test agar asimetri ini tak
   bisa dirapikan jadi seragam tanpa ada yang merah.
3. **Keadaan menunggu itu wajib, bukan hiasan.** Tanpa afordans apa pun, layar petugas atas
   laporan mentah jadi SEPI — dan keadaan yang tak dijelaskan terbaca sebagai fitur rusak
   (pelajaran TASK_45/#94). Ajakan yang tak bisa ia penuhi lebih buruk lagi: itulah kenapa
   CTA merah Tanggapi pada `TERLAPOR` diganti, bukan sekadar dibiarkan.
4. **Kamus status TIDAK difork per peran.** `StatusBadge` tetap berbunyi Laporan Masuk untuk
   `TERLAPOR` bagi siapa pun. Yang ditampilkan adalah APA YANG SEDANG DITUNGGU, bukan nama
   status kedua — memberi satu status dua nama tergantung siapa yang melihat persis penyakit
   #94/TASK_39.
5. **Urgensi merah pindah ke `pending`, bukan hilang.** Kalau `TERLAPOR` cuma dijadikan
   tidak-mendesak, tak akan ada satu pun misi merah di dashboard petugas dan sinyalnya mati
   sama sekali. `pending` = sudah disiarkan admin, sedang memanggil responder — itu memang
   saat petugas dipanggil meluncur.
6. **Petugas tidak kehilangan pekerjaannya.** takeAction / arrive / resolve / correctLocation /
   berita acara sementara / minta OPD / konfirmasi OPD tetap miliknya. Dijaga test
   *it keeps the field actions open to petugas after verification was taken away* — tanpa itu,
   cabut petugas dari approve gampang melebar jadi cabut petugas dari ReportActionController.
7. **Notifikasi tidak disentuh.** `ReportController::store()` tetap mengirim
   `STAGE_REPORT_INCOMING` ke petugas, dan `approve()` tetap menyiarkan ke petugas dengan
   ceiling `Setting::KEY_NOTIFY_LEVEL_PETUGAS`. Permintaan user eksplisit.
8. **Test lama dibalik, bukan dihapus.** Enam berkas test memakai petugas sebagai pelaku
   approve/reject; semuanya dipindah ke admin. Yang penting: dua test gerbang STATUS
   (approve laporan yang bukan TERLAPOR, reject insiden resolved) WAJIB pakai admin —
   dengan petugas keduanya akan hijau karena tertolak di gerbang PERAN, yaitu alasan yang
   keliru.

## 6. Verifikasi

Otomatis:
- `php artisan test` — 370 -> **375 passed** (1470 assertions).
- LIMA penjaga baru; **tiga dibuktikan MERAH lebih dulu** lewat sabotase sengaja
  (mengembalikan petugas ke ketiga gerbang -> 2 merah; menyetel `canVerify` jadi `$isStaff`
  -> 1 merah).
- `vendor/bin/pint --test` PASS, `npx prettier --check` PASS, `npm run build` lulus.

Manual (BELUM dikerjakan — butuh browser):
- [ ] Petugas buka detail laporan `TERLAPOR` sewilayah -> **tidak ada** tombol Broadcast/Tolak;
      muncul panel kuning Menunggu Konfirmasi Admin.
- [ ] Dashboard petugas: kartu laporan `TERLAPOR` ber-CTA Menunggu Admin (warning), kartu
      laporan `pending` ber-CTA merah Tanggapi.
- [ ] Admin buka laporan yang sama -> panel verifikasi lengkap, kedua tombol berfungsi.
- [ ] Petugas di insiden aktif: tombol **Minta** OPD ADA, tombol **X** (cabut) TIDAK ADA.
- [ ] Admin di insiden yang sama: tombol X ada dan berfungsi.
- [ ] Petugas masih bisa Meluncur -> Tiba -> Koreksi titik -> Tandai Selesai -> isi berita
      acara sementara.
- [ ] Notifikasi laporan masuk masih sampai ke petugas (nada tahap masuk, bukan sirine).

## 7. Blast radius

- **Tanpa migrasi, tanpa perubahan route, tanpa perubahan skema, tanpa sentuhan DB.**
- Frontend berubah -> `npm run build` + commit `public/build` saat deploy.
- Yang berubah bagi ADMIN: tidak ada, kecuali ia kini satu-satunya pemegang tombol itu.
- Yang berubah bagi PEJABAT/RELAWAN/OPD/warga: tidak ada (mereka memang tak pernah punya).
- Risiko operasional yang harus disadari user: kalau di sebuah wilayah **tak ada admin yang
  aktif**, laporan mentah TIDAK akan pernah disiarkan — dulu petugas bisa menambalnya.
  Ini konsekuensi langsung dari keputusan ini, bukan efek samping.

## 8. Temuan baru (dicatat, TIDAK dikerjakan)

- **#102** `approve()`/`reject()`/`resolve()` mem-bypass Tenantable tanpa
  `ensureWithinJurisdiction()` — delapan aksi tetangganya memanggilnya. Tak terjangkau lewat
  UI (show() sudah menyaring wilayah), tapi melanggar ATURAN EMAS #7. OPEN.
- **#103** Permission Spatie diseed lengkap tapi NOL yang mengeceknya di seluruh `app/` &
  `routes/` — `/admin/assign-permission` memperlihatkan centang yang tak berefek apa pun.
  OPEN.

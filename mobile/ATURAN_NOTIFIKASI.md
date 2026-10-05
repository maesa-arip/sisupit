# Aturan Notifikasi APK - Versi Ringkas untuk Dibaca

Dicek langsung dari kode pada **2026-10-05**: APK 1.1.6/vc8
(`SisupitFirebaseMessagingService.java`) dan server web (`ReportController.php`,
`ReportActionController.php`, `app/Notifications/*`). Rincian teknis (kunci payload, blok
iOS, alasan ID channel) ada di [`KONTRAK.md`](KONTRAK.md) §4 - dokumen ini hanya
"siapa dapat apa, kapan, bunyinya apa".

---

## 1. Prinsip satu kalimat

> **Bunyi dibedakan menurut TINDAKAN yang diminta dari pendengarnya, bukan topiknya.**
> Sirine hanya berarti satu hal: **ada yang harus berangkat SEKARANG.**

Laporan mentah bisa hoaks. Kalau laporan mentah ikut bersirine, orang terbiasa
mengabaikan sirine - dan saat kejadian sungguhan, sirinenya ikut diabaikan.

---

## 2. Empat bunyi di APK

| Bunyi | Arti | Berkas | Tembus mode senyap? | Berulang? | Getar |
|---|---|---|---|---|---|
| 🚨 **SIRINE** | Laporan SUDAH diverifikasi admin - meluncur | `sirine.mp3` (~24 dtk) | **Ya** (stream ALARM) + coba tembus DND* | **Ya, sampai notifikasi disentuh** | panjang: 500-250-500 |
| 📥 **NADA MASUK** (naik) | Laporan baru, BELUM diverifikasi | `masuk.wav` (berdenting tiap ~3,7 dtk) | Tidak | **Ya, sampai notifikasi disentuh** | sedang: 200-150-200 |
| 🤝 **NADA KONFIRMASI** (turun) | Koordinasi dengan OPD (PLN, PDAM, dst.) | `konfirmasi.wav` | Tidak | Tidak, sekali | 3 ketukan pendek |
| 🔔 **BUNYI BAWAAN HP** | Kabar status ke warga pelapor | nada notifikasi pilihan pengguna | Tidak | Tidak | bawaan |

\* DND hanya tembus bila pengguna memberi izin "Akses Jangan Ganggu" ke aplikasi Sisupit.

Di Setelan Android > Aplikasi > Sisupit > Notifikasi, keempatnya tampil sebagai kategori
**Darurat**, **Laporan Masuk**, **Koordinasi OPD**, **Status Laporan**.

**Aturan pengaman:** notifikasi yang jenisnya tidak dikenali APK **selalu jatuh ke SIRINE**
(keputusan 2026-08-28: gagal berisik lebih aman daripada gagal diam).

---

## 3. Alur kejadian - siapa dapat apa

### ① Warga mengirim laporan

| Penerima | Bunyi | Judul notifikasi |
|---|---|---|
| **Admin & superadmin** di wilayah laporan | 📥 NADA MASUK | "📥 Laporan baru menunggu verifikasi" |
| **Petugas** di wilayah laporan | 📥 NADA MASUK | (sama) |
| Relawan, pejabat, OPD | - (tidak dapat apa-apa) | - |
| Pelapor sendiri | - | - (ia diarahkan ke halaman Terima Kasih) |

- Petugas **hanya diberi tahu**, tidak bisa memverifikasi - ia menunggu admin (#101).
- **Laporan yang terdeteksi kemungkinan GANDA tidak berbunyi sama sekali** (keputusan
  2026-09-14): 15 pelapor satu kebakaran ≠ 15 bunyi. Laporannya tetap muncul live di
  antrean admin dengan label usulan ganda.
- Yang melapor tidak menerima notifikasi tentang laporannya sendiri.

### ② Admin memverifikasi (Validasi & Broadcast)

| Penerima | Bunyi | Judul |
|---|---|---|
| **Petugas** di wilayah laporan | 🚨 SIRINE | "🚨 DARURAT KEBAKARAN!" + alamat |
| **Relawan** yang **siaga ON** di jangkauan relawan | 🚨 SIRINE | (sama) |
| **Pejabat** yang **siaga ON** di jangkauan pejabat | 🚨 SIRINE | (sama) - disengaja, #97 WONTFIX: pejabat punya saklar siaga sendiri |
| **Pelapor** | 🔔 BAWAAN | "Laporan Anda divalidasi" |
| **Akun OPD** yang dicentang admin saat verifikasi | 🤝 KONFIRMASI | "Permintaan Bantuan: <nama OPD>" |

- Admin yang menekan tombol tidak menerima notifikasinya sendiri.
- Jangkauan wilayah tiap peran diatur terpisah (petugas per kabupaten; relawan default
  DESA; pejabat default KABUPATEN) di pengaturan tingkat notifikasi.
- Relawan/pejabat yang mematikan **mode siaga** tidak dapat sirine.

### ③ Petugas/relawan meluncur, tiba, selesai - kabar ke PELAPOR

Semuanya 🔔 BUNYI BAWAAN, hanya ke pelapor (dan pelapor laporan yang digabung ke
kejadian ini):

| Kapan | Judul |
|---|---|
| Responder **pertama** menekan Meluncur | "Bantuan dalam perjalanan" |
| Responder **pertama** tiba | "Responder tiba di lokasi" |
| Insiden ditutup | "Insiden selesai ditangani" |
| Laporannya digabung ke laporan lain | "Laporan Anda diterima" (sengaja bukan kata "digabung") |

Responder kedua dst. tidak memicu kabar ulang ke pelapor.

### ④ OPD dilibatkan belakangan (sesudah verifikasi)

Petugas/admin bisa menambah OPD kapan saja selama insiden belum ditutup.
→ **Akun OPD** instansi itu: 🤝 KONFIRMASI "Permintaan Bantuan: <nama OPD>".
OPD yang sudah dilibatkan tidak dikirimi permintaan dua kali.

### ⑤ OPD mengonfirmasi (mis. "Listrik sudah dipadamkan")

Dicatat oleh akun OPD itu sendiri **atau** petugas/admin atas nama OPD (mis. lewat telepon).
Hanya untuk OPD yang memang menuntut konfirmasi.

| Penerima | Bunyi | Judul |
|---|---|---|
| Admin & petugas di wilayah laporan | 🤝 KONFIRMASI | "Konfirmasi <nama OPD>" |
| Relawan siaga di jangkauan relawan | 🤝 KONFIRMASI | (sama) |
| **Semua yang sedang menangani insiden ini** (petugas & relawan yang meluncur/tiba, walau dari luar wilayah) | 🤝 KONFIRMASI | (sama) |
| **Pelapor** | 🤝 KONFIRMASI | (sama) - ia ikut menunggu di TKP |

Yang mencatat konfirmasi tidak menerima notifikasinya sendiri. Isi notifikasi menyebut
apakah konfirmasi dari OPD langsung atau dicatat operator, plus catatan bila ada.

### ⑥ Yang TIDAK menghasilkan notifikasi APK

| Kejadian | Keterangan |
|---|---|
| **Laporan DITOLAK** | Pelapor **tidak** dapat push. Halaman yang sedang terbuka ikut berubah status (realtime), tapi HP tidak berbunyi. |
| Forum Warga | Hanya lonceng di web (sengaja tanpa push: payload tak dikenal = sirine). |
| Petugas "Jaga di Kantor", unit armada, koreksi pin, edit laporan | Tanpa notifikasi. |

---

## 4. Ketuk notifikasi → ke mana?

Semua notifikasi membuka **detail laporan** (`/reports/show/{id}`) langsung, tanpa
splash. Kalau aplikasi sudah terbuka, halaman berganti di tempat. Tiap laporan punya
notifikasinya sendiri di laci (tidak saling menimpa). Bunyi yang berulang (sirine &
nada masuk) **berhenti begitu notifikasi disentuh atau digeser**.

---

## 5. Syarat supaya notifikasi sampai ke HP

1. **Sudah login di APK.** Token HP didaftarkan saat login. Aturannya (TASK_73):
   **notifikasi masuk ⇔ HP itu sedang masuk.**
   - Di aplikasi login selalu "ingat saya": HP tetap masuk sampai pengguna menekan **Keluar**
     (sesi web 120 menit hanya berlaku di browser).
   - **Keluar** (tombol mana pun) melepas token HP itu saja; HP/laptop lain tetap masuk.
   - **Profil > Keluar dari semua perangkat**: semua HP keluar & berhenti menerima notifikasi.
   - **Ganti sandi**: HP lain dikeluarkan & tokennya dilepas; HP yang dipakai tetap masuk.
     **Reset sandi** (lupa sandi): semua HP dikeluarkan.
   - Kalau aplikasi tetap sampai di halaman masuk (tamu), ia melepas tokennya sendiri - jadi
     **layar masuk = tidak ada notifikasi**.
   - Token yang ditolak Firebase (aplikasi dicopot/data dihapus) dihapus otomatis; token yang
     tak terlihat 270 hari disapu harian (butuh cron `schedule:run` di server).
2. Satu HP = satu akun. Login akun lain di HP yang sama memindahkan tokennya ke akun baru.
3. Izin notifikasi diizinkan (Android 13+ menanyakannya).
4. **Optimasi baterai dimatikan** untuk Sisupit - terutama Xiaomi/Oppo/Vivo. Aplikasi yang
   di-"force stop" atau dibunuh penghemat baterai tidak menerima push.
5. **Volume ALARM** HP tidak nol (sirine memakai volume alarm, bukan volume dering).
6. Profil wilayah terisi (warga/relawan). Akun non-staf tanpa wilayah tidak dapat siaran.
7. Di server: `queue:work` harus hidup - semua notifikasi lewat antrean.

---

## 5b. Cek sendiri: Profil > "Notifikasi di HP ini" (TASK_74)

- Status HP yang sedang dipakai: **Aktif** (terdaftar), **Belum aktif**, atau **Dibuka di browser**.
  "Aktif" berarti terdaftar - kalau izin notifikasi dimatikan di Setelan Android, web tak bisa
  melihatnya. Karena itu ada tombol uji.
- Tombol **Uji ...** mengirim notifikasi ke HP ini saja, dengan bunyi yang sama persis dengan
  aslinya. Yang muncul sesuai peran:

  | Peran | Tombol uji |
  |---|---|
  | Petugas | sirine, nada laporan masuk, nada koordinasi |
  | Relawan | sirine, nada koordinasi |
  | Pejabat | sirine |
  | Admin / superadmin | nada laporan masuk, nada koordinasi |
  | OPD | nada koordinasi |
  | Warga | bunyi kabar laporan |

- Dashboard petugas & relawan siaga menampilkan peringatan kuning **hanya** bila HP ini belum
  terdaftar, atau (di browser) akun ini belum punya satu HP pun yang terdaftar.
- **Kelola Pengguna, khusus SUPERADMIN** (admin biasa tidak melihatnya) kolom **HP Notifikasi**: jumlah HP terdaftar tiap akun + kapan
  aplikasinya terakhir dibuka. "Belum ada HP" (kuning) pada petugas/relawan/pejabat = orang itu
  **tidak akan menerima sirine**. Hanya untuk dilihat - admin tak bisa mengirim uji ke HP orang lain.

---

## 6. Perbedaan per platform

| | Android APK | iOS | Desktop .exe (Pusat Komando) |
|---|---|---|---|
| Jalur | FCM | FCM → APNs | **Reverb (WebSocket), bukan FCM** |
| Sirine tembus senyap | Ya | Tidak (butuh izin Critical Alerts dari Apple, belum ada) | - |
| Berulang sampai disentuh | Ya (sirine & masuk) | Tidak, sekali | - |
| Nada konfirmasi | sekali | sekali | **5 kali** (pendengarnya operator di meja) |

---

## 7. Aturan kalau mau MENGUBAH bunyi (penting, jangan lupa)

1. **Di Android, bunyi melekat ke CHANNEL, bukan ke isi notifikasi, dan setelan channel
   PERMANEN di HP.** Mengganti berkas suara atau setelan channel tidak berlaku untuk HP
   yang sudah terpasang - harus **membuat channel baru dengan ID baru** (sekarang:
   `emergency_channel_v5`, `incoming_report_v2`, `coordination_v2`, `status_update_v2`).
   Akibatnya setelan yang dibuat pengguna di channel lama hilang.
2. ID channel darurat ada di **tiga tempat** dan wajib naik bersamaan:
   `SisupitFirebaseMessagingService.CHANNEL_ID`, `MainActivity`, `AndroidManifest.xml`.
3. **Menambah berkas ke `res/raw` bisa mengubah arti channel lama** (bug 2026-09-01: HP yang
   update malah membunyikan nada konfirmasi untuk siaran). URI suara harus ber-NAMA
   (`/raw/sirine`), jangan kembali ke `R.raw.*`.
4. Penanda tahap di server bernama `alert_stage`, **jangan pernah bernama `type`** (ditimpa
   diam-diam di jalur aplikasi desktop).
5. Jenis notifikasi baru yang dikirim ke FCM tanpa dikenali APK = **SIRINE**. Jadi notifikasi
   baru untuk hal sepele harus dibuat dikenali APK dulu, atau jangan dikirim lewat FCM.
6. Server tidak bisa menyuruh Android "putar 5×" atau mengatur jeda pengulangan - jeda nada
   masuk dibangun ke dalam berkas `masuk.wav` (2,4 dtk sunyi di ekornya).
7. Setiap perubahan → catat di [`CHANGELOG_ANDROID.md`](CHANGELOG_ANDROID.md) +
   [`PARITAS.md`](PARITAS.md) supaya iOS ikut.

---

## 8. Catatan yang masih menggantung (per 2026-10-05)

- **Pengulangan sampai disentuh (`FLAG_INSISTENT`) belum pernah diuji di HP sungguhan.**
  Kalau ternyata hanya berbunyi sekali, itu batas Android - jangan bangun foreground service.
- Judul sirine selalu **"🚨 DARURAT KEBAKARAN!"**, juga untuk kejadian non-kebakaran
  (banjir, evakuasi hewan, dll.).
- Laporan **ditolak** tidak memberi push ke pelapor (lihat §3 ⑥).

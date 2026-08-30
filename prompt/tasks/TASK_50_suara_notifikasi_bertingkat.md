# TASK 50 — Suara notifikasi bertingkat (triase / panggilan / koordinasi)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_50 |
| Severity | P2 |
| Tipe | fitur kecil (lintas 3 permukaan: server, .exe desktop, wrapper Android) |
| Sumber | permintaan user 2026-08-28 + temuan #96 |
| Status | DONE (kode) — sisa: build installer .exe, pasang APK, verifikasi di perangkat |

---

## 1. Deskripsi masalah / tujuan

Permintaan user: **laporan yang baru masuk** (ke admin & petugas) harus berbunyi BEDA dari
**broadcast setelah admin memverifikasi** — sirine yang sekarang dipertahankan hanya untuk
broadcast. Konfirmasi OPD (mis. PLN "listrik sudah dipadamkan") juga dibedakan.

Keputusan user 2026-08-28, ketiganya sudah dijawab sebelum task ini ditulis:

1. **Wrapper Android lama yang belum diperbarui → tetap sirine.** Gagal dengan berisik lebih
   aman daripada gagal dengan diam untuk layanan kebakaran.
2. **Notif balik ke pelapor** (`ReportStatusUpdatedNotification`) → **bunyi bawaan sistem**,
   tanpa nada khusus. Itu satu-satunya notifikasi yang penerimanya warga biasa.
3. **Nada dibuat sendiri**, bukan diunduh dari bank suara.
4. **Nada terpilih: `masuk_v1.wav`** (dua nada naik, diulang 2× di dalam berkasnya) untuk
   tingkat 1, **`konfirmasi_v2.wav`** (dua nada turun, rendah & lembut) untuk tingkat 3.
5. **Pengulangan:** tingkat 1 berbunyi **berulang sampai admin membukanya**; tingkat 3
   berbunyi **5× atau berhenti lebih awal bila dibuka**.
6. **Judul tingkat 1 diubah** dari `🚨 DARURAT KEBAKARAN!` jadi
   `📥 Laporan baru menunggu verifikasi` — disetujui user.
7. **Pejabat TETAP bersirine** (temuan #97 → WONTFIX). Alasan user: sejak TASK_34 pejabat
   punya saklar siaganya sendiri, jadi kendalinya sudah di tangan orangnya.

### Konsekuensi keputusan #5 yang harus dipegang saat mengerjakannya

Tiga hal berikut tidak terlihat dari rumusan "berbunyi sampai diklik", dan semuanya sudah
disampaikan ke user 2026-08-28:

- **Batas atas TETAP diperlukan, dan tingkat 2 tak boleh kalah gigih dari tingkat 1.** Sirine
  sekarang berhenti sendiri di detik ke-30 (`CONFIG.sirenSeconds`). Kalau tingkat 1 mengulang
  tanpa batas sementara tingkat 2 berhenti di 30 detik, **hierarkinya terbalik**: laporan yang
  belum tentu benar jadi lebih sulit dilepaskan daripada panggilan meluncur yang sudah
  diverifikasi. Aturannya: *kegigihan tingkat 2 ≥ tingkat 1, selalu.*
- **"Diklik" bukan satu-satunya jalan berhenti, dan di Windows ia bisa menghilang.** Toast
  Windows menyingkir sendiri ke Pusat Tindakan setelah beberapa detik — sifat yang sudah
  tercatat di memori aplikasi desktop, dan yang dulu justru mematikan sirine terlalu dini.
  Kalau satu-satunya penghenti adalah klik pada toast, sasaran kliknya bisa sudah tidak ada di
  layar sementara bunyinya jalan terus. Karena itu suara berhenti pada: **toast diklik**,
  **jendela utama dibuka/difokuskan** (itu justru tindakan yang kita inginkan dari operator),
  **menu tray**, atau **batas waktu**.
- **Android tidak bisa "5×".** Suara channel berbunyi SEKALI per notifikasi; yang tersedia
  hanya `FLAG_INSISTENT` (mengulang **sampai notifikasinya ditutup**, tanpa kendali atas jeda
  maupun jumlahnya) atau sekali saja. Jadi: tingkat 1 = insisten (cocok dengan keinginan user),
  tingkat 3 = **sekali** di Android tapi 5× di .exe. Perbedaan ini disengaja dan dibenarkan oleh
  siapa pendengarnya — tingkat 3 di ponsel didengar orang yang sudah bekerja di TKP.
  `FLAG_INSISTENT` di Android O+ **belum diverifikasi di perangkat**; kalau ternyata diabaikan,
  jatuhkan ke bunyi sekali dan catat, jangan bangun foreground service demi ini.

Karena jeda pengulangan di Android **tidak bisa diatur sama sekali**, jedanya dibangun ke
dalam berkasnya: `masuk_v1.wav` membawa 2,4 detik sunyi di ekornya sehingga saat diulang ia
berdenting tiap ~3,7 detik, bukan menyambung jadi alarm rapat. Satu berkas melayani .exe
maupun Android dengan irama yang sama.

Dan satu fakta yang mengubah bentuk pekerjaannya, disampaikan user di pesan yang sama:
**admin memakai aplikasi .exe, bukan browser.** Jadi permukaan utama tingkat 1 adalah
Electron (`C:\Users\Admin\ElectronProjects\SisupitDesktop`), bukan web.

### Tiga tingkat — pembedanya TINDAKAN yang diminta, bukan topiknya

Ini yang menjaga daftar suara tidak beranak-pinak tiap ada jenis notifikasi baru.

| Tingkat | Kejadian | Pendengar | Yang diminta | Suara |
|---|---|---|---|---|
| **1 — Triase** | Laporan masuk (`TERLAPOR`) | Pusat Komando, di depan layar | Buka & nilai; boleh 30 detik | nada NAIK, pendek |
| **2 — Panggilan** | Broadcast sesudah verifikasi | Petugas/relawan/pejabat, di mana saja | Tinggalkan semuanya, meluncur | **sirine (TETAP)** |
| **3 — Koordinasi** | Konfirmasi OPD, permintaan bantuan OPD | Petugas di TKP / akun OPD | Ketahui, jangan berhenti bekerja | nada TURUN, pendek |

Alasan yang mengikat untuk tingkat 1: **laporan mentah bisa hoaks** — itu justru sebabnya
`ReportController::store()` sengaja hanya mengabari Pusat Komando ("SOP ANTI HOAX" di komentar
kodenya). Sirine untuk sesuatu yang belum tentu benar melatih petugas mengabaikan sirine, dan
begitu itu terjadi broadcast sungguhan ikut diabaikan. **Sirine harus tetap berarti satu hal:
ada yang harus berangkat sekarang.**

Arah nada (naik vs turun) dipilih sebagai pembeda karena terbaca **tanpa perlu dihafal**:
naik = ada yang menunggu Anda, turun = sesuatu sudah terpenuhi.

## 2. Reproduce (bukti masalah ada)

1. **Laporan masuk & broadcast identik.** `ReportController.php:448` (laporan warga masuk) dan
   `ReportActionController.php:81` (broadcast sesudah verifikasi) memakai **kelas yang sama**,
   `EmergencyAlertNotification`, yang judulnya dipaku `'🚨 DARURAT KEBAKARAN!'` di
   `toFcm()` maupun di `formatNotification()` milik .exe. Sama bunyi, sama kalimat, sama ikon —
   tak ada satu pun jalan bagi operator untuk membedakannya.
2. **Di Android SEMUA notifikasi bersirine**, termasuk konfirmasi PLN. Komentar
   "Tanpa sirine: ini kabar koordinasi" di `AgencyConfirmationNotification::toFcm()` **hanya
   benar untuk iOS** — di sana nama berkas suara ikut di payload (`aps.sound`) dan sengaja
   dikosongkan. Di Android suara **tidak ditentukan payload sama sekali**: ia melekat pada
   notification channel, dan wrapper cuma punya satu
   (`SisupitFirebaseMessagingService.java`, `CHANNEL_ID = "emergency_channel_v4"`,
   `channel.setSound(R.raw.sirine, USAGE_ALARM)`).
3. **Konfirmasi PLN tidak pernah sampai ke .exe.** `AgencyConfirmationNotification::via()`
   memulangkan `[FcmChannel::class, 'database']` — **tanpa `'broadcast'`**. Aplikasi desktop
   hanya mendengar Reverb di `App.Models.User.{id}`, jadi kabar yang paling ditunggu Pusat
   Komando itu justru tak pernah tiba di layar tempat mereka bekerja.

## 3. Root cause

- **Tingkat tidak pernah jadi DATA.** Satu kelas notifikasi memikul dua peristiwa yang menuntut
  reaksi berbeda, dan tak ada satu pun field di payload yang membedakannya
  (`app/Notifications/EmergencyAlertNotification.php` — pembedanya cuma argumen `$userRole`,
  yang menjawab "siapa penerimanya", bukan "tahap apa ini").
- **Suara Android terikat channel, dan setelan channel bersifat permanen.** Itu sebabnya kode
  wrapper sudah sampai `v4` dan menyimpan `LEGACY_CHANNEL_IDS` untuk membersihkan yang lama.
  Konsekuensinya: **membedakan suara di Android mustahil dilakukan dari server saja.**
- **Kanal pengiriman ke desktop tidak pernah dibuka untuk notifikasi OPD** (`via()` di dua
  kelas Agency).

## 4. Rencana fix (perubahan terkecil yang benar)

### Bagian A — server (repo ini)

- `app/Notifications/EmergencyAlertNotification.php`
  - Konstruktor menerima **tahap**: `EmergencyAlertNotification::STAGE_REPORT_INCOMING` /
    `STAGE_DISPATCH`. Nilai bawaan = `STAGE_DISPATCH` supaya pemanggil lama (kalau ada yang
    terlewat) jatuh ke perilaku sekarang, bukan ke perilaku baru.
  - Judul & kalimat mengikuti tahap. Tingkat 1 **berhenti berkata "DARURAT KEBAKARAN!"** —
    laporan itu belum diverifikasi, dan suara yang dibedakan tapi kalimatnya tetap sama masih
    menyisakan operator yang tak bisa membedakan keduanya di Pusat Tindakan Windows.
  - Kunci baru `alert_stage` di `toFcm()->data()` **dan** di `toArray()`.
  - `aps.sound` mengikuti tahap (`sirine.caf` untuk dispatch, berkas tingkat 1 untuk yang lain).

  > **JEBAKAN YANG WAJIB DIHINDARI — jangan namai kunci itu `type`.**
  > `Illuminate\Notifications\Events\BroadcastNotificationCreated::broadcastWith()` melakukan
  > `array_merge($this->data, ['id' => ..., 'type' => get_class($this->notification)])`, jadi
  > kunci `type` apa pun yang kita tulis di `toArray()` **DITIMPA nama kelas** saat disiarkan.
  > Payload FCM tidak lewat jalur itu, sehingga Android akan melihat nilai kita dan .exe TIDAK —
  > gejalanya cuma "kok di desktop masih sirine", tanpa galat di mana pun.

- `app/Http/Controllers/ReportController.php:448` — kirim dengan `STAGE_REPORT_INCOMING`.
- `app/Http/Controllers/ReportActionController.php:81,84,89` — tetap `STAGE_DISPATCH` (eksplisit,
  jangan mengandalkan nilai bawaan: dua pemanggil dengan arti berbeda harus sama-sama menyebut
  maunya).
- `app/Notifications/AgencyConfirmationNotification.php` & `AgencyDispatchNotification.php` —
  tambahkan `'broadcast'` ke `via()` supaya sampai ke .exe. **Tanpa `alert_stage`**: di sini
  nama kelasnya sendiri sudah cukup jadi pembeda (`formatNotification()` di .exe memang
  mencocokkan nama kelas), dan menambah penanda kedua untuk hal yang sama = dua sumber
  kebenaran.
- `ReportStatusUpdatedNotification` — **TIDAK disentuh** (keputusan user #2: bunyi bawaan sistem).

### Bagian B — berkas nada

- `docs/sounds/buat_nada.py` (SUDAH dibuat) membangkitkan WAV 16-bit mono 44,1 kHz.
  WAV dipilih karena diterima **ketiga** permukaan tanpa konversi: Android `res/raw`, Chromium
  (.exe), dan iOS (yang hanya menerima caf/wav/aiff). MP3 butuh encoder dan ffmpeg tidak
  terpasang di mesin ini.
- Kandidat untuk dipilih user: `masuk_v1.wav` / `masuk_v2.wav`, `konfirmasi_v1.wav` /
  `konfirmasi_v2.wav`. Sesudah dipilih, berkasnya disalin ke `assets/` (.exe) dan `res/raw/`
  (Android). **Sirine tidak diganti** — ingatan otot petugas sudah terbentuk di sana.

### Bagian C — aplikasi desktop (`C:\Users\Admin\ElectronProjects\SisupitDesktop`, BUKAN git repo)

- `src/main.js` — `formatNotification()` memulangkan **tingkat** (bukan boolean `urgent`);
  `showNotification()` memilih berkas suara dari tingkat itu. Payload tanpa `alert_stage`
  (baris notifikasi lama, wrapper server lama) → **sirine** (keputusan user #1).
- `src/siren.html` — satu elemen `<audio>` per suara; `playSiren()` jadi `playSound(nama)`.
  Batas waktu `sirenSeconds` hanya berlaku untuk sirine; nada pendek berhenti sendiri.
- Catat perubahannya di memori `project_sisupit_desktop_electron_2026-08-10` — repo itu tanpa
  git, memori itu satu-satunya catatan perubahannya.

### Bagian D — wrapper Android (`C:\Users\Admin\AndroidStudioProjects\SisupitWebView`, BUKAN git repo)

- Dua channel BARU di samping `emergency_channel_v4` (yang lama TIDAK disentuh — setelannya
  permanen, dan ia tetap jadi tempat jatuh bagi payload tak dikenal):
  `incoming_report_v1` (nada tingkat 1, `USAGE_NOTIFICATION`, tanpa `bypassDnd`) dan
  `coordination_v1` (nada tingkat 3, pola getar berbeda).
- `showNotification()` memilih channel dari `data.get("alert_stage")` + `data.get("type")`.
  **Tak dikenal → channel darurat** (keputusan user #1).
- **Getar lebih penting daripada nada di TKP** — mesin pompa, helm, kebisingan. Tiap channel
  dapat pola getar yang berbeda.
- Catat di memori `project_sisupit_webview_android`.

## 5. Blast radius

- **Baris notifikasi LAMA di tabel `notifications`** tidak punya `alert_stage`. Lonceng web
  membaca `toArray()` — penambahan kunci bersifat aditif, tak ada yang pecah; yang membaca
  tahap wajib punya cadangan.
- **APK & .exe lama tetap berjalan.** Kunci payload yang tak dikenal diabaikan Android, dan
  `formatNotification()` lama hanya melihat `type`. Keduanya jatuh ke sirine — persis
  keputusan #1.
- **Menambah `'broadcast'` ke dua kelas Agency** berarti payloadnya ikut lewat channel privat
  `App.Models.User.{id}`. Penerima `AgencyConfirmationNotification` termasuk **pelapor (warga)**
  sejak TASK_49 — tak ada permukaan otorisasi baru (channel privat milik user itu sendiri, dan
  daftar penerimanya tidak diubah sebaris pun), dan tak ada halaman web yang mendengarkan
  channel itu, jadi tak ada perubahan yang terlihat di browser.
- **Judul tingkat 1 berubah** → cari pemakai string `DARURAT KEBAKARAN` di ketiga permukaan
  sebelum mengubahnya.
- **iOS belum ada aplikasinya.** `aps.sound` yang menunjuk berkas yang belum ada di bundle
  membuat iOS memakai bunyi bawaan — arah kegagalan yang benar untuk tingkat 1 & 3 (lebih
  tenang), tapi harus dicatat agar berkasnya ikut saat app iOS dibangun.

## 6. Verifikasi (hasil)

- [x] Baseline sebelum menyentuh apa pun: **363 passed, 1415 assertions** (265 dtk) — cocok
      dengan yang tercatat di CLAUDE.md, jadi kita mulai dari keadaan bersih.
- [x] Test BARU `tests/Feature/Sisupit/NotificationSoundStageTest.php` (5 test):
  - [x] laporan warga baru lewat endpoint sungguhan → `alert_stage = report_incoming`;
        sesudah `approve()` → `dispatch`
  - [x] judul kedua tahap **berbeda**, dan tahap masuk tidak memuat kata "DARURAT"
  - [x] **tahap selamat melewati `BroadcastNotificationCreated::broadcastWith()`** — diadu
        dengan payload siaran SUNGGUHAN, bukan `toArray()`; sekaligus mematok bahwa `type`
        di jalur itu memang nama kelas (pelajaran #79)
  - [x] `via()` kedua kelas Agency memuat `'broadcast'`
- [x] **Penjaganya dibuktikan MENGGIGIT lewat sabotase**: penanda dinamai `type`, pemanggil
      lupa menyebut tahap, dan `'broadcast'` dicabut lagi → **4 dari 5 test MERAH**, lalu
      kodenya dipulihkan. (Yang ke-5 tidak disasar sabotase mana pun.)
- [x] `php artisan test` sesudah: **368 passed, 1428 assertions** — nol regresi.
- [x] `vendor/bin/pint --test` PASS (291 berkas). Catatan: penyuntingan lewat skrip Python
      sempat mengubah akhir baris `ReportActionController.php`; Pint membetulkannya dan
      `git diff --stat` tetap 9 baris di berkas itu, bukan seluruh berkas.
- [x] `npm run build` **TIDAK dijalankan** — tidak ada satu pun berkas `resources/js/` yang
      berubah (diperiksa lewat `git diff --stat`).
- [x] **.exe — ketiga suara dibuktikan BERBUNYI lewat CDP** (`--remote-debugging-port`, target
      `suara.html`, `Runtime.evaluate`), bukan sekadar "playSound dipanggil":
      sirine 24,45 dtk, masuk 3,66 dtk, konfirmasi **tepat 5 putaran** lalu berhenti sendiri —
      jejak sampel `####...###...###...###...###.........`.
      **Pelajaran:** menyampel `paused` SEKALI menyesatkan untuk suara ber-jeda; sampel yang
      jatuh di jeda terbaca "tidak berbunyi" padahal sedang menunggu ulangan berikutnya.
- [x] **Android — `gradlew assembleDebug` LULUS** (JAVA_HOME = jbr Android Studio), APK 15,0 MB,
      dan ketiga berkas suara terbukti ikut terpaket di `res/raw/` (diperiksa dengan membuka
      APK-nya sebagai zip, bukan dengan melihat folder sumber).

### Yang BELUM diverifikasi (butuh tangan manusia)

- [ ] `npm run dist` di SisupitDesktop → installer baru, lalu dipasang di PC admin
- [ ] APK dipasang di HP petugas, lalu tiga notifikasi sungguhan diuji per tingkat
- [ ] **`FLAG_INSISTENT` di Android O+** — belum diuji di perangkat. Kalau ternyata diabaikan,
      jatuhkan ke bunyi sekali dan catat; JANGAN bangun foreground service demi ini.
- [ ] Perilaku "berbunyi sampai dibuka" saat toast sudah menyingkir ke Pusat Tindakan Windows

## 7. Rollback

Bagian A satu commit fokus → `git revert`. Bagian C & D di luar git: berkas yang diubah
disalin lebih dulu ke `*.bak-task50` di folder masing-masing.

---

## Acceptance criteria
- [ ] Laporan masuk, broadcast, dan konfirmasi OPD berbunyi berbeda di .exe DAN di Android
- [ ] Sirine hanya berbunyi untuk broadcast (tingkat 2) — plus sebagai tempat jatuh payload
      tak dikenal, sesuai keputusan user #1
- [ ] Konfirmasi PLN benar-benar TIBA di .exe (sekarang tidak pernah)
- [ ] Notif ke pelapor tidak berubah sama sekali
- [ ] Tidak ada regresi (test ≥ 363 passed)
- [ ] FINDINGS_LOG #96/#97 dicatat; ARCHITECTURE_MAP baris "Push Notification" diperbarui;
      kedua memori aplikasi luar-repo diperbarui

## Temuan yang SENGAJA tidak dikerjakan di sini (aturan emas #6)

- **#96 — `window.playCustomAlert` tak pernah dipanggil.** `SoundNotificationControl.jsx`
  mendefinisikannya dan `AppLayout` merender komponennya, tapi **nol pemanggil** di seluruh
  `resources/js/`; `public/sounds/alert.mp3` (478 KB) menganggur. Artinya lonceng di **browser**
  bisu total. Tidak dikerjakan karena admin memakai .exe — tapi begitu ada peran yang bekerja
  dari browser, ini yang harus dibereskan lebih dulu.
- **#97 — `user_role` dikirim tapi tak pernah dibaca wrapper.** `ReportActionController.php:86`
  mengirim `user_role: 'pejabat'` dengan komentar eksplisit "agar wrapper bisa membedakan
  perlakuannya (mis. tak memutar sirine)". Wrapper Android tak pernah membacanya, jadi pejabat
  yang MEMANTAU (bukan merespons) menerima sirine penuh menembus mode senyap. Bentuknya sama
  dengan bug utama task ini — payload membawa niat yang tak pernah dijemput klien — dan
  perbaikannya menumpang mekanisme pemilihan channel Bagian D, tapi ia keputusan tersendiri:
  apakah pejabat memang tak boleh mendengar sirine? Tanyakan ke user.

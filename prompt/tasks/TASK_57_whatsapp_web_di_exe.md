# TASK_57 — WhatsApp Web ditempel ke dalam `.exe`
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_57 |
| Severity | P2 |
| Tipe | fitur (di luar repo - `SisupitDesktop`) |
| Sumber | permintaan user 2026-09-22 (pecahan kedua dari permintaan yang sama dengan TASK_56) |
| Status | **DITUNDA** atas keputusan user 2026-09-22 |

> Bagian permintaan user yang dijawab task ini: *"exe sisupit wajib bisa menangani
> [whatsapp] ... dan whatsapp pun tidak semua bisa login hanya nomor yang didaftarkan
> bisa login"*

**Berkas yang disentuh ada DI LUAR repo ini**: `C:\Users\Admin\ElectronProjects\SisupitDesktop`
(tanpa git). Catatan perubahannya wajib ditulis ke memori & README aplikasi itu, sebab tak
ada riwayat commit yang bisa dirujuk belakangan.

---

## DITUNDA - 2026-09-22

Keputusan user: *"untuk whatsapp tunda dulu, fokus di email saja dulu"*. Pekerjaan
berpindah seluruhnya ke **TASK_56 (email dinas)**.

**Yang ikut berubah karena penundaan ini, dan bukan sekadar soal urutan:** selama TASK_57
tidak dikerjakan, komputer yang dikunci (TASK_58) **tidak punya WhatsApp di dalam Sisupit**.
Jadi hanya tersisa dua cara operator tetap bisa ber-WhatsApp, dan keduanya menutup §0.3
dengan sendirinya:

1. **Daftar putih aplikasi** di TASK_58 memuat **WhatsApp Desktop resmi** - jalur yang
   memang sudah direkomendasikan §0.3, dan yang membuat task ini tak pernah perlu ada.
2. Operator memakai **HP**-nya seperti sekarang.

Artinya penundaan ini praktis sudah menjawab **L1 di TASK_58**: bentuk kuncinya daftar
putih, bukan kiosk satu aplikasi. Kalau kelak TASK_57 dihidupkan lagi, **baca §0.3 lebih
dulu** - pertanyaan di sana belum pernah dijawab, dan ia bisa membatalkan seluruh task ini.

Sisa dokumen di bawah tetap seperti aslinya, sebagai hasil penyelidikan 2026-09-22.

---

## 0. Keputusan

### 0.1 Sudah dijawab user (2026-09-22)

| # | Pertanyaan | Jawaban | Konsekuensi |
|---|-----------|---------|-------------|
| W0 | Jalur WhatsApp | **Tempel WhatsApp Web ke dalam `.exe`** (bukan Cloud API resmi) | Pembatasan "hanya nomor terdaftar" jadi **tidak bisa ditegakkan kode**; lihat §1.1. Ini menekuk prinsip "pembatasan hidup di server", jadi **wajib** masuk `PENGECUALIAN_ATURAN.md` saat dikerjakan (§4.5) |

### 0.2 Menunggu jawaban

| # | Pertanyaan | Rekomendasi |
|---|-----------|-------------|
| **W1** | Siapa yang boleh membuka panel WhatsApp? | `petugas\|admin\|superadmin` - sama dengan pengirim email dinas TASK_56, supaya tak ada dua daftar wewenang untuk satu meja kerja |
| **W2** | Sesi WhatsApp **bersama satu komputer** atau **per akun Sisupit**? | **Bersama.** Nomor yang dipakai nomor resmi Damkar, bukan nomor pribadi operator. Sesi per akun berarti tiap operator menautkan HP-nya sendiri - persis yang tidak dikehendaki |
| **W3** | Panggilan suara/video WhatsApp diizinkan? | **Tidak.** Izin mikrofon & kamera ditolak (§3.4). Menyalakannya berarti PC ruang komando bisa dipakai menelepon, dan itu keputusan tersendiri |
| **W4** | Lampiran WhatsApp yang diunduh disimpan di mana, boleh dibuka? | Satu folder tetap, **buka berkas dimatikan**. Membuka berkas unduhan memanggil aplikasi lain, dan itu lubang persis di tengah tujuan TASK_58 |

### 0.3 PERTANYAAN YANG BISA MEMBATALKAN TASK INI - jawab lebih dulu

Ditemukan saat memeriksa `main.js`, dan menurut saya wajib disodorkan sebelum satu baris
pun ditulis:

> **Kalau TASK_58 memakai bentuk "daftar putih aplikasi" (bukan kiosk satu aplikasi),
> WhatsApp Desktop RESMI tinggal dimasukkan ke daftar putih itu - dan TASK_57 tidak perlu
> ada sama sekali.**

Satu-satunya alasan menempelkan WhatsApp ke dalam `.exe` adalah anggapan "komputernya hanya
boleh menjalankan Sisupit". Begitu penguncian berbentuk *daftar putih* - yang justru saya
rekomendasikan di TASK_58 karena alasan ketersediaan - anggapan itu gugur, dan
perbandingannya jadi timpang:

| | Tempel WhatsApp Web (task ini) | WhatsApp Desktop resmi di daftar putih |
|---|---|---|
| Melanggar ToS Meta | **ya** (client tak resmi) | tidak |
| Risiko nomor kena banned | ada | tidak |
| Rusak saat WhatsApp berubah | **ya, diam-diam** (§3.3) | tidak, ia yang memperbarui dirinya |
| Biaya rilis tiap perbaikan | tinggi (§3.6) | nol |
| Notifikasi & panggilan | harus ditambal sendiri | sudah beres |
| Operator berpindah jendela | tidak | ya - satu-satunya kerugian |

Kerugian satu-satunya di kolom kanan adalah **operator berpindah jendela**. Bandingkan
dengan harga di kolom kiri. Kalau W-nol tetap dipilih sesudah membaca ini, silakan - tapi
pilihannya jadi sadar, bukan karena bentuk lain tak pernah ditawarkan.

---

## 1. Tujuan

Operator bisa memakai WhatsApp tanpa meninggalkan Sisupit, supaya komputer yang dikunci
(TASK_58) tetap layak dipakai bekerja.

### 1.1 Yang TASK INI TIDAK BISA janjikan

> **"Hanya nomor yang didaftarkan bisa login" tidak bisa ditegakkan oleh kode.**

Tiga sebab, berurutan dari yang paling menentukan:

1. **Login WhatsApp Web selalu lewat QR yang dipindai HP.** Tak ada satu pun titik di mana
   `.exe` bisa menolak sebuah nomor *sebelum* sesinya terbentuk. Yang bisa dilakukan
   paling cepat adalah memutus sesi *sesudah* nomor asing masuk - dan itu pun butuh §3.2.
2. **Membaca nomor yang tertaut = mengintip data internal WhatsApp** (DOM/IndexedDB).
   Selektornya milik orang lain, berubah kapan saja, dan **saat rusak ia rusak diam-diam**:
   pembatasannya hilang tanpa galat, dan tak ada yang tahu sampai ada yang memeriksa.
   Ini bentuk kegagalan yang sama dengan `fles-wrap` (#109) dan `no-scrollbar` (#120) -
   yang tidak ada tidak pernah bergalat.
3. **Batas keamanannya ada di HP, bukan di PC.** Orang yang memegang HP tetap bisa memakai
   WhatsApp di HP itu. Mengunci PC tidak mengubahnya.

Jangan menambal ini dengan menyembunyikan tombol atau menampilkan lencana "nomor
terverifikasi" - layar yang mengaku membatasi padahal tidak lebih berbahaya daripada layar
yang jujur tidak membatasi (#94, #90).

### 1.2 Yang SEBENARNYA bisa ditegakkan, dan itu bukan nol

Tiga kendali nyata yang tersedia, dan ketiganya harus dipakai bersama:

1. **Siapa yang boleh membuka panelnya** - digerbangi Sisupit lewat prop server (W1). Ini
   penegakan sungguhan, karena hidup di server.
2. **Nomor mana yang tertaut** - ditentukan **prosedur, bukan kode**: admin menautkan nomor
   resmi **sekali**, dan sesinya bertahan di partition `persist:whatsapp` (§4.1). Operator
   tak pernah memindai QR.
3. **Pencabutan sesi liar** - dilakukan dari **HP resmi**, di layar "Perangkat Tertaut"
   milik WhatsApp sendiri. Di situlah sesi asing terlihat dan bisa diputus. Ini titik
   penegakan yang benar, dan ia memang bukan milik Sisupit.

Tulis ketiganya apa adanya di dokumen serah terima. Kalimat yang boleh dipakai ke user:
*"komputer ini hanya bisa dipakai akun yang berwenang, dan nomor yang tertaut ditentukan
admin lalu diawasi dari HP resmi"* - bukan *"hanya nomor terdaftar yang bisa login"*.

---

## 2. Keadaan awal (diperiksa langsung 2026-09-22)

| Yang diperiksa | Hasil |
|----------------|-------|
| Versi Electron | **32.3.3** (Chromium 128) |
| Bentuk aplikasi | satu `BrowserWindow` memuat `CONFIG.baseUrl`, tray, Reverb di main process |
| Dependensi runtime | **satu**: `ws` |
| User agent | `Electron/x.y.z` + nama app **sudah dibuang** (`main.js:70-72`) supaya terbaca seperti Chrome - kebetulan menguntungkan WhatsApp Web (§3.3) |
| Tautan keluar | `setWindowOpenHandler` (`main.js:97-105`): se-host `baseUrl` → dimuat di jendela yang sama; selain itu → **`shell.openExternal`** = browser sistem |
| `will-navigate` | **TIDAK ADA handler.** Navigasi di jendela yang sama (`target=_self`/JS) ke host mana pun **tidak dicegat** |
| `setPermissionRequestHandler` | **TIDAK ADA** |
| `will-download` | **TIDAK ADA** - unduhan jatuh ke folder bawaan, senyap |
| Pemulihan saat crash | **TIDAK ADA** (`render-process-gone` tak didengarkan) |
| Instance ganda | sudah dijaga `requestSingleInstanceLock()` (`main.js:58`) |

Dua baris "TIDAK ADA" pertama itu **lubang yang baru berbahaya setelah TASK_58** - di
komputer biasa ia fitur, di komputer terkunci ia pintu keluar. Dicatat di sini karena
task inilah yang pertama kali menambah konten pihak ketiga ke dalam app.

---

## 3. Temuan yang membatasi bentuk solusi

### 3.1 Sesi WhatsApp harus bertahan, dan harus terpisah dari sesi Sisupit

Kalau sesinya ikut `session.defaultSession`, dua hal buruk terjadi sekaligus: cookie
Sisupit & WhatsApp bercampur (logout Sisupit bisa menyeret WhatsApp), dan pembersihan sesi
salah satunya menjatuhkan yang lain. Wadahnya **wajib** partition sendiri,
`persist:whatsapp`, supaya QR hanya dipindai sekali seumur pemasangan (§1.2 poin 2).

### 3.2 Membaca nomor tertaut = scraping. Kalau tetap dilakukan, buat gagalnya BERISIK

Kalau user tetap ingin `.exe` memeriksa nomor, aturannya satu: **saat pembacaan gagal, ia
harus berteriak, bukan diam**. Bentuk yang benar - "tidak bisa membaca nomor tertaut" =
panel ditutup + dicatat ke `sisupit.log` (berkas log itu sudah ada dan sudah jadi tempat
pertama yang dilihat saat ada keluhan). Bentuk yang salah, dan ini bentuk bawaannya kalau
tak sengaja dihindari: `try/catch` yang memulangkan "cocok" saat gagal membaca, sehingga
pembatasan hilang persis pada saat ia paling dibutuhkan.

Tapi baca §1.1 poin 2 dulu: ini menambah kerumitan yang akan rusak sendiri. **Rekomendasi:
jangan dibangun sama sekali**; pakai §1.2 yang tidak bisa rusak diam-diam.

### 3.3 WhatsApp Web menua sendiri, tanpa ada yang menyentuh kode

Electron 32.3.3 membawa Chromium 128. WhatsApp Web menolak browser yang dianggap terlalu
tua, dan ambangnya ditentukan Meta, bukan kita. Artinya: **fitur ini bisa berhenti bekerja
di komputer yang tak pernah diubah apa pun**, dan perbaikannya menaikkan versi Electron =
membangun ulang & memasang ulang installer di tiap PC (§3.6).

Ini biaya rutin yang tidak dimiliki satu pun fitur lain di repo ini. Catat di runbook,
jangan disimpan di kepala.

### 3.4 Izin: Electron mengabulkan bila tak ada handler

Tanpa `setPermissionRequestHandler`, permintaan izin diperlakukan permisif. WhatsApp Web
akan meminta **notifikasi** (perlu - kalau ditolak diam-diam, pesan masuk tak terlihat dan
terbaca sebagai "WhatsApp-nya rusak") dan bisa meminta **mikrofon/kamera** (W3: tolak).
Karena itu handler wajib ditulis **eksplisit per jenis izin**, daftar putih - jangan
mengandalkan perilaku bawaan, dan jangan pula menolak semuanya sekaligus.

Verifikasi perilaku bawaannya di Electron 32 sebelum diandalkan; jangan disalin dari
ingatan.

### 3.5 Unduhan lampiran adalah pintu ke aplikasi lain

Di komputer terkunci, "Simpan" lalu "Buka" adalah cara paling mudah menjalankan aplikasi
di luar daftar putih. `will-download` wajib ditangani: folder tetap, dan **tanpa tombol
buka**. Ini mengikat TASK_58 - kerjakan keduanya dengan asumsi yang sama.

### 3.6 Harga rilis wrapper, yang membuat tiap perbaikan kecil jadi mahal

Sudah tercatat di `CLAUDE.md` dan berlaku penuh di sini:
- `npm run dist`, naikkan versi; `artifactName` memakai `${version}` sehingga **URL
  unduhannya ikut berubah**, dan installer lama harus dihapus dari ketiga environment
  supaya tak ada dua yang beredar.
- ~80 MB dikirim lewat `pscp` ke tiap environment (berkas `.exe` **sengaja di luar git**).
- Installer **tidak ditandatangani** → SmartScreen, dan di mesin ber-AppLocker aturannya
  berbasis hash yang **berubah tiap rilis** (lihat TASK_58).
- Harus dipasang ulang **di tiap komputer**, satu per satu.

Bandingkan dengan TASK_56 yang tiba lewat `git pull`. Tiap baris yang ditaruh di `.exe`
membeli dirinya sendiri dengan biaya ini, selamanya.

---

## 4. Rencana

### 4.1 Wadah

- `WebContentsView` (Electron 30+; `BrowserView` sudah usang) di dalam jendela utama, atau
  jendela kedua bertray sendiri - putuskan saat mengerjakan, keduanya sah.
- `webPreferences`: `partition: 'persist:whatsapp'`, `contextIsolation: true`,
  `nodeIntegration: false`. **Tanpa preload** - jangan pernah menyuntikkan jembatan Node ke
  halaman pihak ketiga.
- `web.whatsapp.com` saja. Navigasi keluar host itu **ditolak** (`will-navigate` +
  `setWindowOpenHandler` khusus untuk view ini), termasuk `shell.openExternal` - kalau
  tidak, tiap tautan di dalam obrolan jadi jalan keluar ke browser sistem.

### 4.2 Gerbang siapa yang boleh membuka

Dibaca dari **Sisupit**, bukan diputuskan `.exe`: halaman Sisupit mengumumkan
`canOpenWhatsapp` (prop server, aturan `CONVENTIONS.md`), `.exe` membacanya lewat jalur
yang sudah ada untuk id user (`inertia:navigate` → `window.__sisupitUserId`, lihat README
wrapper). Jangan menambah daftar peran di `main.js` - itu daftar kedua, dan ia akan
menyimpang dari server tanpa gejala.

### 4.3 Izin & unduhan

- `setPermissionRequestHandler` eksplisit: `notifications` → izinkan;
  `media`/`geolocation`/`midi`/`clipboard-read` → tolak (W3).
- `will-download`: folder tetap, nama berkas dibersihkan, tanpa "buka berkas" (W4).

### 4.4 Prosedur penautan (bukan kode, tapi bagian dari hasil)

1. Admin membuka panel, memindai QR dengan **HP nomor resmi Damkar**.
2. Sesi tersimpan di `persist:whatsapp`; operator tidak pernah memindai QR.
3. Pemegang HP resmi memeriksa "Perangkat Tertaut" secara berkala dan memutus yang asing.
4. Tulis ketiganya di dokumen serah terima komputer.

### 4.5 Dokumen - WAJIB, bukan opsional

- **`PENGECUALIAN_ATURAN.md` entri baru (#4)**: aturan yang ditekuk = "pembatasan hidup di
  server, bukan di klien". Isinya: keputusan W0, siapa & kapan menyetujui, alasan user,
  dan **konsekuensi yang diterima** = §1.1 lengkap ketiga poinnya + risiko banned. Rujuk
  entri itu dari komentar di `main.js`.
- README `SisupitDesktop` + memori sesi (aplikasi itu tanpa git).
- `ARCHITECTURE_MAP.md`: sebut `canOpenWhatsapp` bila prop itu jadi dibuat.

---

## 5. Blast radius

| Area | Efek |
|------|------|
| Repo `sisupit` | Nyaris nol - paling banter satu prop `canOpenWhatsapp`. Tak ada migrasi, route, atau skema |
| `.exe` | Dari shell tipis (satu dependensi `ws`) jadi app yang memuat konten pihak ketiga. **Permukaan crash bertambah**, dan di komputer kiosk crash itu fatal (TASK_58) |
| Sesi & cookie | Partition baru; jangan sampai pembersihan sesi Sisupit ikut menghapusnya (QR harus dipindai ulang = butuh HP resmi datang lagi) |
| Ukuran & memori | Satu tab Chromium tambahan yang hidup terus. Perhatikan di PC ruang komando yang juga menjalankan peta Leaflet |
| Nomor WhatsApp resmi | **Risiko banned** (§0.3). Kalau ini terjadi saat kebakaran, jalur koordinasi hilang - siapkan jalur cadangan (telepon biasa) di prosedur |
| TASK_58 | Menambah pekerjaan permanen: tiap rilis `.exe` mengubah hash → kebijakan AppLocker di tiap mesin ikut diperbarui |

---

## 6. Rencana verifikasi

Tak ada Pest untuk ini - berkasnya di luar repo dan perilakunya milik pihak ketiga.
Verifikasinya manual, dan hasilnya ditulis ke README wrapper.

- [ ] `php artisan test` repo `sisupit` tetap ≥ baseline **472 passed** (kalau prop
      `canOpenWhatsapp` jadi ditambahkan, sertakan penjaganya)
- [ ] QR muncul, ditautkan dengan nomor resmi, obrolan terbaca
- [ ] **Tutup app, buka lagi → TIDAK diminta QR** (bukti partition bertahan)
- [ ] Pesan masuk memunculkan notifikasi Windows, dan **tidak** membunyikan sirine -
      sirine milik `EmergencyAlertNotification` saja
- [ ] Tautan di dalam obrolan **tidak** membuka browser sistem (§4.1)
- [ ] Panggilan suara ditolak (W3), unduhan mendarat di folder yang ditentukan (W4)
- [ ] Akun Sisupit yang tak berwenang **tidak** melihat panelnya (W1)
- [ ] Logout Sisupit tidak menjatuhkan sesi WhatsApp, dan sebaliknya
- [ ] Installer baru terpasang di ketiga environment, installer lama **404**, md5 cocok

---

## 7. Rollback

- `.exe`: pasang ulang installer versi sebelumnya. **Simpan installer lama** sebelum
  menghapusnya dari environment (pola cadangan wrapper di `C:\Users\Admin\backup-sisupit-wrapper\`).
- Panel bisa dimatikan tanpa rilis ulang **bila** gerbangnya dibaca dari server (§4.2) -
  cukup setel `canOpenWhatsapp` jadi false. Itu alasan kedua kenapa gerbangnya tidak
  ditaruh di `main.js`.
- Sesi WhatsApp: hapus partition `persist:whatsapp` → kembali ke keadaan belum tertaut.

---

## Acceptance criteria

- [ ] Operator memakai WhatsApp tanpa meninggalkan Sisupit
- [ ] Panel hanya terbuka untuk akun berwenang, digerbangi **server**
- [ ] Sesi bertahan antar-restart; operator tak pernah memindai QR
- [ ] Tak ada jalan keluar baru ke browser sistem lewat panel ini
- [ ] **Tidak ada satu pun klaim di layar bahwa nomor dibatasi** (§1.1)
- [ ] `PENGECUALIAN_ATURAN.md` #4 ditulis, dirujuk dari komentar `main.js`
- [ ] README wrapper & memori diperbarui (aplikasi itu tanpa git)

---

## 8. Kapan task ini harus DIBUANG

Tulis ini di entri pengecualiannya, supaya ia tidak hidup selamanya karena tak ada yang
ingat kenapa ia ada:

- Kalau nomor resmi **kena banned** → hentikan, pindah ke WhatsApp Desktop resmi atau
  Cloud API. Jangan coba menyiasatinya.
- Kalau WhatsApp Web menolak Chromium-nya (§3.3) **dua kali berturut-turut** → biaya
  perawatannya sudah melampaui nilainya.
- Kalau pembatasan nomor kelak benar-benar harus berlaku → jalurnya **Cloud API**, dan
  task ini dicabut seluruhnya, bukan ditambal.

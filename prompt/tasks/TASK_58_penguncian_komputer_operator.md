# TASK_58 — Penguncian komputer operator: hanya aplikasi yang disetujui
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_58 |
| Severity | P2 |
| Tipe | konfigurasi & runbook (bukan kode repo) + perubahan kecil di `SisupitDesktop` |
| Sumber | permintaan user 2026-09-22 (pecahan ketiga) |
| Status | TODO - **dikerjakan PALING AKHIR**, lihat §1.2 |

> Bagian permintaan user yang dijawab task ini: *"nanti akan di set komputernya hanya bisa
> dipakai untuk buka aplikasi sisupit"*

**Sebagian besar hasil task ini bukan kode.** Ia kebijakan Windows di tiap komputer +
runbook. Yang menyentuh kode hanya §4.3 (beberapa baris di `SisupitDesktop`, di luar repo
ini, tanpa git).

---

## 0. Keputusan yang menunggu jawaban

| # | Pertanyaan | Rekomendasi & alasannya |
|---|-----------|------------------------|
| **L1** | Bentuk kuncinya: **kiosk satu aplikasi** atau **daftar putih aplikasi**? | **Daftar putih**, dan sejak 2026-09-22 ini **hampir tak punya pilihan lain**: TASK_57 ditunda, jadi WhatsApp tidak ada di dalam Sisupit. Kiosk satu aplikasi berarti operator kehilangan WhatsApp sama sekali di mesin itu. Alasan aslinya tetap berlaku dan lebih kuat: di ruang komando kebakaran **ketersediaan lebih mahal daripada kerapian** (§3.1) |
| **L2** | Edisi Windows di komputer operator? (fakta, bukan preferensi) | Harus diperiksa per mesin. **Windows Home tidak punya satu pun mekanisme ini** - kalau ternyata Home, kuncian yang setara tidak tersedia dan rencananya berubah total (§2) |
| **L3** | Jalan keluar darurat untuk supervisor: bentuknya apa & siapa pemegangnya? | **Wajib ada.** Akun admin lokal terpisah + kombinasi tombol yang terdokumentasi. Tanpa ini, gangguan jaringan saat kebakaran = stasiun tak terpakai (§3.2) |
| **L4** | Siapa yang memegang admin lokal tiap mesin, dan siapa yang memperbarui kebijakan tiap kali `.exe` dirilis? | Harus satu nama, bukan "IT". Biaya berulangnya nyata (§3.3) |

---

## 1. Tujuan

Komputer operator hanya bisa dipakai untuk pekerjaan Damkar: Sisupit, plus aplikasi lain
yang benar-benar diperlukan dan disetujui.

### 1.1 Rumusan tujuan yang lebih jujur

Tujuan sebenarnya **bukan** "komputer hanya bisa membuka Sisupit" melainkan **"komputer
tidak bisa dipakai untuk hal di luar pekerjaan"**. Perbedaannya menentukan seluruh bentuk
pekerjaan ini:

- Rumusan pertama memaksa setiap alat kerja masuk ke dalam Sisupit (itulah asal TASK_56 &
  TASK_57), dan menjadikan Sisupit **satu-satunya titik kegagalan**.
- Rumusan kedua tercapai dengan daftar putih yang pendek, dan tiap alat tetap dipegang
  pembuatnya - yang memperbarui dan memperbaiki dirinya sendiri.

Keduanya sah. Tapi yang pertama memindahkan beban perawatan ke kita, **selamanya**, dan
harganya sudah terlihat di TASK_57 §3.3 & §3.6.

### 1.2 Urutan: task ini DIKERJAKAN PALING AKHIR

Mengunci komputer sebelum alat penggantinya siap berarti mencabut alat kerja operator di
ruangan yang menangani panggilan darurat. Urutan yang mengikat:

```
TASK_56 (email) selesai & BENAR-BENAR DIPAKAI operator
        ↓
TASK_58 (kunci)  ← baru di sini
```

TASK_57 (WhatsApp di dalam `.exe`) **DITUNDA** atas keputusan user 2026-09-22, jadi ia tak
lagi ada di rantai ini. Konsekuensinya untuk task ini: **WhatsApp harus tetap terjangkau
dari mesin yang dikunci** - lewat WhatsApp Desktop resmi di daftar putih (§4.1), atau lewat
HP operator. Mengunci mesin tanpa menyediakan salah satunya berarti mencabut jalur
koordinasi yang dipakai sehari-hari, dan itu akan ketahuan pertama kali justru saat ada
kejadian.

Dan jangan dikunci serentak di semua mesin: **satu mesin dulu, satu minggu**, baru sisanya.

---

## 2. Keadaan awal

### 2.1 Yang tersedia di Windows - PERIKSA di mesin sungguhan, jangan salin dari sini

Microsoft mengubah matriks ini antar-versi, jadi tabel di bawah adalah titik awal
penyelidikan, **bukan** kesimpulan:

| Mekanisme | Bentuk | Edisi (perlu diverifikasi) |
|-----------|--------|---------------------------|
| **Assigned Access** | kiosk satu aplikasi | Pro / Enterprise / Education |
| **Shell Launcher** | ganti `explorer.exe` dengan Sisupit | Enterprise / Education / IoT **saja** |
| **AppLocker** | daftar putih aplikasi | Enterprise / Education |
| **App Control (WDAC)** | daftar putih, lebih baru | lebih luas di Windows 11 |
| **Akun standar + policy** | paling sederhana | semua edisi |

**Windows Home: tidak satu pun tersedia.** Kalau L2 menjawab Home, satu-satunya yang
tersisa adalah akun pengguna standar (bukan administrator) + penghapusan aplikasi yang tak
perlu - dan itu **bukan penguncian**, melainkan pengurangan godaan. Katakan apa adanya,
jangan dijual sebagai kunci.

### 2.2 Keadaan `.exe` (diperiksa 2026-09-22, sama dengan TASK_57 §2)

| Hal | Keadaan | Artinya di komputer terkunci |
|-----|---------|------------------------------|
| `setWindowOpenHandler` → `shell.openExternal` (`main.js:97-105`) | tautan luar dibuka **browser sistem** | **lubang** - browser adalah pintu ke mana saja |
| `will-navigate` | **tak ada handler** | jendela Sisupit sendiri bisa dinavigasikan ke host mana pun |
| `will-download` | **tak ada handler** | unduhan senyap; "Simpan → Buka" menjalankan aplikasi lain |
| `render-process-gone` | **tak didengarkan** | crash tidak dipulihkan |
| Autostart | **sudah ada** (toggle di menu tray) | tinggal dipastikan menyala & terkunci |
| Instance ganda | sudah dijaga (`main.js:58`) | aman |
| Installer | **tidak ditandatangani** | aturan AppLocker jadi berbasis hash → §3.3 |

Keempat baris "tak ada" itu **bukan bug hari ini**. Di komputer biasa itu perilaku yang
benar. Ia berubah jadi lubang hanya setelah task ini dijalankan - itulah kenapa
perbaikannya milik task ini, bukan task lain.

---

## 3. Temuan yang membatasi bentuk solusi

### 3.1 Kiosk penuh vs daftar putih - kenapa rekomendasinya daftar putih

| | Kiosk penuh (Shell Launcher / Assigned Access) | Daftar putih (AppLocker/WDAC + akun standar) |
|---|---|---|
| Kekuatan kunci | paling kuat | kuat, tapi Explorer tetap ada |
| **Sisupit crash** | **komputer tak terpakai** | tinggal dibuka lagi |
| Windows Update reboot | harus kembali sendiri, kalau gagal = mati | pulih seperti PC biasa |
| Printer, berkas, lampiran | harus disediakan Sisupit | berjalan seperti biasa |
| WhatsApp Desktop resmi | tidak mungkin | **tinggal dimasukkan daftar** |
| Edisi Windows | Enterprise/Education (Shell Launcher) | lebih longgar |

Di ruang komando kebakaran, baris **"Sisupit crash"** yang menentukan. Hari ini `.exe` itu
shell tipis (Electron 32.3.3, satu dependensi runtime), tapi TASK_57 - **bila kelak
dihidupkan lagi** - akan menambahkan
konten pihak ketiga ke dalamnya - artinya **permukaan crash justru bertambah persis saat
mesinnya kehilangan jalan keluar**. Dua keputusan itu saling memperburuk kalau diambil
bersamaan tanpa disadari.

### 3.2 WAJIB ada jalan keluar darurat - ini syarat, bukan saran

Bayangkan jaringan putus atau server tak terjangkau saat ada panggilan kebakaran. Di kiosk
penuh, layar yang tampil adalah halaman galat, dan **tidak ada alat lain di mesin itu**.
Tak ada peta, tak ada telepon, tak ada catatan.

Karena itu, bentuk mana pun yang dipilih L1:

1. Ada **akun admin lokal terpisah** yang tidak terkunci, passwordnya dipegang supervisor.
2. Cara keluarnya **ditulis** dan ditempel di mesin - bukan disimpan di kepala satu orang
   yang kebetulan sedang libur.
3. Diuji **sebelum** mesin dipakai sungguhan, dengan cara mencabut jaringannya.
4. Prosedur cadangan non-digital (nomor telepon) tetap tertempel di meja.

### 3.3 Installer tak ditandatangani = biaya berulang di tiap mesin

Aturan daftar putih untuk aplikasi tak bertanda tangan berbasis **path atau hash**. Hash
`.exe` **berubah tiap rilis**. Jadi tiap kali `SisupitDesktop` dirilis ulang, kebijakan di
**tiap komputer** ikut diperbarui, kalau tidak Sisupit sendiri yang akan tertolak oleh
kebijakan yang kita pasang.

Dua jalan keluarnya, dan keduanya keputusan tersendiri:
- **Beli sertifikat code-signing** → aturan bisa berbasis penerbit, hash tak lagi relevan,
  dan SmartScreen ikut diam. Biaya tahunan.
- Aturan berbasis **path** (folder instalasi) → lebih longgar: apa pun yang bisa menulis ke
  folder itu jadi dipercaya. Terima hanya kalau operator bukan admin lokal.

Ini sekaligus jawaban kenapa TASK_57 - **bila kelak dihidupkan** - membuat task ini lebih
mahal secara permanen: tiap
perbaikan WhatsApp = rilis `.exe` = pembaruan kebijakan di semua mesin.

### 3.4 Yang harus ditambal di `.exe` sebelum mesin dikunci

Ketiga lubang di §2.2 baru berbahaya setelah dikunci, dan ketiganya murah ditambal:
`will-navigate` dibatasi ke host Sisupit, `shell.openExternal` dibatasi daftar putih (atau
dimatikan), `will-download` diarahkan ke folder tetap tanpa "buka berkas". Tambahkan
pemulihan otomatis saat `render-process-gone`, dan matikan pintasan DevTools.

### 3.5 Windows Update tetap akan me-restart mesin

Bukan hal yang bisa dicegah, hanya diatur: jam aktif, jadwal restart di luar jam sibuk, dan
**Sisupit wajib kembali sendiri** sesudahnya (autostart sudah ada, tinggal dipastikan). Uji
dengan restart sungguhan, bukan dengan membuka app secara manual.

---

## 4. Rencana

### 4.1 Tetapkan daftar putih (asumsi L1 = daftar putih)

Sependek mungkin, dan tiap entri punya alasan tertulis:
- Sisupit Desktop
- Peramban **hanya bila** benar-benar diperlukan - kalau masuk, ia membatalkan sebagian
  besar tujuan; pertimbangkan mengunci homepage & ekstensi lewat policy
- **WhatsApp Desktop resmi** - sejak TASK_57 ditunda, inilah satu-satunya cara WhatsApp
  tetap ada di mesin yang dikunci selain HP operator (§1.2)
- Utilitas cetak / pembaca PDF bila berita acara memang dicetak

### 4.2 Siapkan mesin (runbook, satu halaman per langkah)

1. Operator memakai **akun standar**, bukan administrator.
2. Admin lokal terpisah (L3/L4).
3. Terapkan daftar putih; uji bahwa aplikasi di luar daftar benar-benar ditolak.
4. Autostart Sisupit menyala; jam aktif Windows Update disetel.
5. Tempel kartu prosedur: cara keluar darurat + nomor telepon cadangan.

### 4.3 Perubahan `SisupitDesktop` (§3.4)

Kecil, tapi **wajib mendahului** penguncian. Karena ini rilis `.exe`, ikut aturan biaya di
TASK_57 §3.6 - naikkan versi, kirim ke tiga environment, hapus installer lama, catat di
README & memori (aplikasi itu tanpa git).

### 4.4 Dokumen

- Runbook baru di `deploy/` (folder itu memang folder **dokumen**, bukan otomatisasi -
  jangan tertipu namanya).
- README `SisupitDesktop` untuk perubahan §4.3.
- `CLAUDE.md` STATUS saat selesai.

---

## 5. Blast radius

| Area | Efek |
|------|------|
| Repo `sisupit` | **Nol.** Tak ada kode aplikasi web yang berubah |
| `SisupitDesktop` | Empat penambalan §3.4 + rilis installer baru |
| Operator | Kehilangan akses ke aplikasi di luar daftar. **Beri tahu sebelum dikunci** - mengunci diam-diam terbaca sebagai komputer rusak, dan keluhan pertama akan datang saat panggilan darurat |
| Dukungan teknis | Tiap kebutuhan baru ("saya perlu buka X") jadi permintaan ke pemegang L4. Siapkan jalurnya, kalau tidak orang akan mencari akal |
| Rilis `.exe` berikutnya | Kebijakan di tiap mesin ikut diperbarui (§3.3) - termasuk rilis dari TASK_57 |
| Ketersediaan | Ini risiko terbesarnya. Lihat §3.2; jangan dikerjakan tanpa jalan keluar darurat yang sudah diuji |

---

## 6. Rencana verifikasi

Tak ada test otomatis - ini konfigurasi mesin. Verifikasinya daftar periksa per komputer,
dan hasilnya ditandatangani pemegang L4.

- [ ] Aplikasi di luar daftar putih benar-benar **ditolak** (coba jalankan satu)
- [ ] **Cabut kabel jaringan** → mesin masih bisa dipakai supervisor lewat jalan keluar
      darurat (§3.2). Ini butir yang paling sering dilewati dan paling mahal
- [ ] Restart paksa → Sisupit kembali sendiri, tanpa dibuka manual
- [ ] Matikan paksa saat Sisupit terbuka → tak ada keadaan yang menggantung
- [ ] Tautan di dalam Sisupit **tidak** membuka browser sistem (§3.4)
- [ ] Unduhan mendarat di folder yang ditentukan dan **tidak** bisa dijalankan dari sana
- [ ] Operator (akun standar) tidak bisa memasang aplikasi
- [ ] Email dinas TASK_56 & (bila ada) WhatsApp berjalan **dari dalam kunci**, bukan hanya
      saat mesin belum dikunci
- [ ] Kartu prosedur tertempel di mesin
- [ ] Satu mesin dijalankan **seminggu** sebelum sisanya dikunci (§1.2)

---

## 7. Rollback

- Kebijakan daftar putih bisa dicabut oleh admin lokal - **pastikan jalurnya sudah diuji
  sebelum dipasang**, bukan sesudah ada masalah.
- Simpan cadangan kebijakan/registry sebelum diterapkan.
- `.exe`: pasang ulang versi sebelumnya (simpan installer lama, pola
  `C:\Users\Admin\backup-sisupit-wrapper\`).
- Kalau kuncian harus dilepas mendadak saat kejadian darurat, **lepaskan** - lalu perbaiki
  penyebabnya. Jangan pernah mempertahankan kunci di atas kemampuan merespons kebakaran.

---

## Acceptance criteria

- [ ] Komputer operator tak bisa dipakai di luar daftar aplikasi yang disetujui
- [ ] **Jalan keluar darurat ada, terdokumentasi, dan sudah diuji dengan jaringan dicabut**
- [ ] Sisupit kembali sendiri sesudah restart & crash
- [ ] Tak ada jalan keluar baru lewat tautan, unduhan, atau navigasi di dalam `.exe`
- [ ] Alat kerja penggantinya (TASK_56, dan TASK_57 bila dipilih) **sudah dipakai** sebelum
      kunci dipasang
- [ ] Pemegang L4 tercatat namanya, dan tahu bahwa tiap rilis `.exe` menuntut pembaruan
      kebijakan
- [ ] Runbook di `deploy/` ditulis; `CLAUDE.md` STATUS diperbarui

---

## 8. Biaya berulang yang harus diketahui sebelum menyetujui

Task ini tidak selesai saat mesin terkunci. Yang berlanjut selamanya:

1. **Tiap rilis `.exe` → perbarui kebijakan di tiap mesin** (§3.3), kecuali sertifikat
   code-signing dibeli.
2. **Tiap kebutuhan aplikasi baru → satu permintaan** ke pemegang L4.
3. **Tiap mesin baru → seluruh runbook §4.2 diulang.**
4. Kalau TASK_57 dipilih, tambahkan lagi: **WhatsApp Web bisa menolak Chromium-nya
   sendiri** (TASK_57 §3.3), dan perbaikannya adalah rilis `.exe` - yang memicu poin 1.

Poin 4 itu yang membuat §0.3 di TASK_57 layak dijawab lebih dulu: memilih daftar putih di
L1 memutus rantai ini di dua tempat sekaligus.

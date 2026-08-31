# CHECKLIST UJI MANUAL PER PERAN — SISUPIT DAMKAR

> Berkas kerja untuk mencentang fitur mana yang **sudah terbukti jalan di browser/perangkat**.
> Disusun dari kode (routes/, controller, navItems.js, halaman React) per **2026-08-31**.
> Bukan pengganti `php artisan test` — ini untuk hal-hal yang hanya terlihat oleh mata manusia.

## Cara pakai

1. Uji **satu peran sampai tuntas** dalam satu sesi (login → kerjakan seluruh blok peran itu → logout).
2. Centang di kolom kotak, lalu tulis tanggal + catatan di baris `Catatan:` tiap seksi.
3. Item yang gagal: ganti `[ ]` jadi `[!]`, tulis gejalanya, lalu catat ke
   `prompt/docs/FINDINGS_LOG.md` (ATURAN EMAS #6 — jangan diperbaiki diam-diam di tengah uji).

### Legenda

| Tanda | Arti |
|---|---|
| `[ ]` | Belum diuji |
| `[x]` | Diuji, jalan sesuai harapan |
| `[!]` | Diuji, **bermasalah** (tulis gejala + nomor temuan) |
| `[-]` | Tidak berlaku di environment ini (mis. fitur butuh data yang belum ada) |

### Peran yang ada di sistem

`superadmin` · `admin` · `petugas` · `pejabat` · `relawan` · `opd` · `masyarakat` (warga) · **tamu** (belum login)

---

## 0. PERSIAPAN SEBELUM MENGUJI

### 0.1 Akun uji (isi sendiri, jangan tulis password di berkas ini)

| Peran | Email akun uji | Yurisdiksi | Catatan |
|---|---|---|---|
| superadmin | | (kosong = nasional) | |
| admin | | kabupaten/kota | |
| petugas | | kabupaten (default TASK_49) | |
| pejabat | | kabupaten | siaga harus AKTIF agar dapat notif |
| relawan | | desa | siaga harus AKTIF |
| opd | | tanpa kode wilayah | **wajib** tertaut satu instansi |
| masyarakat | | desa (profil lengkap) | |
| masyarakat #2 | | desa berbeda | untuk uji isolasi wilayah |

### 0.2 Layanan pendukung harus hidup

- [ ] **Reverb** (WebSocket) aktif — tanpa ini semua uji real-time di §12 mustahil
- [ ] **Nominatim** `127.0.0.1:8088` — geocode & alamat otomatis
- [ ] **OSRM** `:5000` — garis rute responder ke TKP
- [ ] **TileServer-GL** `/tiles/` — basemap; kalau peta polos/tanpa nama jalan, periksa font (TASK_46)
- [ ] `MAP_TILE_URL` di `.env` menunjuk domain sendiri (bukan CARTO)
- [ ] Queue worker jalan (notifikasi & broadcast diantre)
- [ ] Master **banjar** terisi untuk desa yang diuji (kalau kosong, dropdown banjar wajar kosong)
- [ ] Master **OPD** terisi lewat `/admin/agencies` (kalau kosong, panel OPD wajar kosong)

### 0.3 Perangkat / permukaan

- [ ] Browser desktop (lebar ≥1280) — sidebar penuh
- [ ] Browser tablet (768–1023) — rail ikon
- [ ] Browser ponsel (<768) — bilah bawah + popover
- [ ] APK Android (SisupitWebView) — bila sudah dirilis
- [ ] Aplikasi desktop `.exe` (SisupitDesktop) — bila sudah dirilis

Catatan: _______________________________________________

---

## 1. MATRIKS ORIENTASI — SIAPA MELIHAT APA

Dipakai untuk memeriksa cepat: menu yang **tidak** boleh muncul sama pentingnya dengan yang muncul.

| Menu / kemampuan | superadmin | admin | petugas | pejabat | relawan | opd | masyarakat |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Beranda (dashboard) | ✓ komando | ✓ komando | ✓ taktis | ✓ komando | ✓ publik | ✓ OPD | ✓ publik |
| Peta Pemantauan | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Lapor Darurat | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Arsip & Riwayat | ✓ | ✓ | ✓ | ✓ (pantau) | ✓ (pantau) | ✓ (instansi) | ✓ (miliknya) |
| Lokasi Hydrant / SKKL / Pos Pemadam | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Daftar Relawan | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Verifikasi Laporan (`/admin/reports`) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manajemen Pengguna | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manajemen Hydrant / SKKL / Pos / OPD / Banjar | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Pengumuman Sistem | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Role / Hak Akses / Assign / Akses Route | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Instansi-Kabupaten / Pengaturan Notifikasi | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Verifikasi & Broadcast laporan** | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Tolak laporan** | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Meluncur / Tiba / Batal meluncur | ✗* | ✗* | ✓ | ✗ | ✓ | ✗ | ✗ |
| Tutup insiden (Selesai) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Koreksi titik insiden | ✗* | ✗* | ✓ | ✗ | ✓ | ✗ | ✗ |
| Minta bantuan OPD | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Cabut permintaan OPD | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Konfirmasi OPD | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ (instansinya) | ✗ |
| Berita Acara — entri sementara | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Berita Acara — **final** | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Berita Acara — lihat saja | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Mode Siaga (on/off) | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |

\* admin/superadmin bukan responder lapangan — aksi meluncur/tiba/koreksi titik memang milik `petugas`/`relawan`.

- [ ] Matriks di atas cocok dengan yang benar-benar terlihat saat diuji (tandai barisnya bila meleset)

Catatan: _______________________________________________

---

## 2. LINTAS PERAN — WAJIB DIUJI DI SETIAP AKUN

Blok ini diulang untuk **tiap** peran. Salin tabelnya kalau perlu jejak per peran.

### 2.1 Autentikasi & sesi

- [ ] Login email+password berhasil, mendarat di dashboard yang benar untuk perannya
- [ ] Login Google (tombol di halaman login) berhasil
- [ ] Logout berhasil; kembali ke halaman publik; token FCM perangkat ini dilepas
- [ ] Lupa password → email tautan reset masuk → reset berhasil → bisa login dengan password baru
- [ ] Ubah password dari halaman Profil berhasil
- [ ] Halaman verifikasi email tampil bila akun belum terverifikasi
- [ ] Akun baru (Google) diarahkan ke **Lengkapi Profil** dan tak bisa lolos sebelum diisi

### 2.2 Lengkapi Profil (akun baru)

- [ ] Tombol deteksi lokasi mengisi Provinsi→Kabupaten→Kecamatan→Desa otomatis
- [ ] Spanduk berbunyi **nama wilayah berbahasa Indonesia** (bukan nama tempat beraksara asing) — TASK_42
- [ ] Bila desa gagal dicocokkan, muncul baris yang menyuruh memilih desa sendiri
- [ ] Dropdown **Banjar** terisi untuk desa terpilih
- [ ] Banjar yang belum terdaftar bisa **diusulkan** langsung dari dropdown
- [ ] Nama banjar mirip yang sudah ada **ditawarkan**, bukan digabung diam-diam

### 2.3 Halaman Profil

- [ ] Kartu peran menampilkan **nama peran yang benar** (bukan "Anggota Masyarakat" untuk semua) — TASK_45
- [ ] Kartu **Yurisdiksi Akun** menampilkan wilayah yang benar
- [ ] Kartu **Banjar** bisa mengubah banjar (desa tidak ikut berubah)
- [ ] Ubah nama / no. HP / data diri tersimpan
- [ ] Hapus akun (uji di akun buangan saja)

### 2.4 Notifikasi

- [ ] Lonceng di header menampilkan daftar notifikasi
- [ ] Klik satu notifikasi → tertandai terbaca & membuka laporan terkait
- [ ] "Tandai semua terbaca" berfungsi
- [ ] Notifikasi push web (browser) tiba
- [ ] **Tiga tingkat bunyi** terdengar berbeda (TASK_50): triase (nada naik) / broadcast (sirine) / koordinasi (nada turun) — hanya bila wrapper sudah dirilis

### 2.5 Navigasi & responsif

- [ ] Desktop: sidebar memuat **persis** menu di §1 untuk peran ini
- [ ] Tablet: rail ikon muncul, semua menu terjangkau
- [ ] Ponsel: bilah bawah 5 slot; popover "Fasilitas" & "Menu" memuat **seluruh** menu desktop
- [ ] Slot aktif ditandai kotak merah; slot "Lapor" memakai ikon brand & bercincin (bukan kotak merah)
- [ ] Baris aktif **di dalam popover** memakai tint tipis, bukan blok merah
- [ ] Footer memuat 4 tautan legal (S&K, Privasi, Bantuan, Tentang)

Catatan: _______________________________________________

---

## 3. TAMU (BELUM LOGIN)

- [ ] `/` menampilkan Spotlight; nomor darurat berbunyi **113**
- [ ] `/landing` menampilkan halaman landing yang dipoles
- [ ] `/hydrants` — daftar & peta hydrant publik, pencarian & filter status jalan
- [ ] `/pumps` — daftar SKKL (gabungan pompa + hydrant warga), **4 chip status** lengkap
- [ ] `/fire-stations` — daftar pos pemadam + tautan navigasi
- [ ] Peta di ketiga halaman fasilitas memuat tile **tanpa cap "API KEY REQUIRED"**
- [ ] Atribusi peta (OSM/ODbL) tampil di setiap peta
- [ ] `/syarat-ketentuan` bertab (Pengguna Umum + Pengguna Berkontrak); penyedia berbunyi **PT Tawarin Dimana Saja**
- [ ] `/kebijakan-privasi`, `/pusat-bantuan`, `/tentang`, `/paket-lisensi` terbuka tanpa login
- [ ] Kelima halaman info memakai **wajah yang sama** dengan halaman fasilitas (TASK_41)
- [ ] Ponsel: slot ke-5 bilah bawah = tombol **"Masuk"** (bukan popover Menu) — TASK_35
- [ ] Ponsel: mengetuk "Fasilitas" **tidak** menghilangkan bilah bawah
- [ ] `/register` — pendaftaran + centang persetujuan S&K wajib
- [ ] Membuka `/dashboard`, `/reports`, `/admin/...` → dialihkan ke login (bukan galat mentah)
- [ ] `/guideline` terbuka (referensi internal)

Catatan: _______________________________________________

---

## 4. MASYARAKAT (WARGA)

### 4.1 Dashboard

- [ ] Kartu "Laporan Saya" memuat 5 laporan terakhir milik sendiri
- [ ] Feed laporan wilayah tampil; laporan **TERLAPOR** & **ditolak** milik orang lain tidak muncul
- [ ] "Muat lebih banyak" menambah daftar (tidak mengganti)
- [ ] Laporan baru dari warga lain di wilayah sama **muncul sendiri tanpa refresh** (TASK_43)

### 4.2 Lapor Darurat — `/reports/create`

- [ ] Peta terbuka dengan pin merah di posisi GPS
- [ ] Badge GPS berganti warna sesuai keadaan (mencari / akurat / kurang akurat / gagal)
- [ ] Pin bisa digeser; alamat otomatis ikut berubah
- [ ] Peta bisa **diklik** untuk memindahkan pin (2026-09-01, sebelumnya Pusat Komando saja)
- [ ] Blok **Wilayah Kejadian** ADA: kotak "Cari Lokasi Kejadian" + Provinsi→Desa
      (2026-09-01 — sebelumnya disembunyikan dari warga; baris ini dulu berbunyi
      "**Tidak ada** dropdown wilayah")
- [ ] Keempat dropdown **terisi sendiri** dari pin; warga normal tak perlu menyentuhnya
- [ ] Geser pin → keempatnya ikut berubah mengikuti titik baru
- [ ] Pilih desa di dropdown → pin melompat ke tengah desa itu
- [ ] Desa tak tercocokkan → tombol Kirim menolak dengan pesan yang menunjuk blok itu,
      **bukan** galat validasi di field tersembunyi
- [ ] Tab **Kebakaran** aktif otomatis, berisi tombol pilihan cepat + tombol **"Lainnya"**
- [ ] "Lainnya" di tab Kebakaran membuka isian judul bebas
- [ ] Tab **Non Kebakaran** langsung meminta judul bebas
- [ ] Di tab Kebakaran: foto/deskripsi/patokan **opsional** (bisa kirim tanpa itu) — darurat-first
- [ ] Di tab Non Kebakaran: foto + deskripsi + patokan **wajib** (validasi menolak bila kosong)
- [ ] Unggah beberapa foto sekaligus; foto bisa dihapus sebelum kirim
- [ ] Panel "Alamat Lengkap (otomatis)" terisi; tombol "Salin ke patokan" bekerja
- [ ] Alamat tak memuat aksara asing yang tak terbaca (TASK_43 §B)
- [ ] Notice "laporan diarahkan ke Damkar X" / "wilayah belum terdaftar" muncul sesuai pin
- [ ] Kirim berhasil → mendarat di halaman **Terima Kasih**
- [ ] Kirim >5 kali dalam 10 menit → ditolak rate limit (pesan wajar, bukan galat mentah)

### 4.3 Halaman Terima Kasih

- [ ] Stepper menunjukkan tahap **sesuai status sebenarnya** (bukan selalu "Laporan Masuk") — TASK_43 §C
- [ ] Status berubah **real-time** saat admin memverifikasi, tanpa refresh
- [ ] Laporan yang ditolak tampil sebagai jalan buntu, bukan langkah kelima

### 4.4 Detail laporan sendiri

- [ ] Bisa membuka detail laporan miliknya walau statusnya masih TERLAPOR
- [ ] Peta menampilkan titik kejadian
- [ ] Kartu Alamat menampilkan **Alamat** & **Patokan Lokasi** sebagai dua baris terpisah (TASK_49)
- [ ] Lencana **asal titik** tampil di atas tombol "Navigasi ke Lokasi" (TASK_52)
- [ ] Laporan lama tanpa data berbunyi **"Asal titik tidak tercatat"** — bukan mengaku sesuatu
- [ ] Status badge berubah real-time saat admin/petugas bertindak
- [ ] Tidak ada tombol aksi Pusat Komando (Verifikasi/Tolak/Selesai) yang terlihat

### 4.5 Ubah / hapus laporan

- [ ] Laporan **TERLAPOR** miliknya bisa diedit (isi + kelola foto)
- [ ] Laporan yang sudah diverifikasi/ditolak **tidak bisa** diedit (403 dengan pesan jelas)
- [ ] Laporan orang lain tidak bisa diedit walau ID-nya ditebak

### 4.6 Arsip & Riwayat

- [ ] Tab "Riwayat Saya" memuat semua laporannya termasuk TERLAPOR & ditolak
- [ ] Tab "Semua Laporan" **tidak** memuat TERLAPOR/ditolak milik orang lain
- [ ] Pencarian & paginasi jalan

Catatan: _______________________________________________

---

## 5. RELAWAN

Semua item **§4 (Masyarakat)** juga berlaku untuk relawan, **kecuali §4.6**: "Arsip & Riwayat"
relawan memakai tampilan **pemantauan** (peta sebaran + triase), bukan dua tab warga.

- [ ] "Arsip & Riwayat" relawan tampil sebagai daftar pemantauan tanpa tombol Verifikasi & Export
- [ ] Chip **Laporan Masuk** & **Ditolak** tidak ada di daftar itu (TASK_48)
- [ ] `?filter=mine` tetap memulangkan daftar laporan miliknya sendiri

Tambahannya:

### 5.1 Dashboard relawan

- [ ] Panel "Radar" memuat kejadian `pending`/`TERLAPOR` di wilayahnya
- [ ] Tab "Tugas Saya" memuat insiden yang ia respons (termasuk yang di luar desanya)
- [ ] Kartu **Mode Kesiapan** berlabel "Siaga" / "Non Aktif"
- [ ] Mematikan siaga → berhenti menerima siaran darurat; menyalakan lagi → menerima lagi
- [ ] Jarak (km) ke TKP tampil di kartu misi
- [ ] Kejadian baru muncul sendiri tanpa refresh

### 5.2 Merespons insiden

- [ ] Tombol **"Meluncur"** ada di halaman detail insiden dalam wilayahnya
- [ ] Setelah meluncur, marker relawan bergerak mengikuti GPS (dilihat dari akun lain)
- [ ] Garis rute jalan (OSRM) tergambar dari posisi ke TKP
- [ ] **"Batal Meluncur"** hanya muncul saat status responder masih "Meluncur"
- [ ] **"Tiba di Lokasi"** menandai kehadiran
- [ ] Setelah tiba, muncul afordans **koreksi titik insiden**
- [ ] Geser pin koreksi → pin **tidak melompat balik** saat GPS berdetak (TASK_44)
- [ ] Setelah konfirmasi koreksi, lencana asal titik berubah jadi **"dikoreksi petugas"** tanpa muat ulang, dan keterangan jarak pelapor hilang (TASK_52)
- [ ] Insiden di luar wilayahnya **tidak** bisa direspons (403)

### 5.3 Yang TIDAK boleh ada di layar relawan

- [ ] Tidak ada tombol Verifikasi / Broadcast / Tolak
- [ ] Tidak ada tombol "Tandai Selesai"
- [ ] Tidak ada menu Peta Pemantauan
- [ ] Tidak ada menu `/admin/*`

### 5.4 Keahlian

- [ ] Kartu "Keahlian Saya" di Profil bisa memilih & menyimpan keahlian
- [ ] Keahlian tersimpan terlihat di halaman Daftar Relawan (dilihat akun petugas/admin)

Catatan: _______________________________________________

---

## 6. PETUGAS

> **Perubahan penting TASK_51 (2026-08-31):** petugas **tidak lagi** bisa verifikasi/broadcast
> maupun menolak laporan. Uji ini justru harus **membuktikan tombol-tombol itu hilang**.

### 6.1 Dashboard taktis

- [ ] Daftar **Misi Aktif** memuat laporan `TERLAPOR`/`pending`/`handling` di wilayahnya
- [ ] Urgensi merah menandai laporan **`pending`** (bukan TERLAPOR) — TASK_51 poin (d)
- [ ] Peta misi menampilkan titik kejadian
- [ ] Antrian **"Menunggu Berita Acara"** memuat insiden `resolved` yang **belum ada entri sama sekali**
- [ ] Insiden yang sudah petugas isi (sementara) **hilang** dari antrian itu
- [ ] Kejadian baru muncul sendiri tanpa refresh

### 6.2 Halaman detail insiden — laporan mentah (TERLAPOR)

- [ ] Detail laporan TERLAPOR **bisa dibuka** (lewat kartu misi / tab Semua Laporan / notifikasi)
- [ ] **Tidak ada** panel verifikasi, tidak ada tombol Broadcast, tidak ada tombol Tolak
- [ ] Muncul keadaan **"Menunggu Konfirmasi Admin"** — layar tidak sepi tanpa penjelasan
- [ ] Status badge tetap berbunyi **"Laporan Masuk"** (kamus status tidak difork per peran)

### 6.3 Aksi lapangan

- [ ] "Meluncur" / "Tiba di Lokasi" / "Batal Meluncur" berfungsi (sama seperti relawan)
- [ ] Marker & rute petugas tampil di layar akun lain secara real-time
- [ ] Koreksi titik insiden setelah tiba berfungsi; lencana asal titik ikut berubah
- [ ] **"Tandai Selesai"** menutup insiden; jejak penutup (nama + waktu) tercatat & tampil
- [ ] Setelah Selesai muncul ajakan mengisi Berita Acara

### 6.4 OPD

- [ ] Bisa **meminta bantuan OPD** (mis. PLN) dari halaman detail
- [ ] **Tidak bisa mencabut** permintaan OPD yang sudah dikirim (tombol cabut tak ada) — TASK_51
- [ ] Bisa mencatatkan konfirmasi OPD (mis. "listrik sudah dipadamkan")
- [ ] Konfirmasi OPD memunculkan notifikasi ke Pusat Komando, relawan siaga, helper, & pelapor

### 6.5 Berita Acara

- [ ] Bisa membuat entri **sementara** (append-only: tiap simpan = entri baru)
- [ ] Tombol/opsi **final tidak tersedia** (final = admin) — dan bila dipaksa, server menolak
- [ ] Sumber informasi terisi otomatis untuk laporan lewat aplikasi; **kosong** untuk laporan yang diketik operator
- [ ] OPD ikut tercantum di tim atensi bertanda **"(OPD)"**
- [ ] Korban bisa ditambah banyak; kolom **Kondisi Korban** tersimpan
- [ ] `volume_air` menerima teks bebas ("±3 tangki")
- [ ] KTP korban hanya terbuka lewat tautan berpenjaga (tidak bisa diakses langsung)

### 6.6 Lapor lewat telepon (Pusat Komando)

> **2026-09-01:** sakelar dua mode ("Pilih manual" / "Ikuti pin peta") DICABUT — form lapor
> kini punya SATU cara menetapkan lokasi, dan blok Wilayah Kejadian tampil untuk semua
> pelapor (lihat §2.x warga). Yang di bawah ini khusus alur telepon.

- [ ] `/reports/create` menampilkan **pemilih wilayah** Provinsi→Kabupaten→Kecamatan→Desa
- [ ] Nilai awal terisi dari yurisdiksi operator sendiri
- [ ] Memilih wilayah → pin melompat ke centroid wilayah itu
- [ ] Kotak **"Cari Lokasi Kejadian"** melompatkan pin & mengisi wilayah otomatis
- [ ] Peta bisa **diklik** untuk menaruh pin
- [ ] Menggeser pin **menimpa** wilayah yang tadi dipilih, mengikuti titik pin yang baru
      (ini kebalikan perilaku lama — dulu pilihan operator dikunci)
- [ ] **Tidak ada lagi** tombol "Pilih manual" / "Ikuti pin peta" di layar
- [ ] Laporan hasil telepon berlencana asal titik **"ditandai manual"** (TASK_52)

### 6.7 Menu & daftar

- [ ] Menu **Daftar Relawan** ada; filter keahlian jalan; detail relawan terbuka
- [ ] Menu **Peta Pemantauan** ada (lihat §9.2 untuk detail ujinya)
- [ ] Menu `/admin/*` **tidak ada** — dan bila URL diketik manual → 403/dialihkan
- [ ] Tab "Semua Laporan" memuat laporan TERLAPOR (petugas memang boleh melihatnya)

Catatan: _______________________________________________

---

## 7. ADMIN

Admin melihat semua yang dilihat Pusat Komando, **plus** wewenang verifikasi & seluruh menu Administrasi.

### 7.1 Dashboard komando

- [ ] 4 kartu statistik terisi (laporan aktif, penolong siaga, hydrant, laporan selesai)
- [ ] Kartu bisa diklik menuju daftar yang sesuai
- [ ] Daftar 5 laporan terakhir tampil dengan alamat & waktu
- [ ] Peta dashboard menampilkan laporan (aktif merah, selesai hari ini biru)
- [ ] Angka & daftar hanya memuat wilayah yurisdiksinya
- [ ] Laporan baru muncul sendiri tanpa refresh

### 7.2 Verifikasi Laporan — `/admin/reports`

- [ ] Spanduk "menunggu verifikasi" menampilkan jumlah yang benar
- [ ] Chip status lengkap: Laporan Masuk / Terverifikasi / Penanganan / Selesai / **Ditolak** (TASK_48)
- [ ] Memilih chip **Ditolak** benar-benar memuat laporan berstatus ditolak, berlencana **"Ditolak"** & berpin sesuai — bukan mengaku "Laporan Terverifikasi"
- [ ] Pencarian & paginasi jalan
- [ ] Peta sebaran + legenda cocok dengan daftar
- [ ] Menu kebab → **Export Excel** terunduh
- [ ] Berkas Excel: 35 kolom, label status memakai kosakata kanonik, alasan penolakan ikut, identitas/KTP korban **tidak** ikut

### 7.3 Verifikasi & broadcast satu laporan

- [ ] Panel verifikasi tampil untuk laporan TERLAPOR
- [ ] **Peringatan asal titik** tampil sebelum tombol Broadcast bila pin jauh dari pelapor (>300 m) — TASK_52
- [ ] Nomor telepon pelapor tertera tepat di atas peringatan itu
- [ ] Daftar OPD tercentang otomatis untuk jenis kebakaran; bisa di-uncentang
- [ ] Tombol **Broadcast** menyiarkan: status jadi `pending`, notifikasi sirine tiba di petugas & relawan siaga sewilayah
- [ ] Pelapor menerima notifikasi balik (bunyi bawaan sistem, **bukan** sirine)
- [ ] Tombol **Tolak** meminta alasan; status jadi `ditolak`; pelapor diberi tahu
- [ ] Jejak penolak (nama + waktu) tercatat & tampil bagi staf
- [ ] Laporan yang sudah diproses tidak bisa di-approve dua kali (403 dengan pesan wajar)
- [ ] Insiden `resolved` tidak bisa ditolak

### 7.4 Aksi lain di detail

- [ ] Bisa **mencabut** permintaan OPD (tombol cabut ADA untuk admin)
- [ ] Bisa mencatatkan konfirmasi OPD
- [ ] Bisa menutup insiden ("Tandai Selesai")
- [ ] Berita Acara: bisa entri sementara **dan** entri **final**
- [ ] Setelah final, dokumen terkunci sebagaimana mestinya

### 7.5 Manajemen Pengguna — `/admin/users`

- [ ] Daftar hanya memuat pengguna di yurisdiksinya
- [ ] Tampilan ponsel berupa kartu (bukan tabel terpotong)
- [ ] Tambah pengguna baru berhasil; wilayah terisi otomatis dari admin pembuatnya
- [ ] Edit & hapus pengguna berhasil
- [ ] **Ubah peran**: pilihan berisi `masyarakat, relawan, petugas, pejabat, opd` (tanpa admin/superadmin)
- [ ] Memilih peran **opd** mewajibkan memilih instansi; instansi luar wilayah ditolak
- [ ] Memilih peran **petugas** → tingkat yurisdiksi default **kabupaten** (bukan desa) — TASK_49
- [ ] Admin tidak bisa memberi yurisdiksi lebih luas dari dirinya sendiri
- [ ] Pengguna tanpa kode wilayah sampai tingkat itu ditolak

### 7.6 Manajemen Hydrant & Hydrant Warga — `/admin/hydrants`

- [ ] Dua tab (Hydrant / Hydrant Warga) tampil sebagai satu menu; sidebar menyorot menu yang sama di kedua tab
- [ ] Tambah hydrant: klik peta menaruh pin; badge **"Mendeteksi wilayah…"** muncul saat reverse-geocode
- [ ] Peringatan muncul bila pin keluar dari wilayah tugas (memperingatkan, tidak memblokir)
- [ ] Dialog **"Pakai Lokasi Saat Ini?"** muncul di form Tambah
- [ ] Chip "1. Klik Area Peta" tidak menembus dialog & header (z-index) — TASK_32
- [ ] Hydrant: kolom **Tekanan Air** (Keras/Sedang/Kecil) tersimpan
- [ ] Hydrant Warga: **Sumber Air** (Tandon/Groundtank), status **Belum/Sudah Modifikasi**, **Kapasitas (liter)**
- [ ] Hydrant Warga: dropdown **Banjar** hanya memuat banjar milik desa terpilih
- [ ] Menggeser pin ke desa lain → pilihan banjar ikut dikosongkan (tidak tersimpan lintas desa)
- [ ] Banjar tampil di daftar hydrant warga
- [ ] Edit & hapus berhasil
- [ ] Status berbunyi **"Berfungsi / Tidak Berfungsi"**

### 7.7 Manajemen SKKL — `/admin/pumps`

- [ ] Daftar memuat **pompa saja** (hydrant warga tidak ikut di menu admin ini)
- [ ] Tidak ada kolom kapasitas / chip modifikasi di daftar ini
- [ ] CRUD pompa berhasil
- [ ] Kartu **Ringkasan Air Desa** ada di menu Hydrant Warga (satuan liter)
- [ ] Ringkasan berjudul **nama desa** — tidak ada baris berjudul angka kode (TASK_37)
- [ ] Desa tak dikenal berbunyi "Desa tidak dikenal · Kec. …"

### 7.8 Manajemen Pos Pemadam / OPD / Banjar

- [ ] `/admin/fire-stations` — CRUD berhasil, pin & wilayah terisi
- [ ] `/admin/agencies` — CRUD OPD; centang "butuh konfirmasi" + labelnya tersimpan
- [ ] `/admin/agencies` — jenis kejadian default (termasuk **Kebakaran Lainnya**) bisa dicentang
- [ ] `/admin/banjars` — CRUD banjar; filter status (terverifikasi/usulan)
- [ ] Usulan banjar dari warga muncul di daftar dan bisa **diverifikasi** (status berbalik, id tetap)
- [ ] Keterangan cakupan "N dari M desa" tampil di sebelah saklar kewajiban banjar
- [ ] Saklar kewajiban banjar **ditolak server** bila master masih kosong

### 7.9 Peta Pemantauan (lihat §9.2)

- [ ] Semua item §9.2 diuji dengan akun admin

Catatan: _______________________________________________

---

## 8. SUPERADMIN

Superadmin = semua kemampuan admin **tanpa batas wilayah**, plus menu sistem.

- [ ] Dashboard memuat data **seluruh wilayah** (tidak tersaring)
- [ ] Semua item §7 diuji ulang singkat dengan akun superadmin
- [ ] Ubah peran: pilihan memuat **semua peran kecuali superadmin**

### 8.1 Pengumuman Sistem — `/admin/announcements`

- [ ] CRUD pengumuman berhasil
- [ ] Menu ini **tidak terlihat** oleh admin wilayah

### 8.2 Kontrol Akses

- [ ] `/admin/roles` — CRUD role
- [ ] `/admin/permissions` — CRUD permission
- [ ] `/admin/assign-permissions` — centang hak akses per role tersimpan
      ⚠️ **Catatan penting (#103):** centang di layar ini **tidak berefek** pada perilaku aplikasi —
      tak ada satu pun pengecekan permission Spatie di `app/` maupun `routes/`. Jangan memakai
      layar ini untuk "membatasi peran"; batas peran nyata ada di middleware `role:` & controller.
- [ ] `/admin/route-accesses` — CRUD akses route
- [ ] Keempat halaman tampil rapi di ponsel (pola kartu)

### 8.3 Sistem

- [ ] `/admin/tenants` — CRUD instansi/kabupaten; `nama_instansi` & subdomain tersimpan
- [ ] Mengubah `nama_instansi` mengubah keterangan kepemilikan hydrant di menu admin (TASK_36)
- [ ] `/admin/settings` — tiga dropdown jangkauan notifikasi (petugas / relawan / pejabat) tersimpan
- [ ] Menurunkan jangkauan petugas **tidak** ikut memutus pejabat (kunci setting terpisah)
- [ ] Saklar kewajiban banjar terlihat & berperilaku sesuai §7.8

Catatan: _______________________________________________

---

## 9. PEJABAT (PEMANTAU READ-ONLY)

### 9.1 Dashboard & daftar

- [ ] Dashboard sama bentuknya dengan admin, **tanpa** tombol kelola/Edit
- [ ] Kartu **Mode Kesiapan** ada (pejabat punya saklar siaga) — TASK_34
- [ ] Menyalakan siaga → menerima notifikasi siaran darurat di wilayahnya
- [ ] Mematikan siaga → berhenti menerima
- [ ] "Arsip & Riwayat" menampilkan daftar pemantauan (tanpa tombol Verifikasi & tanpa Export)
- [ ] Laporan **TERLAPOR** & **ditolak** tidak tampil di daftar pemantauan
- [ ] Chip **Laporan Masuk** & **Ditolak** tidak ada di daftar pemantauan — daftarnya memang
      selalu kosong bagi pemantau, jadi chipnya sengaja dibuang (TASK_48)
- [ ] Tab "Riwayat Saya" tetap memuat laporan yang ia buat sendiri

### 9.2 Peta Pemantauan — `/peta-pemantauan`

_(uji ini juga berlaku untuk petugas, admin, superadmin)_

- [ ] Saat dibuka, **hanya layer Kejadian** yang menyala
- [ ] Lima layer bisa dinyalakan: Kejadian / Hydrant / Pos Pemadam / SKKL / Relawan
- [ ] Chip status kejadian memuat **Ditolak** (abu-abu) untuk semua peran yang bisa membuka
      halaman ini — di peta chip ini memang tidak disaring per peran
- [ ] Chip **Ditolak** & **Selesai** mati secara default; menyalakan Ditolak benar-benar
      memunculkan marker kejadian yang ditolak (dulu mustahil, TASK_48)
- [ ] Legenda cocok dengan warna marker di peta
- [ ] Semua marker berbentuk lingkaran berikon (seragam)
- [ ] Marker relawan yang bertumpuk disebar melingkar (tidak menumpuk di centroid)
- [ ] Popup marker kejadian punya tombol **"Lihat Detail"** yang membuka halaman detail (TASK_44)
- [ ] Tautan di dalam popup terbaca (kontras cukup) — #98
- [ ] Data hanya memuat wilayah yurisdiksi akun

### 9.3 Detail insiden

- [ ] Bisa membuka detail insiden di wilayahnya
- [ ] Status badge & marker responder **bergerak real-time** (channel privat terotorisasi) — TASK_34
- [ ] Bisa **melihat** Berita Acara, tidak bisa mengubah
- [ ] Jejak penutup/penolak tampil
- [ ] **Tidak ada** tombol aksi apa pun (verifikasi, tolak, meluncur, selesai, OPD)
- [ ] Insiden di luar wilayahnya → 403

### 9.4 Yang tidak boleh ada

- [ ] Tidak ada menu Daftar Relawan
- [ ] Tidak ada menu `/admin/*`

Catatan: _______________________________________________

---

## 10. OPD (INSTANSI TERKAIT)

- [ ] Login → mendarat di **Dashboard OPD**
- [ ] Nama instansi tampil benar (bukan "belum ditautkan" padahal sudah tertaut)
- [ ] Daftar **permintaan bantuan** memuat insiden yang instansinya dilibatkan — lintas kelurahan mana pun
- [ ] Insiden yang **tidak** melibatkan instansinya tidak muncul
- [ ] Akun OPD tanpa instansi melihat daftar **kosong** (bukan melihat semuanya)
- [ ] Permintaan yang menuntut konfirmasi ditandai jelas
- [ ] Bisa **mengkonfirmasi** permintaan instansinya sendiri (mis. "listrik sudah dipadamkan")
- [ ] **Tidak bisa** mengkonfirmasi permintaan milik instansi lain (403)
- [ ] Konfirmasi memunculkan notifikasi ke Pusat Komando, relawan siaga, helper di TKP, & pelapor
- [ ] "Arsip & Riwayat" memuat insiden instansinya; tab "Riwayat Saya"/"Semua Laporan" **disembunyikan** (TASK_45)
- [ ] Detail insiden yang melibatkan instansinya bisa dibuka
- [ ] Tidak ada tombol verifikasi/tolak/meluncur/selesai
- [ ] Tidak ada menu Peta Pemantauan / Daftar Relawan / `/admin/*`
- [ ] Notifikasi permintaan bantuan tiba (bunyi **koordinasi**, bukan sirine)

Catatan: _______________________________________________

---

## 11. UJI NEGATIF — YANG HARUS DITOLAK

Ketik URL/aksinya langsung. Harapannya **403 atau dialihkan dengan pesan wajar**, bukan halaman kosong,
bukan galat mentah, dan **bukan berhasil**.

| # | Akun | Percobaan | Harapan | ✓ |
|---|---|---|---|:--:|
| 1 | petugas | POST verifikasi/broadcast laporan | 403 | [ ] |
| 2 | petugas | POST tolak laporan | 403 | [ ] |
| 3 | petugas | Cabut permintaan OPD | 403 | [ ] |
| 4 | petugas | Buka `/admin/reports` | 403/dialihkan | [ ] |
| 5 | petugas | Simpan Berita Acara berstatus **final** | 403 | [ ] |
| 6 | relawan | Buka `/peta-pemantauan` | 403 | [ ] |
| 7 | relawan | POST "Tandai Selesai" | 403 | [ ] |
| 8 | relawan | Meluncur ke insiden di luar wilayahnya | 403 | [ ] |
| 9 | relawan | Tandai "Tiba" tanpa pernah meluncur | 403 | [ ] |
| 10 | relawan | Koreksi titik tanpa berstatus "tiba" | 403 | [ ] |
| 11 | masyarakat | Buka detail laporan milik orang lain | 403 | [ ] |
| 12 | masyarakat | Edit laporannya sendiri yang sudah diverifikasi | 403 | [ ] |
| 13 | masyarakat | Edit/hapus laporan orang lain (ID ditebak) | 403 | [ ] |
| 14 | masyarakat | Buka `/relawan` (daftar relawan) | 403 | [ ] |
| 15 | pejabat | Aksi apa pun di detail insiden | tombol tak ada + 403 bila dipaksa | [ ] |
| 16 | pejabat | Buka insiden di luar yurisdiksinya | 403 | [ ] |
| 17 | opd | Konfirmasi permintaan instansi lain | 403 | [ ] |
| 18 | opd | Buka insiden yang tak melibatkan instansinya | 403 | [ ] |
| 19 | admin wilayah | Buka `/admin/roles`, `/admin/settings`, `/admin/tenants` | 403 | [ ] |
| 20 | admin wilayah | Buka `/admin/announcements` | 403 | [ ] |
| 21 | admin A | Kelola pengguna/fasilitas wilayah admin B | tidak terlihat / ditolak | [ ] |
| 22 | admin | Beri yurisdiksi lebih luas dari dirinya | ditolak validasi | [ ] |
| 23 | tamu | Buka `/dashboard`, `/reports`, `/peta-pemantauan` | dialihkan ke login | [ ] |
| 24 | siapa pun | Buka berkas KTP korban lewat URL langsung | ditolak | [ ] |
| 25 | siapa pun | `POST /broadcasting/auth` untuk channel bukan haknya | 403 | [ ] |

Catatan: _______________________________________________

---

## 12. REAL-TIME — BUTUH DUA JENDELA/PERANGKAT

Susun: **Jendela A** = warga pelapor, **Jendela B** = admin, **Jendela C** = petugas/relawan.

- [ ] Warga (A) mengirim laporan → **kartu misi muncul sendiri** di dashboard petugas (C) & admin (B), tanpa refresh
- [ ] Notifikasi laporan masuk berbunyi **nada triase** (bukan sirine) di B & C
- [ ] Admin (B) broadcast → notifikasi **sirine** tiba di petugas & relawan siaga sewilayah
- [ ] Halaman Terima Kasih (A) berpindah tahap **tanpa refresh**
- [ ] Detail insiden di B menampilkan status baru tanpa refresh
- [ ] Petugas (C) meluncur → marker & rutenya muncul bergerak di peta jendela A & B
- [ ] Petugas (C) menandai Tiba → daftar responder di A & B ikut berubah
- [ ] Petugas (C) mengoreksi titik → pin & **lencana asal titik** di A & B berubah tanpa muat ulang
- [ ] Konfirmasi OPD → notifikasi tiba di B, C, helper, dan pelapor (A)
- [ ] Admin (B) menutup insiden → status di A & C berubah; antrian Berita Acara muncul di C
- [ ] Laporan **ditolak**: alasan penolakan hanya sampai ke pelapor & staf — **tidak** tersiar ke seluruh wilayah
- [ ] Relawan di wilayah **lain** tidak menerima siaran apa pun dari rangkaian di atas

Catatan: _______________________________________________

---

## 13. WRAPPER (DI LUAR REPO WEB)

### 13.1 APK Android — SisupitWebView

- [ ] APK terpasang & login Google native (account picker HP) berhasil
- [ ] Notifikasi tiba saat aplikasi tertutup
- [ ] **Tiga channel suara** terpisah: triase (nada naik) / darurat (sirine) / koordinasi (nada turun)
- [ ] Sirine menembus mode senyap; nada triase & koordinasi tidak
- [ ] Notifikasi darurat berbunyi berulang sampai notifikasi ditutup (FLAG_INSISTENT, Android O+)
- [ ] Notifikasi ke **pelapor** memakai bunyi bawaan sistem (bukan sirine)
- [ ] GPS & izin lokasi bekerja di form lapor
- [ ] Unggah foto dari kamera & galeri bekerja
- [ ] Halaman landing di-redirect (WebView langsung ke spotlight/dashboard)

### 13.2 Desktop `.exe` — SisupitDesktop

- [ ] Aplikasi terpasang & login berhasil
- [ ] Notifikasi tiba lewat Reverb (bukan FCM)
- [ ] Judul notifikasi datang **dari server** (bukan tertulis mati di aplikasi)
- [ ] Suara koordinasi berbunyi tepat **5 putaran**
- [ ] Suara berhenti saat jendela utama dibuka/difokuskan, lewat tray, atau batas waktu
- [ ] Konfirmasi OPD benar-benar sampai ke layar Pusat Komando

Catatan: _______________________________________________

---

## 14. REKAP

| Blok | Total item | `[x]` | `[!]` | Diuji oleh | Tanggal |
|---|---:|---:|---:|---|---|
| §2 Lintas peran | | | | | |
| §3 Tamu | | | | | |
| §4 Masyarakat | | | | | |
| §5 Relawan | | | | | |
| §6 Petugas | | | | | |
| §7 Admin | | | | | |
| §8 Superadmin | | | | | |
| §9 Pejabat | | | | | |
| §10 OPD | | | | | |
| §11 Uji negatif | 25 | | | | |
| §12 Real-time | | | | | |
| §13 Wrapper | | | | | |

**Temuan baru yang harus masuk `prompt/docs/FINDINGS_LOG.md`:**

| # | Ringkas | Peran | Berat (P1/P2/P3) | Sudah dicatat? |
|---|---|---|---|:--:|
| | | | | [ ] |
| | | | | [ ] |
| | | | | [ ] |

---

## Lampiran — sisa verifikasi yang sudah tertunggak

Diambil dari STATUS di `CLAUDE.md`. Item di bawah adalah **verifikasi visual yang belum pernah
dilakukan** untuk task yang kodenya sudah selesai; kerjakan lebih dulu bila waktunya terbatas.

- [ ] **TASK_52** asal titik laporan — §6 file task (lencana di detail + peringatan panel verifikasi)
- [ ] **TASK_51** wewenang verifikasi admin saja — §6 file task (blok §6.2 & uji negatif #1–#3 di atas)
- [ ] **TASK_50** suara notifikasi bertingkat — belum diuji di perangkat mana pun (§13)
- [ ] **TASK_49** alamat/patokan & berita acara — §6 file task
- [ ] **TASK_48** status ditolak — §6 file task (blok §7.2 & §9.2)
- [ ] **TASK_47** tab jenis kejadian — §6 file task + **langkah pasca-deploy §7**: centang ulang
      "Kebakaran Lainnya" di `/admin/agencies` satu kali per environment (prod/staging/dev)
- [ ] **TASK_46** basemap self-host — §6 verifikasi visual
- [ ] **TASK_45** berita acara otomatis & akun OPD — §6 file task
- [ ] **TASK_44** koreksi pin & jejak penutup — §6 file task
- [ ] **TASK_43** dashboard real-time — §6 file task (butuh dua browser + Reverb hidup, lihat §12)
- [ ] **TASK_42** aksara asing deteksi lokasi — §5 file task
- [ ] **TASK_41** nomor 113 & wajah halaman info — §5 file task
- [ ] **TASK_40** master banjar — §7 file task
- [ ] **TASK_39** export excel — buka berkasnya di Excel (§6 file task)
- [ ] **TASK_37** kode desa & ringkasan SKKL — §6 file task
- [ ] **TASK_36** keterangan hidran — §5 file task
- [ ] **TASK_35** bilah bawah tamu — §6 + §8 file task
- [ ] **TASK_33** hydrant warga sumber air — §6 file task
- [ ] **TASK_32** form fasilitas & yurisdiksi — §6 file task
- [ ] **TASK_31** menu mobile lengkap — §6 + §8 file task
- [ ] **TASK_34** notifikasi pejabat — §6 file task (termasuk memastikan wrapper tak tersandung
      nilai `user_role` baru)
- [ ] **TASK_30** hydrant warga & SKKL — §6 file task
- [ ] **TASK_28** pilih lokasi manual — §6 + §ADENDUM file task

Catatan: _______________________________________________

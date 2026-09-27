# TASK_56 — Email dinas di dalam Sisupit: baca & kirim, penerima dibatasi daftar putih
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_56 |
| Severity | P2 |
| Tipe | fitur (besar, 3 slice) |
| Sumber | permintaan user 2026-09-22 |
| Status | **Slice 1 SELESAI (kode) 2026-09-22** — belum di-commit, belum dideploy. Slice 2 (kotak masuk IMAP) & slice 3 (lampiran) belum dikerjakan; lihat §9 |

> Permintaan user apa adanya: *"apakah memungkinkan file exe dari sisupit bisa membuka email
> dan whatsapp, jadi nanti akan di set komputernya hanya bisa dipakai untuk buka aplikasi
> sisupit karena perlu email dan whatsapp maka exe sisupit wajib bisa menangani itu ... dan
> email juga sama tidak semua bisa login dan tidak bisa kirim email selain email yang di
> daftarkan"*

Permintaan itu memuat TIGA hal. Atas keputusan user 2026-09-22 ia **dipecah tiga task**
(aturan emas #6 - satu task satu tujuan):

| Task | Isi | Status |
|------|-----|--------|
| **TASK_56** (ini) | Email dinas: baca & kirim dari dalam Sisupit, penerima dibatasi | **Slice 1 SELESAI** (kode) 2026-09-22, lihat §9 |
| TASK_57 | WhatsApp: tempel WhatsApp Web ke dalam `.exe` - `TASK_57_whatsapp_web_di_exe.md` | **DITUNDA** atas keputusan user 2026-09-22 |
| TASK_58 | Penguncian komputer - `TASK_58_penguncian_komputer_operator.md` | TODO, **dikerjakan paling akhir** |

**Urutan setelah WhatsApp ditunda:** TASK_56 → TASK_58. Mengunci komputer sebelum alat
penggantinya dipakai berarti mencabut alat kerja operator di ruangan yang menangani
panggilan darurat - jadi TASK_58 tetap menunggu email ini benar-benar dipakai, bukan
sekadar selesai dikoding.

---

## 0. Keputusan

### 0.1 Sudah dijawab user (2026-09-22)

| # | Pertanyaan | Jawaban user | Konsekuensi yang ikut diterima |
|---|-----------|--------------|-------------------------------|
| K1 | Cakupan | Email dulu, WA & kiosk terpisah | Selama TASK_58 belum jalan, operator masih bisa membuka Gmail lewat browser - pembatasan kirim baru berlaku penuh setelah komputernya dikunci |
| K2 | Kotak surat milik siapa | **Alamat email milik instansi itu sendiri** (Workspace yang sudah ada). **Diminta ke TIAP KOTA, satu alamat per kota, dan alamat itulah yang dipakai untuk kota itu** (dipertegas user 2026-09-22 putaran ketiga) | Sisupit **tidak punya** alamat pengirim untuk surat dinas. Selama sebuah kota belum menyerahkan alamatnya, fitur ini **mati** untuk kota itu - bukan jatuh ke alamat kota lain, bukan jatuh ke alamat sistem. Lihat §1.2 & §3.7. Dan lihat §1.1: "tidak semua bisa login" TIDAK otomatis didapat dari pilihan ini |
| K3 | Lampiran keluar | Boleh, dibatasi jenis & ukuran, **dicatat** | Tiap lampiran masuk log append-only supaya "apa yang pernah keluar" bisa dijawab |

### 0.2 Dijawab user 2026-09-22 (putaran kedua)

| # | Pertanyaan | Jawaban user | Konsekuensi yang ikut diterima |
|---|-----------|--------------|-------------------------------|
| **K4** | Penerima instansi atau perorangan? | **Penerima biasanya PEJABAT** (perorangan) | Tabel kontak **tersendiri**, bukan `agencies`. Alasan lengkap & kenapa ini BUKAN "daftar kedua" ada di §3.1 yang sudah ditulis ulang |
| **K5** | Siapa boleh mengirim? | **petugas, admin, superadmin** | Petugas bisa mengirim surat dinas atas nama instansi **dari HP di lapangan**. Diterima, tapi menuntut dua hal di §4.1: log wajib menyimpan pengirimnya, dan penerima dipilih dari daftar (petugas tak pernah mengetik alamat bebas) |
| **K6** | Satu kotak surat per kabupaten atau per operator? | **Per kabupaten** | Ini yang paling banyak mengubah rencana: kredensialnya jadi **per tenant**, sementara `MAIL_*` di `.env` bersifat global untuk seluruh aplikasi. Lihat §3.7 |
| **K7** | Nama menu & route | **"Email Dinas"** | Route `/email`, nama route `mail.*` |
| **K8** | Siapa yang memasukkan kredensial kotak surat, dan di mana? (dijawab putaran keempat) | **ADMIN kabupaten sendiri**, lewat layar pengaturan di dalam aplikasi - termasuk **nama pengirim** dan setelan lain yang diperlukan | Bukan `.env`, bukan superadmin, bukan diisikan developer ke DB. Konsekuensinya: kredensial jadi **data yang disunting pengguna**, jadi ia butuh layar, validasi, uji koneksi, dan penjaga IDOR sendiri - lihat §3.7 & §4.1. Juga menajamkan §1.1: yang dijamin bukan lagi "tak seorang pun tahu passwordnya", melainkan "**petugas** tidak tahu" |

**Catatan asumsi yang perlu dikoreksi kalau saya salah baca:** kata "pejabat" di sini saya
artikan **pejabat di luar Sisupit** (Walikota, Kepala Dinas, Camat, Lurah) yang umumnya
TIDAK punya akun Sisupit - bukan peran `pejabat` di aplikasi ini. Kalau yang kamu maksud
justru pemegang peran `pejabat`, bentuknya tetap sama: `users.email` adalah **identitas
login**, bukan alamat surat-menyurat, dan menjadikannya daftar putih berarti "siapa boleh
menerima surat dinas" ditentukan oleh "siapa punya akun". Jadi tabel kontak tetap benar;
yang berubah hanya isinya.

---

## 1. Deskripsi & tujuan

Operator Pusat Komando bisa **membaca** dan **mengirim** email dari dalam aplikasi Sisupit,
tanpa membuka aplikasi lain, dan **pengiriman hanya boleh ke alamat yang terdaftar**.

Dibangun sebagai **halaman aplikasi web**, BUKAN sebagai fitur Electron. Alasannya bukan
kerapian:

- `.exe` sudah memuat `sisupit.com`; begitu halamannya ada ia otomatis terbuka di sana -
  **nol perubahan wrapper**, nol rilis installer.
- Satu perbaikan tiba lewat `git pull` ke `.exe`, APK, **dan** browser sekaligus. Ini
  pelajaran #108 yang sudah terbukti mahal di repo ini: rilis wrapper menuntut
  `versionCode` naik, `artifactName` yang mengubah URL unduhan, dan installer tak
  bertanda tangan yang disemprit SmartScreen.
- Pembatasannya hidup di server, tempat ia tak bisa dilewati (aturan emas #7).

### 1.1 Yang TASK INI TIDAK BISA janjikan - baca sebelum menyetujui

> **"Email tidak semua bisa login" TIDAK bisa ditegakkan oleh Sisupit.**

Login ke Google Workspace dikendalikan Google Admin Console, bukan aplikasi ini. Yang
menentukan bukan providernya melainkan **siapa yang memegang password**:

- Kalau **operator memegang** password kotak surat itu - ia tetap bisa login dari HP,
  warnet, atau laptop lain, dan mengirim ke siapa pun. Daftar putih di Sisupit jadi
  pembatasan yang hanya berlaku saat ia kebetulan lewat Sisupit. **Itu bukan pembatasan.**
- Kalau password hanya dipegang **admin** (yang memasukkannya sekali lewat layar
  pengaturan, K8) dan server - sementara **petugas tak pernah tahu** - maka bagi petugas
  Sisupit adalah satu-satunya jalan ke kotak surat itu.

**Syarat mutlak task ini: password kotak surat dinas TIDAK dibagikan ke petugas.** Kalau
tidak disetujui, bagian "tidak semua bisa login" gugur dan harus diakui apa adanya - jangan
ditambal dengan menyembunyikan tombol di layar. Layar yang mengaku membatasi padahal tidak
adalah bentuk kegagalan yang berulang kali tercatat di repo ini (#94, #90).

**Yang berubah sejak K8, dan harus dikatakan apa adanya:** karena admin sendiri yang
mengetikkan kredensialnya, **admin tetap bisa membuka kotak surat itu dari luar Sisupit**
(HP, browser mana pun). Jadi jaminannya **berlapis peran, bukan mutlak**: daftar putih
penerima mengikat petugas sepenuhnya, dan mengikat admin hanya selama ia lewat Sisupit.
Itu harga yang melekat pada "admin yang login", bukan kelalaian implementasi - kalau
instansi menghendaki lebih ketat, kredensialnya harus dipegang pihak yang bukan pemakai
harian, dan K8 harus ditinjau ulang.

Tambahan pendamping yang perlu diminta ke admin Workspace: aktifkan 2SV, dan batasi akses
per perangkat/IP di Admin Console kalau tersedia.

### 1.2 DUA jalur email yang tidak boleh tercampur

Aplikasi ini **sudah** mengirim email hari ini - verifikasi pendaftaran & reset password
bawaan Laravel (`User implements MustVerifyEmail`). Begitu surat dinas masuk, ada dua jalur
yang wajib dipisahkan, dan memisahkannya bukan kerapian:

| | **Email SISTEM** | **Email DINAS** (task ini) |
|---|---|---|
| Isinya | verifikasi pendaftaran, reset password | surat ke pejabat |
| Atas nama | Sisupit (penyedia aplikasi) | **Damkar kota yang bersangkutan** |
| Alamat pengirim | satu, global, dari `.env` | **satu per kota**, diserahkan kota itu |
| Penerimanya | warga mana pun yang mendaftar | hanya yang ada di `mail_contacts` |
| Berubah di task ini? | **TIDAK** | ya, ini yang dibangun |

**Aturan yang mengikat:**

1. Surat dinas **tidak boleh** dikirim lewat mailer bawaan `config/mail.php`. Kalau ini
   bocor, surat resmi Damkar Denpasar terkirim dari alamat sistem Sisupit - penerimanya
   pejabat, dan alamat pengirim yang keliru di surat resmi bukan cacat kosmetik.
2. Email sistem **tidak boleh** dikirim lewat kotak surat kota. Kalau ini bocor, warga
   yang baru mendaftar menerima email verifikasi dari alamat dinas Damkar, dan balasannya
   mendarat di kotak surat yang dipantau operator.
3. **Tak ada jatuh-cadangan antar keduanya.** Kota yang belum menyerahkan alamatnya =
   fitur mati untuk kota itu (§3.7), bukan diam-diam memakai alamat sistem atau alamat
   kota lain. Cadangan yang menunjuk pengirim lain adalah bentuk #92 sekali lagi: yang
   "sementara" akan bertahan, dan tak ada satu pun galat yang memberi tahu.

### 1.3 Yang disiapkan tiap kota sebelum admin-nya menyetel

Sejak K8, daftar ini **bukan lagi serah-terima ke developer** - admin kabupaten sendiri
yang mengisikannya di layar pengaturan (§4.1). Jadi ini daftar persiapan, dan tempatnya di
panduan pengguna, bukan di runbook deploy:

- [ ] Alamat email dinas yang akan dipakai (mis. `damkar@denpasarkota.go.id`)
- [ ] Kredensial yang bisa dipakai server: **App Password** (butuh 2SV aktif) atau
      persetujuan memakai SMTP relay Workspace - lihat §3.3
- [ ] Host & port SMTP (kirim) dan IMAP (baca, slice 2)
- [ ] Nama pengirim yang dikehendaki (mis. "Damkar Kota Denpasar")
- [ ] **Kesepakatan §1.1**: password tidak dibagikan ke petugas

Konsekuensi baik dari K8: **kabupaten baru tidak lagi menunggu developer.** Konsekuensi
buruknya: admin bisa salah ketik host/port dan tak ada yang tahu sampai surat pertama
gagal - itulah kenapa tombol **Uji Koneksi** di §4.1 bukan pemanis.

---

## 2. Keadaan awal (bukti, bukan dugaan)

Diperiksa 2026-09-22:

| Yang diperiksa | Hasil |
|----------------|-------|
| Halaman email di aplikasi | **Tidak ada** |
| `Mail::` / Mailable buatan sendiri di `app/` | **NOL** (`grep -rln "Mail::\|Mailable" app/` kosong) |
| Email yang benar-benar terkirim hari ini | Hanya bawaan framework - `User implements MustVerifyEmail` (verifikasi pendaftaran) + reset password Breeze |
| `MAIL_*` di `.env` lokal | `smtp` ke **sandbox Mailtrap** (`sandbox.smtp.mailtrap.io`) |
| Paket IMAP / Google API di `composer.json` | **Tidak ada** |
| Kolom kontak di `agencies` | **`contact_person`, `phone`, `email`, `is_active` SUDAH ADA** sejak TASK_27, ter-`Tenantable` per kabupaten |
| `Tenant::FEATURES` | Baru berisi satu: `FEATURE_FORUM` |
| Rate limiter terdaftar | Tiga: `report-create`, `forum-thread`, `forum-reply` |

Artinya: kerangka kirim-email Laravel memang hidup, tapi **belum pernah dipakai untuk
kiriman buatan sendiri**, dan kredensial produksinya belum pernah diuji untuk itu.
Langkah pertama task ini karena itu membuktikan SMTP-nya bekerja, sebelum menulis layar.

---

## 3. Temuan investigasi yang membatasi bentuk solusi

### 3.1 Daftar penerima SUDAH ADA sebagian - jangan bikin daftar kedua

`agencies` adalah master instansi per kabupaten, ter-`Tenantable`, dikelola admin di
`/admin/agencies`, dan **sudah punya kolom `email` + `is_active`**. Itu persis "daftar
alamat yang didaftarkan" yang diminta user.

Membuat tabel `mail_contacts` baru di sampingnya = daftar kedua untuk konsep yang sama,
dan repo ini sudah membayar harga pola itu dua kali: sembilan menu hilang di ponsel selama
enam hari (#71/#53) dan peran hantu `warga` hidup bertahun-tahun (#110). Keduanya **tanpa
satu pun gejala**.

**TAPI** ada blast radius yang membatasinya, dan ini yang membuat K4 harus dijawab dulu:
baris `agencies` **muncul di panel verifikasi laporan** (pilihan OPD + auto-centang lewat
`Agency::recommendedIdsFor()`). Menambahkan "Pak Camat" ke sana supaya bisa dikirimi email
akan membuat namanya muncul sebagai instansi yang bisa dimintai bantuan saat kebakaran.

Aturan penyaring (mengikuti PENGECUALIAN #1): *apakah kedua sisi akan berkembang ke arah
yang berbeda, atau cuma berbeda isi?*

**Keputusan (K4 = penerima biasanya pejabat, perorangan): tabel `mail_contacts`
tersendiri.** Dan setelah penyaring di atas dipakai sungguh-sungguh, **ini BUKAN
pengecualian aturan** - jadi tidak ada entri baru di `PENGECUALIAN_ATURAN.md`:

| | `agencies` | `mail_contacts` |
|---|---|---|
| Yang didata | **Organisasi** | **Orang** (nama + jabatan) |
| Menjawab pertanyaan | "instansi mana yang dilibatkan menangani insiden ini?" | "siapa yang boleh dikirimi surat dinas?" |
| Kolom khasnya | `default_incident_types`, `requires_confirmation`, `confirmation_label` | jabatan, instansi asal (teks) |
| Punya akun | ya, peran `opd` + `users.agency_id` | tidak |
| Dipakai di | panel verifikasi, pivot `report_agencies`, dashboard OPD | hanya gerbang kirim email |

Keduanya berkembang ke arah yang berbeda, bukan sekadar berbeda isi - persis kriteria yang
membuat PENGECUALIAN #1 sah dan sekaligus yang membuat "banjar usulan vs terverifikasi"
DITOLAK jadi tabel terpisah (itu konsep sama, tingkat keyakinan beda). Memaksa pejabat
masuk `agencies` justru yang merusak: namanya akan muncul sebagai instansi yang bisa
dimintai bantuan saat kebakaran, lewat `Agency::recommendedIdsFor()`.

**Dua aturan turunan yang mengikat:**

1. **Gerbang kirim membaca TEPAT SATU tabel: `mail_contacts`.** `agencies.email` tetap
   hidup sebagai *detail kontak* instansi (untuk dilihat manusia), **bukan** izin kirim.
   Dua sumber untuk satu gerbang berarti dua cara mencabut izin dan dua tempat yang bisa
   menyimpang - persis bentuk kegagalan yang dijaga §3.2.
2. Supaya alamat tak perlu diketik dua kali, sediakan aksi **"tarik dari master OPD"** di
   layar kelola kontak: ia **menyalin** baris `agencies` yang ber-email jadi baris
   `mail_contacts`. Tindakan yang terlihat dan tercatat, bukan sumber kedua yang bekerja
   diam-diam di belakang gerbang.

### 3.2 Gerbangnya wajib menutup BALAS dan TERUSKAN, bukan cuma "tulis baru"

Ini lubang yang paling sering kelupaan. Bentuknya harus **daftar putih** (`whereIn`),
bukan daftar hitam - persis aturan yang sudah tertulis di `CONVENTIONS.md` untuk status
laporan: penyaring daftar hitam selalu ketinggalan saat ada anggota baru, tanpa galat.

Karena itu ketiganya (tulis baru / balas / teruskan) **wajib lewat satu Form Request yang
sama**. Jangan menyalin aturannya ke tiga tempat.

### 3.3 Google Workspace tidak menerima password biasa

Harus dibuktikan di lapangan, jangan diasumsikan. Tiga kemungkinan jalur, urut dari yang
paling mungkin dipakai:

1. **App Password** - hanya tersedia untuk akun ber-2SV. Paling sederhana: transport SMTP
   biasa, jadi mailer runtime per tenant (§3.7) cukup diisi host/port/user/password.
2. **SMTP relay Workspace** (`smtp-relay.gmail.com`) - otentikasi per IP, cocok untuk
   server tetap.
3. **OAuth2 / XOAUTH2** - paling tahan lama, tapi menuntut transport kustom + proyek
   Google Cloud. Ambil ini hanya kalau dua di atas ditolak kebijakan instansi.

Dua jebakan yang harus dicek saat verifikasi:
- Alamat pengirim sebuah kota **wajib sama** dengan akun yang dipakai kota itu, kalau
  tidak Gmail menulis ulang header `From` dan pejabat penerima melihat alamat lain dari
  yang tertulis di layar Sisupit. Ini dicek **per tenant**, bukan sekali di `.env` - kota
  yang salah isi hanya merusak suratnya sendiri, dan itu justru harus ketahuan saat
  kredensialnya disimpan, bukan saat surat pertama terkirim.
- Membaca kotak masuk butuh **IMAP**, dan tak ada satu pun paket IMAP di `composer.json`.
  `MASTER_PROMPT.md` melarang menambah dependensi kecuali task memintanya - **task ini
  memintanya secara eksplisit**, dan itu hanya berlaku untuk slice 2.

### 3.4 Notifikasi apa pun dari fitur ini = `via() ['database']` SAJA

Aturan `CONVENTIONS.md` (lahir dari TASK_54/TASK_50): wrapper Android memilih channel suara
dari payload FCM dan **payload tak dikenal tetap jatuh ke sirine**; `.exe` yang mendengar
Reverb berlaku sama. Menambahkan `FcmChannel` atau `'broadcast'` ke notifikasi "email baru
masuk" = **ponsel warga dan layar Pusat Komando bersirine karena ada email**.

### 3.5 Menyala per kabupaten, meniru Forum

Tidak semua Damkar punya kotak surat dinas. Pola yang sudah ada dan wajib ditiru:
`Tenant::FEATURES` + checkbox di `/admin/tenants`, dibaca dari `city_code` **akun** (bukan
subdomain), mati = route **404** + menu absen. Patokan: `ForumThread::enabledFor()`.

### 3.6 `.exe` dan APK nol perubahan

Satu-satunya hal yang mungkin perlu disentuh di `.exe` nanti ada di **TASK_58**, bukan di
sini: hari ini semua tautan keluar dilempar ke browser sistem, dan di komputer terkunci itu
justru membuka pintu yang mau ditutup. Satu baris kebijakan, bukan fitur.

### 3.7 Satu kotak surat PER KABUPATEN tidak muat di `.env` (konsekuensi K6)

Ini bagian yang paling banyak berubah setelah K6 dijawab, dan gampang terlewat karena di
lapangan hari ini baru ada satu kabupaten yang hidup.

Ini mekanisme dari aturan §1.2. `MAIL_*` di `.env` bersifat **global untuk seluruh
aplikasi** - satu proses Laravel melayani semua kabupaten lewat subdomain
(`ResolveTenant`), dan `.env` itu tetap milik **email sistem**. Jadi "satu kotak surat per
kota" **tidak bisa** diselesaikan dengan mengisi `MAIL_*`: begitu kota kedua bergabung,
seluruh suratnya akan terkirim dari kotak surat Denpasar, **tanpa satu pun galat** -
penerima hanya melihat pengirim yang keliru.

Godaan yang harus ditolak: *"isi `.env` dulu saja, nanti kalau ada kabupaten kedua baru
dibikin per tenant."* Repo ini sudah membayar harga pola itu di #92 - cadangan basemap yang
menunjuk CARTO dipakai sebagai "sementara", lalu ia **menjadi** konfigurasi produksi
sesungguhnya sampai pihak ketiga mengubah kebijakannya dan seluruh peta di tiga environment
tercoret sekaligus. Nilai sementara yang tak pernah diganti adalah konfigurasi produksi.

**Bentuk yang benar:** kredensial disimpan **per tenant**.

- Kolom baru di `tenants`: alamat kotak surat, **nama pengirim**, host/port SMTP & IMAP,
  username, password (cast `encrypted` Laravel), dan `reply_to` opsional.
- **DUA TINGKAT WEWENANG (K8), jangan digabung jadi satu layar:**
  - **superadmin** membuka/menutup fitur per kabupaten (`tenants.features`, §3.5) - ini
    keputusan lisensi/penyediaan, pola yang sudah ada di Forum;
  - **admin kabupaten** mengisi kredensial & nama pengirim **kotak suratnya sendiri**,
    lewat layar terpisah `/admin/email` (§4.1).
  Menaruh kredensial di `/admin/tenants` akan memaksa membuka halaman itu untuk admin,
  padahal di sana ada setelan tenant lain (subdomain, edition, pejabat) yang memang milik
  superadmin. Satu layar untuk dua tingkat wewenang = gerbang yang kelewat longgar demi
  kerapian.
- **Tenant yang disunting ditentukan `city_code` AKUN, tak pernah dari request.** Ini
  bukan kehati-hatian berlebihan: repo ini punya riwayat nyata endpoint yang menerima
  model dari route-binding tanpa authorize (#1, P0), dan di sini taruhannya kredensial
  kotak surat kabupaten lain. Pola yang ditiru: `ForumThread::enabledFor()` yang juga
  membaca `city_code` akun, bukan subdomain maupun parameter.
- Pengiriman memakai **mailer yang dirakit saat runtime** dari kredensial tenant pengirim,
  bukan mailer bawaan `config/mail.php`.
- **Kredensial tidak boleh pernah ikut prop Inertia.** Layar cukup tahu alamat kotak
  suratnya (untuk ditampilkan sebagai "dikirim dari"), tak pernah passwordnya. Ingat
  `DashboardController` yang mengirim kolom PII mentah ke layar (#2) - bentuk kesalahan
  yang sama, taruhan lebih tinggi.
- Tenant tanpa kredensial = fitur mati untuknya, sama seperti saklar `features` (§3.5).
  Layar kirim yang muncul tapi selalu gagal terbaca sebagai bug (pelajaran TASK_45/#94).

---

## 4. Rencana fix - TIGA SLICE

Kerjakan berurutan. **Slice 1 adalah satu-satunya bagian yang menjawab permintaan inti
user** ("tidak bisa kirim email selain email yang didaftarkan"); slice 2 & 3 adalah
kenyamanan yang membuat komputer terkunci layak dipakai.

### 4.1 Slice 1 - KIRIM + daftar putih + jejak

**Data** - DUA migrasi aditif, tak ada kolom lama yang disentuh
- `mail_contacts` (K4, §3.1): `name`, `jabatan`, `instansi` (teks bebas), `email`,
  `is_active`, `notes`, + empat kolom wilayah. `Tenantable` + `SoftDeletes` + `$guarded=[]`,
  pola `Agency`. SoftDeletes wajib: log lama menunjuk ke kontak yang bisa dinonaktifkan.
- `mail_messages` - log **append-only** (pola `TrackingLog`, tanpa update/delete):
  `user_id` (**pengirimnya, wajib** - konsekuensi K5), `to`/`cc` (json, alamat DISALIN
  sebagai snapshot, pola `report_agencies.agency_name`), `subject`, `body`,
  `attachment_meta` (json: nama, ukuran, mime, hash), `report_id` nullable, `status`,
  `error`, `sent_at`, + empat kolom wilayah.
- `tenants`: kolom kredensial kotak surat + password ber-cast `encrypted` (§3.7).
- **Tanpa migrasi** untuk saklar fitur: `tenants.features` sudah json - cukup tambah
  `Tenant::FEATURE_MAIL` ke daftar putih `Tenant::FEATURES`.

**Server**
- `app/Models/MailContact.php` & `MailMessage.php` - `Tenantable` + `$guarded = []`.
- `app/Mail/DinasMail.php` - **Mailable pertama di repo**, jadi bentuknya akan jadi
  patokan; catat di `CONVENTIONS.md`.
- `app/Http/Requests/MailSendRequest.php` - **satu-satunya** tempat aturan penerima. Tiap
  alamat di `to`/`cc` diadu dengan `mail_contacts` yang `is_active` & ter-`Tenantable`;
  satu saja tak cocok = seluruh kiriman ditolak. Dipakai **tulis baru, balas, DAN
  teruskan** (§3.2).
- `app/Http/Controllers/Front/MailController.php` - gerbang fitur di controller (404 bila
  `Tenant::FEATURE_MAIL` mati **atau** tenant belum punya kredensial, §3.7), role check
  **`petugas|admin|superadmin`** (K5).
- `app/Http/Controllers/Admin/MailContactController.php` - CRUD kontak + aksi "tarik dari
  master OPD" (§3.1 aturan 2). Gerbang `admin|superadmin` - **petugas boleh mengirim,
  tidak boleh mengubah daftar penerimanya.** Itu pembeda yang membuat K5 aman.
- `app/Http/Controllers/Admin/MailSettingController.php` **(K8)** - layar `/admin/email`,
  gerbang `admin|superadmin`, menyunting **hanya** tenant milik `city_code` akun (§3.7).
  Isian: alamat kotak surat, **nama pengirim**, host/port SMTP & IMAP, username, password,
  `reply_to` opsional, tanda tangan/kop default.
  Tiga aturan yang mengikat di layar ini:
  1. **Password tak pernah dikirim balik ke layar.** Tampilkan keadaan ("tersimpan" /
     "belum diisi"), dan simpan nilai baru hanya bila kolomnya diisi - kolom kosong berarti
     "jangan ubah", bukan "kosongkan". Mengirimnya sebagai prop Inertia = password ada di
     sumber halaman (bentuk #2, taruhan lebih tinggi).
  2. **Tombol "Uji Koneksi"** yang benar-benar menyambung SMTP dengan kredensial yang
     diisi, lalu melaporkan hasilnya. Tanpa ini, salah ketik host/port baru ketahuan saat
     surat resmi pertama gagal terkirim - kegagalan yang menimpa orang lain, bukan yang
     mengetiknya.
  3. **Alamat pengirim dikunci ke akun, yang bisa diatur hanya NAMA-nya.** Gmail menulis
     ulang `From` yang tak cocok dengan akunnya (§3.3), jadi mengizinkan admin mengetik
     alamat pengirim bebas akan menghasilkan surat yang tampil berbeda dari yang tertulis
     di layar. Nama pengirim bebas; alamatnya tidak.
- `routes/web.php` - `/email` + `throttle:mail-send`; `/admin/email` (K8); limiter baru di
  `AppServiceProvider::boot()` mengikuti pola tiga limiter yang sudah ada.

**Layar**
- `resources/js/Pages/Mail/*` - `AppLayout`, `useForm()`, `<InputError>`, pola toast
  `flashMessage` + `toast[type]`, `AlertDialog` untuk aksi destruktif. **Wajib panggil
  skill `sisupit-ui` saat mengerjakannya.**
- Penerima dipilih dari **daftar**, bukan diketik bebas - kotak isian bebas yang lalu
  ditolak server adalah bentuk #105 (layar menjanjikan lebih longgar daripada server).
- Tombol digerbangi **prop server** (`canSendMail`), bukan daftar peran di JSX.
- Menu ditambahkan di `Layouts/Partials/navItems.js` - **satu-satunya daftar menu**; ia
  otomatis mendarat di popover "Menu" bilah bawah.

### 4.2 Slice 2 - KOTAK MASUK (IMAP)

- Dependensi baru (mis. `webklex/laravel-imap`) - **ini mengubah `composer.lock`, jadi
  deploy slice ini WAJIB `composer install`**, berbeda dari deploy-deploy terakhir yang
  cukup `git pull` (lihat §5).
- Isi email **tidak disalin ke database** - ditarik saat halaman dibuka + cache pendek.
  Menyalin isi email dinas ke DB Sisupit adalah keputusan retensi data tersendiri.
- Lampiran masuk dialirkan lewat route bergerbang, **pola `reports.resolution.ktp`** (disk
  privat + gerbang peran/yurisdiksi), bukan disimpan ke disk `public`.
- Tombol Balas memanggil `MailSendRequest` yang sama (§3.2).

### 4.3 Slice 3 - LAMPIRAN KELUAR (K3)

- Daftar putih jenis berkas + batas ukuran, keduanya sebagai **DATA** (config), bukan
  cabang `if` bernama ekstensi.
- Disimpan sementara di disk privat (`local`), bukan `public`.
- Nama, ukuran, mime & hash masuk `mail_messages.attachment_meta`.

### 4.4 Dokumen

- `ARCHITECTURE_MAP.md` - modul baru + route baru.
- `CONVENTIONS.md` - Mailable pertama, aturan "penerima = daftar putih, satu Form Request
  untuk kirim/balas/teruskan", dan aturan `via() ['database']` yang sudah ada dirujuk.
- `PENGECUALIAN_ATURAN.md` - **tidak perlu entri baru.** `mail_contacts` bukan daftar
  kedua atas konsep yang sama; alasannya sudah ditulis di §3.1 dan itulah tempatnya.
- `FINDINGS_LOG.md` - temuan baru yang ditemukan sambil jalan (nomor berikutnya: **#129**).

---

## 5. Blast radius

| Area | Efek |
|------|------|
| `agencies` | **Tidak tersentuh.** Kontak email hidup di tabelnya sendiri (§3.1); `agencies.email` tetap jadi detail kontak, bukan izin kirim. Aksi "tarik dari master OPD" hanya MEMBACA tabel itu |
| `Tenantable` | Kontak & log tersaring per kabupaten otomatis. **Superadmin bypass total** - justru dia yang harus diuji: pastikan ia tak bisa mengirim memakai kotak surat kabupaten lain tanpa sadar |
| **Kredensial per tenant** | Bukan lagi sekadar `.env` (§3.7). Ada rahasia baru **di dalam database**: `mysqldump` pra-deploy yang selama ini rutin diambil kini ikut memuat password kotak surat - simpan cadangannya dengan perlakuan yang sesuai, jangan ditaruh sembarangan di `/root` seperti cadangan biasa |
| **Deploy** | `git pull` + **migrasi**. Pengisian kredensial **bukan lagi langkah deploy** sejak K8 - admin tiap kabupaten mengerjakannya sendiri di `/admin/email` sesudah kode naik. Ini menyederhanakan deploy (satu hal yang harus diingat operator, bukan dua) tapi memindahkan kemungkinan salah ke orang yang tak punya akses log - lihat tombol Uji Koneksi §4.1 |
| **Permukaan admin melebar (K8)** | Admin kabupaten kini bisa mengubah konfigurasi yang sebelumnya milik superadmin/`.env`. Itu memang yang diminta, tapi artinya `/admin/email` harus dijaga seketat halaman data: gerbang peran, lingkup `city_code` akun, dan **tak ada** kredensial yang kembali ke layar |
| **Petugas sebagai pengirim (K5)** | Surat dinas yang keluar adalah pernyataan institusi. Petugas kini bisa menerbitkannya dari HP di lapangan. Peredamnya ada tiga dan ketiganya wajib: penerima dipilih dari daftar (bukan diketik), daftar itu hanya bisa diubah admin, dan tiap kiriman menyimpan `user_id` pengirimnya |
| `composer.lock` (slice 2) | Berubah → `composer install` WAJIB saat deploy. Periksa `git diff --stat ... -- composer.lock` sebelum memutuskan |
| Rate limiter | Bertambah satu (`mail-send`), total empat |
| Push/sirine | **Nol** - lihat §3.4. Kalau ada satu saja notifikasi baru ber-`broadcast`/FCM, itu bug |
| `.exe` / APK | **Nol perubahan** |
| Privasi | Email dinas bisa memuat data warga. Log menyimpan subject & body - putuskan retensinya bersama `config/legal.php` |

---

## 6. Rencana verifikasi

- [ ] Baseline `php artisan test` sebelum menyentuh apa pun → **baseline 2026-09-14:
      472 passed, 1930 assertions**. (Gotcha: `php` di dalam `bash script.sh` adalah PHP
      tanpa SQLite - alias `php.bat` hanya ada di shell interaktif, hasilnya merah palsu.)
- [ ] **Buktikan SMTP bekerja lebih dulu**, di **staging**, sebelum satu layar pun ditulis.
      Tanpa ini seluruh slice 1 dibangun di atas asumsi.
- [ ] `tests/Feature/Sisupit/MailAllowlistTest.php` BARU. Tiap penjaga **dibuktikan MERAH
      lewat sabotase** sebelum dinyatakan menjaga (berkas dipulihkan byte-exact, md5
      dicocokkan). Yang wajib ada:
  - [ ] kirim ke alamat di luar daftar → ditolak, dan `Mail::fake()` membuktikan **nol**
        email terkirim
  - [ ] **balas** dan **teruskan** lewat gerbang yang sama (satu test, supaya tak bisa
        "dirapikan" jadi tiga jalur yang menyimpang)
  - [ ] daftar penerima ter-`Tenantable`: admin kabupaten A tak bisa mengirim ke kontak
        kabupaten B
  - [ ] kontak `is_active = false` tidak bisa dikirimi
  - [ ] **petugas BOLEH mengirim tapi TIDAK boleh mengubah daftar kontak** - satu test
        untuk kedua sisinya, supaya asimetri K5 tak bisa "diseragamkan" tanpa ada yang
        merah (pola test asimetri `notifyAgencies` vs `removeAgency` di TASK_51)
  - [ ] warga/relawan/opd → 403
  - [ ] fitur mati di `tenants.features` → **404** + menu absen
  - [ ] **tenant tanpa kredensial kotak surat → 404 juga**, bukan layar kirim yang selalu
        gagal (§3.7)
  - [ ] **password kotak surat tidak pernah muncul di prop Inertia** mana pun - assertion
        atas respons halaman, bukan atas kode. Ini penjaga yang paling gampang dikira
        berlebihan dan paling mahal kalau jebol (#2)
  - [ ] email terkirim memakai kredensial **tenant pengirim**, bukan mailer bawaan -
        dibuktikan dengan dua tenant berbeda kotak surat
  - [ ] **kedua jalur §1.2 tidak tercampur, diuji DUA ARAH dalam satu test**: surat dinas
        tak pernah lewat mailer bawaan, DAN email verifikasi pendaftaran tak pernah lewat
        kotak surat kota. Satu arah saja tidak cukup - yang bocor bisa yang mana pun, dan
        keduanya senyap
  - [ ] kota yang **belum** menyerahkan alamatnya tidak jatuh ke kotak surat kota lain
        maupun ke alamat sistem (§1.2 aturan 3)
  - [ ] **admin kabupaten A tidak bisa menyunting kotak surat kabupaten B** meski id
        tenant-nya dikirim tangan lewat request (K8/§3.7) - ini penjaga IDOR, dan repo ini
        punya riwayatnya (#1, P0)
  - [ ] **petugas** tidak bisa membuka `/admin/email` (ia boleh mengirim, bukan menyetel)
  - [ ] menyimpan pengaturan dengan **kolom password dikosongkan** tidak menghapus password
        yang sudah tersimpan - kosong berarti "jangan ubah" (§4.1 aturan 1). Ini gampang
        terbalik, dan terbaliknya senyap: fitur baru mati pada kiriman berikutnya
  - [ ] **alamat** pengirim tidak bisa diubah admin, **nama**-nya bisa (§4.1 aturan 3)
  - [ ] tiap kiriman berhasil meninggalkan satu baris `mail_messages`
  - [ ] notifikasi fitur ini (bila ada) `via()`-nya **database saja** - penjaga gaya
        `NotificationSoundStageTest`
  - [ ] lampiran di luar jenis/ukuran ditolak (slice 3)
- [ ] Test sesudah hijau, **tidak kurang dari baseline**
- [ ] `vendor/bin/pint` PASS, `npm run format`, `npm run build` lulus (client + SSR)
- [ ] Verifikasi manual: kirim ke alamat terdaftar (sampai), ke alamat asing (ditolak dengan
      pesan yang **terlihat** - ingat #122, pesan galat bisa tertutup header sticky di
      ponsel), balas dari kotak masuk, cek header `From` di email yang sungguh diterima
- [ ] Verifikasi di `.exe`: halaman terbuka **tanpa** installer baru

---

## 7. Rollback

- Kode: commit fokus per slice → `git revert`.
- Migrasi **aditif** (tabel baru saja, tak ada kolom yang di-drop): rollback aman, dan
  sebelum `migrate` di VPS tetap ambil `mysqldump` ketiga DB seperti deploy-deploy
  sebelumnya.
- **`.env` tidak disentuh sama sekali** - `MAIL_*` tetap milik email sistem (§1.2), dan
  kredensial dinas hidup di baris `tenants`. Jadi tak ada langkah `.env.bak-*` seperti
  TASK_24; sebagai gantinya, mengosongkan kolom kredensial satu tenant langsung
  mematikan fitur untuk kota itu saja.
- Saklar fitur per tenant bisa dimatikan tanpa deploy - itu jaring pengaman tercepat.

---

## Acceptance criteria

- [ ] Operator bisa membaca & mengirim email dari dalam Sisupit, di browser **dan** di `.exe`
- [ ] Kiriman ke alamat di luar daftar ditolak **di server**, termasuk lewat balas & teruskan
- [ ] Tiap kiriman berjejak (siapa, kapan, ke siapa, lampiran apa)
- [ ] Fitur bisa dinyalakan/dimatikan per kabupaten, dan tiap kabupaten mengirim dari
      **kotak suratnya sendiri** (bukan kotak surat Denpasar untuk semua)
- [ ] Petugas bisa mengirim, tapi **tidak** bisa menambah penerima baru
- [ ] **Email sistem (verifikasi pendaftaran & reset password) tidak berubah sedikit pun**
      dan tidak pernah terkirim dari kotak surat kota (§1.2)
- [ ] Daftar §1.3 sudah terisi untuk tiap kota yang fiturnya dinyalakan
- [ ] **Admin kabupaten bisa menyetel kotak suratnya sendiri** - alamat, nama pengirim,
      host/port - **tanpa bantuan developer**, dan **Uji Koneksi** memberi tahu saat salah
      sebelum ada surat yang gagal (K8)
- [ ] Tidak ada satu pun notifikasi baru yang bersirine
- [ ] `.exe` & APK tidak perlu dirilis ulang
- [ ] Test ≥ baseline 472 passed; Pint & build lulus
- [ ] Dokumen §4.4 diperbarui
- [ ] **§1.1 sudah disampaikan ke user dan disetujui** - kalau password kotak surat tetap
      dipegang operator, bagian "tidak semua bisa login" dinyatakan GUGUR, bukan ditambal

---

## 8. TASK_57 & TASK_58

Keduanya **sudah ditulis** (2026-09-22):

- `prompt/tasks/TASK_57_whatsapp_web_di_exe.md`
- `prompt/tasks/TASK_58_penguncian_komputer_operator.md`

Catatan pengikat yang dulu menumpang di sini sudah **dipindah** ke masing-masing berkas,
**bukan disalin**. Kalau ia hidup di dua tempat, dua salinan itu akan menyimpang dan yang
menyimpang tidak pernah bergalat - sebab yang sama melahirkan #71, #110, dan #82 di repo
ini. Jangan tulis ulang isinya di sini; rujuk berkasnya.

Satu hal dari TASK_57 yang perlu diketahui **saat membaca TASK_56 saja**: alat kerja
pengganti harus sudah dipakai sebelum komputer dikunci, dan itulah kenapa urutan di tabel
paling atas mengikat.

---

## 9. HASIL — Slice 1 (2026-09-22)

**SELESAI (kode). Belum di-commit, belum dideploy.** Slice 2 (kotak masuk IMAP) & slice 3
(lampiran) sengaja belum dikerjakan: slice 2 menuntut dependensi baru yang mengubah
`composer.lock` dan karenanya mengubah cara deploy — itu keputusan tersendiri.

### 9.1 Yang berdiri

| Lapis | Isi |
|-------|-----|
| Data | 3 migrasi aditif: `mail_contacts`, `mail_messages` (append-only), kolom kotak surat di `tenants`. **DONE di DB dev LOKAL, 0 pending.** Belum di prod/staging/dev VPS |
| Server | `MailContact`, `MailMessage`, `DinasMail` (+ view `mail/dinas.blade.php`), `MailSendRequest`, `Front\MailController`, `Admin\MailContactController`, `Admin\MailSettingController`, limiter `mail-send`, 6 route, `Tenant` (FEATURE_MAIL + `hasMailbox`/`mailerName`/`mailerConfig`/`mailboxFor`), `UserSingleResource.mail_enabled` |
| Layar | `Pages/Mail/{Index,Create}.jsx`, `Pages/Admin/MailContacts/{Index,Create,Edit}.jsx`, `Pages/Admin/Mail/Settings.jsx`, + 3 entri di `navItems.js` |
| Penjaga | `tests/Feature/Sisupit/MailAllowlistTest.php` — 13 test |

### 9.2 Verifikasi

- Test **472 → 485 passed (1930 → 1986 assertions)**, 367 dtk. Baseline diambil LEBIH DULU
  dan cocok persis dengan angka di `CLAUDE.md`.
- **ENAM sabotase dibuktikan MERAH**, ketiga berkas dipulihkan byte-exact (md5 dicocokkan):
  gerbang daftar putih dilumpuhkan → 3 gagal; password ikut dikirim ke layar → 4 gagal;
  password kosong menghapus yang tersimpan → 1 gagal; alamat pengirim tak dikunci ke akun →
  1 gagal; surat dinas lewat mailer bawaan → 2 gagal; gerbang 404 dicabut → 1 gagal.
- **PELAJARAN SABOTASE yang layak diingat:** dua sabotase pertama tampak "gagal memerahkan"
  padahal **tidak pernah terpasang** — `\Q...\E` di perl TETAP menginterpolasi `$takDikenal`
  / `$validated` jadi string kosong, sehingga polanya tak pernah cocok. Sabotase yang gagal
  terpasang tampak **persis** seperti penjaga yang bekerja. Sejak itu tiap sabotase diverifikasi
  dengan `cmp` terhadap salinan aslinya sebelum hasil testnya dipercaya. Ini keluarga yang sama
  dengan pelajaran #120 (sabotase yang lolos = penjaga longgar), satu tingkat lebih awal.
- Pint PASS (14 berkas), prettier PASS, `npm run build` lulus (client + SSR).
- Keenam halaman baru **dibuktikan ikut ter-bundle**, bukan sekadar "build hijau": keenamnya
  ada di `public/build/manifest.json`, dan string "Uji Koneksi" / "Daftar Penerima" /
  "Tulis Surat" hadir di bundel produksi.

### 9.3 TIGA penyimpangan dari rencana, beserta sebabnya

1. **`Mail::build()` DIBUANG, diganti mailer BERNAMA per tenant** (`dinas_{id}`). Sebabnya
   ditemukan saat menulis test: **`MailFake` tidak punya `build()`**, jadi jalur kirim yang
   memakainya mustahil diuji — dan jalur kirim yang tak bisa diuji adalah jalur yang gerbangnya
   akan jebol diam-diam. Nama ber-id tenant BUKAN hiasan: MailManager menyimpan mailer per NAMA,
   jadi satu nama bersama membuat proses yang melayani dua kabupaten (queue worker, dua request
   beruntun di php-fpm yang sama) memakai ulang kredensial kabupaten yang lebih dulu — surat
   kabupaten kedua terkirim dari kotak surat kabupaten pertama, tanpa satu pun galat.
2. **Gerbang peran & 404 PINDAH ke `MailSendRequest::authorize()`.** Ditemukan test, bukan
   ditebak: FormRequest divalidasi SEBELUM method controller, sehingga gerbang yang hanya ada di
   controller membuat POST ke fitur yang mati dijawab galat validasi "alamat tidak ada di Daftar
   Penerima" (302) alih-alih 404 — jawaban yang mengaku endpoint-nya ada DAN membocorkan cara
   kerja daftar putihnya ke orang yang seharusnya tak melihat fiturnya sama sekali.
3. **Pengirim disimpan DUA KALI** (`user_id` nullOnDelete + `sender_name` snapshot), padahal §4.1
   menulis `user_id` wajib. Maksudnya sama — "jejak harus menyebut siapa pengirimnya" — tapi
   dengan `user_id` saja, menghapus akun membuat jejak audit berbunyi "tidak tercatat" untuk
   surat yang jelas-jelas pernah terkirim.

### 9.4 Temuan baru, sengaja TIDAK dikerjakan (aturan emas #6)

**#129 OPEN** — `->with('success', ...)` + `page.props.flash` tak pernah sampai ke layar:
kunci `flash` **tidak pernah di-share** `HandleInertiaRequests` (yang ada `flash_message`).
Jadi toast konfirmasi di halaman-halaman admin yang memakai pola itu tak pernah muncul, tanpa
galat, tanpa gejala. Halaman baru task ini memakai pola yang BENAR (helper `flashMessage()`);
halaman lama tidak disentuh. Rinciannya di `FINDINGS_LOG.md`.

### 9.5 SISA

1. **Kredensial kotak surat** dari tiap kota (§1.3) — tanpa ini fitur mati 404 dan tak ada yang
   bisa diuji end-to-end. **Termasuk kesepakatan §1.1** (password tidak dibagikan ke petugas).
2. **Uji SMTP sungguhan di staging.** Yang sudah dibuktikan test: gerbang, jejak, pemisahan
   mailer, dan bahwa kegagalan koneksi tercatat. Yang BELUM: satu surat benar-benar diterima.
3. Verifikasi visual keenam layar (khususnya ponsel), dan nyalakan `tenants.features` per
   kabupaten lewat `/admin/tenants`.
4. Commit (terpisah dari TASK_54 & TASK_55 yang juga belum ter-commit di working tree ini) +
   deploy = kode **+ `php artisan migrate`** bersamaan. `.env` TIDAK disentuh.
5. Slice 2 (kotak masuk IMAP — **butuh persetujuan dependensi baru**) & slice 3 (lampiran).

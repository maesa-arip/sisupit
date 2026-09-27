# TASK 54 — Forum Tanya Jawab Warga per kabupaten (dimoderasi admin)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_54 |
| Severity | P3 |
| Tipe | fitur (modul baru) |
| Sumber | permintaan user 2026-09-14: "saya mau buat fitur forum" → dipersempit user jadi "komunitas warga, tanya jawab per kabupaten, admin moderasi" |
| Status | SELESAI (kode) 2026-09-14 - BELUM di-commit & BELUM dideploy |

---

## 1. Tujuan

Ruang tanya jawab kesiapsiagaan untuk warga, satu ruang per kabupaten/kota. Warga bertanya,
warga lain & Damkar menjawab, admin kabupaten memoderasi. Bukan kanal pelaporan kejadian dan
bukan chat insiden (itu TASK_08, tetap ditunda).

## 2. Kondisi awal

- Tidak ada modul diskusi apa pun. `Announcement` satu arah, global, superadmin saja.
- `tenants.features` (json) + `Tenant::hasFeature()` sudah ada sejak TASK_19 tapi **belum punya
  pemakai maupun UI** - forum jadi pemakai pertamanya.
- Preseden moderasi berbasis kolom status sudah ada: `Banjar::STATUS_USULAN` →
  `Admin\BanjarController::verify()` (TASK_40 §10). Ditiru, bukan diciptakan ulang.

## 3. Fakta kode yang MENENTUKAN bentuk rancangan

1. **Tenantable hierarkis (#60): kolom NULL pada baris = berlaku ke bawah.** Kalau thread
   menyimpan `village_code` penulisnya, warga desa lain di kabupaten yang SAMA tidak akan
   pernah melihatnya - tanpa galat, forumnya cuma tampak sepi. Karena itu thread menyimpan
   **`province_code` + `city_code` saja** (district & village sengaja NULL), dan keduanya
   diambil dari **akun penulis, bukan dari request**. Hasilnya persis "per kabupaten":
   kabupaten tetangga tertutup oleh pemeriksaan `city_code`, seluruh desa di dalamnya terbuka.
2. **Tenantable tidak menyaring TAMU** (blok `auth()->check()`). Forum yang bisa dibaca tamu
   akan membuka SELURUH kabupaten ke publik. MVP: **baca & tulis wajib login** (lihat §8 Q4).
3. **Akun tanpa kode wilayah (profil belum lengkap, OPD #44) melihat KOSONG.** Itu benar untuk
   forum; `EnsureProfileComplete` sudah menggiring warga melengkapi profil lebih dulu.
4. **Notifikasi: JANGAN lewat FCM maupun `broadcast`.** Wrapper Android memilih channel suara
   dari payload dan hanya mengenali tahap yang sudah ada (`alert_stage` TASK_50,
   `type: 'report_status'`); aturan TASK_50 "payload tak dikenal TETAP sirine" berlaku juga di
   .exe yang mendengar Reverb. Notifikasi forum lewat FCM/broadcast = ponsel warga & layar
   Pusat Komando BERSIRINE karena ada balasan forum, dan sirine berhenti berarti satu hal.
   MVP: `via() = ['database']` saja (lonceng web). Harganya: lonceng baru bertambah saat pindah
   halaman. Mengubahnya kelak menuntut tahap baru + rilis kedua wrapper (#114 bentuk yang sama).
5. **Permission Spatie tidak menggerbangi apa pun (#103)** → gerbang forum = `hasRole()` di
   controller + prop server `canModerate`/`canAnswerOfficially`, bukan permission & bukan
   daftar peran di JSX.
6. **Menu** cukup satu entri di `navItems.js` (aturan #71); otomatis masuk popover "Menu" di
   ponsel. Bilah bawah tidak disentuh.

## 4. Rancangan

### 4a. Skema (1 migrasi, 3 tabel, aditif)
- `forum_threads`: `id`, `user_id` (constrained), `title` (string 150), `body` (text),
  `status` (`menunggu`/`tampil`/`disembunyikan`, ter-index), `is_pinned` (bool),
  `accepted_post_id` (nullable), `posts_count` (uint, denormalisasi daftar), `last_activity_at`,
  `province_code`, `city_code` (ter-index), `moderated_by` + `moderated_at` + `moderation_reason`
  (nullable - jejak pelaku, pelajaran #88), timestamps, softDeletes.
- `forum_posts`: `id`, `forum_thread_id` (cascade), `user_id`, `body` (text),
  `is_official` (bool - diisi SERVER dari peran penulis, bukan dari request), `status`
  (`tampil`/`disembunyikan`), kolom jejak moderasi yang sama, timestamps, softDeletes.
- `forum_flags`: `id`, `flaggable_type`/`flaggable_id` (morph: thread atau post), `user_id`,
  `reason` (enum kecil: hoaks/kasar/spam/data_pribadi/lainnya), `note` nullable, `resolved_by`,
  `resolved_at`; `unique(flaggable_type, flaggable_id, user_id)` - satu orang satu laporan.
- Model `ForumThread` & `ForumPost` memakai `Tenantable` + `SoftDeletes`. `ForumPost` tidak
  menyimpan kode wilayah sendiri; aksesnya selalu lewat thread induk (re-check di controller).

### 4b. Alur & wewenang
| Aksi | Siapa | Catatan |
|------|-------|---------|
| Baca daftar & detail | semua akun login berkode wilayah | Tenantable; `menunggu`/`disembunyikan` hanya terlihat penulisnya & moderator |
| Buat pertanyaan | `warga`, `relawan` (+ staf, lihat Q2) | throttle `forum-post`; status awal lihat Q1 |
| Balas | semua yang bisa membaca | thread `tampil` saja |
| Jawaban resmi (lencana "Jawaban Resmi Damkar") | petugas/admin/superadmin kabupaten itu (Q2) | `is_official` ditentukan server |
| Tandai jawaban terbaik | penanya | satu per thread |
| Laporkan konten | semua pembaca | tak bisa melaporkan milik sendiri |
| Setujui / sembunyikan / pulihkan / sematkan / tutup laporan | **admin & superadmin** wilayah itu | alasan wajib saat menyembunyikan; jejak pelaku disimpan |
| Hapus milik sendiri | penulis | soft delete; balasan yang sudah dijawab tetap ada |

### 4c. Penjaga jalur darurat (inti rancangan, bukan hiasan)
- Spanduk tetap di atas form tanya: "Sedang ada kejadian? Jangan tulis di sini." + tombol
  **Lapor Darurat** + telepon `NOMOR_DARURAT_NASIONAL` (jangan tulis ulang angkanya, #80).
- Kata kunci darurat (kebakaran/api/terbakar/tolong/darurat/korban/terjebak) di judul/isi →
  **dialog konfirmasi** sebelum kirim, bukan blokir (pertanyaan "cara memadamkan api kompor"
  sah). Daftar katanya di SATU tempat (`lib/utils.js`), dan server TIDAK memakainya untuk menolak.
- Forum tidak pernah memicu `EmergencyAlertNotification`, siaran, maupun sirine.

### 4d. Konten & privasi
- Teks polos saja (tanpa HTML/markdown); tautan diubah jadi `<a rel="nofollow noopener">` di
  render, React meng-escape sisanya. **Tanpa foto di MVP** (Q3) - foto membawa EXIF GPS rumah
  warga dan foto korban.
- Penulis ditampilkan nama + lencana peran (`roleLabel()`), tanpa telepon/email/desa.
- Batas: judul 150, isi 3.000 karakter; limiter `forum-post` mis. 5 pertanyaan / jam dan
  20 balasan / jam per akun (`AppServiceProvider`, pola `report-create`).

### 4e. Aktivasi per kabupaten
`Tenant::hasFeature('forum')`: tenant dari **`city_code` akun** (bukan subdomain yang
dibuka - pola Thanks TASK_17). Mati → menu tidak muncul (prop server `features.forum`) dan
route memulangkan 404. Superadmin menyalakannya lewat `/admin/tenants` (checkbox pertama untuk
kolom `features` yang selama ini tanpa UI).

### 4f. Berkas
- Baru: migrasi, `app/Models/{ForumThread,ForumPost,ForumFlag}.php`,
  `app/Http/Controllers/Front/ForumController.php` (index/show/store/reply/accept/flag/destroy),
  `app/Http/Controllers/Admin/ForumModerationController.php` (antrian menunggu + dilaporkan,
  approve/hide/restore/pin/resolveFlag), `app/Http/Requests/Forum*Request.php`,
  `app/Notifications/Forum{Answered,PendingModeration}Notification.php` (database saja),
  `resources/js/Pages/Forum/{Index,Show,Create}.jsx`, `resources/js/Pages/Admin/Forum/Index.jsx`,
  `tests/Feature/Sisupit/ForumTest.php`, `tests/Feature/Sisupit/ForumModerationTest.php`.
- Disunting: `routes/web.php`, `AppServiceProvider` (limiter), `navItems.js` (2 entri: "Forum
  Warga" di Menu Utama, "Moderasi Forum" di Administrasi), `HandleInertiaRequests` (flag fitur),
  `Admin/Tenants` form (checkbox fitur), `Info/Terms.jsx` (klausul konten forum - Q5),
  dokumen `ARCHITECTURE_MAP`/`CONVENTIONS`/`FINDINGS_LOG`.

### 4g. Di luar scope MVP (sengaja)
Suka/vote, tag/kategori, pencarian teks penuh, foto, notifikasi push/real-time, forum lintas
kabupaten, sunting postingan sesudah dibalas, reputasi. Kategori ditunda sampai isi forum
membuktikan butuh.

## 5. Blast radius
- Tidak menyentuh laporan, status, notifikasi darurat, channel Reverb, maupun wrapper.
- `Tenantable` dipakai apa adanya (tanpa `withoutGlobalScopes`). Kalau kelak ada bypass,
  ATURAN EMAS #7 berlaku.
- `navItems.js` → `MobileNavParityTest` wajib tetap hijau.
- `/admin/tenants` mendapat UI pertama untuk `features`: pastikan menyimpan tidak menimpa fitur
  lain yang kelak ada (kirim array utuh).
- Migrasi aditif: deploy = `git pull` + `php artisan migrate --force` (+ cadangan DB, kebiasaan
  deploy bermigrasi) + nyalakan fitur per tenant.

## 6. Rencana verifikasi
- [ ] Baseline `php artisan test` (413 passed per 2026-09-09)
- [ ] Test isolasi: warga Badung tak bisa melihat/membalas/melaporkan thread Denpasar (index,
      show, reply, flag → 404); warga desa A MELIHAT thread warga desa B sekabupaten
- [ ] Test wewenang: warga tak bisa approve/hide; admin kabupaten lain tak bisa memoderasi;
      `is_official` tak bisa dipalsukan lewat request; kode wilayah thread tak bisa dipalsukan
- [ ] Test status: `menunggu`/`disembunyikan` tak tampil bagi pembaca lain, tampil bagi penulis
- [ ] Test fitur mati → 404 & menu absen; rate limit menolak ke-6
- [ ] Test notifikasi: `via()` TIDAK memuat FCM maupun `broadcast` (penjaga §3.4)
- [ ] Test sesudah hijau, Pint & prettier, `npm run build`
- [ ] Manual: ponsel 360px (daftar, detail, form + dialog kata kunci darurat), antrian moderasi

## 7. Rollback
Matikan fitur per tenant (instan, tanpa deploy). Penuh: revert commit + `migrate:rollback`
(drop 3 tabel; tak ada tabel lama yang disentuh).

## 8. KEPUTUSAN USER (dijawab 2026-09-14)
- **Q1 → pra-moderasi.** Pertanyaan baru `menunggu` sampai admin menyetujui; balasan langsung
  tampil dan bisa dilaporkan.
- **Q2 → admin saja.** `is_official` hanya untuk admin/superadmin. Petugas tetap boleh membalas
  sebagai pengguna biasa (lencana perannya tetap terbaca lewat `roleLabel()`), tapi tanpa lencana
  "Jawaban Resmi Damkar".
- **Q3 → tanpa foto.**
- **Q4 → wajib login** untuk membaca maupun menulis.
- **Q5 (klausul S&K)** belum dijawab tersendiri; dikerjakan sebagai bagian Terms dengan catatan
  tinjauan hukum.

### Pertanyaan asli (arsip)
- **Q1 Moderasi pertanyaan:** (a) pra-moderasi - pertanyaan baru `menunggu` sampai admin
  setujui, balasan langsung tampil + bisa dilaporkan [REKOMENDASI: jumlah pengguna masih kecil,
  admin sanggup, dan hoaks tak pernah sempat tayang]; (b) pasca-moderasi - semua langsung
  tampil, admin menindak laporan.
- **Q2 Siapa boleh memberi "Jawaban Resmi"?** petugas + admin [REKOMENDASI] / admin saja.
  Staf juga boleh membuat pertanyaan/pengumuman tersemat?
- **Q3 Foto di MVP?** tidak [REKOMENDASI] / ya (dengan pembuangan EXIF).
- **Q4 Tamu boleh membaca?** tidak [REKOMENDASI] / ya (butuh penyaring kota eksplisit).
- **Q5 Klausul S&K** "konten forum & penghapusan" ditambahkan ke `Info/Terms.jsx` (versi naik)
  - teks final sebaiknya ditinjau pihak hukum PT Tawarin Dimana Saja.


---

## LAPORAN TASK_54 - Forum Tanya Jawab Warga

### Perubahan
- BARU: migrasi `2026_09_14_100000_create_forum_tables` (3 tabel aditif); model `ForumThread`
  (Tenantable+SoftDeletes, `canModerate()`, `enabledFor()`, `scopeVisibleTo`), `ForumPost`,
  `ForumFlag` (`REASONS` + label dikirim server); `Front\ForumController`,
  `Admin\ForumModerationController`; `ForumThreadRequest`, `ForumPostRequest`;
  `ForumNotification` (database saja); halaman `Forum/{Index,Create,Show}.jsx`,
  `Forum/Partials/ForumParts.jsx`, `Admin/Forum/Index.jsx`; `lib/forum.js`; `ForumTest` (16 test).
- DISUNTING: `routes/web.php` (2 grup), `AppServiceProvider` (limiter `forum-thread` 5/jam &
  `forum-reply` 20/jam), `Tenant` (`FEATURE_FORUM`, `FEATURES`), `TenantRequest` (daftar putih +
  penanda `features_sent`), `TenantController` + `Admin/Tenants/Form.jsx` (checkbox fitur -
  UI pertama kolom `features`), `UserSingleResource` (`forum_enabled`), `navItems.js` (2 entri),
  `Info/Terms.jsx` (klausul Forum Warga di bagian 8) + `config/legal.php` (S&K 2.0 -> 2.1).
- Keputusan kecil yang saya ambil sendiri (bisa diubah): admin yang bertanya langsung tayang;
  nomor di spanduk darurat = 113 nasional (prop `tenant` ikut subdomain, bukan kabupaten akun);
  moderator tak bisa menghapus, hanya menyembunyikan; penulis bisa menghapus tulisannya sendiri;
  admin kecamatan (kalau ada) ikut memoderasi seluruh kabupaten karena Tenantable memperlihatkan
  thread kabupaten kepadanya.

### Penyimpangan dari rancangan §4 (disengaja)
- `posts_count` TIDAK dibuat: jumlah balasan dihitung saat query (`withCount`) - kolom
  denormalisasi harus ikut dikurangi saat balasan disembunyikan/dihapus, dan yang lupa itu
  menyimpang tanpa gejala.
- Satu kelas `ForumNotification` (bukan dua), satu berkas `ForumTest` (bukan dua).
- Kata kunci darurat di `lib/forum.js`, bukan `lib/utils.js` (byte NUL #93).
- Flag menu dikirim lewat `auth.user.forum_enabled` (`UserSingleResource`), bukan prop baru di
  `HandleInertiaRequests` - navItems.js sudah menerima objek itu.

### Verifikasi
- Test: baseline 415 passed (1604) -> lihat angka akhir di CLAUDE.md. ForumTest 16 passed.
- Sabotase (berkas pulih byte-exact, md5 dicocokkan): desa penulis ikut disimpan -> merah;
  cek thread induk di moderasi balasan dicabut -> merah; `broadcast` ditambahkan ke
  notifikasi -> merah; spanduk darurat dicabut dari form -> merah.
- Pint PASS, prettier PASS, `npm run build` lulus (client + SSR). Migrasi dijalankan di DB dev
  LOKAL (3 tabel ada).
- BELUM: verifikasi visual di browser/ponsel 360px (daftar, form + dialog kata darurat, detail,
  antrean moderasi, checkbox fitur di /admin/tenants).

### Langkah deploy (belum dikerjakan)
1. Commit kode forum TERPISAH dari pekerjaan sesi lain yang ada di working tree yang sama
   (kondisi air /hydrants: `Front/HydrantController.php`, `Hydrants/Index.jsx`,
   `HydrantWargaSkklTest.php`).
2. `git pull` + `php artisan migrate --force` (cadangan DB lebih dulu) + `chown`. Route berubah.
3. Sesuaikan `LEGAL_SYARAT_BERLAKU` dengan tanggal berlaku sebenarnya & minta klausul ditinjau.
4. Superadmin mencentang "Forum Tanya Jawab Warga" per kabupaten di /admin/tenants. Tanpa ini
   forum tidak muncul di mana pun (disengaja).

### Temuan baru
- #121 OPEN: lonceng notifikasi hanya menandai-baca, tak membawa ke halaman yang dikabarkan.

### Aman di-merge?
YA untuk kode (aditif, fitur mati sampai dinyalakan per tenant), setelah verifikasi visual.

## ADENDUM 2026-09-14 - #122: pertanyaan ditolak tanpa tanda di layar

Laporan user sesudah menyalakan forum Denpasar: "tidak berhasil disimpan, tidak ada error apa2
hanya diam saja". Rincian lengkap & buktinya di FINDINGS_LOG #122; ringkasnya:

- Server benar. Keempat kiriman user ditolak `min:10` pada judul (dibuktikan dari access log
  Nginx: 302 kembali ke form + selisih respons tepat 54 byte = galat judul).
- Pesan galatnya ADA tapi tertutup header sticky di ponsel (elementFromPoint), karena form dikirim
  dengan `preserveScroll` dan `onError` tak memunculkan toast selama ada galat per isian.
- Fix: `FORUM_LIMITS` + `lengthHint()` (penghitung menyebut batas minimal) dan
  `announceFormErrors()` (toast + gulir ke tengah + fokus) di `lib/forum.js`, dipakai
  `Forum/Create.jsx` dan form balasan `Forum/Show.jsx`. Nol perubahan server.
- Penjaga: 2 test baru di `ForumTest`, dibuktikan merah lewat 4 sabotase, pulih byte-exact.
- Diverifikasi di Chrome headless 390x844 sesudah fix; data uji di DB lokal dihapus.
- Dua temuan ikutan DICATAT SAJA atas keputusan user: #123 (limiter menghitung kiriman gagal +
  429 tampil sebagai modal mentah) dan #124 (419 membuat semua form diam lewat `toast[null]`).

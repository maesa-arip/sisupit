# TASK_60 — Regu & Danru: meluncur atas nama regu, satu anggota Jaga di Kantor
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_60 |
| Severity | P2 |
| Tipe | fitur |
| Sumber | permintaan user 2026-09-25 |
| Status | DONE (kode) 2026-09-25 di branch `feat/regu-danru` (worktree `.claude/worktrees/regu-danru`, bercabang dari `feat/hydrant-log-petugas` @4814de6f). BELUM dideploy |

---

## 1. Deskripsi / tujuan

Permintaan user (utuh): "buatkan fitur regu dan ada jadi danru atau komandan regu, danru yang bisa
setting siapa saja masuk regu, saat klik meluncur ke lokasi yang tampil adalah nama regu yang
meluncur tapi semua orang di regu wajib klik meluncur ini akan menjadi catatan siapa aja di regu
yang meluncur dan ada 1 yang stay di kantor damkar, buatkan dalam branch terpisah".

### 1.1 Keputusan user (ditanyakan lebih dulu, dua putaran)

| # | Pertanyaan | Jawaban |
|---|---|---|
| K1 | "Ada 1 yang stay di kantor" maksudnya? | Usul user sendiri: **tombolnya jadi 2, Meluncur dan Jaga di Kantor** |
| K2 | Berapa yang boleh Jaga di Kantor per regu per kejadian? | **Tepat 1** - yang pertama menekan mendapatkannya |
| K3 | Siapa yang boleh memulai keberangkatan regu? | **Anggota mana saja** - tidak tertahan menunggu danru |
| K4 | Siapa yang bisa jadi anggota regu? | **Petugas saja** - relawan tetap perorangan |
| K5 | Branch dari mana? | **Worktree dari `feat/hydrant-log-petugas`** (working tree utama memegang #130 sesi lain yang belum di-commit) |

Yang saya putuskan sendiri dan dilaporkan: danru = **atribut regu (`leader_id`), bukan peran
Spatie**; admin yang membuat regu & menunjuk danru; satu petugas hanya di satu regu.

## 2. Kondisi awal

- Tombol "Meluncur ke Lokasi" (`ReportActionController::takeAction`) murni perorangan: satu baris
  `report_officers` per petugas. "Manifes Responden" di `Front/Reports/Show.jsx` menyebut orang
  satu per satu di bawah "Damkar".
- Tak ada konsep regu/danru sama sekali di kode (grep `regu|danru|squad` = hanya dua perintah
  artisan yang tak terkait).

## 3. Rancangan & alasan

### 3.1 Data (satu migrasi ADITIF `2026_09_25_100000_create_regus_tables`)

| Tabel/kolom | Isi | Kenapa begini |
|---|---|---|
| `regus` | name, `leader_id` (nullOnDelete), 4 kolom wilayah, SoftDeletes, `Tenantable` | Danru = kolom, bukan peran Spatie: peran baru menuntut seeder + migrasi penyelaras + label + setiap gerbang (#110/#111). Wilayah = **kabupaten danru** (district/village NULL) sehingga Tenantable hierarkis (#60) membuatnya terlihat sekabupaten |
| `regu_members` | regu_id, `user_id` **UNIQUE** | Satu petugas satu regu - tanpa itu satu klik tak bisa menjawab "atas nama regu yang mana". Danru selalu juga baris di sini |
| `report_officers.regu_id` + `regu_name` | SNAPSHOT saat klik | Riwayat insiden tak berubah saat regu di-rename/anggota pindah/regu dihapus (pola `report_agencies.agency_name`) |
| `report_jaga_kantor` | report_id, regu_id, `regu_name` snapshot, user_id; **UNIQUE(report_id, regu_id)** + UNIQUE(report_id, user_id) | K2 ditegakkan database - dua klik bersamaan pun tak menghasilkan dua. **Sengaja BUKAN status baru di `report_officers`**: tabel itu dibaca peta, GPS, hitungan "responder aktif", `resolve()`; status baru = wajib disebut di tiap penyaring daftar hitam (pelajaran TASK_55), satu tertinggal = orang yang jaga kantor tergambar sebagai marker atau tertimpa `finished` |

### 3.2 Aksi

- `takeAction()` (petugas beregu): menulis `regu_id`/`regu_name` ke barisnya sendiri. Klik satu
  anggota **tidak** mengklaim anggota lain - tiap orang wajib menekan sendiri, dan daftar "siapa
  saja yang benar-benar berangkat" terbentuk dari klik-klik itu. Ditolak 403 bila ia tercatat
  Jaga di Kantor untuk kejadian ini. Petugas tanpa regu & relawan: perilaku lama, tanpa perubahan.
- `stayAtBase()` BARU (`POST /reports/{id}/jaga-kantor`, `reports.stay-at-base`): petugas beregu
  saja, `ensureWithinJurisdiction`, daftar hitam status sama dengan takeAction
  (`resolved`/`ditolak`/`digabung`), ditolak bila sudah meluncur, kursi regu yang sudah terisi =
  galat `jaga_kantor` (bukan 403 - ini balapan wajar antar anggota, layar menampilkannya sebagai
  toast); pelanggaran UNIQUE hasil balapan ditangkap jadi galat yang sama.
- `cancelStay()` BARU (`DELETE` rute yang sama, `reports.cancel-stay`): hanya baris milik sendiri.
- Keduanya menyiarkan `ResponderRosterChanged` (aturan #113: tiap tulisan ke catatan insiden
  punya aba-aba).

### 3.3 Kelola regu - `/regu` (`ReguController`, satu halaman `Regu/Index.jsx`)

- Grup route `role:petugas|admin|superadmin` = gerbang pertama; di controller: buat/ubah/hapus
  regu = admin/superadmin, **atur anggota = admin ATAU danru regu itu** (403 bagi anggota biasa).
- Anggota wajib petugas **sekabupaten regu**, tidak sedang di regu lain (ditolak dengan nama orang
  & regunya - tak pernah dipindahkan diam-diam), danru selalu ikut (tak bisa mengeluarkan diri).
- Danru dipilih dari `User::role('petugas')->isAdmin()` (yurisdiksi admin) dan wajib berkode
  kabupaten. Regu kabupaten lain = 404 (route binding ter-Tenantable).
- Hak tombol dari prop server (`can.manage`, `can_manage_members`), bukan peran di JSX (#101).
- Menu "Regu & Danru" di seksi Operasional `navItems.js` untuk `isStaff`; otomatis mendarat di
  popover "Menu" ponsel.

### 3.4 Halaman detail insiden

- Prop BARU dari `ReportController::show()` lewat helper `reguManifest()`:
  - `reguRoster` - regu yang benar-benar meluncur/jaga kantor di kejadian ini, dari SNAPSHOT
    (kunci `id:<regu_id>` atau `nama:<regu_name>` bila regu sudah dihapus): nama, danru,
    `stay` (siapa jaga kantor), `pending` (anggota SAAT INI yang belum memilih, hanya selama
    insiden terbuka). **`stay` & `pending` hanya untuk staf/pejabat** - nama petugas yang tidak
    berangkat bukan urusan pelapor; pelapor tetap melihat nama regu yang meluncur.
  - `myRegu` - regu penonton (petugas beregu): nama, kunci, `is_leader`, `i_stay`, `stay_taken_by`.
  - `canStayAtBase` - syarat yang SAMA dengan `stayAtBase()`.
- `reloadIncident()` memuat ulang ketiganya di SATU daftar prop yang sama (aturan #113; penjaga
  `ReportDetailRealtimeTest` diperluas).
- Panel Tindakan: anggota regu melihat **dua tombol berdampingan "Meluncur" | "Jaga di Kantor"**
  (tombol kedua hanya bila `canStayAtBase`); bila regunya sudah ada yang meluncur muncul ajakan
  "<Regu> sudah meluncur. Pilih keberangkatan Anda sendiri."; yang memilih jaga kantor melihat
  keadaannya + "Batal Jaga Kantor".
- Manifes Responden: di bawah "Damkar", tiap regu jadi blok berjudul nama regu + "Danru: X" +
  "N meluncur", lalu baris anggota yang meluncur (status per orang tetap), baris "Jaga di
  Kantor", dan "Belum memilih: ...". Petugas perorangan di bawahnya seperti dulu.

## 4. Berkas

- BARU: `database/migrations/2026_09_25_100000_create_regus_tables.php`, `app/Models/Regu.php`,
  `app/Models/ReportJagaKantor.php`, `app/Http/Controllers/ReguController.php`,
  `resources/js/Pages/Regu/Index.jsx`, `tests/Feature/Sisupit/ReguTest.php`
- DISUNTING: `app/Http/Controllers/ReportActionController.php` (takeAction + 2 aksi baru),
  `app/Http/Controllers/ReportController.php` (3 prop + `reguManifest()`), `routes/web.php`,
  `resources/js/Pages/Front/Reports/Show.jsx`, `resources/js/Layouts/Partials/navItems.js`,
  `tests/Feature/Sisupit/ReportDetailRealtimeTest.php` (daftar prop reload +3)

## 5. Blast radius

- `report_officers` hanya DITAMBAH dua kolom nullable; semua pembaca lama tak berubah perilaku.
- `report_jaga_kantor` tak dibaca peta, GPS, `resolve()`, Export Excel, dashboard - sengaja.
- Relawan, petugas tanpa regu, dan seluruh alur verifikasi: nol perubahan.
- **SENGAJA DI LUAR SCOPE** (bisa membaca kolom yang kini sudah ada tanpa migrasi tambahan):
  ~~nama regu di kartu misi dashboard petugas~~ (DIKERJAKAN, lihat §8), popup marker di peta detail/Peta Pemantauan, kolom
  regu di Export Excel & tim atensi berita acara, notifikasi ke anggota saat regunya meluncur
  (notifikasi baru = keputusan tahap suara TASK_50, bukan satu baris `via()`).

## 6. Verifikasi

- [x] Baseline worktree: **497 passed (2094)** - sama dengan branch asal (499 di CLAUDE.md
      termasuk 2 test #130 yang hanya ada di working tree utama, belum di-commit).
- [x] `ReguTest` BARU 11 test + `ReportDetailRealtimeTest` diperluas. Sesudah: **508 passed (2223)**.
- [x] TIGA sabotase dibuktikan MERAH, masing-masing diverifikasi terpasang lewat `cmp` lebih dulu:
      (1) takeAction tak mencap regu, (2) jaga kantor diizinkan walau sudah meluncur,
      (3) `stay`/`pending` bocor ke pelapor. Kedua berkas dipulihkan byte-exact (`cmp`).
- [x] Pint PASS (9 berkas), prettier PASS (`Show.jsx` DIPERIKSA saja, tidak `--write` - berkas
      besar yang belum prettier-clean; hanya dua baris baru yang diluruskan tangan).
- [x] `npm run build` lulus client + SSR; `Regu/Index.jsx` ada di manifest, "Jaga di Kantor" &
      `reguRoster` ada di bundel produksi. `public/build` TIDAK di-commit.
- [x] Migrasi dijalankan di MySQL dev LOKAL (`sisupit_dev`): up → rollback → up, 0 pending.
- [ ] **Verifikasi manual di browser** (belum - tanpa browser automation):
  1. Admin: `/regu` → Tambah Regu "Regu A", danru petugas X. Atur Anggota: centang Y & Z.
  2. Login X (danru): `/regu` hanya menampilkan Regu A dengan tombol "Atur Anggota"; login Y: tanpa tombol itu.
  3. Buat laporan, admin Broadcast. Login Y: Panel Tindakan menampilkan "Meluncur | Jaga di Kantor". Klik Meluncur.
  4. Login Z (jendela lain): muncul "Regu A sudah meluncur..." tanpa muat ulang; klik Jaga di Kantor.
  5. Login X: tombol Jaga di Kantor hilang + "Z sudah Jaga di Kantor untuk Regu A".
  6. Admin di halaman detail: blok "Regu A / Danru: X / 1 meluncur", baris Y "Meluncur", baris Z "Jaga di Kantor", "Belum memilih: X".
  7. Pelapor: blok "Regu A" dengan Y, TANPA baris jaga kantor & belum memilih.
  8. Ponsel 360px: dua tombol berdampingan masih terbaca.

## 7. Deploy & rollback

- Deploy = kode + `php artisan migrate` BERSAMAAN (kode baru membaca `report_officers.regu_id` &
  `regus` di halaman detail - tanpa migrasi, halaman detail insiden 500). `npm run build` +
  commit `public/build` terpisah sebelum pull di server (deploy tak membangun aset).
- Rollback: revert commit + `php artisan migrate:rollback --step=1` (down() dibuktikan jalan di MySQL).

## 8. Adendum 2026-09-25 - nama regu di dashboard petugas

Permintaan user: "tampilkan nama regu juga di dashboard petugas".

- `DashboardController` (jalur petugas): tiap `activeMissions[]` membawa `regus` = nama regu
  yang sudah meluncur ke insiden itu, dari SNAPSHOT `report_officers.regu_name` (unik, terurut) -
  sumber yang sama dengan manifes halaman detail. Prop BARU `myRegu` = `{name, is_leader}` regu
  milik petugas yang login, `null` bila belum beregu.
- `Petugas/Dashboard.jsx`: baris meta tiap misi menambah "• Regu A, Regu B meluncur" (hanya bila
  ada); kepala halaman menambah "Regu A - Danru" di sebelah "Wilayah Yurisdiksi Anda".
- BATAS YANG DITERIMA: dashboard dimuat ulang oleh `ReportFeedChanged`, yang disiarkan
  `takeAction()` hanya saat responder PERTAMA meluncur (pending -> handling). Regu kedua yang
  bergabung ke insiden yang sudah `handling` baru terlihat saat dashboard dimuat ulang/transisi
  berikutnya. Menyiarkan ulang tiap klik = memperluas siaran satu kabupaten penuh, keputusan
  tersendiri.
- Penjaga: 2 test di `ReguTest` (13 total). Sabotase `->unique()` dicabut dibuktikan MERAH
  (cek `cmp`), pulih byte-exact. Test 508 -> 510 passed (2256). Pint/prettier/build lulus.
  NOL migrasi baru.

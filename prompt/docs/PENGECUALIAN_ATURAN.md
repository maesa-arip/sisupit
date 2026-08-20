# PENGECUALIAN ATURAN — Sisupit

> Daftar keputusan yang **sengaja menekuk aturan** repo ini, beserta siapa yang menyetujui,
> kapan, dan konsekuensi apa yang diterima.
>
> **Kenapa berkas ini ada:** aturan di `CLAUDE.md`/`CONVENTIONS.md`/`MASTER_PROMPT.md`
> kehilangan arti kalau dilanggar diam-diam, dan pengecualian yang tak tercatat akan terbaca
> sebagai kelalaian di sesi berikutnya. Permintaan user 2026-08-19: **kalau sebuah cara kerja
> melanggar aturan, konfirmasi dulu beserta alasannya sebelum dikerjakan; kalau disetujui,
> catat di sini** supaya sewaktu-waktu ditanya "mana saja yang pengecualian", jawabannya ada.
>
> **Cara menambah entri:** aturan apa yang ditekuk (kutip sumbernya), keputusan apa, siapa &
> kapan menyetujui, alasannya, konsekuensi yang diterima, dan di mana pelanggarannya hidup di
> kode. Rujuk entri ini dari komentar di kode yang bersangkutan.

---

## #1 — Hydrant warga memakai tabel sendiri (`hydrant_wargas`), mengembarkan skema `hydrants`

- **Aturan yang ditekuk:** "satu konsep = satu sumber data". Aturan ini lahir dari FINDINGS
  #53/#54 dan hidup sebagai komentar permanen di `resources/js/Layouts/Partials/navItems.js`
  ("JANGAN pernah membuat daftar menu kedua"). Biayanya sudah benar-benar tertagih di repo
  ini: selama bottom-nav memelihara daftar menunya sendiri (2026-08-13 s/d 2026-08-19),
  **sembilan menu desktop hilang di ponsel tanpa gejala apa pun** — lihat FINDINGS #71.
  Pengecualian navigasi itu sudah DICABUT 2026-08-19 (TASK_31, persetujuan user) dan kini
  dijaga test; pengecualian hydrant di bawah ini TETAP berlaku, dengan mitigasi
  "komponen React tidak ikut dikembarkan" justru karena preseden itu.
- **Keputusan:** hydrant swadaya warga disimpan di tabel **`hydrant_wargas`** yang terpisah
  dari `hydrants`, dengan model, controller, dan route sendiri — bukan satu tabel berkolom
  `ownership` seperti implementasi awal TASK_30 (2026-08-18).
- **Disetujui:** user, **2026-08-19**, setelah disodori konsekuensi di bawah.
- **Alasan user:** hydrant resmi (instansi/PDAM) dan hydrant warga (swadaya banjar/desa)
  dikelola dua pihak yang berbeda dan ingin dipisah sebagai dua menu dengan route sendiri.
  Pemisahan di level tabel membuat pemisahan itu tak bisa bocor karena satu scope kelupaan,
  dan menghapus konsep "kepemilikan" dari form sehingga petugas tak bisa salah pilih.
- **PEMBARUAN 2026-08-21 (TASK_33, permintaan user):** kedua tabel **tidak lagi kembar**.
  Hydrant warga kini punya kosakatanya sendiri — `type` = Sumber Air (Tandon/Groundtank),
  `status` = Belum/Sudah Modifikasi, `capacity_liter` (liter) menggantikan `debit_lpm`, dan
  `water_pressure` dibuang — karena yang didata di sana memang tandon/groundtank swadaya, bukan
  hydrant jalanan bertekanan. Pengecualian ini **tetap berlaku** dan justru terbayar: perbedaan
  itu tak akan mungkin dilakukan kalau keduanya berbagi satu tabel. Pertanyaan saat menambah
  kolom berubah dari "salin ke sebelah" jadi **"apakah konsepnya berlaku di kedua sisi?"**.
- **Konsekuensi yang diterima:**
  1. **Skema serupa (dulu kembar).** `name, address, status, type, description, lat, lng` + 4
     kolom wilayah ada di dua tabel; kolom air sudah berbeda sejak 2026-08-21. **Menambah kolom
     yang berlaku untuk kedua jenis berarti dua migrasi.** Kalau kamu menyentuh salah satu, cek
     yang satunya.
  2. **Controller kembar.** `Admin\HydrantWargaController` menyalin bentuk
     `Admin\HydrantController`. (Ini sekaligus mengikuti pola yang memang sudah ada di repo:
     `PompaController`/`PosPemadamController` juga kembar sejak dulu.)
  3. Daftar & peta SKKL membaca **tiga** sumber (pompa + hydrant warga + apa pun berikutnya).
  4. Memindahkan hydrant dari resmi ke warga (mis. salah input) = **hapus lalu buat ulang**;
     id dan riwayatnya tidak ikut.
- **Yang TIDAK ikut diduplikasi (mitigasi yang disepakati):**
  - **Komponen React**: `Admin/Hydrants/{Index,Create,Edit}.jsx` melayani DUA route lewat prop
    `variant`; nama route, label, **dan konfigurasi kolom per varian** (label & pilihan Sumber
    Air/Konstruksi, daftar status, ada-tidaknya Kondisi Air, nama & satuan kolom angka air)
    hidup di satu tempat, `Admin/Hydrants/variants.jsx`. Perbaikan peta/auto-fill wilayah cukup
    sekali, dan perbedaan kosakata 2026-08-21 masuk sebagai DATA di berkas itu — bukan sebagai
    percabangan `if (variant === 'warga')` yang berserakan di dua form.
  - **Bentuk baris SKKL**: `HydrantWarga::toSkklRow()` sebentuk dengan `Pompa::toSkklRow()`.
- **Hidup di:** `database/migrations/2026_08_19_100000_create_hydrant_wargas_table.php`,
  `app/Models/HydrantWarga.php`, `app/Http/Controllers/Admin/HydrantWargaController.php`,
  `resources/js/Pages/Admin/Hydrants/variants.jsx`, route `admin.hydrant-warga.*`
  (`routes/web.php`).
- **Tampak sebagai satu kesatuan bagi pengguna** (juga permintaan user): `/admin/hydrants` dan
  `/admin/hydrant-warga` memakai halaman yang sama dengan tab pemisah di bawah judul, jadi
  perpindahannya terasa seperti berganti tab, bukan berpindah modul.
- **Test penjaga:** `tests/Feature/Sisupit/HydrantWargaSkklTest.php` — khususnya
  `it keeps the two hydrant lists apart`,
  `it keeps citizen hydrants off the public official-hydrant page and vice versa`, dan (sejak
  TASK_33) `it refuses the official-hydrant vocabulary on a citizen hydrant` yang menjaga
  kosakata keduanya tidak diam-diam menyatu lagi.

---

## #2 — Baris aktif di popover bottom-nav memakai tint, bukan blok merah solid seperti sidebar

- **Aturan yang ditekuk:** "SATU dialek penanda aktif di semua permukaan" — blok solid
  `bg-destructive` + `text-destructive-foreground` + `rounded-xl`, ditulis di
  `.claude/skills/sisupit-ui/SKILL.md` (baris "Penanda 'aktif' navigasi") dan lahir dari
  FINDINGS #72 (bilah bawah dulu punya bahasa visualnya sendiri: pil `rounded-full`,
  ikon 28px, stroke berubah saat aktif).
- **Keputusan:** aturan itu **hanya berlaku untuk slot di BILAH** bawah. Di **dalam** popover
  "Fasilitas" dan "Menu", baris yang sedang dibuka kembali memakai bentuk production:
  **tint 10% + teks/ikon sewarna** (`bg-teal/10 text-teal`, `bg-info/10 text-info`,
  `bg-volunteer/10 text-volunteer`, dan `bg-destructive/10 text-destructive` untuk item
  tanpa warna jenis).
- **Disetujui:** user, **2026-08-20** — permintaan langsung ("untuk fasilitas dan menu di
  mobile saat active jangan pakai merah seperti di desktop tapi pakai seperti sebelumnya yang
  ada di production"), lalu dipertegas lewat pilihan: hanya isi popover, bukan tombol slotnya.
- **Alasan user:** di dalam panel, blok merah solid terbaca seperti tombol aksi darurat
  (idiom yang di aplikasi ini dipegang tombol "Lapor"), bukan seperti penanda "kamu di sini".
  Blok solid itu baru berumur sehari (TASK_31, 2026-08-19) dan belum pernah sampai produksi;
  yang dikenal pengguna adalah tint.
- **Konsekuensi yang diterima:**
  1. **Dua bentuk penanda aktif di satu berkas.** Slot bilah = blok solid merah; baris popover
     = tint. Keduanya bisa tampak bersamaan (mis. sedang di `/hydrants` lalu membuka popover
     Fasilitas: slot bilah merah solid, baris "Lokasi Hydrant" tint teal).
  2. **Warna aktif baris popover tidak selalu merah**, sehingga "merah = lokasi" tidak lagi
     berlaku mutlak di dalam panel — di sana warna mengikuti jenis fasilitas (gema legenda
     peta), bukan status aktif.
  3. Kontras baris aktif lebih rendah daripada blok solid; disiasati dengan `font-semibold`
     dan `aria-current="page"`.
- **Yang TIDAK ikut berubah:** kotak ikon slot bilah (tetap `rounded-xl bg-destructive`),
  ukuran ikon 20px/label 12px/stroke tetap (hasil #72 — user menolak mengembalikan ikon 28px),
  keadaan "panel terbuka" (tetap `bg-accent` netral + `aria-expanded`), dan slot "Lapor".
- **Hidup di:** `resources/js/Layouts/Partials/MobileBottomNav.jsx` — `FASILITAS_ITEM_TONE`,
  `MENU_ACTIVE_TONE`, dan `FloatingLink` (masing-masing berkomentar merujuk entri ini).
- **Test penjaga:** tidak ada — ini murni rupa. `tests/Feature/Sisupit/MobileNavParityTest.php`
  menjaga *isi* menunya, bukan warnanya. Verifikasinya visual di ponsel.

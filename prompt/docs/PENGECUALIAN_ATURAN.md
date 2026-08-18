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
  ("JANGAN pernah membuat daftar menu kedua ... Menu baru yang juga harus tampil di ponsel
  wajib ditulis DUA KALI"). Biayanya sudah pernah dirasakan langsung di repo ini: sejak
  bottom-nav dikembalikan ke bentuk lama, daftar menu hidup di dua tempat dan menu yang lupa
  ditulis di salah satunya hilang tanpa gejala.
- **Keputusan:** hydrant swadaya warga disimpan di tabel **`hydrant_wargas`** yang terpisah
  dari `hydrants`, dengan model, controller, dan route sendiri — bukan satu tabel berkolom
  `ownership` seperti implementasi awal TASK_30 (2026-08-18).
- **Disetujui:** user, **2026-08-19**, setelah disodori konsekuensi di bawah.
- **Alasan user:** hydrant resmi (instansi/PDAM) dan hydrant warga (swadaya banjar/desa)
  dikelola dua pihak yang berbeda dan ingin dipisah sebagai dua menu dengan route sendiri.
  Pemisahan di level tabel membuat pemisahan itu tak bisa bocor karena satu scope kelupaan,
  dan menghapus konsep "kepemilikan" dari form sehingga petugas tak bisa salah pilih.
- **Konsekuensi yang diterima:**
  1. **Skema kembar.** `name, address, status, type, water_pressure, debit_lpm, description,
     lat, lng` + 4 kolom wilayah ada di dua tabel. **Menambah kolom hydrant berarti dua
     migrasi.** Kalau kamu menyentuh salah satu, cek yang satunya.
  2. **Controller kembar.** `Admin\HydrantWargaController` menyalin bentuk
     `Admin\HydrantController`. (Ini sekaligus mengikuti pola yang memang sudah ada di repo:
     `PompaController`/`PosPemadamController` juga kembar sejak dulu.)
  3. Daftar & peta SKKL membaca **tiga** sumber (pompa + hydrant warga + apa pun berikutnya).
  4. Memindahkan hydrant dari resmi ke warga (mis. salah input) = **hapus lalu buat ulang**;
     id dan riwayatnya tidak ikut.
- **Yang TIDAK ikut diduplikasi (mitigasi yang disepakati):**
  - **Komponen React**: `Admin/Hydrants/{Index,Create,Edit}.jsx` melayani DUA route lewat prop
    `variant`; nama route & label hidup di satu tempat, `Admin/Hydrants/variants.jsx`.
    Perbaikan peta/auto-fill wilayah cukup sekali.
  - **Daftar nilai kondisi air**: `HydrantWarga` merujuk `Hydrant::WATER_PRESSURES`, tidak
    menyalinnya.
  - **Bentuk baris SKKL**: `HydrantWarga::toSkklRow()` sebentuk dengan `Pompa::toSkklRow()`.
- **Hidup di:** `database/migrations/2026_08_19_100000_create_hydrant_wargas_table.php`,
  `app/Models/HydrantWarga.php`, `app/Http/Controllers/Admin/HydrantWargaController.php`,
  `resources/js/Pages/Admin/Hydrants/variants.jsx`, route `admin.hydrant-warga.*`
  (`routes/web.php`).
- **Tampak sebagai satu kesatuan bagi pengguna** (juga permintaan user): `/admin/hydrants` dan
  `/admin/hydrant-warga` memakai halaman yang sama dengan tab pemisah di bawah judul, jadi
  perpindahannya terasa seperti berganti tab, bukan berpindah modul.
- **Test penjaga:** `tests/Feature/Sisupit/HydrantWargaSkklTest.php` — khususnya
  `it keeps the two hydrant lists apart` dan
  `it keeps citizen hydrants off the public official-hydrant page and vice versa`.

# TASK_75 — Peta form lapor gaya Google Maps + pencarian paham "jl/jln/gg"

| Field | Isi |
|-------|-----|
| ID | TASK_75 |
| Severity | P2 |
| Tipe | perbaikan UX + bug pencarian |
| Sumber | FINDINGS_LOG #188 / permintaan user 2026-10-07 |
| Status | DONE - TERDEPLOY PROD @eb006bb1 (2026-10-07) |

---

## 1. Tujuan

User: pelajari tampilan Google Maps lalu beri masukan untuk peta form lapor; hapus tombol "Salin ke
patokan" (alamat mesin bukan patokan); pencarian harus paham "jl", "jln.", "jalan" seperti Google Maps.
Delapan masukan diajukan, user menjawab "setuju kerjakan semuanya" (1-7 dikerjakan, 8 = satelit dicatat OPEN).

## 2. Kondisi awal (direproduksi)

Nominatim lokal (data Bali, sama dengan prod): "jln gatot subroto" = 0 hasil, "gg. ikan mas" = 0 hasil,
"jln. teuku umar" = hanya ruas Karangasem; "jalan gatot subroto"/"gang ikan mas" ketemu di Denpasar.
Kolom cari ada di bagian Wilayah Kejadian (di bawah peta); pin diseret dengan jari; peta 220 px; tak ada
tombol kembali ke GPS; hasil cari tanpa jarak & tanpa bias lokasi; debounce 1 detik.

## 3. Yang dikerjakan

- **Server** `app/Http/Controllers/Api/GeocodeController.php`
  - `normalizeStreetAbbreviations()` jl/jl./jln/jln./jalan -> "Jalan", gg/gg. -> "Gang" (kata utuh saja).
  - Masih nihil setelah cadangan awalan -> cari ulang tanpa kata "Jalan".
  - `lat`/`lng` opsional -> `viewbox` +-0,3 derajat (pusat dibulatkan 1 desimal), tanpa `bounded`.
  - `RESULT_LIMIT` 4 -> 5; kunci cache memuat viewbox.
- **`Components/UserLeafletMap.jsx`** (opt-in, pemakai lain tak berubah)
  - `centerPin`: overlay pin tengah (terangkat saat geser), `touchZoom/scrollWheelZoom/doubleClickZoom: 'center'`,
    lapor titik di `moveend` hanya bila digerakkan pemakai (`userMovedRef`); ketuk = `panTo` titik itu.
    Pan terprogram dilewati bila pemakai sedang menggeser / titik sudah di tengah (cegah loop reverse-geocode).
  - Zoom control hanya `pointer: fine`, `bottomright`.
  - `onLocate`: kontrol Leaflet "Kembali ke lokasi saya" (bertumpuk di atas zoom).
- **`Pages/Front/Reports/Create.jsx`**
  - Kolom cari + daftar hasil jadi overlay `z-10` di atas peta (pembungkus `bg-card shadow-md`).
  - Peta 280/340 px, `centerPin`, `onLocate={locateMe}`.
  - Hasil: urut jarak dari GPS pelapor (`gpsFixRef`), label jarak; param `lat`/`lng` pin dikirim.
  - Debounce 500 ms.
  - Kartu titik: judul jalan+nomor / kelurahan, detail kelurahan, kecamatan, kota (`pinPlace`).
  - Tombol "Salin ke patokan" dihapus; teks bantuan & toast "geser pin" -> "geser peta".

### Lanjutan - kartu Wilayah Kejadian digabung (permintaan user 2026-10-07)

- Bagian `<section>` "Wilayah kejadian" dihapus; kepala status GPS & kartu alamat diganti SATU baris lokasi di bawah
  peta (`placeTitle`/`placeSubtitle`, ikon per `locState`) + tombol "Ubah" (`regionOpen`) yang membuka 4 combobox.
- `regionForced` = desa kosong setelah lokasi selesai dipindai ATAU ada galat `*_code` dari server -> panel terbuka
  tanpa tombol. Submit tanpa desa -> `setRegionOpen(true)` + toast "Pilih desa/kelurahan kejadian di bawah peta."
- `regionParts` (pengganti `manualRegionLabel`): nama laravolt dirapikan huruf awal kapital, nama yang sama dengan
  judul dibuang. Notice tenant satu baris; teks bantuan "Geser peta..." dibuang (pesan GPS tetap di baris lokasi).
- Uji Playwright 390px: siap -> 0 combobox + "Ubah"; ketuk -> 4 combobox + "Selesai"; GPS akurasi 5000 m -> 4
  combobox, tanpa tombol. Ditemukan & diperbaiki: combobox kanan meluber (grid track auto -> flex col), wilayah
  HURUF BESAR mengulang judul, judul GPS lemah berupa kalimat panjang tebal.

## 4. Verifikasi

- Pest: baseline 745 passed (3755) sebelum; sesudah 760 passed (3798); setelah kartu wilayah digabung 761 passed (3800). Baru: `GeocodeControllerTest` +11
  (dataset singkatan, cadangan tanpa "Jalan", viewbox), `ReportFormMapGoogleStyleTest` 4 (penjaga sumber).
- Playwright headless (skrip di job tmp; Chrome, 390x844, GPS palsu -8.6705,115.2126, akun seed lokal):
  "jl teuku umar" -> 5 hasil, 859 m pertama; geser peta -> desa Panjer, tepat 1 reverse-geocode, tak ada
  panggilan susulan 3 dtk; "Lokasi saya" kembali ke GPS; konteks sentuh: zoom tersembunyi.
- Ditemukan & diperbaiki saat uji visual: kolom cari tembus pandang (`filledFieldsClass`), overlay menutupi
  header saat digulir (`z-[1000]` -> `z-10`), kartu menduplikasi kelurahan, kecamatan tak tampil.
- Chrome MCP TAK SAH untuk drag (tab `hidden` menahan rAF) - dipakai hanya untuk alur cari & pilih hasil.

## 5. Belum

- Uji di HP/APK sungguhan (geser satu jari, cubit zoom, tombol lokasi).
- Masukan #8 mode Satelit (butuh penyedia citra) - OPEN di FINDINGS #188.
- Commit eb006bb1, TERDEPLOY PROD 2026-10-07 lewat konsol user; bundel Create-CiTebKPd.js terverifikasi HTTPS.

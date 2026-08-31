# TASK_53 — Satu mode penetapan lokasi di form lapor (semua pelapor)

**Sumber:** permintaan user 2026-09-01.
**Temuan terkait:** #105 (BARU, FIXED di task ini). Mencabut sebagian TASK_28.
**Status:** SELESAI (kode). Sisa: verifikasi visual §6 + deploy.

---

## 1. Permintaan user (verbatim)

> "di form lapor jadikan 1, jangan ada pilih manual atau ikuti peta, peta dan lokasi sinkron,
> saat pin digeser data mengikuti lokasi pin, mirip seperti /admin/hydrants/create"

Lalu, setelah rencana disodorkan:

> "lanjutkan, bukan hanya di pusat komando di masyarakatpun sekarang buat seperti itu saat lapor"

Permintaan kedua itu yang memperbesar cakupannya: bukan cuma mencabut sakelar di layar Pusat
Komando, tapi **membuka seluruh blok lokasi untuk warga**.

## 2. Keadaan sebelumnya

`Front/Reports/Create.jsx` memelihara state `regionMode` bernilai `'manual'` atau `'pin'`,
dengan dua tombol sakelar di kepala blok "Wilayah Kejadian":

- **`manual`** (default Pusat Komando): wilayah = pilihan operator. `resolveLocation()`
  memeriksa `keepRegion` lalu **keluar lebih awal**, jadi menggeser pin hanya memperbarui
  lat/lng + nama jalan + `geo_address`. Kode wilayah TIDAK ditulis.
- **`pin`** (satu-satunya mode warga): wilayah diturunkan dari reverse-geocode pin.

Seluruh blok itu — kotak "Cari Lokasi Kejadian", keempat dropdown, panel "Alamat Lengkap
(otomatis)", dan `clickToPlace` pada peta — digerbangi `hasRegionPicker`, turunan prop server
`region_picker` yang hanya dikirim untuk `petugas|admin|superadmin`.

## 3. Kenapa sakelarnya dicabut (bukan sekadar selera)

Mode `manual` membuat pin dan dropdown bisa menunjuk **dua tempat berbeda**, dan tidak ada satu
pun tanda di layar yang mengatakannya. Itu bukan hipotesis: itulah yang dilakukan `keepRegion`
secara harfiah. Laporan tersimpan dengan lat/lng titik A dan kode wilayah B; peta petugas
menggambar dari lat/lng, sedangkan penyaringan yurisdiksi, notifikasi, dan rekap memakai kode
wilayah — persis bentuk #78 (kode desa yang tak cocok dengan titiknya) yang dulu harus
dibersihkan lewat perintah artisan tersendiri.

## 4. Temuan #105 yang ikut ketahuan (dan mengubah bobot task ini)

`ReportRequest::rules()` mewajibkan `village_code` untuk **setiap** laporan baru, tanpa
membedakan peran. Tapi keempat dropdown disembunyikan dari warga. Jadi ketika pencocokan nama
OSM berhenti di kecamatan — kejadian yang sudah tercatat lumrah sejak TASK_28 — warga:

1. lolos penjaga di layar (syaratnya `hasRegionPicker && !village_code`, dan `hasRegionPicker`
   false untuk warga);
2. tetap melihat lencana **hijau "Lokasi terdeteksi"** (ambang warga cuma `province_code`);
3. ditolak server pada `village_code`, sebuah `<input type="hidden">` yang tak pernah dirender —
   **tanpa pesan yang terlihat di mana pun**.

Membuka blok itu untuk warga karena itu bukan penambahan hiasan; ia satu-satunya jalan
pemulihan yang selama ini tidak ada. Rinciannya di FINDINGS_LOG #105.

## 5. Perubahan

| Berkas | Perubahan |
|--------|-----------|
| `resources/js/Pages/Front/Reports/Create.jsx` | Cabut `regionMode`/`regionModeRef`/`setRegionMode`, kedua tombol sakelar, dan `useMapPinRegion()`. Cabang `keepRegion` di `resolveLocation()` & `applyUntrustedPoint()` dibuang → wilayah SELALU ditulis ulang dari titik. `hasRegionPicker` dihapus: blok Wilayah Kejadian, efek dropdown, debounce pencarian, panel alamat otomatis, dan `clickToPlace` berlaku untuk semua. `locState`/`locTitle` jadi satu rumus berambang `village_code`. `locSubtitle` = `friendlyAddress \|\| manualRegionLabel`. Dua penjaga submit disatukan jadi satu yang menuntut `village_code` untuk semua. |
| `resources/js/Components/UserLeafletMap.jsx` | Komentar `clickToPlace` diperbarui — alasan default MATI dulu menyebut form warga, dan form itu kini menyalakannya. Nilai defaultnya sendiri TIDAK diubah. |
| `tests/Feature/Sisupit/ReportLocationSingleModeTest.php` | BARU, 4 penjaga. |
| `tests/Feature/Sisupit/ReportManualRegionPickerTest.php` | Nama & komentar diluruskan (asersi TIDAK diubah): prop `region_picker` bukan lagi gerbang tampil, ia nilai awal. |

**Nol perubahan server**: `ReportController`, `ReportRequest`, route, skema, migrasi, channel,
notifikasi — semuanya tak disentuh. Prop `region_picker` tetap dikirim apa adanya.

## 6. Yang mengikat (jangan dibongkar tanpa membaca ini)

- **`region_picker` BUKAN gerbang.** Ia hanya nilai awal kode wilayah bagi operator.
  Menjadikannya gerbang lagi = menghidupkan kembali #105.
- **Dropdown tetap melompatkan pin ke centroid.** Ini SATU-SATUNYA hal yang berbeda dari
  `/admin/hydrants/create`, dan disengaja: alur telepon Pusat Komando ("operator tahu nama
  desanya, bukan titik petanya") adalah alasan TASK_28 lahir, dan user tidak memintanya dicabut.
  Hasilnya sinkron dua arah — pin mengikuti wilayah, wilayah mengikuti pin.
- **Menggeser pin sesudah memilih dropdown MENIMPA pilihan itu.** Itu memang yang diminta.
  Konsekuensinya: bila pencocokan OSM meleset di titik baru, dropdown bisa ikut kosong.
  Peredamnya, dropdown itu terlihat dan bisa dibetulkan lagi, dan tombol Kirim menolak tanpa desa.
- **Ambang layar = ambang server.** `locState` 'ready' dan penjaga submit sama-sama menuntut
  `village_code`, sama dengan `ReportRequest`. Jangan longgarkan salah satunya sendirian.
- **`gpsFixRef` (TASK_52) tidak tersentuh.** Posisi pelapor tetap hanya ditulis di callback
  sukses `getUserLocation()`; `userLocation` tetap berarti "titik yang terakhir dipakai".
  Jangan pakai ulang state itu untuk posisi pelapor.
- **`clickToPlace` kini menyala untuk warga.** Ini pembalikan sadar atas komentar lama di
  `UserLeafletMap.jsx`. Kalau ternyata mengganggu di lapangan, matikan dengan satu prop.

## 7. Verifikasi yang sudah dilakukan

- Test **382 → 386 passed** (1502 assertions). Baseline 382 diambil sebelum menyentuh apa pun.
- TIGA dari empat penjaga baru dibuktikan **MERAH** terhadap berkas sebelum perubahan
  (`git show HEAD:...` dipasang sementara, lalu dipulihkan). Yang keempat (server menolak
  laporan warga tanpa desa) hijau sejak awal — penjaga regresi atas perilaku yang sudah ada,
  disebut apa adanya, bukan diklaim sebagai bukti bug.
- `vendor/bin/pint` PASS (295 berkas), `npx prettier --write` atas kedua berkas JS,
  `npm run build` lulus.

## 8. SISA — verifikasi visual (butuh browser)

Sebagai **warga**, di `/reports/create`:

1. Buka halaman → pin di posisi GPS, blok "Wilayah Kejadian" TERLIHAT, keempat dropdown
   terisi sendiri sampai desa.
2. Geser pin ke desa lain → keempat dropdown ikut berubah; panel "Alamat Lengkap (otomatis)"
   ikut berubah.
3. Klik satu titik di peta → pin pindah ke sana, wilayah ikut.
4. Pilih desa lain di dropdown → pin melompat ke tengah desa itu.
5. Kosongkan desa (pilih kecamatan lain) → tekan Kirim → muncul toast yang menunjuk blok
   Wilayah Kejadian, BUKAN galat diam.
6. Kirim normal → mendarat di halaman Terima Kasih.

Sebagai **petugas/admin**: ulangi 1-6, plus pastikan provinsi & kabupaten sudah terisi dari
yurisdiksi akun saat halaman dibuka, dan **tidak ada** lagi tombol "Pilih manual"/"Ikuti pin peta".

Uji juga di **APK WebView** (peta kecil, sentuh): pastikan `clickToPlace` tidak membuat pin
berpindah saat pengguna sebenarnya hendak menggulir halaman.

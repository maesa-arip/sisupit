# Style "Sisupit Dark"

Kembaran mode gelap dari `../sisupit-light/` (2026-10-28, FINDINGS #223). **Struktur identik**:
51 layer yang sama, urutan sama, filter/zoom/lebar/font sama, sumber `openmaptiles` + `world`
yang sama, sprite disalin apa adanya. Yang berbeda HANYA warna di `paint` (+ `name`). Jadi
semua catatan di README Sisupit Light (label Latin, `maxzoom: 13` latar dunia, fontstack Noto
Sans, `minzoom` nama desa) berlaku persis di sini.

Id style di `config.json` = **`sisupit-dark`**, dibaca aplikasi lewat env **`MAP_TILE_URL_DARK`**
(`config/services.php` -> `window.MAP_TILE_URL_DARK` -> `resources/js/lib/map-tiles.js`). Peta
berganti ke style ini saat `<html>` berkelas `dark`, dan kembali saat tema terang, tanpa memuat
ulang halaman.

## Patokan: Google Maps mode gelap

Google Maps di ponsel mengikuti tema perangkat ("Sama dengan tema perangkat") dan memakai palet
peta yang DIRANCANG sendiri, bukan gambar terang yang dibalik warnanya. Prinsip yang ditiru:

- **Daratan abu kebiruan netral** (`#1d2024`), permukiman & bangunan sedikit lebih terang
  (`#222529`, `#2a2d32`) supaya blok kota tetap terbaca.
- **Air biru tua** (`#13253a`), sungai `#26405a` - laut tetap terbaca sebagai air, bukan lubang hitam.
- **Jalan LEBIH TERANG dari daratan** (kebalikan mode terang): gang `#34383e`, arteri `#454a52`,
  tol `#565c66`; casing jalan justru lebih GELAP dari daratan (`#16191c`) sebagai garis tepi.
- **Label abu muda bergaris tepi warna daratan** (`#aeb4bb` / halo `#1d2024`), nama jalan `#9aa0a6`.
- **Tanpa jalan kuning/oranye** ala tema "Night" lama Google: di aplikasi ini warna = DATA
  (merah kejadian, kuning terverifikasi, teal fasilitas, ungu relawan, biru selesai), jadi
  basemap tetap netral seperti versi terangnya.

## Menyetel ulang

Sunting warna di `style.json` ini lalu `docker compose restart tiles`, **naikkan `?v=` di
`MAP_TILE_URL_DARK`** tiap environment (cache tile 30 hari di browser, lihat README tile server),
dan periksa GAMBARNYA di zoom pulau (z9) dan zoom kota (z13-z15) - kegagalan basemap selalu HTTP 200.

Bila `sisupit-light` berubah STRUKTURNYA (layer baru/hapus), ubah juga di sini dengan cara yang
sama - kedua style harus tetap berlayer sama.

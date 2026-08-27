# Style "Sisupit Light"

Style basemap yang dipakai SELURUH peta Sisupit. Berbeda dengan `bali.mbtiles` dan `fonts/`
yang diunduh/dibangun ke `docker/tiles/data/` (dan diabaikan git), berkas di folder ini
**ikut repo** — alasannya sama dengan `docker/tiles/config.json`: ini keputusan rupa, bukan
data. Ia dipasang ke container lewat bind mount di `docker-compose.yml`.

## Asalnya

Diturunkan dari **Positron** ([openmaptiles/positron-gl-style](https://github.com/openmaptiles/positron-gl-style)
rilis **v1.9**, berkas `style-local.json`), lisensi **BSD-3-Clause**. Berkas `sprite*` disalin
apa adanya dari rilis itu (isinya cuma dua ikon, `circle-11` & `star-11`, dan hanya terpakai di
bawah z8 — praktis tak pernah terlihat di aplikasi ini, tapi tetap disertakan supaya style-nya
utuh sendiri).

Kenapa Positron dan bukan OSM Bright (style sebelumnya, 2026-08-27): OSM Bright menggambar
jalan kuning-oranye, label cokelat-merah, dan nama POI sampai tingkat warung. Di aplikasi ini
warna adalah DATA — merah = kejadian, teal = fasilitas, ungu = relawan, biru = selesai — jadi
basemap yang ikut berwarna kuat membuat marker berebut perhatian dengan latarnya sendiri.

## Yang diubah dari Positron (empat kelompok)

1. **Air dan taman dikembalikan berwarna.** Positron asli menggambar air abu-abu sehingga
   sungai dan laut tak terbaca sebagai air. `water` → `#c2dae7`, `waterway` → `#a9c6d6`,
   `park` → `#dde9db`, `landcover_wood` → `#dfe7dd`.
2. **Hierarki jalan dikembalikan.** Di Positron asli jalan arteri tampak sama saja dengan gang.
   Tanah digelapkan sedikit (`background` `#eceee9`, `landuse_residential` `#e7e9e3`,
   `building` `#e0e1da`) supaya jalan yang putih menonjol, lalu jalan besar diberi casing yang
   lebih tegas dan sedikit lebih lebar (`highway_major_casing/inner`, `highway_motorway_casing`).
   Label jalan dinaikkan kontrasnya dari `#bbb` ke `#8b9196`.
3. **Label hanya Latin.** Sepuluh layer semula memakai `{name:latin}\n{name:nonlatin}`, yang
   membuat nama POI beraksara Jepang/Rusia/Korea ikut TERGAMBAR DI DALAM TILE. Ini bentuk lain
   dari temuan #83 (`prompt/docs/FINDINGS_LOG.md`) — di sana aksaranya masuk lewat teks halaman,
   di sini lewat gambar peta, dan `accept-language` tetap tidak bisa menolong karena yang
   dipakai adalah tag `name` OSM apa adanya. Semuanya jadi `{name:latin}`.
4. **Fontstack dikunci ke font yang benar-benar kita punya.** Positron menyebut
   `["Metropolis Regular", "Noto Sans Regular"]`; `data/fonts/` cuma berisi Noto Sans. Fallback
   itu memang bekerja, tapi peta tanpa nama jalan adalah kegagalan yang TIDAK melaporkan dirinya
   sendiri (lihat "Jebakan: peta bisu" di `docker/tiles/README.md`), jadi lebih baik tak
   bergantung padanya. Ke-14 layer bertulisan kini menyebut `Noto Sans Regular` / `Noto Sans
   Italic` langsung.

Selain empat kelompok itu, isi style tidak diubah: 50 layer yang sama, sumber `openmaptiles`
yang sama, dan `glyphs`/`sprite` dengan token yang sama.

## Sumber kedua: latar dunia

Style ini membaca DUA sumber. `openmaptiles` (dari `bali.mbtiles`) adalah peta sesungguhnya;
`world` (dari `world.mbtiles`) hanya siluet daratan/laut sedunia z0-8, supaya zoom keluar
tidak menampilkan bidang kosong. Dua layer `world_ocean` & `world_urban` digambar **tepat
setelah `background`** sehingga seluruh layer Bali menimpanya, dan ber-`maxzoom: 13`.

**Jangan naikkan `maxzoom` keduanya ke 14+.** Garis pantai latar itu beresolusi z8; dipaksa
sampai zoom rinci, ia merembes ke daratan dan memuncul laut biru di atas tanah tepi pantai
Sanur/Kuta — dan karena `background` sudah tergambar di bawahnya, tidak ada apa pun yang
mengecatnya kembali jadi darat.

## Kalau mau menyetel ulang

- **Warna & lebar** cukup disunting di `style.json` ini, lalu `docker compose restart tiles`.
  Tidak ada langkah build — `bali.mbtiles` tidak ikut berubah.
- **JANGAN mengubah id style-nya.** Id `sisupit` (di `docker/tiles/config.json`, bukan di berkas
  ini) ada di dalam `MAP_TILE_URL` ketiga environment; menggantinya berarti menyunting tiga
  berkas `.env` di VPS juga. Ganti isi style-nya, jangan namanya.
- **Sesudah menyunting style, naikkan `?v=` di `MAP_TILE_URL`** tiap environment lalu
  `php artisan config:clear`. Tanpa itu perubahan tak akan terlihat oleh siapa pun yang sudah
  pernah membuka peta (tile di-cache browser 30 hari), dan di APK/HP tak ada cara memaksanya.
  Lihat bagian "Mengganti style/mbtiles" di `docker/tiles/README.md`.
- **Sesudah dipasang di VPS, kosongkan cache Nginx** (`/var/cache/nginx/tiles`), kalau tidak
  tile lama masih disajikan sampai kedaluwarsa dan perubahannya terlihat setengah-setengah.
- Pratinjau cepat tanpa aplikasi: `http://localhost:8081/styles/sisupit/#12/-8.6705/115.2126`.

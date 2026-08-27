# Basemap Self-Hosted (TileServer-GL)

Setup ini menggantikan basemap pihak ketiga (CARTO Voyager) di aplikasi SISUPIT dengan tile
server milik sendiri. Aplikasi sudah disiapkan agar cukup ganti satu env var (`MAP_TILE_URL`)
tanpa deploy ulang kode maupun `npm run build` — lihat `config/services.php` dan
`resources/js/lib/utils.js`.

**Kenapa dipindah (2026-08-27):** CARTO mulai mencap SETIAP tile-nya dengan tulisan
"API KEY REQUIRED — carto.com/basemaps/apikey", dan cap itu muncul di seluruh peta aplikasi
di ketiga environment sekaligus. Tidak ada galat, tidak ada tile gagal muat — cuma tulisan
melintang di atas peta. Rinciannya di `prompt/docs/FINDINGS_LOG.md` #92 dan
`prompt/tasks/TASK_46_basemap_self_host_tileserver.md`.

## Bedanya dengan Nominatim & OSRM

Nominatim (`docker/nominatim/`) dan OSRM (`docker/osrm/`) dipanggil **server** Laravel, jadi
cukup mendengarkan di loopback. Tile **ditarik langsung oleh browser pengguna**, jadi tile
server ini WAJIB bisa dicapai publik. Karena itu di VPS ia tidak dibuka lewat portnya sendiri
melainkan lewat Nginx di path `/tiles/` — supaya bisa di-cache, dibatasi ke GET, dan ikut
sertifikat yang sudah ada.

## Quickstart: Bali di lokal (Windows + Docker Desktop)

Prasyarat: Docker Desktop berjalan, dan `docker/nominatim/data/bali.osm.pbf` sudah ada
(hasil `docker\nominatim\extract-bali.ps1`).

1. **Bangun data** — vector tiles + garis pantai + font:
   ```powershell
   powershell -File docker\tiles\prepare-bali.ps1
   ```
   Hasil di `docker/tiles/data/`: `bali.mbtiles` (~40 MB, zoom 0-14), `coastline/` (~2,5 GB
   saat diekstrak, sekali unduh ~900 MB), `landcover/`, dan `fonts/` (~60 MB). Style-nya
   TIDAK ikut diunduh — lihat bagian berikutnya.
2. **Jalankan**:
   ```powershell
   cd docker\tiles
   copy .env.example .env
   docker compose up -d
   ```
3. **Verifikasi** — harus PNG berisi peta Denpasar LENGKAP DENGAN nama jalan:
   ```powershell
   curl "http://localhost:8081/styles/sisupit/13/6717/4293.png" -o tile.png
   ```
4. **Arahkan aplikasi** — di `.env` Laravel:
   ```
   MAP_TILE_URL=http://localhost:8081/styles/sisupit/{z}/{x}/{y}{r}.png
   ```
   ```powershell
   php artisan config:clear
   ```
   Tidak perlu `npm run build` — URL dibaca runtime lewat `window.MAP_TILE_URL`.

## Style peta

Style yang dipakai adalah **Sisupit Light**, dan ia **ikut repo** di
`docker/tiles/style/sisupit-light/` — bukan diunduh seperti font & mbtiles. Alasannya sama
dengan `config.json`: style adalah keputusan rupa, bukan data, sedangkan `data/` diabaikan
git. Ia dipasang ke container lewat bind mount di `docker-compose.yml`, jadi `data/styles/`
boleh kosong.

Turunan Positron v1.9 (BSD-3) yang disetel untuk aplikasi ini: air & taman dikembalikan
berwarna, hierarki jalan dipertegas, seluruh label dipangkas ke Latin, dan fontstack dikunci
ke Noto Sans. Rincian + alasan tiap perubahan ada di
`docker/tiles/style/sisupit-light/README.md`.

Menyetel ulang = sunting satu JSON lalu `docker compose restart tiles`. TANPA membangun
ulang mbtiles, TANPA `npm run build`, TANPA deploy kode. **Tapi jangan mengubah id style-nya**
(`sisupit`, di `config.json`): id itu ada di dalam `MAP_TILE_URL` ketiga environment.

## Garis pantai: kenapa 900 MB itu tidak bisa dilewati

Sampai 2026-08-28 `bali.mbtiles` dibangun **tanpa shapefile garis pantai**, dan akibatnya baru
kelihatan saat peta di-zoom keluar: **laut berwarna persis sama dengan daratan**, sehingga
pulau Bali tak punya bentuk sama sekali — yang terlihat hanya jalan melayang di bidang
abu-abu. Tidak ada galat, tile tetap HTTP 200, dan di zoom kota (z13+) nyaris tak terasa.

Sebabnya: skema OpenMapTiles TIDAK mengambil laut dari PBF. Laut datang dari shapefile
terpisah `coastline/water_polygons.shp`, dan `--bbox` yang dipakai skrip semula justru
jalan pintas supaya tilemaker mau jalan TANPA shapefile itu.

**Jebakan yang lebih halus — ambil versi 4326, bukan 3857.** osmdata menyediakan dua
proyeksi. Tilemaker membaca koordinat shapefile sebagai lintang/bujur apa adanya, jadi versi
3857 (satuan meter, angkanya jutaan) menghasilkan poligon laut sebesar dunia yang justru
**MENUTUPI daratan**: peta tetap terbentuk, tetap 200, tapi seluruh Bali berwarna laut —
kebalikan persis dari gejala sebelumnya. Keduanya lolos pemeriksaan "apakah tile-nya 200?".

Bbox tilemaker juga **sengaja lebih lebar** daripada `docker/nominatim/extract-bali.ps1`.
Angka Nominatim memeluk daratan Bali pas-pasan, sehingga di zoom jauh tepi kotaknya terlihat
sebagai garis lurus di tengah laut. Margin itu menambah LAUT saja — PBF-nya tetap Bali,
jadi cakupan geocoding & rute tidak ikut melebar.

## Dua tileset: Bali yang bekerja, dunia yang cuma jadi latar

`data/bali.mbtiles` (~40 MB, z0-14) adalah peta yang sesungguhnya. Di sampingnya ada
`data/world.mbtiles` (~30 MB, z0-8) yang **hanya siluet daratan & laut sedunia** — tanpa
jalan, tanpa nama tempat, tanpa POI. Gunanya satu: saat peta di-zoom keluar dari Bali,
layar tidak menampilkan bidang kosong. Ia bukan peta yang bisa dipakai bekerja, dan memang
tidak dimaksudkan begitu.

Di dalamnya **tidak ada satu pun data OSM**: `process-coastline.lua` punya `node_function`
dan `way_function` yang kosong, jadi PBF yang dilewatkan ke tilemaker diabaikan seluruhnya
(argumen itu tetap wajib diisi, itu saja sebabnya). Isinya murni dari shapefile garis pantai
yang sudah diunduh untuk `bali.mbtiles`.

Style menyambungkannya lewat sumber kedua (`world`) dan dua layer `fill` yang ber-`maxzoom: 13`,
digambar tepat setelah `background` sehingga **seluruh layer Bali menimpanya**. Nama
source-layer-nya kebetulan sama dengan skema OpenMapTiles (`water`, `landuse`), jadi tak perlu
kosakata baru.

Soal beban server: zoom rendah itu jumlah tile-nya sedikit (satu tile z4 mencakup seperenam
belas dunia) dan isinya beberapa poligon saja, lalu di-cache Nginx seperti tile lain.
Membangunnya ~20 menit CPU sekali seumur hidup data — di server **salin saja berkasnya**,
jangan bangun ulang.

> **Batasnya:** di luar bbox Bali pada z14 ke atas, latar itu berhenti dan layar kembali
> kosong. Disengaja: memaksanya sampai z14 membuat garis pantai kasar z8 merembes ke daratan
> pada zoom rinci — laut biru menutupi tanah di tepi pantai Sanur/Kuta.

## Mengganti style/mbtiles: WAJIB naikkan `?v=` di `MAP_TILE_URL`

Nginx menyajikan tile dengan `expires 30d` (`Cache-Control: max-age=2592000`). Itu memang
disengaja — tile jarang berubah dan render raster memakan CPU. Tapi konsekuensinya keras:
**mengganti style atau mbtiles TIDAK terlihat oleh pengguna yang sudah pernah membuka peta, sampai 30 hari.**

Mengosongkan `proxy_cache` Nginx TIDAK menolong — itu cache SERVER; yang menyimpan tile lama
adalah browser masing-masing pengguna. Di desktop bisa disiasati Ctrl+Shift+R, tapi:

- **di APK (Android WebView) dan browser HP tidak ada gerakan setara**, dan
- bahkan di desktop, hard-refresh hanya menyegarkan tile yang dimuat saat itu; begitu peta
  digeser, tile tetangga tetap diambil dari cache lama sehingga petanya campur baru-lama.

Karena itu URL tile membawa penanda versi:

```
MAP_TILE_URL=https://sisupit.com/tiles/styles/sisupit/{z}/{x}/{y}{r}.png?v=20260828
```

**Setiap kali `style.json` atau `*.mbtiles` berubah, naikkan angka itu** di `.env` tiap
environment lalu `php artisan config:clear`. URL baru = cache miss = semua klien mengambil
tile segar, termasuk APK dan HP, tanpa deploy kode dan tanpa update aplikasi. Halaman HTML
sendiri ber-`Cache-Control: no-cache`, jadi URL barunya sampai ke pengguna pada pemuatan
halaman berikutnya.

> Query itu tidak mengubah gambar: TileServer-GL mengabaikan parameter yang tak dikenalnya.
> (Ukuran berkas PNG-nya bisa berbeda beberapa ratus byte karena hasil render segar dikemas
> ulang, tapi sudah diperiksa **identik piksel demi piksel**.)

## Zoom: data sampai 14, peta sampai 19+

`bali.mbtiles` berisi vector tiles sampai **z14**; di atas itu TileServer-GL menggambar ulang
dari data z14 (overzoom). Karena sumbernya vektor, hasilnya tetap tajam — sudah diuji sampai
z19, dan halaman detail insiden yang zoom-nya paling jauh tetap terbaca. Jangan menaikkan
maxzoom tilemaker "supaya lebih tajam": ukuran mbtiles meledak tanpa perbaikan yang terlihat.

## Jebakan: peta bisu

Kalau `fonts/` tidak ada, tile TETAP tergambar dengan benar — jalan, sungai, blok bangunan —
**tapi tanpa satu pun nama jalan atau desa**, dan tileserver TIDAK melaporkan galat apa pun.
Style bawaan image (`basic-preview`) juga begitu. Jadi kalau peta terlihat "polos", periksa
`data/fonts/` dulu, bukan style-nya.

Ketiga kegagalan basemap sejauh ini sekeluarga: **font hilang — peta tanpa nama**,
**garis pantai hilang — pulau tanpa bentuk**, **garis pantai salah proyeksi — daratan
tertutup laut**. Ketiganya menjawab HTTP 200 dan tak menulis satu baris pun ke log. Karena
itu pemeriksaan yang berguna bukan "apakah tile-nya 200?" melainkan **melihat gambarnya**
di zoom kota DAN zoom pulau.

## Kebutuhan Resource (estimasi)

| | Bali (sekarang) | Indonesia (next step) |
|---|---|---|
| PBF sumber | ~52 MB | ~1-1.5 GB |
| Garis pantai (unduh sekali) | ~900 MB | ~900 MB |
| Garis pantai (diekstrak) | ~2,5 GB | ~2,5 GB |
| mbtiles hasil | ~40 MB | ~5-8 GB |
| world.mbtiles (latar z0-8) | ~30 MB | ~30 MB (sama, sedunia) |
| RAM saat build | ~2 GB | ~8 GB |
| Waktu build | ~1 menit | ~1-2 jam |
| RAM saat menyajikan | ~300-500 MB | ~1 GB |

Render raster memakai CPU. Satu tile z13 ~0,7 detik saat dingin, ~0,1 detik sesudahnya —
karena itu cache Nginx di bawah bukan hiasan.

## Langkah Setup di VPS

Ada skrip siap pakai: **`setup-vps.sh`** (padanan Linux dari `prepare-bali.ps1`, sekaligus
menjalankan containernya). Ia idempoten dan berhenti setelah tile server terbukti melayani,
lalu MENCETAK dua langkah terakhir (Nginx & `.env` aplikasi) untuk ditinjau manusia —
keduanya sengaja tidak diotomatiskan karena satu kekeliruan di sana menjatuhkan tiga domain
sekaligus.

```bash
mkdir -p /opt/geo/tiles && cd /opt/geo/tiles
# salin dari repo: docker-compose.yml, config.json, config-world.json, .env.example, setup-vps.sh, style/
cp .env.example .env && nano .env      # isi TILES_PUBLIC_URL=https://sisupit.com/tiles/
bash setup-vps.sh
```

Kalau ingin menjalankan langkahnya satu per satu:

1. Siapkan data:
   ```bash
   cd /opt/geo/tiles          # sepola dengan nominatim & osrm yang sudah di /opt/geo
   mkdir -p data/styles data/fonts data/coastline data/landcover

   # PBF: pakai ulang milik Nominatim bila sudah ada. Kalau tidak ada, unduh region
   # NUSA TENGGARA — Geofabrik tidak punya ekstrak "bali" tersendiri (URL semacam itu
   # dijawab 200 lalu dialihkan ke halaman depan, jadi yang tersimpan malah HTML).
   cp /opt/geo/nominatim/data/bali.osm.pbf data/ 2>/dev/null || \
     curl -fL -o data/bali.osm.pbf https://download.geofabrik.de/asia/indonesia/nusa-tenggara-latest.osm.pbf
   head -c 64 data/bali.osm.pbf | grep -qa OSMHeader || echo 'BUKAN PBF yang sah!'

   # Garis pantai WAJIB versi 4326 (lihat bagian "Garis pantai" di atas).
   # Lebih cepat: salin saja bali.mbtiles (~40 MB) dari mesin yang sudah membangunnya,
   # maka seluruh langkah ini beserta unduhan 900 MB-nya bisa dilewati.
   curl -fL -o /tmp/wp.zip https://osmdata.openstreetmap.de/download/water-polygons-split-4326.zip
   unzip -oq /tmp/wp.zip -d /tmp/wp && find /tmp/wp -name "water_polygons.*" -exec cp {} data/coastline/ ";"

   # -w /data WAJIB: config bawaan merujuk shapefile secara RELATIF terhadap direktori kerja.
   docker run --rm -w /data -v "$PWD/data:/data" ghcr.io/systemed/tilemaker:master \
     /data/bali.osm.pbf /data/bali.mbtiles \
     --bbox 113.80,-9.40,116.30,-7.60 \
     --config /usr/src/app/resources/config-openmaptiles.json \
     --process /usr/src/app/resources/process-openmaptiles.lua

   # Style TIDAK diunduh — pastikan folder style/ dari repo ikut tersalin ke server.
   [ -f style/sisupit-light/style.json ] || echo "style/ belum disalin dari repo!"

   curl -sL -o /tmp/fonts.zip https://github.com/openmaptiles/fonts/releases/download/v2.0/noto-sans.zip
   unzip -oq /tmp/fonts.zip -d data/fonts
   ```
2. Salin `docker-compose.yml`, `config.json`, `config-world.json`, `.env.example`, dan
   folder `style/` ke folder itu. Salin juga `data/world.mbtiles` (~30 MB) dari mesin yang
   sudah membangunnya — membangun ulang di server memakan ~20 menit CPU untuk hasil yang
   sama persis. Lalu isi `.env`:
   ```
   MBTILES_FILENAME=bali.mbtiles
   TILES_HOST_PORT=8081
   TILES_PUBLIC_URL=https://sisupit.com/tiles/
   ```
   `TILES_PUBLIC_URL` wajib benar — TileJSON memakainya untuk menyusun URL tile.
3. `docker compose up -d`
4. **Nginx** — sajikan di `/tiles/` dengan cache. Di `http {}` (mis. `nginx.conf`):
   ```nginx
   proxy_cache_path /var/cache/nginx/tiles levels=1:2 keys_zone=tiles:50m
                    max_size=5g inactive=30d use_temp_path=off;
   ```
   Di server block tiap domain:
   ```nginx
   location /tiles/ {
       proxy_pass http://127.0.0.1:8081/;
       proxy_set_header Host $host;
       proxy_cache tiles;
       proxy_cache_valid 200 30d;
       proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
       add_header X-Tile-Cache $upstream_cache_status;
       expires 30d;
       # Tile server hanya untuk dibaca — tolak selain GET/HEAD.
       limit_except GET HEAD { deny all; }
   }
   ```
5. **Arahkan aplikasi** — di `.env` masing-masing environment:
   ```
   MAP_TILE_URL=https://sisupit.com/tiles/styles/sisupit/{z}/{x}/{y}{r}.png
   ```
   lalu `php artisan config:clear` (TANPA rebuild frontend, TANPA deploy kode).

6. **Kosongkan cache tile** setiap kali style diganti, kalau tidak tile lama masih disajikan
   sampai kedaluwarsa dan perubahannya terlihat setengah-setengah:
   ```bash
   rm -rf /var/cache/nginx/tiles/* && systemctl reload nginx
   ```

> **Next step (seluruh Indonesia):** ganti PBF sumber ke `indonesia-latest.osm.pbf`
> (Geofabrik), hapus `--bbox` atau sesuaikan, lalu ubah `MBTILES_FILENAME`. Perhatikan tabel
> resource di atas.

## Lisensi & atribusi

Data peta berasal dari OpenStreetMap (ODbL) — atribusi WAJIB tampil di peta. Semua pemanggilan
`L.tileLayer` di aplikasi memasang `attribution` yang menyebut OpenStreetMap; jangan
menghapusnya. Style Sisupit Light: turunan Positron — BSD-3-Clause (openmaptiles/positron-gl-style).

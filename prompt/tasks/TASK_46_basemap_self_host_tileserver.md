# TASK 46 — Basemap bercap "API KEY REQUIRED": pindah ke tile server sendiri
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_46 |
| Severity | P1 (seluruh peta di ketiga environment tercoret tulisan pihak ketiga) |
| Tipe | bugfix + infrastruktur |
| Sumber | Laporan user 2026-08-27 ("di maps muncul api key required carto.com") → FINDINGS #92 |
| Status | DONE |

---

## 1. Deskripsi masalah / tujuan

Semua peta Leaflet di aplikasi menampilkan tulisan miring besar
**"API KEY REQUIRED — carto.com/basemaps/apikey"** di atas petanya. Petanya sendiri masih
tergambar (jalan, nama desa, marker kita) — yang berubah cuma tile-nya kini bercap.

Tujuan: peta kembali bersih DAN tidak lagi bergantung pada basemap pihak ketiga yang bisa
sewaktu-waktu mengubah kebijakannya. Keputusan user 2026-08-27: **self-host TileServer-GL**
di VPS, sepola dengan Nominatim (`docker/nominatim/`) & OSRM (`docker/osrm/`) yang memang
sudah self-host di server yang sama.

## 2. Reproduce (bukti masalah ada)

Tarik satu tile Denpasar (z=13, x=6717, y=4293) langsung dari CARTO:

```
curl -o t.png "https://a.basemaps.cartocdn.com/rastertiles/voyager/13/6717/4293.png"
```

HTTP 200, 34 KB, dan gambarnya adalah peta Denpasar asli **bertuliskan "API KEY REQUIRED"**
melintang di tengah. Jadi ini bukan galat aplikasi, bukan pula tile gagal muat — CARTO
sengaja menyajikan tile bercap untuk pemakaian tanpa API key.

Cakupannya bukan cuma mesin lokal. Ketiga environment live menyuntikkan URL CARTO:

```
curl -s https://sisupit.com/login       | grep -o 'window.MAP_TILE_URL = [^<]*'
curl -s https://staging.sisupit.com/... | (sama)
curl -s https://dev.sisupit.com/...     | (sama)
→ ketiganya: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
```

## 3. Root cause

`MAP_TILE_URL` **tidak pernah diisi di environment mana pun** — di `.env` lokal barisnya
masih dikomentari (`.env:119-120`), dan ketiga `.env` VPS juga tak memuatnya. Karena itu
semua peta jatuh ke nilai cadangan:

- `config/services.php:78` — `env('MAP_TILE_URL', 'https://{s}.basemaps.cartocdn.com/...')`
- `resources/js/lib/utils.js:18-19` — `CARTO_VOYAGER`, cadangan sisi klien bila
  `window.MAP_TILE_URL` kosong.

Mekanisme runtime-inject-nya sendiri (TASK_25) justru bekerja dengan benar; yang keliru
adalah **isi cadangannya**. Cadangan yang menunjuk layanan pihak ketiga tanpa akun berarti
aplikasi berjalan selamanya di atas kebaikan hati pihak itu, dan ketika kebijakannya
berubah, ke-15 peta berubah bersamaan tanpa satu pun galat di log.

## 4. Rencana fix

### Bagian A — tile server sendiri (inti task)
- `docker/tiles/` **BARU**, meniru bentuk `docker/osrm/`:
  - `docker-compose.yml` — TileServer-GL menyajikan raster dari mbtiles vektor.
  - `.env.example` + `.env` — nama berkas mbtiles & port host.
  - `prepare-bali.ps1` — bangun `bali.mbtiles` dari `bali.osm.pbf` lewat tilemaker
    (MEMAKAI ULANG PBF milik Nominatim, persis seperti yang dilakukan `docker/osrm/`).
  - `README.md` — Bahasa Indonesia, langkah lokal + langkah VPS.
- VPS: jalankan di `/opt/geo` (tempat Nominatim & OSRM sudah tinggal), pasang blok Nginx
  `/tiles/` + proxy cache, lalu isi `MAP_TILE_URL` di ketiga `.env`.

### Bagian B — cadangan yang jujur
- `config/services.php` + `resources/js/lib/utils.js` — cadangan tak lagi menunjuk CARTO.

### Bagian C — atribusi (temuan ikutan)
- Dari 15 pemanggilan `tileLayer`, hanya 5 yang memasang `attribution`. Tile OSM
  mewajibkan atribusi, jadi 10 peta sisanya perlu ikut.

## 5. Blast radius

15 titik peta di 14 berkas (`UserLeafletMap` + 13 halaman). Semua membaca satu konstanta
`MAP_TILE_URL`, jadi perubahan URL-nya tidak menyentuh satu pun logika peta — marker,
rute OSRM, koreksi pin, dan layer Peta Pemantauan tak terpengaruh.

Yang perlu diawasi: tile ditarik **browser**, bukan server, jadi tile server WAJIB publik
(beda dengan Nominatim/OSRM yang cukup loopback). Ini menambah permukaan publik baru di
VPS — harus dibatasi ke penyajian tile saja.

## 6. Rencana verifikasi
- [ ] Baseline `php artisan test` sebelum & sesudah (baseline saat ini: 340 passed)
- [ ] Tile server lokal menyajikan tile Denpasar yang benar & tanpa cap
- [ ] `npm run build` lulus
- [ ] Ketiga env: `window.MAP_TILE_URL` menunjuk tile sendiri, tile HTTP 200
- [ ] Visual: buka Peta Pemantauan & detail insiden, pastikan peta bersih

## 7. Rollback

Kembalikan `MAP_TILE_URL` ke nilai sebelumnya (atau kosongkan) + `php artisan config:clear`.
Karena URL dibaca runtime, rollback **tidak butuh deploy kode maupun rebuild**.

---

## Acceptance criteria
- [ ] Tak ada lagi cap "API KEY REQUIRED" di peta mana pun
- [ ] Aplikasi tidak lagi bergantung basemap pihak ketiga tanpa akun
- [ ] Tidak ada regresi (test >= 340 passed)
- [ ] `prompt/docs/ARCHITECTURE_MAP.md` (baris "Basemap tiles") + FINDINGS #92 diperbarui

---

## 8. Catatan pengerjaan (2026-08-27)

### Yang SUDAH selesai & terbukti (lokal)
- `docker/tiles/` dibuat: `docker-compose.yml`, `config.json`, `.env.example`, `.env`,
  `prepare-bali.ps1`, `README.md`, `data/.gitignore`.
- `bali.mbtiles` dibangun dari `bali.osm.pbf` milik Nominatim lewat tilemaker
  (bbox Bali SAMA dengan `extract-bali.ps1`) — 37 MB, z0-14.
- TileServer-GL berjalan di `localhost:8081`, style id `sisupit` (OSM Bright).
  Diuji z13 s/d z19: semua HTTP 200, overzoom di atas z14 tetap tajam.
- Cadangan CARTO dibuang dari `config/services.php` & `resources/js/lib/utils.js`
  (diganti tile OSM resmi sebagai jaring pengaman, BUKAN sumber produksi).
- `.env` lokal & `.env.example` diarahkan ke tile server sendiri.
- Atribusi OpenStreetMap dipasang di 9 peta yang belum punya (total kini 14/14).
- Test **340 passed (1284 assertions)** = baseline, `npm run build` lulus.

### Keputusan yang mengikat (jangan dibalik tanpa membaca ini)
1. **`--bbox` WAJIB** saat menjalankan tilemaker. Tanpa itu ia berhenti dengan
   "Can't read shapefiles unless a bounding box is provided" TAPI **exit code-nya 0** —
   jadi skrip yang tidak memeriksa keberadaan berkas hasilnya akan mengira sukses.
   `prepare-bali.ps1` karena itu memeriksa `Test-Path` hasilnya, bukan cuma `$LASTEXITCODE`.
2. **Font harus dipasang sendiri.** Tanpa `data/fonts/`, tile tetap tergambar rapi tapi
   TANPA satu pun nama jalan/desa, dan tak ada galat apa pun. Style bawaan image
   (`basic-preview`) juga tak punya hierarki jalan. Keduanya = "peta bisu" yang lolos
   pemeriksaan "apakah tile-nya 200?".
3. **`config.json` sengaja di LUAR `data/`** karena `data/` diabaikan git (mengikuti pola
   `docker/nominatim/data/.gitignore`), sedangkan config adalah kode yang harus ikut repo.
   Ia di-mount terpisah sebagai `:ro`.
4. **Style id `sisupit`** menentukan URL tile. Mengubahnya = mengubah `MAP_TILE_URL` di
   SEMUA environment; jangan diganti tanpa alasan.
5. **Tile server WAJIB publik** — beda dari Nominatim/OSRM yang cukup loopback, karena tile
   ditarik browser pengguna. Di VPS: Nginx `/tiles/` + `proxy_cache` + `limit_except GET HEAD`.

### SISA (butuh akses VPS)
- [ ] Pasang `docker/tiles` di VPS (`/opt/geo/tiles`), bangun mbtiles di sana
- [ ] Blok Nginx `/tiles/` + `proxy_cache` di ketiga domain
- [ ] Isi `MAP_TILE_URL` di ketiga `.env` + `php artisan config:clear`
- [ ] Verifikasi: `window.MAP_TILE_URL` ketiga domain + tile HTTP 200 + peta bersih
- [ ] (Terpisah) commit + deploy perubahan kode; TIDAK mendesak karena perbaikan peta
      cukup lewat env var

### Tambahan 2026-08-27 (lanjutan, sambil menunggu akses VPS)

- **`docker/tiles/setup-vps.sh` BARU** — padanan Linux dari `prepare-bali.ps1` sekaligus
  menjalankan containernya. Idempoten. Ia **berhenti** setelah tile server terbukti melayani,
  lalu MENCETAK dua langkah terakhir (blok Nginx + baris `MAP_TILE_URL`) untuk dikerjakan
  manusia. Keduanya sengaja tidak diotomatiskan: Nginx dan `.env` adalah berkas milik server
  yang sedang melayani tiga domain, dan satu skrip yang salah menyunting keduanya bisa
  menjatuhkan ketiganya sekaligus.
- **Cacat yang ketahuan saat mengujinya:** URL cadangan PBF yang semula ditulis
  `asia/indonesia/bali-latest.osm.pbf` **tidak ada di Geofabrik**. Yang berbahaya bukan
  ketiadaannya, melainkan cara gagalnya: Geofabrik menjawab **HTTP 200** lalu mengalihkan ke
  halaman depan, sehingga `curl -fL` sukses menyimpan **HTML** bernama `.osm.pbf` dan
  tilemaker baru gagal jauh kemudian dengan pesan yang tak menunjuk sebabnya. Diganti region
  `asia/indonesia/nusa-tenggara-latest.osm.pbf` — poligon resminya (lon 114,409-128,408,
  lat -11,607..-6,676) sudah diperiksa memuat titik Denpasar, dan tilemaker memangkasnya ke
  `$BBOX` sehingga hasilnya tetap Bali saja. Skrip kini juga memverifikasi berkasnya benar
  PBF (`head -c 64 | grep -qa OSMHeader`) sebelum dipakai; diuji terhadap PBF asli (lulus)
  dan terhadap HTML palsu (ditolak).
- Konstruksi shell yang dipakai skrip (`df -BG --output=avail`, `grep -oP`, `seq`) diuji di
  container `debian:bookworm-slim`, bukan hanya di Git Bash — ketiganya berperilaku benar.
- `data/config.json` sisa percobaan dibuang. Yang berlaku adalah `docker/tiles/config.json`
  yang di-mount `:ro` ke `/data/config.json`.
- Pemeriksaan cakupan git: yang ikut repo TEPAT 7 berkas (`.env.example`, `README.md`,
  `config.json`, `data/.gitignore`, `docker-compose.yml`, `prepare-bali.ps1`, `setup-vps.sh`).
  `bali.mbtiles`, `bali.osm.pbf`, `fonts/`, `styles/`, dan `.env` terabaikan — sesuai pola
  `docker/nominatim/data/.gitignore`.
- Verifikasi ulang sesudah semua perapian: `styles.json` tetap menyajikan id `sisupit`,
  tile z13 = 200 (36 KB), z17 = 200 (23 KB).
- `vendor/bin/pint --test` **PASS (284 berkas)**. Aplikasi lokal `sisupit.test` menyuntikkan
  `window.MAP_TILE_URL` ke tile server sendiri.

---

## 9. TERPASANG DI VPS — 2026-08-27

Dikerjakan langsung di server atas permintaan user ("jalan B").

### Kejutan yang ditemukan di server (tidak terlihat dari repo)
1. **Port 8081 TIDAK bebas.** Port 8080, 8081, DAN 8082 ketiganya sudah dipakai tiga instance
   **Reverb** (prod/staging/dev). Tile server karena itu memakai **8083** di VPS. Ikutannya:
   `docker-compose.yml` kini mengikat ke **127.0.0.1** saja — sepola `sisupit-nominatim`
   (127.0.0.1:8088) & `sisupit-osrm` (127.0.0.1:5000) — bukan `0.0.0.0`. Yang menyajikan ke
   publik cuma Nginx.
2. **Healthcheck `wget` gagal selamanya.** Image `maptiler/tileserver-gl` tak membawa `wget`
   MAUPUN `curl`, jadi container berlabel **unhealthy** padahal melayani tile dengan benar.
   Status palsu semacam itu lebih berbahaya daripada tak ada healthcheck sama sekali — ia
   menyesatkan pemeriksaan berikutnya. Diganti `node -e "fetch(...)"` (node ada di image);
   kedua container (VPS & lokal) kini `healthy`.
3. **`nginx.conf` tak perlu disunting.** Ia sudah meng-`include /etc/nginx/conf.d/*.conf` di
   dalam blok `http{}`, jadi `proxy_cache_path` masuk sebagai berkas BARU
   `/etc/nginx/conf.d/sisupit-tiles-cache.conf` — satu berkas milik kita sendiri, bukan
   tambalan di berkas bawaan distro.

### Yang dijalankan
- `/opt/geo/tiles` (sepola `/opt/geo/nominatim` & `/opt/geo/osrm`). PBF dipakai ulang dari
  `/opt/geo/nominatim/data/bali.osm.pbf` — tidak mengunduh apa pun. Data: 191 MB.
- `location /tiles/` disisipkan ke KETIGA situs lewat skrip idempoten `add_tiles_location.py`,
  masing-masing dicadangkan lebih dulu (`*.bak-tiles-20260827-115916`). `nginx -t` dijalankan
  SEBELUM reload.
- `MAP_TILE_URL` diisi di ketiga `.env` (cadangan `.env.bak-tiles-*`), tiap environment
  menunjuk **domainnya sendiri** supaya staging & dev tidak bergantung pada domain prod.
- `php artisan config:clear` di ketiganya. **TANPA `npm run build`, TANPA deploy kode,
  TANPA migrasi, TANPA sentuhan DB.**

### Verifikasi sesudahnya
- Ketiga domain menyuntikkan `window.MAP_TILE_URL` ke tile server sendiri; **0 rujukan
  `cartocdn`** tersisa di ketiganya.
- Tile nyata dari ketiga domain: HTTP 200, 36.715 B. `@2x` (retina) 200. z17 prod diperiksa
  visual: bersih tanpa cap, lengkap dengan "Jalan Veteran", "Gang VII", "Pura Pasar Burung
  Kota Denpasar".
- `POST /tiles/` → **403** (`limit_except GET HEAD`).
- `x-tile-cache: HIT` aktif; cache Nginx terisi.
- nginx, php8.2-fpm, reverb, reverb-staging, reverb-dev, docker: semuanya `active`.
  Ketiga container geo `restart=unless-stopped` & docker `enabled` → selamat dari reboot.
- 0 ERROR baru di log Laravel prod, log error Nginx bersih.
- Disk 29% terpakai (35 G bebas).

### Catatan
Sempat terlihat satu kali `404` di prod pada uji pertama — itu permintaan yang beririsan
dengan `systemctl reload nginx`; pengujian ulang langsung 200 dan konsisten sejak itu.

**Status task: DONE.** Perubahan kode di repo (cadangan non-CARTO + atribusi + `docker/tiles/`)
BELUM di-commit & belum dideploy — sengaja, karena perbaikan petanya murni lewat env var.
Deploy kodenya bisa ikut rilis berikutnya seperti biasa.

---

## 10. LANJUTAN RUPA — style "Sisupit Light" (2026-08-28)

Permintaan user: *"untuk tampilan tiles sekarang apakah bisa diperbaiki dan diganti
stylenya?"* — lalu, setelah disodori lima kandidat berpratinjau: **"gunakan sisupit light"**.

### Kenapa style lama layak diganti (bukan soal selera)
Di aplikasi ini **warna adalah data**: merah = kejadian, teal = fasilitas, ungu = relawan,
biru = selesai. OSM Bright menggambar jalan kuning-oranye, label cokelat-merah, batas wilayah
ungu putus-putus, dan nama POI sampai tingkat warung — basemap ikut berbicara di ruang warna
yang sudah dipegang marker. Ditambah satu cacat yang lebih konkret: **16 layernya memakai**
`{name:latin}` + `{name:nonlatin}`, sehingga nama POI beraksara Jepang/Rusia/Korea IKUT
TERGAMBAR DI DALAM TILE. Itu bentuk lain dari temuan #83, dan di sini **tak bisa disaring dari
sisi aplikasi sama sekali** — aksaranya sudah jadi piksel sebelum sampai ke browser.

### Apa yang dipasang
**Sisupit Light** = turunan **Positron v1.9** (BSD-3, openmaptiles) dengan empat kelompok
perubahan, yang alasannya masing-masing ditulis di
`docker/tiles/style/sisupit-light/README.md`:
1. air & taman dikembalikan berwarna (Positron asli menggambar air abu-abu — sungai dan laut
   tak terbaca sebagai air);
2. hierarki jalan dikembalikan (tanah digelapkan sedikit supaya jalan yang putih menonjol,
   jalan arteri diberi casing lebih tegas, label jalan dinaikkan kontrasnya);
3. seluruh label jadi `{name:latin}` (10 layer);
4. fontstack DIKUNCI ke Noto Sans, tidak lagi menumpang fallback dari Metropolis yang tidak
   kita punya.

### Keputusan yang mengikat
1. **Style ikut REPO** di `docker/tiles/style/sisupit-light/` (~50 KB: `style.json` + 4 berkas
   sprite), dipasang lewat bind mount `./style/sisupit-light:/data/styles/sisupit-light:ro`.
   Alasannya persis sama dengan `config.json` (keputusan #3 di atas): `data/` diabaikan git,
   sedangkan style adalah keputusan rupa — kode, bukan data. Konsekuensinya `data/styles/`
   kini boleh kosong, dan **kedua skrip penyiapan berhenti mengunduh style** (font tetap
   diunduh). `setup-vps.sh` kini justru BERHENTI kalau folder style-nya lupa disalin — tanpa
   pemeriksaan itu tileserver tetap hidup dan tetap menjawab, tapi SEMUA tile dijawab 404.
2. **Id style TETAP `sisupit`** (keputusan #4 di atas tidak dibatalkan). Karena itu perubahan
   ini **tidak menyentuh `.env` mana pun** — `MAP_TILE_URL` ketiga environment tetap sah apa
   adanya. Ganti isi style, jangan namanya.
3. **Sprite ikut disalin** dari Positron meski isinya cuma dua ikon (`circle-11`, `star-11`,
   hanya terpakai di bawah z8 dan praktis tak pernah terlihat di aplikasi ini) supaya style-nya
   utuh sendiri dan tidak diam-diam bergantung pada folder style lain.
4. **Cache Nginx wajib dikosongkan** sesudah dipasang di server. Kalau tidak, tile lama masih
   disajikan dari `proxy_cache` sampai kedaluwarsa dan perubahannya terlihat setengah-setengah
   — gejala yang mudah disalahartikan sebagai "style gagal dipasang".

### Verifikasi lokal (2026-08-28)
- `data/styles/` DIKOSONGKAN lebih dulu, lalu container dijalankan ulang: `styles.json`
  menyajikan tepat satu style, id `sisupit`, nama "Sisupit Light" — bukti bind mount-nya
  bekerja dan tak ada sisa style lama yang menutupi.
- Tile z13 = 200 (26 KB), z16 = 200 (23 KB), z18 = 200, `@2x` z13 = 200 (67 KB).
- Diperiksa VISUAL, bukan cuma status: nama jalan & gang tergambar (Jalan Gajah Mada, Jalan
  Werkudara, Gang I s/d IV) — penjaga terhadap "peta bisu" (keputusan #2 di atas).
- Container `healthy`. Test **348 passed (1350 assertions)** = baseline; tak ada satu pun
  berkas aplikasi (PHP/JSX) yang disentuh, jadi tak ada `npm run build` maupun migrasi.

### SISA
- [ ] User memeriksa rupanya di aplikasi lokal (Peta Pemantauan, detail insiden, form lapor)
- [ ] Pasang di VPS: salin `style/` + `config.json` + `docker-compose.yml` yang baru ke
      `/opt/geo/tiles`, `docker compose up -d`, lalu **kosongkan `/var/cache/nginx/tiles`**
- [ ] Verifikasi ketiga domain: tile 200, peta bernama, `x-tile-cache` kembali HIT

---

## 11. TAMPILAN SEPULAU BALI — tiga sebab, satu di antaranya bukan style (2026-08-28)

Laporan user: *"tampilan full pulau balinya sangat jelek, terlalu rame, dan apa maksud
angka2 tersebut di maps?"* Tiga sebab terpisah, ditemukan dengan MELIHAT gambarnya di z9,
z10, z11, dan z12 — bukan dari status HTTP, yang sepanjang waktu 200.

### (A) Angka-angka itu = nomor rute jalan
Layer `highway_name_motorway` memakai `text-field: {ref}`, yaitu kode rute nasional/tol dari
OSM (di Bali muncul sebagai "1" di tol Mandara). Style ini tidak punya sprite perisai jalan,
jadi angkanya tergambar TELANJANG di tengah jalan tanpa konteks apa pun. **Layer dibuang seluruhnya** — bagi responder nomor rute tak berguna; yang dipakai nama jalan.

### (B) Terlalu ramai = label tempat tanpa `minzoom`
Positron asli TIDAK memberi `minzoom` sama sekali pada `place_village`, `place_suburb`, dan
`place_other`. Di tile global upstream hal itu tersamar; di tile Bali kita, ratusan nama desa
mulai berdesakan sejak z9 sampai tak ada ruang tersisa. Kini: desa dari z11, suburb z12,
dusun/banjar z13, kota z8, dan ukuran hurufnya mengecil di zoom jauh.

### (C) Yang membuatnya benar-benar jelek: TIDAK ADA GARIS PANTAI
Ini bukan soal style — `bali.mbtiles` memang dibangun tanpa poligon laut, jadi laut
berwarna PERSIS sama dengan daratan dan pulau Bali tak punya bentuk sama sekali. Style mana
pun akan sama jeleknya; OSM Bright pun begitu, cuma tertutup keramaian warnanya.

Akarnya ada di keputusan #1 task ini sendiri: `--bbox` dipakai sebagai **jalan pintas supaya
tilemaker mau jalan tanpa shapefile pantai/landcover yang tidak diunduh**. Yang tercatat waktu
itu cuma "tilemaker menolak jalan tanpa bbox"; yang tidak tercatat adalah apa yang HILANG
karena shapefilenya absen. Skema OpenMapTiles tidak mengambil laut dari PBF — laut selalu
datang dari `coastline/water_polygons.shp`.

**Jebakan kedua, ditemukan saat memperbaiki yang pertama:** osmdata menyediakan shapefile itu
dalam dua proyeksi. Percobaan pertama memakai **3857** (satuan meter) — tilemaker membaca
koordinat shapefile sebagai lintang/bujur apa adanya, jadi poligon lautnya membesar sebesar
dunia dan **MENUTUPI daratan**: seluruh Denpasar berwarna laut, dengan daratan hanya menyembul
di tempat yang kebetulan punya bangunan. Kebalikan persis dari gejala semula, dan sama-sama
menjawab HTTP 200. Yang benar **4326**.

### Pelajaran yang mengikat
1. **Ketiga kegagalan basemap sejauh ini sekeluarga:** font hilang — peta tanpa nama;
   pantai hilang — pulau tanpa bentuk; pantai salah proyeksi — daratan tertutup laut.
   Ketiganya HTTP 200, nol baris log. Karena itu pemeriksaan yang berguna bukan "apakah
   tile-nya 200?" melainkan **melihat gambarnya di zoom kota DAN zoom pulau**. Kedua skrip
   penyiapan kini mencetak perintah uji zoom pulau, bukan cuma z13.
2. **Sebuah flag yang dipakai untuk MELEWATI prasyarat harus mencatat apa yang hilang.**
   `--bbox` di sini bukan sekadar pembatas wilayah; ia menyembunyikan ketiadaan data laut
   selama empat hari tanpa gejala.
3. **Bbox tile SENGAJA lebih lebar** daripada `extract-bali.ps1` (113.80,-9.40,116.30,-7.60
   vs 114.40,-8.90,115.75,-8.03). Angka Nominatim memeluk daratan pas-pasan sehingga tepi
   kotaknya terlihat sebagai garis lurus di tengah laut saat zoom keluar. Margin ini menambah
   LAUT saja — PBF-nya tetap Bali, jadi cakupan geocoding & rute TIDAK ikut melebar dan
   tetap sepadan dengan Nominatim/OSRM. Aturan "bbox harus sama" di keputusan #1 karena itu
   diperlunak: yang wajib sama adalah cakupan DATA, bukan margin lautnya.
4. **Shapefile ditaruh di `data/coastline/` & `data/landcover/`, dan container dijalankan
   dengan `-w /data`.** Config bawaan tilemaker merujuk kedua folder itu secara RELATIF, jadi
   dengan direktori kerja yang benar config-nya **tidak perlu disunting sama sekali** —
   percobaan pertama sempat menyalin config ke repo dan menulis ulang path-nya jadi absolut,
   dan salinan seperti itu akan basi diam-diam begitu image tilemaker diperbarui.

### Verifikasi (2026-08-28)
- z9 sepulau: laut BIRU, Bali berbentuk, Nusa Penida & ujung Jawa terlihat, tanpa tepi kotak.
- z12 Denpasar: daratan tetap darat (uji balik terhadap jebakan 3857).
- z15 Sanur: garis pantai rinci mengikuti tepian sungguhan, nama jalan utuh.
- z16 Gajah Mada: nama jalan & gang utuh, 0 angka rute.
- mbtiles 37 MB — 40 MB. Test **348 passed** (tak ada berkas aplikasi yang disentuh).

### SISA
- [ ] User memeriksa rupanya di aplikasi lokal
- [ ] VPS: salin `bali.mbtiles` (~40 MB) yang sudah jadi + `style/` + `config.json` +
      `docker-compose.yml`, lalu **kosongkan `/var/cache/nginx/tiles`**. Menyalin mbtiles jauh
      lebih murah daripada mengunduh 900 MB garis pantai di server.

---

## 12. LATAR SEDUNIA saat zoom keluar (2026-08-28)

Permintaan user setelah melihat hasil §11: *"apakah bisa agar peta indonesia tetap muncul saat
di zoom out, namun hanya gambar saja agar tidak kosong tapi tidak berfungsi supaya tidak
membebani server"*. Persis bisa, dan tilemaker sudah menyediakan modenya.

### Bentuknya
`data/world.mbtiles` BARU (~30 MB, z0-8 sedunia) dibangun dengan `process-coastline.lua`
bawaan image + `docker/tiles/config-world.json` (BARU, ikut repo). Isinya **hanya siluet
daratan & laut** — tanpa jalan, nama tempat, atau POI. **Nol data OSM**:
`node_function` & `way_function` di lua itu kosong, jadi PBF yang dilewatkan diabaikan
seluruhnya; ia tetap wajib diisi hanya karena tilemaker menuntut argumen input.

Style menyambungkannya sebagai sumber KEDUA (`world`) dengan dua layer `fill` yang digambar
tepat setelah `background`, jadi seluruh layer Bali menimpanya. Source-layer-nya kebetulan
bernama sama dengan skema OpenMapTiles (`water`, `landuse`), sehingga tak lahir kosakata baru.

### Keputusan yang mengikat
1. **`maxzoom: 13` pada kedua layer latar, jangan dinaikkan.** Sempat diuji tanpa batas: garis
   pantai latar beresolusi z8, dan dipaksa ke zoom rinci ia merembes ke daratan sehingga laut
   biru menutupi tanah di tepi Sanur/Kuta. Karena layar sudah dicat `background` di bawahnya,
   tak ada apa pun yang mengecatnya kembali jadi darat. Harga yang diterima: di luar bbox Bali
   pada z14+ layar kembali kosong — dan itu memang wilayah yang tak kita punya datanya.
2. **`config-world.json` ikut repo**, berbeda dengan `config-openmaptiles.json` yang dipakai
   apa adanya dari image. Pembedanya: yang ini PENDEK dan kita ubah dengan sengaja (maxzoom
   14 — 8; layer gletser & es Antartika dibuang karena shapefilenya tak diunduh dan pesan
   "Unable to open" darinya menyamar sebagai kesalahan pemasangan di log). Menyalin config
   100 KB yang dipakai apa adanya justru berbahaya — salinannya basi diam-diam saat image
   tilemaker diperbarui.
3. **Ke server: SALIN `world.mbtiles`, jangan bangun ulang.** Membangunnya ~20 menit CPU
   untuk hasil yang sama persis di environment mana pun. `setup-vps.sh` karena itu tidak
   membangunnya diam-diam; ia memperingatkan dan mencetak perintah salinannya.

### Verifikasi (2026-08-28)
- z3/z5/z7 = 200: seluruh Nusantara tergambar sebagai siluet (Sumatra s/d Papua), laut biru.
- z9 di Bali: tak ada jahitan — identik dengan sebelum latar dipasang.
- z12 & z13 Sanur: garis pantai tetap akurat, **nol rembesan biru di daratan**.
- z10 di Lombok (di LUAR bbox Bali): dulu bidang kosong, kini siluet pulau.
- Ukuran: 29,5 MB. Waktu bangun: 21m42s (sekali).

---

## 13. TERPASANG DI PROD/STAGING/DEV — 2026-08-28

Style **Sisupit Light** + `bali.mbtiles` bergaris pantai + `world.mbtiles` (latar) dipasang di
ketiga environment atas perintah user. **TANPA deploy kode, TANPA rebuild frontend, TANPA
migrasi, TANPA sentuhan DB** — `/var/www/sisupit` tetap di commit `ead12f76`, sama seperti
sebelum pemasangan. Ketiga `.env` juga TIDAK disentuh: id style tetap `sisupit`, jadi
`MAP_TILE_URL` yang lama tetap sah (lihat keputusan #4 & §10).

### Cadangan sebelum menyentuh apa pun (stempel 20260827-212427)
- `/opt/geo/tiles/config.json.bak-*`, `docker-compose.yml.bak-*`, `data/bali.mbtiles.bak-*`
- `data/styles/osm-bright/` SENGAJA dibiarkan di server. Itu jalan mundur satu langkah:
  kembalikan `config.json` dari cadangan (menunjuk `osm-bright/style-local.json`) lalu
  `docker compose up -d`, tanpa perlu mengunduh apa pun.

### Yang disalin (bukan dibangun di server)
`docker-compose.yml`, `config.json`, `config-world.json`, `README.md`, `setup-vps.sh`,
`style/sisupit-light/` (6 berkas), `data/bali.mbtiles` (39.780.352 B), `data/world.mbtiles`
(29.556.736 B). Kedua mbtiles diunggah ke nama sementara `*.baru` lebih dulu, **ukurannya
dibandingkan byte-per-byte dengan berkas lokal**, baru ditukar — supaya unggahan yang
terpotong tak pernah sempat jadi berkas yang disajikan.

### Verifikasi sesudahnya
- Container `sisupit-tiles` **healthy**, `restart=unless-stopped` (selamat dari reboot);
  nominatim & osrm tak tersentuh, tetap up 7 minggu.
- `styles.json` server menyajikan tepat satu style: id `sisupit`, nama **"Sisupit Light"**.
- Tile lokal di 127.0.0.1:8083 — z3, z5, z9, z13, z16 semuanya 200.
- **Ketiga domain** (prod/staging/dev): `MAP_TILE_URL` menunjuk domainnya sendiri, **0 rujukan
  `cartocdn`**, tile z5 = 200 (2.048 B) & z13 = 200 (27.345 B) — **byte-nya identik dengan
  hasil lokal**, jadi yang disajikan benar-benar data & style yang sama. `@2x` 200 (72.852 B).
  `POST /tiles/` = **403** (`limit_except GET HEAD` masih berlaku). `x-tile-cache: HIT`.
- **Diperiksa VISUAL dari produksi**, bukan cuma status: z9 sepulau (laut biru, Bali
  berbentuk, Nusa Penida & Lombok terlihat), z5 (seluruh Nusantara dari latar dunia), dan
  tile z16 nyata (nama jalan "Jalan Karang Sari" & "Jalan Gunung Catur" tergambar). Ini
  pemeriksaan yang diwajibkan §11: ketiga kegagalan basemap sebelumnya semuanya HTTP 200.
- Cache Nginx `/var/cache/nginx/tiles` DIKOSONGKAN (12 MB — 4 KB) sebelum reload, lalu terisi
  kembali normal (568 KB). `nginx -t` lolos sebelum reload.
- nginx, php8.2-fpm, docker, reverb, reverb-staging, reverb-dev: keenamnya `active`.
- Ketiga domain aplikasi HTTP **200**; `POST /broadcasting/auth` = **403** di ketiganya
  (terdaftar & menolak yang tak berhak — bukan 404 seperti #55).
- **0 ERROR baru**: ERROR terakhir di prod bertanggal 2026-08-26 06:07 (queue worker
  "Connection refused" yang lama). Log error Nginx bersih.
- Disk 29% terpakai, 34 G bebas.

### Rollback (kalau perlu)
```bash
cd /opt/geo/tiles
cp config.json.bak-20260827-212427 config.json
cp docker-compose.yml.bak-20260827-212427 docker-compose.yml
cp data/bali.mbtiles.bak-20260827-212427 data/bali.mbtiles
docker compose up -d
find /var/cache/nginx/tiles -mindepth 1 -delete && systemctl reload nginx
```
TANPA menyentuh `.env` maupun kode aplikasi — keduanya memang tak pernah berubah.

**SISA:** perubahan kode di repo (`docker/tiles/` seluruhnya, plus TASK_46/FINDINGS/
ARCHITECTURE_MAP) BELUM di-commit. Ikutkan rilis berikutnya seperti biasa; petanya sendiri
sudah berjalan karena perbaikan ini murni berkas di `/opt/geo/tiles`.

---

## 14. Tampilan baru tak sampai ke pengguna: cache 30 hari di BROWSER (2026-08-28)

Laporan user beberapa jam sesudah §13: *"di prod harus ctrl+shift+r baru bisa update ke
tampilan maps yang sekarang, tapi di apk tidak bisa itu dan di browser hp pun tidak bisa"*,
lalu *"ternyata di vps belum berubah, belum sesuai dengan lokal"*.

### Server TERBUKTI benar — yang basi ada di klien
Dibuktikan sebelum menyentuh apa pun: `style.json` prod vs lokal berbeda HANYA pada URL host
(`glyphs`, `sprite`, `sources`) sedangkan daftar & isi ke-51 layernya identik; dan **enam
tile (z5/z13/z16, biasa & @2x) md5-nya SAMA PERSIS** antara prod dan lokal. Tidak ada CDN di
depan (Server: nginx langsung).

### Akar
Blok Nginx `/tiles/` menyajikan `expires 30d` — `Cache-Control: max-age=2592000`. Itu
disengaja (render raster makan CPU), tapi artinya **URL yang sama dengan isi berbeda tidak
akan pernah terlihat** oleh siapa pun yang sudah membuka peta, sampai 30 hari. Mengosongkan
`proxy_cache` di §13 tidak menolong: itu cache SERVER; yang menyimpan tile lama adalah browser
tiap pengguna.

Ctrl+Shift+R hanya menyiasati sebagian: ia menyegarkan tile yang dimuat saat itu, tapi begitu
peta digeser, tile tetangga tetap diambil dari cache lama — petanya campur baru-lama. Itu
sebabnya user melapor "belum sesuai" MESKIPUN sudah hard-refresh. Dan di APK (Android WebView)
maupun browser HP tidak ada gerakan setara sama sekali.

### Fix
Penanda versi di URL tile: `.../{z}/{x}/{y}{r}.png?v=20260828`, diisi di `.env` ketiga
environment + `php artisan config:clear`. URL baru = cache miss = semua klien mengambil tile
segar. **TANPA deploy kode, TANPA rebuild, TANPA update APK** — halaman HTML ber-
`Cache-Control: no-cache, private`, jadi `window.MAP_TILE_URL` yang baru sampai ke pengguna
pada pemuatan halaman berikutnya, termasuk di dalam WebView.

Aman karena ke-14 pemanggilan `L.tileLayer` menerima `MAP_TILE_URL` apa adanya tanpa mengutak-
atik string-nya (diperiksa), dan TileServer-GL mengabaikan parameter yang tak dikenalnya.

### Satu kejanggalan yang sempat muncul & sudah dijelaskan
Tile z13 dengan `?v=20260828` berukuran 28.541 B, tanpa param 27.345 B — dan itu
reproducible. Diperiksa: **gambarnya identik piksel demi piksel** (`ImageChops.difference`
memulangkan bbox `None`); yang berbeda cuma pengemasan PNG-nya, karena satu berasal dari
render segar dan satunya dari hasil yang sudah dikemas ulang. Jadi ukuran berkas BUKAN alat
ukur yang sah untuk "apakah tile-nya sama"; yang sah md5 pada URL yang sama, atau perbandingan
piksel.

### ATURAN BARU yang mengikat
**Setiap kali `style.json` atau `*.mbtiles` berubah, naikkan `?v=` di `MAP_TILE_URL` ketiga
environment.** Kalau lupa: perubahannya nyata di server, lolos semua pemeriksaan curl, dan
TETAP tak terlihat oleh pengguna — satu lagi kegagalan basemap yang menjawab HTTP 200 tanpa
satu baris log, sekeluarga dengan tiga yang sudah tercatat di §11.

### Verifikasi (2026-08-28)
- Ketiga `.env` dicadangkan (`*.bak-tilever-*`), kepemilikan `www-data:www-data` & mode
  berkasnya dipulihkan setelah `sed -i` (sed membuat berkas baru; tanpa ini pemiliknya jadi root).
- Ketiga domain menyuntikkan URL ber-`?v=20260828`; aplikasi HTTP 200 di ketiganya.
- Tile ber-versi: z5, z9, z13, dan @2x semuanya 200 di ketiga domain, `x-tile-cache: HIT`.

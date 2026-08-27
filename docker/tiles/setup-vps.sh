#!/usr/bin/env bash
# Siapkan basemap self-hosted (TileServer-GL) di VPS. Padanan Linux dari prepare-bali.ps1,
# ditambah menjalankan containernya sekaligus.
#
# SENGAJA TIDAK menyentuh Nginx maupun .env aplikasi: keduanya berkas milik server yang
# sudah berjalan, dan mengubahnya otomatis berarti satu skrip bisa menjatuhkan tiga domain
# sekaligus. Skrip ini berhenti setelah tile server terbukti melayani, lalu MENCETAK dua
# langkah terakhir untuk ditinjau manusia.
#
# Idempoten: aman dijalankan ulang; langkah yang hasilnya sudah ada akan dilewati.
#
# Pemakaian:  bash setup-vps.sh [direktori-kerja]
#             default direktori-kerja = /opt/geo/tiles (sepola nominatim & osrm)

set -euo pipefail

WORKDIR="${1:-/opt/geo/tiles}"
PBF_NAME="bali.osm.pbf"
MBTILES_NAME="bali.mbtiles"
# Bbox SENGAJA LEBIH LEBAR daripada docker/nominatim/extract-bali.ps1
# (114.40,-8.90,115.75,-8.03): angka itu memeluk daratan Bali pas-pasan sehingga di zoom
# jauh TEPI KOTAK bbox terlihat sebagai garis lurus di tengah laut. Margin ini menambah
# LAUT saja, bukan cakupan data — PBF-nya tetap Bali, jadi geocoding & rute tidak ikut
# melebar dan tetap sepadan dengan Nominatim/OSRM.
BBOX="113.80,-9.40,116.30,-7.60"
HOST_PORT="${TILES_HOST_PORT:-8081}"
FONTS_URL="https://github.com/openmaptiles/fonts/releases/download/v2.0/noto-sans.zip"
# Garis pantai. WAJIB versi 4326: shapefile ini dibaca tilemaker sebagai lintang/bujur apa
# adanya, jadi versi 3857 (meter) menghasilkan poligon laut sebesar dunia yang MENUTUPI
# daratan — peta tetap terbentuk dan tetap HTTP 200, cuma seluruh Bali berwarna laut.
COAST_URL="https://osmdata.openstreetmap.de/download/water-polygons-split-4326.zip"
URBAN_URL="https://naciscdn.org/naturalearth/10m/cultural/ne_10m_urban_areas.zip"
# Kandidat PBF yang sudah ada di server (dipakai ulang supaya tak mengunduh 52 MB lagi).
PBF_CANDIDATES=(
  "/opt/geo/nominatim/data/${PBF_NAME}"
  "/opt/geo/osrm/data/${PBF_NAME}"
)

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31mXX %s\033[0m\n' "$*" >&2; exit 1; }

# --- Prasyarat ---
command -v docker >/dev/null || die "docker tidak ada di PATH."
docker info >/dev/null 2>&1 || die "daemon docker tidak berjalan."
command -v unzip >/dev/null || die "unzip tidak ada. Pasang dulu: apt-get install -y unzip"

say "Direktori kerja: $WORKDIR"
mkdir -p "$WORKDIR/data/styles" "$WORKDIR/data/fonts"
cd "$WORKDIR"

AVAIL_GB=$(df -BG --output=avail . | tail -1 | tr -dc '0-9')
[ "${AVAIL_GB:-0}" -ge 6 ] || die "Sisa disk cuma ${AVAIL_GB}G. Butuh >= 6G (garis pantai ~2,5G saat diekstrak)."
say "Sisa disk: ${AVAIL_GB}G — cukup."

# --- 1) PBF sumber ---
if [ ! -f "data/$PBF_NAME" ]; then
  for c in "${PBF_CANDIDATES[@]}"; do
    if [ -f "$c" ]; then say "Memakai ulang PBF: $c"; cp "$c" "data/$PBF_NAME"; break; fi
  done
fi
if [ ! -f "data/$PBF_NAME" ]; then
  # Geofabrik TIDAK punya ekstrak "bali" tersendiri — URL semacam itu dijawab 200 lalu
  # dialihkan ke halaman depan, sehingga curl menyimpan HTML dan tilemaker gagal dengan
  # pesan yang menyesatkan. Yang memuat Bali adalah region "nusa-tenggara"
  # (poligonnya lon 114,4-128,4 / lat -11,6..-6,7; sudah diperiksa memuat Denpasar).
  # Tilemaker memangkasnya ke $BBOX, jadi hasilnya tetap Bali saja.
  warn "PBF tidak ditemukan di server; mengunduh region Nusa Tenggara dari Geofabrik."
  curl -fL --retry 3 -o "data/$PBF_NAME" \
    "https://download.geofabrik.de/asia/indonesia/nusa-tenggara-latest.osm.pbf"
fi
# Pastikan yang ada benar-benar PBF, bukan halaman HTML hasil pengalihan.
head -c 64 "data/$PBF_NAME" | grep -qa OSMHeader \
  || die "data/$PBF_NAME bukan berkas OSM PBF yang sah (unduhan dialihkan?). Hapus lalu ulangi."
say "PBF siap: $(du -h "data/$PBF_NAME" | cut -f1)"

# --- 2) Garis pantai & kawasan terbangun ---
# Nama foldernya TIDAK boleh diubah: config-openmaptiles.json bawaan tilemaker merujuk
# "coastline/water_polygons.shp" dan "landcover/..." secara RELATIF, dan container di bawah
# dijalankan dengan -w /data. Menaruhnya di tempat lain menuntut menyunting config bawaan.
#
# LEBIH CEPAT: kalau mbtiles-nya sudah dibangun di mesin lain, salin saja berkas ~40 MB itu
# ke data/ — langkah ini beserta unduhan 900 MB-nya akan dilewati seluruhnya.
if [ -f "data/$MBTILES_NAME" ]; then
  say "Melewati shapefile — $MBTILES_NAME sudah ada."
elif [ -f "data/coastline/water_polygons.shp" ]; then
  say "Melewati unduh garis pantai — sudah ada."
else
  say "Mengunduh garis pantai (~900 MB, sekali saja)..."
  mkdir -p data/coastline
  curl -fL --retry 3 -o /tmp/water-polygons.zip "$COAST_URL"
  unzip -oq /tmp/water-polygons.zip -d /tmp/water-polygons
  find /tmp/water-polygons -name "water_polygons.*" -exec cp {} data/coastline/ ";"
  rm -rf /tmp/water-polygons.zip /tmp/water-polygons
fi
if [ ! -f "data/$MBTILES_NAME" ]; then
  [ -f "data/coastline/water_polygons.shp" ] \
    || die "Garis pantai tidak terpasang — laut akan sewarna daratan dan pulau tak berbentuk."
  if [ ! -f "data/landcover/ne_10m_urban_areas/ne_10m_urban_areas.shp" ]; then
    say "Mengunduh Natural Earth urban areas..."
    mkdir -p data/landcover/ne_10m_urban_areas
    curl -fL --retry 3 -o /tmp/urban.zip "$URBAN_URL"
    unzip -oq /tmp/urban.zip -d data/landcover/ne_10m_urban_areas
    rm -f /tmp/urban.zip
  fi
fi

# --- 3) Vector tiles ---
# Dua shapefile lain yang dirujuk config (gletser & es Antartika) SENGAJA tidak diunduh;
# tilemaker cuma mencetak "Unable to open ..." lalu lanjut, dan Bali tak punya keduanya.
if [ -f "data/$MBTILES_NAME" ]; then
  say "Melewati tilemaker — $MBTILES_NAME sudah ada ($(du -h "data/$MBTILES_NAME" | cut -f1))."
else
  say "Membangun $MBTILES_NAME dengan tilemaker (beberapa menit)..."
  docker run --rm -w /data -v "$PWD/data:/data" ghcr.io/systemed/tilemaker:master \
    "/data/$PBF_NAME" "/data/$MBTILES_NAME" \
    --bbox "$BBOX" \
    --config /usr/src/app/resources/config-openmaptiles.json \
    --process /usr/src/app/resources/process-openmaptiles.lua
  # tilemaker bisa berhenti gagal DENGAN exit code 0 (mis. bbox kurang), jadi keberadaan
  # berkasnya yang diperiksa — bukan status keluarnya.
  [ -f "data/$MBTILES_NAME" ] || die "tilemaker selesai tapi $MBTILES_NAME tidak terbentuk."
  say "mbtiles jadi: $(du -h "data/$MBTILES_NAME" | cut -f1)"
fi

# --- 4) Tileset latar sedunia (z0-8) ---
# Supaya zoom keluar dari Bali tidak menampilkan bidang kosong. Isinya CUMA siluet
# daratan/laut — tanpa jalan, nama tempat, atau POI. Membangunnya makan ~20 menit CPU,
# sedangkan hasilnya (~30 MB) sama untuk environment mana pun, jadi di server kita SALIN
# saja. Kalau belum ada, skrip berhenti dengan perintah salinannya — membangun di server
# yang sedang melayani tiga domain bukan hal yang pantas dilakukan diam-diam.
if [ ! -f "data/world.mbtiles" ]; then
  warn "data/world.mbtiles belum ada — zoom keluar akan menampilkan bidang kosong."
  warn "Salin dari mesin yang sudah membangunnya:"
  warn "  scp docker/tiles/data/world.mbtiles root@<server>:$WORKDIR/data/"
  warn "Atau bangun di sini (~20 menit CPU):"
  warn "  docker run --rm -w /data -v \"\$PWD/data:/data\" \"
  warn "    -v \"\$PWD/config-world.json:/data/config-world.json:ro\" \"
  warn "    ghcr.io/systemed/tilemaker:master /data/$PBF_NAME /data/world.mbtiles \"
  warn "    --bbox -180,-85,180,85 --config /data/config-world.json \"
  warn "    --process /usr/src/app/resources/process-coastline.lua"
fi

# --- 5) Style ---
# Style "Sisupit Light" TIDAK diunduh: ia ikut repo dan dipasang ke container lewat bind
# mount di docker-compose.yml. Yang bisa salah di sini cuma satu: foldernya lupa ikut
# tersalin ke server. Kalau itu terjadi, tileserver tetap hidup dan tetap menjawab, tapi
# style id "sisupit" tidak ada sehingga SEMUA permintaan tile dijawab 404 — jadi lebih baik
# berhenti di sini daripada di browser pengguna.
[ -f "style/sisupit-light/style.json" ] || die "style/sisupit-light/ tidak ada di $WORKDIR (salin dari repo docker/tiles/style/)."
say "Style Sisupit Light siap (dari repo, bukan unduhan)."

# --- 6) Font ---
# TANPA ini tile tetap tergambar TAPI tanpa satu pun nama jalan/desa, dan tileserver TIDAK
# melaporkan galat apa pun. Lihat FINDINGS #92.
if [ -d "data/fonts/Noto Sans Regular" ]; then
  say "Melewati unduh font — sudah ada."
else
  say "Mengunduh font Noto Sans (Regular/Bold/Italic)..."
  curl -fL --retry 3 -o /tmp/noto-sans.zip "$FONTS_URL"
  unzip -oq /tmp/noto-sans.zip -d data/fonts
  rm -f /tmp/noto-sans.zip
fi
[ -d "data/fonts/Noto Sans Regular" ] || die "Font tidak terpasang — peta akan tanpa nama jalan."

# --- 7) config.json & compose ---
[ -f config.json ]        || die "config.json tidak ada di $WORKDIR (salin dari repo docker/tiles/)."
[ -f config-world.json ]  || die "config-world.json tidak ada di $WORKDIR (salin dari repo docker/tiles/)."
[ -f docker-compose.yml ] || die "docker-compose.yml tidak ada di $WORKDIR (salin dari repo docker/tiles/)."

if [ ! -f .env ]; then
  die "Buat .env dulu di $WORKDIR (contoh ada di .env.example), terutama TILES_PUBLIC_URL."
fi
grep -q '^TILES_PUBLIC_URL=' .env || die "TILES_PUBLIC_URL belum diisi di .env — TileJSON akan salah."

say "Menjalankan container..."
docker compose up -d

# --- 8) Verifikasi ---
say "Menunggu tile server siap..."
for _ in $(seq 1 30); do
  if curl -sf -o /dev/null "http://127.0.0.1:${HOST_PORT}/health"; then break; fi
  sleep 2
done
curl -sf -o /dev/null "http://127.0.0.1:${HOST_PORT}/health" || die "Tile server tidak merespons di port ${HOST_PORT}."

TILE_URL="http://127.0.0.1:${HOST_PORT}/styles/sisupit/13/6717/4293.png"
SIZE=$(curl -sf -o /tmp/tile-uji.png -w '%{size_download}' "$TILE_URL") || die "Tile uji gagal diambil."
# Tile Denpasar z13 yang normal berukuran puluhan KB. Kalau jauh di bawah itu, biasanya
# style/mbtiles-nya tak terbaca dan yang keluar cuma gambar kosong.
[ "$SIZE" -gt 10000 ] || die "Tile uji cuma ${SIZE} byte — periksa config.json, style, dan mbtiles."
say "Tile uji OK: ${SIZE} byte (Denpasar z13)."

DOMAIN_HINT=$(grep -oP '(?<=^TILES_PUBLIC_URL=).*' .env | sed 's#/tiles/$##; s#/$##')

cat <<EOF

============================================================
Tile server SUDAH berjalan di 127.0.0.1:${HOST_PORT}.
Dua langkah terakhir SENGAJA tidak diotomatiskan — tinjau lalu jalankan sendiri:

1) NGINX — tambahkan sekali di blok http {} (mis. /etc/nginx/nginx.conf):

   proxy_cache_path /var/cache/nginx/tiles levels=1:2 keys_zone=tiles:50m
                    max_size=5g inactive=30d use_temp_path=off;

   lalu di server block TIAP domain (prod, staging, dev):

   location /tiles/ {
       proxy_pass http://127.0.0.1:${HOST_PORT}/;
       proxy_set_header Host \$host;
       proxy_cache tiles;
       proxy_cache_valid 200 30d;
       proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
       add_header X-Tile-Cache \$upstream_cache_status;
       expires 30d;
       limit_except GET HEAD { deny all; }
   }

   mkdir -p /var/cache/nginx/tiles && nginx -t && systemctl reload nginx

2) APLIKASI — di .env TIAP environment:

   MAP_TILE_URL=${DOMAIN_HINT}/tiles/styles/sisupit/{z}/{x}/{y}{r}.png

   lalu: php artisan config:clear
   (TANPA npm run build, TANPA deploy kode — URL dibaca runtime.)

Verifikasi akhir:
   curl -s https://sisupit.com/login | grep -o 'window.MAP_TILE_URL = [^<]*'
   curl -o /dev/null -w '%{http_code} %{size_download}\n' \
        https://sisupit.com/tiles/styles/sisupit/13/6717/4293.png
============================================================
EOF

#!/usr/bin/env bash
# Memanaskan cache tile Nginx (/tiles/) untuk satu wilayah, supaya tile dilayani dari cache (~0,1 dtk)
# alih-alih dirender TileServer-GL saat pertama diminta (20 tile serentak = 0,6-2,5 dtk antre di CPU).
# FINDINGS #225. Jalankan di VPS sesudah style/mbtiles berubah atau `?v=` dinaikkan.
#
# usage: bash warm-cache.sh [/var/www/sisupit] [zmin] [zmax] [barat selatan timur utara] [paralel]
#   bawaan: Kota Denpasar + tepi (115.15 -8.76 115.30 -8.57), z10-z17, 2 paralel
#   (~21.500 tile untuk 2 style x 1x/@2x, ~0,9 GB, ~45 menit saat dingin).
#
# Tile diminta LEWAT Nginx (bukan port tileserver) karena yang diisi adalah proxy_cache, dan dengan
# `?v=` PERSIS seperti di .env aplikasi - kunci cache memuat query string, versi lain = cache lain.
set -euo pipefail

APP=${1:-/var/www/sisupit}
ZMIN=${2:-10}
ZMAX=${3:-17}
WEST=${4:-115.15} SOUTH=${5:--8.76} EAST=${6:-115.30} NORTH=${7:--8.57}
PAR=${8:-2}

die() { echo "BERHENTI: $*" >&2; exit 1; }

# Tanpa `inactive=` Nginx membuang entri yang tak diakses 10 menit, apa pun proxy_cache_valid-nya:
# memanaskan ribuan tile yang jarang dibuka jadi sia-sia.
# Direktif dibaca utuh sampai `;` dari `nginx -T` - README menulisnya dua baris (inactive= di baris kedua).
CP=$(nginx -T 2>/dev/null | sed 's/#.*//' | tr '\n' ' ' | grep -o 'proxy_cache_path[^;]*;' | grep "tiles" | tr -s ' ' || true)
[ -n "$CP" ] || die "proxy_cache_path untuk tiles tak ditemukan di /etc/nginx."
echo "proxy_cache_path: $CP"
echo "$CP" | grep -q "inactive=" || die "proxy_cache_path tanpa inactive= (bawaan 10 menit). Tambahkan mis. inactive=60d max_size=3g, nginx -t, reload, lalu ulangi."

URLS=$(grep -E '^MAP_TILE_URL(_DARK)?=' "$APP/.env" | cut -d= -f2- | tr -d '"' || true)
[ -n "$URLS" ] || die "MAP_TILE_URL tak ada di $APP/.env."
HOST=$(echo "$URLS" | head -1 | sed -E 's#^https?://([^/]+)/.*#\1#')

LIST=$(mktemp)
for TPL in $URLS; do
  for R in "" "@2x"; do
    python3 - "$TPL" "$R" "$ZMIN" "$ZMAX" "$WEST" "$SOUTH" "$EAST" "$NORTH" >> "$LIST" <<'PY'
import math, sys
tpl, r, zmin, zmax = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
w, s, e, n = map(float, sys.argv[5:9])
def tile(lat, lon, z):
    k = 2 ** z
    return int((lon + 180) / 360 * k), int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * k)
for z in range(zmin, zmax + 1):
    x0, y0 = tile(n, w, z); x1, y1 = tile(s, e, z)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            print(tpl.replace('{z}', str(z)).replace('{x}', str(x)).replace('{y}', str(y)).replace('{r}', r))
PY
  done
done

TOTAL=$(wc -l < "$LIST")
echo "Host $HOST, z$ZMIN-z$ZMAX, $TOTAL tile, $PAR paralel. Disk sebelum:"; du -sh /var/cache/nginx/tiles 2>/dev/null || true
START=$(date +%s)
# -o /dev/null: cukup memicu render + simpan di cache Nginx. Header X-Tile-Cache dicatat untuk ringkasan.
xargs -a "$LIST" -P "$PAR" -I{} curl -s -o /dev/null --resolve "$HOST:443:127.0.0.1" \
  -w '%{http_code} %header{x-tile-cache}\n' '{}' | sort | uniq -c || true
echo "Selesai dalam $(( $(date +%s) - START )) dtk. Disk sesudah:"; du -sh /var/cache/nginx/tiles 2>/dev/null || true
rm -f "$LIST"

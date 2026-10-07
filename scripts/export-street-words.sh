#!/usr/bin/env bash
# Kamus koreksi ejaan pencarian lokasi (#192/#194): kata-kata nama jalan & tempat dari database
# Nominatim self-hosted, satu baris "kata<TAB>jumlah kemunculan", huruf kecil, >= 3 huruf. Jumlah
# memutus koreksi yang seri ("gmitir": gumitir 19 vs gemitir 8; "nsa": nusa 150 vs nesa 4). GeocodeController membaca
# resources/data/geocode/street-words-<kode provinsi>.txt (provinsi tenant) bersama nama wilayah
# laravolt + banjar. Jalankan ulang bila data OSM Nominatim diperbarui atau tenant provinsi baru live.
#
#   bash scripts/export-street-words.sh 51 [nama-container]   # 51 = Bali
#
# Container default: sisupit-nominatim (docker lokal, impor yang sama dengan VPS /opt/geo).
set -euo pipefail
PROVINCE="${1:?kode provinsi, mis. 51}"
CONTAINER="${2:-sisupit-nominatim}"
OUT="$(dirname "$0")/../resources/data/geocode/street-words-${PROVINCE}.txt"
SQL="select w || chr(9) || count(*) from (select regexp_split_to_table(lower(name->'name'), '[^[:alpha:]]+') w from placex where class in ('highway','place') and name ? 'name') t where length(w) >= 3 group by w order by w"
mkdir -p "$(dirname "$OUT")"
MSYS_NO_PATHCONV=1 docker exec "$CONTAINER" su postgres -c "psql -d nominatim -tA -c \"$SQL\"" | tr -d '\r' > "$OUT"
echo "$(wc -l < "$OUT") kata -> $OUT"

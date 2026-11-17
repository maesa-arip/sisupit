#!/bin/bash
# Pasang/perbarui coturn (TURN/STUN) untuk Panggilan Sisupit (TASK_90) lalu isi .env satu environment.
# Aman diulang: rahasia lama dipakai lagi bila /etc/turnserver.conf sudah ada.
#
# usage: bash coturn-setup.sh <dir-aplikasi>
#   mis.  bash coturn-setup.sh /var/www/sisupit-staging
set -e
APP=${1:?usage: coturn-setup.sh <dir-aplikasi>}
IP=31.97.110.62

# coturn jalan sebagai container Docker (--network host), BUKAN paket apt: di VPS ini `apt-get install
# coturn` ikut menarik upgrade mysql-server-8.0 (DB prod/staging/dev) lewat libmysqlclient21 (2026-11-17).
IMAGE=coturn/coturn:4.6.2
command -v docker >/dev/null || { echo "docker tidak ada - batal (jangan pasang coturn lewat apt)"; exit 1; }

RAHASIA=$(grep -s '^static-auth-secret=' /etc/turnserver.conf | cut -d= -f2-)
[ -z "$RAHASIA" ] && RAHASIA=$(openssl rand -hex 32)

cat > /etc/turnserver.conf <<CONF
listening-port=3478
external-ip=$IP
fingerprint
use-auth-secret
static-auth-secret=$RAHASIA
realm=sisupit.com
min-port=49160
max-port=49200
no-multicast-peers
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
no-cli
total-quota=50
user-quota=4
log-file=stdout
simple-log
CONF
chmod 644 /etc/turnserver.conf
docker rm -f coturn >/dev/null 2>&1 || true
docker run -d --name coturn --restart unless-stopped --network host   -v /etc/turnserver.conf:/etc/coturn/turnserver.conf:ro "$IMAGE" -c /etc/coturn/turnserver.conf >/dev/null
sleep 3

ufw allow 3478/udp >/dev/null; ufw allow 3478/tcp >/dev/null; ufw allow 49160:49200/udp >/dev/null

# .env aplikasi: ganti baris lama atau tambahkan.
setenv() { if grep -q "^$1=" "$APP/.env"; then sed -i "s#^$1=.*#$1=$2#" "$APP/.env"; else echo "$1=$2" >> "$APP/.env"; fi; }
setenv WEBRTC_STUN_URLS "stun:$IP:3478"
setenv TURN_URLS "turn:$IP:3478?transport=udp,turn:$IP:3478?transport=tcp"
setenv TURN_SECRET "$RAHASIA"
cd "$APP"
# Cache config hanya bila memang sedang di-cache (pola deploy-env.sh).
[ -f bootstrap/cache/config.php ] && sudo -u www-data php artisan config:cache >/dev/null && echo "config:cache ok"

echo "coturn: $(docker inspect -f {{.State.Status}} coturn)"
ss -lnup | grep -q ':3478 ' && echo "UDP 3478 terbuka" || echo "PERINGATAN: UDP 3478 tidak terdengar"
grep -E '^(WEBRTC_STUN_URLS|TURN_URLS)=' "$APP/.env"

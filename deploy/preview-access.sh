#!/bin/bash
# Akses pratinjau dev/staging: semua akun -> sandi "password", DITAMBAH basic auth Nginx di depan situsnya.
# Disetujui user 2026-10-04: "ya, izinkan ubah semua password dev dan staging jadi 'password' dan pasang basic
# auth". Alasan gerbangnya: dev & staging berisi SALINAN DATA PRIBADI produksi (deploy/copy-prod-data.sh) dan
# terbuka ke internet; tanpa gerbang, siapa pun yang menebak email (pola admin@<kota>.go.id) bisa login sebagai admin.
#
# usage: preview-access.sh <dir-target> <domain>
#   mis.  bash /root/preview-access.sh /var/www/sisupit-dev dev.sisupit.com
#
# Basic auth: SATU user/sandi bersama untuk dev & staging di /etc/nginx/.htpasswd-sisupit-preview. Dibuat sekali
# (sandi acak dicetak SEKALI); jalankan ulang = memakai berkas yang sama. Ganti sandinya: hapus berkas itu lalu
# jalankan lagi. /app & /apps (WebSocket & API Reverb) DIKECUALIKAN - koneksi WebSocket tak membawa basic auth.
set -e
DIR=${1%/}; DOMAIN=$2
[ -n "$DIR" ] && [ -n "$DOMAIN" ] || { echo "usage: $0 <dir-target> <domain>"; exit 1; }
[ "$DIR" != "/var/www/sisupit" ] || { echo "TOLAK: target adalah produksi"; exit 1; }
[ -f "$DIR/.env" ] || { echo "TOLAK: $DIR/.env tidak ada"; exit 1; }
if grep -q "^APP_ENV=production" "$DIR/.env"; then echo "TOLAK: APP_ENV=production di $DIR"; exit 1; fi
VHOST=/etc/nginx/sites-available/$DOMAIN
[ -f "$VHOST" ] || { echo "TOLAK: vhost $VHOST tidak ada"; exit 1; }
grep -q "server_name $DOMAIN;" "$VHOST" || { echo "TOLAK: $VHOST tidak memuat server_name $DOMAIN"; exit 1; }
for bin in php openssl nginx; do command -v $bin >/dev/null || { echo "TOLAK: $bin tidak ada"; exit 1; }; done

# --- 1. Basic auth Nginx DULU: gerbang terpasang sebelum sandi dilemahkan -----------------------------------
HT=/etc/nginx/.htpasswd-sisupit-preview
SNIP=/etc/nginx/snippets/sisupit-preview-auth.conf
if [ ! -f "$HT" ]; then
    PASS=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)
    printf 'sisupit:%s\n' "$(openssl passwd -apr1 "$PASS")" > "$HT"
    chown root:www-data "$HT"; chmod 640 "$HT"
    echo "BASIC AUTH DIBUAT -> user: sisupit   sandi: $PASS   (simpan sekarang, tidak dicetak lagi)"
else
    echo "basic auth: memakai $HT yang sudah ada (user: sisupit)"
fi
mkdir -p /etc/nginx/snippets
# Snippet hanya dibuat bila belum ada: preview-apk-exempt.sh menggantinya dengan versi ber-variabel (APK
# dikecualikan) - menjalankan ulang skrip ini tak boleh diam-diam mencabut pengecualian itu.
[ -f "$SNIP" ] || printf 'auth_basic "Sisupit Pratinjau";\nauth_basic_user_file %s;\n' "$HT" > "$SNIP"

if grep -q "sisupit-preview-auth.conf" "$VHOST"; then
    echo "vhost sudah memuat gerbang - tidak diubah"
else
    BAK="/root/$(basename "$VHOST").bak-preview-$(date +%Y%m%d-%H%M%S)"
    cp "$VHOST" "$BAK"
    sed -i "s#^\(\s*\)server_name $DOMAIN;#&\n\1include $SNIP;#" "$VHOST"
    sed -i 's#^\(\s*\)location /apps\? {#&\n\1    auth_basic off;#' "$VHOST"
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        echo "vhost diperbarui & nginx di-reload (cadangan: $BAK)"
    else
        cp "$BAK" "$VHOST"
        echo "GAGAL: nginx -t menolak - vhost DIKEMBALIKAN dari $BAK, nginx tidak di-reload, sandi TIDAK diubah"
        nginx -t || true
        exit 1
    fi
fi
echo "cek vhost: include=$(grep -c 'sisupit-preview-auth.conf' "$VHOST") auth_basic_off=$(grep -c 'auth_basic off;' "$VHOST")"

# --- 2. Semua sandi -> "password" (hanya setelah gerbang terpasang) ----------------------------------------
cd "$DIR"
N=$(php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php";
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    echo Illuminate\Support\Facades\DB::table("users")->update([
        "password" => Illuminate\Support\Facades\Hash::make("password"), "remember_token" => null]);')
echo "sandi diubah: $N akun -> \"password\" ($DIR)"

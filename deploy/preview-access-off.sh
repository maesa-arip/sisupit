#!/bin/bash
# Cabut gerbang basic auth dev/staging (permintaan user 2026-10-18: "hilangkan username dan password saat pertama
# akses dev atau staging"). Sandi akun TETAP "password" - pilihan user, risikonya dicatat di
# prompt/docs/PENGECUALIAN_ATURAN.md #7.
#
# Cara kerjanya: snippet gerbang (di-include HANYA oleh vhost dev & staging, lihat preview-access.sh) dikosongkan.
# Vhost, berkas .htpasswd, dan map pengecualian APK TIDAK disentuh, jadi memasang lagi cukup:
#   bash /root/preview-apk-exempt.sh      (menulis ulang snippet versi ber-pengecualian APK)
#
# usage: bash /root/preview-access-off.sh
set -e
SNIP=/etc/nginx/snippets/sisupit-preview-auth.conf
[ -f "$SNIP" ] || { echo "gerbang tidak terpasang ($SNIP tidak ada) - tidak ada yang diubah"; exit 0; }
echo "vhost yang memuat gerbang: $(grep -l 'sisupit-preview-auth.conf' /etc/nginx/sites-enabled/* 2>/dev/null | xargs -n1 basename | tr '\n' ' ')"

BAK="/root/sisupit-preview-auth.conf.bak-$(date +%Y%m%d-%H%M%S)"
cp "$SNIP" "$BAK"
printf '# Gerbang basic auth dev/staging DIMATIKAN 2026-10-18 (permintaan user).\n# Pasang lagi: bash /root/preview-apk-exempt.sh\n' > "$SNIP"

if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "gerbang dicabut & nginx di-reload (cadangan snippet: $BAK)"
else
    cp "$BAK" "$SNIP"
    echo "GAGAL: nginx -t menolak - snippet DIKEMBALIKAN, nginx tidak di-reload"
    nginx -t || true
    exit 1
fi
for d in dev staging; do
    echo "$d.sisupit.com/login tanpa sandi: $(curl -s -o /dev/null -w '%{http_code}' https://$d.sisupit.com/login) (harus 200)"
done
echo "sisupit.com/login: $(curl -s -o /dev/null -w '%{http_code}' https://sisupit.com/login) (produksi, harus 200)"

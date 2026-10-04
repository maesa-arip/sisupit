#!/bin/bash
# Kecualikan APK Sisupit dari gerbang basic auth dev/staging (pilihan user 2026-10-04: "Kecualikan APK di
# Nginx"). WebView APK tidak punya penangan permintaan basic auth (onReceivedHttpAuthRequest), jadi APK yang
# memuat dev.sisupit.com berhenti di 401. APK selalu mengirim User-Agent berakhiran " SisupitApp"
# (MainActivity.java), maka gerbang dimatikan HANYA untuk User-Agent itu.
#
# Harga yang DITERIMA user: User-Agent bisa ditiru - siapa pun yang tahu "SisupitApp" bisa melewati gerbang.
# Produksi tak tersentuh: variabel ini hanya dipakai snippet gerbang, dan snippet itu hanya di-include vhost
# dev & staging (deploy/preview-access.sh).
#
# usage: bash /root/preview-apk-exempt.sh
set -e
MAP=/etc/nginx/conf.d/sisupit-preview-map.conf
SNIP=/etc/nginx/snippets/sisupit-preview-auth.conf
HT=/etc/nginx/.htpasswd-sisupit-preview
[ -f "$SNIP" ] || { echo "TOLAK: $SNIP belum ada - jalankan preview-access.sh dulu"; exit 1; }
grep -Eq "include\s+/etc/nginx/conf\.d/\*\.conf" /etc/nginx/nginx.conf || { echo "TOLAK: nginx.conf tidak meng-include conf.d/*.conf"; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
cp "$SNIP" "/root/sisupit-preview-auth.conf.bak-$STAMP"
[ -f "$MAP" ] && cp "$MAP" "/root/sisupit-preview-map.conf.bak-$STAMP"
HAD_MAP=$([ -f "$MAP" ] && echo 1 || echo 0)

cat > "$MAP" <<'EOF'
# Gerbang basic auth dev/staging: "off" untuk APK Sisupit (User-Agent mengandung SisupitApp).
map $http_user_agent $sisupit_preview_auth {
    default        "Sisupit Pratinjau";
    "~SisupitApp"  off;
}
EOF
printf 'auth_basic $sisupit_preview_auth;\nauth_basic_user_file %s;\n' "$HT" > "$SNIP"

if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "pengecualian APK aktif & nginx di-reload"
else
    cp "/root/sisupit-preview-auth.conf.bak-$STAMP" "$SNIP"
    if [ "$HAD_MAP" = 1 ]; then cp "/root/sisupit-preview-map.conf.bak-$STAMP" "$MAP"; else rm -f "$MAP"; fi
    echo "GAGAL: nginx -t menolak - snippet & map DIKEMBALIKAN, nginx tidak di-reload"
    nginx -t || true
    exit 1
fi
for d in dev staging; do
    echo "$d.sisupit.com tanpa UA APK: $(curl -s -o /dev/null -w '%{http_code}' https://$d.sisupit.com/login) | UA APK: $(curl -s -o /dev/null -w '%{http_code}' -A 'Mozilla/5.0 (Linux; Android 14) SisupitApp' https://$d.sisupit.com/login)"
done

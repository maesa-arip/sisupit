# Multi-Environment Sisupit (production / staging / dev)

Satu VPS `31.97.110.62` menampung tiga environment. Tiap environment terisolasi:
folder, branch git, file SQLite, `.env`, nginx site, sertifikat SSL, dan port + service
Reverb sendiri.

| Env        | Domain                | Branch    | Folder                    | Reverb port | Reverb service        |
|------------|-----------------------|-----------|---------------------------|-------------|-----------------------|
| production | sisupit.com           | `main`    | `/var/www/sisupit`        | 8080        | `reverb.service`      |
| staging    | staging.sisupit.com   | `staging` | `/var/www/sisupit-staging`| 8081        | `reverb-staging`      |
| dev        | dev.sisupit.com       | `dev`     | `/var/www/sisupit-dev`    | 8082        | `reverb-dev`          |

GitHub: 3 branch (`main`/`staging`/`dev`) + 3 Environments (production/staging/dev)
di **Settings → Environments**. Deploy tetap manual: `git pull` di folder env
(build frontend tetap dilakukan lokal & di-commit via `public/build`).

---

## Prasyarat (dikerjakan SEBELUM provisioning)

1. **DNS** — tambahkan A record di penyedia domain sisupit.com:
   - `staging.sisupit.com` → `31.97.110.62`
   - `dev.sisupit.com`     → `31.97.110.62`
   Tunggu propagasi (`dig +short staging.sisupit.com` mengembalikan IP tsb) sebelum
   menjalankan Certbot, kalau tidak penerbitan sertifikat gagal.
2. Akses root VPS (PuTTY `plink`/`pscp`).

---

## Provisioning satu environment

Contoh untuk **staging** (untuk dev: ganti `staging`→`dev`, `8081`→`8082`).
Semua dijalankan di VPS sebagai root.

```bash
ENV=staging
DOMAIN=$ENV.sisupit.com
DIR=/var/www/sisupit-$ENV
PORT=8081
BRANCH=$ENV

# 1) Clone repo pada branch env
git clone https://github.com/maesa-arip/sisupit.git "$DIR"
cd "$DIR"
git checkout "$BRANCH"

# 2) Dependency PHP (vendor/ tidak ikut git). --no-dev seperti produksi.
composer install --no-dev --optimize-autoloader

# 3) .env — mulai dari .env produksi lalu sesuaikan
cp /var/www/sisupit/.env "$DIR/.env"
# Sunting nilai berikut di $DIR/.env (APP_KEY dibiarkan SAMA dg prod supaya
# kolom terenkripsi pada data yg disalin tetap bisa didekripsi):
#   APP_ENV=staging
#   APP_URL=https://staging.sisupit.com
#   DB_DATABASE=sisupit_staging      (MySQL — prod pakai MySQL, BUKAN sqlite)
#   REVERB_HOST=staging.sisupit.com
#   REVERB_SERVER_PORT=8081          (samakan dg $PORT; REVERB_PORT/SCHEME 443/https ikut prod)
#   SESSION_COOKIE=sisupit_staging_session   (hindari bentrok cookie antar subdomain)
# DB_HOST/DB_USERNAME/DB_PASSWORD dibiarkan ikut prod (sisupit_user@localhost).

# 4) DB — buat database MySQL terpisah + salin data prod (keputusan user: PII ikut)
mysql -e "CREATE DATABASE IF NOT EXISTS sisupit_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "GRANT ALL PRIVILEGES ON sisupit_staging.* TO 'sisupit_user'@'localhost'; FLUSH PRIVILEGES;"
mysqldump --single-transaction --no-tablespaces sisupit_db | mysql sisupit_staging
php artisan migrate --force         # terapkan migrasi yg belum ada di salinan

# 5) Izin & cache
chown -R www-data:www-data "$DIR"
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan storage:link

# 6) Nginx site dari template
sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s#__DIR__#$DIR#g" \
    -e "s/__PORT__/$PORT/g" -e "s/__ENV__/$ENV/g" \
    /var/www/sisupit/deploy/nginx-env.conf.template \
  > /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 7) SSL (DNS harus sudah mengarah ke VPS)
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m mahesa.deary@gmail.com

# 8) Reverb service dari template
sed -e "s/__ENV__/$ENV/g" -e "s#__DIR__#$DIR#g" -e "s/__PORT__/$PORT/g" \
    /var/www/sisupit/deploy/reverb-env.service.template \
  > /etc/systemd/system/reverb-$ENV.service
systemctl daemon-reload
systemctl enable --now reverb-$ENV
systemctl status reverb-$ENV --no-pager
```

## Deploy update ke env

```bash
cd /var/www/sisupit-staging
git pull origin staging
composer install --no-dev --optimize-autoloader   # jika ada perubahan dependency
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
systemctl restart reverb-staging
```

## Catatan keamanan

- Data produksi (termasuk **PII warga**) disalin ke staging/dev atas keputusan user.
  Untuk saat ini **tanpa** HTTP Basic auth / IP allowlist (keputusan user 2026-07-06:
  produksi pun masih testing internal tim). Aktifkan pembatasan bila subdomain non-prod
  akan diekspos ke publik luas.
- Realtime (Reverb): `public/build` yang di-commit di-build dg `VITE_REVERB_HOST=sisupit.com`,
  jadi WebSocket dari staging/dev untuk sementara menunjuk ke Reverb **produksi**. Infra
  Reverb per-env sudah dipasang (8081/8082) & siap dipakai; agar terisolasi penuh perlu
  build khusus per-branch dg `VITE_REVERB_HOST=<subdomain>` (build lokal → commit ke branch env).

#!/bin/bash
# Deploy satu environment Sisupit di VPS. Salinan resmi skrip /root/deploy-env.sh (FINDINGS #153):
# dulu skrip itu HANYA ada di server dan tidak menjalankan `composer install`, sehingga rilis yang
# menambah paket PHP (mis. dompdf TASK_68) membuat fiturnya 500 tanpa galat saat deploy.
#
# usage: deploy-env.sh <dir> <branch> <backupdir>
#   mis.  bash /root/deploy-env.sh /var/www/sisupit main /root/backup-predeploy-$(date +%Y%m%d-%H%M)
#
# Urutan: hitung data -> cadangan DB -> git pull -> composer install (HANYA bila composer.lock
# berubah) -> migrate -> route/config cache (hanya bila memang sedang di-cache) -> view:clear ->
# queue:restart -> chown -> hitung ulang data.
set -e
DIR=$1; BR=$2; BK=$3
cd "$DIR"
U=$(grep ^DB_USERNAME .env | cut -d= -f2); PW=$(grep ^DB_PASSWORD .env | cut -d= -f2-); D=$(grep ^DB_DATABASE .env | cut -d= -f2)
q() { mysql -u"$U" -p"$PW" "$D" -N -e "$1" 2>/dev/null; }
echo "== $DIR ($BR) HEAD $(git rev-parse --short HEAD)"
echo "counts pra: users=$(q 'select count(*) from users') reports=$(q 'select count(*) from reports') hydrants=$(q 'select count(*) from hydrants') ba=$(q 'select count(*) from report_resolutions')"
echo "dirty:"; git status --short | head -5
mkdir -p "$BK"; mysqldump -u"$U" -p"$PW" --single-transaction "$D" > "$BK/$D.sql" 2>/dev/null
echo "backup: $(du -h "$BK/$D.sql" | cut -f1) $(tail -1 "$BK/$D.sql")"

LOCK_BEFORE=$(sha1sum composer.lock | cut -c1-40)
git pull -q --ff-only origin "$BR"
echo "HEAD now $(git rev-parse --short HEAD)"
if [ "$LOCK_BEFORE" != "$(sha1sum composer.lock | cut -c1-40)" ]; then
    echo "composer.lock berubah -> composer install"
    COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction 2>&1 | grep -E "Installing|Updating|Removing|rror" || true
else
    echo "composer.lock tidak berubah"
fi

php artisan migrate --force 2>&1 | grep -v "^$"
ls bootstrap/cache/
[ -n "$(ls bootstrap/cache/routes-*.php 2>/dev/null)" ] && php artisan route:cache
[ -f bootstrap/cache/config.php ] && php artisan config:cache
php artisan view:clear >/dev/null
php artisan queue:restart
chown -R www-data:www-data "$DIR"
echo "pending: $(php artisan migrate:status 2>/dev/null | grep -c Pending)"
echo "counts pasca: users=$(q 'select count(*) from users') reports=$(q 'select count(*) from reports') hydrants=$(q 'select count(*) from hydrants') ba=$(q 'select count(*) from report_resolutions')"
echo "root-owned: $(find "$DIR" -user root -not -path '*/node_modules/*' 2>/dev/null | wc -l)"

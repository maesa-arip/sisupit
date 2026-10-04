#!/bin/bash
# Salin DATA produksi ke satu environment non-produksi (dev/staging) supaya tampilannya bisa dibandingkan
# dengan data yang sama. Disetujui user 2026-10-04 ("ya, izinkan salin data produksi ke dev dan staging"),
# termasuk data pribadi - sama seperti saat dev/staging disiapkan 2026-07-06. Salinan resmi /root/copy-prod-data.sh.
#
# usage: copy-prod-data.sh <dir-target> <backupdir>
#   mis.  bash /root/copy-prod-data.sh /var/www/sisupit-dev /root/backup-precopy-dev-$(date +%Y%m%d-%H%M)
#
# Urutan: tolak bila target = produksi -> hitung data -> cadangkan DB target -> dump DB produksi -> kosongkan
# DB target -> impor -> migrate (skema target bisa lebih baru dari produksi, mis. approved_at) -> netralkan
# yang bisa keluar ke dunia nyata (token push, sesi, antrian, cache) -> salin foto (storage/app/public, TANPA
# menghapus) -> queue:restart -> chown -> hitung ulang.
#
# SENGAJA tidak disalin: storage/app/private (foto KTP korban, PII). APP_KEY ketiga env sama sejak setup
# 2026-07-06, jadi kolom terenkripsi tetap terbaca.
set -e
SRC=/var/www/sisupit
DIR=${1%/}; BK=$2
[ -n "$DIR" ] && [ -n "$BK" ] || { echo "usage: $0 <dir-target> <backupdir>"; exit 1; }
[ "$DIR" != "$SRC" ] || { echo "TOLAK: target adalah produksi"; exit 1; }
[ -f "$DIR/.env" ] || { echo "TOLAK: $DIR/.env tidak ada"; exit 1; }
# Semua alat dicek SEBELUM langkah yang merusak - jangan sampai DB target sudah dikosongkan lalu skrip mati.
for bin in mysql mysqldump rsync php; do command -v $bin >/dev/null || { echo "TOLAK: $bin tidak ada"; exit 1; }; done

env_of() { grep "^$2=" "$1/.env" | cut -d= -f2-; }
SU=$(env_of $SRC DB_USERNAME); SP=$(env_of $SRC DB_PASSWORD); SD=$(env_of $SRC DB_DATABASE)
TU=$(env_of $DIR DB_USERNAME); TP=$(env_of $DIR DB_PASSWORD); TD=$(env_of $DIR DB_DATABASE)
[ "$TD" != "$SD" ] || { echo "TOLAK: DB target ($TD) sama dengan DB produksi"; exit 1; }

qs() { mysql -u"$SU" -p"$SP" "$SD" -N -e "$1" 2>/dev/null; }
qt() { mysql -u"$TU" -p"$TP" "$TD" -N -e "$1" 2>/dev/null; }
counts() { echo "users=$($1 'select count(*) from users') reports=$($1 'select count(*) from reports') hydrants=$($1 'select count(*) from hydrants') ba=$($1 'select count(*) from report_resolutions')"; }

echo "== salin $SD (produksi) -> $TD ($DIR)"
echo "produksi      : $(counts qs)"
echo "target pra    : $(counts qt)"

mkdir -p "$BK"
mysqldump -u"$TU" -p"$TP" --single-transaction "$TD" > "$BK/$TD.sql" 2>/dev/null
echo "cadangan target: $(du -h "$BK/$TD.sql" | cut -f1) $(tail -1 "$BK/$TD.sql")"
mysqldump -u"$SU" -p"$SP" --single-transaction "$SD" > "$BK/prod-$SD.sql" 2>/dev/null
echo "dump produksi  : $(du -h "$BK/prod-$SD.sql" | cut -f1) $(tail -1 "$BK/prod-$SD.sql")"

# Kosongkan DB target (tabel yang hanya ada di target ikut hilang, lalu dibuat lagi oleh migrate).
{ echo "SET FOREIGN_KEY_CHECKS=0;"; qt "SELECT CONCAT('DROP TABLE IF EXISTS \`', table_name, '\`;') FROM information_schema.tables WHERE table_schema='$TD'"; echo "SET FOREIGN_KEY_CHECKS=1;"; } \
    | mysql -u"$TU" -p"$TP" "$TD" 2>/dev/null
mysql -u"$TU" -p"$TP" "$TD" < "$BK/prod-$SD.sql" 2>/dev/null
echo "impor selesai"

cd "$DIR"
php artisan migrate --force 2>&1 | grep -v "^$" || true

# Netralkan: token push (notifikasi dev/staging tak boleh sampai ke ponsel pengguna sungguhan), sesi, antrian
# & job gagal produksi (tak boleh dijalankan ulang worker env ini), cache produksi (termasuk tenant:city:*).
for t in fcm_tokens push_subscriptions sessions jobs failed_jobs cache cache_locks; do
    if [ -n "$(qt "SHOW TABLES LIKE '$t'")" ]; then qt "DELETE FROM \`$t\`" && echo "dikosongkan: $t"; fi
done

rsync -a "$SRC/storage/app/public/" "$DIR/storage/app/public/"
echo "foto publik disalin: $(find "$DIR/storage/app/public" -type f | wc -l) berkas"

php artisan view:clear >/dev/null
php artisan queue:restart
chown -R www-data:www-data "$DIR/storage"
echo "pending: $(php artisan migrate:status 2>/dev/null | grep -c Pending)"
echo "target pasca  : $(counts qt)"
echo "fcm_tokens    : $(qt 'select count(*) from fcm_tokens')"

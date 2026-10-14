#!/bin/bash
# Cadangan otomatis PRODUKSI Sisupit ke Google Drive (rclone). Dijalankan cron tiap malam.
# Runbook pemasangan, pemulihan, dan cara mengecek: deploy/backup-gdrive.md
#
# usage: backup-gdrive.sh            (pakai nilai bawaan / /root/.sisupit-backup.conf)
#
# Isi cadangan:
#   1. DB  : mysqldump --single-transaction | gzip -> db/<db>-<YYYYmmdd-HHMM>.sql.gz (berkas bertanggal)
#   2. .env: env/env-<YYYYmmdd-HHMM> - APP_KEY wajib ada untuk membaca kolom terenkripsi saat pulih
#   3. storage/app (foto laporan, KTP berita acara, dst.): rclone sync INKREMENTAL ke storage/;
#      berkas yang dihapus/ditimpa di server dipindah ke storage-deleted/<tanggal>/, bukan hilang.
# Retensi: lokal LOCAL_KEEP_DAYS hari, Drive REMOTE_KEEP_DAYS hari (db/, env/, storage-deleted/).
#
# TANPA ENKRIPSI (keputusan user 2026-10-14): isi memuat PII, foto KTP, dan rahasia .env ->
# folder Drive tujuan JANGAN dibagikan ke siapa pun.
set -euo pipefail

APP_DIR=/var/www/sisupit
REMOTE=gdrive:sisupit-backup/         # <nama remote rclone>:<folder di Drive>/
LOCAL_DIR=/root/backups/sisupit
LOCAL_KEEP_DAYS=7
REMOTE_KEEP_DAYS=30
HEALTHCHECK_URL=                      # opsional: URL ping (mis. healthchecks.io); /fail dikirim saat gagal
[ -f /root/.sisupit-backup.conf ] && . /root/.sisupit-backup.conf

TS=$(date +%Y%m%d-%H%M)
log() { echo "[$(date '+%F %T')] $*"; }
ping_hc() { [ -n "$HEALTHCHECK_URL" ] && curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL$1" >/dev/null || true; }
trap 'log "GAGAL (baris $LINENO)"; ping_hc /fail' ERR

# Satu proses saja - cegah tumpang tindih bila unggahan lambat.
exec 9>/var/lock/sisupit-backup.lock
flock -n 9 || { log "proses cadangan lain masih jalan, lewati"; exit 0; }

command -v rclone >/dev/null || { log "rclone belum terpasang"; exit 1; }
cd "$APP_DIR"
env_val() { { grep "^$1=" .env || true; } | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
DB_USER=$(env_val DB_USERNAME); DB_PASS=$(env_val DB_PASSWORD); DB_NAME=$(env_val DB_DATABASE)
DB_HOST=$(env_val DB_HOST); DB_HOST=${DB_HOST:-127.0.0.1}

mkdir -p "$LOCAL_DIR/db" "$LOCAL_DIR/env"
chmod 700 "$LOCAL_DIR"
log "mulai: $DB_NAME -> $REMOTE"

# 1. DB. Sandi lewat berkas opsi sementara agar tak tampak di `ps`.
CNF=$(mktemp); chmod 600 "$CNF"
printf '[client]\nuser=%s\npassword="%s"\nhost=%s\n' "$DB_USER" "$DB_PASS" "$DB_HOST" > "$CNF"
DUMP="$LOCAL_DIR/db/$DB_NAME-$TS.sql.gz"
mysqldump --defaults-extra-file="$CNF" --single-transaction --quick --no-tablespaces \
    --routines --triggers "$DB_NAME" | gzip -6 > "$DUMP"
rm -f "$CNF"
# mysqldump menulis "-- Dump completed" di baris terakhir hanya bila selesai utuh.
gzip -dc "$DUMP" | tail -1 | grep -q "Dump completed" || { log "dump tidak utuh: $DUMP"; rm -f "$DUMP"; exit 1; }
log "dump: $(du -h "$DUMP" | cut -f1) $DUMP"

# 2. .env
install -m 600 .env "$LOCAL_DIR/env/env-$TS"

# 3. Unggah. copy (bukan sync) untuk db/ & env/: berkas bertanggal, retensi diatur sendiri di bawah.
RC="rclone --config /root/.config/rclone/rclone.conf --retries 5 --low-level-retries 10 --stats-one-line"
$RC copy "$DUMP" "${REMOTE}db/"
$RC copy "$LOCAL_DIR/env/env-$TS" "${REMOTE}env/"
$RC sync "$APP_DIR/storage/app" "${REMOTE}storage/" --backup-dir "${REMOTE}storage-deleted/$TS" \
    --exclude "framework/**" --exclude "*.tmp" --exclude "livewire-tmp/**"
# Bukti unggahan DB benar-benar ada di Drive dengan ukuran & hash sama.
$RC check "$LOCAL_DIR/db" "${REMOTE}db/" --one-way --include "$(basename "$DUMP")" >/dev/null
log "unggah selesai"

# 4. Retensi.
find "$LOCAL_DIR/db" "$LOCAL_DIR/env" -type f -mtime +"$LOCAL_KEEP_DAYS" -delete
$RC delete "${REMOTE}db/" --min-age "${REMOTE_KEEP_DAYS}d"
$RC delete "${REMOTE}env/" --min-age "${REMOTE_KEEP_DAYS}d"
$RC delete "${REMOTE}storage-deleted/" --min-age "${REMOTE_KEEP_DAYS}d" --rmdirs
log "selesai: db di Drive = $($RC lsf "${REMOTE}db/" | wc -l) berkas"
ping_hc ""

# Cadangan otomatis produksi ke Google Drive

Skrip: `deploy/backup-gdrive.sh` (salinan resmi; yang dijalankan cron = `/root/backup-gdrive.sh`).
Tiap malam: dump DB `sisupit_db` (gzip), salinan `.env`, dan sinkron inkremental `storage/app`
ke folder Drive `sisupit-backup/`. Retensi lokal 7 hari, Drive 30 hari.

**Tanpa enkripsi** (keputusan user 2026-10-14). Isi folder memuat data pribadi warga, foto KTP,
dan rahasia `.env` (APP_KEY, sandi DB, kunci FCM) -> folder Drive itu jangan dibagikan, dan akun
Google pemiliknya wajib 2FA.

Kenapa skrip disalin ke `/root` dan tidak dijalankan langsung dari repo: folder repo milik
`www-data`; skrip root yang bisa diubah `www-data` = jalan naik hak akses ke root.

## Pasang (sekali, lewat konsol web Hostinger)

### 1. rclone + skrip

```bash
curl -fsSL https://rclone.org/install.sh | bash
install -m 700 /var/www/sisupit/deploy/backup-gdrive.sh /root/backup-gdrive.sh
timedatectl | grep "Time zone"
```

### 2. Login Google Drive (VPS tanpa browser)

Di **PC Windows** (yang ada browsernya): unduh rclone dari https://rclone.org/downloads/, lalu
di PowerShell:

```powershell
.\rclone.exe authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ"
```

(argumen kedua = `{"scope":"drive.file"}` -> rclone hanya bisa melihat berkas yang dibuatnya
sendiri, bukan seluruh isi Drive.) Login dengan akun Google tujuan, lalu salin blok token JSON
yang dicetak.

Di **VPS**:

```bash
rclone config create gdrive drive scope=drive.file token='<tempel JSON token dari PC>'
```

(Cara interaktif bila perlu: `rclone config` -> remote `gdrive`, tipe `drive`, scope `drive.file`,
"Use web browser to automatically authenticate?" = **n**, lalu tempel token.)

Cek: `rclone mkdir gdrive:sisupit-backup && rclone lsd gdrive:` -> folder `sisupit-backup` muncul.

### 3. Uji sekali

```bash
/root/backup-gdrive.sh
```

Yang harus terlihat: `dump: <ukuran> ...sql.gz`, `unggah selesai`, `selesai: db di Drive = 1 berkas`.
Unggahan pertama `storage/app` paling lama (semua foto); berikutnya hanya yang berubah.

### 4. Jadwal cron (02:30 WITA)

Zona waktu server dari langkah 1: bila `UTC` -> `30 18 * * *`; bila `Asia/Makassar` -> `30 2 * * *`.

```bash
echo '30 18 * * * root /root/backup-gdrive.sh >> /var/log/sisupit-backup.log 2>&1' > /etc/cron.d/sisupit-backup
chmod 644 /etc/cron.d/sisupit-backup
```

### Opsional

`/root/.sisupit-backup.conf` menimpa nilai bawaan skrip, mis.:

```bash
REMOTE_KEEP_DAYS=60
HEALTHCHECK_URL=https://hc-ping.com/<uuid>   # email bila cadangan tak datang / gagal
```

## Mengecek

```bash
tail -20 /var/log/sisupit-backup.log
rclone lsl gdrive:sisupit-backup/db/ | sort -k2,3 | tail -3
```

Tanpa `HEALTHCHECK_URL`, kegagalan hanya tercatat di log - tidak ada yang memberi tahu.

## Memulihkan

```bash
rclone copy gdrive:sisupit-backup/db/sisupit_db-<TS>.sql.gz /root/restore/
rclone copy gdrive:sisupit-backup/env/env-<TS> /root/restore/
# DB (timpa! cadangkan DB yang sekarang dulu bila masih ada isinya):
gunzip -c /root/restore/sisupit_db-<TS>.sql.gz | mysql -u sisupit_user -p sisupit_db
# Berkas unggahan:
rclone copy gdrive:sisupit-backup/storage/ /var/www/sisupit/storage/app/
chown -R www-data:www-data /var/www/sisupit/storage
```

`APP_KEY` di `.env` server harus SAMA dengan `env-<TS>`, kalau tidak kolom terenkripsi tak terbaca.
Berkas yang terhapus di server ada di `storage-deleted/<TS>/`.

## Batasan

- Token Google rclone bisa kedaluwarsa bila sandi akun Google diganti atau akses aplikasi dicabut ->
  log berisi `invalid_grant`; ulangi langkah 2.
- Kuota Drive gratis 15 GB: DB ~4 MB gzip/hari x 30 + foto. Pantau bila foto bertambah banyak.
- Hanya produksi; staging/dev tidak dicadangkan.

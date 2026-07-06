# Nominatim Self-Hosted (untuk VPS)

Setup ini menggantikan `https://nominatim.openstreetmap.org` di aplikasi SISUPIT dengan instance Nominatim milik sendiri, supaya tidak terikat kebijakan rate-limit/ToS instance publik. Aplikasi sudah disiapkan agar tinggal ganti satu env var (`NOMINATIM_BASE_URL`) tanpa perlu deploy ulang kode - lihat `app/Http/Controllers/Api/GeocodeController.php`.

## Quickstart: Bali-only di lokal (Windows + Docker Desktop)

Tahap awal aplikasi hanya beroperasi di **Bali**, jadi kita import Bali saja dulu (jauh lebih ringan & cepat daripada seluruh Indonesia). Import seluruh Indonesia adalah *next step* - lihat bagian di bawah.

Prasyarat: **Docker Desktop** terpasang dan sedang berjalan. File PBF Indonesia (`indonesia-260524.osm.pbf`) sudah ada di `C:\laragon\www\nominatim-sisupit\`.

1. **Ekstrak Bali** dari PBF Indonesia (hasil `data/bali.osm.pbf`, ~30-60 MB):
   ```powershell
   powershell -File docker\nominatim\extract-bali.ps1
   ```
   Skrip ini memakai `osmium extract` dengan bounding box Bali `114.40,-8.90,115.75,-8.03` (termasuk Nusa Penida, tanpa Lombok).
2. **Import & jalankan** (config sudah diarahkan ke `bali.osm.pbf` lewat `docker/nominatim/.env`):
   ```powershell
   cd docker\nominatim
   docker compose up -d
   docker compose logs -f      # pantau sampai import selesai (~10-20 menit)
   ```
3. **Verifikasi**:
   ```powershell
   curl "http://localhost:8080/status.php"
   curl "http://localhost:8080/search?q=Denpasar&format=json"
   ```
4. **Arahkan aplikasi** ke Nominatim lokal - ubah di `.env` Laravel lalu clear config:
   ```
   NOMINATIM_BASE_URL=http://127.0.0.1:8080
   ```
   ```powershell
   php artisan config:clear
   ```
   Tidak perlu deploy ulang kode - `GeocodeController` membaca base URL dari env ini.

> **Next step (seluruh Indonesia):** ganti `PBF_FILENAME` di `docker/nominatim/.env` ke file Indonesia, `docker compose down` lalu `up -d --force-recreate`. Kebutuhan resource & langkah VPS ada di bawah.

## Kebutuhan Resource (estimasi)

Untuk ekstrak **Indonesia** (file PBF sekitar 1-1.5 GB):

| Resource | Minimum   | Disarankan |
|----------|-----------|------------|
| RAM      | 4 GB      | 8 GB       |
| Disk     | 25 GB     | 50 GB SSD  |
| vCPU     | 2         | 4+         |
| Waktu import | 1-3 jam (tergantung disk/CPU) | - |

Jangan import ekstrak seluruh dunia/planet kecuali VPS punya RAM ≥ 64GB dan disk ≥ 1TB - tidak diperlukan untuk aplikasi yang hanya beroperasi di Indonesia.

## Langkah Setup di VPS

1. Install Docker & Docker Compose di VPS.
2. Upload folder `docker/nominatim/` ini ke VPS (atau `git pull` seluruh repo).
3. Download ekstrak OSM Indonesia (kalau belum ada di VPS) dari Geofabrik, contoh:
   ```bash
   cd docker/nominatim/data
   wget https://download.geofabrik.de/asia/indonesia-latest.osm.pbf
   ```
4. Copy `.env.example` jadi `.env` di folder `docker/nominatim/`, sesuaikan `PBF_FILENAME`, `NOMINATIM_PASSWORD`, dan `NOMINATIM_THREADS` (jumlah vCPU VPS).
5. Jalankan:
   ```bash
   cd docker/nominatim
   docker compose up -d
   ```
   Container otomatis melakukan import data OSM saat pertama kali start (proses ini yang memakan waktu 1-3 jam, pantau lewat `docker compose logs -f`).
6. Setelah import selesai, cek endpoint siap pakai:
   ```bash
   curl "http://localhost:8080/status.php"
   curl "http://localhost:8080/search?q=Denpasar&format=json"
   ```
7. Di server aplikasi Laravel, set environment variable berikut lalu restart aplikasi (tidak perlu deploy ulang kode):
   ```
   NOMINATIM_BASE_URL=http://<ip-vps>:8080
   ```
   Kalau Nominatim dan aplikasi Laravel berada di server/VPS yang sama, bisa pakai `http://127.0.0.1:8080` dan tutup port 8080 dari akses publik (firewall) supaya hanya aplikasi yang bisa memanggilnya.

## Update Data OSM (opsional, berkala)

Data OSM berubah dari waktu ke waktu (jalan baru, dll). Untuk refresh data tanpa import ulang dari nol, opsi paling sederhana adalah download ulang file PBF terbaru dan re-import:

```bash
docker compose down
# download ulang PBF terbaru ke data/, lalu:
docker compose up -d --force-recreate
```

Untuk update inkremental otomatis (replication), lihat dokumentasi resmi `mediagis/nominatim` - di luar cakupan setup awal ini.

## Catatan

- `FREEZE=true` di docker-compose ini mematikan kemampuan update data setelah import awal (lebih hemat disk). Hapus env ini kalau butuh update inkremental.
- Jangan expose port 8080 langsung ke internet tanpa proteksi tambahan (reverse proxy + rate limit) kalau VPS juga melayani trafik publik lain.

# OSRM Self-Hosted (routing rute jalan)

Setup ini menggantikan server demo publik `https://router.project-osrm.org` dengan instance **OSRM** (Open Source Routing Machine) milik sendiri, sumber geometri rute jalan pada peta pelacakan responder (`Front/Reports/Show.jsx`) dan command simulasi (`sisupit:simulate-responders`). Polanya sama persis dengan `docker/nominatim/`: aplikasi tinggal ganti satu env var (`OSRM_BASE_URL`) tanpa deploy ulang kode — lihat `app/Http/Controllers/Api/RouteController.php`.

## Quickstart: Bali-only di lokal (Windows + Docker Desktop)

Tahap awal aplikasi hanya beroperasi di **Bali**, jadi kita praproses data Bali saja. Setup ini **memakai ulang** `docker/nominatim/data/bali.osm.pbf` (hasil `extract-bali.ps1`) supaya tidak perlu ekstrak dua kali.

Prasyarat: **Docker Desktop** berjalan, dan `docker/nominatim/data/bali.osm.pbf` sudah ada (jalankan `docker\nominatim\extract-bali.ps1` bila belum).

1. **Praproses data** (extract → partition → customize; hasil `data/bali.osrm*`):
   ```powershell
   powershell -File docker\osrm\prepare-bali.ps1
   ```
   Langkah ini hanya perlu diulang saat data OSM berubah.
2. **Jalankan** (config sudah menunjuk `bali.osrm` lewat `docker/osrm/.env`):
   ```powershell
   cd docker\osrm
   docker compose up -d
   docker compose logs -f      # tunggu "running and waiting for requests"
   ```
3. **Verifikasi** (rute Denpasar, `code` harus `Ok`):
   ```powershell
   curl "http://localhost:5000/route/v1/driving/115.21,-8.67;115.24,-8.65?overview=false"
   ```
4. **Arahkan aplikasi** ke OSRM lokal — di `.env` Laravel lalu clear config:
   ```
   OSRM_BASE_URL=http://127.0.0.1:5000
   ```
   ```powershell
   php artisan config:clear
   ```
   Tidak perlu deploy ulang kode — `RouteController` membaca base URL dari env ini. Bila OSRM tak terjangkau, controller mengembalikan `route: null` dan frontend fallback ke garis lurus (tidak error).

> **Next step (seluruh Indonesia):** taruh `indonesia-latest.osm.pbf` di `docker/osrm/data/`, sesuaikan `$SrcPbf`/`$PbfName` di `prepare-bali.ps1` (atau jalankan pipeline manual di bawah), lalu set `OSRM_FILENAME=indonesia.osrm` di `.env`.

## Pipeline manual (untuk data selain Bali)

```bash
cd docker/osrm/data
IMG=osrm/osrm-backend:latest
docker run --rm -v "$PWD:/data" $IMG osrm-extract   -p /opt/car.lua /data/indonesia-latest.osm.pbf
docker run --rm -v "$PWD:/data" $IMG osrm-partition  /data/indonesia-latest.osrm
docker run --rm -v "$PWD:/data" $IMG osrm-customize  /data/indonesia-latest.osrm
```

## Kebutuhan Resource (estimasi)

| Data       | RAM extract | Disk hasil | Waktu praproses |
|------------|-------------|------------|-----------------|
| Bali       | < 1 GB      | ~100 MB    | 1–3 menit       |
| Indonesia  | 6–10 GB     | 8–15 GB    | 20–60 menit     |

RAM saat `osrm-routed` melayani request jauh lebih kecil dari saat praproses (MLD hemat memori). Untuk Indonesia, siapkan RAM ≥ 8 GB saat praproses.

## Langkah Setup di VPS

1. Install Docker & Docker Compose di VPS.
2. `git pull` repo (folder `docker/osrm/` ikut) atau upload folder ini.
3. Sediakan berkas OSM: salin `bali.osm.pbf` dari setup Nominatim, atau download `indonesia-latest.osm.pbf` dari Geofabrik ke `docker/osrm/data/`.
4. Copy `.env.example` → `.env`, set `OSRM_FILENAME` sesuai hasil praproses.
5. Praproses (sekali) lalu jalankan:
   ```bash
   cd docker/osrm/data && IMG=osrm/osrm-backend:latest
   docker run --rm -v "$PWD:/data" $IMG osrm-extract  -p /opt/car.lua /data/bali.osm.pbf
   docker run --rm -v "$PWD:/data" $IMG osrm-partition /data/bali.osrm
   docker run --rm -v "$PWD:/data" $IMG osrm-customize /data/bali.osrm
   cd .. && docker compose up -d
   ```
6. Di server Laravel, set env lalu restart (tanpa deploy ulang kode):
   ```
   OSRM_BASE_URL=http://<ip-vps>:5000
   ```
   Bila OSRM & Laravel di VPS yang sama, pakai `http://127.0.0.1:5000` dan tutup port 5000 dari publik (firewall) agar hanya aplikasi yang bisa memanggilnya.

## Catatan

- Profil default `car.lua` (mobil). Untuk kendaraan darurat, profil ini sudah memadai (mengikuti jaringan jalan yang bisa dilewati mobil).
- Algoritma **MLD** (`--algorithm mld`) dipilih karena hemat RAM & praproses cepat; harus konsisten antara `partition`/`customize` dan `osrm-routed`.
- Jangan expose port 5000 langsung ke internet tanpa proteksi (reverse proxy + rate limit) bila VPS juga melayani trafik publik lain.

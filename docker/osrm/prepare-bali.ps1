# Praproses data OSRM untuk BALI: ubah bali.osm.pbf menjadi berkas rute .osrm siap pakai
# lewat pipeline MLD (osrm-extract -> osrm-partition -> osrm-customize).
#
# Kenapa terpisah dari `docker compose up`: langkah ini hanya perlu dijalankan SEKALI setiap
# data OSM berubah. Setelah selesai, compose cukup menjalankan osrm-routed pada hasilnya.
#
# Sumber data: MEMAKAI ULANG docker/nominatim/data/bali.osm.pbf (hasil extract-bali.ps1) agar
# tidak perlu ekstrak ulang. Untuk NEXT STEP (seluruh Indonesia): taruh indonesia-*.osm.pbf di
# docker/osrm/data/, sesuaikan $SrcPbf & $PbfName di bawah + OSRM_FILENAME di .env.
#
# Prasyarat: Docker Desktop TERPASANG & BERJALAN, dan bali.osm.pbf sudah ada.
# Jalankan dari folder mana pun:
#   powershell -File docker\osrm\prepare-bali.ps1

$ErrorActionPreference = "Stop"

# --- Konfigurasi (ubah bila pakai data selain Bali) ---
$Profile  = "/opt/car.lua" # profil kendaraan (mobil) bawaan image OSRM
$Image    = "osrm/osrm-backend:latest"
$OutDir   = Join-Path $PSScriptRoot "data"
$PbfName  = "bali.osm.pbf"
$OsrmName = "bali.osrm"
# Sumber PBF: default pakai hasil ekstraksi Nominatim agar tidak dobel kerja.
$SrcPbf   = Join-Path $PSScriptRoot "..\nominatim\data\bali.osm.pbf"

# --- Validasi Docker ---
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker tidak ditemukan di PATH. Install & jalankan Docker Desktop dulu."
    exit 1
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker daemon tidak berjalan. Buka Docker Desktop lalu ulangi."
    exit 1
}

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

# --- Siapkan PBF di folder data OSRM (osrm-extract menulis output di sebelah PBF) ---
$destPbf = Join-Path $OutDir $PbfName
if (-not (Test-Path $destPbf)) {
    if (-not (Test-Path $SrcPbf)) {
        Write-Error "PBF Bali tidak ditemukan di $SrcPbf. Jalankan dulu: powershell -File docker\nominatim\extract-bali.ps1"
        exit 1
    }
    Write-Host "Menyalin $PbfName dari data Nominatim..." -ForegroundColor Cyan
    Copy-Item $SrcPbf $destPbf
}

Write-Host "Praproses OSRM (extract -> partition -> customize) untuk $PbfName..." -ForegroundColor Cyan
Write-Host "Butuh beberapa menit tergantung CPU. Image OSRM (~500 MB) diunduh sekali." -ForegroundColor Cyan

# 1) extract - bangun graf jalan dari PBF memakai profil mobil
docker run --rm -v "${OutDir}:/data" $Image osrm-extract -p $Profile "/data/$PbfName"
if ($LASTEXITCODE -ne 0) { Write-Error "osrm-extract gagal (lihat pesan di atas)."; exit 1 }

# 2) partition - bagi graf jadi sel (khusus algoritma MLD)
docker run --rm -v "${OutDir}:/data" $Image osrm-partition "/data/$OsrmName"
if ($LASTEXITCODE -ne 0) { Write-Error "osrm-partition gagal (lihat pesan di atas)."; exit 1 }

# 3) customize - hitung bobot rute (khusus algoritma MLD)
docker run --rm -v "${OutDir}:/data" $Image osrm-customize "/data/$OsrmName"
if ($LASTEXITCODE -ne 0) { Write-Error "osrm-customize gagal (lihat pesan di atas)."; exit 1 }

Write-Host ""
Write-Host "Selesai. Berkas rute siap: $OutDir\$OsrmName (+ file pendamping .osrm.*)." -ForegroundColor Green
Write-Host 'Lanjut: cd docker\osrm; docker compose up -d' -ForegroundColor Green
Write-Host 'Uji  : curl "http://localhost:5000/route/v1/driving/115.21,-8.67;115.24,-8.65?overview=false"' -ForegroundColor Green

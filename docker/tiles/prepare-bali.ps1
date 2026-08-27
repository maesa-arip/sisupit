# Siapkan data TileServer-GL untuk BALI: ubah bali.osm.pbf menjadi vector tiles (.mbtiles)
# lewat tilemaker, plus shapefile garis pantai & font yang dipakai menggambar tile raster.
#
# Kenapa terpisah dari `docker compose up`: langkah ini hanya perlu dijalankan SEKALI setiap
# data OSM berubah. Setelah selesai, compose cukup menyajikan hasilnya.
#
# Sumber data: MEMAKAI ULANG docker/nominatim/data/bali.osm.pbf (hasil extract-bali.ps1) agar
# tidak perlu ekstrak ulang — pola yang sama dengan docker/osrm/prepare-bali.ps1.
# Untuk NEXT STEP (seluruh Indonesia): taruh indonesia-*.osm.pbf di docker/tiles/data/,
# sesuaikan $PbfName/$MbtilesName/$Bbox di bawah + MBTILES_FILENAME di .env.
#
# Prasyarat: Docker Desktop TERPASANG & BERJALAN, dan bali.osm.pbf sudah ada.
# Jalankan dari folder mana pun:
#   powershell -File docker\tiles\prepare-bali.ps1

$ErrorActionPreference = "Stop"

# --- Konfigurasi (ubah bila pakai data selain Bali) ---
$Image       = "ghcr.io/systemed/tilemaker:master"
$OutDir      = Join-Path $PSScriptRoot "data"
$PbfName     = "bali.osm.pbf"
$MbtilesName = "bali.mbtiles"
# Bbox WAJIB diisi — tanpa itu tilemaker menolak jalan ("Can't read shapefiles unless a
# bounding box is provided").
#
# SENGAJA LEBIH LEBAR daripada docker\nominatim\extract-bali.ps1 (114.40,-8.90,115.75,-8.03):
# angka itu memeluk daratan Bali pas-pasan, sehingga di zoom jauh TEPI KOTAK bbox terlihat
# sebagai garis lurus di tengah laut. Margin di bawah menambah LAUT saja, bukan cakupan data —
# PBF-nya tetap Bali, jadi geocoding & rute tidak ikut melebar dan tetap sepadan dengan
# Nominatim/OSRM.
$Bbox        = "113.80,-9.40,116.30,-7.60"
# Sumber PBF: default pakai hasil ekstraksi Nominatim agar tidak dobel kerja.
$SrcPbf      = Join-Path $PSScriptRoot "..\nominatim\data\bali.osm.pbf"
# Garis pantai. WAJIB versi **4326**: shapefile ini dibaca tilemaker sebagai lintang/bujur
# apa adanya, jadi versi 3857 (meter) menghasilkan poligon laut sebesar dunia yang MENUTUPI
# daratan — petanya tetap terbentuk dan tetap HTTP 200, cuma seluruh Bali berwarna laut.
$CoastUrl    = "https://osmdata.openstreetmap.de/download/water-polygons-split-4326.zip"
# Natural Earth urban areas: bayangan halus kawasan terbangun di z4-8. Kecil & opsional,
# tapi tanpa itu zoom jauh terasa kosong.
$UrbanUrl    = "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_urban_areas.zip"
# Font untuk menggambar raster. Style-nya TIDAK diunduh: "Sisupit Light" ikut repo di
# docker\tiles\style\ dan dipasang langsung ke container lewat docker-compose.yml.
# Yang tetap harus diunduh cuma glyph-nya — image tileserver-gl tidak membawa font apa pun.
$FontsUrl    = "https://github.com/openmaptiles/fonts/releases/download/v2.0/noto-sans.zip"

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

# --- Siapkan PBF ---
$destPbf = Join-Path $OutDir $PbfName
if (-not (Test-Path $destPbf)) {
    if (-not (Test-Path $SrcPbf)) {
        Write-Error "PBF Bali tidak ditemukan di $SrcPbf. Jalankan dulu: powershell -File docker\nominatim\extract-bali.ps1"
        exit 1
    }
    Write-Host "Menyalin $PbfName dari data Nominatim..." -ForegroundColor Cyan
    Copy-Item $SrcPbf $destPbf
}

# --- 1) Shapefile garis pantai & kawasan terbangun ---
# Nama foldernya TIDAK boleh diubah: config-openmaptiles.json bawaan tilemaker merujuk
# "coastline/water_polygons.shp" dan "landcover/..." secara RELATIF, dan container dijalankan
# dengan -w /data di bawah. Menaruhnya di tempat lain menuntut menyunting config bawaan.
$CoastDir = Join-Path $OutDir "coastline"
if (-not (Test-Path (Join-Path $CoastDir "water_polygons.shp"))) {
    Write-Host "Mengunduh garis pantai (~900 MB, sekali saja)..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $CoastDir -Force | Out-Null
    $zip = Join-Path $env:TEMP "water-polygons-4326.zip"
    Invoke-WebRequest -Uri $CoastUrl -OutFile $zip
    $tmp = Join-Path $env:TEMP "water-polygons-4326"
    Expand-Archive -Path $zip -DestinationPath $tmp -Force
    Get-ChildItem -Path $tmp -Recurse -Filter "water_polygons.*" | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $CoastDir $_.Name) -Force
    }
    Remove-Item $zip; Remove-Item $tmp -Recurse -Force
}
if (-not (Test-Path (Join-Path $CoastDir "water_polygons.shp"))) {
    Write-Error "Garis pantai tidak terpasang — laut akan sewarna daratan dan pulau tak berbentuk."
    exit 1
}

$UrbanDir = Join-Path $OutDir "landcover\ne_10m_urban_areas"
if (-not (Test-Path (Join-Path $UrbanDir "ne_10m_urban_areas.shp"))) {
    Write-Host "Mengunduh Natural Earth urban areas..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $UrbanDir -Force | Out-Null
    $zip = Join-Path $env:TEMP "ne_10m_urban_areas.zip"
    Invoke-WebRequest -Uri $UrbanUrl -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath $UrbanDir -Force
    Remove-Item $zip
}

# --- 2) Bangun vector tiles dari PBF ---
# Dua shapefile lain yang dirujuk config (gletser & es Antartika) SENGAJA tidak diunduh;
# tilemaker cuma mencetak "Unable to open ..." lalu lanjut, dan Bali memang tak punya keduanya.
Write-Host "Membangun $MbtilesName dengan tilemaker (skema OpenMapTiles, z0-14)..." -ForegroundColor Cyan
Write-Host "Butuh beberapa menit tergantung CPU. Image tilemaker (~250 MB) diunduh sekali." -ForegroundColor Cyan
docker run --rm -w /data -v "${OutDir}:/data" $Image `
    "/data/$PbfName" "/data/$MbtilesName" `
    --bbox $Bbox `
    --config /usr/src/app/resources/config-openmaptiles.json `
    --process /usr/src/app/resources/process-openmaptiles.lua
if ($LASTEXITCODE -ne 0) { Write-Error "tilemaker gagal (lihat pesan di atas)."; exit 1 }
if (-not (Test-Path (Join-Path $OutDir $MbtilesName))) {
    Write-Error "tilemaker selesai tapi $MbtilesName tidak terbentuk — periksa pesan di atas (bbox?)."
    exit 1
}

# --- 3) Tileset LATAR sedunia (z0-8) ---
# Supaya saat peta di-zoom keluar dari Bali layarnya tidak kosong melompong. Isinya CUMA
# siluet daratan/laut: tanpa jalan, tanpa nama tempat, tanpa POI — bukan peta yang bisa
# dipakai bekerja. PBF di bawah ikut dilewatkan hanya karena tilemaker mewajibkan argumen
# input; process-coastline.lua mengabaikan seluruh isinya (node_function & way_function
# memang kosong), jadi TIDAK ada satu pun data OSM yang masuk ke berkas ini.
#
# ~20 menit sekali seumur hidup data. Hasilnya ~30 MB dan berlaku untuk environment mana pun,
# jadi ke server SALIN saja berkasnya, jangan bangun ulang di sana.
$WorldMbtiles = Join-Path $OutDir "world.mbtiles"
$WorldConfig  = Join-Path $PSScriptRoot "config-world.json"
if (-not (Test-Path $WorldMbtiles)) {
    Write-Host "Membangun world.mbtiles (latar sedunia z0-8, ~20 menit)..." -ForegroundColor Cyan
    docker run --rm -w /data -v "${OutDir}:/data" -v "${WorldConfig}:/data/config-world.json:ro" $Image `
        "/data/$PbfName" "/data/world.mbtiles" `
        --bbox -180,-85,180,85 `
        --config /data/config-world.json `
        --process /usr/src/app/resources/process-coastline.lua
    if (-not (Test-Path $WorldMbtiles)) {
        Write-Error "world.mbtiles tidak terbentuk — zoom keluar akan kosong. Periksa pesan di atas."
        exit 1
    }
}

# --- 4) Folder style ---
# Isinya sendiri datang dari repo lewat bind mount (lihat docker-compose.yml); yang perlu ada
# di sini cuma foldernya, supaya Docker tidak membuatnya sebagai milik root.
$StylesDir = Join-Path $OutDir "styles"
if (-not (Test-Path $StylesDir)) { New-Item -ItemType Directory -Path $StylesDir -Force | Out-Null }

# --- 5) Font (glyph) ---
# TANPA ini tile tetap tergambar TAPI tanpa satu pun nama jalan/desa, dan tileserver TIDAK
# melaporkan galat apa pun — gejalanya cuma peta bisu. Lihat FINDINGS #92.
$FontsDir = Join-Path $OutDir "fonts"
if (-not (Test-Path (Join-Path $FontsDir "Noto Sans Regular"))) {
    Write-Host "Mengunduh font Noto Sans (Regular/Bold/Italic)..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $FontsDir -Force | Out-Null
    $zip = Join-Path $env:TEMP "noto-sans.zip"
    Invoke-WebRequest -Uri $FontsUrl -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath $FontsDir -Force
    Remove-Item $zip
}

Write-Host ""
Write-Host "Selesai. Data siap di $OutDir (mbtiles + world.mbtiles + coastline + fonts; style dari repo)." -ForegroundColor Green
Write-Host 'Lanjut: cd docker\tiles; docker compose up -d' -ForegroundColor Green
Write-Host 'Uji  : curl "http://localhost:8081/styles/sisupit/13/6717/4293.png" -o tile.png' -ForegroundColor Green
Write-Host 'Uji pulau (laut harus BIRU, bukan sewarna darat):' -ForegroundColor Green
Write-Host '       curl "http://localhost:8081/styles/sisupit/static/115.19,-8.42,9/700x460.png" -o pulau.png' -ForegroundColor Green
